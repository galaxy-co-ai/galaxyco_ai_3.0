import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { topicIdeas } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";

/**
 * Progress stages for the Article Studio wizard flow
 */
const WIZARD_STAGES = [
  "topic_selected",
  "brainstorm_started",
  "outline_created",
  "writing_started",
  "first_draft_complete",
  "editing",
  "ready_to_publish",
  "published",
] as const;

type WizardStage = (typeof WIZARD_STAGES)[number];

/**
 * PATCH /api/admin/hit-list/[id]/progress
 *
 * Update the wizard progress when writing an article.
 */
const updateProgressSchema = z.object({
  currentStep: z.string().optional(),
  completedSteps: z.array(z.string()).optional(),
  stage: z.enum(WIZARD_STAGES).optional(), // New: named stage
  percentage: z.number().min(0).max(100).optional(), // New: percentage
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

      // Handle stage-based updates (new flow)
      const currentStep = validatedData.stage ?? validatedData.currentStep ?? currentProgress.currentStep;
      
      // Build completed steps array
      let completedSteps = validatedData.completedSteps ?? currentProgress.completedSteps ?? [];
      
      // If a stage is provided, add it to completed steps if not already present
      if (validatedData.stage && !completedSteps.includes(validatedData.stage)) {
        completedSteps = [...completedSteps, validatedData.stage];
      }

      newProgress = {
        ...currentProgress,
        currentStep,
        completedSteps,
        percentage: validatedData.percentage ?? currentProgress.percentage,
        startedAt: currentProgress.startedAt ?? new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      };
    }

    // Determine status update based on progress
    let statusUpdate: "in_progress" | "published" | undefined = undefined;
    
    if (!validatedData.reset) {
      // If stage is 'published', set status to 'published'
      if (validatedData.stage === "published") {
        statusUpdate = "published";
      }
      // If starting wizard for first time, set status to 'in_progress'
      else if (
        (validatedData.currentStep || validatedData.stage) &&
        !existingItem.wizardProgress?.startedAt
      ) {
        statusUpdate = "in_progress";
      }
    }

    const [updatedItem] = await db
      .update(topicIdeas)
      .set({
        wizardProgress: newProgress,
        status: statusUpdate,
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

