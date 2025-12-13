import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { dealPipelines, pipelineStages } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';

const stageSchema = z.object({
  name: z.string().min(1, 'Stage name is required').max(50),
  description: z.string().max(200).optional(),
  color: z.string().max(7).default('#6366f1'),
  displayOrder: z.number().optional(),
  probability: z.number().min(0).max(100).default(50),
  stageType: z.enum(['open', 'won', 'lost']).default('open'),
  rottenAfterDays: z.number().min(1).optional().nullable(),
  autoMoveAfterDays: z.number().min(1).optional().nullable(),
  autoMoveToStageId: z.string().uuid().optional().nullable(),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/crm/pipelines/[id]/stages
 * List all stages for a pipeline
 */
export async function GET(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: pipelineId } = await context.params;

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

    // Get stages
    const stages = await db.query.pipelineStages.findMany({
      where: eq(pipelineStages.pipelineId, pipelineId),
      orderBy: [asc(pipelineStages.displayOrder)],
    });

    return NextResponse.json(stages);
  } catch (error) {
    return createErrorResponse(error, 'Get stages error');
  }
}

/**
 * POST /api/crm/pipelines/[id]/stages
 * Create a new stage in the pipeline
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: pipelineId } = await context.params;
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
    const validationResult = stageSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Get max display order
    const existingStages = await db.query.pipelineStages.findMany({
      where: eq(pipelineStages.pipelineId, pipelineId),
    });
    const maxOrder = Math.max(...existingStages.map(s => s.displayOrder), -1);

    // Create stage
    const [stage] = await db
      .insert(pipelineStages)
      .values({
        pipelineId,
        name: data.name,
        description: data.description,
        color: data.color,
        displayOrder: data.displayOrder ?? maxOrder + 1,
        probability: data.probability,
        stageType: data.stageType,
        rottenAfterDays: data.rottenAfterDays,
        autoMoveAfterDays: data.autoMoveAfterDays,
        autoMoveToStageId: data.autoMoveToStageId,
      })
      .returning();

    // Update stage count on pipeline
    await db
      .update(dealPipelines)
      .set({ stageCount: existingStages.length + 1 })
      .where(eq(dealPipelines.id, pipelineId));

    return NextResponse.json(stage, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Create stage error');
  }
}

/**
 * PUT /api/crm/pipelines/[id]/stages
 * Bulk update stage order (for drag-and-drop reordering)
 * Body: { stages: [{ id: string, displayOrder: number }] }
 */
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: pipelineId } = await context.params;
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

    const reorderSchema = z.object({
      stages: z.array(z.object({
        id: z.string().uuid(),
        displayOrder: z.number(),
      })),
    });

    const validationResult = reorderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { stages } = validationResult.data;

    // Update each stage's order
    await Promise.all(
      stages.map(({ id, displayOrder }) =>
        db
          .update(pipelineStages)
          .set({ displayOrder, updatedAt: new Date() })
          .where(and(
            eq(pipelineStages.id, id),
            eq(pipelineStages.pipelineId, pipelineId)
          ))
      )
    );

    // Return updated stages
    const updatedStages = await db.query.pipelineStages.findMany({
      where: eq(pipelineStages.pipelineId, pipelineId),
      orderBy: [asc(pipelineStages.displayOrder)],
    });

    return NextResponse.json(updatedStages);
  } catch (error) {
    return createErrorResponse(error, 'Reorder stages error');
  }
}
