import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { articleAnalytics, blogPosts, users } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { createErrorResponse } from "@/lib/api-error-handler";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/analytics/articles/[id]
 *
 * Get detailed analytics for a single article.
 *
 * Query params:
 * - period: Time period for stats (7d, 30d, 90d, all) - default 30d
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "30d";

    // Validate article ID
    const uuidSchema = z.string().uuid();
    const validatedId = uuidSchema.parse(id);

    // Get the article
    const [article] = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        featuredImage: blogPosts.featuredImage,
        publishedAt: blogPosts.publishedAt,
        readingTimeMinutes: blogPosts.readingTimeMinutes,
        status: blogPosts.status,
        authorId: blogPosts.authorId,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
        authorEmail: users.email,
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(eq(blogPosts.id, validatedId))
      .limit(1);

    if (!article) {
      return createErrorResponse(new Error("Article not found"), "Fetch article analytics detail");
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date | null = null;

    if (period !== "all") {
      const periodDays = period === "7d" ? 7 : period === "90d" ? 90 : 30;
      startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    }

    // Build conditions for analytics query
    const analyticsConditions = [
      eq(articleAnalytics.postId, validatedId),
      eq(articleAnalytics.workspaceId, workspaceId),
    ];
    if (startDate) {
      analyticsConditions.push(gte(articleAnalytics.periodStart, startDate));
      analyticsConditions.push(lte(articleAnalytics.periodEnd, now));
    }

    // Get aggregated analytics
    const [aggregatedStats] = await db
      .select({
        totalViews: sql<number>`COALESCE(SUM(${articleAnalytics.totalViews}), 0)`,
        uniqueVisitors: sql<number>`COALESCE(SUM(${articleAnalytics.uniqueVisitors}), 0)`,
        avgTimeOnPage: sql<number>`COALESCE(AVG(${articleAnalytics.avgTimeOnPageSeconds}), 0)`,
        avgScrollDepth: sql<number>`COALESCE(AVG(${articleAnalytics.avgScrollDepth}), 0)`,
        bounceRate: sql<number>`COALESCE(AVG(${articleAnalytics.bounceRate}), 0)`,
        socialShares: sql<number>`COALESCE(SUM(${articleAnalytics.socialShares}), 0)`,
        commentsCount: sql<number>`COALESCE(SUM(${articleAnalytics.commentsCount}), 0)`,
        reactionsCount: sql<number>`COALESCE(SUM(${articleAnalytics.reactionsCount}), 0)`,
      })
      .from(articleAnalytics)
      .where(and(...analyticsConditions));

    // Get daily/weekly breakdown for chart data
    const analyticsBreakdown = await db
      .select({
        periodStart: articleAnalytics.periodStart,
        periodEnd: articleAnalytics.periodEnd,
        totalViews: articleAnalytics.totalViews,
        uniqueVisitors: articleAnalytics.uniqueVisitors,
        avgTimeOnPage: articleAnalytics.avgTimeOnPageSeconds,
        avgScrollDepth: articleAnalytics.avgScrollDepth,
        bounceRate: articleAnalytics.bounceRate,
        trafficSources: articleAnalytics.trafficSources,
      })
      .from(articleAnalytics)
      .where(and(...analyticsConditions))
      .orderBy(desc(articleAnalytics.periodStart))
      .limit(90); // Max 90 data points

    // Aggregate traffic sources
    const trafficSourcesAgg: Record<string, number> = {};
    analyticsBreakdown.forEach((record) => {
      if (record.trafficSources) {
        const sources = record.trafficSources as Record<string, number>;
        Object.entries(sources).forEach(([key, value]) => {
          trafficSourcesAgg[key] = (trafficSourcesAgg[key] || 0) + (value || 0);
        });
      }
    });

    // Calculate engagement score
    const views = Number(aggregatedStats?.totalViews || 0);
    const scrollDepth = Number(aggregatedStats?.avgScrollDepth || 0);
    const timeOnPage = Number(aggregatedStats?.avgTimeOnPage || 0);
    const bounceRate = Number(aggregatedStats?.bounceRate || 0);

    const engagementScore = Math.round(
      scrollDepth * 0.35 +
        Math.min(timeOnPage / 3, 100) * 0.3 +
        (100 - bounceRate) * 0.25 +
        Math.min(views / 10, 100) * 0.1
    );

    // Format chart data
    const chartData = analyticsBreakdown
      .map((record) => ({
        date: record.periodStart?.toISOString().split("T")[0],
        views: Number(record.totalViews || 0),
        uniqueVisitors: Number(record.uniqueVisitors || 0),
        avgTimeOnPage: Math.round(Number(record.avgTimeOnPage || 0)),
        scrollDepth: Math.round(Number(record.avgScrollDepth || 0)),
        bounceRate: Math.round(Number(record.bounceRate || 0)),
      }))
      .reverse(); // Oldest first for chart

    // Format response
    const response = {
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        featuredImage: article.featuredImage,
        publishedAt: article.publishedAt,
        readingTimeMinutes: article.readingTimeMinutes,
        status: article.status,
        author: article.authorId
          ? {
              id: article.authorId,
              firstName: article.authorFirstName,
              lastName: article.authorLastName,
              email: article.authorEmail,
            }
          : null,
      },
      period,
      periodLabel:
        period === "7d"
          ? "Last 7 Days"
          : period === "90d"
          ? "Last 90 Days"
          : period === "all"
          ? "All Time"
          : "Last 30 Days",
      metrics: {
        totalViews: views,
        uniqueVisitors: Number(aggregatedStats?.uniqueVisitors || 0),
        avgTimeOnPage: Math.round(timeOnPage),
        avgScrollDepth: Math.round(scrollDepth),
        bounceRate: Math.round(bounceRate),
        socialShares: Number(aggregatedStats?.socialShares || 0),
        commentsCount: Number(aggregatedStats?.commentsCount || 0),
        reactionsCount: Number(aggregatedStats?.reactionsCount || 0),
        engagementScore,
      },
      trafficSources: trafficSourcesAgg,
      chartData,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(new Error("Invalid article ID"), "Fetch article analytics detail");
    }
    return createErrorResponse(error, "Fetch article analytics detail");
  }
}

/**
 * PATCH /api/admin/analytics/articles/[id]
 *
 * Update analytics tracking settings for an article.
 * (Reserved for future use - could enable/disable tracking, etc.)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    // Validate article ID
    const uuidSchema = z.string().uuid();
    const validatedId = uuidSchema.parse(id);

    // Verify article exists
    const [article] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.id, validatedId))
      .limit(1);

    if (!article) {
      return createErrorResponse(new Error("Article not found"), "Update article analytics settings");
    }

    // For now, just acknowledge the request
    // In the future, this could update tracking settings
    return NextResponse.json({
      success: true,
      message: "Analytics settings updated",
      articleId: validatedId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(new Error("Invalid article ID"), "Update article analytics settings");
    }
    return createErrorResponse(error, "Update article analytics settings");
  }
}

