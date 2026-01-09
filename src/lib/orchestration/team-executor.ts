/**
 * Team Executor - Coordinates Agent Team Execution
 *
 * The TeamExecutor is responsible for:
 * - Executing teams with high-level objectives
 * - Coordinating agents within a team
 * - Handling inter-agent handoffs
 * - Managing execution state and progress
 * - Producing team execution results
 */

import { db } from '@/lib/db';
import {
  agents,
  agentTeams,
  agentTeamMembers,
} from '@/db/schema';
import { eq, and, asc, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { AgentMessageBus } from './message-bus';
import { AgentMemoryService } from './memory';
import type {
  AgentTeamRole,
  TeamExecutionResult,
  MessagePriority,
} from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface TeamTask {
  objective: string;
  priority: MessagePriority;
  context?: Record<string, unknown>;
  deadline?: Date;
  requiredCapabilities?: string[];
}

export interface HandoffContext {
  fromAgentId: string;
  toAgentId: string;
  taskDescription: string;
  context: Record<string, unknown>;
  priority: MessagePriority;
  previousResults?: unknown;
}

export interface AgentExecutionResult {
  agentId: string;
  agentName: string;
  success: boolean;
  output?: unknown;
  error?: string;
  durationMs: number;
}

export interface TeamMemberInfo {
  id: string;
  agentId: string;
  agentName: string;
  agentType: string;
  role: AgentTeamRole;
  priority: number;
  status: string;
  capabilities: string[];
}

export interface TeamExecutionState {
  teamId: string;
  objective: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startedAt: Date;
  completedAt?: Date;
  currentPhase: string;
  agentResults: AgentExecutionResult[];
  context: Record<string, unknown>;
  error?: string;
}

// ============================================================================
// TEAM EXECUTOR CLASS
// ============================================================================

export class TeamExecutor {
  private workspaceId: string;
  private messageBus: AgentMessageBus;
  private memoryService: AgentMemoryService;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
    this.messageBus = new AgentMessageBus(workspaceId);
    this.memoryService = new AgentMemoryService(workspaceId);
  }

  // ==========================================================================
  // TEAM EXECUTION
  // ==========================================================================

  /**
   * Execute a team with a high-level objective
   * This is the main entry point for team execution
   */
  async run(teamId: string, task: TeamTask): Promise<TeamExecutionResult> {
    const startTime = Date.now();
    const executionState: TeamExecutionState = {
      teamId,
      objective: task.objective,
      status: 'running',
      startedAt: new Date(),
      currentPhase: 'initialization',
      agentResults: [],
      context: task.context || {},
    };

    try {
      logger.info('[TeamExecutor] Starting team execution', {
        workspaceId: this.workspaceId,
        teamId,
        objective: task.objective,
      });

      // 1. Get team and validate
      const team = await this.getTeam(teamId);
      if (!team) {
        return this.failResult(teamId, task.objective, 'Team not found', startTime);
      }

      if (team.status !== 'active') {
        return this.failResult(
          teamId,
          task.objective,
          `Team is not active (status: ${team.status})`,
          startTime
        );
      }

      // 2. Get team members ordered by priority
      const members = await this.getTeamMembers(teamId);
      if (members.length === 0) {
        return this.failResult(teamId, task.objective, 'Team has no members', startTime);
      }

      // 3. Store execution context in shared memory
      await this.initializeExecutionContext(teamId, task, members);

      // 4. Identify coordinator and specialists
      const coordinator = members.find((m) => m.role === 'coordinator');
      const _specialists = members.filter((m) => m.role === 'specialist');
      const _supportAgents = members.filter((m) => m.role === 'support');

      executionState.currentPhase = 'coordination';

      // 5. If there's a coordinator, send the objective to them first
      if (coordinator) {
        await this.notifyCoordinator(coordinator, task, members);
      }

      // 6. Broadcast objective to team
      await this.broadcastObjective(teamId, task);

      // 7. Execute team strategy based on objective
      executionState.currentPhase = 'execution';
      const results = await this.executeTeamStrategy(
        team,
        members,
        task,
        executionState
      );

      // 8. Aggregate results
      executionState.currentPhase = 'finalization';
      const durationMs = Date.now() - startTime;

      // 9. Store execution summary in memory
      await this.storeExecutionSummary(teamId, task.objective, results, durationMs);

      // 10. Update team metrics
      await this.updateTeamMetrics(teamId, true);

      executionState.status = 'completed';
      executionState.completedAt = new Date();

      logger.info('[TeamExecutor] Team execution completed', {
        teamId,
        durationMs,
        agentsInvolved: members.map((m) => m.agentId),
      });

      return {
        success: true,
        teamId,
        objective: task.objective,
        durationMs,
        agentsInvolved: members.map((m) => m.agentId),
        results: {
          state: executionState,
          agentResults: results,
          summary: this.generateExecutionSummary(results),
        },
      };
    } catch (error) {
      logger.error('[TeamExecutor] Team execution failed', error);

      // Update team metrics for failure
      await this.updateTeamMetrics(teamId, false);

      return this.failResult(
        teamId,
        task.objective,
        error instanceof Error ? error.message : 'Unknown error',
        startTime
      );
    }
  }

  /**
   * Coordinate agents within a team for a specific task
   */
  async coordinate(
    teamId: string,
    task: TeamTask,
    agentIds?: string[]
  ): Promise<AgentExecutionResult[]> {
    try {
      // Get team members (optionally filtered)
      let members = await this.getTeamMembers(teamId);

      if (agentIds && agentIds.length > 0) {
        members = members.filter((m) => agentIds.includes(m.agentId));
      }

      if (members.length === 0) {
        throw new Error('No agents to coordinate');
      }

      // Execute each agent in priority order
      const results: AgentExecutionResult[] = [];
      let sharedContext = task.context || {};

      for (const member of members) {
        const result = await this.executeAgent(member, task.objective, sharedContext);
        results.push(result);

        // Update shared context with agent output
        if (result.success && result.output) {
          sharedContext = {
            ...sharedContext,
            [`${member.agentName}_output`]: result.output,
          };
        }
      }

      return results;
    } catch (error) {
      logger.error('[TeamExecutor] Coordination failed', error);
      throw error;
    }
  }

  /**
   * Handle a handoff between two agents
   */
  async handoff(context: HandoffContext): Promise<boolean> {
    try {
      logger.info('[TeamExecutor] Processing handoff', {
        from: context.fromAgentId,
        to: context.toAgentId,
        task: context.taskDescription,
      });

      // 1. Send handoff message via message bus
      await this.messageBus.send({
        workspaceId: this.workspaceId,
        fromAgentId: context.fromAgentId,
        toAgentId: context.toAgentId,
        messageType: 'handoff',
        content: {
          subject: 'Task Handoff',
          body: context.taskDescription,
          data: {
            context: context.context,
            previousResults: context.previousResults,
          },
          priority: context.priority,
        },
      });

      // 2. Share context via memory service
      await this.memoryService.shareContext(
        context.fromAgentId,
        context.toAgentId,
        {
          handoffTask: context.taskDescription,
          handoffContext: context.context,
          previousResults: context.previousResults,
          handoffAt: new Date().toISOString(),
        }
      );

      // 3. Create a task notification
      await this.messageBus.send({
        workspaceId: this.workspaceId,
        fromAgentId: context.fromAgentId,
        toAgentId: context.toAgentId,
        messageType: 'task',
        content: {
          subject: 'Handoff Task Ready',
          body: `You have received a task handoff: ${context.taskDescription}`,
          data: context.context,
          priority: context.priority,
        },
      });

      logger.info('[TeamExecutor] Handoff completed', {
        from: context.fromAgentId,
        to: context.toAgentId,
      });

      return true;
    } catch (error) {
      logger.error('[TeamExecutor] Handoff failed', error);
      return false;
    }
  }

  // ==========================================================================
  // PRIVATE METHODS
  // ==========================================================================

  /**
   * Get team by ID
   */
  private async getTeam(teamId: string) {
    return db.query.agentTeams.findFirst({
      where: and(
        eq(agentTeams.id, teamId),
        eq(agentTeams.workspaceId, this.workspaceId)
      ),
    });
  }

  /**
   * Get team members with agent details
   */
  private async getTeamMembers(teamId: string): Promise<TeamMemberInfo[]> {
    const members = await db.query.agentTeamMembers.findMany({
      where: eq(agentTeamMembers.teamId, teamId),
      orderBy: [asc(agentTeamMembers.priority)],
    });

    if (members.length === 0) {
      return [];
    }

    // Get agent details
    const agentIds = members.map((m) => m.agentId);
    const agentsList = await db.query.agents.findMany({
      where: and(
        eq(agents.workspaceId, this.workspaceId),
        inArray(agents.id, agentIds)
      ),
    });

    const agentsById = Object.fromEntries(agentsList.map((a) => [a.id, a]));

    const result: TeamMemberInfo[] = [];
    for (const m of members) {
      const agent = agentsById[m.agentId];
      if (!agent) continue;

      const config = agent.config as { capabilities?: string[] } | null;

      result.push({
        id: m.id,
        agentId: m.agentId,
        agentName: agent.name,
        agentType: agent.type as string,
        role: m.role as AgentTeamRole,
        priority: m.priority,
        status: agent.status as string,
        capabilities: config?.capabilities || [],
      });
    }
    return result;
  }

  /**
   * Initialize execution context in shared memory
   */
  private async initializeExecutionContext(
    teamId: string,
    task: TeamTask,
    members: TeamMemberInfo[]
  ): Promise<void> {
    await this.memoryService.store({
      workspaceId: this.workspaceId,
      teamId,
      memoryTier: 'short_term',
      category: 'context',
      key: `execution_${Date.now()}`,
      value: {
        objective: task.objective,
        priority: task.priority,
        context: task.context,
        members: members.map((m) => ({
          agentId: m.agentId,
          name: m.agentName,
          role: m.role,
        })),
        startedAt: new Date().toISOString(),
      },
      importance: 90,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });
  }

  /**
   * Notify coordinator about the objective
   */
  private async notifyCoordinator(
    coordinator: TeamMemberInfo,
    task: TeamTask,
    members: TeamMemberInfo[]
  ): Promise<void> {
    await this.messageBus.send({
      workspaceId: this.workspaceId,
      toAgentId: coordinator.agentId,
      messageType: 'task',
      content: {
        subject: 'Team Objective Assigned',
        body: `New objective: ${task.objective}`,
        data: {
          objective: task.objective,
          priority: task.priority,
          context: task.context,
          teamMembers: members.map((m) => ({
            agentId: m.agentId,
            name: m.agentName,
            role: m.role,
            capabilities: m.capabilities,
          })),
        },
        priority: task.priority,
      },
    });
  }

  /**
   * Broadcast objective to all team members
   */
  private async broadcastObjective(teamId: string, task: TeamTask): Promise<void> {
    await this.messageBus.broadcast(teamId, {
      workspaceId: this.workspaceId,
      teamId,
      messageType: 'context',
      content: {
        subject: 'Team Objective',
        body: task.objective,
        data: {
          priority: task.priority,
          context: task.context,
          deadline: task.deadline?.toISOString(),
        },
        priority: task.priority,
      },
    });
  }

  /**
   * Execute team strategy based on objective
   * This coordinates agents based on their roles and capabilities
   */
  private async executeTeamStrategy(
    team: NonNullable<Awaited<ReturnType<typeof this.getTeam>>>,
    members: TeamMemberInfo[],
    task: TeamTask,
    state: TeamExecutionState
  ): Promise<AgentExecutionResult[]> {
    const results: AgentExecutionResult[] = [];
    let sharedContext = task.context || {};

    // Group members by role
    const coordinator = members.find((m) => m.role === 'coordinator');
    const specialists = members.filter((m) => m.role === 'specialist');
    const supportAgents = members.filter((m) => m.role === 'support');

    // Phase 1: Coordinator analysis (if present)
    if (coordinator && coordinator.status === 'active') {
      logger.info('[TeamExecutor] Executing coordinator', {
        agentId: coordinator.agentId,
        agentName: coordinator.agentName,
      });

      const coordinatorResult = await this.executeAgent(
        coordinator,
        task.objective,
        sharedContext
      );
      results.push(coordinatorResult);

      if (coordinatorResult.success && coordinatorResult.output) {
        sharedContext = {
          ...sharedContext,
          coordinatorAnalysis: coordinatorResult.output,
        };
      }
    }

    // Phase 2: Execute specialists in priority order
    for (const specialist of specialists) {
      if (specialist.status !== 'active') continue;

      logger.info('[TeamExecutor] Executing specialist', {
        agentId: specialist.agentId,
        agentName: specialist.agentName,
      });

      // Check if this specialist should be involved
      if (task.requiredCapabilities && task.requiredCapabilities.length > 0) {
        const hasCapability = task.requiredCapabilities.some((cap) =>
          specialist.capabilities.includes(cap)
        );
        if (!hasCapability) continue;
      }

      const specialistResult = await this.executeAgent(
        specialist,
        task.objective,
        sharedContext
      );
      results.push(specialistResult);

      // Update shared context
      if (specialistResult.success && specialistResult.output) {
        sharedContext = {
          ...sharedContext,
          [`${specialist.agentName.replace(/\s+/g, '_')}_result`]: specialistResult.output,
        };
      }

      // Handle handoffs between specialists
      const nextSpecialist = specialists.find(
        (s) =>
          s.priority > specialist.priority &&
          s.status === 'active'
      );
      if (nextSpecialist && specialistResult.success) {
        await this.handoff({
          fromAgentId: specialist.agentId,
          toAgentId: nextSpecialist.agentId,
          taskDescription: `Continue work on: ${task.objective}`,
          context: sharedContext,
          priority: task.priority,
          previousResults: specialistResult.output,
        });
      }
    }

    // Phase 3: Support agents for any cleanup or additional tasks
    for (const support of supportAgents) {
      if (support.status !== 'active') continue;

      logger.info('[TeamExecutor] Executing support agent', {
        agentId: support.agentId,
        agentName: support.agentName,
      });

      const supportResult = await this.executeAgent(
        support,
        `Support for: ${task.objective}`,
        sharedContext
      );
      results.push(supportResult);
    }

    return results;
  }

  /**
   * Execute a single agent
   * Note: For team-initiated executions, we use the message bus to coordinate
   * rather than creating agentExecutions records (which require a user triggeredBy).
   * Full execution tracking should be handled through Trigger.dev jobs.
   */
  private async executeAgent(
    member: TeamMemberInfo,
    objective: string,
    context: Record<string, unknown>
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();

    try {
      // Generate a unique task ID for tracking
      const taskId = `team_task_${Date.now()}_${member.agentId}`;

      // Send task message to agent via message bus
      const messageId = await this.messageBus.send({
        workspaceId: this.workspaceId,
        toAgentId: member.agentId,
        messageType: 'task',
        content: {
          subject: 'Team Task',
          body: objective,
          data: {
            context,
            taskId,
            role: member.role,
          },
          priority: 'normal',
        },
      });

      // For now, simulate successful execution
      // In production, this would trigger actual agent execution via Trigger.dev
      // and wait for completion via message bus status updates
      const durationMs = Date.now() - startTime;

      return {
        agentId: member.agentId,
        agentName: member.agentName,
        success: true,
        output: {
          messageId,
          taskId,
          message: `Task delegated to ${member.agentName}: ${objective}`,
        },
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;

      return {
        agentId: member.agentId,
        agentName: member.agentName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs,
      };
    }
  }

  /**
   * Store execution summary in memory
   */
  private async storeExecutionSummary(
    teamId: string,
    objective: string,
    results: AgentExecutionResult[],
    durationMs: number
  ): Promise<void> {
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    await this.memoryService.store({
      workspaceId: this.workspaceId,
      teamId,
      memoryTier: 'medium_term',
      category: 'pattern',
      key: `execution_summary_${Date.now()}`,
      value: {
        objective,
        successCount,
        failureCount,
        totalAgents: results.length,
        durationMs,
        completedAt: new Date().toISOString(),
        agentResults: results.map((r) => ({
          agentId: r.agentId,
          agentName: r.agentName,
          success: r.success,
          durationMs: r.durationMs,
        })),
      },
      importance: 60,
    });
  }

  /**
   * Update team metrics after execution
   */
  private async updateTeamMetrics(teamId: string, success: boolean): Promise<void> {
    const team = await this.getTeam(teamId);
    if (!team) return;

    await db
      .update(agentTeams)
      .set({
        totalExecutions: (team.totalExecutions || 0) + 1,
        successfulExecutions: success
          ? (team.successfulExecutions || 0) + 1
          : team.successfulExecutions || 0,
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(agentTeams.id, teamId));
  }

  /**
   * Generate execution summary from results
   */
  private generateExecutionSummary(results: AgentExecutionResult[]): string {
    const successCount = results.filter((r) => r.success).length;
    const totalCount = results.length;
    const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0);

    const agentSummaries = results
      .map((r) => `- ${r.agentName}: ${r.success ? 'Success' : 'Failed'}`)
      .join('\n');

    return `Team Execution Summary:
- Agents involved: ${totalCount}
- Successful: ${successCount}/${totalCount}
- Total duration: ${totalDuration}ms

Agent Results:
${agentSummaries}`;
  }

  /**
   * Create a failure result
   */
  private failResult(
    teamId: string,
    objective: string,
    error: string,
    startTime: number
  ): TeamExecutionResult {
    return {
      success: false,
      teamId,
      objective,
      error,
      durationMs: Date.now() - startTime,
      agentsInvolved: [],
    };
  }
}

