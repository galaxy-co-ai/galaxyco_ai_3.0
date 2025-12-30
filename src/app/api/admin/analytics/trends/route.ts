import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { articleAnalytics, blogPosts } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { createErrorResponse } from "@/lib/api-error-handler";

const querySchema = z.object({
  period: z.enum(["daily", "weekly", "monthly"]).optional().default("daily"),
  metric: z
    .enum(["views", "engagement", "shares", "time"])
    .optional()
    .default("views"),
  days: z.coerce.number().int().min(7).max(365).optional().default(30),
});

/**
 * GET /api/admin/analytics/trends
 *
 * Get content performance trends over time for charting.
 *
 * Query params:
 * - period: Aggregation period (daily, weekly, monthly) - default daily
 * - metric: Metric to track (views, engagement, shares, time) - default views
 * - days: Number of days of data to return - default 30
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = querySchema.parse(searchParams);

    const now = new Date();
    const startDate = new Date(
      now.getTime() - params.days * 24 * 60 * 60 * 1000
    );

    // Build aggregation based on period
    let dateFormat: string;
    let groupByExpr;

    switch (params.period) {
      case "weekly":
        dateFormat = "YYYY-WW";
        groupByExpr = sql`to_char(${articleAnalytics.periodStart}, 'IYYY-IW')`;
        break;
      case "monthly":
        dateFormat = "YYYY-MM";
        groupByExpr = sql`to_char(${articleAnalytics.periodStart}, 'YYYY-MM')`;
        break;
      default:
        dateFormat = "YYYY-MM-DD";
        groupByExpr = sql`date_trunc('day', ${articleAnalytics.periodStart})`;
    }

    // Build metric columns based on requested metric
    const getMetricColumn = () => {
      switch (params.metric) {
        case "views":
          return sql<number>`COALESCE(SUM(${articleAnalytics.totalViews}), 0)`;
        case "engagement":
          return sql<number>`COALESCE(AVG(${articleAnalytics.avgScrollDepth}), 0)`;
        case "shares":
          return sql<number>`COALESCE(SUM(${articleAnalytics.socialShares}), 0)`;
        case "time":
          return sql<number>`COALESCE(AVG(${articleAnalytics.avgTimeOnPageSeconds}), 0)`;
        default:
          return sql<number>`COALESCE(SUM(${articleAnalytics.totalViews}), 0)`;
      }
    };

    // Fetch trend data
    const trendData = await db
      .select({
        period: groupByExpr,
        primaryValue: getMetricColumn(),
        totalViews: sql<number>`COALESCE(SUM(${articleAnalytics.totalViews}), 0)`,
        uniqueVisitors: sql<number>`COALESCE(SUM(${articleAnalytics.uniqueVisitors}), 0)`,
        avgScrollDepth: sql<number>`COALESCE(AVG(${articleAnalytics.avgScrollDepth}), 0)`,
        avgTimeOnPage: sql<number>`COALESCE(AVG(${articleAnalytics.avgTimeOnPageSeconds}), 0)`,
        avgBounceRate: sql<number>`COALESCE(AVG(${articleAnalytics.bounceRate}), 0)`,
        socialShares: sql<number>`COALESCE(SUM(${articleAnalytics.socialShares}), 0)`,
        articleCount: sql<number>`COUNT(DISTINCT ${articleAnalytics.postId})`,
      })
      .from(articleAnalytics)
      .where(
        and(
          eq(articleAnalytics.workspaceId, workspaceId),
          gte(articleAnalytics.periodStart, startDate),
          lte(articleAnalytics.periodEnd, now)
        )
      )
      .groupBy(groupByExpr)
      .orderBy(groupByExpr);

    // Get new articles published in period for correlation
    const newArticles = await db
      .select({
        publishDate: sql`date_trunc('day', ${blogPosts.publishedAt})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.status, "published"),
          gte(blogPosts.publishedAt, startDate),
          lte(blogPosts.publishedAt, now)
        )
      )
      .groupBy(sql`date_trunc('day', ${blogPosts.publishedAt})`);

    // Build a map of publish dates to counts
    const publishCountMap = new Map<string, number>();
    newArticles.forEach((record) => {
      if (record.publishDate) {
        const dateStr = new Date(record.publishDate as Date)
          .toISOString()
          .split("T")[0];
        publishCountMap.set(dateStr, Number(record.count));
      }
    });

    // Format trend data for charts
    const formattedTrends = trendData.map((record) => {
      const periodStr = String(record.period);
      return {
        period: periodStr,
        value: Math.round(Number(record.primaryValue)),
        views: Number(record.totalViews),
        uniqueVisitors: Number(record.uniqueVisitors),
        avgScrollDepth: Math.round(Number(record.avgScrollDepth)),
        avgTimeOnPage: Math.round(Number(record.avgTimeOnPage)),
        avgBounceRate: Math.round(Number(record.avgBounceRate)),
        socialShares: Number(record.socialShares),
        articleCount: Number(record.articleCount),
        newPublished: publishCountMap.get(periodStr) || 0,
      };
    });

    // Calculate summary statistics
    const totalValue = formattedTrends.reduce(
      (sum, item) => sum + item.value,
      0
    );
    const avgValue =
      formattedTrends.length > 0
        ? Math.round(totalValue / formattedTrends.length)
        : 0;

    // Calculate trend direction
    const recentValues = formattedTrends.slice(-7);
    const olderValues = formattedTrends.slice(0, Math.max(1, formattedTrends.length - 7));

    const recentAvg =
      recentValues.length > 0
        ? recentValues.reduce((sum, item) => sum + item.value, 0) /
          recentValues.length
        : 0;
    const olderAvg =
      olderValues.length > 0
        ? olderValues.reduce((sum, item) => sum + item.value, 0) /
          olderValues.length
        : 0;

    const trendDirection =
      olderAvg > 0 ? ((recentAvg - olderAvg) / olderAvg) * 100 : 0;

    return NextResponse.json({
      metric: params.metric,
      metricLabel:
        params.metric === "views"
          ? "Page Views"
          : params.metric === "engagement"
          ? "Engagement (Scroll %)"
          : params.metric === "shares"
          ? "Social Shares"
          : "Avg. Time on Page (s)",
      period: params.period,
      days: params.days,
      summary: {
        total: totalValue,
        average: avgValue,
        trendDirection: Math.round(trendDirection * 10) / 10,
        trendLabel:
          trendDirection > 5
            ? "Trending Up"
            : trendDirection < -5
            ? "Trending Down"
            : "Stable",
      },
      data: formattedTrends,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(new Error("Invalid query parameters"), "Fetch analytics trends");
    }
    return createErrorResponse(error, "Fetch analytics trends");
  }
}

