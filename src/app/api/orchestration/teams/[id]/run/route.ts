/**
 * Run Team API
 *
 * POST /api/orchestration/teams/[id]/run - Run team with an objective
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentTeams } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { AgentOrchestrator } from '@/lib/orchestration';
import { expensiveOperationLimit } from '@/lib/rate-limit';
import { createErrorResponse } from '@/lib/api-error-handler';

// Validation schema
const runTeamSchema = z.object({
  objective: z.string().min(1, 'Objective is required').max(2000),
  context: z.record(z.unknown()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/orchestration/teams/[id]/run
 * Run a team with a high-level objective
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();
    const userId = user?.id || 'anonymous';

    const rateLimitResult = await expensiveOperationLimit(`orchestration:run:${userId}`);
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

    const { id: teamId } = await params;

    // Verify team exists and belongs to workspace
    const team = await db.query.agentTeams.findFirst({
      where: and(
        eq(agentTeams.id, teamId),
        eq(agentTeams.workspaceId, workspaceId)
      ),
    });

    if (!team) {
      return createErrorResponse(new Error('Team not found'), '[Teams API] Run team');
    }

    if (team.status !== 'active') {
      return createErrorResponse(new Error(`Team is not active - invalid status: ${team.status}`), '[Teams API] Run team');
    }

    // Parse and validate body
    const body = await request.json();
    const validation = runTeamSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(new Error('Validation failed: invalid request data'), '[Teams API] Run team');
    }

    const { objective, priority } = validation.data;

    logger.info('[Teams API] Running team', {
      teamId,
      teamName: team.name,
      objective: objective.substring(0, 100),
      priority,
    });

    // Create orchestrator and run team
    const orchestrator = new AgentOrchestrator(workspaceId);
    const result = await orchestrator.runTeam(teamId, objective);

    if (!result.success) {
      return createErrorResponse(new Error(result.error || 'Failed to run team'), '[Teams API] Run team');
    }

    return NextResponse.json({
      success: true,
      teamId,
      teamName: team.name,
      objective,
      executionId: result.executionId,
      agentsInvolved: result.agentsInvolved,
      durationMs: result.durationMs,
    });
  } catch (error) {
    return createErrorResponse(error, '[Teams API] Failed to run team');
  }
}
