/**
 * Workflow Execution Details API
 *
 * GET /api/orchestration/workflows/executions/[executionId] - Get execution details
 * PATCH /api/orchestration/workflows/executions/[executionId] - Update execution (pause/resume/cancel)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentWorkflowExecutions, agentWorkflows, agents } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { WorkflowEngine } from '@/lib/orchestration/workflow-engine';
import type { WorkflowStep } from '@/lib/orchestration/types';

interface RouteParams {
  params: Promise<{ executionId: string }>;
}

/**
 * GET /api/orchestration/workflows/executions/[executionId]
 * Get execution details with workflow and agent information
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { executionId } = await params;

    // Get execution
    const execution = await db.query.agentWorkflowExecutions.findFirst({
      where: and(
        eq(agentWorkflowExecutions.id, executionId),
        eq(agentWorkflowExecutions.workspaceId, workspaceId)
      ),
    });

    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }

    // Get workflow
    const workflow = await db.query.agentWorkflows.findFirst({
      where: eq(agentWorkflows.id, execution.workflowId),
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Get agent IDs from steps
    const steps = workflow.steps as WorkflowStep[];
    const agentIds = [...new Set(steps.map((s) => s.agentId).filter(Boolean))];

    // Get agents
    const agentsList = agentIds.length > 0
      ? await db.query.agents.findMany({
          where: inArray(agents.id, agentIds),
        })
      : [];

    return NextResponse.json({
      execution: {
        ...execution,
        workflow: {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          steps: steps,
        },
        agents: agentsList.map((a) => ({
          id: a.id,
          name: a.name,
          type: a.type,
          status: a.status,
        })),
      },
    });
  } catch (error) {
    logger.error('[Executions API] Failed to get execution', error);
    return NextResponse.json(
      { error: 'Failed to get execution' },
      { status: 500 }
    );
  }
}

// Validation schema for updating execution
const updateExecutionSchema = z.object({
  action: z.enum(['pause', 'resume', 'cancel', 'retry_step']),
  stepId: z.string().optional(), // Required for retry_step action
});

/**
 * PATCH /api/orchestration/workflows/executions/[executionId]
 * Update execution (pause, resume, cancel, or retry step)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { executionId } = await params;

    // Parse and validate body
    const body = await request.json();
    const validation = updateExecutionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { action, stepId } = validation.data;

    // Verify execution exists and belongs to workspace
    const execution = await db.query.agentWorkflowExecutions.findFirst({
      where: and(
        eq(agentWorkflowExecutions.id, executionId),
        eq(agentWorkflowExecutions.workspaceId, workspaceId)
      ),
    });

    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }

    const engine = new WorkflowEngine(workspaceId);
    let result;

    switch (action) {
      case 'pause':
        result = await engine.pause(executionId);
        break;
      case 'resume':
        result = await engine.resume(executionId);
        break;
      case 'cancel':
        result = await engine.cancel(executionId);
        break;
      case 'retry_step':
        if (!stepId) {
          return NextResponse.json(
            { error: 'stepId is required for retry_step action' },
            { status: 400 }
          );
        }
        const stepResult = await engine.retryStep(executionId, stepId);
        result = {
          success: stepResult.status === 'completed' || stepResult.status === 'skipped',
          executionId,
          status: execution.status,
          stepResult,
        };
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error?.message || 'Action failed' },
        { status: 400 }
      );
    }

    logger.info('[Executions API] Execution updated', {
      executionId,
      action,
      newStatus: result.status,
    });

    return NextResponse.json({
      success: true,
      execution: result,
    });
  } catch (error) {
    logger.error('[Executions API] Failed to update execution', error);
    return NextResponse.json(
      { error: 'Failed to update execution' },
      { status: 500 }
    );
  }
}

