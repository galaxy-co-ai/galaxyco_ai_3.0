import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { topicIdeas } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";

/**
 * PATCH /api/admin/hit-list/[id]/progress
 *
 * Update the wizard progress when writing an article.
 */
const updateProgressSchema = z.object({
  currentStep: z.string().optional(),
  completedSteps: z.array(z.string()).optional(),
  reset: z.boolean().optional(), // If true, clears all progress
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    const body = await request.json();
    const validatedData = updateProgressSchema.parse(body);

    // Verify item belongs to workspace
    const [existingItem] = await db
      .select({
        id: topicIdeas.id,
        wizardProgress: topicIdeas.wizardProgress,
      })
      .from(topicIdeas)
      .where(
        and(eq(topicIdeas.id, id), eq(topicIdeas.workspaceId, workspaceId))
      )
      .limit(1);

    if (!existingItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    let newProgress: typeof topicIdeas.$inferSelect.wizardProgress;

    if (validatedData.reset) {
      // Reset progress
      newProgress = null;
    } else {
      // Merge with existing progress
      const currentProgress = existingItem.wizardProgress || {};

      newProgress = {
        ...currentProgress,
        currentStep:
          validatedData.currentStep ?? currentProgress.currentStep ?? undefined,
        completedSteps:
          validatedData.completedSteps ??
          currentProgress.completedSteps ??
          undefined,
        startedAt:
          currentProgress.startedAt ?? new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      };
    }

    // Update status to in_progress if starting wizard
    const shouldUpdateStatus =
      !validatedData.reset &&
      validatedData.currentStep &&
      !existingItem.wizardProgress?.startedAt;

    const [updatedItem] = await db
      .update(topicIdeas)
      .set({
        wizardProgress: newProgress,
        status: shouldUpdateStatus ? "in_progress" : undefined,
        updatedAt: new Date(),
      })
      .where(eq(topicIdeas.id, id))
      .returning();

    logger.info("Hit list item progress updated", {
      itemId: updatedItem.id,
      workspaceId,
      currentStep: validatedData.currentStep,
      reset: validatedData.reset,
    });

    return NextResponse.json({ item: updatedItem });
  } catch (error) {
    logger.error("Failed to update progress", error);

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
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}

