import { getCurrentWorkspace } from "@/lib/auth";
import { db } from "@/lib/db";
import { agents, agentExecutions } from "@/db/schema";
import { eq, desc, count, and, sql } from "drizzle-orm";
import { MyAgentsDashboard } from "@/components/agents";
import { logger } from "@/lib/logger";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export default async function MyAgentsPage() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Fetch agents for the workspace
    const agentsList = await db.query.agents.findMany({
      where: eq(agents.workspaceId, workspaceId),
      orderBy: [desc(agents.updatedAt)],
      limit: 100,
    });

    // Get execution stats
    const [totalExecutions, successfulExecutions] = await Promise.all([
      db
        .select({ count: count() })
        .from(agentExecutions)
        .where(eq(agentExecutions.workspaceId, workspaceId)),
      db
        .select({ count: count() })
        .from(agentExecutions)
        .where(
          and(
            eq(agentExecutions.workspaceId, workspaceId),
            eq(agentExecutions.status, "completed")
          )
        ),
    ]);

    // Transform agents to the expected format
    const transformedAgents = agentsList.map((agent) => {
      // Normalize status to 3-tier system
      let normalizedStatus: "active" | "paused" | "inactive";
      switch (agent.status) {
        case "active":
          normalizedStatus = "active";
          break;
        case "paused":
          normalizedStatus = "paused";
          break;
        default:
          normalizedStatus = "inactive";
      }

      return {
        id: agent.id,
        name: agent.name,
        description: agent.description || "No description",
        type: agent.type,
        status: normalizedStatus,
        tasksToday: agent.executionCount || 0,
        lastActive: agent.lastExecutedAt || new Date(),
        unreadMessages: 0, // Will be populated from conversations API
      };
    });

    // Calculate stats
    const total = totalExecutions[0]?.count || 0;
    const successful = successfulExecutions[0]?.count || 0;
    const stats = {
      activeAgents: agentsList.filter((a) => a.status === "active").length,
      totalTasks: total,
      totalTimeSaved: (total * 0.05).toFixed(1), // Estimate ~3 min saved per task
      successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
    };

    return (
      <ErrorBoundary>
        <MyAgentsDashboard
          initialAgents={transformedAgents}
          initialStats={stats}
        />
      </ErrorBoundary>
    );
  } catch (error) {
    logger.error(
      "My Agents page error",
      error instanceof Error ? error.message : String(error)
    );
    return (
      <ErrorBoundary>
        <MyAgentsDashboard />
      </ErrorBoundary>
    );
  }
}
