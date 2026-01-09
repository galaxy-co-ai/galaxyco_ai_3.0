import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { agents, agentExecutions, workspaces } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';
import { broadcastActivity, broadcastAgentStatus } from '@/lib/pusher-server';
import { logger } from '@/lib/logger';
import { expensiveOperationLimit } from '@/lib/rate-limit';
import { checkConcurrentRunLimit, type WorkspaceTier } from '@/lib/cost-protection';

type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

const executeSchema = z.object({
  input: z.record(z.unknown()).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId, user } = await getCurrentWorkspace();
    const { id: agentId } = await params;

    // Rate limit for agent executions (10 per minute)
    const rateLimitResult = await expensiveOperationLimit(`agent:execute:${userId}`);
    if (!rateLimitResult.success) {
      logger.warn('Agent execution rate limit exceeded', { userId, agentId });
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before running more agents.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
          },
        }
      );
    }

    // Get workspace tier for concurrent run limits
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
      columns: { subscriptionTier: true },
    });
    const workspaceTier = (workspace?.subscriptionTier || 'free') as WorkspaceTier;

    // Check concurrent runs limit
    const concurrentCheck = await checkConcurrentRunLimit(workspaceId, workspaceTier);
    if (!concurrentCheck.allowed) {
      logger.warn('Concurrent agent runs limit exceeded', {
        workspaceId,
        tier: workspaceTier,
        currentRuns: concurrentCheck.currentRuns,
      });
      return NextResponse.json(
        { error: concurrentCheck.reason || 'Too many concurrent agent runs. Please wait for current runs to complete.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = executeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Check if agent exists and belongs to workspace
    const agent = await db.query.agents.findFirst({
      where: and(
        eq(agents.id, agentId),
        eq(agents.workspaceId, workspaceId)
      ),
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Check if agent is active
    if (agent.status !== 'active') {
      return NextResponse.json(
        { error: 'Agent is not active', status: agent.status },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create execution record with status 'pending'
    const [execution] = await db
      .insert(agentExecutions)
      .values({
        workspaceId,
        agentId,
        triggeredBy: userId,
        status: 'pending',
        input: data.input || {},
      })
      .returning();

    // Broadcast agent:started event
    const userName = user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || 'User';

    broadcastActivity(workspaceId, {
      id: execution.id,
      type: 'agent:started',
      title: `${agent.name} started`,
      description: `Execution triggered by ${userName}`,
      entityType: 'agent',
      entityId: agentId,
      userId,
      metadata: {
        agentId,
        agentName: agent.name,
        agentType: agent.type,
        status: 'running' as ExecutionStatus,
        triggeredBy: { id: userId, name: userName },
      },
    }).catch(err => {
      logger.error('Activity broadcast failed (non-critical)', err);
    });

    broadcastAgentStatus(workspaceId, 'started', {
      id: agentId,
      executionId: execution.id,
      name: agent.name,
    }).catch(err => {
      logger.error('Agent status broadcast failed (non-critical)', err);
    });

    // Update execution status to 'running'
    await db
      .update(agentExecutions)
      .set({
        status: 'running',
        startedAt: new Date(),
      })
      .where(eq(agentExecutions.id, execution.id));

    // For now, simulate a quick execution (actual agent logic would go here)
    // In a real implementation, this would call Trigger.dev or run the agent
    const startTime = Date.now();

    // Simulate execution result
    const executionResult = {
      success: true,
      output: {
        message: `Agent ${agent.name} executed successfully`,
        timestamp: new Date().toISOString(),
      },
    };

    const durationMs = Date.now() - startTime;

    // Update execution with result
    const [completedExecution] = await db
      .update(agentExecutions)
      .set({
        status: executionResult.success ? 'completed' : 'failed',
        output: executionResult.output,
        durationMs,
        completedAt: new Date(),
      })
      .where(eq(agentExecutions.id, execution.id))
      .returning();

    // Update agent's execution count and last executed time
    await db
      .update(agents)
      .set({
        executionCount: sql`${agents.executionCount} + 1`,
        lastExecutedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(agents.id, agentId));

    // Broadcast completion event
    const completionEvent = executionResult.success ? 'agent:completed' : 'agent:failed';
    
    broadcastActivity(workspaceId, {
      id: execution.id,
      type: completionEvent,
      title: executionResult.success 
        ? `${agent.name} completed` 
        : `${agent.name} failed`,
      description: executionResult.success
        ? `Completed in ${durationMs}ms`
        : 'Execution failed',
      entityType: 'agent',
      entityId: agentId,
      userId,
      metadata: {
        agentId,
        agentName: agent.name,
        agentType: agent.type,
        status: (executionResult.success ? 'completed' : 'failed') as ExecutionStatus,
        durationMs,
        triggeredBy: { id: userId, name: userName },
      },
    }).catch(err => {
      logger.error('Activity broadcast failed (non-critical)', err);
    });

    const agentStatus = executionResult.success ? 'completed' : 'failed';
    broadcastAgentStatus(workspaceId, agentStatus, {
      id: agentId,
      executionId: execution.id,
      name: agent.name,
    }).catch(err => {
      logger.error('Agent status broadcast failed (non-critical)', err);
    });

    return NextResponse.json({
      execution: {
        id: completedExecution.id,
        agentId: completedExecution.agentId,
        status: completedExecution.status,
        input: completedExecution.input,
        output: completedExecution.output,
        durationMs: completedExecution.durationMs,
        startedAt: completedExecution.startedAt,
        completedAt: completedExecution.completedAt,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Execute agent error');
  }
}
