/**
 * Creator Stats API
 * 
 * GET /api/creator/stats - Get stats for the Creator page header
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { creatorItems, creatorCollections, creatorTemplates } from '@/db/schema';
import { eq, sql, count } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Get total creations count
    const itemsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(creatorItems)
      .where(eq(creatorItems.workspaceId, workspaceId));
    
    const totalCreations = itemsResult[0]?.count || 0;

    // Get user collections count (not auto)
    const collectionsResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(creatorCollections)
      .where(eq(creatorCollections.workspaceId, workspaceId));
    
    const collectionsCount = collectionsResult[0]?.count || 0;

    // Get templates count (global templates available to all)
    const templatesResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(creatorTemplates);
    
    const templatesCount = templatesResult[0]?.count || 0;

    // Get breakdown by type
    const typeBreakdown = await db
      .select({
        type: creatorItems.type,
        count: count(creatorItems.id),
      })
      .from(creatorItems)
      .where(eq(creatorItems.workspaceId, workspaceId))
      .groupBy(creatorItems.type);

    const byType = typeBreakdown.reduce((acc, row) => {
      acc[row.type] = Number(row.count);
      return acc;
    }, {} as Record<string, number>);

    // Get starred count
    const starredResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(creatorItems)
      .where(eq(creatorItems.starred, true));
    
    const starredCount = starredResult[0]?.count || 0;

    return NextResponse.json({
      stats: {
        totalCreations,
        collections: collectionsCount,
        templates: templatesCount,
        starred: starredCount,
        byType,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Creator Stats GET error');
  }
}
