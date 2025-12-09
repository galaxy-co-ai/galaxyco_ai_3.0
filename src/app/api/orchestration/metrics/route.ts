/**
 * Orchestration Metrics API
 *
 * GET /api/orchestration/metrics - Get department and autonomy metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { AutonomyService } from '@/lib/orchestration/autonomy';

// Validation schema for metrics filters
const metricsFiltersSchema = z.object({
  department: z.enum(['sales', 'marketing', 'support', 'operations', 'finance', 'product', 'general']).optional(),
});

/**
 * GET /api/orchestration/metrics
 * Get department metrics and team autonomy statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const params = {
      department: searchParams.get('department') || undefined,
    };

    const validation = metricsFiltersSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const autonomyService = new AutonomyService(workspaceId);

    // Get department metrics
    const departmentMetrics = await autonomyService.getDepartmentMetrics(validation.data.department);

    // Get team autonomy stats
    const teamStats = await autonomyService.getTeamAutonomyStats();

    // Get overall pending count
    const pendingCount = await autonomyService.getPendingCount();

    // Calculate summary metrics
    const summary = {
      totalTeams: teamStats.length,
      totalPendingApprovals: pendingCount,
      totalActionsToday: teamStats.reduce((sum, t) => sum + t.approvedToday + t.rejectedToday, 0),
      autonomyDistribution: {
        supervised: teamStats.filter(t => t.autonomyLevel === 'supervised').length,
        semiAutonomous: teamStats.filter(t => t.autonomyLevel === 'semi_autonomous').length,
        autonomous: teamStats.filter(t => t.autonomyLevel === 'autonomous').length,
      },
    };

    return NextResponse.json({
      summary,
      departmentMetrics,
      teamStats,
    });
  } catch (error) {
    logger.error('[Metrics API] Failed to get metrics', error);
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
}

