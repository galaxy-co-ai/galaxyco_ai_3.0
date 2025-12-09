import { Metadata } from "next";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { getCurrentWorkspace } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentWorkflows, agentTeams, agents } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import WorkflowsListClient from "./WorkflowsListClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workflows | Orchestration | GalaxyCo.ai",
  description: "Build and manage multi-agent workflows with visual editor",
};

/**
 * Workflows List Page
 *
 * Shows all workflows with filtering and search.
 * Allows workflow creation and execution.
 */
export default async function WorkflowsPage() {
  let initialWorkflows: Array<{
    id: string;
    name: string;
    description: string | null;
    triggerType: string;
    status: string;
    teamId: string | null;
    teamName: string | null;
    stepCount: number;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  let initialTeams: Array<{ id: string; name: string; department: string }> = [];
  let initialAgents: Array<{ id: string; name: string; type: string }> = [];
  let workspaceId = "";

  try {
    const workspace = await getCurrentWorkspace();
    workspaceId = workspace.workspaceId;

    // Fetch workflows with team info
    const workflows = await db.query.agentWorkflows.findMany({
      where: eq(agentWorkflows.workspaceId, workspaceId),
      orderBy: [desc(agentWorkflows.updatedAt)],
      with: {
        team: true,
      },
    });

    // Transform workflows
    initialWorkflows = workflows.map((workflow) => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      triggerType: workflow.triggerType,
      status: workflow.status,
      teamId: workflow.teamId,
      teamName: workflow.team?.name || null,
      stepCount: Array.isArray(workflow.steps) ? workflow.steps.length : 0,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    }));

    // Fetch teams for workflow creation
    const teams = await db.query.agentTeams.findMany({
      where: eq(agentTeams.workspaceId, workspaceId),
      orderBy: [desc(agentTeams.createdAt)],
    });

    initialTeams = teams.map((team) => ({
      id: team.id,
      name: team.name,
      department: team.department,
    }));

    // Fetch agents for workflow creation
    const agentsList = await db.query.agents.findMany({
      where: eq(agents.workspaceId, workspaceId),
      orderBy: [desc(agents.updatedAt)],
    });

    initialAgents = agentsList.map((agent) => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
    }));
  } catch (error) {
    logger.error("Workflows page error", { error });
  }

  return (
    <ErrorBoundary>
      <WorkflowsListClient
        workspaceId={workspaceId}
        initialWorkflows={initialWorkflows}
        initialTeams={initialTeams}
        initialAgents={initialAgents}
      />
    </ErrorBoundary>
  );
}

