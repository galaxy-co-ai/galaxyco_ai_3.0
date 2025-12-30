import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { useCases, users } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";
import { createErrorResponse } from "@/lib/api-error-handler";

// UUID validation regex
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/admin/use-cases/[id]
 *
 * Get a single use case by ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return createErrorResponse(new Error("Invalid use case ID format"), "Get use case validation");
    }

    const [useCase] = await db
      .select({
        id: useCases.id,
        workspaceId: useCases.workspaceId,
        name: useCases.name,
        description: useCases.description,
        category: useCases.category,
        status: useCases.status,
        personas: useCases.personas,
        platformTools: useCases.platformTools,
        journeyStages: useCases.journeyStages,
        messaging: useCases.messaging,
        onboardingQuestions: useCases.onboardingQuestions,
        roadmap: useCases.roadmap,
        createdBy: useCases.createdBy,
        publishedAt: useCases.publishedAt,
        createdAt: useCases.createdAt,
        updatedAt: useCases.updatedAt,
        createdByUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(useCases)
      .leftJoin(users, eq(useCases.createdBy, users.id))
      .where(
        and(eq(useCases.id, id), eq(useCases.workspaceId, workspaceId))
      )
      .limit(1);

    if (!useCase) {
      return createErrorResponse(new Error("Use case not found"), "Get use case");
    }

    return NextResponse.json({ useCase });
  } catch (error) {
    return createErrorResponse(error, "Get use case error");
  }
}

// Zod schemas for validation
const personaSchema = z.object({
  name: z.string().min(1).max(100),
  role: z.string().max(200).optional().default(""),
  goals: z.array(z.string().max(300)).max(10).optional().default([]),
  painPoints: z.array(z.string().max(300)).max(10).optional().default([]),
});

const journeyStageSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(""),
  actions: z.array(z.string().max(300)).max(10).optional().default([]),
  tools: z.array(z.string().max(100)).max(10).optional().default([]),
});

const messagingSchema = z.object({
  tagline: z.string().max(200).optional(),
  valueProposition: z.string().max(1000).optional(),
  targetChannels: z.array(z.string().max(100)).max(10).optional(),
});

const onboardingQuestionSchema = z.object({
  question: z.string().min(1).max(300),
  options: z.array(z.string().max(200)).min(2).max(6),
  matchingWeight: z.number().int().min(0).max(100).default(50),
});

const roadmapStepSchema = z.object({
  step: z.number().int().min(1),
  title: z.string().max(200),
  description: z.string().max(1000),
  estimatedMinutes: z.number().int().min(1).max(480),
  tools: z.array(z.string().max(100)).max(10),
});

/**
 * PATCH /api/admin/use-cases/[id]
 *
 * Update a use case (partial updates for wizard steps).
 */
const updateUseCaseSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  category: z
    .enum([
      "b2b_saas",
      "b2c_app",
      "agency",
      "enterprise",
      "solopreneur",
      "ecommerce",
      "creator",
      "consultant",
      "internal_team",
      "other",
    ])
    .optional(),
  status: z.enum(["draft", "complete", "published", "archived"]).optional(),
  personas: z.array(personaSchema).max(5).optional(),
  platformTools: z.array(z.string().max(100)).max(50).optional(),
  journeyStages: z.array(journeyStageSchema).max(10).optional(),
  messaging: messagingSchema.optional().nullable(),
  onboardingQuestions: z.array(onboardingQuestionSchema).max(10).optional(),
  roadmap: z.array(roadmapStepSchema).max(20).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return createErrorResponse(new Error("Invalid use case ID format"), "Update use case validation");
    }

    const body = await request.json();
    const validatedData = updateUseCaseSchema.parse(body);

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined)
      updateData.description = validatedData.description;
    if (validatedData.category !== undefined)
      updateData.category = validatedData.category;
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
      // Set publishedAt when publishing
      if (validatedData.status === "published") {
        updateData.publishedAt = new Date();
      }
    }
    if (validatedData.personas !== undefined)
      updateData.personas = validatedData.personas;
    if (validatedData.platformTools !== undefined)
      updateData.platformTools = validatedData.platformTools;
    if (validatedData.journeyStages !== undefined)
      updateData.journeyStages = validatedData.journeyStages;
    if (validatedData.messaging !== undefined)
      updateData.messaging = validatedData.messaging;
    if (validatedData.onboardingQuestions !== undefined)
      updateData.onboardingQuestions = validatedData.onboardingQuestions;
    if (validatedData.roadmap !== undefined)
      updateData.roadmap = validatedData.roadmap;

    const [updatedUseCase] = await db
      .update(useCases)
      .set(updateData)
      .where(
        and(eq(useCases.id, id), eq(useCases.workspaceId, workspaceId))
      )
      .returning();

    if (!updatedUseCase) {
      return createErrorResponse(new Error("Use case not found"), "Update use case");
    }

    logger.info("Use case updated", {
      useCaseId: id,
      changes: Object.keys(validatedData),
    });

    return NextResponse.json({ useCase: updatedUseCase });
  } catch (error) {
    return createErrorResponse(error, "Update use case error");
  }
}

/**
 * DELETE /api/admin/use-cases/[id]
 *
 * Delete a use case.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    // Validate UUID format
    if (!id || !UUID_REGEX.test(id)) {
      return createErrorResponse(new Error("Invalid use case ID format"), "Delete use case validation");
    }

    const [deletedUseCase] = await db
      .delete(useCases)
      .where(
        and(eq(useCases.id, id), eq(useCases.workspaceId, workspaceId))
      )
      .returning({ id: useCases.id });

    if (!deletedUseCase) {
      return createErrorResponse(new Error("Use case not found"), "Delete use case");
    }

    logger.info("Use case deleted", { useCaseId: id });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    return createErrorResponse(error, "Delete use case error");
  }
}

