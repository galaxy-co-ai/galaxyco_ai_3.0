import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { knowledgeItems } from '@/db/schema';
import { searchKnowledge, isVectorConfigured } from '@/lib/vector';
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

    // 1. Vector similarity search using new helper with namespace isolation
    let vectorResults: Array<{ itemId: string; score: number; chunk: string }> = [];

    if (isVectorConfigured()) {
      try {
        const semanticResults = await searchKnowledge(
          workspaceId,
          query,
          { topK: limit * 2, minScore: 0.4 }
        );

        vectorResults = semanticResults.results.map((r) => ({
          itemId: r.itemId,
          score: r.score,
          chunk: r.chunk,
        }));
      } catch (error) {
        logger.error('Vector search failed', error);
        // Continue with keyword search
      }
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
    const mergedResults = new Map<string, {
      id: string;
      title: string;
      type: string;
      summary: string | null;
      content: string | null;
      url: string | null;
      collection: { name: string; color: string | null } | null;
      createdAt: Date;
      score: number;
      matchType: string;
      relevantChunk?: string;
    }>();

    // Add vector results with high weight
    if (vectorResults.length > 0) {
      const vectorItemIds = vectorResults.map((r) => r.itemId);
      const vectorItems = await db.query.knowledgeItems.findMany({
        where: and(
          eq(knowledgeItems.workspaceId, workspaceId),
          or(...vectorItemIds.map((id) => eq(knowledgeItems.id, id)))
        ),
        with: {
          collection: {
            columns: {
              name: true,
              color: true,
            },
          },
        },
      });

      for (const result of vectorResults) {
        const item = vectorItems.find((i) => i.id === result.itemId);
        if (item) {
          // Normalize collection which may be object or array
          const collection = Array.isArray(item.collection) ? item.collection[0] : item.collection;
          mergedResults.set(item.id, {
            id: item.id,
            title: item.title,
            type: item.type,
            summary: item.summary,
            content: item.content,
            url: item.sourceUrl,
            collection: collection ? { name: collection.name, color: collection.color } : null,
            createdAt: item.createdAt,
            score: result.score * 10, // Boost vector score
            matchType: 'semantic',
            relevantChunk: result.chunk,
          });
        }
      }
    }

    // Add keyword results
    for (const item of keywordResults) {
      if (!mergedResults.has(item.id)) {
        // Normalize collection which may be object or array
        const collection = Array.isArray(item.collection) ? item.collection[0] : item.collection;
        mergedResults.set(item.id, {
          id: item.id,
          title: item.title,
          type: item.type,
          summary: item.summary,
          content: item.content,
          url: item.sourceUrl,
          collection: collection ? { name: collection.name, color: collection.color } : null,
          createdAt: item.createdAt,
          score: 5, // Base keyword score
          matchType: 'keyword',
        });
      } else {
        // Boost existing result if it also matches keywords
        const existing = mergedResults.get(item.id);
        if (existing) {
          existing.score += 5;
          existing.matchType = 'hybrid';
        }
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
        content: item.content ? item.content.substring(0, 300) + '...' : '',
        relevantChunk: item.relevantChunk,
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






