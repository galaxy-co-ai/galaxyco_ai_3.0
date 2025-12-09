/**
 * Task Delegation API
 *
 * POST /api/orchestration/delegate - Delegate a task from one agent to another
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { agents, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { AgentOrchestrator } from '@/lib/orchestration';

// Validation schema
const delegateTaskSchema = z.object({
  fromAgentId: z.string().uuid(),
  toAgentId: z.string().uuid(),
  taskDescription: z.string().min(1).max(2000),
  taskData: z.record(z.unknown()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

/**
 * POST /api/orchestration/delegate
 * Delegate a task from one agent to another
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user and workspace
    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!user?.activeWorkspaceId) {
      return NextResponse.json({ error: 'No active workspace' }, { status: 400 });
    }

    const workspaceId = user.activeWorkspaceId;

    // Parse and validate body
    const body = await request.json();
    const validation = delegateTaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { fromAgentId, toAgentId, taskDescription, taskData, priority } = validation.data;

    // Validate from agent
    const fromAgent = await db.query.agents.findFirst({
      where: and(
        eq(agents.id, fromAgentId),
        eq(agents.workspaceId, workspaceId)
      ),
    });

    if (!fromAgent) {
      return NextResponse.json(
        { error: 'Source agent not found' },
        { status: 400 }
      );
    }

    // Validate to agent
    const toAgent = await db.query.agents.findFirst({
      where: and(
        eq(agents.id, toAgentId),
        eq(agents.workspaceId, workspaceId)
      ),
    });

    if (!toAgent) {
      return NextResponse.json(
        { error: 'Target agent not found' },
        { status: 400 }
      );
    }

    if (toAgent.status !== 'active') {
      return NextResponse.json(
        { error: `Target agent is not active (status: ${toAgent.status})` },
        { status: 400 }
      );
    }

    logger.info('[Delegate API] Delegating task', {
      fromAgentId,
      fromAgentName: fromAgent.name,
      toAgentId,
      toAgentName: toAgent.name,
      taskDescription: taskDescription.substring(0, 100),
    });

    // Create orchestrator and delegate task
    const orchestrator = new AgentOrchestrator(workspaceId);
    const result = await orchestrator.delegateTask(
      fromAgentId,
      toAgentId,
      taskDescription,
      { ...taskData, priority }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delegate task' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      delegation: {
        messageId: result.messageId,
        taskId: result.taskId,
        fromAgent: {
          id: fromAgent.id,
          name: fromAgent.name,
        },
        toAgent: {
          id: toAgent.id,
          name: toAgent.name,
        },
        taskDescription,
        priority,
      },
    });
  } catch (error) {
    logger.error('[Delegate API] Failed to delegate task', error);
    return NextResponse.json(
      { error: 'Failed to delegate task' },
      { status: 500 }
    );
  }
}

