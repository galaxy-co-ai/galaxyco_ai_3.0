/**
 * Insights Stats API
 *
 * GET /api/insights/stats - Fetch aggregated insight statistics for the workspace
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { proactiveInsights } from '@/db/schema';
import { and, eq, gte, sql, or } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

interface InsightStats {
  total: number;
  byType: {
    opportunity: number;
    warning: number;
    suggestion: number;
    achievement: number;
  };
  byCategory: {
    sales: number;
    marketing: number;
    operations: number;
    finance: number;
    content: number;
  };
  byPriority: {
    high: number;    // 8-10
    medium: number;  // 5-7
    low: number;     // 1-4
  };
  averagePriority: number;
  highConfidenceCount: number;  // Priority >= 8
  weekOverWeek: {
    thisWeek: number;
    lastWeek: number;
    changePercent: number;
  };
  confidenceDistribution: {
    bucket: string;
    range: string;
    count: number;
  }[];
  trendData: {
    week: string;
    date: string;
    opportunity: number;
    warning: number;
    suggestion: number;
    achievement: number;
    total: number;
  }[];
}

export async function GET() {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return createErrorResponse(new Error('Unauthorized'), 'Fetch insight stats');
    }

    const workspaceId = (sessionClaims?.metadata as { workspaceId?: string })?.workspaceId;
    if (!workspaceId) {
      return createErrorResponse(new Error('Workspace access forbidden'), 'Fetch insight stats');
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const _twentyEightDaysAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    // Base conditions for active insights
    const baseConditions = [
      eq(proactiveInsights.workspaceId, workspaceId),
      sql`${proactiveInsights.dismissedAt} IS NULL`,
      or(
        sql`${proactiveInsights.expiresAt} IS NULL`,
        sql`${proactiveInsights.expiresAt} > NOW()`
      )!,
    ];

    // Get all active insights for breakdown
    const allInsights = await db.query.proactiveInsights.findMany({
      where: and(...baseConditions, gte(proactiveInsights.createdAt, sevenDaysAgo)),
    });

    // Count by type
    const byType = {
      opportunity: 0,
      warning: 0,
      suggestion: 0,
      achievement: 0,
    };

    // Count by category
    const byCategory = {
      sales: 0,
      marketing: 0,
      operations: 0,
      finance: 0,
      content: 0,
    };

    // Count by priority tier
    const byPriority = {
      high: 0,   // 8-10
      medium: 0, // 5-7
      low: 0,    // 1-4
    };

    // Confidence distribution buckets
    const confidenceBuckets = {
      '0-50': 0,
      '50-70': 0,
      '70-85': 0,
      '85-100': 0,
    };

    let totalPriority = 0;

    for (const insight of allInsights) {
      // Count by type
      if (insight.type in byType) {
        byType[insight.type as keyof typeof byType]++;
      }

      // Count by category
      if (insight.category in byCategory) {
        byCategory[insight.category as keyof typeof byCategory]++;
      }

      // Count by priority tier
      const priority = insight.priority;
      totalPriority += priority;
      if (priority >= 8) {
        byPriority.high++;
      } else if (priority >= 5) {
        byPriority.medium++;
      } else {
        byPriority.low++;
      }

      // Confidence distribution (using priority as confidence proxy, scaled to 0-100)
      const confidence = priority * 10;
      if (confidence < 50) {
        confidenceBuckets['0-50']++;
      } else if (confidence < 70) {
        confidenceBuckets['50-70']++;
      } else if (confidence < 85) {
        confidenceBuckets['70-85']++;
      } else {
        confidenceBuckets['85-100']++;
      }
    }

    const total = allInsights.length;
    const averagePriority = total > 0 ? Math.round((totalPriority / total) * 10) / 10 : 0;
    const highConfidenceCount = byPriority.high;

    // Week over week comparison
    const thisWeekInsights = await db.query.proactiveInsights.findMany({
      where: and(...baseConditions, gte(proactiveInsights.createdAt, sevenDaysAgo)),
    });

    const lastWeekInsights = await db.query.proactiveInsights.findMany({
      where: and(
        ...baseConditions,
        gte(proactiveInsights.createdAt, fourteenDaysAgo),
        sql`${proactiveInsights.createdAt} < ${sevenDaysAgo}`
      ),
    });

    const thisWeekCount = thisWeekInsights.length;
    const lastWeekCount = lastWeekInsights.length;
    const changePercent = lastWeekCount > 0
      ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100)
      : thisWeekCount > 0 ? 100 : 0;

    // Trend data for last 4 weeks
    const trendData: InsightStats['trendData'] = [];
    for (let weekOffset = 3; weekOffset >= 0; weekOffset--) {
      const weekStart = new Date(now.getTime() - (weekOffset + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - weekOffset * 7 * 24 * 60 * 60 * 1000);

      const weekInsights = await db.query.proactiveInsights.findMany({
        where: and(
          eq(proactiveInsights.workspaceId, workspaceId),
          gte(proactiveInsights.createdAt, weekStart),
          sql`${proactiveInsights.createdAt} < ${weekEnd}`
        ),
      });

      const weekData = {
        week: `Week ${4 - weekOffset}`,
        date: weekStart.toISOString().split('T')[0],
        opportunity: 0,
        warning: 0,
        suggestion: 0,
        achievement: 0,
        total: weekInsights.length,
      };

      for (const insight of weekInsights) {
        if (insight.type in weekData) {
          weekData[insight.type as keyof Pick<typeof weekData, 'opportunity' | 'warning' | 'suggestion' | 'achievement'>]++;
        }
      }

      trendData.push(weekData);
    }

    const confidenceDistribution = [
      { bucket: '0-50', range: '0-50%', count: confidenceBuckets['0-50'] },
      { bucket: '50-70', range: '50-70%', count: confidenceBuckets['50-70'] },
      { bucket: '70-85', range: '70-85%', count: confidenceBuckets['70-85'] },
      { bucket: '85-100', range: '85-100%', count: confidenceBuckets['85-100'] },
    ];

    const stats: InsightStats = {
      total,
      byType,
      byCategory,
      byPriority,
      averagePriority,
      highConfidenceCount,
      weekOverWeek: {
        thisWeek: thisWeekCount,
        lastWeek: lastWeekCount,
        changePercent,
      },
      confidenceDistribution,
      trendData,
    };

    return NextResponse.json({
      success: true,
      stats,
    });

  } catch (error) {
    return createErrorResponse(error, 'Fetch insight stats');
  }
}
