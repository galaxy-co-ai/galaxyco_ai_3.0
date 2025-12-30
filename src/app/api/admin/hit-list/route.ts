import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { topicIdeas, users } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and, desc, asc, sql, ilike, isNotNull } from "drizzle-orm";
import { createErrorResponse } from "@/lib/api-error-handler";

/**
 * GET /api/admin/hit-list
 *
 * List hit list items for the current workspace.
 * Supports filtering by status, priority, search, and sorting.
 *
 * Query params:
 * - status: Filter by status (saved, in_progress, published, archived)
 * - priority: Filter by priority level (low, medium, high, urgent)
 * - search: Search by title
 * - sortBy: Sort field (priorityScore, hitListPosition, targetPublishDate, createdAt)
 * - sortOrder: Sort order (asc, desc)
 * - limit: Max number of results (default 50)
 * - offset: Pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as
      | "saved"
      | "in_progress"
      | "published"
      | "archived"
      | null;
    const priority = searchParams.get("priority") as
      | "low"
      | "medium"
      | "high"
      | "urgent"
      | null;
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "priorityScore";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const hitListOnly = searchParams.get("hitListOnly") === "true";

    // Build query conditions
    const conditions = [eq(topicIdeas.workspaceId, workspaceId)];

    // Only show items added to hit list (have hitListAddedAt set)
    if (hitListOnly) {
      conditions.push(isNotNull(topicIdeas.hitListAddedAt));
    }

    if (status) {
      conditions.push(eq(topicIdeas.status, status));
    }

    if (priority) {
      conditions.push(eq(topicIdeas.priority, priority));
    }

    if (search) {
      conditions.push(ilike(topicIdeas.title, `%${search}%`));
    }

    // Build order by clause
    const getOrderByColumn = () => {
      switch (sortBy) {
        case "priorityScore":
          return topicIdeas.priorityScore;
        case "hitListPosition":
          return topicIdeas.hitListPosition;
        case "targetPublishDate":
          return topicIdeas.targetPublishDate;
        case "createdAt":
          return topicIdeas.createdAt;
        default:
          return topicIdeas.priorityScore;
      }
    };

    const orderByColumn = getOrderByColumn();
    const orderFn = sortOrder === "asc" ? asc : desc;

    // Fetch hit list items with assigned user info
    const items = await db
      .select({
        id: topicIdeas.id,
        workspaceId: topicIdeas.workspaceId,
        title: topicIdeas.title,
        description: topicIdeas.description,
        whyItWorks: topicIdeas.whyItWorks,
        generatedBy: topicIdeas.generatedBy,
        status: topicIdeas.status,
        resultingPostId: topicIdeas.resultingPostId,
        category: topicIdeas.category,
        suggestedLayout: topicIdeas.suggestedLayout,
        priority: topicIdeas.priority,
        targetPublishDate: topicIdeas.targetPublishDate,
        hitListPosition: topicIdeas.hitListPosition,
        hitListAddedAt: topicIdeas.hitListAddedAt,
        estimatedTimeMinutes: topicIdeas.estimatedTimeMinutes,
        difficultyLevel: topicIdeas.difficultyLevel,
        priorityScore: topicIdeas.priorityScore,
        priorityScoreBreakdown: topicIdeas.priorityScoreBreakdown,
        wizardProgress: topicIdeas.wizardProgress,
        assignedTo: topicIdeas.assignedTo,
        createdAt: topicIdeas.createdAt,
        updatedAt: topicIdeas.updatedAt,
        assignedUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(topicIdeas)
      .leftJoin(users, eq(topicIdeas.assignedTo, users.id))
      .where(and(...conditions))
      .orderBy(orderFn(orderByColumn))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(topicIdeas)
      .where(and(...conditions));

    // Get counts by status for quick stats
    const statusCounts = await db
      .select({
        status: topicIdeas.status,
        count: sql<number>`count(*)`,
      })
      .from(topicIdeas)
      .where(
        and(
          eq(topicIdeas.workspaceId, workspaceId),
          isNotNull(topicIdeas.hitListAddedAt)
        )
      )
      .groupBy(topicIdeas.status);

    const stats = {
      queued: 0,
      inProgress: 0,
      published: 0,
      archived: 0,
      total: 0,
    };

    statusCounts.forEach((row) => {
      const count = Number(row.count);
      stats.total += count;
      switch (row.status) {
        case "saved":
          stats.queued += count;
          break;
        case "in_progress":
          stats.inProgress += count;
          break;
        case "published":
          stats.published += count;
          break;
        case "archived":
          stats.archived += count;
          break;
      }
    });

    return NextResponse.json({
      items,
      total: Number(countResult?.count || 0),
      stats,
      limit,
      offset,
    });
  } catch (error) {
    return createErrorResponse(error, "Fetch hit list error");
  }
}

/**
 * POST /api/admin/hit-list
 *
 * Add a topic idea to the hit list or create a new one.
 */
const addToHitListSchema = z.object({
  // Either existing topic ID or new topic data
  topicId: z.string().uuid().optional(),

  // New topic fields (required if topicId not provided)
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  whyItWorks: z.string().max(1000).optional(),
  category: z.string().max(100).optional(),
  suggestedLayout: z
    .enum([
      "standard",
      "how-to",
      "listicle",
      "case-study",
      "tool-review",
      "news",
      "opinion",
    ])
    .optional(),

  // Hit list specific fields
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  targetPublishDate: z.string().datetime().optional(),
  estimatedTimeMinutes: z.number().int().min(0).max(9999).optional(),
  difficultyLevel: z.enum(["easy", "medium", "hard"]).optional(),
  assignedTo: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();

    const body = await request.json();
    const validatedData = addToHitListSchema.parse(body);

    // If topicId provided, update existing topic
    if (validatedData.topicId) {
      // Verify topic belongs to workspace
      const [existingTopic] = await db
        .select({ id: topicIdeas.id })
        .from(topicIdeas)
        .where(
          and(
            eq(topicIdeas.id, validatedData.topicId),
            eq(topicIdeas.workspaceId, workspaceId)
          )
        )
        .limit(1);

      if (!existingTopic) {
        return createErrorResponse(new Error("Topic not found"), "Add to hit list");
      }

      // Get max position for ordering
      const [maxPosition] = await db
        .select({ maxPos: sql<number>`COALESCE(MAX(hit_list_position), 0)` })
        .from(topicIdeas)
        .where(
          and(
            eq(topicIdeas.workspaceId, workspaceId),
            isNotNull(topicIdeas.hitListAddedAt)
          )
        );

      // Update the topic to add it to hit list
      const [updatedTopic] = await db
        .update(topicIdeas)
        .set({
          hitListAddedAt: new Date(),
          hitListPosition: (maxPosition?.maxPos || 0) + 1,
          priority: validatedData.priority,
          targetPublishDate: validatedData.targetPublishDate
            ? new Date(validatedData.targetPublishDate)
            : null,
          estimatedTimeMinutes: validatedData.estimatedTimeMinutes,
          difficultyLevel: validatedData.difficultyLevel,
          assignedTo: validatedData.assignedTo,
          updatedAt: new Date(),
        })
        .where(eq(topicIdeas.id, validatedData.topicId))
        .returning();

      logger.info("Topic added to hit list", {
        topicId: updatedTopic.id,
        workspaceId,
      });

      return NextResponse.json({ item: updatedTopic }, { status: 200 });
    }

    // Create new topic and add to hit list
    if (!validatedData.title) {
      return createErrorResponse(new Error("Invalid request: title is required for new topics"), "Add to hit list validation");
    }

    // Get max position for ordering
    const [maxPosition] = await db
      .select({ maxPos: sql<number>`COALESCE(MAX(hit_list_position), 0)` })
      .from(topicIdeas)
      .where(
        and(
          eq(topicIdeas.workspaceId, workspaceId),
          isNotNull(topicIdeas.hitListAddedAt)
        )
      );

    const [newTopic] = await db
      .insert(topicIdeas)
      .values({
        workspaceId,
        title: validatedData.title,
        description: validatedData.description,
        whyItWorks: validatedData.whyItWorks,
        category: validatedData.category,
        suggestedLayout: validatedData.suggestedLayout,
        generatedBy: "user",
        status: "saved",
        hitListAddedAt: new Date(),
        hitListPosition: (maxPosition?.maxPos || 0) + 1,
        priority: validatedData.priority,
        targetPublishDate: validatedData.targetPublishDate
          ? new Date(validatedData.targetPublishDate)
          : null,
        estimatedTimeMinutes: validatedData.estimatedTimeMinutes,
        difficultyLevel: validatedData.difficultyLevel ?? "medium",
        assignedTo: validatedData.assignedTo,
      })
      .returning();

    logger.info("New topic created and added to hit list", {
      topicId: newTopic.id,
      title: newTopic.title,
      workspaceId,
    });

    return NextResponse.json({ item: newTopic }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, "Add to hit list error");
  }
}

