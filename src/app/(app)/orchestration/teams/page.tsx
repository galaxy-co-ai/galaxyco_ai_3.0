import { Metadata } from "next";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { getCurrentWorkspace } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentTeams, agents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import TeamsListClient from "./TeamsListClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Teams | Orchestration | GalaxyCo.ai",
  description: "Create and manage AI agent teams for department-level automation",
};

/**
 * Teams List Page
 *
 * Shows all agent teams with filtering by department.
 * Allows team creation, management, and execution.
 */
export default async function TeamsPage() {
  let initialTeams: Array<{
    id: string;
    name: string;
    department: string;
    description: string | null;
    status: string;
    memberCount: number;
    config: unknown;
    createdAt: Date;
  }> = [];
  let initialAgents: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
  }> = [];
  let workspaceId = "";

  try {
    const workspace = await getCurrentWorkspace();
    workspaceId = workspace.workspaceId;

    // Fetch teams with member counts
    const teams = await db.query.agentTeams.findMany({
      where: eq(agentTeams.workspaceId, workspaceId),
      orderBy: [desc(agentTeams.createdAt)],
      with: {
        members: true,
      },
    });

    // Transform teams with member counts
    initialTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      department: team.department,
      description: team.description,
      status: team.status,
      memberCount: team.members?.length || 0,
      config: team.config,
      createdAt: team.createdAt,
    }));

    // Fetch available agents for team creation
    const agentsList = await db.query.agents.findMany({
      where: eq(agents.workspaceId, workspaceId),
      orderBy: [desc(agents.updatedAt)],
    });

    initialAgents = agentsList.map((agent) => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
      status: agent.status,
    }));
  } catch (error) {
    logger.error("Teams page error", { error });
  }

  return (
    <ErrorBoundary>
      <TeamsListClient
        workspaceId={workspaceId}
        initialTeams={initialTeams}
        initialAgents={initialAgents}
      />
    </ErrorBoundary>
  );
}

