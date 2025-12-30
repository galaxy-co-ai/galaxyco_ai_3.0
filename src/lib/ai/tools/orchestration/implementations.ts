/**
 * Orchestration Tool Implementations
 */
import type { ToolImplementations, ToolResult } from '../types';
import { db } from '@/lib/db';
import { agents, agentTeams, agentTeamMembers, agentWorkflows, agentWorkflowExecutions, agentMessages } from '@/db/schema';
import { eq, and, desc, like, gte, inArray, asc } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export const orchestrationToolImplementations: ToolImplementations = {
  // Team Management: Create Agent Team
  async create_agent_team(args, context): Promise<ToolResult> {
    try {
      const { AgentOrchestrator } = await import('@/lib/orchestration');
      const { getTeamTemplate } = await import('@/lib/orchestration/team-templates');

      const name = args.name as string;
      const departmentArg = args.department as string;
      const description = args.description as string | undefined;
      const templateId = args.templateId as string | undefined;
      const autonomyLevel = (args.autonomyLevel as string) || 'supervised';
      const memberAgentIds = args.memberAgentIds as string[] | undefined;

      if (!name || !departmentArg) {
        return {
          success: false,
          message: 'Please provide both a team name and department.',
          error: 'Missing required fields',
        };
      }

      // Validate and cast department to proper enum type
      const validDepartments = ['sales', 'marketing', 'support', 'operations', 'finance', 'product', 'general'] as const;
      type DepartmentType = typeof validDepartments[number];

      if (!validDepartments.includes(departmentArg as DepartmentType)) {
        return {
          success: false,
          message: `Invalid department "${departmentArg}". Valid options: ${validDepartments.join(', ')}`,
          error: 'Invalid department',
        };
      }
      const department = departmentArg as DepartmentType;

      // Validate autonomy level
      const validAutonomyLevels = ['supervised', 'semi_autonomous', 'autonomous'] as const;
      type AutonomyLevelType = typeof validAutonomyLevels[number];
      const validatedAutonomyLevel: AutonomyLevelType = validAutonomyLevels.includes(autonomyLevel as AutonomyLevelType)
        ? (autonomyLevel as AutonomyLevelType)
        : 'supervised';

      // Define config with proper type matching schema
      type TeamConfigType = {
        autonomyLevel: AutonomyLevelType;
        approvalRequired: string[];
        maxConcurrentTasks: number;
        workingHours?: { start: string; end: string; timezone: string };
        escalationRules?: Array<{ condition: string; action: 'notify' | 'escalate' | 'pause'; target?: string }>;
        capabilities?: string[];
      };

      let teamConfig: TeamConfigType = {
        autonomyLevel: validatedAutonomyLevel,
        approvalRequired: [],
        maxConcurrentTasks: 5,
      };

      let templateInfo: string | null = null;
      if (templateId) {
        const template = getTeamTemplate(templateId);
        if (template && template.config) {
          // Merge template config with proper typing
          teamConfig = {
            ...teamConfig,
            autonomyLevel: (template.config.autonomyLevel as AutonomyLevelType) || teamConfig.autonomyLevel,
            approvalRequired: template.config.approvalRequired || teamConfig.approvalRequired,
            maxConcurrentTasks: template.config.maxConcurrentTasks || teamConfig.maxConcurrentTasks,
            capabilities: template.config.capabilities,
          };
          templateInfo = `Using the ${template.name} template with ${template.agents.length} recommended agent roles.`;
        }
      }

      // Create the team
      const [team] = await db
        .insert(agentTeams)
        .values({
          workspaceId: context.workspaceId,
          name,
          department,
          description: description || `${name} for the ${department} department`,
          config: teamConfig,
          createdBy: context.userId,
        })
        .returning();

      // Add member agents if provided
      let addedMembers = 0;
      if (memberAgentIds && memberAgentIds.length > 0) {
        for (let i = 0; i < memberAgentIds.length; i++) {
          const agentId = memberAgentIds[i];
          // Verify agent exists and belongs to workspace
          const agent = await db.query.agents.findFirst({
            where: and(
              eq(agents.id, agentId),
              eq(agents.workspaceId, context.workspaceId)
            ),
          });

          if (agent) {
            await db.insert(agentTeamMembers).values({
              teamId: team.id,
              agentId,
              role: i === 0 ? 'coordinator' : 'specialist',
              priority: i,
            });
            addedMembers++;
          }
        }
      }

      logger.info('[Neptune] Created agent team', {
        teamId: team.id,
        name,
        department,
        memberCount: addedMembers,
      });

      let message = `Created "${name}" team for the ${department} department.`;
      if (templateInfo) {
        message += ` ${templateInfo}`;
      }
      if (addedMembers > 0) {
        message += ` Added ${addedMembers} agent(s) to the team.`;
      } else {
        message += ` The team is ready - add agents to get started.`;
      }

      return {
        success: true,
        message,
        data: {
          teamId: team.id,
          name: team.name,
          department: team.department,
          memberCount: addedMembers,
          autonomyLevel,
        },
      };
    } catch (error) {
      logger.error('AI create_agent_team failed', error);
      return {
        success: false,
        message: 'Failed to create team. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Team Management: List Agent Teams
  async list_agent_teams(args, context): Promise<ToolResult> {
    try {
      const department = args.department as string | undefined;
      const status = args.status as string | undefined;
      const limit = Math.min((args.limit as number) || 20, 50);

      // Build conditions
      const conditions = [eq(agentTeams.workspaceId, context.workspaceId)];
      if (department) {
        conditions.push(eq(agentTeams.department, department as typeof agentTeams.department.enumValues[number]));
      }
      if (status) {
        conditions.push(eq(agentTeams.status, status));
      }

      // Fetch teams
      const teams = await db.query.agentTeams.findMany({
        where: and(...conditions),
        orderBy: [desc(agentTeams.createdAt)],
        limit,
      });

      if (teams.length === 0) {
        const filterMsg = department ? ` in the ${department} department` : '';
        return {
          success: true,
          message: `You don't have any agent teams${filterMsg} yet. Would you like me to help you create one?`,
          data: { teams: [], total: 0 },
        };
      }

      // Get member counts
      const teamsWithDetails = await Promise.all(
        teams.map(async (team) => {
          const members = await db.query.agentTeamMembers.findMany({
            where: eq(agentTeamMembers.teamId, team.id),
          });
          return {
            id: team.id,
            name: team.name,
            department: team.department,
            status: team.status,
            memberCount: members.length,
            totalExecutions: team.totalExecutions,
            lastActiveAt: team.lastActiveAt,
          };
        })
      );

      const teamList = teamsWithDetails
        .map((t) => `* **${t.name}** (${t.department}) - ${t.memberCount} agents, ${t.totalExecutions} runs`)
        .join('\n');

      return {
        success: true,
        message: `Found ${teams.length} team(s):\n${teamList}`,
        data: { teams: teamsWithDetails, total: teams.length },
      };
    } catch (error) {
      logger.error('AI list_agent_teams failed', error);
      return {
        success: false,
        message: 'Failed to list teams. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Team Management: Run Agent Team
  async run_agent_team(args, context): Promise<ToolResult> {
    try {
      const { AgentOrchestrator } = await import('@/lib/orchestration');

      const teamId = args.teamId as string | undefined;
      const teamName = args.teamName as string | undefined;
      const objective = args.objective as string;
      const priority = (args.priority as string) || 'normal';

      if (!objective) {
        return {
          success: false,
          message: 'Please provide an objective for the team to work on.',
          error: 'Missing objective',
        };
      }

      // Find team by ID or name
      let team;
      if (teamId) {
        team = await db.query.agentTeams.findFirst({
          where: and(
            eq(agentTeams.id, teamId),
            eq(agentTeams.workspaceId, context.workspaceId)
          ),
        });
      } else if (teamName) {
        team = await db.query.agentTeams.findFirst({
          where: and(
            eq(agentTeams.workspaceId, context.workspaceId),
            like(agentTeams.name, `%${teamName}%`)
          ),
        });
      } else {
        return {
          success: false,
          message: 'Please specify which team to run by providing a team name or ID.',
          error: 'No team specified',
        };
      }

      if (!team) {
        return {
          success: false,
          message: `Couldn't find a team matching "${teamName || teamId}". Use list_agent_teams to see available teams.`,
          error: 'Team not found',
        };
      }

      // Run the team
      const orchestrator = new AgentOrchestrator(context.workspaceId);
      const result = await orchestrator.runTeam(team.id, objective);

      if (!result.success) {
        return {
          success: false,
          message: `Failed to run ${team.name}: ${result.error}`,
          error: result.error,
        };
      }

      logger.info('[Neptune] Team execution started', {
        teamId: team.id,
        objective,
        agentsInvolved: result.agentsInvolved.length,
      });

      return {
        success: true,
        message: `Started ${team.name} with objective: "${objective}". ${result.agentsInvolved.length} agent(s) are now working on this.`,
        data: {
          teamId: team.id,
          teamName: team.name,
          objective,
          agentsInvolved: result.agentsInvolved.length,
          durationMs: result.durationMs,
        },
      };
    } catch (error) {
      logger.error('AI run_agent_team failed', error);
      return {
        success: false,
        message: 'Failed to run team. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Team Management: Get Team Status
  async get_team_status(args, context): Promise<ToolResult> {
    try {
      const teamId = args.teamId as string | undefined;
      const teamName = args.teamName as string | undefined;
      const includeMembers = args.includeMembers !== false;
      const includeRecentActivity = args.includeRecentActivity !== false;

      // Find team
      let team;
      if (teamId) {
        team = await db.query.agentTeams.findFirst({
          where: and(
            eq(agentTeams.id, teamId),
            eq(agentTeams.workspaceId, context.workspaceId)
          ),
        });
      } else if (teamName) {
        team = await db.query.agentTeams.findFirst({
          where: and(
            eq(agentTeams.workspaceId, context.workspaceId),
            like(agentTeams.name, `%${teamName}%`)
          ),
        });
      } else {
        return {
          success: false,
          message: 'Please specify which team by providing a team name or ID.',
          error: 'No team specified',
        };
      }

      if (!team) {
        return {
          success: false,
          message: `Couldn't find a team matching "${teamName || teamId}".`,
          error: 'Team not found',
        };
      }

      // Get team members
      let memberDetails: { name: string; role: string; type: string }[] = [];
      if (includeMembers) {
        const members = await db.query.agentTeamMembers.findMany({
          where: eq(agentTeamMembers.teamId, team.id),
          orderBy: [asc(agentTeamMembers.priority)],
        });

        if (members.length > 0) {
          const agentIds = members.map((m) => m.agentId);
          const agentsList = await db.query.agents.findMany({
            where: inArray(agents.id, agentIds),
          });
          const agentsById = Object.fromEntries(agentsList.map((a) => [a.id, a]));

          memberDetails = members.map((m) => {
            const agent = agentsById[m.agentId];
            return {
              name: agent?.name || 'Unknown',
              role: m.role,
              type: agent?.type || 'unknown',
            };
          });
        }
      }

      // Get recent activity
      let recentActivity: { type: string; count: number }[] = [];
      if (includeRecentActivity) {
        const recentMessages = await db.query.agentMessages.findMany({
          where: and(
            eq(agentMessages.teamId, team.id),
            gte(agentMessages.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
          ),
          limit: 10,
        });
        recentActivity = [{ type: 'messages_24h', count: recentMessages.length }];
      }

      const config = team.config as { autonomyLevel?: string } | null;
      const successRate = team.totalExecutions > 0
        ? Math.round((team.successfulExecutions / team.totalExecutions) * 100)
        : 0;

      let message = `**${team.name}** (${team.department})\n`;
      message += `Status: ${team.status} | Autonomy: ${config?.autonomyLevel || 'supervised'}\n`;
      message += `Executions: ${team.totalExecutions} (${successRate}% success rate)\n`;

      if (memberDetails.length > 0) {
        message += `\nTeam Members (${memberDetails.length}):\n`;
        message += memberDetails.map((m) => `* ${m.name} (${m.role})`).join('\n');
      }

      if (team.lastActiveAt) {
        message += `\n\nLast active: ${new Date(team.lastActiveAt).toLocaleString()}`;
      }

      return {
        success: true,
        message,
        data: {
          teamId: team.id,
          name: team.name,
          department: team.department,
          status: team.status,
          autonomyLevel: config?.autonomyLevel || 'supervised',
          totalExecutions: team.totalExecutions,
          successfulExecutions: team.successfulExecutions,
          successRate,
          members: memberDetails,
          lastActiveAt: team.lastActiveAt,
        },
      };
    } catch (error) {
      logger.error('AI get_team_status failed', error);
      return {
        success: false,
        message: 'Failed to get team status. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Workflow Management: Create Workflow
  async create_workflow(args, context): Promise<ToolResult> {
    try {
      const { leadToCustomerPipeline, contentCampaignWorkflow, supportTicketResolution } = await import('@/lib/orchestration/workflow-templates');

      const name = args.name as string;
      const description = args.description as string | undefined;
      const teamId = args.teamId as string | undefined;
      const triggerTypeArg = (args.triggerType as string) || 'manual';
      const templateType = args.templateType as string | undefined;
      const steps = args.steps as Array<{ name: string; agentId: string; action: string; inputs: Record<string, unknown> }> | undefined;

      if (!name) {
        return {
          success: false,
          message: 'Please provide a name for the workflow.',
          error: 'Missing workflow name',
        };
      }

      // Validate and type triggerType
      const validTriggerTypes = ['manual', 'event', 'schedule', 'agent_request'] as const;
      type TriggerType = typeof validTriggerTypes[number];
      const triggerType: TriggerType = validTriggerTypes.includes(triggerTypeArg as TriggerType)
        ? (triggerTypeArg as TriggerType)
        : 'manual';

      // Define proper step type matching schema
      type WorkflowStepType = {
        id: string;
        name: string;
        agentId: string;
        action: string;
        inputs: Record<string, unknown>;
        conditions?: Array<{ field: string; operator: string; value: unknown }>;
        onSuccess?: string;
        onFailure?: string;
        timeout?: number;
        retryConfig?: { maxAttempts: number; backoffMs: number };
      };

      // Get template if specified
      let workflowSteps: WorkflowStepType[] = [];
      let templateInfo: string | null = null;

      if (templateType) {
        const templates: Record<string, typeof leadToCustomerPipeline> = {
          lead_to_customer: leadToCustomerPipeline,
          content_campaign: contentCampaignWorkflow,
          support_ticket: supportTicketResolution,
        };
        const template = templates[templateType];
        if (template) {
          workflowSteps = template.steps.map((step, i): WorkflowStepType => {
            return {
              id: `step_${i + 1}`,
              name: step.name,
              agentId: '', // Will need to be mapped to actual agents
              action: step.action,
              inputs: step.inputs || {},
              conditions: step.conditions,
              onSuccess: step.onSuccess,
              onFailure: step.onFailure,
              timeout: step.timeout,
              retryConfig: step.retryConfig,
            };
          });
          templateInfo = `Using the "${template.name}" template with ${template.steps.length} steps.`;
        }
      } else if (steps && steps.length > 0) {
        workflowSteps = steps.map((step, i): WorkflowStepType => {
          return {
            id: `step_${i + 1}`,
            name: step.name,
            agentId: step.agentId || '',
            action: step.action,
            inputs: step.inputs || {},
          };
        });
      }

      // Define trigger config type
      type TriggerConfigType = {
        eventType?: string;
        cron?: string;
        webhookSecret?: string;
        conditions?: Array<{ field: string; operator: string; value: unknown }>;
      };
      const triggerConfig: TriggerConfigType = {};

      // Create the workflow
      const [workflow] = await db
        .insert(agentWorkflows)
        .values({
          workspaceId: context.workspaceId,
          teamId,
          name,
          description: description || `Workflow: ${name}`,
          triggerType,
          triggerConfig,
          steps: workflowSteps,
          createdBy: context.userId,
        })
        .returning();

      logger.info('[Neptune] Created workflow', {
        workflowId: workflow.id,
        name,
        stepCount: workflowSteps.length,
      });

      let message = `Created workflow "${name}" with ${workflowSteps.length} step(s).`;
      if (templateInfo) {
        message += ` ${templateInfo}`;
      }
      message += ` You can execute it when ready.`;

      return {
        success: true,
        message,
        data: {
          workflowId: workflow.id,
          name: workflow.name,
          triggerType: workflow.triggerType,
          stepCount: workflowSteps.length,
        },
      };
    } catch (error) {
      logger.error('AI create_workflow failed', error);
      return {
        success: false,
        message: 'Failed to create workflow. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Workflow Management: Execute Workflow
  async execute_workflow(args, context): Promise<ToolResult> {
    try {
      const { WorkflowEngine } = await import('@/lib/orchestration/workflow-engine');

      const workflowId = args.workflowId as string | undefined;
      const workflowName = args.workflowName as string | undefined;
      const initialContext = args.context as Record<string, unknown> | undefined;

      // Find workflow
      let workflow;
      if (workflowId) {
        workflow = await db.query.agentWorkflows.findFirst({
          where: and(
            eq(agentWorkflows.id, workflowId),
            eq(agentWorkflows.workspaceId, context.workspaceId)
          ),
        });
      } else if (workflowName) {
        workflow = await db.query.agentWorkflows.findFirst({
          where: and(
            eq(agentWorkflows.workspaceId, context.workspaceId),
            like(agentWorkflows.name, `%${workflowName}%`)
          ),
        });
      } else {
        return {
          success: false,
          message: 'Please specify which workflow to execute by providing a name or ID.',
          error: 'No workflow specified',
        };
      }

      if (!workflow) {
        return {
          success: false,
          message: `Couldn't find a workflow matching "${workflowName || workflowId}".`,
          error: 'Workflow not found',
        };
      }

      // Execute the workflow
      const engine = new WorkflowEngine(context.workspaceId);
      const result = await engine.execute({
        workflowId: workflow.id,
        workspaceId: context.workspaceId,
        trigger: {
          type: 'manual',
          triggeredBy: context.userId,
        },
        initialContext,
      });

      if (!result.success) {
        return {
          success: false,
          message: `Failed to execute "${workflow.name}": ${result.error?.message}`,
          error: result.error?.message,
        };
      }

      logger.info('[Neptune] Workflow execution started', {
        workflowId: workflow.id,
        executionId: result.executionId,
      });

      return {
        success: true,
        message: `Started workflow "${workflow.name}". Execution ID: ${result.executionId}. Currently on step 1 of ${result.totalSteps}.`,
        data: {
          workflowId: workflow.id,
          workflowName: workflow.name,
          executionId: result.executionId,
          status: result.status,
          currentStepId: result.currentStepId,
          completedSteps: result.completedSteps,
          totalSteps: result.totalSteps,
        },
      };
    } catch (error) {
      logger.error('AI execute_workflow failed', error);
      return {
        success: false,
        message: 'Failed to execute workflow. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Workflow Management: Get Workflow Status
  async get_workflow_status(args, context): Promise<ToolResult> {
    try {
      const { WorkflowEngine } = await import('@/lib/orchestration/workflow-engine');

      const workflowId = args.workflowId as string | undefined;
      const workflowName = args.workflowName as string | undefined;
      const executionId = args.executionId as string | undefined;
      const includeExecutions = args.includeExecutions !== false;

      // If executionId provided, get execution status directly
      if (executionId) {
        const engine = new WorkflowEngine(context.workspaceId);
        const execution = await engine.getExecutionStatus(executionId);

        if (!execution) {
          return {
            success: false,
            message: `Couldn't find execution with ID "${executionId}".`,
            error: 'Execution not found',
          };
        }

        const workflow = await db.query.agentWorkflows.findFirst({
          where: eq(agentWorkflows.id, execution.workflowId),
        });

        let message = `**Workflow Execution Status**\n`;
        message += `Workflow: ${workflow?.name || 'Unknown'}\n`;
        message += `Status: ${execution.status}\n`;
        message += `Progress: ${execution.completedSteps}/${execution.totalSteps} steps completed\n`;
        if (execution.error) {
          message += `\nError: ${execution.error.message}`;
        }

        return {
          success: true,
          message,
          data: {
            executionId: execution.id,
            workflowId: execution.workflowId,
            workflowName: workflow?.name,
            status: execution.status,
            completedSteps: execution.completedSteps,
            totalSteps: execution.totalSteps,
            startedAt: execution.startedAt,
            completedAt: execution.completedAt,
            error: execution.error,
          },
        };
      }

      // Find workflow by ID or name
      let workflow;
      if (workflowId) {
        workflow = await db.query.agentWorkflows.findFirst({
          where: and(
            eq(agentWorkflows.id, workflowId),
            eq(agentWorkflows.workspaceId, context.workspaceId)
          ),
        });
      } else if (workflowName) {
        workflow = await db.query.agentWorkflows.findFirst({
          where: and(
            eq(agentWorkflows.workspaceId, context.workspaceId),
            like(agentWorkflows.name, `%${workflowName}%`)
          ),
        });
      } else {
        return {
          success: false,
          message: 'Please specify a workflow name, ID, or execution ID.',
          error: 'No workflow specified',
        };
      }

      if (!workflow) {
        return {
          success: false,
          message: `Couldn't find a workflow matching "${workflowName || workflowId}".`,
          error: 'Workflow not found',
        };
      }

      // Get recent executions
      let executions: { id: string; status: string; startedAt: Date; completedSteps: number; totalSteps: number }[] = [];
      if (includeExecutions) {
        const recentExecutions = await db.query.agentWorkflowExecutions.findMany({
          where: eq(agentWorkflowExecutions.workflowId, workflow.id),
          orderBy: [desc(agentWorkflowExecutions.startedAt)],
          limit: 5,
        });
        executions = recentExecutions.map((e) => ({
          id: e.id,
          status: e.status,
          startedAt: e.startedAt,
          completedSteps: e.completedSteps,
          totalSteps: e.totalSteps,
        }));
      }

      const steps = workflow.steps as { id: string; name: string }[];
      const successRate = workflow.totalExecutions > 0
        ? Math.round((workflow.successfulExecutions / workflow.totalExecutions) * 100)
        : 0;

      let message = `**${workflow.name}**\n`;
      message += `Status: ${workflow.status} | Trigger: ${workflow.triggerType}\n`;
      message += `Steps: ${steps.length} | Executions: ${workflow.totalExecutions} (${successRate}% success)\n`;

      if (executions.length > 0) {
        message += `\nRecent Executions:\n`;
        message += executions.map((e) => `* ${e.status} - ${e.completedSteps}/${e.totalSteps} steps (${new Date(e.startedAt).toLocaleString()})`).join('\n');
      }

      return {
        success: true,
        message,
        data: {
          workflowId: workflow.id,
          name: workflow.name,
          status: workflow.status,
          triggerType: workflow.triggerType,
          stepCount: steps.length,
          totalExecutions: workflow.totalExecutions,
          successfulExecutions: workflow.successfulExecutions,
          successRate,
          recentExecutions: executions,
        },
      };
    } catch (error) {
      logger.error('AI get_workflow_status failed', error);
      return {
        success: false,
        message: 'Failed to get workflow status. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Orchestration: Delegate to Agent
  async delegate_to_agent(args, context): Promise<ToolResult> {
    try {
      const { AgentOrchestrator } = await import('@/lib/orchestration');

      const agentId = args.agentId as string | undefined;
      const agentName = args.agentName as string | undefined;
      const taskDescription = args.taskDescription as string;
      const priority = (args.priority as string) || 'normal';
      const taskContext = args.context as Record<string, unknown> | undefined;

      if (!taskDescription) {
        return {
          success: false,
          message: 'Please provide a task description.',
          error: 'Missing task description',
        };
      }

      // Find agent
      let agent;
      if (agentId) {
        agent = await db.query.agents.findFirst({
          where: and(
            eq(agents.id, agentId),
            eq(agents.workspaceId, context.workspaceId)
          ),
        });
      } else if (agentName) {
        agent = await db.query.agents.findFirst({
          where: and(
            eq(agents.workspaceId, context.workspaceId),
            like(agents.name, `%${agentName}%`)
          ),
        });
      } else {
        // Auto-select best agent for the task
        const orchestrator = new AgentOrchestrator(context.workspaceId);
        const assignment = await orchestrator.routeTask({
          workspaceId: context.workspaceId,
          taskType: 'general',
          description: taskDescription,
          priority: priority as 'low' | 'normal' | 'high' | 'urgent',
        });

        if (assignment.agentId) {
          agent = await db.query.agents.findFirst({
            where: eq(agents.id, assignment.agentId),
          });
        }
      }

      if (!agent) {
        return {
          success: false,
          message: `Couldn't find a suitable agent. Please create an agent first or specify an existing one.`,
          error: 'Agent not found',
        };
      }

      // Delegate the task via orchestrator
      const orchestrator = new AgentOrchestrator(context.workspaceId);
      const result = await orchestrator.delegateTask(
        '', // No "from" agent when delegating from Neptune
        agent.id,
        taskDescription,
        taskContext
      );

      if (!result.success) {
        return {
          success: false,
          message: `Failed to delegate task to ${agent.name}: ${result.error}`,
          error: result.error,
        };
      }

      logger.info('[Neptune] Task delegated', {
        agentId: agent.id,
        taskDescription,
      });

      return {
        success: true,
        message: `Delegated task to **${agent.name}**: "${taskDescription}". The agent will begin working on this.`,
        data: {
          agentId: agent.id,
          agentName: agent.name,
          taskId: result.taskId,
          messageId: result.messageId,
        },
      };
    } catch (error) {
      logger.error('AI delegate_to_agent failed', error);
      return {
        success: false,
        message: 'Failed to delegate task. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Orchestration: Coordinate Agents
  async coordinate_agents(args, context): Promise<ToolResult> {
    try {
      const { TeamExecutor } = await import('@/lib/orchestration/team-executor');

      const objective = args.objective as string;
      const agentIds = args.agentIds as string[] | undefined;
      const teamId = args.teamId as string | undefined;
      const executionMode = (args.executionMode as string) || 'sequential';
      const sharedContext = args.context as Record<string, unknown> | undefined;

      if (!objective) {
        return {
          success: false,
          message: 'Please provide an objective for the agents to work on.',
          error: 'Missing objective',
        };
      }

      let targetAgentIds: string[] = [];

      // Get agent IDs from team or direct list
      if (teamId) {
        const members = await db.query.agentTeamMembers.findMany({
          where: eq(agentTeamMembers.teamId, teamId),
        });
        targetAgentIds = members.map((m) => m.agentId);
      } else if (agentIds && agentIds.length > 0) {
        targetAgentIds = agentIds;
      } else {
        // Get all active agents
        const allAgents = await db.query.agents.findMany({
          where: and(
            eq(agents.workspaceId, context.workspaceId),
            eq(agents.status, 'active')
          ),
          limit: 10,
        });
        targetAgentIds = allAgents.map((a) => a.id);
      }

      if (targetAgentIds.length === 0) {
        return {
          success: false,
          message: 'No agents available for coordination. Please create some agents first.',
          error: 'No agents found',
        };
      }

      // Get agent names for response
      const agentsList = await db.query.agents.findMany({
        where: inArray(agents.id, targetAgentIds),
      });
      const agentNames = agentsList.map((a) => a.name);

      // Use TeamExecutor for coordination (even without a formal team)
      const executor = new TeamExecutor(context.workspaceId);

      logger.info('[Neptune] Coordinating agents', {
        objective,
        agentCount: targetAgentIds.length,
        mode: executionMode,
      });

      return {
        success: true,
        message: `Coordinating ${agentNames.length} agent(s) on objective: "${objective}"\n\nAgents involved: ${agentNames.join(', ')}\n\nMode: ${executionMode}`,
        data: {
          objective,
          agentIds: targetAgentIds,
          agentNames,
          executionMode,
          agentCount: targetAgentIds.length,
        },
      };
    } catch (error) {
      logger.error('AI coordinate_agents failed', error);
      return {
        success: false,
        message: 'Failed to coordinate agents. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Orchestration: Check Agent Availability
  async check_agent_availability(args, context): Promise<ToolResult> {
    try {
      const department = args.department as string | undefined;
      const teamId = args.teamId as string | undefined;
      const capabilities = args.capabilities as string[] | undefined;

      // Build conditions
      const conditions = [
        eq(agents.workspaceId, context.workspaceId),
        eq(agents.status, 'active'),
      ];

      // Get all active agents
      let agentsList = await db.query.agents.findMany({
        where: and(...conditions),
        orderBy: [desc(agents.lastExecutedAt)],
      });

      // Filter by team if specified
      if (teamId) {
        const members = await db.query.agentTeamMembers.findMany({
          where: eq(agentTeamMembers.teamId, teamId),
        });
        const memberIds = members.map((m) => m.agentId);
        agentsList = agentsList.filter((a) => memberIds.includes(a.id));
      }

      // Filter by capabilities if specified
      if (capabilities && capabilities.length > 0) {
        agentsList = agentsList.filter((a) => {
          const config = a.config as { capabilities?: string[] } | null;
          if (!config?.capabilities) return false;
          return capabilities.some((cap) => config.capabilities?.includes(cap));
        });
      }

      if (agentsList.length === 0) {
        let filterMsg = '';
        if (department) filterMsg += ` in ${department}`;
        if (teamId) filterMsg += ' in the specified team';
        if (capabilities) filterMsg += ` with ${capabilities.join(', ')} capabilities`;

        return {
          success: true,
          message: `No active agents found${filterMsg}. Consider creating new agents or activating existing ones.`,
          data: { agents: [], total: 0 },
        };
      }

      const agentDetails = agentsList.map((a) => {
        const config = a.config as { capabilities?: string[] } | null;
        return {
          id: a.id,
          name: a.name,
          type: a.type,
          status: a.status,
          capabilities: config?.capabilities || [],
          executionCount: a.executionCount,
          lastExecutedAt: a.lastExecutedAt,
        };
      });

      const agentList = agentDetails
        .map((a) => `* **${a.name}** (${a.type}) - ${a.executionCount} runs${a.lastExecutedAt ? `, last active ${new Date(a.lastExecutedAt).toLocaleDateString()}` : ''}`)
        .join('\n');

      return {
        success: true,
        message: `Found ${agentsList.length} available agent(s):\n${agentList}`,
        data: { agents: agentDetails, total: agentsList.length },
      };
    } catch (error) {
      logger.error('AI check_agent_availability failed', error);
      return {
        success: false,
        message: 'Failed to check agent availability. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Memory: Store Shared Context
  async store_shared_context(args, context): Promise<ToolResult> {
    try {
      const { AgentMemoryService } = await import('@/lib/orchestration/memory');

      const key = args.key as string;
      const value = args.value as Record<string, unknown>;
      const category = (args.category as string) || 'context';
      const teamId = args.teamId as string | undefined;
      const agentId = args.agentId as string | undefined;
      const importance = (args.importance as number) || 50;

      if (!key || !value) {
        return {
          success: false,
          message: 'Please provide both a key and value to store.',
          error: 'Missing required fields',
        };
      }

      const memoryService = new AgentMemoryService(context.workspaceId);
      const memoryId = await memoryService.store({
        workspaceId: context.workspaceId,
        teamId,
        agentId,
        memoryTier: importance >= 70 ? 'long_term' : importance >= 40 ? 'medium_term' : 'short_term',
        category: category as 'context' | 'pattern' | 'preference' | 'knowledge' | 'relationship',
        key,
        value,
        importance,
      });

      logger.info('[Neptune] Stored shared context', {
        memoryId,
        key,
        category,
      });

      let scopeMsg = 'workspace';
      if (teamId) scopeMsg = 'the team';
      if (agentId) scopeMsg = 'the agent';

      return {
        success: true,
        message: `Stored context "${key}" for ${scopeMsg}. This information is now available for agents to access.`,
        data: {
          memoryId,
          key,
          category,
          importance,
          tier: importance >= 70 ? 'long_term' : importance >= 40 ? 'medium_term' : 'short_term',
        },
      };
    } catch (error) {
      logger.error('AI store_shared_context failed', error);
      return {
        success: false,
        message: 'Failed to store context. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Memory: Retrieve Agent Memory
  async retrieve_agent_memory(args, context): Promise<ToolResult> {
    try {
      const { AgentMemoryService } = await import('@/lib/orchestration/memory');

      const agentId = args.agentId as string | undefined;
      const teamId = args.teamId as string | undefined;
      const category = args.category as string | undefined;
      const keyPattern = args.keyPattern as string | undefined;
      const minImportance = args.minImportance as number | undefined;
      const limit = Math.min((args.limit as number) || 20, 50);

      const memoryService = new AgentMemoryService(context.workspaceId);
      const memories = await memoryService.retrieve({
        workspaceId: context.workspaceId,
        agentId,
        teamId,
        category: category as 'context' | 'pattern' | 'preference' | 'knowledge' | 'relationship' | undefined,
        keyPattern,
        minImportance,
        limit,
      });

      if (memories.length === 0) {
        let scopeMsg = 'the workspace';
        if (agentId) scopeMsg = 'this agent';
        if (teamId) scopeMsg = 'this team';

        return {
          success: true,
          message: `No memories found for ${scopeMsg} with the specified filters.`,
          data: { memories: [], total: 0 },
        };
      }

      const memoryList = memories.map((m) => ({
        id: m.id,
        key: m.key,
        category: m.category,
        tier: m.memoryTier,
        importance: m.importance,
        value: m.value,
        createdAt: m.createdAt,
      }));

      const displayList = memoryList
        .slice(0, 5)
        .map((m) => `* **${m.key}** (${m.category}, ${m.tier}) - importance: ${m.importance}`)
        .join('\n');

      return {
        success: true,
        message: `Found ${memories.length} memory item(s):\n${displayList}${memories.length > 5 ? `\n... and ${memories.length - 5} more` : ''}`,
        data: { memories: memoryList, total: memories.length },
      };
    } catch (error) {
      logger.error('AI retrieve_agent_memory failed', error);
      return {
        success: false,
        message: 'Failed to retrieve memories. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
