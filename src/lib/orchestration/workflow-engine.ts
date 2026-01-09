/**
 * Workflow Engine - Multi-Agent Workflow Execution
 *
 * The WorkflowEngine is responsible for:
 * - Executing multi-agent workflows from start to finish
 * - Processing individual workflow steps with conditions
 * - Handling step completion and routing to next steps
 * - Resuming paused workflows
 * - Managing execution context and state
 */

import { db } from '@/lib/db';
import {
  agentWorkflows,
  agentWorkflowExecutions,
  agents,
} from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { AgentMessageBus } from './message-bus';
import { AgentMemoryService } from './memory';
import type {
  WorkflowStep,
  WorkflowExecution,
  StepResult,
  ExecutionStatus,
  WorkflowStepCondition,
  WorkflowTriggerType,
} from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface WorkflowTrigger {
  type: WorkflowTriggerType;
  data?: Record<string, unknown>;
  triggeredBy?: string;
}

export interface ExecuteWorkflowOptions {
  workflowId: string;
  workspaceId: string;
  trigger: WorkflowTrigger;
  initialContext?: Record<string, unknown>;
}

export interface StepExecutionOptions {
  execution: WorkflowExecution;
  step: WorkflowStep;
  context: Record<string, unknown>;
}

export interface WorkflowEngineResult {
  success: boolean;
  executionId: string;
  status: ExecutionStatus;
  currentStepId?: string;
  completedSteps: number;
  totalSteps: number;
  output?: unknown;
  error?: {
    message: string;
    step?: string;
    details?: unknown;
  };
}

// ============================================================================
// WORKFLOW ENGINE CLASS
// ============================================================================

export class WorkflowEngine {
  private workspaceId: string;
  private messageBus: AgentMessageBus;
  private memoryService: AgentMemoryService;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
    this.messageBus = new AgentMessageBus(workspaceId);
    this.memoryService = new AgentMemoryService(workspaceId);
  }

  // ==========================================================================
  // WORKFLOW EXECUTION
  // ==========================================================================

  /**
   * Execute a workflow from start
   */
  async execute(options: ExecuteWorkflowOptions): Promise<WorkflowEngineResult> {
    const _startTime = Date.now();

    try {
      logger.info('[WorkflowEngine] Starting workflow execution', {
        workflowId: options.workflowId,
        workspaceId: options.workspaceId,
        triggerType: options.trigger.type,
      });

      // Get workflow
      const workflow = await db.query.agentWorkflows.findFirst({
        where: and(
          eq(agentWorkflows.id, options.workflowId),
          eq(agentWorkflows.workspaceId, this.workspaceId)
        ),
      });

      if (!workflow) {
        return this.errorResult('', 'Workflow not found', 0, 0);
      }

      if (workflow.status !== 'active') {
        return this.errorResult('', `Workflow is not active (status: ${workflow.status})`, 0, 0);
      }

      const steps = workflow.steps as WorkflowStep[];

      if (!steps || steps.length === 0) {
        return this.errorResult('', 'Workflow has no steps', 0, 0);
      }

      // Create execution record
      const [execution] = await db
        .insert(agentWorkflowExecutions)
        .values({
          workspaceId: this.workspaceId,
          workflowId: options.workflowId,
          status: 'running',
          currentStepIndex: 0,
          currentStepId: steps[0].id,
          stepResults: {},
          context: options.initialContext || {},
          triggeredBy: options.trigger.triggeredBy,
          triggerType: options.trigger.type,
          triggerData: options.trigger.data,
          totalSteps: steps.length,
          completedSteps: 0,
        })
        .returning();

      // Store execution context in memory
      await this.memoryService.store({
        workspaceId: this.workspaceId,
        memoryTier: 'short_term',
        category: 'context',
        key: `workflow_execution_${execution.id}`,
        value: {
          workflowId: options.workflowId,
          workflowName: workflow.name,
          triggerType: options.trigger.type,
          startedAt: new Date().toISOString(),
        },
        importance: 80,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      // Execute the first step
      const firstStep = steps[0];
      const context = {
        ...options.initialContext,
        triggerData: options.trigger.data,
      };

      const stepResult = await this.executeStep({
        execution: {
          id: execution.id,
          workspaceId: this.workspaceId,
          workflowId: options.workflowId,
          status: 'running',
          currentStepId: firstStep.id,
          currentStepIndex: 0,
          stepResults: {},
          context,
          triggeredBy: options.trigger.triggeredBy,
          triggerType: options.trigger.type,
          triggerData: options.trigger.data,
          startedAt: execution.startedAt,
          totalSteps: steps.length,
          completedSteps: 0,
        },
        step: firstStep,
        context,
      });

      // Handle step completion
      await this.handleStepComplete(execution.id, firstStep.id, stepResult);

      // Update workflow metrics
      await db
        .update(agentWorkflows)
        .set({
          totalExecutions: sql`${agentWorkflows.totalExecutions} + 1`,
          lastExecutedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(agentWorkflows.id, options.workflowId));

      // Get updated execution status
      const updatedExecution = await this.getExecution(execution.id);

      return {
        success: true,
        executionId: execution.id,
        status: updatedExecution?.status || 'running',
        currentStepId: updatedExecution?.currentStepId,
        completedSteps: updatedExecution?.completedSteps || 1,
        totalSteps: steps.length,
        output: updatedExecution?.context,
      };
    } catch (error) {
      logger.error('[WorkflowEngine] Workflow execution failed', error);
      return this.errorResult(
        '',
        error instanceof Error ? error.message : 'Unknown error',
        0,
        0
      );
    }
  }

  /**
   * Resume a paused workflow execution
   */
  async resume(executionId: string): Promise<WorkflowEngineResult> {
    try {
      logger.info('[WorkflowEngine] Resuming workflow', { executionId });

      const execution = await this.getExecution(executionId);

      if (!execution) {
        return this.errorResult(executionId, 'Execution not found', 0, 0);
      }

      if (execution.status !== 'paused') {
        return this.errorResult(
          executionId,
          `Cannot resume execution with status: ${execution.status}`,
          execution.completedSteps,
          execution.totalSteps
        );
      }

      // Get workflow and steps
      const workflow = await db.query.agentWorkflows.findFirst({
        where: eq(agentWorkflows.id, execution.workflowId),
      });

      if (!workflow) {
        return this.errorResult(executionId, 'Workflow not found', 0, 0);
      }

      const steps = workflow.steps as WorkflowStep[];
      const currentStep = steps.find((s) => s.id === execution.currentStepId);

      if (!currentStep) {
        return this.errorResult(
          executionId,
          'Current step not found',
          execution.completedSteps,
          execution.totalSteps
        );
      }

      // Update status to running
      await db
        .update(agentWorkflowExecutions)
        .set({
          status: 'running',
          pausedAt: null,
        })
        .where(eq(agentWorkflowExecutions.id, executionId));

      // Execute the current step
      const stepResult = await this.executeStep({
        execution: { ...execution, status: 'running' },
        step: currentStep,
        context: execution.context,
      });

      // Handle step completion
      await this.handleStepComplete(executionId, currentStep.id, stepResult);

      // Get updated execution
      const updatedExecution = await this.getExecution(executionId);

      return {
        success: true,
        executionId,
        status: updatedExecution?.status || 'running',
        currentStepId: updatedExecution?.currentStepId,
        completedSteps: updatedExecution?.completedSteps || execution.completedSteps,
        totalSteps: execution.totalSteps,
        output: updatedExecution?.context,
      };
    } catch (error) {
      logger.error('[WorkflowEngine] Resume failed', error);
      return this.errorResult(
        executionId,
        error instanceof Error ? error.message : 'Unknown error',
        0,
        0
      );
    }
  }

  /**
   * Pause a running workflow execution
   */
  async pause(executionId: string): Promise<WorkflowEngineResult> {
    try {
      const execution = await this.getExecution(executionId);

      if (!execution) {
        return this.errorResult(executionId, 'Execution not found', 0, 0);
      }

      if (execution.status !== 'running') {
        return this.errorResult(
          executionId,
          `Cannot pause execution with status: ${execution.status}`,
          execution.completedSteps,
          execution.totalSteps
        );
      }

      await db
        .update(agentWorkflowExecutions)
        .set({
          status: 'paused',
          pausedAt: new Date(),
        })
        .where(eq(agentWorkflowExecutions.id, executionId));

      return {
        success: true,
        executionId,
        status: 'paused',
        currentStepId: execution.currentStepId,
        completedSteps: execution.completedSteps,
        totalSteps: execution.totalSteps,
      };
    } catch (error) {
      logger.error('[WorkflowEngine] Pause failed', error);
      return this.errorResult(
        executionId,
        error instanceof Error ? error.message : 'Unknown error',
        0,
        0
      );
    }
  }

  /**
   * Cancel a workflow execution
   */
  async cancel(executionId: string): Promise<WorkflowEngineResult> {
    try {
      const execution = await this.getExecution(executionId);

      if (!execution) {
        return this.errorResult(executionId, 'Execution not found', 0, 0);
      }

      if (execution.status === 'completed' || execution.status === 'cancelled') {
        return this.errorResult(
          executionId,
          `Cannot cancel execution with status: ${execution.status}`,
          execution.completedSteps,
          execution.totalSteps
        );
      }

      await db
        .update(agentWorkflowExecutions)
        .set({
          status: 'cancelled',
          completedAt: new Date(),
          durationMs: Date.now() - new Date(execution.startedAt).getTime(),
        })
        .where(eq(agentWorkflowExecutions.id, executionId));

      return {
        success: true,
        executionId,
        status: 'cancelled',
        currentStepId: execution.currentStepId,
        completedSteps: execution.completedSteps,
        totalSteps: execution.totalSteps,
      };
    } catch (error) {
      logger.error('[WorkflowEngine] Cancel failed', error);
      return this.errorResult(
        executionId,
        error instanceof Error ? error.message : 'Unknown error',
        0,
        0
      );
    }
  }

  // ==========================================================================
  // STEP EXECUTION
  // ==========================================================================

  /**
   * Execute a single workflow step
   */
  async executeStep(options: StepExecutionOptions): Promise<StepResult> {
    const { execution, step, context } = options;
    const startTime = Date.now();

    try {
      logger.info('[WorkflowEngine] Executing step', {
        executionId: execution.id,
        stepId: step.id,
        stepName: step.name,
        agentId: step.agentId,
        action: step.action,
      });

      // Check step conditions
      if (step.conditions && step.conditions.length > 0) {
        const conditionsMet = this.evaluateConditions(step.conditions, context);
        if (!conditionsMet) {
          logger.info('[WorkflowEngine] Step conditions not met, skipping', {
            stepId: step.id,
          });
          return {
            status: 'skipped',
            output: { reason: 'Conditions not met' },
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
            durationMs: Date.now() - startTime,
          };
        }
      }

      // Get the agent
      const agent = await db.query.agents.findFirst({
        where: and(
          eq(agents.id, step.agentId),
          eq(agents.workspaceId, this.workspaceId)
        ),
      });

      if (!agent) {
        return {
          status: 'failed',
          output: null,
          error: `Agent not found: ${step.agentId}`,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - startTime,
        };
      }

      if (agent.status !== 'active') {
        return {
          status: 'failed',
          output: null,
          error: `Agent is not active: ${agent.name} (status: ${agent.status})`,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - startTime,
        };
      }

      // Send task to agent via message bus
      const messageId = await this.messageBus.send({
        workspaceId: this.workspaceId,
        toAgentId: step.agentId,
        messageType: 'task',
        content: {
          subject: `Workflow Step: ${step.name}`,
          body: `Execute action: ${step.action}`,
          data: {
            stepId: step.id,
            action: step.action,
            inputs: step.inputs,
            context,
            executionId: execution.id,
            workflowId: execution.workflowId,
          },
          priority: 'high',
        },
      });

      // For now, simulate successful step execution
      // In production, this would wait for agent completion via message bus or webhook
      const durationMs = Date.now() - startTime;

      // Update agent last executed time
      await db
        .update(agents)
        .set({
          lastExecutedAt: new Date(),
          executionCount: sql`${agents.executionCount} + 1`,
        })
        .where(eq(agents.id, step.agentId));

      return {
        status: 'completed',
        output: {
          messageId,
          agentId: step.agentId,
          agentName: agent.name,
          action: step.action,
          inputs: step.inputs,
          message: `Step "${step.name}" delegated to ${agent.name}`,
        },
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        durationMs,
      };
    } catch (error) {
      logger.error('[WorkflowEngine] Step execution failed', error);
      return {
        status: 'failed',
        output: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Handle step completion and route to next step
   */
  async handleStepComplete(
    executionId: string,
    stepId: string,
    result: StepResult
  ): Promise<void> {
    try {
      logger.info('[WorkflowEngine] Handling step completion', {
        executionId,
        stepId,
        status: result.status,
      });

      // Get execution
      const execution = await this.getExecution(executionId);
      if (!execution) {
        throw new Error('Execution not found');
      }

      // Get workflow
      const workflow = await db.query.agentWorkflows.findFirst({
        where: eq(agentWorkflows.id, execution.workflowId),
      });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const steps = workflow.steps as WorkflowStep[];
      const currentStep = steps.find((s) => s.id === stepId);

      if (!currentStep) {
        throw new Error('Step not found');
      }

      // Update step results
      const updatedStepResults = {
        ...execution.stepResults,
        [stepId]: result,
      };

      // Update context with step output
      const updatedContext = {
        ...execution.context,
        [`${currentStep.name.replace(/\s+/g, '_')}_result`]: result.output,
        lastStepId: stepId,
        lastStepStatus: result.status,
      };

      // Determine next step
      let nextStepId: string | null = null;
      let newStatus: ExecutionStatus = 'running';

      if (result.status === 'completed' || result.status === 'skipped') {
        // Check for success routing
        nextStepId = currentStep.onSuccess || null;

        if (!nextStepId) {
          // Find next step by order
          const currentIndex = steps.findIndex((s) => s.id === stepId);
          if (currentIndex < steps.length - 1) {
            nextStepId = steps[currentIndex + 1].id;
          }
        }
      } else if (result.status === 'failed') {
        // Check for failure routing
        nextStepId = currentStep.onFailure || null;

        // If no failure routing, workflow fails
        if (!nextStepId) {
          newStatus = 'failed';
        }
      }

      // Check if workflow is complete
      const isComplete = !nextStepId && newStatus !== 'failed';
      if (isComplete) {
        newStatus = 'completed';
      }

      // Update execution
      const now = new Date();
      const completedSteps = Object.values(updatedStepResults).filter(
        (r) => r.status === 'completed' || r.status === 'skipped'
      ).length;

      await db
        .update(agentWorkflowExecutions)
        .set({
          status: newStatus,
          currentStepId: nextStepId,
          currentStepIndex: nextStepId ? steps.findIndex((s) => s.id === nextStepId) : execution.currentStepIndex,
          stepResults: updatedStepResults,
          context: updatedContext,
          completedSteps,
          completedAt: newStatus === 'completed' || newStatus === 'failed' ? now : null,
          durationMs:
            newStatus === 'completed' || newStatus === 'failed'
              ? now.getTime() - new Date(execution.startedAt).getTime()
              : null,
          error:
            newStatus === 'failed'
              ? {
                  message: result.error || 'Step failed',
                  step: stepId,
                  details: result.output,
                }
              : null,
        })
        .where(eq(agentWorkflowExecutions.id, executionId));

      // Update workflow success count if completed
      if (newStatus === 'completed') {
        await db
          .update(agentWorkflows)
          .set({
            successfulExecutions: sql`${agentWorkflows.successfulExecutions} + 1`,
            updatedAt: now,
          })
          .where(eq(agentWorkflows.id, execution.workflowId));
      }

      // If there's a next step and we're still running, execute it
      if (nextStepId && newStatus === 'running') {
        const nextStep = steps.find((s) => s.id === nextStepId);
        if (nextStep) {
          // Execute next step asynchronously
          // In production, this would be triggered via Trigger.dev
          setTimeout(async () => {
            const nextResult = await this.executeStep({
              execution: {
                ...execution,
                currentStepId: nextStepId!,
                stepResults: updatedStepResults,
                context: updatedContext,
              },
              step: nextStep,
              context: updatedContext,
            });
            await this.handleStepComplete(executionId, nextStepId!, nextResult);
          }, 100);
        }
      }

      logger.info('[WorkflowEngine] Step completion handled', {
        executionId,
        stepId,
        nextStepId,
        newStatus,
        completedSteps,
      });
    } catch (error) {
      logger.error('[WorkflowEngine] Failed to handle step completion', error);

      // Mark execution as failed
      await db
        .update(agentWorkflowExecutions)
        .set({
          status: 'failed',
          completedAt: new Date(),
          error: {
            message: error instanceof Error ? error.message : 'Unknown error',
            step: stepId,
          },
        })
        .where(eq(agentWorkflowExecutions.id, executionId));
    }
  }

  /**
   * Retry a failed step
   */
  async retryStep(executionId: string, stepId: string): Promise<StepResult> {
    try {
      const execution = await this.getExecution(executionId);
      if (!execution) {
        throw new Error('Execution not found');
      }

      const workflow = await db.query.agentWorkflows.findFirst({
        where: eq(agentWorkflows.id, execution.workflowId),
      });

      if (!workflow) {
        throw new Error('Workflow not found');
      }

      const steps = workflow.steps as WorkflowStep[];
      const step = steps.find((s) => s.id === stepId);

      if (!step) {
        throw new Error('Step not found');
      }

      // Check retry config
      const stepResult = execution.stepResults[stepId];
      const retryConfig = step.retryConfig || { maxAttempts: 3, backoffMs: 1000 };

      const metadata = (stepResult as StepResult & { retryCount?: number }) || {};
      const retryCount = metadata.retryCount || 0;

      if (retryCount >= retryConfig.maxAttempts) {
        return {
          status: 'failed',
          output: null,
          error: `Max retry attempts (${retryConfig.maxAttempts}) exceeded`,
          completedAt: new Date().toISOString(),
          durationMs: 0,
        };
      }

      // Update execution status
      await db
        .update(agentWorkflowExecutions)
        .set({
          status: 'running',
          currentStepId: stepId,
        })
        .where(eq(agentWorkflowExecutions.id, executionId));

      // Wait for backoff
      await new Promise((resolve) =>
        setTimeout(resolve, retryConfig.backoffMs * (retryCount + 1))
      );

      // Execute the step
      const result = await this.executeStep({
        execution: { ...execution, status: 'running' },
        step,
        context: execution.context,
      });

      // Add retry count to result
      const resultWithRetry = {
        ...result,
        retryCount: retryCount + 1,
      };

      // Handle completion
      await this.handleStepComplete(executionId, stepId, resultWithRetry);

      return resultWithRetry;
    } catch (error) {
      logger.error('[WorkflowEngine] Retry failed', error);
      return {
        status: 'failed',
        output: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        completedAt: new Date().toISOString(),
        durationMs: 0,
      };
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Evaluate step conditions
   */
  private evaluateConditions(
    conditions: WorkflowStepCondition[],
    context: Record<string, unknown>
  ): boolean {
    for (const condition of conditions) {
      const fieldValue = this.getNestedValue(context, condition.field);

      let conditionMet = false;

      switch (condition.operator) {
        case 'equals':
          conditionMet = fieldValue === condition.value;
          break;
        case 'not_equals':
          conditionMet = fieldValue !== condition.value;
          break;
        case 'contains':
          conditionMet =
            typeof fieldValue === 'string' &&
            typeof condition.value === 'string' &&
            fieldValue.includes(condition.value);
          break;
        case 'greater_than':
          conditionMet =
            typeof fieldValue === 'number' &&
            typeof condition.value === 'number' &&
            fieldValue > condition.value;
          break;
        case 'less_than':
          conditionMet =
            typeof fieldValue === 'number' &&
            typeof condition.value === 'number' &&
            fieldValue < condition.value;
          break;
        case 'exists':
          conditionMet = fieldValue !== undefined && fieldValue !== null;
          break;
        default:
          conditionMet = false;
      }

      // All conditions must be met (AND logic)
      if (!conditionMet) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split('.').reduce((current: unknown, key: string) => {
      if (current && typeof current === 'object') {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * Get execution by ID
   */
  private async getExecution(executionId: string): Promise<WorkflowExecution | null> {
    const execution = await db.query.agentWorkflowExecutions.findFirst({
      where: and(
        eq(agentWorkflowExecutions.id, executionId),
        eq(agentWorkflowExecutions.workspaceId, this.workspaceId)
      ),
    });

    if (!execution) {
      return null;
    }

    return {
      id: execution.id,
      workspaceId: execution.workspaceId,
      workflowId: execution.workflowId,
      status: execution.status as ExecutionStatus,
      currentStepId: execution.currentStepId || undefined,
      currentStepIndex: execution.currentStepIndex,
      stepResults: (execution.stepResults || {}) as Record<string, StepResult>,
      context: (execution.context || {}) as Record<string, unknown>,
      triggeredBy: execution.triggeredBy || undefined,
      triggerType: execution.triggerType || undefined,
      triggerData: execution.triggerData as Record<string, unknown> | undefined,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt || undefined,
      pausedAt: execution.pausedAt || undefined,
      durationMs: execution.durationMs || undefined,
      totalSteps: execution.totalSteps,
      completedSteps: execution.completedSteps,
      error: execution.error as WorkflowExecution['error'],
    };
  }

  /**
   * Create error result
   */
  private errorResult(
    executionId: string,
    message: string,
    completedSteps: number,
    totalSteps: number
  ): WorkflowEngineResult {
    return {
      success: false,
      executionId,
      status: 'failed',
      completedSteps,
      totalSteps,
      error: { message },
    };
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    return this.getExecution(executionId);
  }

  /**
   * List executions for a workflow
   */
  async listExecutions(workflowId: string, limit = 20): Promise<WorkflowExecution[]> {
    const executions = await db.query.agentWorkflowExecutions.findMany({
      where: and(
        eq(agentWorkflowExecutions.workflowId, workflowId),
        eq(agentWorkflowExecutions.workspaceId, this.workspaceId)
      ),
      orderBy: (table, { desc }) => [desc(table.startedAt)],
      limit,
    });

    return executions.map((e) => ({
      id: e.id,
      workspaceId: e.workspaceId,
      workflowId: e.workflowId,
      status: e.status as ExecutionStatus,
      currentStepId: e.currentStepId || undefined,
      currentStepIndex: e.currentStepIndex,
      stepResults: (e.stepResults || {}) as Record<string, StepResult>,
      context: (e.context || {}) as Record<string, unknown>,
      triggeredBy: e.triggeredBy || undefined,
      triggerType: e.triggerType || undefined,
      triggerData: e.triggerData as Record<string, unknown> | undefined,
      startedAt: e.startedAt,
      completedAt: e.completedAt || undefined,
      pausedAt: e.pausedAt || undefined,
      durationMs: e.durationMs || undefined,
      totalSteps: e.totalSteps,
      completedSteps: e.completedSteps,
      error: e.error as WorkflowExecution['error'],
    }));
  }
}

