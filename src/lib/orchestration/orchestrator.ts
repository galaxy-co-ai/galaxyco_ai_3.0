/**
 * Agent Orchestrator - Central Coordination Service
 *
 * The orchestrator is responsible for:
 * - Routing tasks to appropriate agents based on type and availability
 * - Executing multi-agent workflows
 * - Handling agent-to-agent task delegation
 * - Coordinating team execution
 * - Selecting optimal agents for tasks
 */

import { db } from '@/lib/db';
import {
  agents,
  agentTeams,
  agentTeamMembers,
  agentWorkflows,
  agentWorkflowExecutions,
} from '@/db/schema';
import { eq, and, desc, asc, sql, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { AgentMessageBus } from './message-bus';
import { AgentMemoryService } from './memory';
import type {
  OrchestratorTask,
  TaskAssignment,
  DelegationResult,
  TeamExecutionResult,
  WorkflowResult,
  WorkflowExecution,
  ExecuteWorkflowInput,
  WorkflowStep,
  StepResult,
  ExecutionStatus,
} from './types';

// ============================================================================
// ORCHESTRATOR CLASS
// ============================================================================

export class AgentOrchestrator {
  private workspaceId: string;
  private messageBus: AgentMessageBus;
  private memoryService: AgentMemoryService;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
    this.messageBus = new AgentMessageBus(workspaceId);
    this.memoryService = new AgentMemoryService(workspaceId);
  }

  // ==========================================================================
  // TASK ROUTING
  // ==========================================================================

  /**
   * Route a task to the most appropriate agent based on type and availability
   */
  async routeTask(task: OrchestratorTask): Promise<TaskAssignment> {
    try {
      logger.info('[Orchestrator] Routing task', {
        workspaceId: this.workspaceId,
        taskType: task.taskType,
        priority: task.priority,
      });

      // If a specific agent is preferred, try to use them
      if (task.preferredAgentId) {
        const preferredAgent = await db.query.agents.findFirst({
          where: and(
            eq(agents.id, task.preferredAgentId),
            eq(agents.workspaceId, this.workspaceId),
            eq(agents.status, 'active')
          ),
        });

        if (preferredAgent) {
          return {
            agentId: preferredAgent.id,
            agentName: preferredAgent.name,
            confidence: 100,
            reason: 'Preferred agent specified and available',
          };
        }
      }

      // If a team is preferred, find the best agent in that team
      if (task.preferredTeamId) {
        const teamAssignment = await this.selectAgentFromTeam(
          task.preferredTeamId,
          task.taskType,
          task.requiredCapabilities
        );
        if (teamAssignment) {
          return teamAssignment;
        }
      }

      // Find the best agent across all teams
      const bestAgent = await this.selectAgent(task.taskType, task.requiredCapabilities);
      if (bestAgent) {
        return bestAgent;
      }

      // Fallback: return no assignment
      logger.warn('[Orchestrator] No suitable agent found for task', {
        workspaceId: this.workspaceId,
        taskType: task.taskType,
      });

      return {
        agentId: '',
        agentName: '',
        confidence: 0,
        reason: 'No suitable agent found for this task type',
      };
    } catch (error) {
      logger.error('[Orchestrator] Failed to route task', error);
      throw error;
    }
  }

  /**
   * Select the optimal agent for a task type
   */
  async selectAgent(
    taskType: string,
    requiredCapabilities?: string[],
    teamId?: string
  ): Promise<TaskAssignment | null> {
    try {
      // Get all active agents in workspace (optionally filtered by team)
      let candidateAgentIds: string[] = [];

      if (teamId) {
        const teamMembers = await db.query.agentTeamMembers.findMany({
          where: eq(agentTeamMembers.teamId, teamId),
        });
        candidateAgentIds = teamMembers.map((m) => m.agentId);
      }

      const conditions = [
        eq(agents.workspaceId, this.workspaceId),
        eq(agents.status, 'active'),
      ];

      if (candidateAgentIds.length > 0) {
        conditions.push(inArray(agents.id, candidateAgentIds));
      }

      const activeAgents = await db.query.agents.findMany({
        where: and(...conditions),
        orderBy: [desc(agents.executionCount)],
      });

      if (activeAgents.length === 0) {
        return null;
      }

      // Score agents based on type match, capabilities, and performance
      let bestAgent = activeAgents[0];
      let bestScore = 0;

      for (const agent of activeAgents) {
        let score = 50; // Base score

        // Check type match
        if (agent.type === taskType) {
          score += 30;
        }

        // Check capabilities match
        const config = agent.config as { capabilities?: string[]; tools?: string[] } | null;
        if (requiredCapabilities && config?.capabilities) {
          const matchCount = requiredCapabilities.filter((cap) =>
            config.capabilities?.includes(cap)
          ).length;
          score += (matchCount / requiredCapabilities.length) * 20;
        }

        // Check if agent has relevant tools
        if (config?.tools && config.tools.length > 0) {
          score += 10;
        }

        // Bonus for agents with recent successful executions
        if (agent.lastExecutedAt) {
          const hoursSinceExecution =
            (Date.now() - new Date(agent.lastExecutedAt).getTime()) / (1000 * 60 * 60);
          if (hoursSinceExecution < 24) {
            score += 10;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestAgent = agent;
        }
      }

      // Get team info if agent is in a team
      const teamMembership = await db.query.agentTeamMembers.findFirst({
        where: eq(agentTeamMembers.agentId, bestAgent.id),
      });

      let teamName: string | undefined;
      if (teamMembership) {
        const team = await db.query.agentTeams.findFirst({
          where: eq(agentTeams.id, teamMembership.teamId),
        });
        teamName = team?.name;
      }

      return {
        agentId: bestAgent.id,
        agentName: bestAgent.name,
        teamId: teamMembership?.teamId,
        teamName,
        confidence: Math.min(bestScore, 100),
        reason: `Selected based on type match and capabilities (score: ${bestScore})`,
      };
    } catch (error) {
      logger.error('[Orchestrator] Failed to select agent', error);
      return null;
    }
  }

  /**
   * Select the best agent from a specific team
   */
  private async selectAgentFromTeam(
    teamId: string,
    taskType: string,
    requiredCapabilities?: string[]
  ): Promise<TaskAssignment | null> {
    const assignment = await this.selectAgent(taskType, requiredCapabilities, teamId);
    if (assignment) {
      const team = await db.query.agentTeams.findFirst({
        where: eq(agentTeams.id, teamId),
      });
      assignment.teamId = teamId;
      assignment.teamName = team?.name;
    }
    return assignment;
  }

  // ==========================================================================
  // TASK DELEGATION
  // ==========================================================================

  /**
   * Delegate a task from one agent to another
   */
  async delegateTask(
    fromAgentId: string,
    toAgentId: string,
    taskDescription: string,
    taskData?: Record<string, unknown>
  ): Promise<DelegationResult> {
    try {
      logger.info('[Orchestrator] Delegating task', {
        fromAgentId,
        toAgentId,
        taskDescription,
      });

      // Send task message via message bus
      const messageId = await this.messageBus.send({
        workspaceId: this.workspaceId,
        fromAgentId,
        toAgentId,
        messageType: 'task',
        content: {
          subject: 'Delegated Task',
          body: taskDescription,
          data: taskData,
          priority: 'normal',
        },
      });

      // Store delegation in shared memory for context
      await this.memoryService.store({
        workspaceId: this.workspaceId,
        agentId: toAgentId,
        memoryTier: 'short_term',
        category: 'context',
        key: `delegated_task_${messageId}`,
        value: {
          fromAgentId,
          taskDescription,
          taskData,
          delegatedAt: new Date().toISOString(),
        },
        metadata: {
          source: 'delegation',
        },
        importance: 70,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      return {
        success: true,
        messageId,
        fromAgentId,
        toAgentId,
        taskId: messageId,
      };
    } catch (error) {
      logger.error('[Orchestrator] Failed to delegate task', error);
      return {
        success: false,
        fromAgentId,
        toAgentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // ==========================================================================
  // TEAM EXECUTION
  // ==========================================================================

  /**
   * Run a team with a high-level objective
   */
  async runTeam(teamId: string, objective: string): Promise<TeamExecutionResult> {
    const startTime = Date.now();

    try {
      logger.info('[Orchestrator] Running team', { teamId, objective });

      // Get team and its members
      const team = await db.query.agentTeams.findFirst({
        where: and(
          eq(agentTeams.id, teamId),
          eq(agentTeams.workspaceId, this.workspaceId)
        ),
      });

      if (!team) {
        return {
          success: false,
          teamId,
          objective,
          error: 'Team not found',
          agentsInvolved: [],
        };
      }

      if (team.status !== 'active') {
        return {
          success: false,
          teamId,
          objective,
          error: `Team is not active (status: ${team.status})`,
          agentsInvolved: [],
        };
      }

      // Get team members ordered by priority
      const members = await db.query.agentTeamMembers.findMany({
        where: eq(agentTeamMembers.teamId, teamId),
        orderBy: [asc(agentTeamMembers.priority)],
      });

      if (members.length === 0) {
        return {
          success: false,
          teamId,
          objective,
          error: 'Team has no members',
          agentsInvolved: [],
        };
      }

      // Store objective in team's shared memory
      await this.memoryService.store({
        workspaceId: this.workspaceId,
        teamId,
        memoryTier: 'short_term',
        category: 'context',
        key: `objective_${Date.now()}`,
        value: {
          objective,
          startedAt: new Date().toISOString(),
        },
        importance: 90,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      // Broadcast objective to team
      await this.messageBus.broadcast(teamId, {
        workspaceId: this.workspaceId,
        teamId,
        messageType: 'task',
        content: {
          subject: 'Team Objective',
          body: objective,
          priority: 'high',
        },
      });

      // Update team metrics
      await db
        .update(agentTeams)
        .set({
          totalExecutions: sql`${agentTeams.totalExecutions} + 1`,
          lastActiveAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(agentTeams.id, teamId));

      const durationMs = Date.now() - startTime;

      return {
        success: true,
        teamId,
        objective,
        durationMs,
        agentsInvolved: members.map((m) => m.agentId),
        results: {
          membersNotified: members.length,
          startedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('[Orchestrator] Failed to run team', error);
      return {
        success: false,
        teamId,
        objective,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
        agentsInvolved: [],
      };
    }
  }

  // ==========================================================================
  // WORKFLOW EXECUTION
  // ==========================================================================

  /**
   * Execute a multi-agent workflow
   */
  async executeWorkflow(input: ExecuteWorkflowInput): Promise<WorkflowResult> {
    const startTime = Date.now();

    try {
      logger.info('[Orchestrator] Executing workflow', {
        workflowId: input.workflowId,
        triggeredBy: input.triggeredBy,
      });

      // Get workflow
      const workflow = await db.query.agentWorkflows.findFirst({
        where: and(
          eq(agentWorkflows.id, input.workflowId),
          eq(agentWorkflows.workspaceId, this.workspaceId)
        ),
      });

      if (!workflow) {
        return {
          success: false,
          workflowId: input.workflowId,
          executionId: '',
          status: 'failed',
          error: { message: 'Workflow not found' },
          stepsCompleted: 0,
          totalSteps: 0,
        };
      }

      if (workflow.status !== 'active') {
        return {
          success: false,
          workflowId: input.workflowId,
          executionId: '',
          status: 'failed',
          error: { message: `Workflow is not active (status: ${workflow.status})` },
          stepsCompleted: 0,
          totalSteps: workflow.steps?.length || 0,
        };
      }

      const steps = workflow.steps as WorkflowStep[];

      // Create execution record
      const [execution] = await db
        .insert(agentWorkflowExecutions)
        .values({
          workspaceId: this.workspaceId,
          workflowId: input.workflowId,
          status: 'running',
          currentStepIndex: 0,
          context: input.initialContext || {},
          triggeredBy: input.triggeredBy,
          triggerType: input.triggerType || 'manual',
          triggerData: input.triggerData,
          totalSteps: steps.length,
          completedSteps: 0,
        })
        .returning();

      // Execute workflow (for now, just mark it as started - actual execution happens via Trigger.dev)
      // This is the synchronous part; async execution will be handled by background jobs

      // Update workflow metrics
      await db
        .update(agentWorkflows)
        .set({
          totalExecutions: sql`${agentWorkflows.totalExecutions} + 1`,
          lastExecutedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(agentWorkflows.id, input.workflowId));

      return {
        success: true,
        workflowId: input.workflowId,
        executionId: execution.id,
        status: 'running',
        durationMs: Date.now() - startTime,
        stepsCompleted: 0,
        totalSteps: steps.length,
      };
    } catch (error) {
      logger.error('[Orchestrator] Failed to execute workflow', error);
      return {
        success: false,
        workflowId: input.workflowId,
        executionId: '',
        status: 'failed',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        durationMs: Date.now() - startTime,
        stepsCompleted: 0,
        totalSteps: 0,
      };
    }
  }

  /**
   * Resume a paused workflow execution
   */
  async resumeWorkflow(executionId: string): Promise<WorkflowResult> {
    try {
      const execution = await db.query.agentWorkflowExecutions.findFirst({
        where: and(
          eq(agentWorkflowExecutions.id, executionId),
          eq(agentWorkflowExecutions.workspaceId, this.workspaceId)
        ),
      });

      if (!execution) {
        return {
          success: false,
          workflowId: '',
          executionId,
          status: 'failed',
          error: { message: 'Execution not found' },
          stepsCompleted: 0,
          totalSteps: 0,
        };
      }

      if (execution.status !== 'paused') {
        return {
          success: false,
          workflowId: execution.workflowId,
          executionId,
          status: execution.status as ExecutionStatus,
          error: { message: `Cannot resume execution with status: ${execution.status}` },
          stepsCompleted: execution.completedSteps,
          totalSteps: execution.totalSteps,
        };
      }

      // Update status to running
      await db
        .update(agentWorkflowExecutions)
        .set({
          status: 'running',
          pausedAt: null,
        })
        .where(eq(agentWorkflowExecutions.id, executionId));

      return {
        success: true,
        workflowId: execution.workflowId,
        executionId,
        status: 'running',
        stepsCompleted: execution.completedSteps,
        totalSteps: execution.totalSteps,
      };
    } catch (error) {
      logger.error('[Orchestrator] Failed to resume workflow', error);
      return {
        success: false,
        workflowId: '',
        executionId,
        status: 'failed',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        stepsCompleted: 0,
        totalSteps: 0,
      };
    }
  }

  /**
   * Pause a running workflow execution
   */
  async pauseWorkflow(executionId: string): Promise<WorkflowResult> {
    try {
      const execution = await db.query.agentWorkflowExecutions.findFirst({
        where: and(
          eq(agentWorkflowExecutions.id, executionId),
          eq(agentWorkflowExecutions.workspaceId, this.workspaceId)
        ),
      });

      if (!execution) {
        return {
          success: false,
          workflowId: '',
          executionId,
          status: 'failed',
          error: { message: 'Execution not found' },
          stepsCompleted: 0,
          totalSteps: 0,
        };
      }

      if (execution.status !== 'running') {
        return {
          success: false,
          workflowId: execution.workflowId,
          executionId,
          status: execution.status as ExecutionStatus,
          error: { message: `Cannot pause execution with status: ${execution.status}` },
          stepsCompleted: execution.completedSteps,
          totalSteps: execution.totalSteps,
        };
      }

      // Update status to paused
      await db
        .update(agentWorkflowExecutions)
        .set({
          status: 'paused',
          pausedAt: new Date(),
        })
        .where(eq(agentWorkflowExecutions.id, executionId));

      return {
        success: true,
        workflowId: execution.workflowId,
        executionId,
        status: 'paused',
        stepsCompleted: execution.completedSteps,
        totalSteps: execution.totalSteps,
      };
    } catch (error) {
      logger.error('[Orchestrator] Failed to pause workflow', error);
      return {
        success: false,
        workflowId: '',
        executionId,
        status: 'failed',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        stepsCompleted: 0,
        totalSteps: 0,
      };
    }
  }

  /**
   * Get workflow execution status
   */
  async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    try {
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
    } catch (error) {
      logger.error('[Orchestrator] Failed to get execution status', error);
      return null;
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Get the message bus instance
   */
  getMessageBus(): AgentMessageBus {
    return this.messageBus;
  }

  /**
   * Get the memory service instance
   */
  getMemoryService(): AgentMemoryService {
    return this.memoryService;
  }
}

