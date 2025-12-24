import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { neptuneFeedback } from '@/db/schema';
import { eq, avg, and, gte, sql } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/neptune-hq/quality-trends
 * Returns quality/satisfaction trends from Neptune feedback
 */
export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Get daily average ratings for the last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const qualityTrends = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const [dayRating] = await db
        .select({
          avg: avg(neptuneFeedback.rating),
          count: sql<number>`count(*)`,
        })
        .from(neptuneFeedback)
        .where(
          and(
            eq(neptuneFeedback.workspaceId, workspaceId),
            gte(neptuneFeedback.createdAt, dayStart),
            sql`${neptuneFeedback.createdAt} <= ${dayEnd}`
          )
        );

      // Convert rating (1-5) to percentage (0-100) or use 0 if no data
      const ratingCount = Number(dayRating?.count || 0);
      const avgRating = Number(dayRating?.avg || 0);
      const value = ratingCount > 0 ? Math.round((avgRating / 5) * 100) : 0;

      qualityTrends.push({
        name: `${dayStart.getMonth() + 1}/${dayStart.getDate()}`,
        value,
        count: ratingCount,
      });
    }

    // If no feedback data at all, return placeholder data with 0 values
    const hasData = qualityTrends.some(d => d.count > 0);
    if (!hasData) {
      // Return zeros to indicate no data rather than fake data
      return NextResponse.json({
        data: qualityTrends.map(d => ({ name: d.name, value: 0 })),
        message: 'No feedback data available yet',
      });
    }

    return NextResponse.json({
      data: qualityTrends.map(d => ({ name: d.name, value: d.value })),
    });
  } catch (error) {
    return createErrorResponse(error, 'Quality trends error');
  }
}
