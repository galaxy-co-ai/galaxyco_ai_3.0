import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { contentSources, users } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and, desc, sql, ilike, or } from "drizzle-orm";
import { createErrorResponse } from "@/lib/api-error-handler";

/**
 * GET /api/admin/content-sources
 *
 * List content sources for the current workspace.
 * Supports filtering by status, type, and search.
 *
 * Query params:
 * - status: Filter by status (active, suggested, rejected, archived)
 * - type: Filter by type (news, research, competitor, inspiration, industry, other)
 * - search: Search by name or URL
 * - limit: Max number of results (default 50)
 * - offset: Pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as
      | "active"
      | "suggested"
      | "rejected"
      | "archived"
      | null;
    const type = searchParams.get("type") as
      | "news"
      | "research"
      | "competitor"
      | "inspiration"
      | "industry"
      | "other"
      | null;
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build query conditions
    const conditions = [eq(contentSources.workspaceId, workspaceId)];

    if (status) {
      conditions.push(eq(contentSources.status, status));
    }

    if (type) {
      conditions.push(eq(contentSources.type, type));
    }

    if (search) {
      conditions.push(
        or(
          ilike(contentSources.name, `%${search}%`),
          ilike(contentSources.url, `%${search}%`)
        ) ?? sql`true`
      );
    }

    // Fetch sources with user info
    const sources = await db
      .select({
        id: contentSources.id,
        workspaceId: contentSources.workspaceId,
        name: contentSources.name,
        url: contentSources.url,
        description: contentSources.description,
        type: contentSources.type,
        status: contentSources.status,
        aiReviewScore: contentSources.aiReviewScore,
        aiReviewNotes: contentSources.aiReviewNotes,
        aiReviewedAt: contentSources.aiReviewedAt,
        lastCheckedAt: contentSources.lastCheckedAt,
        articlesFoundCount: contentSources.articlesFoundCount,
        tags: contentSources.tags,
        addedBy: contentSources.addedBy,
        createdAt: contentSources.createdAt,
        updatedAt: contentSources.updatedAt,
        addedByUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(contentSources)
      .leftJoin(users, eq(contentSources.addedBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(contentSources.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contentSources)
      .where(and(...conditions));

    // Get counts by status for quick stats
    const statusCounts = await db
      .select({
        status: contentSources.status,
        count: sql<number>`count(*)`,
      })
      .from(contentSources)
      .where(eq(contentSources.workspaceId, workspaceId))
      .groupBy(contentSources.status);

    const stats = {
      active: 0,
      suggested: 0,
      rejected: 0,
      archived: 0,
    };

    statusCounts.forEach((row) => {
      stats[row.status as keyof typeof stats] = Number(row.count);
    });

    return NextResponse.json({
      sources,
      total: Number(countResult?.count || 0),
      stats,
      limit,
      offset,
    });
  } catch (error) {
    return createErrorResponse(error, "Fetch content sources");
  }
}

/**
 * POST /api/admin/content-sources
 *
 * Create a new content source.
 */
const createSourceSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  url: z.string().url("Invalid URL format").max(2000),
  description: z.string().max(1000).optional(),
  type: z
    .enum(["news", "research", "competitor", "inspiration", "industry", "other"])
    .default("other"),
  status: z.enum(["active", "suggested", "rejected", "archived"]).default("active"),
  tags: z.array(z.string().max(50)).max(10).optional(),
  aiReviewScore: z.number().int().min(0).max(100).optional(),
  aiReviewNotes: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();

    const body = await request.json();
    const validatedData = createSourceSchema.parse(body);

    // Check if URL already exists for this workspace
    const existingSource = await db
      .select({ id: contentSources.id })
      .from(contentSources)
      .where(
        and(
          eq(contentSources.workspaceId, workspaceId),
          eq(contentSources.url, validatedData.url)
        )
      )
      .limit(1);

    if (existingSource.length > 0) {
      return createErrorResponse(new Error("A source with this URL already exists"), "Create content source");
    }

    const [newSource] = await db
      .insert(contentSources)
      .values({
        workspaceId,
        name: validatedData.name,
        url: validatedData.url,
        description: validatedData.description,
        type: validatedData.type,
        status: validatedData.status,
        tags: validatedData.tags || [],
        aiReviewScore: validatedData.aiReviewScore,
        aiReviewNotes: validatedData.aiReviewNotes,
        aiReviewedAt: validatedData.aiReviewScore ? new Date() : null,
        addedBy: user?.id || null,
      })
      .returning();

    logger.info("Content source created", {
      sourceId: newSource.id,
      name: newSource.name,
      workspaceId,
    });

    return NextResponse.json({ source: newSource }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(new Error("Invalid request body"), "Create content source");
    }
    return createErrorResponse(error, "Create content source");
  }
}

