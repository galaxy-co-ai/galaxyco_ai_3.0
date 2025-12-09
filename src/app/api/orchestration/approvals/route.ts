/**
 * Approval Queue API
 *
 * GET /api/orchestration/approvals - List pending approvals
 * POST /api/orchestration/approvals - Queue a new action for approval
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { AutonomyService } from '@/lib/orchestration/autonomy';

// Validation schema for listing approvals
const listApprovalsSchema = z.object({
  teamId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'expired', 'auto_approved']).optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  actionType: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

// Validation schema for queueing an action
const queueActionSchema = z.object({
  teamId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  workflowExecutionId: z.string().uuid().optional(),
  actionType: z.string().min(1, 'Action type is required'),
  actionData: z.record(z.unknown()).default({}),
  description: z.string().min(1, 'Description is required'),
  expiresInHours: z.number().int().min(1).max(168).optional(), // Max 7 days
});

/**
 * GET /api/orchestration/approvals
 * List pending approvals with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params = {
      teamId: searchParams.get('teamId') || undefined,
      agentId: searchParams.get('agentId') || undefined,
      status: searchParams.get('status') || undefined,
      riskLevel: searchParams.get('riskLevel') || undefined,
      actionType: searchParams.get('actionType') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    };

    const validation = listApprovalsSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const autonomyService = new AutonomyService(workspaceId);
    const actions = await autonomyService.getPendingActions(validation.data);
    const pendingCount = await autonomyService.getPendingCount(validation.data.teamId);

    return NextResponse.json({
      actions,
      total: actions.length,
      pendingCount,
      limit: validation.data.limit || 50,
      offset: validation.data.offset || 0,
    });
  } catch (error) {
    logger.error('[Approvals API] Failed to list approvals', error);
    return NextResponse.json(
      { error: 'Failed to list approvals' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orchestration/approvals
 * Queue a new action for approval
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Parse and validate body
    const body = await request.json();
    const validation = queueActionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { teamId, agentId, workflowExecutionId, actionType, actionData, description, expiresInHours } = validation.data;

    const autonomyService = new AutonomyService(workspaceId);

    // Check if action needs approval based on team autonomy level
    const { canExecute, classification } = await autonomyService.canAutoExecute(
      teamId,
      actionType,
      actionData
    );

    if (canExecute) {
      // Action can be auto-executed - record in audit log
      const auditId = await autonomyService.recordAutoExecution({
        workspaceId,
        teamId,
        agentId,
        workflowExecutionId,
        actionType,
        actionData,
        description,
        riskLevel: classification.riskLevel,
        success: true,
      });

      return NextResponse.json({
        autoApproved: true,
        auditId,
        classification,
        message: 'Action was auto-approved based on team autonomy level',
      }, { status: 200 });
    }

    // Queue for approval
    const actionId = await autonomyService.queueForApproval({
      workspaceId,
      teamId,
      agentId,
      workflowExecutionId,
      actionType,
      actionData,
      description,
      expiresInHours,
    });

    logger.info('[Approvals API] Action queued for approval', {
      actionId,
      actionType,
      riskLevel: classification.riskLevel,
    });

    return NextResponse.json({
      autoApproved: false,
      actionId,
      classification,
      message: 'Action queued for approval',
    }, { status: 201 });
  } catch (error) {
    logger.error('[Approvals API] Failed to queue action', error);
    return NextResponse.json(
      { error: 'Failed to queue action for approval' },
      { status: 500 }
    );
  }
}

