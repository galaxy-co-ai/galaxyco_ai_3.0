import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { agents, agentExecutions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { executeAgentTask } from '@/trigger/workflow-executor';

const runAgentSchema = z.object({
  task: z.string().optional(),
  message: z.string().optional(),
  inputs: z.record(z.unknown()).optional(),
  testMode: z.boolean().default(false),
});

/**
 * POST: Run an agent with optional task/message
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { id: agentId } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = runAgentSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse(new Error('Validation failed: invalid input'), 'Run agent validation error');
    }

    const { task, message, inputs, testMode } = validationResult.data;

    // Get the agent
    const agent = await db.query.agents.findFirst({
      where: and(eq(agents.id, agentId), eq(agents.workspaceId, workspaceId)),
    });

    if (!agent) {
      return createErrorResponse(new Error('Agent not found'), 'Run agent error');
    }

    if (!testMode && agent.status !== 'active') {
      return createErrorResponse(new Error(`Agent is invalid: not active (status: ${agent.status})`), 'Run agent error');
    }

    // Create execution record in pending state
    const [execution] = await db
      .insert(agentExecutions)
      .values({
        workspaceId,
        agentId,
        status: 'pending',
        input: { task, message, ...inputs },
        triggeredBy: user.id,
        createdAt: new Date(),
      })
      .returning();

    // Enqueue via Trigger.dev
    const payload = {
      agentId,
      workspaceId,
      inputs: { task, message, ...inputs },
      triggeredBy: user.id,
      executionId: execution.id,
      testMode,
    };

    if (!process.env.TRIGGER_SECRET_KEY) {
      logger.error('TRIGGER_SECRET_KEY is not configured');
      return createErrorResponse(new Error('Background runner not configured'), 'Run agent error');
    }

    let triggerRunId: string | undefined;
    let publicAccessToken: string | undefined;
    
    try {
      // Trigger the task with idempotency key to prevent duplicate executions
      // The key combines agent ID and execution ID to ensure uniqueness
      const idempotencyKey = `agent-${agentId}-${execution.id}`;
      
      const handle = await executeAgentTask.trigger(payload, {
        idempotencyKey,
        idempotencyKeyTTL: "1h", // Execution should be unique for 1 hour
        tags: [
          `workspace:${workspaceId}`,
          `agent:${agentId}`,
          `user:${user.id}`,
          "type:agent-execution",
        ],
      });
      
      triggerRunId = handle.id;
      // The publicAccessToken allows frontend to subscribe to realtime streams
      // via useRealtimeRunWithStreams hook without exposing the API key
      publicAccessToken = handle.publicAccessToken;
    } catch (err) {
      logger.error('Failed to enqueue agent run', { err, executionId: execution.id });
      await db
        .update(agentExecutions)
        .set({
          status: 'failed',
          error: { message: 'Failed to enqueue agent run' },
          completedAt: new Date(),
        })
        .where(eq(agentExecutions.id, execution.id));

      return createErrorResponse(new Error('Failed to enqueue agent run'), 'Run agent error');
    }

    return NextResponse.json(
      {
        success: true,
        executionId: execution.id,
        runId: triggerRunId, // Trigger.dev run ID for realtime streaming
        publicAccessToken, // Token for useRealtimeRunWithStreams hook authentication
        status: 'pending',
        queuedWith: 'trigger.dev',
        testMode,
      },
      { status: 202 }
    );
  } catch (error) {
    return createErrorResponse(error, 'Run agent error');
  }
}
