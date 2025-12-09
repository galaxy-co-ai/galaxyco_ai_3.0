/**
 * Team Members API
 *
 * GET /api/orchestration/teams/[id]/members - List team members
 * POST /api/orchestration/teams/[id]/members - Add member to team
 * DELETE /api/orchestration/teams/[id]/members - Remove member from team
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentTeams, agentTeamMembers, agents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema for adding a member
const addMemberSchema = z.object({
  agentId: z.string().uuid(),
  role: z.enum(['coordinator', 'specialist', 'support']).default('specialist'),
  priority: z.number().int().min(0).max(100).default(1),
  config: z.object({
    specializations: z.array(z.string()).optional(),
    fallbackFor: z.array(z.string()).optional(),
    maxConcurrentTasks: z.number().int().optional(),
  }).optional(),
});

// Validation schema for removing a member
const removeMemberSchema = z.object({
  agentId: z.string().uuid(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/orchestration/teams/[id]/members
 * List team members with agent details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Get members with agent details
    const members = await db.query.agentTeamMembers.findMany({
      where: eq(agentTeamMembers.teamId, teamId),
    });

    const membersWithAgents = await Promise.all(
      members.map(async (member) => {
        const agent = await db.query.agents.findFirst({
          where: eq(agents.id, member.agentId),
        });

        return {
          id: member.id,
          teamId: member.teamId,
          agentId: member.agentId,
          role: member.role,
          priority: member.priority,
          config: member.config,
          createdAt: member.createdAt,
          agent: agent ? {
            id: agent.id,
            name: agent.name,
            type: agent.type,
            status: agent.status,
            description: agent.description,
            executionCount: agent.executionCount,
            lastExecutedAt: agent.lastExecutedAt,
          } : null,
        };
      })
    );

    // Sort by priority then by role
    membersWithAgents.sort((a, b) => {
      if (a.role === 'coordinator' && b.role !== 'coordinator') return -1;
      if (b.role === 'coordinator' && a.role !== 'coordinator') return 1;
      return a.priority - b.priority;
    });

    return NextResponse.json({
      members: membersWithAgents,
      total: membersWithAgents.length,
    });
  } catch (error) {
    logger.error('[Team Members API] Failed to list members', error);
    return NextResponse.json(
      { error: 'Failed to list team members' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orchestration/teams/[id]/members
 * Add a member to the team
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

    // Parse and validate body
    const body = await request.json();
    const validation = addMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { agentId, role, priority, config } = validation.data;

    // Verify agent exists and belongs to workspace
    const agent = await db.query.agents.findFirst({
      where: and(
        eq(agents.id, agentId),
        eq(agents.workspaceId, workspaceId)
      ),
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found or does not belong to workspace' },
        { status: 400 }
      );
    }

    // Check if agent is already a member
    const existingMember = await db.query.agentTeamMembers.findFirst({
      where: and(
        eq(agentTeamMembers.teamId, teamId),
        eq(agentTeamMembers.agentId, agentId)
      ),
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'Agent is already a member of this team' },
        { status: 400 }
      );
    }

    // If adding as coordinator, update team's coordinatorAgentId
    if (role === 'coordinator') {
      // Demote existing coordinator if any
      if (team.coordinatorAgentId) {
        await db
          .update(agentTeamMembers)
          .set({ role: 'specialist' })
          .where(
            and(
              eq(agentTeamMembers.teamId, teamId),
              eq(agentTeamMembers.agentId, team.coordinatorAgentId)
            )
          );
      }

      await db
        .update(agentTeams)
        .set({ coordinatorAgentId: agentId, updatedAt: new Date() })
        .where(eq(agentTeams.id, teamId));
    }

    // Add member
    const [member] = await db
      .insert(agentTeamMembers)
      .values({
        teamId,
        agentId,
        role,
        priority,
        config: config || {},
      })
      .returning();

    logger.info('[Team Members API] Member added', {
      teamId,
      agentId,
      role,
      agentName: agent.name,
    });

    return NextResponse.json({
      member: {
        ...member,
        agent: {
          id: agent.id,
          name: agent.name,
          type: agent.type,
          status: agent.status,
        },
      },
    }, { status: 201 });
  } catch (error) {
    logger.error('[Team Members API] Failed to add member', error);
    return NextResponse.json(
      { error: 'Failed to add team member' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/orchestration/teams/[id]/members
 * Remove a member from the team
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Parse and validate body
    const body = await request.json();
    const validation = removeMemberSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { agentId } = validation.data;

    // Find the member
    const member = await db.query.agentTeamMembers.findFirst({
      where: and(
        eq(agentTeamMembers.teamId, teamId),
        eq(agentTeamMembers.agentId, agentId)
      ),
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Agent is not a member of this team' },
        { status: 404 }
      );
    }

    // If removing coordinator, clear team's coordinatorAgentId
    if (team.coordinatorAgentId === agentId) {
      await db
        .update(agentTeams)
        .set({ coordinatorAgentId: null, updatedAt: new Date() })
        .where(eq(agentTeams.id, teamId));
    }

    // Remove member
    await db
      .delete(agentTeamMembers)
      .where(eq(agentTeamMembers.id, member.id));

    logger.info('[Team Members API] Member removed', {
      teamId,
      agentId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Team Members API] Failed to remove member', error);
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}
