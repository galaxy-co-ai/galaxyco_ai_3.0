import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { knowledgeItems } from '@/db/schema';
import { getOpenAI } from '@/lib/ai-providers';
import { queryVectors } from '@/lib/vector';
import { rateLimit } from '@/lib/rate-limit';
import { eq, and, or, like, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';

const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(500, 'Query too long'),
  limit: z.number().int().min(1).max(50).optional().default(10),
  collectionId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    // Rate limit search
    const rateLimitResult = await rateLimit(
      `search:${userId}`,
      30, // 30 searches
      60 // per minute
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Search rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = searchSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { query, limit, collectionId } = validationResult.data;

    // Perform hybrid search: vector + keyword

    // 1. Vector similarity search
    const openai = getOpenAI();
    let vectorResults: any[] = [];

    try {
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: query,
      });

      const queryVector = embeddingResponse.data[0].embedding;

      // Search vector database
      const similarChunks = await queryVectors(
        queryVector,
        {
          topK: limit * 2, // Get more results for merging
          filter: collectionId
            ? { collectionId, workspaceId }
            : { workspaceId },
          includeMetadata: true,
        }
      );

      // Group chunks by item and get top results
      const itemScores = new Map<string, number>();
      const itemMetadata = new Map<string, any>();

      for (const chunk of similarChunks) {
        const itemId = chunk.metadata?.itemId;
        if (itemId) {
          const currentScore = itemScores.get(itemId) || 0;
          if (chunk.score && chunk.score > currentScore) {
            itemScores.set(itemId, chunk.score);
            itemMetadata.set(itemId, chunk.metadata);
          }
        }
      }

      // Get top items by score
      vectorResults = Array.from(itemScores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([itemId, score]) => ({
          itemId,
          score,
          metadata: itemMetadata.get(itemId),
        }));
    } catch (error) {
      logger.error('Vector search failed', error);
      // Continue with keyword search
    }

    // 2. Keyword search in database
    const whereConditions = [eq(knowledgeItems.workspaceId, workspaceId)];
    
    if (collectionId) {
      whereConditions.push(eq(knowledgeItems.collectionId, collectionId));
    }

    // Add text search conditions
    const searchPattern = `%${query}%`;
    whereConditions.push(
      or(
        like(knowledgeItems.title, searchPattern),
        like(knowledgeItems.content, searchPattern),
        like(knowledgeItems.summary, searchPattern)
      )!
    );

    const keywordResults = await db.query.knowledgeItems.findMany({
      where: and(...whereConditions),
      orderBy: [desc(knowledgeItems.createdAt)],
      limit,
      with: {
        collection: {
          columns: {
            name: true,
            color: true,
          },
        },
      },
    });

    // 3. Merge and rank results
    const mergedResults = new Map<string, any>();

    // Add vector results with high weight
    for (const result of vectorResults) {
      const item = await db.query.knowledgeItems.findFirst({
        where: eq(knowledgeItems.id, result.itemId),
        with: {
          collection: {
            columns: {
              name: true,
              color: true,
            },
          },
        },
      });

      if (item) {
        mergedResults.set(item.id, {
          ...item,
          score: result.score * 10, // Boost vector score
          matchType: 'semantic',
        });
      }
    }

    // Add keyword results
    for (const item of keywordResults) {
      if (!mergedResults.has(item.id)) {
        mergedResults.set(item.id, {
          ...item,
          score: 5, // Base keyword score
          matchType: 'keyword',
        });
      } else {
        // Boost existing result if it also matches keywords
        const existing = mergedResults.get(item.id);
        existing.score += 5;
        existing.matchType = 'hybrid';
      }
    }

    // Sort by score and format results
    const finalResults = Array.from(mergedResults.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        summary: item.summary,
        content: item.content?.substring(0, 300) + '...',
        url: item.url,
        collection: item.collection?.name || 'Uncategorized',
        collectionColor: item.collection?.color,
        createdAt: item.createdAt,
        score: item.score,
        matchType: item.matchType,
      }));

    return NextResponse.json({
      query,
      results: finalResults,
      count: finalResults.length,
      hasMore: mergedResults.size > limit,
    });
  } catch (error) {
    return createErrorResponse(error, 'Knowledge search error');
  }
}






