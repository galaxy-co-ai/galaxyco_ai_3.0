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
import { expensiveOperationLimit } from '@/lib/rate-limit';
import { createErrorResponse } from '@/lib/api-error-handler';

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
    const userId = user?.id || 'anonymous';

    const rateLimitResult = await expensiveOperationLimit(`orchestration:execute:${userId}`);
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

    const { id: workflowId } = await params;

    // Verify workflow exists and is active
    const workflow = await db.query.agentWorkflows.findFirst({
      where: and(
        eq(agentWorkflows.id, workflowId),
        eq(agentWorkflows.workspaceId, workspaceId)
      ),
    });

    if (!workflow) {
      return createErrorResponse(new Error('Workflow not found'), '[Workflows API] Execute workflow');
    }

    if (workflow.status !== 'active') {
      return createErrorResponse(new Error(`Workflow is not active - invalid status: ${workflow.status}`), '[Workflows API] Execute workflow');
    }

    // Parse and validate body
    const body = await request.json().catch(() => ({}));
    const validation = executeWorkflowSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(new Error('Validation failed: invalid request data'), '[Workflows API] Execute workflow');
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
      return createErrorResponse(new Error(result.error?.message || 'Failed to execute workflow'), '[Workflows API] Execute workflow');
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
    return createErrorResponse(error, '[Workflows API] Failed to execute workflow');
  }
}
