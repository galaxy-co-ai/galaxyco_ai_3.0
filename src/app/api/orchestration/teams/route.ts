/**
 * Agent Teams API
 *
 * GET /api/orchestration/teams - List all teams for workspace
 * POST /api/orchestration/teams - Create a new team
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentTeams, agentTeamMembers, agents } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

// Validation schema for creating a team
const createTeamSchema = z.object({
  name: z.string().min(1, 'Team name is required').max(100),
  department: z.enum(['sales', 'marketing', 'support', 'operations', 'finance', 'product', 'general']),
  description: z.string().optional(),
  coordinatorAgentId: z.string().uuid().optional(),
  config: z.object({
    autonomyLevel: z.enum(['supervised', 'semi_autonomous', 'autonomous']).default('supervised'),
    approvalRequired: z.array(z.string()).default([]),
    workingHours: z.object({
      start: z.string(),
      end: z.string(),
      timezone: z.string(),
    }).optional(),
    maxConcurrentTasks: z.number().int().min(1).max(100).default(5),
    escalationRules: z.array(z.object({
      condition: z.string(),
      action: z.enum(['notify', 'escalate', 'pause']),
      target: z.string().optional(),
    })).optional(),
    capabilities: z.array(z.string()).optional(),
  }).optional(),
  memberAgentIds: z.array(z.string().uuid()).optional(),
});

/**
 * GET /api/orchestration/teams
 * List all teams for the workspace
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();
    const userId = user?.id || 'anonymous';

    const rateLimitResult = await rateLimit(`orchestration:${userId}`, 100, 3600);
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build conditions
    const conditions = [eq(agentTeams.workspaceId, workspaceId)];
    
    if (department) {
      conditions.push(eq(agentTeams.department, department as typeof agentTeams.department.enumValues[number]));
    }
    
    if (status) {
      conditions.push(eq(agentTeams.status, status));
    }

    // Fetch teams
    const teams = await db.query.agentTeams.findMany({
      where: and(...conditions),
      orderBy: [desc(agentTeams.createdAt)],
      limit,
      offset,
    });

    // Fetch member counts for each team
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await db.query.agentTeamMembers.findMany({
          where: eq(agentTeamMembers.teamId, team.id),
        });

        // Get coordinator agent name if exists
        let coordinatorName: string | null = null;
        if (team.coordinatorAgentId) {
          const coordinator = await db.query.agents.findFirst({
            where: eq(agents.id, team.coordinatorAgentId),
          });
          coordinatorName = coordinator?.name || null;
        }

        return {
          ...team,
          memberCount: members.length,
          coordinatorName,
        };
      })
    );

    return NextResponse.json({
      teams: teamsWithMembers,
      total: teamsWithMembers.length,
      limit,
      offset,
    });
  } catch (error) {
    logger.error('[Teams API] Failed to list teams', error);
    return NextResponse.json(
      { error: 'Failed to list teams' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orchestration/teams
 * Create a new team
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();
    const userId = user?.id || 'anonymous';

    const rateLimitResult = await rateLimit(`orchestration:${userId}`, 100, 3600);
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

    // Parse and validate body
    const body = await request.json();
    const validation = createTeamSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { name, department, description, coordinatorAgentId, config, memberAgentIds } = validation.data;

    // Validate coordinator agent exists and belongs to workspace
    if (coordinatorAgentId) {
      const coordinator = await db.query.agents.findFirst({
        where: and(
          eq(agents.id, coordinatorAgentId),
          eq(agents.workspaceId, workspaceId)
        ),
      });

      if (!coordinator) {
        return NextResponse.json(
          { error: 'Coordinator agent not found or does not belong to workspace' },
          { status: 400 }
        );
      }
    }

    // Create the team
    const [team] = await db
      .insert(agentTeams)
      .values({
        workspaceId,
        name,
        department,
        description,
        coordinatorAgentId,
        config: config || {
          autonomyLevel: 'supervised',
          approvalRequired: [],
          maxConcurrentTasks: 5,
        },
        createdBy: user?.id || '',
      })
      .returning();

    // Add coordinator as a member with coordinator role
    if (coordinatorAgentId) {
      await db.insert(agentTeamMembers).values({
        teamId: team.id,
        agentId: coordinatorAgentId,
        role: 'coordinator',
        priority: 0,
      });
    }

    // Add additional member agents
    if (memberAgentIds && memberAgentIds.length > 0) {
      for (const agentId of memberAgentIds) {
        // Skip if it's the coordinator (already added)
        if (agentId === coordinatorAgentId) continue;

        // Validate agent exists and belongs to workspace
        const agent = await db.query.agents.findFirst({
          where: and(
            eq(agents.id, agentId),
            eq(agents.workspaceId, workspaceId)
          ),
        });

        if (agent) {
          await db.insert(agentTeamMembers).values({
            teamId: team.id,
            agentId,
            role: 'specialist',
            priority: 1,
          });
        }
      }
    }

    // Get final member count
    const members = await db.query.agentTeamMembers.findMany({
      where: eq(agentTeamMembers.teamId, team.id),
    });

    logger.info('[Teams API] Team created', {
      teamId: team.id,
      name: team.name,
      department: team.department,
      memberCount: members.length,
    });

    return NextResponse.json({
      team: {
        ...team,
        memberCount: members.length,
      },
    }, { status: 201 });
  } catch (error) {
    logger.error('[Teams API] Failed to create team', error);
    return NextResponse.json(
      { error: 'Failed to create team' },
      { status: 500 }
    );
  }
}

