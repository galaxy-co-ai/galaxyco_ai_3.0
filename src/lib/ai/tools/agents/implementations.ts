/**
 * Agents Tool Implementations
 */
import type { ToolImplementations, ToolResult } from '../types';
import { db } from '@/lib/db';
import { agents } from '@/db/schema';
import { eq, and, desc, like } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export const agentsToolImplementations: ToolImplementations = {
  // Agents: List Agents
  async list_agents(args, context): Promise<ToolResult> {
    try {
      const status = args.status as typeof agents.status.enumValues[number] | undefined;

      const conditions = [eq(agents.workspaceId, context.workspaceId)];
      if (status) {
        conditions.push(eq(agents.status, status));
      }

      const agentsList = await db.query.agents.findMany({
        where: and(...conditions),
        orderBy: [desc(agents.lastExecutedAt)],
        limit: 20,
      });

      return {
        success: true,
        message: `Found ${agentsList.length} agent(s)`,
        data: {
          agents: agentsList.map((a) => ({
            id: a.id,
            name: a.name,
            type: a.type,
            status: a.status,
            executionCount: a.executionCount,
            lastExecutedAt: a.lastExecutedAt,
          })),
        },
      };
    } catch (error) {
      logger.error('AI list_agents failed', error);
      return {
        success: false,
        message: 'Failed to list agents',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Agents: Create Agent
  async create_agent(args, context): Promise<ToolResult> {
    try {
      const name = args.name as string;
      const type = args.type as typeof agents.type.enumValues[number];
      const description = args.description as string | undefined;
      const config = args.config as Record<string, unknown> | undefined;
      const status = (args.status as typeof agents.status.enumValues[number]) || 'active';

      // Validate agent type
      const validTypes = ['scope', 'call', 'email', 'note', 'task', 'roadmap', 'content', 'custom', 'browser', 'cross-app', 'knowledge', 'sales', 'trending', 'research', 'meeting', 'code', 'data', 'security'];
      if (!validTypes.includes(type)) {
        return {
          success: false,
          message: `Invalid agent type "${type}". Valid types: ${validTypes.join(', ')}`,
        };
      }

      // Create agent in database
      const [newAgent] = await db.insert(agents).values({
        workspaceId: context.workspaceId,
        name,
        description: description || null,
        type,
        status,
        config: config || {},
        createdBy: context.userId,
      }).returning();

      logger.info('AI created agent', { agentId: newAgent.id, name, type, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Created agent "${newAgent.name}" (${newAgent.type})`,
        data: {
          id: newAgent.id,
          name: newAgent.name,
          type: newAgent.type,
          status: newAgent.status,
          description: newAgent.description,
        },
      };
    } catch (error) {
      logger.error('AI create_agent failed', error);
      return {
        success: false,
        message: 'Failed to create agent',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Agents: Quick Create Agent (One-Shot Mode)
  async create_agent_quick(args, context): Promise<ToolResult> {
    try {
      const { quickCreateAgent } = await import('../../agent-wizard');
      const { gatherAIContext } = await import('../../context');

      const description = args.description as string;
      const templateId = args.templateId as string | undefined;
      const name = args.name as string | undefined;
      const customizations = args.customizations as Record<string, unknown> | undefined;

      // Get full AI context for template matching
      const aiContext = await gatherAIContext(context.workspaceId, context.userId);

      if (!aiContext) {
        return {
          success: false,
          message: 'Failed to gather workspace context',
          error: 'Context gathering failed'
        };
      }

      // Create the agent
      const result = await quickCreateAgent(
        description,
        aiContext,
        {
          workspaceId: context.workspaceId,
          userId: context.userId
        },
        {
          templateId,
          customizations: {
            name,
            ...customizations
          }
        }
      );

      if (!result.success) {
        if (result.needsClarification) {
          return {
            success: false,
            message: result.clarificationQuestion || 'Need more information to create agent',
            error: 'Clarification needed'
          };
        }
        return {
          success: false,
          message: result.error || 'Failed to create agent',
          error: result.error
        };
      }

      const agent = result.agent!;

      logger.info('AI created agent via quick create', {
        agentId: agent.agentId,
        name: agent.name,
        template: agent.template,
        workspaceId: context.workspaceId
      });

      let message = `Created **${agent.name}**!\n\n`;
      message += `**Type:** ${agent.type}\n`;
      message += `**Capabilities:** ${agent.capabilities.join(', ')}\n`;

      if (agent.template) {
        message += `**Template:** ${agent.template}\n`;
      }

      message += `\nYour agent is active and ready to use. Try saying "run ${agent.name}" to test it!`;

      return {
        success: true,
        message,
        data: {
          agentId: agent.agentId,
          name: agent.name,
          description: agent.description,
          type: agent.type,
          capabilities: agent.capabilities,
          template: agent.template
        },
        suggestedNextStep: {
          action: 'run_agent',
          reason: 'New agents should be tested to ensure they work as expected',
          prompt: `Want me to run ${agent.name} now to test it out?`,
          autoSuggest: true,
        },
      };
    } catch (error) {
      logger.error('AI create_agent_quick failed', error);
      return {
        success: false,
        message: 'Failed to create agent. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  },

  // Automation: Create Automation from Natural Language
  async create_automation(args, context): Promise<ToolResult> {
    try {
      const { createAutomationFromChat } = await import('../../workflow-builder');

      const description = args.description as string;
      const result = await createAutomationFromChat(context.workspaceId, description);

      if (!result.success) {
        return {
          success: false,
          message: result.message,
        };
      }

      return {
        success: true,
        message: result.message,
        data: {
          automationId: result.automationId,
          workflow: result.workflow,
        },
      };
    } catch (error) {
      logger.error('AI create_automation failed', error);
      return {
        success: false,
        message: 'Failed to create automation',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Team: Assign Task to Team Member
  async assign_to_team_member(args, context): Promise<ToolResult> {
    try {
      const { delegateTask } = await import('../../collaboration');

      // Parse due date
      let dueDate: Date | undefined;
      if (args.due_date) {
        const dueDateStr = args.due_date as string;
        if (dueDateStr === 'tomorrow') {
          dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
        } else if (dueDateStr === 'next week') {
          dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        } else {
          dueDate = new Date(dueDateStr);
        }
      }

      const result = await delegateTask(context.workspaceId, {
        title: args.task_title as string,
        description: args.description as string | undefined,
        assigneeName: args.assignee_name as string,
        dueDate,
        priority: args.priority as 'low' | 'medium' | 'high' | undefined,
      });

      return {
        success: result.success,
        message: result.message,
        data: result.success ? {
          taskId: result.taskId,
          assignee: result.assignee,
        } : undefined,
      };
    } catch (error) {
      logger.error('AI assign_to_team_member failed', error);
      return {
        success: false,
        message: 'Failed to assign task',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Team: List Team Members
  async list_team_members(args, context): Promise<ToolResult> {
    try {
      const { getTeamMembers } = await import('../../collaboration');

      const members = await getTeamMembers(context.workspaceId);

      if (members.length === 0) {
        return {
          success: true,
          message: 'No team members found in this workspace',
          data: { members: [] },
        };
      }

      // Ensure members have a concrete type
      type TeamMember = { id: string; name: string; email: string; role: string };
      const typedMembers = members as TeamMember[];

      return {
        success: true,
        message: `Found ${typedMembers.length} team member(s)` ,
        data: {
          members: typedMembers.map((m: TeamMember) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            role: m.role,
          })),
        },
      };
    } catch (error) {
      logger.error('AI list_team_members failed', error);
      return {
        success: false,
        message: 'Failed to list team members',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Agents: Run Agent
  async run_agent(args, context): Promise<ToolResult> {
    try {
      const agentId = args.agentId as string | undefined;
      const agentName = args.agentName as string | undefined;

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
            like(agents.name, `%${agentName}%`),
            eq(agents.workspaceId, context.workspaceId)
          ),
        });
      }

      if (!agent) {
        return {
          success: false,
          message: 'Agent not found. Use list_agents to see available agents.',
        };
      }

      if (agent.status !== 'active') {
        return {
          success: false,
          message: `Agent "${agent.name}" is not active (status: ${agent.status})`,
        };
      }

      // Update execution count
      await db
        .update(agents)
        .set({
          executionCount: (agent.executionCount || 0) + 1,
          lastExecutedAt: new Date(),
        })
        .where(eq(agents.id, agent.id));

      logger.info('AI triggered agent', { agentId: agent.id, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Started agent "${agent.name}"`,
        data: {
          id: agent.id,
          name: agent.name,
          type: agent.type,
          status: 'running',
        },
      };
    } catch (error) {
      logger.error('AI run_agent failed', error);
      return {
        success: false,
        message: 'Failed to run agent',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Agents: Get Agent Status
  async get_agent_status(args, context): Promise<ToolResult> {
    try {
      const agentId = args.agentId as string;

      const agent = await db.query.agents.findFirst({
        where: and(
          eq(agents.id, agentId),
          eq(agents.workspaceId, context.workspaceId)
        ),
      });

      if (!agent) {
        return {
          success: false,
          message: 'Agent not found',
        };
      }

      return {
        success: true,
        message: `Agent "${agent.name}" status retrieved`,
        data: {
          id: agent.id,
          name: agent.name,
          status: agent.status,
          type: agent.type,
          executionCount: agent.executionCount,
          lastExecutedAt: agent.lastExecutedAt,
          createdAt: agent.createdAt,
        },
      };
    } catch (error) {
      logger.error('AI get_agent_status failed', error);
      return {
        success: false,
        message: 'Failed to get agent status',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
