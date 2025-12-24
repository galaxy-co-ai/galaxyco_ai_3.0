import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { neptuneConversations } from '@/db/schema';
import { eq, count, sql, and, gte, isNotNull } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/neptune-hq/topics
 * Returns topic analysis from Neptune conversations
 */
export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // Get current week topic counts
    const currentWeekTopics = await db
      .select({
        topic: neptuneConversations.topic,
        count: count(),
      })
      .from(neptuneConversations)
      .where(
        and(
          eq(neptuneConversations.workspaceId, workspaceId),
          isNotNull(neptuneConversations.topic),
          gte(neptuneConversations.createdAt, oneWeekAgo)
        )
      )
      .groupBy(neptuneConversations.topic)
      .orderBy(sql`count(*) DESC`)
      .limit(10);

    // Get previous week topic counts for trend calculation
    const previousWeekTopics = await db
      .select({
        topic: neptuneConversations.topic,
        count: count(),
      })
      .from(neptuneConversations)
      .where(
        and(
          eq(neptuneConversations.workspaceId, workspaceId),
          isNotNull(neptuneConversations.topic),
          gte(neptuneConversations.createdAt, twoWeeksAgo),
          sql`${neptuneConversations.createdAt} < ${oneWeekAgo}`
        )
      )
      .groupBy(neptuneConversations.topic);

    const prevTopicCounts = new Map(previousWeekTopics.map(t => [t.topic, Number(t.count)]));

    // Calculate trends and format response
    const topics = currentWeekTopics
      .filter(t => t.topic) // Filter out null topics
      .map(t => {
        const currentCount = Number(t.count);
        const prevCount = prevTopicCounts.get(t.topic!) || 0;
        const trend = prevCount > 0 
          ? Math.round(((currentCount - prevCount) / prevCount) * 100)
          : currentCount > 0 ? 100 : 0;

        return {
          name: t.topic!,
          count: currentCount,
          trend,
        };
      });

    // If no topics found, return some default categories
    if (topics.length === 0) {
      return NextResponse.json({
        topics: [
          { name: 'General', count: 0, trend: 0 },
          { name: 'Technical', count: 0, trend: 0 },
          { name: 'Business', count: 0, trend: 0 },
        ],
      });
    }

    return NextResponse.json({ topics });
  } catch (error) {
    return createErrorResponse(error, 'Topics error');
  }
}
