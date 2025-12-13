import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { dealPipelines, pipelineStages, deals } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';

const updateStageSchema = z.object({
  name: z.string().min(1, 'Stage name is required').max(50).optional(),
  description: z.string().max(200).optional().nullable(),
  color: z.string().max(7).optional(),
  displayOrder: z.number().optional(),
  probability: z.number().min(0).max(100).optional(),
  stageType: z.enum(['open', 'won', 'lost']).optional(),
  rottenAfterDays: z.number().min(1).optional().nullable(),
  autoMoveAfterDays: z.number().min(1).optional().nullable(),
  autoMoveToStageId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string; stageId: string }>;
}

/**
 * GET /api/crm/pipelines/[id]/stages/[stageId]
 * Get a single stage
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: pipelineId, stageId } = await context.params;

    // Verify pipeline exists and belongs to workspace
    const pipeline = await db.query.dealPipelines.findFirst({
      where: and(
        eq(dealPipelines.id, pipelineId),
        eq(dealPipelines.workspaceId, workspaceId)
      ),
    });

    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    const stage = await db.query.pipelineStages.findFirst({
      where: and(
        eq(pipelineStages.id, stageId),
        eq(pipelineStages.pipelineId, pipelineId)
      ),
    });

    if (!stage) {
      return NextResponse.json(
        { error: 'Stage not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(stage);
  } catch (error) {
    return createErrorResponse(error, 'Get stage error');
  }
}

/**
 * PUT /api/crm/pipelines/[id]/stages/[stageId]
 * Update a stage
 */
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: pipelineId, stageId } = await context.params;
    const body = await request.json();

    // Verify pipeline exists and belongs to workspace
    const pipeline = await db.query.dealPipelines.findFirst({
      where: and(
        eq(dealPipelines.id, pipelineId),
        eq(dealPipelines.workspaceId, workspaceId)
      ),
    });

    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    // Validate input
    const validationResult = updateStageSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check stage exists
    const existing = await db.query.pipelineStages.findFirst({
      where: and(
        eq(pipelineStages.id, stageId),
        eq(pipelineStages.pipelineId, pipelineId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Stage not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;
    if (data.probability !== undefined) updateData.probability = data.probability;
    if (data.stageType !== undefined) updateData.stageType = data.stageType;
    if (data.rottenAfterDays !== undefined) updateData.rottenAfterDays = data.rottenAfterDays;
    if (data.autoMoveAfterDays !== undefined) updateData.autoMoveAfterDays = data.autoMoveAfterDays;
    if (data.autoMoveToStageId !== undefined) updateData.autoMoveToStageId = data.autoMoveToStageId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Update stage
    const [updated] = await db
      .update(pipelineStages)
      .set(updateData)
      .where(and(
        eq(pipelineStages.id, stageId),
        eq(pipelineStages.pipelineId, pipelineId)
      ))
      .returning();

    return NextResponse.json(updated);
  } catch (error) {
    return createErrorResponse(error, 'Update stage error');
  }
}

/**
 * DELETE /api/crm/pipelines/[id]/stages/[stageId]
 * Delete a stage
 * Note: Cannot delete if there are deals in this stage
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: pipelineId, stageId } = await context.params;

    // Verify pipeline exists and belongs to workspace
    const pipeline = await db.query.dealPipelines.findFirst({
      where: and(
        eq(dealPipelines.id, pipelineId),
        eq(dealPipelines.workspaceId, workspaceId)
      ),
    });

    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    // Check stage exists
    const existing = await db.query.pipelineStages.findFirst({
      where: and(
        eq(pipelineStages.id, stageId),
        eq(pipelineStages.pipelineId, pipelineId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Stage not found' },
        { status: 404 }
      );
    }

    // Check if there are deals using this stage
    const dealsUsingStage = await db
      .select({ count: count() })
      .from(deals)
      .where(eq(deals.stageId, stageId));

    if (dealsUsingStage[0]?.count > 0) {
      return NextResponse.json(
        { error: `Cannot delete stage. ${dealsUsingStage[0].count} deals are in this stage.` },
        { status: 409 }
      );
    }

    // Delete stage
    await db
      .delete(pipelineStages)
      .where(and(
        eq(pipelineStages.id, stageId),
        eq(pipelineStages.pipelineId, pipelineId)
      ));

    // Update stage count on pipeline
    const remainingStages = await db.query.pipelineStages.findMany({
      where: eq(pipelineStages.pipelineId, pipelineId),
    });

    await db
      .update(dealPipelines)
      .set({ stageCount: remainingStages.length })
      .where(eq(dealPipelines.id, pipelineId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete stage error');
  }
}
