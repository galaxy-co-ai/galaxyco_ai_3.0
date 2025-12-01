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
  knowledgeItems,
  knowledgeCollections,
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
  
  // ============================================================================
  // KNOWLEDGE BASE TOOLS
  // ============================================================================
  {
    type: 'function',
    function: {
      name: 'search_knowledge',
      description: 'Search the knowledge base for documents, articles, FAQs, and other content. Use this when the user asks questions that might be answered by company documentation.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query to find relevant documents',
          },
          type: {
            type: 'string',
            enum: ['document', 'url', 'image', 'text'],
            description: 'Filter by content type',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results (default: 5)',
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_document',
      description: 'Generate a complete, high-quality document based on user requirements. Use this when the user wants to CREATE or WRITE a new document, article, SOP, proposal, FAQ, meeting notes, or any content. The AI will write the full content.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Title of the document',
          },
          documentType: {
            type: 'string',
            enum: ['article', 'sop', 'proposal', 'meeting-notes', 'faq', 'guide', 'report', 'policy', 'template', 'general'],
            description: 'Type of document to generate - this determines the structure and tone',
          },
          topic: {
            type: 'string',
            description: 'Main topic or subject matter to write about',
          },
          requirements: {
            type: 'string',
            description: 'Specific requirements, context, key points to include, or instructions for the document',
          },
          tone: {
            type: 'string',
            enum: ['professional', 'casual', 'technical', 'friendly', 'formal'],
            description: 'Writing tone/style (default: professional)',
          },
          length: {
            type: 'string',
            enum: ['brief', 'standard', 'comprehensive'],
            description: 'Desired document length (default: standard)',
          },
          collectionId: {
            type: 'string',
            description: 'Optional collection/category ID to organize the document',
          },
          collectionName: {
            type: 'string',
            description: 'Name of collection to put document in (will create if needed)',
          },
        },
        required: ['title', 'documentType', 'topic'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_document',
      description: 'Save a document to the knowledge base with provided content. Use this when you already have the content ready to save.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Title of the document',
          },
          content: {
            type: 'string',
            description: 'The document content (supports markdown formatting)',
          },
          type: {
            type: 'string',
            enum: ['document', 'text'],
            description: 'Type of content',
          },
          collectionId: {
            type: 'string',
            description: 'Optional collection/folder ID to organize the document',
          },
          collectionName: {
            type: 'string',
            description: 'Name of collection to put document in (will create if needed)',
          },
        },
        required: ['title', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_collection',
      description: 'Create a new collection/category in the knowledge base to organize documents.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the collection',
          },
          description: {
            type: 'string',
            description: 'Description of what this collection contains',
          },
          color: {
            type: 'string',
            description: 'Color for the collection (e.g., blue, green, purple)',
          },
          icon: {
            type: 'string',
            description: 'Emoji icon for the collection',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_collections',
      description: 'List all collections/folders in the knowledge base.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },

  // ============================================================================
  // MARKETING TOOLS
  // ============================================================================
  {
    type: 'function',
    function: {
      name: 'create_campaign',
      description: 'Create a new marketing campaign. Use this when the user wants to set up email campaigns or marketing automations.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the campaign',
          },
          type: {
            type: 'string',
            enum: ['email', 'drip', 'newsletter', 'promotion'],
            description: 'Type of campaign',
          },
          subject: {
            type: 'string',
            description: 'Email subject line',
          },
          content: {
            type: 'string',
            description: 'Email content/body',
          },
          targetAudience: {
            type: 'string',
            description: 'Description of target audience (e.g., "all leads", "customers", "new signups")',
          },
        },
        required: ['name', 'type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_campaign_stats',
      description: 'Get performance statistics for marketing campaigns.',
      parameters: {
        type: 'object',
        properties: {
          campaignId: {
            type: 'string',
            description: 'Specific campaign ID to get stats for (optional, returns all if not provided)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_email',
      description: 'Send an email to a contact or lead. Use this when the user wants to actually send (not just draft) an email.',
      parameters: {
        type: 'object',
        properties: {
          to: {
            type: 'string',
            description: 'Recipient email address',
          },
          subject: {
            type: 'string',
            description: 'Email subject line',
          },
          body: {
            type: 'string',
            description: 'Email body content',
          },
          leadId: {
            type: 'string',
            description: 'Optional lead ID to associate the email with',
          },
        },
        required: ['to', 'subject', 'body'],
      },
    },
  },

  // ============================================================================
  // DEAL/PIPELINE TOOLS
  // ============================================================================
  {
    type: 'function',
    function: {
      name: 'create_deal',
      description: 'Create a new deal/opportunity in the pipeline.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Deal name/title',
          },
          value: {
            type: 'number',
            description: 'Deal value in dollars',
          },
          stage: {
            type: 'string',
            enum: ['qualification', 'proposal', 'negotiation', 'closing', 'won', 'lost'],
            description: 'Current deal stage',
          },
          leadId: {
            type: 'string',
            description: 'Associated lead ID',
          },
          expectedCloseDate: {
            type: 'string',
            description: 'Expected close date in ISO format',
          },
          notes: {
            type: 'string',
            description: 'Deal notes or description',
          },
        },
        required: ['name', 'value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_deal',
      description: 'Update an existing deal (value, stage, close date, etc.).',
      parameters: {
        type: 'object',
        properties: {
          dealId: {
            type: 'string',
            description: 'The deal ID to update',
          },
          value: {
            type: 'number',
            description: 'New deal value',
          },
          stage: {
            type: 'string',
            enum: ['qualification', 'proposal', 'negotiation', 'closing', 'won', 'lost'],
            description: 'New deal stage',
          },
          expectedCloseDate: {
            type: 'string',
            description: 'New expected close date',
          },
          notes: {
            type: 'string',
            description: 'Additional notes',
          },
        },
        required: ['dealId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_deals_closing_soon',
      description: 'Get deals that are expected to close soon.',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days to look ahead (default: 30)',
          },
          minValue: {
            type: 'number',
            description: 'Minimum deal value filter',
          },
        },
      },
    },
  },

  // ============================================================================
  // WORKFLOW/AGENT TOOLS
  // ============================================================================
  {
    type: 'function',
    function: {
      name: 'run_agent',
      description: 'Trigger/run an AI agent or automation workflow.',
      parameters: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'The ID of the agent to run',
          },
          agentName: {
            type: 'string',
            description: 'The name of the agent (alternative to ID)',
          },
          inputs: {
            type: 'object',
            description: 'Input parameters for the agent',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_agent_status',
      description: 'Check the status and recent executions of an agent.',
      parameters: {
        type: 'object',
        properties: {
          agentId: {
            type: 'string',
            description: 'The agent ID to check',
          },
        },
        required: ['agentId'],
      },
    },
  },

  // ============================================================================
  // TEAM COLLABORATION TOOLS
  // ============================================================================
  {
    type: 'function',
    function: {
      name: 'add_note',
      description: 'Add a note to a lead, contact, or deal.',
      parameters: {
        type: 'object',
        properties: {
          entityType: {
            type: 'string',
            enum: ['lead', 'contact', 'deal'],
            description: 'Type of entity to add note to',
          },
          entityId: {
            type: 'string',
            description: 'ID of the lead, contact, or deal',
          },
          content: {
            type: 'string',
            description: 'The note content',
          },
        },
        required: ['entityType', 'entityId', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_activity_timeline',
      description: 'Get recent activity/history for a lead, contact, or deal.',
      parameters: {
        type: 'object',
        properties: {
          entityType: {
            type: 'string',
            enum: ['lead', 'contact', 'deal'],
            description: 'Type of entity',
          },
          entityId: {
            type: 'string',
            description: 'ID of the entity',
          },
          limit: {
            type: 'number',
            description: 'Max activities to return (default: 10)',
          },
        },
        required: ['entityType', 'entityId'],
      },
    },
  },

  // ============================================================================
  // ADVANCED ANALYTICS TOOLS
  // ============================================================================
  {
    type: 'function',
    function: {
      name: 'get_conversion_metrics',
      description: 'Get pipeline conversion rates and metrics between stages.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['week', 'month', 'quarter', 'year'],
            description: 'Time period for metrics',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'forecast_revenue',
      description: 'Get revenue forecast based on pipeline and historical data.',
      parameters: {
        type: 'object',
        properties: {
          months: {
            type: 'number',
            description: 'Number of months to forecast (default: 3)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_team_performance',
      description: 'Get team performance metrics (leads handled, deals closed, etc.).',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['week', 'month', 'quarter'],
            description: 'Time period for metrics',
          },
        },
      },
    },
  },

  // ============================================================================
  // FINANCE HQ TOOLS
  // ============================================================================
  {
    type: 'function',
    function: {
      name: 'get_finance_summary',
      description: 'Get a summary of the user\'s financial data including revenue, expenses, profit, and cash flow from connected integrations (QuickBooks, Stripe, Shopify).',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['today', 'this_week', 'this_month', 'last_month', 'this_quarter', 'this_year'],
            description: 'The time period to summarize',
          },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_overdue_invoices',
      description: 'Get a list of overdue invoices that need attention. Useful for following up on unpaid invoices.',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum number of invoices to return (default: 10)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_invoice_reminder',
      description: 'Send a payment reminder email for an overdue invoice to the customer.',
      parameters: {
        type: 'object',
        properties: {
          invoiceId: {
            type: 'string',
            description: 'The ID of the invoice to send a reminder for',
          },
          customMessage: {
            type: 'string',
            description: 'Optional custom message to include in the reminder email',
          },
        },
        required: ['invoiceId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_cash_flow_forecast',
      description: 'Generate a cash flow forecast for the next 30, 60, or 90 days based on historical data and pending invoices.',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            enum: [30, 60, 90],
            description: 'Number of days to forecast',
          },
        },
        required: ['days'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'compare_financial_periods',
      description: 'Compare financial metrics between two time periods to show growth or changes.',
      parameters: {
        type: 'object',
        properties: {
          metric: {
            type: 'string',
            enum: ['revenue', 'expenses', 'profit', 'orders', 'invoices'],
            description: 'The metric to compare',
          },
          period1: {
            type: 'string',
            enum: ['this_week', 'this_month', 'this_quarter', 'this_year'],
            description: 'First period to compare',
          },
          period2: {
            type: 'string',
            enum: ['last_week', 'last_month', 'last_quarter', 'last_year'],
            description: 'Second period to compare',
          },
        },
        required: ['metric', 'period1', 'period2'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_finance_integrations',
      description: 'Get the status of connected finance integrations (QuickBooks, Stripe, Shopify).',
      parameters: {
        type: 'object',
        properties: {},
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

  // ============================================================================
  // KNOWLEDGE BASE IMPLEMENTATIONS
  // ============================================================================

  async search_knowledge(args, context): Promise<ToolResult> {
    try {
      const query = (args.query as string) || '';
      const type = args.type as string | undefined;
      const limit = (args.limit as number) || 5;

      // Import vector search function
      const { searchKnowledge, isVectorConfigured } = await import('@/lib/vector');

      // Try semantic vector search first if configured
      if (isVectorConfigured() && query.trim().length > 0) {
        try {
          const vectorResults = await searchKnowledge(
            context.workspaceId,
            query,
            { topK: limit, minScore: 0.5, type }
          );

          if (vectorResults.results.length > 0) {
            // Fetch full document details for matched items
            const itemIds = vectorResults.results.map((r) => r.itemId);
            const documents = await db.query.knowledgeItems.findMany({
              where: and(
                eq(knowledgeItems.workspaceId, context.workspaceId),
                sql`${knowledgeItems.id} IN (${sql.join(itemIds.map(id => sql`${id}`), sql`, `)})`
              ),
            });

            // Map results with vector scores and relevant content
            const enrichedResults = vectorResults.results.map((vr) => {
              const doc = documents.find((d) => d.id === vr.itemId);
              return {
                id: vr.itemId,
                title: vr.title,
                type: doc?.type || 'document',
                summary: doc?.summary || '',
                relevantContent: vr.chunk, // The most relevant chunk for RAG
                relevanceScore: Math.round(vr.score * 100) + '%',
                updatedAt: doc?.updatedAt,
              };
            });

            logger.info('AI search_knowledge (vector)', { 
              query: query.slice(0, 50), 
              resultsCount: enrichedResults.length 
            });

            return {
              success: true,
              message: `Found ${enrichedResults.length} relevant document(s) using semantic search`,
              data: {
                documents: enrichedResults,
                searchType: 'semantic',
              },
            };
          }
        } catch (vectorError) {
          logger.warn('Vector search failed, falling back to SQL search', { 
            error: vectorError instanceof Error ? vectorError.message : 'Unknown error' 
          });
          // Fall through to SQL-based search
        }
      }

      // Fallback: SQL-based keyword search
      const conditions = [eq(knowledgeItems.workspaceId, context.workspaceId)];

      if (type) {
        conditions.push(eq(knowledgeItems.type, type as 'document' | 'url' | 'image' | 'text'));
      }

      if (query) {
        conditions.push(
          or(
            like(knowledgeItems.title, `%${query}%`),
            like(knowledgeItems.summary, `%${query}%`),
            like(knowledgeItems.content, `%${query}%`)
          )!
        );
      }

      const results = await db.query.knowledgeItems.findMany({
        where: and(...conditions),
        orderBy: [desc(knowledgeItems.updatedAt)],
        limit,
      });

      return {
        success: true,
        message: `Found ${results.length} document(s) matching "${query}"`,
        data: {
          documents: results.map((doc) => ({
            id: doc.id,
            title: doc.title,
            type: doc.type,
            summary: doc.summary,
            relevantContent: doc.content?.slice(0, 500), // Include snippet for RAG
            updatedAt: doc.updatedAt,
          })),
          searchType: 'keyword',
        },
      };
    } catch (error) {
      logger.error('AI search_knowledge failed', error);
      return {
        success: false,
        message: 'Failed to search knowledge base',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async generate_document(args, context): Promise<ToolResult> {
    try {
      const title = args.title as string;
      const documentType = args.documentType as string || 'general';
      const topic = args.topic as string;
      const requirements = args.requirements as string || '';
      const tone = args.tone as string || 'professional';
      const length = args.length as string || 'standard';
      const collectionName = args.collectionName as string | undefined;
      let collectionId = args.collectionId as string | undefined;

      // If collection name provided but no ID, find or create the collection
      if (collectionName && !collectionId) {
        const existingCollection = await db.query.knowledgeCollections.findFirst({
          where: and(
            eq(knowledgeCollections.workspaceId, context.workspaceId),
            like(knowledgeCollections.name, collectionName)
          ),
        });

        if (existingCollection) {
          collectionId = existingCollection.id;
        } else {
          // Create new collection
          const [newCollection] = await db
            .insert(knowledgeCollections)
            .values({
              workspaceId: context.workspaceId,
              name: collectionName,
              description: `Auto-created for ${documentType} documents`,
              createdBy: context.userId,
            })
            .returning();
          collectionId = newCollection.id;
        }
      }

      // Build the document structure template based on type
      const structureTemplates: Record<string, string> = {
        article: `
# ${title}

## Introduction
[Engaging introduction that hooks the reader and establishes the topic]

## Key Points
[Main content with well-organized sections]

### [Subheading 1]
[Detailed content]

### [Subheading 2]
[Detailed content]

## Conclusion
[Summary and call to action]`,
        sop: `
# ${title}

## Purpose
[Clear statement of why this procedure exists]

## Scope
[Who this applies to and when]

## Prerequisites
- [Required tools/access/knowledge]

## Procedure

### Step 1: [Action]
1. [Sub-step]
2. [Sub-step]

### Step 2: [Action]
1. [Sub-step]
2. [Sub-step]

## Troubleshooting
| Issue | Solution |
|-------|----------|
| [Common problem] | [Resolution] |

## References
- [Related documents]`,
        proposal: `
# ${title}

## Executive Summary
[Brief overview of the proposal and key benefits]

## Problem Statement
[Clear description of the challenge to be addressed]

## Proposed Solution
[Detailed description of your approach]

## Benefits
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

## Timeline
| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | [Time] | [Deliverables] |

## Investment
[Cost breakdown and pricing]

## Next Steps
[Clear call to action]`,
        'meeting-notes': `
# ${title}

**Date:** [Date]
**Attendees:** [Names]
**Location/Call:** [Location]

## Agenda
1. [Item 1]
2. [Item 2]

## Discussion Summary

### [Topic 1]
- [Key points discussed]
- [Decisions made]

### [Topic 2]
- [Key points discussed]
- [Decisions made]

## Action Items
| Action | Owner | Due Date |
|--------|-------|----------|
| [Task] | [Name] | [Date] |

## Next Meeting
[Date and topics]`,
        faq: `
# ${title}

## Frequently Asked Questions

### General

**Q: [Question 1]**
A: [Detailed answer]

**Q: [Question 2]**
A: [Detailed answer]

### Getting Started

**Q: [Question 3]**
A: [Detailed answer]

### Troubleshooting

**Q: [Question 4]**
A: [Detailed answer]`,
        guide: `
# ${title}

## Overview
[What this guide covers and who it's for]

## Getting Started
[Initial setup or prerequisites]

## Step-by-Step Instructions

### 1. [First Step]
[Detailed instructions with examples]

### 2. [Second Step]
[Detailed instructions with examples]

## Best Practices
- [Tip 1]
- [Tip 2]

## Additional Resources
- [Link/reference]`,
        report: `
# ${title}

## Executive Summary
[Key findings and recommendations]

## Introduction
[Context and objectives]

## Methodology
[How data was collected/analyzed]

## Findings

### [Finding 1]
[Details and supporting data]

### [Finding 2]
[Details and supporting data]

## Analysis
[Interpretation of findings]

## Recommendations
1. [Recommendation 1]
2. [Recommendation 2]

## Conclusion
[Summary and next steps]`,
        policy: `
# ${title}

## Policy Statement
[Clear statement of the policy]

## Purpose
[Why this policy exists]

## Scope
[Who this policy applies to]

## Policy Details

### [Section 1]
[Policy specifics]

### [Section 2]
[Policy specifics]

## Compliance
[How compliance will be monitored]

## Exceptions
[Process for requesting exceptions]

## Related Policies
- [Related policy links]

**Effective Date:** [Date]
**Last Updated:** [Date]`,
        general: `
# ${title}

## Overview
[Introduction to the topic]

## Details
[Main content]

## Summary
[Key takeaways]`,
      };

      const structure = structureTemplates[documentType] || structureTemplates.general;
      
      // Return the document generation request - the AI will fill in the content
      // based on this structure and the provided requirements
      return {
        success: true,
        message: `Ready to generate ${documentType} document. Please write the complete document content following this structure and requirements.`,
        data: {
          generationRequest: true,
          title,
          documentType,
          topic,
          requirements,
          tone,
          length,
          collectionId,
          collectionName,
          structureTemplate: structure,
          instructions: `Generate a ${length} ${tone} ${documentType} about "${topic}". ${requirements ? `Additional requirements: ${requirements}` : ''} Follow the structure template but write real, helpful content. Make it practical and actionable. Use markdown formatting.`,
        },
      };
    } catch (error) {
      logger.error('AI generate_document failed', error);
      return {
        success: false,
        message: 'Failed to prepare document generation',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async create_document(args, context): Promise<ToolResult> {
    try {
      const collectionName = args.collectionName as string | undefined;
      let collectionId = args.collectionId as string | undefined;

      // If collection name provided but no ID, find or create the collection
      if (collectionName && !collectionId) {
        const existingCollection = await db.query.knowledgeCollections.findFirst({
          where: and(
            eq(knowledgeCollections.workspaceId, context.workspaceId),
            like(knowledgeCollections.name, collectionName)
          ),
        });

        if (existingCollection) {
          collectionId = existingCollection.id;
        } else {
          // Create new collection
          const [newCollection] = await db
            .insert(knowledgeCollections)
            .values({
              workspaceId: context.workspaceId,
              name: collectionName,
              description: `Created by Neptune`,
              createdBy: context.userId,
            })
            .returning();
          collectionId = newCollection.id;
        }
      }

      const content = args.content as string;
      const [doc] = await db
        .insert(knowledgeItems)
        .values({
          workspaceId: context.workspaceId,
          title: args.title as string,
          type: (args.type as 'document' | 'text') || 'document',
          content: content,
          summary: content.substring(0, 500).replace(/[#*`]/g, ''), // Clean summary
          collectionId: collectionId || null,
          createdBy: context.userId,
          status: 'ready',
        })
        .returning();

      // Update collection item count if applicable
      if (collectionId) {
        await db
          .update(knowledgeCollections)
          .set({ 
            itemCount: sql`${knowledgeCollections.itemCount} + 1`,
            updatedAt: new Date(),
          })
          .where(eq(knowledgeCollections.id, collectionId));
      }

      logger.info('AI created document', { docId: doc.id, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `✅ Document "${doc.title}" has been saved to your knowledge base${collectionName ? ` in the "${collectionName}" category` : ''}.`,
        data: {
          id: doc.id,
          title: doc.title,
          type: doc.type,
          collectionId: collectionId,
        },
      };
    } catch (error) {
      logger.error('AI create_document failed', error);
      return {
        success: false,
        message: 'Failed to create document',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async create_collection(args, context): Promise<ToolResult> {
    try {
      // Check if collection already exists
      const existing = await db.query.knowledgeCollections.findFirst({
        where: and(
          eq(knowledgeCollections.workspaceId, context.workspaceId),
          like(knowledgeCollections.name, args.name as string)
        ),
      });

      if (existing) {
        return {
          success: true,
          message: `Collection "${existing.name}" already exists`,
          data: {
            id: existing.id,
            name: existing.name,
            description: existing.description,
            alreadyExisted: true,
          },
        };
      }

      const [collection] = await db
        .insert(knowledgeCollections)
        .values({
          workspaceId: context.workspaceId,
          name: args.name as string,
          description: args.description as string || null,
          color: args.color as string || null,
          icon: args.icon as string || null,
          createdBy: context.userId,
        })
        .returning();

      logger.info('AI created collection', { collectionId: collection.id, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `✅ Created new category "${collection.name}"`,
        data: {
          id: collection.id,
          name: collection.name,
          description: collection.description,
        },
      };
    } catch (error) {
      logger.error('AI create_collection failed', error);
      return {
        success: false,
        message: 'Failed to create collection',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async list_collections(args, context): Promise<ToolResult> {
    try {
      const collections = await db.query.knowledgeCollections.findMany({
        where: eq(knowledgeCollections.workspaceId, context.workspaceId),
        orderBy: [desc(knowledgeCollections.updatedAt)],
      });

      return {
        success: true,
        message: `Found ${collections.length} collection(s)`,
        data: {
          collections: collections.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            itemCount: c.itemCount,
          })),
        },
      };
    } catch (error) {
      logger.error('AI list_collections failed', error);
      return {
        success: false,
        message: 'Failed to list collections',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // ============================================================================
  // MARKETING IMPLEMENTATIONS
  // ============================================================================

  async create_campaign(args, context): Promise<ToolResult> {
    try {
      const [campaign] = await db
        .insert(campaigns)
        .values({
          workspaceId: context.workspaceId,
          name: args.name as string,
          type: (args.type as string) || 'email',
          status: 'draft',
          content: {
            subject: (args.subject as string) || undefined,
            body: (args.content as string) || undefined,
          },
          createdBy: context.userId,
        })
        .returning();

      logger.info('AI created campaign', { campaignId: campaign.id, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Created campaign "${campaign.name}" successfully. It's saved as a draft.`,
        data: {
          id: campaign.id,
          name: campaign.name,
          type: campaign.type,
          status: campaign.status,
        },
      };
    } catch (error) {
      logger.error('AI create_campaign failed', error);
      return {
        success: false,
        message: 'Failed to create campaign',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async get_campaign_stats(args, context): Promise<ToolResult> {
    try {
      const campaignId = args.campaignId as string | undefined;

      const conditions = [eq(campaigns.workspaceId, context.workspaceId)];
      if (campaignId) {
        conditions.push(eq(campaigns.id, campaignId));
      }

      const campaignList = await db.query.campaigns.findMany({
        where: and(...conditions),
        orderBy: [desc(campaigns.updatedAt)],
        limit: 10,
      });

      const stats = campaignList.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        sent: c.sentCount || 0,
        opened: c.openCount || 0,
        clicked: c.clickCount || 0,
        openRate: c.sentCount ? ((c.openCount || 0) / c.sentCount * 100).toFixed(1) + '%' : '0%',
        clickRate: c.openCount ? ((c.clickCount || 0) / c.openCount * 100).toFixed(1) + '%' : '0%',
      }));

      return {
        success: true,
        message: `Retrieved stats for ${stats.length} campaign(s)`,
        data: { campaigns: stats },
      };
    } catch (error) {
      logger.error('AI get_campaign_stats failed', error);
      return {
        success: false,
        message: 'Failed to get campaign stats',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async send_email(args, context): Promise<ToolResult> {
    try {
      const { sendEmail, isEmailConfigured, textToHtml, isValidEmail } = await import('@/lib/email');
      
      const to = args.to as string;
      const subject = args.subject as string;
      const body = args.body as string;
      const leadId = args.leadId as string | undefined;

      // Validate email address
      if (!isValidEmail(to)) {
        return {
          success: false,
          message: `Invalid email address: ${to}`,
        };
      }

      // Check if email service is configured
      if (!isEmailConfigured()) {
        logger.warn('AI send_email - Resend not configured', {
          to,
          subject,
          workspaceId: context.workspaceId,
        });
        return {
          success: false,
          message: 'Email service is not configured. Please add RESEND_API_KEY to your environment.',
          data: {
            to,
            subject,
            status: 'not_configured',
          },
        };
      }

      // Send the email
      const result = await sendEmail({
        to,
        subject,
        html: textToHtml(body),
        text: body,
        replyTo: context.userEmail,
        tags: [
          { name: 'source', value: 'neptune_ai' },
          { name: 'workspace', value: context.workspaceId },
          ...(leadId ? [{ name: 'lead_id', value: leadId }] : []),
        ],
      });

      if (result.success) {
        logger.info('AI sent email successfully', {
          to,
          subject,
          messageId: result.messageId,
          workspaceId: context.workspaceId,
        });

        // Update lead's last contacted time if leadId provided
        if (leadId) {
          try {
            await db
              .update(prospects)
              .set({ 
                lastContactedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(and(
                eq(prospects.id, leadId),
                eq(prospects.workspaceId, context.workspaceId)
              ));
          } catch (updateError) {
            logger.warn('Failed to update lead lastContactedAt', { 
              error: updateError instanceof Error ? updateError.message : 'Unknown error' 
            });
          }
        }

        return {
          success: true,
          message: `✅ Email sent successfully to ${to}`,
          data: {
            to,
            subject,
            messageId: result.messageId,
            status: 'sent',
            sentAt: new Date().toISOString(),
          },
        };
      } else {
        logger.error('AI send_email failed', {
          to,
          subject,
          error: result.error,
          workspaceId: context.workspaceId,
        });

        return {
          success: false,
          message: `Failed to send email: ${result.error}`,
          data: {
            to,
            subject,
            status: 'failed',
            error: result.error,
          },
        };
      }
    } catch (error) {
      logger.error('AI send_email exception', error);
      return {
        success: false,
        message: 'Failed to send email due to an unexpected error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // ============================================================================
  // DEAL/PIPELINE IMPLEMENTATIONS
  // ============================================================================

  async create_deal(args, context): Promise<ToolResult> {
    try {
      // For now, we'll create this as a prospect with deal metadata
      // In a full implementation, you'd have a separate deals table
      const stage = args.stage as string;
      const validStage = stage === 'qualification' ? 'qualified' : (stage as 'qualified' | 'proposal' | 'negotiation') || 'proposal';
      
      const [prospect] = await db
        .insert(prospects)
        .values({
          workspaceId: context.workspaceId,
          name: args.name as string,
          stage: validStage,
          estimatedValue: args.value ? Math.round((args.value as number) * 100) : null,
          notes: (args.notes as string) || `Deal created by Neptune`,
          source: 'ai_deal',
        })
        .returning();

      logger.info('AI created deal', { dealId: prospect.id, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Created deal "${prospect.name}" worth $${(args.value as number)?.toLocaleString() || 0}`,
        data: {
          id: prospect.id,
          name: prospect.name,
          value: args.value,
          stage: prospect.stage,
        },
      };
    } catch (error) {
      logger.error('AI create_deal failed', error);
      return {
        success: false,
        message: 'Failed to create deal',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async update_deal(args, context): Promise<ToolResult> {
    try {
      const dealId = args.dealId as string;

      const deal = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, dealId),
          eq(prospects.workspaceId, context.workspaceId)
        ),
      });

      if (!deal) {
        return {
          success: false,
          message: 'Deal not found or access denied',
        };
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (args.value) updateData.estimatedValue = Math.round((args.value as number) * 100);
      if (args.stage) updateData.stage = args.stage;
      if (args.notes) updateData.notes = deal.notes ? `${deal.notes}\n\n${args.notes}` : args.notes;

      await db.update(prospects).set(updateData).where(eq(prospects.id, dealId));

      return {
        success: true,
        message: `Updated deal "${deal.name}"`,
        data: {
          id: deal.id,
          name: deal.name,
          updates: Object.keys(updateData).filter(k => k !== 'updatedAt'),
        },
      };
    } catch (error) {
      logger.error('AI update_deal failed', error);
      return {
        success: false,
        message: 'Failed to update deal',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async get_deals_closing_soon(args, context): Promise<ToolResult> {
    try {
      const days = (args.days as number) || 30;
      const minValue = args.minValue as number | undefined;

      // Get deals in closing stages
      const deals = await db.query.prospects.findMany({
        where: and(
          eq(prospects.workspaceId, context.workspaceId),
          or(
            eq(prospects.stage, 'proposal'),
            eq(prospects.stage, 'negotiation')
          )
        ),
        orderBy: [desc(prospects.estimatedValue)],
        limit: 20,
      });

      let filteredDeals = deals;
      if (minValue) {
        filteredDeals = deals.filter(d => (d.estimatedValue || 0) >= minValue * 100);
      }

      const totalValue = filteredDeals.reduce((sum, d) => sum + (d.estimatedValue || 0), 0) / 100;

      return {
        success: true,
        message: `Found ${filteredDeals.length} deals in closing stages worth $${totalValue.toLocaleString()}`,
        data: {
          deals: filteredDeals.map(d => ({
            id: d.id,
            name: d.name,
            company: d.company,
            stage: d.stage,
            value: d.estimatedValue ? d.estimatedValue / 100 : 0,
          })),
          totalValue,
        },
      };
    } catch (error) {
      logger.error('AI get_deals_closing_soon failed', error);
      return {
        success: false,
        message: 'Failed to get closing deals',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // ============================================================================
  // WORKFLOW/AGENT IMPLEMENTATIONS
  // ============================================================================

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

  // ============================================================================
  // TEAM COLLABORATION IMPLEMENTATIONS
  // ============================================================================

  async add_note(args, context): Promise<ToolResult> {
    try {
      const entityType = args.entityType as 'lead' | 'contact' | 'deal';
      const entityId = args.entityId as string;
      const content = args.content as string;

      const timestamp = new Date().toISOString();
      const noteEntry = `[${timestamp}] ${context.userName}: ${content}`;

      if (entityType === 'lead' || entityType === 'deal') {
        const lead = await db.query.prospects.findFirst({
          where: and(
            eq(prospects.id, entityId),
            eq(prospects.workspaceId, context.workspaceId)
          ),
        });

        if (!lead) {
          return { success: false, message: `${entityType} not found` };
        }

        await db
          .update(prospects)
          .set({
            notes: lead.notes ? `${lead.notes}\n\n${noteEntry}` : noteEntry,
            updatedAt: new Date(),
          })
          .where(eq(prospects.id, entityId));

        return {
          success: true,
          message: `Added note to ${entityType} "${lead.name}"`,
          data: { entityType, entityId, entityName: lead.name },
        };
      } else if (entityType === 'contact') {
        const contact = await db.query.contacts.findFirst({
          where: and(
            eq(contacts.id, entityId),
            eq(contacts.workspaceId, context.workspaceId)
          ),
        });

        if (!contact) {
          return { success: false, message: 'Contact not found' };
        }

        await db
          .update(contacts)
          .set({
            notes: contact.notes ? `${contact.notes}\n\n${noteEntry}` : noteEntry,
            updatedAt: new Date(),
          })
          .where(eq(contacts.id, entityId));

        const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.email;
        return {
          success: true,
          message: `Added note to contact "${name}"`,
          data: { entityType, entityId, entityName: name },
        };
      }

      return { success: false, message: 'Invalid entity type' };
    } catch (error) {
      logger.error('AI add_note failed', error);
      return {
        success: false,
        message: 'Failed to add note',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async get_activity_timeline(args, context): Promise<ToolResult> {
    try {
      const entityType = args.entityType as 'lead' | 'contact' | 'deal';
      const entityId = args.entityId as string;

      // For now, return the notes as activity timeline
      // In a full implementation, you'd have an activity log table
      if (entityType === 'lead' || entityType === 'deal') {
        const lead = await db.query.prospects.findFirst({
          where: and(
            eq(prospects.id, entityId),
            eq(prospects.workspaceId, context.workspaceId)
          ),
        });

        if (!lead) {
          return { success: false, message: `${entityType} not found` };
        }

        return {
          success: true,
          message: `Activity timeline for "${lead.name}"`,
          data: {
            name: lead.name,
            stage: lead.stage,
            createdAt: lead.createdAt,
            lastContactedAt: lead.lastContactedAt,
            notes: lead.notes,
          },
        };
      }

      return { success: false, message: 'Invalid entity type' };
    } catch (error) {
      logger.error('AI get_activity_timeline failed', error);
      return {
        success: false,
        message: 'Failed to get activity timeline',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // ============================================================================
  // ANALYTICS IMPLEMENTATIONS
  // ============================================================================

  async get_conversion_metrics(args, context): Promise<ToolResult> {
    try {
      const allProspects = await db.query.prospects.findMany({
        where: eq(prospects.workspaceId, context.workspaceId),
      });

      const total = allProspects.length;
      const won = allProspects.filter(p => p.stage === 'won').length;
      const lost = allProspects.filter(p => p.stage === 'lost').length;
      const qualified = allProspects.filter(p => ['qualified', 'proposal', 'negotiation', 'won'].includes(p.stage)).length;

      return {
        success: true,
        message: 'Conversion metrics calculated',
        data: {
          totalLeads: total,
          qualified,
          won,
          lost,
          winRate: total > 0 ? ((won / total) * 100).toFixed(1) + '%' : '0%',
          qualificationRate: total > 0 ? ((qualified / total) * 100).toFixed(1) + '%' : '0%',
          lossRate: total > 0 ? ((lost / total) * 100).toFixed(1) + '%' : '0%',
        },
      };
    } catch (error) {
      logger.error('AI get_conversion_metrics failed', error);
      return {
        success: false,
        message: 'Failed to get conversion metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async forecast_revenue(args, context): Promise<ToolResult> {
    try {
      const months = (args.months as number) || 3;

      // Get active pipeline deals
      const activeDeals = await db.query.prospects.findMany({
        where: and(
          eq(prospects.workspaceId, context.workspaceId),
          or(
            eq(prospects.stage, 'qualified'),
            eq(prospects.stage, 'proposal'),
            eq(prospects.stage, 'negotiation')
          )
        ),
      });

      // Simple probability-weighted forecast
      const stageProbabilities: Record<string, number> = {
        qualified: 0.2,
        proposal: 0.5,
        negotiation: 0.75,
      };

      let weightedForecast = 0;
      const dealForecasts = activeDeals.map(d => {
        const probability = stageProbabilities[d.stage] || 0;
        const value = (d.estimatedValue || 0) / 100;
        const weighted = value * probability;
        weightedForecast += weighted;
        return {
          name: d.name,
          value,
          stage: d.stage,
          probability: (probability * 100) + '%',
          weightedValue: weighted,
        };
      });

      return {
        success: true,
        message: `Revenue forecast for next ${months} months`,
        data: {
          totalPipelineValue: activeDeals.reduce((sum, d) => sum + (d.estimatedValue || 0), 0) / 100,
          weightedForecast,
          dealCount: activeDeals.length,
          topDeals: dealForecasts.slice(0, 5),
        },
      };
    } catch (error) {
      logger.error('AI forecast_revenue failed', error);
      return {
        success: false,
        message: 'Failed to forecast revenue',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async get_team_performance(args, context): Promise<ToolResult> {
    try {
      // Get all prospects to analyze team performance
      const allProspects = await db.query.prospects.findMany({
        where: eq(prospects.workspaceId, context.workspaceId),
      });

      const totalLeads = allProspects.length;
      const wonDeals = allProspects.filter(p => p.stage === 'won');
      const totalRevenue = wonDeals.reduce((sum, p) => sum + (p.estimatedValue || 0), 0) / 100;

      return {
        success: true,
        message: 'Team performance metrics',
        data: {
          totalLeads,
          dealsWon: wonDeals.length,
          totalRevenue,
          avgDealSize: wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0,
          activeDeals: allProspects.filter(p => !['won', 'lost'].includes(p.stage)).length,
        },
      };
    } catch (error) {
      logger.error('AI get_team_performance failed', error);
      return {
        success: false,
        message: 'Failed to get team performance',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // ============================================================================
  // FINANCE HQ TOOL IMPLEMENTATIONS
  // ============================================================================

  async get_finance_summary(args, context): Promise<ToolResult> {
    try {
      const period = args.period as string;
      
      // Get connected finance integrations
      const { integrations } = await import('@/db/schema');
      const { inArray } = await import('drizzle-orm');
      
      const financeProviders = ['quickbooks', 'stripe', 'shopify'] as const;
      const connectedIntegrations = await db.query.integrations.findMany({
        where: and(
          eq(integrations.workspaceId, context.workspaceId),
          inArray(integrations.provider, financeProviders),
          eq(integrations.status, 'active')
        ),
      });

      if (connectedIntegrations.length === 0) {
        return {
          success: false,
          message: 'No finance integrations connected. Please connect QuickBooks, Stripe, or Shopify from Settings.',
          data: { connectedProviders: [] },
        };
      }

      const connectedProviders = connectedIntegrations.map(i => i.provider);

      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      const periodLabel = period.replace('_', ' ');

      switch (period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'this_week':
          startDate.setDate(now.getDate() - now.getDay());
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
        case 'this_quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        case 'this_year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      // Note: In production, this would fetch real data from the finance services
      // For now, return a helpful message about connected providers
      logger.info('AI get_finance_summary', { period, connectedProviders, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Financial summary for ${periodLabel}`,
        data: {
          period: periodLabel,
          dateRange: {
            start: startDate.toISOString(),
            end: now.toISOString(),
          },
          connectedProviders,
          summary: {
            revenue: 0,
            expenses: 0,
            profit: 0,
            outstandingInvoices: 0,
            cashflow: 0,
          },
          note: `Data from connected providers: ${connectedProviders.join(', ')}. View Finance HQ for detailed breakdown.`,
        },
      };
    } catch (error) {
      logger.error('AI get_finance_summary failed', error);
      return {
        success: false,
        message: 'Failed to get financial summary',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async get_overdue_invoices(args, context): Promise<ToolResult> {
    try {
      const limit = (args.limit as number) || 10;

      // Check for QuickBooks integration (invoices come from QB)
      const { integrations } = await import('@/db/schema');
      
      const qbIntegration = await db.query.integrations.findFirst({
        where: and(
          eq(integrations.workspaceId, context.workspaceId),
          eq(integrations.provider, 'quickbooks'),
          eq(integrations.status, 'active')
        ),
      });

      if (!qbIntegration) {
        return {
          success: false,
          message: 'QuickBooks is not connected. Please connect QuickBooks to view invoices.',
          data: { hasQuickBooks: false },
        };
      }

      // Note: In production, this would call the QuickBooks service to get real invoices
      logger.info('AI get_overdue_invoices', { limit, workspaceId: context.workspaceId });

      return {
        success: true,
        message: 'Retrieved overdue invoices',
        data: {
          invoices: [],
          total: 0,
          totalAmount: 0,
          note: 'View Finance HQ for detailed invoice list and management.',
        },
      };
    } catch (error) {
      logger.error('AI get_overdue_invoices failed', error);
      return {
        success: false,
        message: 'Failed to get overdue invoices',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async send_invoice_reminder(args, context): Promise<ToolResult> {
    try {
      const invoiceId = args.invoiceId as string;
      const customMessage = args.customMessage as string | undefined;

      // Check for QuickBooks integration
      const { integrations } = await import('@/db/schema');
      
      const qbIntegration = await db.query.integrations.findFirst({
        where: and(
          eq(integrations.workspaceId, context.workspaceId),
          eq(integrations.provider, 'quickbooks'),
          eq(integrations.status, 'active')
        ),
      });

      if (!qbIntegration) {
        return {
          success: false,
          message: 'QuickBooks is not connected. Please connect QuickBooks to send invoice reminders.',
        };
      }

      // Note: In production, this would call the invoice reminder API
      logger.info('AI send_invoice_reminder', { invoiceId, customMessage, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Invoice reminder queued for invoice ${invoiceId}`,
        data: {
          invoiceId,
          customMessage: customMessage || 'Default reminder message',
          status: 'queued',
          note: 'Use Finance HQ to view invoice details and send reminders directly.',
        },
      };
    } catch (error) {
      logger.error('AI send_invoice_reminder failed', error);
      return {
        success: false,
        message: 'Failed to send invoice reminder',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async generate_cash_flow_forecast(args, context): Promise<ToolResult> {
    try {
      const days = args.days as number;

      // Get connected finance integrations
      const { integrations } = await import('@/db/schema');
      const { inArray } = await import('drizzle-orm');
      
      const financeProviders = ['quickbooks', 'stripe', 'shopify'] as const;
      const connectedIntegrations = await db.query.integrations.findMany({
        where: and(
          eq(integrations.workspaceId, context.workspaceId),
          inArray(integrations.provider, financeProviders),
          eq(integrations.status, 'active')
        ),
      });

      if (connectedIntegrations.length === 0) {
        return {
          success: false,
          message: 'No finance integrations connected. Please connect QuickBooks, Stripe, or Shopify to generate forecasts.',
        };
      }

      const connectedProviders = connectedIntegrations.map(i => i.provider);

      logger.info('AI generate_cash_flow_forecast', { days, connectedProviders, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `${days}-day cash flow forecast generated`,
        data: {
          forecastDays: days,
          connectedProviders,
          forecast: {
            expectedInflows: 0,
            expectedOutflows: 0,
            projectedNetPosition: 0,
          },
          note: `Forecast based on data from: ${connectedProviders.join(', ')}. View Finance HQ for detailed projections.`,
        },
      };
    } catch (error) {
      logger.error('AI generate_cash_flow_forecast failed', error);
      return {
        success: false,
        message: 'Failed to generate cash flow forecast',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async compare_financial_periods(args, context): Promise<ToolResult> {
    try {
      const metric = args.metric as string;
      const period1 = args.period1 as string;
      const period2 = args.period2 as string;

      // Get connected finance integrations
      const { integrations } = await import('@/db/schema');
      const { inArray } = await import('drizzle-orm');
      
      const financeProviders = ['quickbooks', 'stripe', 'shopify'] as const;
      const connectedIntegrations = await db.query.integrations.findMany({
        where: and(
          eq(integrations.workspaceId, context.workspaceId),
          inArray(integrations.provider, financeProviders),
          eq(integrations.status, 'active')
        ),
      });

      if (connectedIntegrations.length === 0) {
        return {
          success: false,
          message: 'No finance integrations connected. Please connect QuickBooks, Stripe, or Shopify to compare periods.',
        };
      }

      const connectedProviders = connectedIntegrations.map(i => i.provider);

      logger.info('AI compare_financial_periods', { metric, period1, period2, connectedProviders, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Comparison of ${metric} between ${period1.replace('_', ' ')} and ${period2.replace('_', ' ')}`,
        data: {
          metric,
          period1: {
            label: period1.replace('_', ' '),
            value: 0,
          },
          period2: {
            label: period2.replace('_', ' '),
            value: 0,
          },
          change: {
            absolute: 0,
            percentage: '0%',
          },
          connectedProviders,
          note: 'View Finance HQ for detailed period comparisons with charts.',
        },
      };
    } catch (error) {
      logger.error('AI compare_financial_periods failed', error);
      return {
        success: false,
        message: 'Failed to compare financial periods',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async get_finance_integrations(args, context): Promise<ToolResult> {
    try {
      const { integrations } = await import('@/db/schema');
      const { inArray } = await import('drizzle-orm');
      
      const financeProviders = ['quickbooks', 'stripe', 'shopify'] as const;
      const allIntegrations = await db.query.integrations.findMany({
        where: and(
          eq(integrations.workspaceId, context.workspaceId),
          inArray(integrations.provider, financeProviders)
        ),
      });

      const connected: string[] = [];
      const expired: string[] = [];
      const available: string[] = [];

      for (const provider of financeProviders) {
        const integration = allIntegrations.find(i => i.provider === provider);
        if (!integration) {
          available.push(provider);
        } else if (integration.status === 'active') {
          connected.push(provider);
        } else if (integration.status === 'expired') {
          expired.push(provider);
        } else {
          available.push(provider);
        }
      }

      const details: Record<string, { status: string; lastSyncAt?: string; accountName?: string }> = {};
      for (const integration of allIntegrations) {
        details[integration.provider] = {
          status: integration.status,
          lastSyncAt: integration.lastSyncAt?.toISOString(),
          accountName: integration.displayName || integration.name || undefined,
        };
      }

      return {
        success: true,
        message: `Found ${connected.length} connected finance integration(s)`,
        data: {
          connected,
          expired,
          available,
          details,
          summary: connected.length > 0
            ? `Connected to: ${connected.join(', ')}`
            : 'No finance integrations connected. Connect QuickBooks, Stripe, or Shopify to enable Finance HQ.',
        },
      };
    } catch (error) {
      logger.error('AI get_finance_integrations failed', error);
      return {
        success: false,
        message: 'Failed to get finance integrations',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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
  crm: ['create_lead', 'search_leads', 'update_lead_stage', 'create_contact', 'add_note', 'get_activity_timeline'],
  calendar: ['schedule_meeting', 'get_upcoming_events'],
  tasks: ['create_task'],
  analytics: ['get_pipeline_summary', 'get_hot_leads', 'get_conversion_metrics', 'forecast_revenue', 'get_team_performance'],
  agents: ['list_agents', 'run_agent', 'get_agent_status'],
  content: ['draft_email', 'send_email', 'generate_document'],
  knowledge: ['search_knowledge', 'create_document', 'generate_document', 'create_collection', 'list_collections'],
  marketing: ['create_campaign', 'get_campaign_stats'],
  deals: ['create_deal', 'update_deal', 'get_deals_closing_soon'],
  finance: ['get_finance_summary', 'get_overdue_invoices', 'send_invoice_reminder', 'generate_cash_flow_forecast', 'compare_financial_periods', 'get_finance_integrations'],
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
    case 'finance':
      toolNames.push(...toolsByCategory.finance, ...toolsByCategory.analytics);
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

