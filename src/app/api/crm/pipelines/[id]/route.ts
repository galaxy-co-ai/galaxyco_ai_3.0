import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { dealPipelines, pipelineStages, deals } from '@/db/schema';
import { eq, and, asc, count } from 'drizzle-orm';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';

const updatePipelineSchema = z.object({
  name: z.string().min(1, 'Pipeline name is required').max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  color: z.string().max(7).optional().nullable(),
  isDefault: z.boolean().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/crm/pipelines/[id]
 * Get a single pipeline with its stages and deal counts
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await context.params;

    const pipeline = await db.query.dealPipelines.findFirst({
      where: and(
        eq(dealPipelines.id, id),
        eq(dealPipelines.workspaceId, workspaceId)
      ),
      with: {
        stages: {
          orderBy: [asc(pipelineStages.displayOrder)],
        },
      },
    });

    if (!pipeline) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(pipeline);
  } catch (error) {
    return createErrorResponse(error, 'Get pipeline error');
  }
}

/**
 * PUT /api/crm/pipelines/[id]
 * Update a pipeline
 */
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await context.params;
    const body = await request.json();

    // Validate input
    const validationResult = updatePipelineSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check pipeline exists and belongs to workspace
    const existing = await db.query.dealPipelines.findFirst({
      where: and(
        eq(dealPipelines.id, id),
        eq(dealPipelines.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset any existing default
    if (data.isDefault) {
      await db
        .update(dealPipelines)
        .set({ isDefault: false })
        .where(and(
          eq(dealPipelines.workspaceId, workspaceId),
          eq(dealPipelines.isDefault, true)
        ));
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.isDefault !== undefined) updateData.isDefault = data.isDefault;
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Update pipeline
    const [updated] = await db
      .update(dealPipelines)
      .set(updateData)
      .where(and(
        eq(dealPipelines.id, id),
        eq(dealPipelines.workspaceId, workspaceId)
      ))
      .returning();

    // Return with stages
    const pipeline = await db.query.dealPipelines.findFirst({
      where: eq(dealPipelines.id, id),
      with: {
        stages: {
          orderBy: [asc(pipelineStages.displayOrder)],
        },
      },
    });

    return NextResponse.json(pipeline);
  } catch (error) {
    return createErrorResponse(error, 'Update pipeline error');
  }
}

/**
 * DELETE /api/crm/pipelines/[id]
 * Delete a pipeline (and all its stages)
 * Note: Cannot delete if there are deals assigned to this pipeline
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await context.params;

    // Check pipeline exists and belongs to workspace
    const existing = await db.query.dealPipelines.findFirst({
      where: and(
        eq(dealPipelines.id, id),
        eq(dealPipelines.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Pipeline not found' },
        { status: 404 }
      );
    }

    // Check if there are deals using this pipeline
    const dealsUsingPipeline = await db
      .select({ count: count() })
      .from(deals)
      .where(eq(deals.pipelineId, id));

    if (dealsUsingPipeline[0]?.count > 0) {
      return NextResponse.json(
        { error: `Cannot delete pipeline. ${dealsUsingPipeline[0].count} deals are using this pipeline.` },
        { status: 409 }
      );
    }

    // Delete pipeline (stages will cascade delete)
    await db
      .delete(dealPipelines)
      .where(and(
        eq(dealPipelines.id, id),
        eq(dealPipelines.workspaceId, workspaceId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete pipeline error');
  }
}
