import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { topicIdeas, users } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";

/**
 * GET /api/admin/hit-list/[id]
 *
 * Get a single hit list item with full details.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    const [item] = await db
      .select({
        id: topicIdeas.id,
        workspaceId: topicIdeas.workspaceId,
        title: topicIdeas.title,
        description: topicIdeas.description,
        whyItWorks: topicIdeas.whyItWorks,
        generatedBy: topicIdeas.generatedBy,
        status: topicIdeas.status,
        resultingPostId: topicIdeas.resultingPostId,
        sourceConversation: topicIdeas.sourceConversation,
        category: topicIdeas.category,
        suggestedLayout: topicIdeas.suggestedLayout,
        aiPrompt: topicIdeas.aiPrompt,
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
      .where(
        and(eq(topicIdeas.id, id), eq(topicIdeas.workspaceId, workspaceId))
      )
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ item });
  } catch (error) {
    logger.error("Failed to fetch hit list item", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to fetch hit list item" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/hit-list/[id]
 *
 * Update a hit list item (status, priority, etc.)
 */
const updateHitListItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  status: z.enum(["saved", "in_progress", "published", "archived"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  targetPublishDate: z.string().datetime().nullable().optional(),
  estimatedTimeMinutes: z.number().int().min(0).max(9999).nullable().optional(),
  difficultyLevel: z
    .enum(["easy", "medium", "hard"])
    .nullable()
    .optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  hitListPosition: z.number().int().min(1).optional(),
  category: z.string().max(100).nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    const body = await request.json();
    const validatedData = updateHitListItemSchema.parse(body);

    // Verify item belongs to workspace
    const [existingItem] = await db
      .select({ id: topicIdeas.id })
      .from(topicIdeas)
      .where(
        and(eq(topicIdeas.id, id), eq(topicIdeas.workspaceId, workspaceId))
      )
      .limit(1);

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title;
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description;
    }
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
    }
    if (validatedData.priority !== undefined) {
      updateData.priority = validatedData.priority;
    }
    if (validatedData.targetPublishDate !== undefined) {
      updateData.targetPublishDate = validatedData.targetPublishDate
        ? new Date(validatedData.targetPublishDate)
        : null;
    }
    if (validatedData.estimatedTimeMinutes !== undefined) {
      updateData.estimatedTimeMinutes = validatedData.estimatedTimeMinutes;
    }
    if (validatedData.difficultyLevel !== undefined) {
      updateData.difficultyLevel = validatedData.difficultyLevel;
    }
    if (validatedData.assignedTo !== undefined) {
      updateData.assignedTo = validatedData.assignedTo;
    }
    if (validatedData.hitListPosition !== undefined) {
      updateData.hitListPosition = validatedData.hitListPosition;
    }
    if (validatedData.category !== undefined) {
      updateData.category = validatedData.category;
    }

    const [updatedItem] = await db
      .update(topicIdeas)
      .set(updateData)
      .where(eq(topicIdeas.id, id))
      .returning();

    logger.info("Hit list item updated", {
      itemId: updatedItem.id,
      workspaceId,
      updates: Object.keys(validatedData),
    });

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    logger.error("Failed to update hit list item", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to update hit list item" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/hit-list/[id]
 *
 * Remove an item from the hit list (doesn't delete the topic, just removes from hit list).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    // Verify item belongs to workspace
    const [existingItem] = await db
      .select({ id: topicIdeas.id })
      .from(topicIdeas)
      .where(
        and(eq(topicIdeas.id, id), eq(topicIdeas.workspaceId, workspaceId))
      )
      .limit(1);

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Remove from hit list by clearing hit list fields
    await db
      .update(topicIdeas)
      .set({
        hitListAddedAt: null,
        hitListPosition: null,
        priorityScore: null,
        priorityScoreBreakdown: null,
        updatedAt: new Date(),
      })
      .where(eq(topicIdeas.id, id));

    logger.info("Item removed from hit list", {
      itemId: id,
      workspaceId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to remove from hit list", error);

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to remove from hit list" },
      { status: 500 }
    );
  }
}

