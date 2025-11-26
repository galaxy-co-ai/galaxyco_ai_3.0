import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { knowledgeItems, knowledgeCollections } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { uploadFile } from '@/lib/storage';
import { getOpenAI } from '@/lib/ai-providers';
import { upsertVectors } from '@/lib/vector';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';

// Helper to extract text from files
async function extractText(file: File): Promise<string> {
  const fileType = file.type;
  const content = await file.text();

  // For now, handle text-based files directly
  if (
    fileType === 'text/plain' ||
    fileType === 'text/markdown' ||
    fileType === 'application/json'
  ) {
    return content;
  }

  // For PDF/DOCX, we'd need additional libraries
  // For MVP, return a message
  if (fileType === 'application/pdf') {
    return '[PDF content - text extraction requires additional setup]';
  }

  if (
    fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return '[DOCX content - text extraction requires additional setup]';
  }

  return content;
}

// Chunk text for vector embedding
function chunkText(text: string, chunkSize: number = 500): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((chunk) => chunk.length > 0);
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    // Rate limit uploads
    const rateLimitResult = await rateLimit(
      `upload:${user.id}`,
      10, // 10 uploads
      3600 // per hour
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Upload rate limit exceeded' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const collectionId = formData.get('collectionId') as string | null;
    const title = formData.get('title') as string | null;

    // Validate input
    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type (basic check)
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'application/json',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not supported' },
        { status: 400 }
      );
    }

    // Validate collectionId if provided
    if (collectionId) {
      const collection = await db.query.knowledgeCollections.findFirst({
        where: and(
          eq(knowledgeCollections.id, collectionId),
          eq(knowledgeCollections.workspaceId, workspaceId)
        ),
      });

      if (!collection) {
        return NextResponse.json(
          { error: 'Collection not found' },
          { status: 404 }
        );
      }
    }

    // Upload to Vercel Blob
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const pathname = `${workspaceId}/knowledge/${timestamp}-${safeName}`;
    
    const { url: fileUrl } = await uploadFile(file, pathname);

    // Extract text content
    const content = await extractText(file);
    
    // Generate summary using OpenAI
    const openai = getOpenAI();
    let summary = '';
    
    try {
      const summaryResponse = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a document summarizer. Provide a concise 2-3 sentence summary of the document.',
          },
          {
            role: 'user',
            content: `Summarize this document:\n\n${content.substring(0, 3000)}`,
          },
        ],
        max_tokens: 150,
        temperature: 0.3,
      });

      summary = summaryResponse.choices[0]?.message?.content || 'AI-generated summary';
    } catch (error) {
      logger.error('Summary generation failed', error);
      summary = 'Summary generation failed';
    }

    // Create knowledge item
    const [item] = await db
      .insert(knowledgeItems)
      .values({
        workspaceId,
        createdBy: user.id,
        collectionId: collectionId || null,
        title: title || file.name,
        type: file.type.startsWith('image/') ? 'image' as const : 'document' as const,
        content,
        summary,
        sourceUrl: fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        metadata: {
          extractedAt: new Date().toISOString(),
        },
      })
      .returning();

    // Generate embeddings and store in vector database
    try {
      const chunks = chunkText(content, 500);
      const embeddings: number[][] = [];

      // Generate embeddings for each chunk
      for (const chunk of chunks.slice(0, 20)) { // Limit to 20 chunks for cost
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: chunk,
        });

        embeddings.push(embeddingResponse.data[0].embedding);
      }

      // Store in vector database
      const vectors = embeddings.map((embedding, index) => ({
        id: `${item.id}_chunk_${index}`,
        values: embedding,
        metadata: {
          itemId: item.id,
          workspaceId,
          title: item.title,
          chunk: chunks[index],
          chunkIndex: index,
        },
      }));

      await upsertVectors(vectors);
    } catch (error) {
      logger.error('Vector embedding failed', error);
      // Don't fail the upload if embedding fails
    }

    // Update collection item count if applicable
    if (collectionId) {
      const collection = await db.query.knowledgeCollections.findFirst({
        where: and(
          eq(knowledgeCollections.id, collectionId),
          eq(knowledgeCollections.workspaceId, workspaceId)
        ),
      });

      if (collection) {
        await db
          .update(knowledgeCollections)
          .set({
            itemCount: collection.itemCount + 1,
          })
          .where(eq(knowledgeCollections.id, collectionId));
      }
    }

    return NextResponse.json({
      id: item.id,
      title: item.title,
      type: item.type,
      url: item.sourceUrl,
      summary: item.summary,
      fileSize: item.fileSize,
      createdAt: item.createdAt,
    });
  } catch (error) {
    return createErrorResponse(error, 'Knowledge upload error');
  }
}






