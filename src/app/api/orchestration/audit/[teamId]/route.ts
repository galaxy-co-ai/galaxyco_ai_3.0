/**
 * Team Audit Log API
 *
 * GET /api/orchestration/audit/[teamId] - Get audit log for a specific team
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { AutonomyService } from '@/lib/orchestration/autonomy';
import { db } from '@/lib/db';
import { agentTeams } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Validation schema for audit log filters
const auditFiltersSchema = z.object({
  agentId: z.string().uuid().optional(),
  actionType: z.string().optional(),
  wasAutomatic: z.coerce.boolean().optional(),
  success: z.coerce.boolean().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

/**
 * GET /api/orchestration/audit/[teamId]
 * Get audit log for a specific team
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { teamId } = await params;

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Validate team exists and belongs to workspace
    const team = await db.query.agentTeams.findFirst({
      where: and(
        eq(agentTeams.id, teamId),
        eq(agentTeams.workspaceId, workspaceId)
      ),
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const filterParams: Record<string, string | undefined> = {
      agentId: searchParams.get('agentId') || undefined,
      actionType: searchParams.get('actionType') || undefined,
      wasAutomatic: searchParams.get('wasAutomatic') || undefined,
      success: searchParams.get('success') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: searchParams.get('limit') || undefined,
      offset: searchParams.get('offset') || undefined,
    };

    const validation = auditFiltersSchema.safeParse(filterParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const autonomyService = new AutonomyService(workspaceId);
    const entries = await autonomyService.getAuditLog({
      ...validation.data,
      teamId,
    });

    // Get team autonomy stats
    const allStats = await autonomyService.getTeamAutonomyStats();
    const teamStats = allStats.find(s => s.teamId === teamId);

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        department: team.department,
        status: team.status,
      },
      stats: teamStats || null,
      entries,
      total: entries.length,
      limit: validation.data.limit || 100,
      offset: validation.data.offset || 0,
    });
  } catch (error) {
    logger.error('[Audit API] Failed to get team audit log', error);
    return NextResponse.json(
      { error: 'Failed to get team audit log' },
      { status: 500 }
    );
  }
}

