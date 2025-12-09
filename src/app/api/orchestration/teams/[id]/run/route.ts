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
    const { workspaceId } = await getCurrentWorkspace();
    const { id: teamId } = await params;

    // Verify team exists and belongs to workspace
    const team = await db.query.agentTeams.findFirst({
      where: and(
        eq(agentTeams.id, teamId),
        eq(agentTeams.workspaceId, workspaceId)
      ),
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    if (team.status !== 'active') {
      return NextResponse.json(
        { error: `Team is not active (status: ${team.status})` },
        { status: 400 }
      );
    }

    // Parse and validate body
    const body = await request.json();
    const validation = runTeamSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: result.error || 'Failed to run team' },
        { status: 500 }
      );
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
    logger.error('[Teams API] Failed to run team', error);
    return NextResponse.json(
      { error: 'Failed to run team' },
      { status: 500 }
    );
  }
}
