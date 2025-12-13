import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { dealPipelines, pipelineStages } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';

const pipelineSchema = z.object({
  name: z.string().min(1, 'Pipeline name is required').max(100),
  description: z.string().max(500).optional(),
  color: z.string().max(7).optional(), // Hex color
  isDefault: z.boolean().optional().default(false),
  displayOrder: z.number().optional(),
});

/**
 * GET /api/crm/pipelines
 * List all pipelines for the workspace with their stages
 */
export async function GET(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Get all pipelines with their stages
    const pipelines = await db.query.dealPipelines.findMany({
      where: eq(dealPipelines.workspaceId, workspaceId),
      with: {
        stages: {
          orderBy: [asc(pipelineStages.displayOrder)],
        },
      },
      orderBy: [asc(dealPipelines.displayOrder), asc(dealPipelines.createdAt)],
    });

    return NextResponse.json(pipelines);
  } catch (error) {
    return createErrorResponse(error, 'Get pipelines error');
  }
}

/**
 * POST /api/crm/pipelines
 * Create a new pipeline with optional default stages
 */
export async function POST(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const body = await request.json();

    // Validate input
    const validationResult = pipelineSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // If this is set as default, unset any existing default
    if (data.isDefault) {
      await db
        .update(dealPipelines)
        .set({ isDefault: false })
        .where(and(
          eq(dealPipelines.workspaceId, workspaceId),
          eq(dealPipelines.isDefault, true)
        ));
    }

    // Get max display order
    const existingPipelines = await db.query.dealPipelines.findMany({
      where: eq(dealPipelines.workspaceId, workspaceId),
    });
    const maxOrder = Math.max(...existingPipelines.map(p => p.displayOrder), -1);

    // Create pipeline
    const [pipeline] = await db
      .insert(dealPipelines)
      .values({
        workspaceId,
        name: data.name,
        description: data.description,
        color: data.color,
        isDefault: data.isDefault,
        displayOrder: data.displayOrder ?? maxOrder + 1,
        createdBy: userId,
      })
      .returning();

    // Create default stages if this is a new pipeline
    const defaultStages = [
      { name: 'New', color: '#6366f1', probability: 10, stageType: 'open' as const, displayOrder: 0 },
      { name: 'Qualified', color: '#8b5cf6', probability: 30, stageType: 'open' as const, displayOrder: 1 },
      { name: 'Proposal', color: '#a855f7', probability: 50, stageType: 'open' as const, displayOrder: 2 },
      { name: 'Negotiation', color: '#d946ef', probability: 70, stageType: 'open' as const, displayOrder: 3 },
      { name: 'Won', color: '#22c55e', probability: 100, stageType: 'won' as const, displayOrder: 4 },
      { name: 'Lost', color: '#ef4444', probability: 0, stageType: 'lost' as const, displayOrder: 5 },
    ];

    const stages = await db
      .insert(pipelineStages)
      .values(defaultStages.map(stage => ({
        pipelineId: pipeline.id,
        ...stage,
      })))
      .returning();

    // Update stage count
    await db
      .update(dealPipelines)
      .set({ stageCount: stages.length })
      .where(eq(dealPipelines.id, pipeline.id));

    // Return pipeline with stages
    return NextResponse.json({
      ...pipeline,
      stageCount: stages.length,
      stages,
    }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Create pipeline error');
  }
}
