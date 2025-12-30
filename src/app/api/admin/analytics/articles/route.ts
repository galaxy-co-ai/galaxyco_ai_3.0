import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { articleAnalytics, blogPosts, users } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and, desc, asc, sql, gte, lte, ilike } from "drizzle-orm";
import { createErrorResponse } from "@/lib/api-error-handler";

const querySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  sortBy: z
    .enum(["views", "timeOnPage", "scrollDepth", "bounceRate", "publishedAt"])
    .optional()
    .default("views"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  search: z.string().optional(),
});

/**
 * GET /api/admin/analytics/articles
 *
 * List article performance metrics for the current workspace.
 * Supports date range filtering, sorting, and pagination.
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const params = querySchema.parse(searchParams);

    const now = new Date();
    const defaultStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startDate = params.startDate
      ? new Date(params.startDate)
      : defaultStartDate;
    const endDate = params.endDate ? new Date(params.endDate) : now;

    // Build sort column
    const getSortColumn = () => {
      switch (params.sortBy) {
        case "views":
          return sql`COALESCE(SUM(${articleAnalytics.totalViews}), 0)`;
        case "timeOnPage":
          return sql`COALESCE(AVG(${articleAnalytics.avgTimeOnPageSeconds}), 0)`;
        case "scrollDepth":
          return sql`COALESCE(AVG(${articleAnalytics.avgScrollDepth}), 0)`;
        case "bounceRate":
          return sql`COALESCE(AVG(${articleAnalytics.bounceRate}), 0)`;
        case "publishedAt":
          return blogPosts.publishedAt;
        default:
          return sql`COALESCE(SUM(${articleAnalytics.totalViews}), 0)`;
      }
    };

    // Build search condition
    const conditions = [eq(blogPosts.status, "published")];
    if (params.search) {
      conditions.push(ilike(blogPosts.title, `%${params.search}%`));
    }

    // Fetch articles with aggregated analytics
    const articles = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        featuredImage: blogPosts.featuredImage,
        publishedAt: blogPosts.publishedAt,
        readingTimeMinutes: blogPosts.readingTimeMinutes,
        authorId: blogPosts.authorId,
        authorFirstName: users.firstName,
        authorLastName: users.lastName,
        authorEmail: users.email,
        totalViews: sql<number>`COALESCE(SUM(${articleAnalytics.totalViews}), 0)`,
        uniqueVisitors: sql<number>`COALESCE(SUM(${articleAnalytics.uniqueVisitors}), 0)`,
        avgTimeOnPage: sql<number>`COALESCE(AVG(${articleAnalytics.avgTimeOnPageSeconds}), 0)`,
        avgScrollDepth: sql<number>`COALESCE(AVG(${articleAnalytics.avgScrollDepth}), 0)`,
        bounceRate: sql<number>`COALESCE(AVG(${articleAnalytics.bounceRate}), 0)`,
        socialShares: sql<number>`COALESCE(SUM(${articleAnalytics.socialShares}), 0)`,
      })
      .from(blogPosts)
      .leftJoin(
        articleAnalytics,
        and(
          eq(articleAnalytics.postId, blogPosts.id),
          eq(articleAnalytics.workspaceId, workspaceId),
          gte(articleAnalytics.periodStart, startDate),
          lte(articleAnalytics.periodEnd, endDate)
        )
      )
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(and(...conditions))
      .groupBy(
        blogPosts.id,
        blogPosts.title,
        blogPosts.slug,
        blogPosts.excerpt,
        blogPosts.featuredImage,
        blogPosts.publishedAt,
        blogPosts.readingTimeMinutes,
        blogPosts.authorId,
        users.firstName,
        users.lastName,
        users.email
      )
      .orderBy(
        params.sortOrder === "asc"
          ? asc(getSortColumn())
          : desc(getSortColumn())
      )
      .limit(params.limit)
      .offset(params.offset);

    // Get total count for pagination
    const [totalResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${blogPosts.id})` })
      .from(blogPosts)
      .where(and(...conditions));

    // Calculate engagement score for each article
    const articlesWithScore = articles.map((article) => {
      const views = Number(article.totalViews);
      const scrollDepth = Number(article.avgScrollDepth);
      const timeOnPage = Number(article.avgTimeOnPage);
      const bounceRate = Number(article.bounceRate);

      // Simple engagement score: weighted average of metrics
      const engagementScore = Math.round(
        scrollDepth * 0.35 + // Scroll depth is most important
          Math.min(timeOnPage / 3, 100) * 0.3 + // Cap time contribution
          (100 - bounceRate) * 0.25 + // Lower bounce = higher score
          Math.min(views / 10, 100) * 0.1 // Views contribute less
      );

      return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        featuredImage: article.featuredImage,
        publishedAt: article.publishedAt,
        readingTimeMinutes: article.readingTimeMinutes,
        author: article.authorId
          ? {
              id: article.authorId,
              firstName: article.authorFirstName,
              lastName: article.authorLastName,
              email: article.authorEmail,
            }
          : null,
        metrics: {
          totalViews: views,
          uniqueVisitors: Number(article.uniqueVisitors),
          avgTimeOnPage: Math.round(Number(article.avgTimeOnPage)),
          avgScrollDepth: Math.round(Number(article.avgScrollDepth)),
          bounceRate: Math.round(Number(article.bounceRate)),
          socialShares: Number(article.socialShares),
          engagementScore,
        },
      };
    });

    return NextResponse.json({
      articles: articlesWithScore,
      total: Number(totalResult?.count || 0),
      limit: params.limit,
      offset: params.offset,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(new Error("Invalid query parameters"), "Fetch article analytics");
    }
    return createErrorResponse(error, "Fetch article analytics");
  }
}

