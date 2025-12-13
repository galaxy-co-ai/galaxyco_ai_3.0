import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { getCurrentWorkspace } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentTeams, agents } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import TeamDetailClient from "./TeamDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Team Details | Orchestration | GalaxyCo.ai`,
    description: `Manage agent team ${id}`,
  };
}

/**
 * Team Detail Page
 *
 * Shows team details, members, execution history, and management options.
 */
export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const { workspaceId } = await getCurrentWorkspace();

  // Fetch team with members and their agents
  const team = await db.query.agentTeams.findFirst({
    where: and(
      eq(agentTeams.id, id),
      eq(agentTeams.workspaceId, workspaceId)
    ),
    with: {
      members: {
        with: {
          agent: true,
        },
      },
      coordinator: true,
    },
  });

  if (!team) {
    logger.warn("Team not found", { teamId: id, workspaceId });
    notFound();
  }

  // Fetch available agents for adding to team
  const availableAgents = await db.query.agents.findMany({
    where: eq(agents.workspaceId, workspaceId),
    orderBy: [desc(agents.updatedAt)],
  });

  // Transform team data
  const teamData = {
    id: team.id,
    name: team.name,
    department: team.department,
    description: team.description,
    status: team.status,
    config: team.config as {
      autonomyLevel?: string;
      approvalRequired?: string[];
      workingHours?: { start: string; end: string; timezone: string };
      maxConcurrentTasks?: number;
    } | null,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
    coordinator: team.coordinator
      ? {
          id: team.coordinator.id,
          name: team.coordinator.name,
          status: team.coordinator.status,
        }
      : null,
    members: (team.members || []).map((member) => ({
      id: member.id,
      agentId: member.agentId,
      role: member.role,
      priority: member.priority,
      agent: member.agent
        ? {
            id: member.agent.id,
            name: member.agent.name,
            type: member.agent.type,
            status: member.agent.status,
            description: member.agent.description,
          }
        : null,
    })),
  };

  // Filter out agents already in the team
  const teamMemberIds = new Set(teamData.members.map((m) => m.agentId));
  const agentsNotInTeam = availableAgents
    .filter((agent) => !teamMemberIds.has(agent.id))
    .map((agent) => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
      status: agent.status,
    }));

  return (
    <ErrorBoundary>
      <TeamDetailClient
        team={teamData}
        availableAgents={agentsNotInTeam}
      />
    </ErrorBoundary>
  );
}

