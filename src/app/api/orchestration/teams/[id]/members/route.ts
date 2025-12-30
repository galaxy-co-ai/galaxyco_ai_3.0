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
import { rateLimit } from '@/lib/rate-limit';
import { createErrorResponse } from '@/lib/api-error-handler';

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

    const { id: teamId } = await params;

    // Verify team exists and belongs to workspace
    const team = await db.query.agentTeams.findFirst({
      where: and(
        eq(agentTeams.id, teamId),
        eq(agentTeams.workspaceId, workspaceId)
      ),
    });

    if (!team) {
      return createErrorResponse(new Error('Team not found'), '[Team Members API] List members');
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
    return createErrorResponse(error, '[Team Members API] Failed to list members');
  }
}

/**
 * POST /api/orchestration/teams/[id]/members
 * Add a member to the team
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    const { id: teamId } = await params;

    // Verify team exists and belongs to workspace
    const team = await db.query.agentTeams.findFirst({
      where: and(
        eq(agentTeams.id, teamId),
        eq(agentTeams.workspaceId, workspaceId)
      ),
    });

    if (!team) {
      return createErrorResponse(new Error('Team not found'), '[Team Members API] Add member');
    }

    // Parse and validate body
    const body = await request.json();
    const validation = addMemberSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(new Error('Validation failed: invalid request data'), '[Team Members API] Add member');
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
      return createErrorResponse(new Error('Agent not found or does not belong to workspace'), '[Team Members API] Add member');
    }

    // Check if agent is already a member
    const existingMember = await db.query.agentTeamMembers.findFirst({
      where: and(
        eq(agentTeamMembers.teamId, teamId),
        eq(agentTeamMembers.agentId, agentId)
      ),
    });

    if (existingMember) {
      return createErrorResponse(new Error('Agent is already a member of this team - duplicate not allowed'), '[Team Members API] Add member');
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
    return createErrorResponse(error, '[Team Members API] Failed to add member');
  }
}

/**
 * DELETE /api/orchestration/teams/[id]/members
 * Remove a member from the team
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { id: teamId } = await params;

    // Verify team exists and belongs to workspace
    const team = await db.query.agentTeams.findFirst({
      where: and(
        eq(agentTeams.id, teamId),
        eq(agentTeams.workspaceId, workspaceId)
      ),
    });

    if (!team) {
      return createErrorResponse(new Error('Team not found'), '[Team Members API] Remove member');
    }

    // Parse and validate body
    const body = await request.json();
    const validation = removeMemberSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(new Error('Validation failed: invalid request data'), '[Team Members API] Remove member');
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
      return createErrorResponse(new Error('Agent is not a member of this team - not found'), '[Team Members API] Remove member');
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
    return createErrorResponse(error, '[Team Members API] Failed to remove member');
  }
}
