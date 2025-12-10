import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { topicIdeas } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";

/**
 * POST /api/admin/hit-list/reorder
 *
 * Manually reorder hit list items.
 * Accepts an array of item IDs in the desired order.
 */
const reorderSchema = z.object({
  itemIds: z.array(z.string().uuid()).min(1, "At least one item ID is required"),
});

export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const body = await request.json();
    const validatedData = reorderSchema.parse(body);

    const { itemIds } = validatedData;

    // Verify all items belong to workspace
    const existingItems = await db
      .select({ id: topicIdeas.id })
      .from(topicIdeas)
      .where(eq(topicIdeas.workspaceId, workspaceId));

    const existingIds = new Set(existingItems.map((item) => item.id));
    const invalidIds = itemIds.filter((id) => !existingIds.has(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          error: "Invalid item IDs",
          invalidIds,
        },
        { status: 400 }
      );
    }

    // Update positions in a transaction-like manner
    // Position starts at 1 and increments by 1 for each item
    const updatePromises = itemIds.map((itemId, index) =>
      db
        .update(topicIdeas)
        .set({
          hitListPosition: index + 1,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(topicIdeas.id, itemId),
            eq(topicIdeas.workspaceId, workspaceId)
          )
        )
    );

    await Promise.all(updatePromises);

    logger.info("Hit list reordered", {
      workspaceId,
      itemCount: itemIds.length,
    });

    return NextResponse.json({
      success: true,
      reorderedCount: itemIds.length,
    });
  } catch (error) {
    logger.error("Failed to reorder hit list", error);

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
      { error: "Failed to reorder hit list" },
      { status: 500 }
    );
  }
}

