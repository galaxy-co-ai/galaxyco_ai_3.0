/**
 * Execute Workflow API
 *
 * POST /api/orchestration/workflows/[id]/execute - Execute a workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentWorkflows } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { AgentOrchestrator } from '@/lib/orchestration';

// Validation schema
const executeWorkflowSchema = z.object({
  context: z.record(z.unknown()).optional(),
  triggerData: z.record(z.unknown()).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/orchestration/workflows/[id]/execute
 * Execute a workflow
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();
    const { id: workflowId } = await params;

    // Verify workflow exists and is active
    const workflow = await db.query.agentWorkflows.findFirst({
      where: and(
        eq(agentWorkflows.id, workflowId),
        eq(agentWorkflows.workspaceId, workspaceId)
      ),
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    if (workflow.status !== 'active') {
      return NextResponse.json(
        { error: `Workflow is not active (status: ${workflow.status})` },
        { status: 400 }
      );
    }

    // Parse and validate body
    const body = await request.json().catch(() => ({}));
    const validation = executeWorkflowSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { context, triggerData } = validation.data;

    logger.info('[Workflows API] Executing workflow', {
      workflowId,
      workflowName: workflow.name,
      triggeredBy: user?.id || '',
    });

    // Create orchestrator and execute workflow
    const orchestrator = new AgentOrchestrator(workspaceId);
    const result = await orchestrator.executeWorkflow({
      workflowId,
      workspaceId,
      triggeredBy: user?.id || '',
      triggerType: 'manual',
      triggerData,
      initialContext: context,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error?.message || 'Failed to execute workflow',
          executionId: result.executionId,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      workflowId,
      workflowName: workflow.name,
      executionId: result.executionId,
      status: result.status,
      totalSteps: result.totalSteps,
    });
  } catch (error) {
    logger.error('[Workflows API] Failed to execute workflow', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}
