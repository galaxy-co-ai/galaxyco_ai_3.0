import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { topicIdeas } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";
import { createErrorResponse } from "@/lib/api-error-handler";

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
      return createErrorResponse(new Error("Invalid item IDs"), "Reorder hit list validation");
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
    return createErrorResponse(error, "Reorder hit list error");
  }
}

