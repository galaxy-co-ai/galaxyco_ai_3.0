/**
 * Audit Log API
 *
 * GET /api/orchestration/audit - Get audit log entries
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { AutonomyService } from '@/lib/orchestration/autonomy';

// Validation schema for audit log filters
const auditFiltersSchema = z.object({
  teamId: z.string().uuid().optional(),
  agentId: z.string().uuid().optional(),
  actionType: z.string().optional(),
  wasAutomatic: z.coerce.boolean().optional(),
  success: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

/**
 * GET /api/orchestration/audit
 * Get audit log entries with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params: Record<string, string | undefined> = {
      teamId: searchParams.get('teamId') || undefined,
      agentId: searchParams.get('agentId') || undefined,
      actionType: searchParams.get('actionType') || undefined,
      wasAutomatic: searchParams.get('wasAutomatic') || undefined,
      success: searchParams.get('success') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    };

    const validation = auditFiltersSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const autonomyService = new AutonomyService(workspaceId);
    const entries = await autonomyService.getAuditLog(validation.data);

    return NextResponse.json({
      entries,
      total: entries.length,
      limit: validation.data.limit || 100,
      offset: validation.data.offset || 0,
    });
  } catch (error) {
    logger.error('[Audit API] Failed to get audit log', error);
    return NextResponse.json(
      { error: 'Failed to get audit log' },
      { status: 500 }
    );
  }
}

