/**
 * Workflow Executor Trigger.dev Jobs
 *
 * Background jobs for:
 * - Executing multi-agent workflows
 * - Processing individual workflow steps
 * - Handling step completion and routing
 * - Scheduled workflow triggers
 */

import { task, schedules } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { agentWorkflows, agentWorkflowExecutions } from "@/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { WorkflowEngine } from "@/lib/orchestration/workflow-engine";
import type {
  WorkflowStep,
  ExecutionStatus,
  WorkflowTriggerType,
} from "@/lib/orchestration/types";

// ============================================================================
// WORKFLOW EXECUTION JOB
// ============================================================================

/**
 * Execute Workflow Task
 * Durable, retried execution of a workflow
 */
export const executeWorkflowTask = task({
  id: "execute-workflow",
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 30000,
    factor: 2,
  },
  run: async (payload: {
    workflowId: string;
    workspaceId: string;
    triggerType: WorkflowTriggerType;
    triggerData?: Record<string, unknown>;
    triggeredBy?: string;
    initialContext?: Record<string, unknown>;
  }) => {
    const {
      workflowId,
      workspaceId,
      triggerType,
      triggerData,
      triggeredBy,
      initialContext,
    } = payload;

    logger.info("[Trigger] Starting workflow execution", {
      workflowId,
      workspaceId,
      triggerType,
    });

    // Validate workflow exists
    const workflow = await db.query.agentWorkflows.findFirst({
      where: and(
        eq(agentWorkflows.id, workflowId),
        eq(agentWorkflows.workspaceId, workspaceId)
      ),
    });

    if (!workflow) {
      logger.error("[Trigger] Workflow not found", { workflowId, workspaceId });
      return {
        success: false,
        error: "Workflow not found",
      };
    }

    if (workflow.status !== "active") {
      logger.error("[Trigger] Workflow not active", {
        workflowId,
        status: workflow.status,
      });
      return {
        success: false,
        error: `Workflow is not active (status: ${workflow.status})`,
      };
    }

    // Execute the workflow
    const engine = new WorkflowEngine(workspaceId);

    const result = await engine.execute({
      workflowId,
      workspaceId,
      trigger: {
        type: triggerType,
        data: triggerData,
        triggeredBy,
      },
      initialContext,
    });

    logger.info("[Trigger] Workflow execution completed", {
      workflowId,
      success: result.success,
      executionId: result.executionId,
      status: result.status,
      completedSteps: result.completedSteps,
      totalSteps: result.totalSteps,
    });

    return result;
  },
});

// ============================================================================
// STEP EXECUTION JOB
// ============================================================================

/**
 * Execute Workflow Step Task
 * Executes a single step in a workflow
 */
export const executeWorkflowStepTask = task({
  id: "execute-workflow-step",
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 500,
    maxTimeoutInMs: 15000,
    factor: 2,
  },
  run: async (payload: {
    executionId: string;
    workspaceId: string;
    stepId: string;
    context?: Record<string, unknown>;
  }) => {
    const { executionId, workspaceId, stepId, context } = payload;

    logger.info("[Trigger] Executing workflow step", {
      executionId,
      workspaceId,
      stepId,
    });

    // Get execution
    const execution = await db.query.agentWorkflowExecutions.findFirst({
      where: and(
        eq(agentWorkflowExecutions.id, executionId),
        eq(agentWorkflowExecutions.workspaceId, workspaceId)
      ),
    });

    if (!execution) {
      return {
        success: false,
        error: "Execution not found",
      };
    }

    // Get workflow
    const workflow = await db.query.agentWorkflows.findFirst({
      where: eq(agentWorkflows.id, execution.workflowId),
    });

    if (!workflow) {
      return {
        success: false,
        error: "Workflow not found",
      };
    }

    const steps = workflow.steps as WorkflowStep[];
    const step = steps.find((s) => s.id === stepId);

    if (!step) {
      return {
        success: false,
        error: "Step not found",
      };
    }

    // Execute the step
    const engine = new WorkflowEngine(workspaceId);

    const stepResult = await engine.executeStep({
      execution: {
        id: execution.id,
        workspaceId: execution.workspaceId,
        workflowId: execution.workflowId,
        status: execution.status as ExecutionStatus,
        currentStepId: execution.currentStepId || undefined,
        currentStepIndex: execution.currentStepIndex,
        stepResults: (execution.stepResults || {}) as Record<string, import("@/lib/orchestration/types").StepResult>,
        context: context || (execution.context as Record<string, unknown>) || {},
        triggeredBy: execution.triggeredBy || undefined,
        triggerType: execution.triggerType || undefined,
        triggerData: execution.triggerData as Record<string, unknown> | undefined,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt || undefined,
        pausedAt: execution.pausedAt || undefined,
        durationMs: execution.durationMs || undefined,
        totalSteps: execution.totalSteps,
        completedSteps: execution.completedSteps,
        error: execution.error as import("@/lib/orchestration/types").WorkflowExecution["error"],
      },
      step,
      context: context || (execution.context as Record<string, unknown>) || {},
    });

    // Handle step completion
    await engine.handleStepComplete(executionId, stepId, stepResult);

    logger.info("[Trigger] Step execution completed", {
      executionId,
      stepId,
      status: stepResult.status,
    });

    return {
      success: stepResult.status === "completed" || stepResult.status === "skipped",
      stepResult,
    };
  },
});

// ============================================================================
// RESUME WORKFLOW JOB
// ============================================================================

/**
 * Resume Workflow Task
 * Resumes a paused workflow execution
 */
export const resumeWorkflowTask = task({
  id: "resume-workflow",
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: { executionId: string; workspaceId: string }) => {
    const { executionId, workspaceId } = payload;

    logger.info("[Trigger] Resuming workflow", { executionId, workspaceId });

    const engine = new WorkflowEngine(workspaceId);
    const result = await engine.resume(executionId);

    logger.info("[Trigger] Workflow resume completed", {
      executionId,
      success: result.success,
      status: result.status,
    });

    return result;
  },
});

// ============================================================================
// RETRY STEP JOB
// ============================================================================

/**
 * Retry Step Task
 * Retries a failed workflow step
 */
export const retryWorkflowStepTask = task({
  id: "retry-workflow-step",
  retry: {
    maxAttempts: 2,
  },
  run: async (payload: {
    executionId: string;
    workspaceId: string;
    stepId: string;
  }) => {
    const { executionId, workspaceId, stepId } = payload;

    logger.info("[Trigger] Retrying workflow step", {
      executionId,
      workspaceId,
      stepId,
    });

    const engine = new WorkflowEngine(workspaceId);
    const result = await engine.retryStep(executionId, stepId);

    logger.info("[Trigger] Step retry completed", {
      executionId,
      stepId,
      status: result.status,
    });

    return {
      success: result.status === "completed" || result.status === "skipped",
      stepResult: result,
    };
  },
});

// ============================================================================
// SCHEDULED WORKFLOWS
// ============================================================================

/**
 * Process Scheduled Workflows
 * Checks for workflows with cron triggers and executes them
 */
export const processScheduledWorkflows = schedules.task({
  id: "process-scheduled-workflows",
  cron: "* * * * *", // Every minute
  run: async () => {
    logger.info("[Trigger] Processing scheduled workflows");

    // Get all active workflows with schedule triggers
    const scheduledWorkflows = await db.query.agentWorkflows.findMany({
      where: and(
        eq(agentWorkflows.status, "active"),
        eq(agentWorkflows.triggerType, "schedule")
      ),
    });

    const results = [];

    for (const workflow of scheduledWorkflows) {
      const triggerConfig = workflow.triggerConfig as { cron?: string } | null;
      const cronExpression = triggerConfig?.cron;

      if (!cronExpression) continue;

      // Check if the cron matches current time
      // For simplicity, we'll use a basic check - in production use a proper cron parser
      const shouldRun = shouldCronRun(cronExpression);

      if (shouldRun) {
        try {
          const result = await executeWorkflowTask.trigger({
            workflowId: workflow.id,
            workspaceId: workflow.workspaceId,
            triggerType: "schedule",
            triggerData: { cron: cronExpression },
          });

          results.push({
            workflowId: workflow.id,
            success: true,
            triggerId: result.id,
          });
        } catch (error) {
          logger.error("[Trigger] Failed to trigger scheduled workflow", {
            workflowId: workflow.id,
            error,
          });
          results.push({
            workflowId: workflow.id,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    logger.info("[Trigger] Scheduled workflows processed", {
      checked: scheduledWorkflows.length,
      triggered: results.filter((r) => r.success).length,
    });

    return {
      success: true,
      results,
      processedAt: new Date().toISOString(),
    };
  },
});

/**
 * Cleanup Stale Executions
 * Marks stuck executions as failed after timeout
 */
export const cleanupStaleExecutions = schedules.task({
  id: "cleanup-stale-executions",
  cron: "0 * * * *", // Every hour
  run: async () => {
    logger.info("[Trigger] Cleaning up stale executions");

    const staleThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours

    // Find running executions older than threshold
    const staleExecutions = await db.query.agentWorkflowExecutions.findMany({
      where: and(
        eq(agentWorkflowExecutions.status, "running"),
        lte(agentWorkflowExecutions.startedAt, staleThreshold)
      ),
    });

    let markedAsFailed = 0;

    for (const execution of staleExecutions) {
      await db
        .update(agentWorkflowExecutions)
        .set({
          status: "failed",
          completedAt: new Date(),
          error: {
            message: "Execution timed out after 24 hours",
            details: { markedStaleAt: new Date().toISOString() },
          },
        })
        .where(eq(agentWorkflowExecutions.id, execution.id));

      markedAsFailed++;
    }

    logger.info("[Trigger] Stale executions cleaned up", {
      found: staleExecutions.length,
      markedAsFailed,
    });

    return {
      success: true,
      staleFound: staleExecutions.length,
      markedAsFailed,
      cleanedAt: new Date().toISOString(),
    };
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Simple cron check - matches common patterns
 * In production, use a proper cron library like `cron-parser`
 */
function shouldCronRun(cronExpression: string): boolean {
  const now = new Date();
  const parts = cronExpression.split(" ");

  if (parts.length !== 5) return false;

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Check minute
  if (minute !== "*" && parseInt(minute) !== now.getMinutes()) return false;

  // Check hour
  if (hour !== "*" && parseInt(hour) !== now.getHours()) return false;

  // Check day of month
  if (dayOfMonth !== "*" && parseInt(dayOfMonth) !== now.getDate()) return false;

  // Check month (1-12)
  if (month !== "*" && parseInt(month) !== now.getMonth() + 1) return false;

  // Check day of week (0-6, 0 = Sunday)
  if (dayOfWeek !== "*") {
    const days = dayOfWeek.split(",").map((d) => parseInt(d));
    if (!days.includes(now.getDay())) return false;
  }

  return true;
}

/**
 * Trigger workflow execution from API
 */
export async function triggerWorkflowExecution(
  workflowId: string,
  workspaceId: string,
  options: {
    triggerType?: WorkflowTriggerType;
    triggerData?: Record<string, unknown>;
    triggeredBy?: string;
    initialContext?: Record<string, unknown>;
  } = {}
): Promise<{ id: string }> {
  return executeWorkflowTask.trigger({
    workflowId,
    workspaceId,
    triggerType: options.triggerType || "manual",
    triggerData: options.triggerData,
    triggeredBy: options.triggeredBy,
    initialContext: options.initialContext,
  });
}

