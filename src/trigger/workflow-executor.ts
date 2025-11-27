import { task, schedules } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { agents, agentExecutions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/logger";

/**
 * Execute Agent/Workflow Task
 * Runs an AI agent with the given inputs
 */
export const executeAgentTask = task({
  id: "execute-agent",
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: {
    agentId: string;
    workspaceId: string;
    inputs?: Record<string, unknown>;
    triggeredBy?: string;
  }) => {
    const { agentId, workspaceId, inputs = {}, triggeredBy = "system" } = payload;

    // Get the agent
    const agent = await db.query.agents.findFirst({
      where: and(eq(agents.id, agentId), eq(agents.workspaceId, workspaceId)),
    });

    if (!agent) {
      return { success: false, error: "Agent not found" };
    }

    if (agent.status !== "active") {
      return { success: false, error: `Agent is not active (status: ${agent.status})` };
    }

    // Create execution record
    const [execution] = await db
      .insert(agentExecutions)
      .values({
        workspaceId,
        agentId,
        status: "running",
        input: inputs,
        triggeredBy,
        startedAt: new Date(),
      })
      .returning();

    logger.info("Agent execution started", {
      executionId: execution.id,
      agentId,
      workspaceId,
    });

    try {
      // Get agent configuration
      const config = agent.config as {
        nodes?: Array<{
          id: string;
          type: string;
          data: Record<string, unknown>;
        }>;
        edges?: Array<{
          source: string;
          target: string;
        }>;
        systemPrompt?: string;
        tools?: string[];
      } | null;

      // Simple workflow execution
      // In a full implementation, this would parse nodes/edges and execute each step
      const results: Record<string, unknown> = {
        agentName: agent.name,
        agentType: agent.type,
        executedAt: new Date().toISOString(),
        inputs,
      };

      // Simulate processing based on configuration
      const nodeCount = config?.nodes?.length || 0;
      const toolCount = config?.tools?.length || 0;
      
      if (nodeCount > 0) {
        results.nodesProcessed = nodeCount;
      }
      if (toolCount > 0) {
        results.toolsAvailable = toolCount;
      }
      results.message = `Agent "${agent.name}" executed successfully`;

      // Update execution record with success
      await db
        .update(agentExecutions)
        .set({
          status: "completed",
          output: results,
          completedAt: new Date(),
        })
        .where(eq(agentExecutions.id, execution.id));

      // Update agent stats
      await db
        .update(agents)
        .set({
          executionCount: (agent.executionCount || 0) + 1,
          lastExecutedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(agents.id, agentId));

      logger.info("Agent execution completed", {
        executionId: execution.id,
        agentId,
        workspaceId,
      });

      return {
        success: true,
        executionId: execution.id,
        results,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Update execution record with error
      await db
        .update(agentExecutions)
        .set({
          status: "failed",
          error: { message: errorMessage },
          completedAt: new Date(),
        })
        .where(eq(agentExecutions.id, execution.id));

      logger.error("Agent execution failed", {
        executionId: execution.id,
        agentId,
        error: errorMessage,
      });

      return {
        success: false,
        executionId: execution.id,
        error: errorMessage,
      };
    }
  },
});

/**
 * Process Active Agents Task
 * Checks all active agents and triggers any pending scheduled executions
 */
export const processActiveAgentsTask = task({
  id: "process-active-agents",
  run: async (payload: { workspaceId?: string }) => {
    const { workspaceId } = payload;

    // Get all active agents, optionally filtered by workspace
    const conditions = [eq(agents.status, "active")];
    if (workspaceId) {
      conditions.push(eq(agents.workspaceId, workspaceId));
    }

    const activeAgents = await db.query.agents.findMany({
      where: and(...conditions),
    });

    logger.info("Processing active agents", {
      count: activeAgents.length,
      workspaceId: workspaceId || "all",
    });

    // For now, just return the count - scheduled execution would need 
    // a separate scheduling mechanism (e.g., using agentSchedules table)
    return {
      success: true,
      activeAgentCount: activeAgents.length,
      agents: activeAgents.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        executionCount: a.executionCount,
        lastExecutedAt: a.lastExecutedAt,
      })),
    };
  },
});

/**
 * Scheduled Agent Health Check
 * Runs hourly to monitor agent status and executions
 */
export const scheduledAgentHealthCheck = schedules.task({
  id: "scheduled-agent-health-check",
  cron: "0 * * * *", // Every hour
  run: async () => {
    logger.info("Running scheduled agent health check");

    // Get stats on all agents
    const allAgents = await db.query.agents.findMany();
    
    const stats = {
      total: allAgents.length,
      active: allAgents.filter((a) => a.status === "active").length,
      draft: allAgents.filter((a) => a.status === "draft").length,
      paused: allAgents.filter((a) => a.status === "paused").length,
      totalExecutions: allAgents.reduce((sum, a) => sum + (a.executionCount || 0), 0),
    };

    logger.info("Agent health check completed", stats);

    return {
      success: true,
      stats,
      checkedAt: new Date().toISOString(),
    };
  },
});
