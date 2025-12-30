import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { useCases } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";
import { generateUseCaseRoadmap } from "@/lib/ai/use-case-roadmap-generator";
import { rateLimit } from "@/lib/rate-limit";
import { createErrorResponse } from "@/lib/api-error-handler";

// UUID validation regex
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/admin/use-cases/[id]/generate-roadmap
 *
 * Generate an AI roadmap based on all wizard inputs.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, workspace } = await getCurrentWorkspace();
    const { id } = await params;

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return createErrorResponse(new Error("Invalid use case ID format"), "Generate roadmap validation");
    }

    // Rate limit
    const rateLimitResult = await rateLimit(
      `use-case-roadmap:${workspaceId}`,
      10,
      60
    );
    if (!rateLimitResult.success) {
      return createErrorResponse(new Error("Too many requests: rate limit exceeded"), "Generate roadmap rate limit");
    }

    // Get the use case
    const [useCase] = await db
      .select()
      .from(useCases)
      .where(
        and(eq(useCases.id, id), eq(useCases.workspaceId, workspaceId))
      )
      .limit(1);

    if (!useCase) {
      return createErrorResponse(new Error("Use case not found"), "Generate roadmap");
    }

    // Check that we have enough data to generate a roadmap
    if (!useCase.personas || useCase.personas.length === 0) {
      return createErrorResponse(new Error("Invalid request: please add at least one persona before generating a roadmap"), "Generate roadmap validation");
    }

    // Generate the roadmap
    const roadmap = await generateUseCaseRoadmap({
      name: useCase.name,
      description: useCase.description || "",
      category: useCase.category,
      personas: useCase.personas,
      platformTools: useCase.platformTools || [],
      journeyStages: useCase.journeyStages || [],
      messaging: useCase.messaging,
      workspaceName: workspace.name || "Your Company",
    });

    // Save the generated roadmap
    const [updatedUseCase] = await db
      .update(useCases)
      .set({
        roadmap,
        status: "complete",
        updatedAt: new Date(),
      })
      .where(
        and(eq(useCases.id, id), eq(useCases.workspaceId, workspaceId))
      )
      .returning();

    logger.info("Use case roadmap generated", {
      useCaseId: id,
      stepCount: roadmap.length,
    });

    return NextResponse.json({
      useCase: updatedUseCase,
      roadmap,
    });
  } catch (error) {
    return createErrorResponse(error, "Generate roadmap error");
  }
}

