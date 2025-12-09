/**
 * Team Executor Trigger.dev Jobs
 *
 * Background jobs for:
 * - Team execution with objectives
 * - Queue processing for team tasks
 * - Memory cleanup for expired short-term memories
 */

import { task, schedules } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { agentTeams, agentSharedMemory } from "@/db/schema";
import { eq, and, lte, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { TeamExecutor } from "@/lib/orchestration/team-executor";
import { AgentMemoryService } from "@/lib/orchestration/memory";
import type { MessagePriority } from "@/lib/orchestration/types";

// ============================================================================
// TEAM EXECUTION JOB
// ============================================================================

/**
 * Execute Team Task
 * Durable, retried execution of a team with an objective
 */
export const executeTeamTask = task({
  id: "execute-team",
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload: {
    teamId: string;
    workspaceId: string;
    objective: string;
    priority?: MessagePriority;
    context?: Record<string, unknown>;
    deadline?: string; // ISO string
    requiredCapabilities?: string[];
    triggeredBy?: string;
  }) => {
    const {
      teamId,
      workspaceId,
      objective,
      priority = "normal",
      context,
      deadline,
      requiredCapabilities,
    } = payload;

    logger.info("[Trigger] Starting team execution", {
      teamId,
      workspaceId,
      objective,
    });

    // Validate team exists
    const team = await db.query.agentTeams.findFirst({
      where: and(
        eq(agentTeams.id, teamId),
        eq(agentTeams.workspaceId, workspaceId)
      ),
    });

    if (!team) {
      logger.error("[Trigger] Team not found", { teamId, workspaceId });
      return {
        success: false,
        error: "Team not found",
      };
    }

    if (team.status !== "active") {
      logger.error("[Trigger] Team not active", { teamId, status: team.status });
      return {
        success: false,
        error: `Team is not active (status: ${team.status})`,
      };
    }

    // Execute the team
    const executor = new TeamExecutor(workspaceId);

    const result = await executor.run(teamId, {
      objective,
      priority,
      context,
      deadline: deadline ? new Date(deadline) : undefined,
      requiredCapabilities,
    });

    logger.info("[Trigger] Team execution completed", {
      teamId,
      success: result.success,
      durationMs: result.durationMs,
      agentsInvolved: result.agentsInvolved.length,
    });

    return result;
  },
});

// ============================================================================
// TEAM QUEUE PROCESSOR
// ============================================================================

interface QueuedTeamTask {
  id: string;
  teamId: string;
  workspaceId: string;
  objective: string;
  priority: MessagePriority;
  context?: Record<string, unknown>;
  deadline?: string;
  requiredCapabilities?: string[];
  createdAt: string;
}

// In-memory queue (in production, use Redis or a dedicated queue service)
const teamTaskQueue: QueuedTeamTask[] = [];

/**
 * Process Team Queue
 * Processes pending team tasks from the queue
 */
export const processTeamQueueTask = task({
  id: "process-team-queue",
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: { batchSize?: number }) => {
    const { batchSize = 5 } = payload;

    logger.info("[Trigger] Processing team queue", { batchSize });

    // Get pending tasks from queue (sorted by priority and time)
    const priorityOrder: Record<MessagePriority, number> = {
      urgent: 0,
      high: 1,
      normal: 2,
      low: 3,
    };

    const sortedTasks = [...teamTaskQueue].sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    const tasksToProcess = sortedTasks.slice(0, batchSize);

    if (tasksToProcess.length === 0) {
      logger.info("[Trigger] No tasks in queue");
      return {
        success: true,
        processed: 0,
        remaining: 0,
      };
    }

    const results = [];

    for (const task of tasksToProcess) {
      try {
        // Trigger team execution
        const result = await executeTeamTask.trigger({
          teamId: task.teamId,
          workspaceId: task.workspaceId,
          objective: task.objective,
          priority: task.priority,
          context: task.context,
          deadline: task.deadline,
          requiredCapabilities: task.requiredCapabilities,
        });

        // Remove from queue
        const index = teamTaskQueue.findIndex((t) => t.id === task.id);
        if (index > -1) {
          teamTaskQueue.splice(index, 1);
        }

        results.push({
          taskId: task.id,
          success: true,
          triggerId: result.id,
        });
      } catch (error) {
        logger.error("[Trigger] Failed to process task", {
          taskId: task.id,
          error,
        });
        results.push({
          taskId: task.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      success: true,
      processed: results.length,
      remaining: teamTaskQueue.length,
      results,
    };
  },
});

// ============================================================================
// MEMORY CLEANUP JOB
// ============================================================================

/**
 * Cleanup Team Memory
 * Removes expired short-term memories and promotes eligible memories
 */
export const cleanupTeamMemoryTask = task({
  id: "cleanup-team-memory",
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: { workspaceId?: string }) => {
    const { workspaceId } = payload;

    logger.info("[Trigger] Starting memory cleanup", { workspaceId });

    const now = new Date();
    let totalDeleted = 0;
    let totalPromoted = 0;

    if (workspaceId) {
      // Cleanup specific workspace
      const memoryService = new AgentMemoryService(workspaceId);

      // Cleanup expired memories
      const deleted = await memoryService.cleanup();
      totalDeleted += deleted;

      // Check and promote eligible memories
      const promoted = await memoryService.checkPromotions();
      totalPromoted += promoted;
    } else {
      // Cleanup all workspaces
      // Delete expired memories across all workspaces
      const result = await db
        .delete(agentSharedMemory)
        .where(lte(agentSharedMemory.expiresAt, now))
        .returning();

      totalDeleted = result.length;

      // Get all unique workspace IDs for promotion checks
      const workspaces = await db.execute(
        sql`SELECT DISTINCT workspace_id FROM agent_shared_memory`
      );

      for (const row of workspaces.rows as Array<{ workspace_id: string }>) {
        const memoryService = new AgentMemoryService(row.workspace_id);
        const promoted = await memoryService.checkPromotions();
        totalPromoted += promoted;
      }
    }

    logger.info("[Trigger] Memory cleanup completed", {
      workspaceId: workspaceId || "all",
      deleted: totalDeleted,
      promoted: totalPromoted,
    });

    return {
      success: true,
      deletedCount: totalDeleted,
      promotedCount: totalPromoted,
      cleanedAt: now.toISOString(),
    };
  },
});

// ============================================================================
// SCHEDULED JOBS
// ============================================================================

/**
 * Scheduled Memory Cleanup
 * Runs every 6 hours to clean up expired memories
 */
export const scheduledMemoryCleanup = schedules.task({
  id: "scheduled-memory-cleanup",
  cron: "0 */6 * * *", // Every 6 hours
  run: async () => {
    logger.info("[Trigger] Running scheduled memory cleanup");

    const result = await cleanupTeamMemoryTask.trigger({});

    return {
      success: true,
      triggerId: result.id,
      scheduledAt: new Date().toISOString(),
    };
  },
});

/**
 * Scheduled Queue Processing
 * Runs every 5 minutes to process pending team tasks
 */
export const scheduledQueueProcessing = schedules.task({
  id: "scheduled-queue-processing",
  cron: "*/5 * * * *", // Every 5 minutes
  run: async () => {
    logger.info("[Trigger] Running scheduled queue processing");

    const result = await processTeamQueueTask.trigger({
      batchSize: 10,
    });

    return {
      success: true,
      triggerId: result.id,
      scheduledAt: new Date().toISOString(),
    };
  },
});

/**
 * Scheduled Team Health Check
 * Runs daily to check team health and update metrics
 */
export const scheduledTeamHealthCheck = schedules.task({
  id: "scheduled-team-health-check",
  cron: "0 6 * * *", // Daily at 6 AM
  run: async () => {
    logger.info("[Trigger] Running scheduled team health check");

    // Get all teams
    const allTeams = await db.query.agentTeams.findMany();

    const stats = {
      total: allTeams.length,
      active: allTeams.filter((t) => t.status === "active").length,
      paused: allTeams.filter((t) => t.status === "paused").length,
      archived: allTeams.filter((t) => t.status === "archived").length,
      totalExecutions: allTeams.reduce(
        (sum, t) => sum + (t.totalExecutions || 0),
        0
      ),
      successfulExecutions: allTeams.reduce(
        (sum, t) => sum + (t.successfulExecutions || 0),
        0
      ),
    };

    const successRate =
      stats.totalExecutions > 0
        ? Math.round((stats.successfulExecutions / stats.totalExecutions) * 100)
        : 0;

    logger.info("[Trigger] Team health check completed", {
      ...stats,
      successRate: `${successRate}%`,
    });

    return {
      success: true,
      stats: {
        ...stats,
        successRate,
      },
      checkedAt: new Date().toISOString(),
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Add a task to the team queue
 * Can be called from API routes to queue team executions
 */
export function queueTeamTask(task: Omit<QueuedTeamTask, "id" | "createdAt">): string {
  const id = crypto.randomUUID();
  teamTaskQueue.push({
    ...task,
    id,
    createdAt: new Date().toISOString(),
  });
  return id;
}

/**
 * Get queue status
 */
export function getQueueStatus(): {
  pendingCount: number;
  tasksByPriority: Record<MessagePriority, number>;
} {
  const tasksByPriority = teamTaskQueue.reduce(
    (acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    },
    {} as Record<MessagePriority, number>
  );

  return {
    pendingCount: teamTaskQueue.length,
    tasksByPriority,
  };
}

