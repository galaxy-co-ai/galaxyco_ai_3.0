import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { getCurrentWorkspace } from "@/lib/auth";
import { db } from "@/lib/db";
import { agentWorkflows, agentWorkflowExecutions, agents } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";
import WorkflowDetailClient from "./WorkflowDetailClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Workflow Details | Orchestration | GalaxyCo.ai`,
    description: `Edit and manage workflow ${id}`,
  };
}

/**
 * Workflow Detail Page
 *
 * Shows workflow details with visual builder and execution history.
 */
export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Fetch workflow with executions
    const workflow = await db.query.agentWorkflows.findFirst({
      where: and(
        eq(agentWorkflows.id, id),
        eq(agentWorkflows.workspaceId, workspaceId)
      ),
      with: {
        team: true,
      },
    });

    if (!workflow) {
      notFound();
    }

    // Fetch recent executions
    const executions = await db.query.agentWorkflowExecutions.findMany({
      where: eq(agentWorkflowExecutions.workflowId, id),
      orderBy: [desc(agentWorkflowExecutions.startedAt)],
      limit: 10,
    });

    // Fetch available agents for step configuration
    const availableAgents = await db.query.agents.findMany({
      where: eq(agents.workspaceId, workspaceId),
      orderBy: [desc(agents.updatedAt)],
    });

    // Transform workflow data
    const workflowData = {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      triggerType: workflow.triggerType,
      triggerConfig: workflow.triggerConfig as Record<string, unknown> | null,
      status: workflow.status,
      steps: (workflow.steps as Array<{
        id: string;
        agentId: string;
        action: string;
        inputs: Record<string, unknown>;
        conditions?: { field: string; operator: string; value: unknown }[];
        onSuccess?: string;
        onFailure?: string;
        timeout?: number;
      }>) || [],
      teamId: workflow.teamId,
      teamName: workflow.team?.name || null,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
    };

    // Transform executions
    const executionsData = executions.map((exec) => ({
      id: exec.id,
      status: exec.status,
      currentStepId: exec.currentStepId,
      stepResults: exec.stepResults as Record<string, { status: string; output: unknown; completedAt: string }> | null,
      context: exec.context as Record<string, unknown> | null,
      startedAt: exec.startedAt,
      completedAt: exec.completedAt,
      error: exec.error as { message: string; step?: string; details?: unknown } | null,
    }));

    // Transform agents
    const agentsData = availableAgents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
      status: agent.status,
    }));

    return (
      <ErrorBoundary>
        <WorkflowDetailClient
          workflow={workflowData}
          executions={executionsData}
          availableAgents={agentsData}
          workspaceId={workspaceId}
        />
      </ErrorBoundary>
    );
  } catch (error) {
    logger.error("Workflow detail page error", { error, workflowId: id });
    throw error;
  }
}

