/**
 * AI Assistant Tool Definitions
 * 
 * These tools allow the AI assistant to execute actions on behalf of the user.
 * Each tool is mapped to a real API action in the platform.
 */

import { z } from 'zod';
import { db } from '@/lib/db';
import {
  prospects,
  contacts,
  customers,
  calendarEvents,
  tasks,
  campaigns,
  agents,
  aiConversations,
} from '@/db/schema';
import { eq, and, desc, gte, lte, like, or, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ToolContext {
  workspaceId: string;
  userId: string;
  userEmail: string;
  userName: string;
}

export interface ToolResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  error?: string;
}

type ToolFunction = (
  args: Record<string, unknown>,
  context: ToolContext
) => Promise<ToolResult>;

// ============================================================================
// TOOL DEFINITIONS FOR GPT-4
// ============================================================================

export const aiTools: ChatCompletionTool[] = [
  // CRM Tools
  {
    type: 'function',
    function: {
      name: 'create_lead',
      description: 'Create a new lead/prospect in the CRM. Use this when the user wants to add a new potential customer or lead.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Full name of the lead (required)',
          },
          email: {
            type: 'string',
            description: 'Email address of the lead',
          },
          phone: {
            type: 'string',
            description: 'Phone number of the lead',
          },
          company: {
            type: 'string',
            description: 'Company or organization the lead works for',
          },
          title: {
            type: 'string',
            description: 'Job title of the lead',
          },
          estimatedValue: {
            type: 'number',
            description: 'Estimated deal value in dollars',
          },
          source: {
            type: 'string',
            description: 'Where this lead came from (e.g., "website", "referral", "linkedin")',
          },
          notes: {
            type: 'string',
            description: 'Additional notes about the lead',
          },
          stage: {
            type: 'string',
            enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
            description: 'Current stage in the sales pipeline',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_leads',
      description: 'Search for leads in the CRM by name, email, company, or stage. Use this to find existing leads.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query to match against lead name, email, or company',
          },
          stage: {
            type: 'string',
            enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
            description: 'Filter by specific pipeline stage',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (default: 10)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_lead_stage',
      description: 'Update the pipeline stage of an existing lead. Use this to move leads through the sales pipeline.',
      parameters: {
        type: 'object',
        properties: {
          leadId: {
            type: 'string',
            description: 'The ID of the lead to update',
          },
          newStage: {
            type: 'string',
            enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
            description: 'The new pipeline stage',
          },
          notes: {
            type: 'string',
            description: 'Optional notes about this stage change',
          },
        },
        required: ['leadId', 'newStage'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_contact',
      description: 'Create a new contact in the CRM. Use this for adding individual contacts that may be associated with organizations.',
      parameters: {
        type: 'object',
        properties: {
          firstName: {
            type: 'string',
            description: 'First name of the contact',
          },
          lastName: {
            type: 'string',
            description: 'Last name of the contact',
          },
          email: {
            type: 'string',
            description: 'Email address (required)',
          },
          phone: {
            type: 'string',
            description: 'Phone number',
          },
          company: {
            type: 'string',
            description: 'Company or organization',
          },
          title: {
            type: 'string',
            description: 'Job title',
          },
          notes: {
            type: 'string',
            description: 'Additional notes about the contact',
          },
        },
        required: ['email'],
      },
    },
  },
  
  // Calendar Tools
  {
    type: 'function',
    function: {
      name: 'schedule_meeting',
      description: 'Schedule a new meeting or calendar event. Use this when the user wants to create a meeting, appointment, or block time.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Title/name of the meeting (required)',
          },
          description: {
            type: 'string',
            description: 'Description or agenda for the meeting',
          },
          startTime: {
            type: 'string',
            description: 'Start date and time in ISO 8601 format (e.g., "2024-01-15T14:00:00Z")',
          },
          endTime: {
            type: 'string',
            description: 'End date and time in ISO 8601 format',
          },
          duration: {
            type: 'number',
            description: 'Duration in minutes (use if endTime not specified)',
          },
          location: {
            type: 'string',
            description: 'Physical location or "virtual" for online meetings',
          },
          meetingUrl: {
            type: 'string',
            description: 'Video call link (Zoom, Google Meet, etc.)',
          },
          attendees: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                name: { type: 'string' },
              },
            },
            description: 'List of attendees with email and name',
          },
        },
        required: ['title', 'startTime'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_upcoming_events',
      description: 'Get upcoming calendar events. Use this to see what meetings or events are scheduled.',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days to look ahead (default: 7)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of events to return (default: 10)',
          },
        },
      },
    },
  },
  
  // Task Tools
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task or to-do item. Use this when the user wants to add something to their task list.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Title of the task (required)',
          },
          description: {
            type: 'string',
            description: 'Detailed description of the task',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Priority level of the task',
          },
          dueDate: {
            type: 'string',
            description: 'Due date in ISO 8601 format',
          },
        },
        required: ['title'],
      },
    },
  },
  
  // Analytics & Insights Tools
  {
    type: 'function',
    function: {
      name: 'get_pipeline_summary',
      description: 'Get a summary of the sales pipeline including total leads, conversion rates, and deal values by stage.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_hot_leads',
      description: 'Get the highest priority leads that are most likely to close. Uses lead score and stage.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of leads to return (default: 5)',
          },
        },
      },
    },
  },
  
  // Agent/Workflow Tools
  {
    type: 'function',
    function: {
      name: 'list_agents',
      description: 'List available AI agents and automations. Use this to show what agents are configured.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['draft', 'active', 'paused', 'archived'],
            description: 'Filter by agent status',
          },
        },
      },
    },
  },
  
  // Content Generation Tools
  {
    type: 'function',
    function: {
      name: 'draft_email',
      description: 'Generate a draft email for a specific purpose. Use this when the user wants help writing an email.',
      parameters: {
        type: 'object',
        properties: {
          purpose: {
            type: 'string',
            description: 'Purpose of the email (e.g., "follow up", "introduction", "proposal", "thank you")',
          },
          recipientName: {
            type: 'string',
            description: 'Name of the recipient',
          },
          recipientCompany: {
            type: 'string',
            description: 'Company of the recipient',
          },
          context: {
            type: 'string',
            description: 'Additional context about the situation or relationship',
          },
          tone: {
            type: 'string',
            enum: ['formal', 'professional', 'friendly', 'casual'],
            description: 'Desired tone of the email',
          },
        },
        required: ['purpose'],
      },
    },
  },
];

// ============================================================================
// TOOL IMPLEMENTATIONS
// ============================================================================

const toolImplementations: Record<string, ToolFunction> = {
  // CRM: Create Lead
  async create_lead(args, context): Promise<ToolResult> {
    try {
      const [prospect] = await db
        .insert(prospects)
        .values({
          workspaceId: context.workspaceId,
          name: args.name as string,
          email: (args.email as string) || null,
          phone: (args.phone as string) || null,
          company: (args.company as string) || null,
          title: (args.title as string) || null,
          stage: (args.stage as 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost') || 'new',
          estimatedValue: args.estimatedValue ? Math.round((args.estimatedValue as number) * 100) : null,
          source: (args.source as string) || 'ai_assistant',
          notes: (args.notes as string) || null,
        })
        .returning();

      logger.info('AI created lead', { prospectId: prospect.id, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Created lead "${prospect.name}" successfully`,
        data: {
          id: prospect.id,
          name: prospect.name,
          email: prospect.email,
          company: prospect.company,
          stage: prospect.stage,
        },
      };
    } catch (error) {
      logger.error('AI create_lead failed', error);
      return {
        success: false,
        message: 'Failed to create lead',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // CRM: Search Leads
  async search_leads(args, context): Promise<ToolResult> {
    try {
      const query = (args.query as string) || '';
      const stage = args.stage as string | undefined;
      const limit = (args.limit as number) || 10;

      const conditions = [eq(prospects.workspaceId, context.workspaceId)];

      if (query) {
        conditions.push(
          or(
            like(prospects.name, `%${query}%`),
            like(prospects.email, `%${query}%`),
            like(prospects.company, `%${query}%`)
          )!
        );
      }

      if (stage) {
        conditions.push(eq(prospects.stage, stage as typeof prospects.stage.enumValues[number]));
      }

      const results = await db.query.prospects.findMany({
        where: and(...conditions),
        orderBy: [desc(prospects.createdAt)],
        limit,
      });

      return {
        success: true,
        message: `Found ${results.length} lead(s)`,
        data: {
          leads: results.map((p) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            company: p.company,
            stage: p.stage,
            estimatedValue: p.estimatedValue ? p.estimatedValue / 100 : null,
            lastContactedAt: p.lastContactedAt,
          })),
        },
      };
    } catch (error) {
      logger.error('AI search_leads failed', error);
      return {
        success: false,
        message: 'Failed to search leads',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // CRM: Update Lead Stage
  async update_lead_stage(args, context): Promise<ToolResult> {
    try {
      const leadId = args.leadId as string;
      const newStage = args.newStage as typeof prospects.stage.enumValues[number];
      const notes = args.notes as string | undefined;

      // Verify the lead belongs to this workspace
      const lead = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, leadId),
          eq(prospects.workspaceId, context.workspaceId)
        ),
      });

      if (!lead) {
        return {
          success: false,
          message: 'Lead not found or access denied',
        };
      }

      const updateData: Record<string, unknown> = {
        stage: newStage,
        updatedAt: new Date(),
      };

      if (notes) {
        updateData.notes = lead.notes ? `${lead.notes}\n\n[${new Date().toISOString()}] ${notes}` : notes;
      }

      await db
        .update(prospects)
        .set(updateData)
        .where(eq(prospects.id, leadId));

      logger.info('AI updated lead stage', { leadId, newStage, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Updated "${lead.name}" to stage "${newStage}"`,
        data: {
          id: lead.id,
          name: lead.name,
          previousStage: lead.stage,
          newStage,
        },
      };
    } catch (error) {
      logger.error('AI update_lead_stage failed', error);
      return {
        success: false,
        message: 'Failed to update lead stage',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // CRM: Create Contact
  async create_contact(args, context): Promise<ToolResult> {
    try {
      const [contact] = await db
        .insert(contacts)
        .values({
          workspaceId: context.workspaceId,
          firstName: (args.firstName as string) || null,
          lastName: (args.lastName as string) || null,
          email: args.email as string,
          phone: (args.phone as string) || null,
          company: (args.company as string) || null,
          title: (args.title as string) || null,
          notes: (args.notes as string) || null,
        })
        .returning();

      const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email;
      logger.info('AI created contact', { contactId: contact.id, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Created contact "${name}" successfully`,
        data: {
          id: contact.id,
          name,
          email: contact.email,
          company: contact.company,
        },
      };
    } catch (error) {
      logger.error('AI create_contact failed', error);
      return {
        success: false,
        message: 'Failed to create contact',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Calendar: Schedule Meeting
  async schedule_meeting(args, context): Promise<ToolResult> {
    try {
      const title = args.title as string;
      const startTime = new Date(args.startTime as string);
      
      // Calculate end time
      let endTime: Date;
      if (args.endTime) {
        endTime = new Date(args.endTime as string);
      } else {
        const durationMinutes = (args.duration as number) || 60;
        endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
      }

      const attendeesInput = args.attendees as Array<{ email: string; name: string }> | undefined;
      const attendees = attendeesInput?.map((a) => ({
        email: a.email,
        name: a.name,
        status: 'pending' as const,
      })) || [];

      // Get user record for createdBy
      const userRecord = await db.query.users.findFirst({
        where: eq(sql`clerk_user_id`, context.userId),
      });

      if (!userRecord) {
        return {
          success: false,
          message: 'User record not found',
        };
      }

      const [event] = await db
        .insert(calendarEvents)
        .values({
          workspaceId: context.workspaceId,
          createdBy: userRecord.id,
          title,
          description: (args.description as string) || null,
          startTime,
          endTime,
          location: (args.location as string) || null,
          meetingUrl: (args.meetingUrl as string) || null,
          attendees,
          timezone: 'America/Chicago',
        })
        .returning();

      logger.info('AI scheduled meeting', { eventId: event.id, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Scheduled "${title}" for ${startTime.toLocaleString()}`,
        data: {
          id: event.id,
          title: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
          attendeeCount: attendees.length,
        },
      };
    } catch (error) {
      logger.error('AI schedule_meeting failed', error);
      return {
        success: false,
        message: 'Failed to schedule meeting',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Calendar: Get Upcoming Events
  async get_upcoming_events(args, context): Promise<ToolResult> {
    try {
      const days = (args.days as number) || 7;
      const limit = (args.limit as number) || 10;

      const now = new Date();
      const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const events = await db.query.calendarEvents.findMany({
        where: and(
          eq(calendarEvents.workspaceId, context.workspaceId),
          gte(calendarEvents.startTime, now),
          lte(calendarEvents.startTime, endDate)
        ),
        orderBy: [calendarEvents.startTime],
        limit,
      });

      return {
        success: true,
        message: `Found ${events.length} upcoming event(s) in the next ${days} days`,
        data: {
          events: events.map((e) => ({
            id: e.id,
            title: e.title,
            startTime: e.startTime,
            endTime: e.endTime,
            location: e.location,
            attendeeCount: (e.attendees as unknown[])?.length || 0,
          })),
        },
      };
    } catch (error) {
      logger.error('AI get_upcoming_events failed', error);
      return {
        success: false,
        message: 'Failed to get upcoming events',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Tasks: Create Task
  async create_task(args, context): Promise<ToolResult> {
    try {
      // Get user record
      const userRecord = await db.query.users.findFirst({
        where: eq(sql`clerk_user_id`, context.userId),
      });

      if (!userRecord) {
        return {
          success: false,
          message: 'User record not found',
        };
      }

      const [task] = await db
        .insert(tasks)
        .values({
          workspaceId: context.workspaceId,
          title: args.title as string,
          description: (args.description as string) || null,
          priority: (args.priority as 'low' | 'medium' | 'high' | 'urgent') || 'medium',
          status: 'todo',
          dueDate: args.dueDate ? new Date(args.dueDate as string) : null,
          createdBy: userRecord.id,
          assignedTo: userRecord.id, // Assign to the requester
        })
        .returning();

      logger.info('AI created task', { taskId: task.id, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Created task "${task.title}"`,
        data: {
          id: task.id,
          title: task.title,
          priority: task.priority,
          dueDate: task.dueDate,
        },
      };
    } catch (error) {
      logger.error('AI create_task failed', error);
      return {
        success: false,
        message: 'Failed to create task',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Analytics: Get Pipeline Summary
  async get_pipeline_summary(args, context): Promise<ToolResult> {
    try {
      const allProspects = await db.query.prospects.findMany({
        where: eq(prospects.workspaceId, context.workspaceId),
      });

      const stages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
      const pipelineSummary = stages.map((stage) => {
        const stageProspects = allProspects.filter((p) => p.stage === stage);
        const totalValue = stageProspects.reduce((sum, p) => sum + (p.estimatedValue || 0), 0);
        return {
          stage,
          count: stageProspects.length,
          totalValue: totalValue / 100, // Convert from cents
        };
      });

      const totalLeads = allProspects.length;
      const wonDeals = allProspects.filter((p) => p.stage === 'won').length;
      const conversionRate = totalLeads > 0 ? ((wonDeals / totalLeads) * 100).toFixed(1) : 0;
      const totalPipelineValue = allProspects
        .filter((p) => !['won', 'lost'].includes(p.stage))
        .reduce((sum, p) => sum + (p.estimatedValue || 0), 0) / 100;

      return {
        success: true,
        message: 'Pipeline summary retrieved',
        data: {
          totalLeads,
          conversionRate: `${conversionRate}%`,
          totalPipelineValue,
          byStage: pipelineSummary,
        },
      };
    } catch (error) {
      logger.error('AI get_pipeline_summary failed', error);
      return {
        success: false,
        message: 'Failed to get pipeline summary',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Analytics: Get Hot Leads
  async get_hot_leads(args, context): Promise<ToolResult> {
    try {
      const limit = (args.limit as number) || 5;

      // Get leads that are in active stages with highest scores/values
      const hotLeads = await db.query.prospects.findMany({
        where: and(
          eq(prospects.workspaceId, context.workspaceId),
          or(
            eq(prospects.stage, 'qualified'),
            eq(prospects.stage, 'proposal'),
            eq(prospects.stage, 'negotiation')
          )
        ),
        orderBy: [desc(prospects.score), desc(prospects.estimatedValue)],
        limit,
      });

      return {
        success: true,
        message: `Found ${hotLeads.length} hot lead(s) ready to close`,
        data: {
          leads: hotLeads.map((p) => ({
            id: p.id,
            name: p.name,
            company: p.company,
            stage: p.stage,
            score: p.score,
            estimatedValue: p.estimatedValue ? p.estimatedValue / 100 : null,
            nextFollowUpAt: p.nextFollowUpAt,
          })),
        },
      };
    } catch (error) {
      logger.error('AI get_hot_leads failed', error);
      return {
        success: false,
        message: 'Failed to get hot leads',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

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

  // Content: Draft Email
  async draft_email(args, context): Promise<ToolResult> {
    // This is a content generation tool - the AI will generate the content
    // We just return the parameters to signal success
    return {
      success: true,
      message: 'Email draft parameters received',
      data: {
        purpose: args.purpose,
        recipientName: args.recipientName,
        recipientCompany: args.recipientCompany,
        context: args.context,
        tone: args.tone || 'professional',
        senderName: context.userName,
      },
    };
  },
};

// ============================================================================
// TOOL EXECUTOR
// ============================================================================

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const implementation = toolImplementations[toolName];
  
  if (!implementation) {
    logger.error('Unknown tool called', { toolName });
    return {
      success: false,
      message: `Unknown tool: ${toolName}`,
    };
  }

  logger.info('Executing AI tool', { toolName, workspaceId: context.workspaceId });
  
  try {
    const result = await implementation(args, context);
    logger.info('AI tool completed', { toolName, success: result.success });
    return result;
  } catch (error) {
    logger.error('AI tool execution failed', { toolName, error });
    return {
      success: false,
      message: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// HELPER: Get Tool Names by Category
// ============================================================================

export const toolsByCategory = {
  crm: ['create_lead', 'search_leads', 'update_lead_stage', 'create_contact'],
  calendar: ['schedule_meeting', 'get_upcoming_events'],
  tasks: ['create_task'],
  analytics: ['get_pipeline_summary', 'get_hot_leads'],
  agents: ['list_agents'],
  content: ['draft_email'],
};

export function getToolsForCapability(capability: string): ChatCompletionTool[] {
  const toolNames: string[] = [];
  
  switch (capability) {
    case 'workflow':
      toolNames.push(...toolsByCategory.agents, ...toolsByCategory.tasks);
      break;
    case 'insights':
      toolNames.push(...toolsByCategory.analytics, ...toolsByCategory.crm);
      break;
    case 'content':
      toolNames.push(...toolsByCategory.content);
      break;
    case 'scheduling':
      toolNames.push(...toolsByCategory.calendar);
      break;
    case 'leads':
      toolNames.push(...toolsByCategory.crm, ...toolsByCategory.analytics);
      break;
    case 'research':
      toolNames.push(...toolsByCategory.crm);
      break;
    default:
      // Return all tools
      return aiTools;
  }

  return aiTools.filter((tool) => {
    if (tool.type === 'function' && 'function' in tool) {
      return toolNames.includes(tool.function.name);
    }
    return false;
  });
}

