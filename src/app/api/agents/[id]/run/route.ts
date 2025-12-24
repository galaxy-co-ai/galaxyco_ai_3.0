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
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { task, message, inputs, testMode } = validationResult.data;

    // Get the agent
    const agent = await db.query.agents.findFirst({
      where: and(eq(agents.id, agentId), eq(agents.workspaceId, workspaceId)),
    });

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    if (!testMode && agent.status !== 'active') {
      return NextResponse.json(
        { error: `Agent is not active (status: ${agent.status})` },
        { status: 400 }
      );
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
      return NextResponse.json(
        { success: false, executionId: execution.id, error: 'Background runner not configured' },
        { status: 500 }
      );
    }

    let triggerRunId: string | undefined;
    try {
      // Trigger the task and get the run handle for realtime streaming
      const handle = await executeAgentTask.trigger(payload, {
        tags: [
          `workspace:${workspaceId}`,
          `agent:${agentId}`,
          `user:${user.id}`,
        ],
      });
      triggerRunId = handle.id;
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

      return NextResponse.json(
        { success: false, executionId: execution.id, error: 'Failed to enqueue agent run' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        executionId: execution.id,
        runId: triggerRunId, // Trigger.dev run ID for realtime streaming
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
