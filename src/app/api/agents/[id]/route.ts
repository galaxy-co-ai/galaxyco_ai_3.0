import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { agents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';
import { broadcastActivity } from '@/lib/pusher-server';
import { logger } from '@/lib/logger';

const updateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
  config: z.record(z.unknown()).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    const agent = await db.query.agents.findFirst({
      where: and(
        eq(agents.id, id),
        eq(agents.workspaceId, workspaceId)
      ),
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(agent);
  } catch (error) {
    return createErrorResponse(error, 'Get agent error');
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = updateAgentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Check if agent exists and belongs to workspace
    const existingAgent = await db.query.agents.findFirst({
      where: and(
        eq(agents.id, id),
        eq(agents.workspaceId, workspaceId)
      ),
    });

    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    const data = validationResult.data;

    // Update agent
    const [updatedAgent] = await db
      .update(agents)
      .set({
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status && { status: data.status }),
        ...(data.config && { config: data.config }),
        updatedAt: new Date(),
      })
      .where(and(
        eq(agents.id, id),
        eq(agents.workspaceId, workspaceId)
      ))
      .returning();

    // Broadcast real-time activity event (non-blocking)
    broadcastActivity(workspaceId, {
      id: updatedAgent.id,
      type: 'agent:updated',
      title: 'Agent updated',
      description: `${updatedAgent.name} was updated`,
      entityType: 'agent',
      entityId: updatedAgent.id,
    }).catch(err => {
      logger.error('Activity broadcast failed (non-critical)', err);
    });

    return NextResponse.json({
      id: updatedAgent.id,
      name: updatedAgent.name,
      description: updatedAgent.description,
      type: updatedAgent.type,
      status: updatedAgent.status,
      executionCount: updatedAgent.executionCount,
      lastExecutedAt: updatedAgent.lastExecutedAt,
      updatedAt: updatedAgent.updatedAt,
    });
  } catch (error) {
    return createErrorResponse(error, 'Update agent error');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    // Check if agent exists and belongs to workspace
    const existingAgent = await db.query.agents.findFirst({
      where: and(
        eq(agents.id, id),
        eq(agents.workspaceId, workspaceId)
      ),
    });

    if (!existingAgent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Delete agent
    await db
      .delete(agents)
      .where(and(
        eq(agents.id, id),
        eq(agents.workspaceId, workspaceId)
      ));

    // Broadcast real-time activity event (non-blocking)
    broadcastActivity(workspaceId, {
      id,
      type: 'agent:deleted',
      title: 'Agent deleted',
      description: `${existingAgent.name} was deleted`,
      entityType: 'agent',
      entityId: id,
    }).catch(err => {
      logger.error('Activity broadcast failed (non-critical)', err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete agent error');
  }
}

