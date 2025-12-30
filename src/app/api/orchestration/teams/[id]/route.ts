/**
 * Agent Team Detail API
 *
 * GET /api/orchestration/teams/[id] - Get team details
 * PATCH /api/orchestration/teams/[id] - Update team
 * DELETE /api/orchestration/teams/[id] - Delete team
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

// Validation schema for updating a team
const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  coordinatorAgentId: z.string().uuid().nullable().optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
  config: z.object({
    autonomyLevel: z.enum(['supervised', 'semi_autonomous', 'autonomous']).optional(),
    approvalRequired: z.array(z.string()).optional(),
    workingHours: z.object({
      start: z.string(),
      end: z.string(),
      timezone: z.string(),
    }).nullable().optional(),
    maxConcurrentTasks: z.number().int().min(1).max(100).optional(),
    escalationRules: z.array(z.object({
      condition: z.string(),
      action: z.enum(['notify', 'escalate', 'pause']),
      target: z.string().optional(),
    })).optional(),
    capabilities: z.array(z.string()).optional(),
  }).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/orchestration/teams/[id]
 * Get team details with members
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

    // Get team
    const team = await db.query.agentTeams.findFirst({
      where: and(
        eq(agentTeams.id, teamId),
        eq(agentTeams.workspaceId, workspaceId)
      ),
    });

    if (!team) {
      return createErrorResponse(new Error('Team not found'), '[Teams API] Get team');
    }

    // Get team members with agent details
    const members = await db.query.agentTeamMembers.findMany({
      where: eq(agentTeamMembers.teamId, teamId),
    });

    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const agent = await db.query.agents.findFirst({
          where: eq(agents.id, member.agentId),
        });

        return {
          ...member,
          agent: agent ? {
            id: agent.id,
            name: agent.name,
            type: agent.type,
            status: agent.status,
            description: agent.description,
          } : null,
        };
      })
    );

    // Get coordinator details
    let coordinator = null;
    if (team.coordinatorAgentId) {
      const coordinatorAgent = await db.query.agents.findFirst({
        where: eq(agents.id, team.coordinatorAgentId),
      });
      if (coordinatorAgent) {
        coordinator = {
          id: coordinatorAgent.id,
          name: coordinatorAgent.name,
          type: coordinatorAgent.type,
          status: coordinatorAgent.status,
        };
      }
    }

    return NextResponse.json({
      team: {
        ...team,
        coordinator,
        members: membersWithDetails,
        memberCount: membersWithDetails.length,
      },
    });
  } catch (error) {
    return createErrorResponse(error, '[Teams API] Failed to get team');
  }
}

/**
 * PATCH /api/orchestration/teams/[id]
 * Update team details
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    // Get existing team
    const existingTeam = await db.query.agentTeams.findFirst({
      where: and(
        eq(agentTeams.id, teamId),
        eq(agentTeams.workspaceId, workspaceId)
      ),
    });

    if (!existingTeam) {
      return createErrorResponse(new Error('Team not found'), '[Teams API] Update team');
    }

    // Parse and validate body
    const body = await request.json();
    const validation = updateTeamSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(new Error('Validation failed: invalid request data'), '[Teams API] Update team');
    }

    const { name, description, coordinatorAgentId, status, config } = validation.data;

    // Validate new coordinator if provided
    if (coordinatorAgentId !== undefined && coordinatorAgentId !== null) {
      const coordinator = await db.query.agents.findFirst({
        where: and(
          eq(agents.id, coordinatorAgentId),
          eq(agents.workspaceId, workspaceId)
        ),
      });

      if (!coordinator) {
        return createErrorResponse(new Error('Coordinator agent not found'), '[Teams API] Update team');
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (coordinatorAgentId !== undefined) updateData.coordinatorAgentId = coordinatorAgentId;
    if (status !== undefined) updateData.status = status;
    if (config !== undefined) {
      const existingConfig = existingTeam.config as Record<string, unknown> || {};
      updateData.config = {
        ...existingConfig,
        ...config,
      };
    }

    // Update team
    const [updatedTeam] = await db
      .update(agentTeams)
      .set(updateData)
      .where(eq(agentTeams.id, teamId))
      .returning();

    // If coordinator changed, update team members
    if (coordinatorAgentId !== undefined && coordinatorAgentId !== existingTeam.coordinatorAgentId) {
      // Remove old coordinator role
      if (existingTeam.coordinatorAgentId) {
        await db
          .update(agentTeamMembers)
          .set({ role: 'specialist' })
          .where(
            and(
              eq(agentTeamMembers.teamId, teamId),
              eq(agentTeamMembers.agentId, existingTeam.coordinatorAgentId)
            )
          );
      }

      // Add new coordinator as member if not already
      if (coordinatorAgentId) {
        const existingMember = await db.query.agentTeamMembers.findFirst({
          where: and(
            eq(agentTeamMembers.teamId, teamId),
            eq(agentTeamMembers.agentId, coordinatorAgentId)
          ),
        });

        if (existingMember) {
          await db
            .update(agentTeamMembers)
            .set({ role: 'coordinator', priority: 0 })
            .where(eq(agentTeamMembers.id, existingMember.id));
        } else {
          await db.insert(agentTeamMembers).values({
            teamId,
            agentId: coordinatorAgentId,
            role: 'coordinator',
            priority: 0,
          });
        }
      }
    }

    logger.info('[Teams API] Team updated', {
      teamId: updatedTeam.id,
      name: updatedTeam.name,
    });

    return NextResponse.json({ team: updatedTeam });
  } catch (error) {
    return createErrorResponse(error, '[Teams API] Failed to update team');
  }
}

/**
 * DELETE /api/orchestration/teams/[id]
 * Delete a team
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
      return createErrorResponse(new Error('Team not found'), '[Teams API] Delete team');
    }

    // Delete team (cascade will delete members)
    await db.delete(agentTeams).where(eq(agentTeams.id, teamId));

    logger.info('[Teams API] Team deleted', {
      teamId,
      name: team.name,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, '[Teams API] Failed to delete team');
  }
}
