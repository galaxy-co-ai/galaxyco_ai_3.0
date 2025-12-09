/**
 * Single Approval API
 *
 * GET /api/orchestration/approvals/[id] - Get approval details
 * POST /api/orchestration/approvals/[id] - Approve or reject action
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { AutonomyService } from '@/lib/orchestration/autonomy';

// Validation schema for approval decision
const approvalDecisionSchema = z.object({
  approved: z.boolean(),
  reviewNotes: z.string().max(1000).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/orchestration/approvals/[id]
 * Get approval details
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Approval ID is required' },
        { status: 400 }
      );
    }

    const autonomyService = new AutonomyService(workspaceId);
    const action = await autonomyService.getPendingAction(id);

    if (!action) {
      return NextResponse.json(
        { error: 'Approval not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ action });
  } catch (error) {
    logger.error('[Approvals API] Failed to get approval', error);
    return NextResponse.json(
      { error: 'Failed to get approval details' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orchestration/approvals/[id]
 * Approve or reject an action
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Approval ID is required' },
        { status: 400 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validation = approvalDecisionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { approved, reviewNotes } = validation.data;

    const autonomyService = new AutonomyService(workspaceId);

    // Get the action first to check if it exists and is pending
    const action = await autonomyService.getPendingAction(id);
    if (!action) {
      return NextResponse.json(
        { error: 'Approval not found' },
        { status: 404 }
      );
    }

    if (action.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot process approval with status: ${action.status}` },
        { status: 400 }
      );
    }

    // Process the approval
    const success = await autonomyService.processApproval({
      actionId: id,
      approved,
      reviewerId: user?.id || 'unknown',
      reviewNotes,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to process approval' },
        { status: 500 }
      );
    }

    logger.info('[Approvals API] Approval processed', {
      actionId: id,
      approved,
      reviewerId: user?.id,
    });

    return NextResponse.json({
      success: true,
      actionId: id,
      status: approved ? 'approved' : 'rejected',
      message: approved ? 'Action approved successfully' : 'Action rejected',
    });
  } catch (error) {
    logger.error('[Approvals API] Failed to process approval', error);
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}

