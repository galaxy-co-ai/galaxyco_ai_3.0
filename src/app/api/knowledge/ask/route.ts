import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { knowledgeItems } from '@/db/schema';
import { searchKnowledge, isVectorConfigured } from '@/lib/vector';
import { getOpenAI } from '@/lib/ai-providers';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { eq, and, or, inArray } from 'drizzle-orm';

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const askSchema = z.object({
  question: z.string().min(1, 'Question is required').max(2000, 'Question too long'),
  documentIds: z.array(z.string().uuid()).optional(),
  collectionId: z.string().uuid().optional(),
  stream: z.boolean().optional().default(true),
});

// ============================================================================
// RAG Q&A ENDPOINT
// ============================================================================

export async function POST(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    // Rate limit - 30 questions per minute
    const rateLimitResult = await rateLimit(`knowledge:ask:${userId}`, 30, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = askSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { question, documentIds, collectionId, stream } = validationResult.data;

    logger.info('[Knowledge Q&A] Processing question', {
      workspaceId,
      userId,
      questionLength: question.length,
      documentIds: documentIds?.length || 0,
      collectionId,
    });

    // ========================================================================
    // STEP 1: Retrieve relevant context from knowledge base
    // ========================================================================

    interface RetrievedContext {
      itemId: string;
      title: string;
      chunk: string;
      score: number;
      chunkIndex: number;
    }

    let retrievedContext: RetrievedContext[] = [];
    let contextSource = 'none';

    // If specific documents are provided, use them directly
    if (documentIds && documentIds.length > 0) {
      const documents = await db.query.knowledgeItems.findMany({
        where: and(
          eq(knowledgeItems.workspaceId, workspaceId),
          inArray(knowledgeItems.id, documentIds)
        ),
      });

      retrievedContext = documents.map((doc) => ({
        itemId: doc.id,
        title: doc.title,
        chunk: doc.content || doc.summary || '',
        score: 1.0,
        chunkIndex: 0,
      }));
      contextSource = 'specific_documents';
    }
    // Otherwise, use vector search for semantic retrieval
    else if (isVectorConfigured()) {
      const searchResults = await searchKnowledge(workspaceId, question, {
        topK: 5,
        minScore: 0.4,
        type: collectionId ? undefined : undefined, // Could filter by collection type
      });

      retrievedContext = searchResults.results;
      contextSource = 'vector_search';

      // If filtering by collection, filter results
      if (collectionId && retrievedContext.length > 0) {
        const itemIds = retrievedContext.map((r) => r.itemId);
        const itemsWithCollection = await db.query.knowledgeItems.findMany({
          where: and(
            eq(knowledgeItems.workspaceId, workspaceId),
            eq(knowledgeItems.collectionId, collectionId),
            inArray(knowledgeItems.id, itemIds)
          ),
          columns: { id: true },
        });
        const validIds = new Set(itemsWithCollection.map((i) => i.id));
        retrievedContext = retrievedContext.filter((r) => validIds.has(r.itemId));
      }
    }
    // Fallback: keyword search in database
    else {
      const searchPattern = `%${question.split(' ').slice(0, 5).join('%')}%`;
      const items = await db.query.knowledgeItems.findMany({
        where: and(
          eq(knowledgeItems.workspaceId, workspaceId),
          or(
            eq(knowledgeItems.title, question),
            eq(knowledgeItems.content, question)
          )
        ),
        limit: 5,
      });

      retrievedContext = items.map((item) => ({
        itemId: item.id,
        title: item.title,
        chunk: item.content?.substring(0, 1000) || item.summary || '',
        score: 0.5,
        chunkIndex: 0,
      }));
      contextSource = 'keyword_search';
    }

    logger.info('[Knowledge Q&A] Retrieved context', {
      source: contextSource,
      resultsCount: retrievedContext.length,
      scores: retrievedContext.map((r) => r.score.toFixed(2)),
    });

    // ========================================================================
    // STEP 2: Build system prompt with RAG context
    // ========================================================================

    const contextText = retrievedContext.length > 0
      ? retrievedContext
          .map((r, i) => `[Source ${i + 1}: "${r.title}"]\n${r.chunk}`)
          .join('\n\n---\n\n')
      : '';

    const systemPrompt = `You are a knowledgeable assistant for GalaxyCo.ai. Your role is to answer questions based on the company's knowledge base.

INSTRUCTIONS:
1. Answer the question using ONLY the information from the provided context below.
2. If the context doesn't contain relevant information, say "I don't have enough information in the knowledge base to answer this question."
3. Be concise and direct. Use bullet points for complex answers.
4. Always cite your sources by referencing [Source N] when you use information from that source.
5. If multiple sources support the same point, mention all relevant sources.

${contextText ? `KNOWLEDGE BASE CONTEXT:\n\n${contextText}\n\n---\n\n` : 'No relevant context found in the knowledge base.\n\n'}

USER'S QUESTION: ${question}

Remember: Only answer based on the provided context. Do not make up information.`;

    // ========================================================================
    // STEP 3: Generate response (streaming or non-streaming)
    // ========================================================================

    const openai = getOpenAI();

    // Prepare source citations for response
    const sources = retrievedContext.map((r, i) => ({
      index: i + 1,
      id: r.itemId,
      title: r.title,
      score: r.score,
    }));

    if (stream) {
      // Streaming response
      const encoder = new TextEncoder();

      const openaiStream = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        stream: true,
        temperature: 0.3, // Lower temperature for factual responses
        max_tokens: 1000,
      });

      let fullResponse = '';

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            // Send sources first
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ sources, contextSource })}\n\n`
              )
            );

            for await (const chunk of openaiStream) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                fullResponse += content;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                );
              }
            }

            // Send completion
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ done: true, fullResponse })}\n\n`
              )
            );
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();

            logger.info('[Knowledge Q&A] Completed streaming response', {
              responseLength: fullResponse.length,
              sourcesUsed: sources.length,
            });
          } catch (error) {
            logger.error('[Knowledge Q&A] Stream error', error);
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ error: 'Failed to generate response' })}\n\n`
              )
            );
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const answer = completion.choices[0]?.message?.content || 'Unable to generate response.';

      logger.info('[Knowledge Q&A] Completed non-streaming response', {
        responseLength: answer.length,
        sourcesUsed: sources.length,
      });

      return NextResponse.json({
        answer,
        sources,
        contextSource,
        tokensUsed: completion.usage?.total_tokens || 0,
      });
    }
  } catch (error) {
    logger.error('[Knowledge Q&A] Error', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'AI service not configured' },
          { status: 503 }
        );
      }
      if (error.message.includes('not authenticated')) {
        return NextResponse.json(
          { error: 'Please sign in to use this feature' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    );
  }
}
