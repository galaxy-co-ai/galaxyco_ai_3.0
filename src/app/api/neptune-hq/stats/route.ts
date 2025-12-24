import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { neptuneConversations, neptuneMessages, workspaceMembers } from '@/db/schema';
import { eq, count, avg, and, gte, sql } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/neptune-hq/stats
 * Returns aggregate stats from Neptune conversations and messages
 */
export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // Current stats
    const [conversationCount] = await db
      .select({ count: count() })
      .from(neptuneConversations)
      .where(eq(neptuneConversations.workspaceId, workspaceId));

    const [messageCount] = await db
      .select({ count: count() })
      .from(neptuneMessages)
      .where(eq(neptuneMessages.workspaceId, workspaceId));

    const [avgResponse] = await db
      .select({ avg: avg(neptuneMessages.responseTime) })
      .from(neptuneMessages)
      .where(eq(neptuneMessages.workspaceId, workspaceId));

    // Count unique active users (users who sent messages this week)
    const [activeUsersResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${neptuneMessages.userId})` })
      .from(neptuneMessages)
      .where(
        and(
          eq(neptuneMessages.workspaceId, workspaceId),
          gte(neptuneMessages.createdAt, oneWeekAgo)
        )
      );

    // Calculate trends - current week vs previous week
    const [currentWeekConvs] = await db
      .select({ count: count() })
      .from(neptuneConversations)
      .where(
        and(
          eq(neptuneConversations.workspaceId, workspaceId),
          gte(neptuneConversations.createdAt, oneWeekAgo)
        )
      );

    const [previousWeekConvs] = await db
      .select({ count: count() })
      .from(neptuneConversations)
      .where(
        and(
          eq(neptuneConversations.workspaceId, workspaceId),
          gte(neptuneConversations.createdAt, twoWeeksAgo),
          sql`${neptuneConversations.createdAt} < ${oneWeekAgo}`
        )
      );

    const [currentWeekMsgs] = await db
      .select({ count: count() })
      .from(neptuneMessages)
      .where(
        and(
          eq(neptuneMessages.workspaceId, workspaceId),
          gte(neptuneMessages.createdAt, oneWeekAgo)
        )
      );

    const [previousWeekMsgs] = await db
      .select({ count: count() })
      .from(neptuneMessages)
      .where(
        and(
          eq(neptuneMessages.workspaceId, workspaceId),
          gte(neptuneMessages.createdAt, twoWeeksAgo),
          sql`${neptuneMessages.createdAt} < ${oneWeekAgo}`
        )
      );

    // Response time trends
    const [currentWeekAvgTime] = await db
      .select({ avg: avg(neptuneMessages.responseTime) })
      .from(neptuneMessages)
      .where(
        and(
          eq(neptuneMessages.workspaceId, workspaceId),
          gte(neptuneMessages.createdAt, oneWeekAgo)
        )
      );

    const [previousWeekAvgTime] = await db
      .select({ avg: avg(neptuneMessages.responseTime) })
      .from(neptuneMessages)
      .where(
        and(
          eq(neptuneMessages.workspaceId, workspaceId),
          gte(neptuneMessages.createdAt, twoWeeksAgo),
          sql`${neptuneMessages.createdAt} < ${oneWeekAgo}`
        )
      );

    // Calculate percentage trends
    const calcTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const currentConvs = Number(currentWeekConvs?.count || 0);
    const prevConvs = Number(previousWeekConvs?.count || 0);
    const currentMsgs = Number(currentWeekMsgs?.count || 0);
    const prevMsgs = Number(previousWeekMsgs?.count || 0);
    const currentAvgTime = Number(currentWeekAvgTime?.avg || 0);
    const prevAvgTime = Number(previousWeekAvgTime?.avg || 0);

    return NextResponse.json({
      totalConversations: Number(conversationCount?.count || 0),
      totalMessages: Number(messageCount?.count || 0),
      avgResponseTime: Math.round(Number(avgResponse?.avg || 0)),
      activeUsers: Number(activeUsersResult?.count || 0),
      trends: {
        conversations: calcTrend(currentConvs, prevConvs),
        messages: calcTrend(currentMsgs, prevMsgs),
        responseTime: -calcTrend(currentAvgTime, prevAvgTime), // Negative for improvement
        users: 0, // Would need historical user data to calculate
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Stats error');
  }
}
