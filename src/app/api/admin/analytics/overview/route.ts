import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { articleAnalytics, blogPosts } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { createErrorResponse } from "@/lib/api-error-handler";

/**
 * GET /api/admin/analytics/overview
 *
 * Get dashboard overview statistics for the current workspace.
 * Returns total views, engagement metrics, top performers, and trends.
 *
 * Query params:
 * - period: Time period for stats (7d, 30d, 90d) - default 30d
 */
export async function GET(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    // Calculate date range based on period
    const now = new Date();
    const periodDays = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Aggregate overview stats from articleAnalytics
    const [overviewStats] = await db
      .select({
        totalViews: sql<number>`COALESCE(SUM(${articleAnalytics.totalViews}), 0)`,
        totalUniqueVisitors: sql<number>`COALESCE(SUM(${articleAnalytics.uniqueVisitors}), 0)`,
        avgTimeOnPage: sql<number>`COALESCE(AVG(${articleAnalytics.avgTimeOnPageSeconds}), 0)`,
        avgScrollDepth: sql<number>`COALESCE(AVG(${articleAnalytics.avgScrollDepth}), 0)`,
        avgBounceRate: sql<number>`COALESCE(AVG(${articleAnalytics.bounceRate}), 0)`,
        totalShares: sql<number>`COALESCE(SUM(${articleAnalytics.socialShares}), 0)`,
        totalArticles: sql<number>`COUNT(DISTINCT ${articleAnalytics.postId})`,
      })
      .from(articleAnalytics)
      .where(
        and(
          eq(articleAnalytics.workspaceId, workspaceId),
          gte(articleAnalytics.periodStart, startDate),
          lte(articleAnalytics.periodEnd, now)
        )
      );

    // Get previous period for comparison
    const previousStartDate = new Date(
      startDate.getTime() - periodDays * 24 * 60 * 60 * 1000
    );

    const [previousStats] = await db
      .select({
        totalViews: sql<number>`COALESCE(SUM(${articleAnalytics.totalViews}), 0)`,
        avgTimeOnPage: sql<number>`COALESCE(AVG(${articleAnalytics.avgTimeOnPageSeconds}), 0)`,
      })
      .from(articleAnalytics)
      .where(
        and(
          eq(articleAnalytics.workspaceId, workspaceId),
          gte(articleAnalytics.periodStart, previousStartDate),
          lte(articleAnalytics.periodEnd, startDate)
        )
      );

    // Calculate percent change
    const viewsChange =
      previousStats?.totalViews > 0
        ? ((Number(overviewStats?.totalViews || 0) -
            Number(previousStats.totalViews)) /
            Number(previousStats.totalViews)) *
          100
        : 0;

    const timeChange =
      previousStats?.avgTimeOnPage > 0
        ? ((Number(overviewStats?.avgTimeOnPage || 0) -
            Number(previousStats.avgTimeOnPage)) /
            Number(previousStats.avgTimeOnPage)) *
          100
        : 0;

    // Get top performing articles
    const topPerformers = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        featuredImage: blogPosts.featuredImage,
        publishedAt: blogPosts.publishedAt,
        totalViews: sql<number>`COALESCE(SUM(${articleAnalytics.totalViews}), 0)`,
        avgTimeOnPage: sql<number>`COALESCE(AVG(${articleAnalytics.avgTimeOnPageSeconds}), 0)`,
        avgScrollDepth: sql<number>`COALESCE(AVG(${articleAnalytics.avgScrollDepth}), 0)`,
      })
      .from(blogPosts)
      .leftJoin(articleAnalytics, eq(articleAnalytics.postId, blogPosts.id))
      .where(
        and(
          eq(blogPosts.status, "published"),
          gte(articleAnalytics.periodStart, startDate)
        )
      )
      .groupBy(
        blogPosts.id,
        blogPosts.title,
        blogPosts.slug,
        blogPosts.featuredImage,
        blogPosts.publishedAt
      )
      .orderBy(desc(sql`SUM(${articleAnalytics.totalViews})`))
      .limit(5);

    // Get total published articles count
    const [totalPublished] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(blogPosts)
      .where(eq(blogPosts.status, "published"));

    // Get recent article count (published in period)
    const [recentlyPublished] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(blogPosts)
      .where(
        and(
          eq(blogPosts.status, "published"),
          gte(blogPosts.publishedAt, startDate)
        )
      );

    // Format response
    const response = {
      period,
      periodLabel:
        period === "7d"
          ? "Last 7 Days"
          : period === "90d"
          ? "Last 90 Days"
          : "Last 30 Days",
      stats: {
        totalViews: Number(overviewStats?.totalViews || 0),
        totalUniqueVisitors: Number(overviewStats?.totalUniqueVisitors || 0),
        avgTimeOnPage: Math.round(Number(overviewStats?.avgTimeOnPage || 0)),
        avgScrollDepth: Math.round(Number(overviewStats?.avgScrollDepth || 0)),
        avgBounceRate: Math.round(Number(overviewStats?.avgBounceRate || 0)),
        totalShares: Number(overviewStats?.totalShares || 0),
        totalArticles: Number(overviewStats?.totalArticles || 0),
        totalPublished: Number(totalPublished?.count || 0),
        recentlyPublished: Number(recentlyPublished?.count || 0),
      },
      trends: {
        viewsChange: Math.round(viewsChange * 10) / 10,
        timeChange: Math.round(timeChange * 10) / 10,
      },
      topPerformers: topPerformers.map((article) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        featuredImage: article.featuredImage,
        publishedAt: article.publishedAt,
        totalViews: Number(article.totalViews),
        avgTimeOnPage: Math.round(Number(article.avgTimeOnPage)),
        avgScrollDepth: Math.round(Number(article.avgScrollDepth)),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    return createErrorResponse(error, "Fetch analytics overview");
  }
}

