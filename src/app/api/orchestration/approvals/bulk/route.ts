/**
 * Bulk Approval API
 *
 * POST /api/orchestration/approvals/bulk - Bulk approve or reject actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { AutonomyService } from '@/lib/orchestration/autonomy';

// Validation schema for bulk approval
const bulkApprovalSchema = z.object({
  actionIds: z.array(z.string().uuid()).min(1, 'At least one action ID is required').max(100),
  approved: z.boolean(),
  reviewNotes: z.string().max(1000).optional(),
});

/**
 * POST /api/orchestration/approvals/bulk
 * Bulk approve or reject multiple actions
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();

    // Parse and validate body
    const body = await request.json();
    const validation = bulkApprovalSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { actionIds, approved, reviewNotes } = validation.data;

    const autonomyService = new AutonomyService(workspaceId);

    // Process bulk approval
    const result = await autonomyService.processBulkApproval(
      actionIds,
      approved,
      user?.id || 'unknown',
      reviewNotes
    );

    logger.info('[Approvals API] Bulk approval processed', {
      total: actionIds.length,
      processed: result.processed,
      failed: result.failed,
      approved,
      reviewerId: user?.id,
    });

    return NextResponse.json({
      success: result.failed === 0,
      total: actionIds.length,
      processed: result.processed,
      failed: result.failed,
      status: approved ? 'approved' : 'rejected',
      message: `${result.processed} actions ${approved ? 'approved' : 'rejected'}${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
    });
  } catch (error) {
    logger.error('[Approvals API] Failed to process bulk approval', error);
    return NextResponse.json(
      { error: 'Failed to process bulk approval' },
      { status: 500 }
    );
  }
}

