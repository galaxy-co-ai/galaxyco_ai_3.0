import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { agents, agentExecutions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

const updateWorkflowSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
  trigger: z.any().optional(),
  systemPrompt: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();
    const userId = user?.id || 'anonymous';

    const rateLimitResult = await rateLimit(`workflows:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

    const { id } = await params;

    const agent = await db.query.agents.findFirst({
      where: and(
        eq(agents.id, id),
        eq(agents.workspaceId, workspaceId)
      ),
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      type: agent.type,
      status: agent.status,
      config: agent.config,
      executionCount: agent.executionCount,
      lastExecutedAt: agent.lastExecutedAt,
      createdAt: agent.createdAt,
      updatedAt: agent.updatedAt,
    });
  } catch (error) {
    return createErrorResponse(error, 'Get workflow error');
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();
    const userId = user?.id || 'anonymous';

    const rateLimitResult = await rateLimit(`workflows:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

    const { id } = await params;
    const body = await request.json();

    const validationResult = updateWorkflowSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Check if workflow exists
    const existing = await db.query.agents.findFirst({
      where: and(
        eq(agents.id, id),
        eq(agents.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    const data = validationResult.data;
    const existingConfig = (existing.config || {}) as Record<string, unknown>;

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;

    // Merge config updates
    if (data.nodes !== undefined || data.edges !== undefined || data.trigger !== undefined || data.systemPrompt !== undefined) {
      updateData.config = {
        ...existingConfig,
        ...(data.nodes !== undefined && { nodes: data.nodes }),
        ...(data.edges !== undefined && { edges: data.edges }),
        ...(data.trigger !== undefined && { trigger: data.trigger }),
        ...(data.systemPrompt !== undefined && { systemPrompt: data.systemPrompt }),
      };
    }

    const [updated] = await db
      .update(agents)
      .set(updateData)
      .where(and(
        eq(agents.id, id),
        eq(agents.workspaceId, workspaceId)
      ))
      .returning();

    logger.info('Workflow updated', { id: updated.id, workspaceId });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      description: updated.description,
      type: updated.type,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    return createErrorResponse(error, 'Update workflow error');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();
    const userId = user?.id || 'anonymous';

    const rateLimitResult = await rateLimit(`workflows:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

    const { id } = await params;

    // Check if workflow exists
    const existing = await db.query.agents.findFirst({
      where: and(
        eq(agents.id, id),
        eq(agents.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Delete execution logs first
    await db
      .delete(agentExecutions)
      .where(eq(agentExecutions.agentId, id));

    // Delete the agent/workflow
    await db
      .delete(agents)
      .where(and(
        eq(agents.id, id),
        eq(agents.workspaceId, workspaceId)
      ));

    logger.info('Workflow deleted', { id, workspaceId });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete workflow error');
  }
}
