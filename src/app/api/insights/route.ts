/**
 * Proactive Insights API
 * 
 * GET /api/insights - Fetch active insights for the workspace
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { proactiveInsights } from '@/db/schema';
import { and, eq, gte, sql, or, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

export async function GET(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return createErrorResponse(new Error('Unauthorized'), 'Fetch insights');
    }

    const workspaceId = (sessionClaims?.metadata as { workspaceId?: string })?.workspaceId;
    if (!workspaceId) {
      return createErrorResponse(new Error('Workspace access forbidden'), 'Fetch insights');
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category'); // Filter by category
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get active insights (non-dismissed, not expired, created in last 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const conditions = [
      eq(proactiveInsights.workspaceId, workspaceId),
      gte(proactiveInsights.createdAt, sevenDaysAgo),
      sql`${proactiveInsights.dismissedAt} IS NULL`,
      or(
        sql`${proactiveInsights.expiresAt} IS NULL`,
        sql`${proactiveInsights.expiresAt} > NOW()`
      )!,
    ];

    if (category) {
      conditions.push(eq(proactiveInsights.category, category));
    }

    const insights = await db.query.proactiveInsights.findMany({
      where: and(...conditions),
      orderBy: [desc(proactiveInsights.priority), desc(proactiveInsights.createdAt)],
      limit,
    });

    return NextResponse.json({
      success: true,
      insights: insights.map(i => ({
        id: i.id,
        type: i.type,
        category: i.category,
        title: i.title,
        description: i.description,
        priority: i.priority,
        suggestedActions: i.suggestedActions || [],
        autoExecutable: i.autoExecutable,
        createdAt: i.createdAt,
      })),
      count: insights.length,
    });

  } catch (error) {
    return createErrorResponse(error, 'Fetch insights');
  }
}
