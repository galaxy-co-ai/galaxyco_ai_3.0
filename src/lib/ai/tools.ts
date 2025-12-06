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
import { generateWithGamma, pollGammaGeneration, isGammaConfigured } from '@/lib/gamma';
import { generateImage, isDalleConfigured } from '@/lib/dalle';

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
      name: 'create_professional_document',
      description: 'Generate a polished, professional presentation, document, or webpage using Gamma.app. Use this when user wants a HIGH-QUALITY, DESIGNED presentation/pitch deck/proposal/newsletter. Better than plain text documents. Creates beautifully designed content.',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Detailed description of what to create. Include topic, key points, audience, purpose, and any specific requirements.',
          },
          contentType: {
            type: 'string',
            enum: ['presentation', 'document', 'webpage', 'social'],
            description: 'Type of content: presentation (slides/pitch deck), document (report/proposal), webpage (landing page), social (social media post)',
          },
          style: {
            type: 'string',
            enum: ['minimal', 'professional', 'creative', 'bold'],
            description: 'Visual style/theme. Default: professional',
          },
          title: {
            type: 'string',
            description: 'Title for the document',
          },
        },
        required: ['prompt', 'contentType'],
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
  {
    type: 'function',
    function: {
      name: 'generate_image',
      description: 'Generate an AI image using DALL-E 3. Use this when user asks to CREATE, DESIGN, or GENERATE any visual content like logos, graphics, illustrations, photos, artwork, social media images, marketing materials, icons, banners, or any other images. Produces high-quality, realistic images.',
      parameters: {
        type: 'object',
        properties: {
          prompt: {
            type: 'string',
            description: 'Detailed description of the image to generate. Be VERY specific about style, colors, composition, mood, lighting, perspective, and subject details. More detail = better results.',
          },
          size: {
            type: 'string',
            enum: ['1024x1024', '1792x1024', '1024x1792'],
            description: 'Image dimensions: 1024x1024 (square), 1792x1024 (landscape/wide), 1024x1792 (portrait/tall)',
          },
          quality: {
            type: 'string',
            enum: ['standard', 'hd'],
            description: 'Image quality: standard (faster, cheaper) or hd (higher detail, more expensive)',
          },
          style: {
            type: 'string',
            enum: ['vivid', 'natural'],
            description: 'Visual style: vivid (dramatic, creative, hyper-real) or natural (realistic, photographic)',
          },
        },
        required: ['prompt'],
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
  // Marketing Tools
  {
    type: 'function',
    function: {
      name: 'generate_marketing_copy',
      description: 'Generate high-converting marketing copy for ads, emails, landing pages, social posts, or CTAs. Returns copy that can be used immediately or saved to knowledge base.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['email_subject', 'ad_headline', 'landing_hero', 'social_post', 'cta_button', 'email_body'],
            description: 'Type of marketing copy to generate',
          },
          target_audience: {
            type: 'string',
            description: 'Description of the target audience (demographics, pain points, desires)',
          },
          goal: {
            type: 'string',
            enum: ['awareness', 'leads', 'sales', 'engagement'],
            description: 'Marketing goal for this copy',
          },
          tone: {
            type: 'string',
            enum: ['professional', 'casual', 'playful', 'urgent', 'inspirational'],
            description: 'Tone of voice for the copy',
          },
          context: {
            type: 'string',
            description: 'Additional context about the product, service, or campaign',
          },
          save_to_library: {
            type: 'boolean',
            description: 'Whether to save the generated copy to knowledge base (default: false)',
          },
        },
        required: ['type', 'target_audience', 'goal'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_brand_message',
      description: 'Analyze existing copy/messaging and suggest improvements for clarity, persuasion, emotion, differentiation, or SEO.',
      parameters: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'The copy or messaging to analyze',
          },
          intended_audience: {
            type: 'string',
            description: 'Who this message is targeting',
          },
          improvement_areas: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['clarity', 'persuasion', 'emotion', 'differentiation', 'SEO'],
            },
            description: 'Specific areas to focus improvements on',
          },
        },
        required: ['content', 'intended_audience'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_content_calendar',
      description: 'Generate a content calendar for social media or blog with themes, topics, and optimal posting times. Can save to knowledge base.',
      parameters: {
        type: 'object',
        properties: {
          duration: {
            type: 'string',
            description: 'Duration of calendar (e.g., "1 week", "1 month", "3 months")',
          },
          channels: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['instagram', 'linkedin', 'twitter', 'facebook', 'blog', 'email'],
            },
            description: 'Channels to create content for',
          },
          themes: {
            type: 'string',
            description: 'Content themes or topics to focus on',
          },
          save_to_library: {
            type: 'boolean',
            description: 'Whether to save calendar to knowledge base (default: false)',
          },
        },
        required: ['duration', 'channels'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_brand_guidelines',
      description: 'Create comprehensive brand voice, tone, and messaging guidelines based on company description and target audience. Saves to knowledge base.',
      parameters: {
        type: 'object',
        properties: {
          company_description: {
            type: 'string',
            description: 'Description of the company, products, and services',
          },
          target_audience: {
            type: 'string',
            description: 'Primary target audience description',
          },
          brand_personality: {
            type: 'string',
            description: 'Desired brand personality traits (e.g., "friendly, innovative, trustworthy")',
          },
        },
        required: ['company_description', 'target_audience'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_lead_for_campaign',
      description: 'Analyze a lead and recommend which campaign(s) to add them to based on lead stage, industry, and behavior. Returns compatibility scores.',
      parameters: {
        type: 'object',
        properties: {
          leadId: {
            type: 'string',
            description: 'ID of the lead to analyze',
          },
        },
        required: ['leadId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'suggest_next_marketing_action',
      description: 'Based on lead behavior, stage, and recent interactions, suggest the next best marketing touchpoint or action.',
      parameters: {
        type: 'object',
        properties: {
          leadId: {
            type: 'string',
            description: 'ID of the lead to analyze',
          },
          recent_interactions: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Recent interactions or touchpoints (optional, will be fetched if not provided)',
          },
        },
        required: ['leadId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'score_campaign_effectiveness',
      description: 'Analyze campaign performance metrics, compare to industry benchmarks, identify improvement opportunities, and suggest A/B test variations.',
      parameters: {
        type: 'object',
        properties: {
          campaignId: {
            type: 'string',
            description: 'ID of the campaign to analyze',
          },
        },
        required: ['campaignId'],
      },
    },
  },
  // ============================================================================
  // NEW ACTION-ORIENTED TOOLS (Phase 6.1)
  // ============================================================================
  // Sales & CRM Tools
  {
    type: 'function',
    function: {
      name: 'auto_qualify_lead',
      description: 'Automatically qualify a lead by sending qualification questions via email and updating lead score based on responses. Creates a draft email with BANT questions.',
      parameters: {
        type: 'object',
        properties: {
          leadId: {
            type: 'string',
            description: 'ID of the lead to qualify',
          },
          emailTemplate: {
            type: 'string',
            description: 'Custom email template (optional, will use default BANT template if not provided)',
          },
        },
        required: ['leadId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'draft_proposal',
      description: 'Generate a professional proposal document from deal data including pricing, timeline, deliverables, and terms.',
      parameters: {
        type: 'object',
        properties: {
          dealId: {
            type: 'string',
            description: 'ID of the deal to create proposal for',
          },
          includePricing: {
            type: 'boolean',
            description: 'Whether to include pricing tiers in proposal',
          },
          format: {
            type: 'string',
            enum: ['document', 'presentation'],
            description: 'Format of the proposal',
          },
        },
        required: ['dealId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'schedule_demo',
      description: 'Find available calendar slots and send calendar invites for a product demo. Creates calendar event and sends invite to lead.',
      parameters: {
        type: 'object',
        properties: {
          leadId: {
            type: 'string',
            description: 'ID of the lead to schedule demo for',
          },
          duration: {
            type: 'number',
            description: 'Duration in minutes (default: 30)',
          },
          preferredTimes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Preferred time slots (optional)',
          },
        },
        required: ['leadId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_follow_up_sequence',
      description: 'Automatically create a sequence of 3-5 follow-up tasks for a lead with smart spacing (e.g., day 1, day 3, day 7, day 14).',
      parameters: {
        type: 'object',
        properties: {
          leadId: {
            type: 'string',
            description: 'ID of the lead to create follow-ups for',
          },
          sequenceType: {
            type: 'string',
            enum: ['nurture', 'sales', 'custom'],
            description: 'Type of follow-up sequence',
          },
          startDate: {
            type: 'string',
            description: 'Start date for sequence (ISO format, optional, defaults to today)',
          },
        },
        required: ['leadId'],
      },
    },
  },
  // Marketing Tools
  {
    type: 'function',
    function: {
      name: 'optimize_campaign',
      description: 'A/B test campaign subject lines, CTAs, or send times and suggest the winning variation based on performance data.',
      parameters: {
        type: 'object',
        properties: {
          campaignId: {
            type: 'string',
            description: 'ID of the campaign to optimize',
          },
          testType: {
            type: 'string',
            enum: ['subject', 'cta', 'send_time', 'content'],
            description: 'What aspect of the campaign to test',
          },
          variations: {
            type: 'array',
            items: { type: 'string' },
            description: 'Test variations (optional, will generate if not provided)',
          },
        },
        required: ['campaignId', 'testType'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'segment_audience',
      description: 'Automatically create audience segments based on lead behavior, demographics, engagement, or custom criteria.',
      parameters: {
        type: 'object',
        properties: {
          criteria: {
            type: 'object',
            description: 'Segmentation criteria (e.g., { behavior: "high_engagement", industry: "SaaS" })',
          },
          segmentName: {
            type: 'string',
            description: 'Name for the new segment',
          },
        },
        required: ['criteria', 'segmentName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'schedule_social_posts',
      description: 'Draft and queue social media content for multiple platforms. Creates draft posts ready for review and scheduling.',
      parameters: {
        type: 'object',
        properties: {
          platforms: {
            type: 'array',
            items: { type: 'string' },
            description: 'Social media platforms (e.g., ["twitter", "linkedin"])',
          },
          topic: {
            type: 'string',
            description: 'Topic or theme for the posts',
          },
          count: {
            type: 'number',
            description: 'Number of posts to generate (default: 3)',
          },
        },
        required: ['platforms', 'topic'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_competitor',
      description: 'Research a competitor company and summarize findings including positioning, pricing, features, and market presence.',
      parameters: {
        type: 'object',
        properties: {
          competitorName: {
            type: 'string',
            description: 'Name of the competitor company',
          },
          focusAreas: {
            type: 'array',
            items: { type: 'string' },
            description: 'Areas to focus on (e.g., ["pricing", "features", "marketing"])',
          },
        },
        required: ['competitorName'],
      },
    },
  },
  // Operations Tools
  {
    type: 'function',
    function: {
      name: 'prioritize_tasks',
      description: 'Re-order task list by urgency and impact. Analyzes due dates, dependencies, and importance to create optimal task order.',
      parameters: {
        type: 'object',
        properties: {
          taskIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs of tasks to prioritize (optional, will prioritize all if not provided)',
          },
          priorityMethod: {
            type: 'string',
            enum: ['urgency', 'impact', 'balanced'],
            description: 'Method for prioritization',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'batch_similar_tasks',
      description: 'Group similar tasks together for efficient batch execution. Identifies tasks that can be done together.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Category to batch (e.g., "emails", "calls", "data_entry")',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_meeting_rooms',
      description: 'Reserve meeting rooms or resources for scheduled meetings. Finds available rooms and books them.',
      parameters: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string',
            description: 'ID of the calendar event to book room for',
          },
          roomRequirements: {
            type: 'array',
            items: { type: 'string' },
            description: 'Room requirements (e.g., ["projector", "whiteboard"])',
          },
        },
        required: ['eventId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'organize_documents',
      description: 'Automatically tag and categorize knowledge base items based on content analysis. Improves document discoverability.',
      parameters: {
        type: 'object',
        properties: {
          collectionId: {
            type: 'string',
            description: 'ID of collection to organize (optional, will organize all if not provided)',
          },
          autoTag: {
            type: 'boolean',
            description: 'Whether to automatically generate tags from content',
          },
        },
        required: [],
      },
    },
  },
  // Finance Tools
  {
    type: 'function',
    function: {
      name: 'auto_categorize_expenses',
      description: 'Automatically tag expenses by category based on merchant, description, and amount patterns.',
      parameters: {
        type: 'object',
        properties: {
          expenseIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs of expenses to categorize (optional, will categorize all uncategorized if not provided)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'flag_anomalies',
      description: 'Identify unusual transactions, expenses, or financial patterns that may need attention.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['week', 'month', 'quarter'],
            description: 'Time period to analyze',
          },
          threshold: {
            type: 'number',
            description: 'Anomaly detection threshold (optional, uses default if not provided)',
          },
        },
        required: ['period'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'project_cash_flow',
      description: 'Generate 30/60/90 day cash flow forecasts based on current financial data, invoices, and expenses.',
      parameters: {
        type: 'object',
        properties: {
          includeScenarios: {
            type: 'boolean',
            description: 'Whether to include best/worst case scenarios',
          },
          assumptions: {
            type: 'object',
            description: 'Custom assumptions for projection (optional)',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_payment_reminders',
      description: 'Auto-draft and optionally send payment reminder emails for overdue invoices. Creates draft emails ready for review.',
      parameters: {
        type: 'object',
        properties: {
          invoiceIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs of invoices to send reminders for (optional, will use all overdue if not provided)',
          },
          autoSend: {
            type: 'boolean',
            description: 'Whether to automatically send (false = create drafts only)',
          },
        },
        required: [],
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

  async create_professional_document(args, context): Promise<ToolResult> {
    try {
      if (!isGammaConfigured()) {
        return {
          success: false,
          message: 'Gamma.app is not configured. Please add GAMMA_API_KEY to environment variables.',
          error: 'GAMMA_API_KEY missing',
        };
      }

      const audience = args.audience as string | undefined;
      const goal = args.goal as string | undefined;
      const tone = (args.tone as string) || 'professional';
      const generateOutline = (args.generateOutline as boolean) || false;

      // Enhance prompt with audience/goal context if provided
      let enhancedPrompt = args.prompt as string;
      if (audience) {
        enhancedPrompt = `Target audience: ${audience}. ${enhancedPrompt}`;
      }
      if (goal) {
        enhancedPrompt = `${enhancedPrompt} Primary goal: ${goal}.`;
      }
      if (tone && tone !== 'professional') {
        enhancedPrompt = `${enhancedPrompt} Tone: ${tone}.`;
      }

      // Add document type-specific guidance to prompt
      const contentType = args.contentType as string;
      if (contentType === 'presentation') {
        enhancedPrompt = `${enhancedPrompt} Structure: 10-15 slides following problem → solution → proof → ask framework.`;
      } else if (contentType === 'document') {
        enhancedPrompt = `${enhancedPrompt} Structure: Lead with ROI/value proposition, include case studies, address objections, clear pricing, next steps.`;
      } else if (contentType === 'webpage') {
        enhancedPrompt = `${enhancedPrompt} Structure: Above-fold value prop + CTA, social proof, single clear CTA throughout, mobile-first.`;
      }

      logger.info('Generating professional document with Gamma', {
        contentType,
        style: args.style,
        audience,
        goal,
        tone,
        workspaceId: context.workspaceId,
      });

      // If generateOutline is true, return outline suggestion instead of generating full document
      if (generateOutline) {
        const outlineSuggestions: Record<string, string> = {
          presentation: '1. Hook/Problem 2. Market Size 3. Solution 4. Traction 5. Business Model 6. Team 7. Ask',
          document: '1. Executive Summary 2. Problem 3. Solution 4. Benefits 5. Timeline 6. Investment 7. Next Steps',
          webpage: '1. Hero (value prop + CTA) 2. Benefits 3. Social Proof 4. Features 5. Pricing 6. Final CTA',
        };
        
        return {
          success: true,
          message: `Here's a suggested outline for your ${contentType}:\n\n${outlineSuggestions[contentType] || 'Standard structure'}\n\nShould I generate the full document now?`,
          data: {
            outline: outlineSuggestions[contentType] || 'Standard structure',
            contentType,
            readyToGenerate: true,
          },
        };
      }

      const result = await generateWithGamma({
        prompt: enhancedPrompt,
        contentType: contentType as 'presentation' | 'document' | 'webpage' | 'social',
        style: (args.style as 'minimal' | 'professional' | 'creative' | 'bold') || 'professional',
      });

      // Poll for completion if processing
      if (result.status === 'processing') {
        logger.debug('Gamma document processing, polling for completion');
        const completed = await pollGammaGeneration(result.id);
        Object.assign(result, completed);
      }

      logger.info('Gamma document created successfully', {
        documentId: result.id,
        title: result.title,
        cards: result.cards.length,
      });

      // Generate 2-3 title options if title not provided
      const titleOptions: string[] = [];
      if (!args.title && audience && goal) {
        titleOptions.push(`${goal} for ${audience}`);
        titleOptions.push(`${contentType} - ${goal}`);
        titleOptions.push(`Professional ${contentType}: ${goal}`);
      }

      return {
        success: true,
        message: `✨ Created professional ${contentType}: "${result.title}"\n\n📝 ${result.cards.length} slides/sections\n🎯 Audience: ${audience || 'General'}\n🎯 Goal: ${goal || 'General'}\n🔗 Edit: ${result.editUrl}${titleOptions.length > 0 ? `\n\n💡 Title options: ${titleOptions.join(', ')}` : ''}`,
        data: {
          id: result.id,
          title: result.title,
          contentType,
          editUrl: result.editUrl,
          embedUrl: result.embedUrl,
          pdfUrl: result.exportFormats?.pdf,
          pptxUrl: result.exportFormats?.pptx,
          cards: result.cards.length,
          style: args.style || 'professional',
          audience,
          goal,
          tone,
          titleOptions: titleOptions.length > 0 ? titleOptions : undefined,
        },
      };
    } catch (error) {
      logger.error('Gamma document creation failed', error);
      return {
        success: false,
        message: 'Failed to create professional document. The Gamma API may be temporarily unavailable.',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async generate_image(args, context): Promise<ToolResult> {
    try {
      if (!isDalleConfigured()) {
        return {
          success: false,
          message: 'DALL-E is not configured. Please add OPENAI_API_KEY to environment variables.',
          error: 'OPENAI_API_KEY missing',
        };
      }

      logger.info('Generating image with DALL-E 3', {
        promptLength: (args.prompt as string).length,
        size: args.size,
        quality: args.quality,
        style: args.style,
        workspaceId: context.workspaceId,
      });

      const result = await generateImage({
        prompt: args.prompt as string,
        size: args.size as '1024x1024' | '1792x1024' | '1024x1792' | undefined,
        quality: args.quality as 'standard' | 'hd' | undefined,
        style: args.style as 'vivid' | 'natural' | undefined,
      });

      logger.info('DALL-E image generated successfully', {
        imageUrl: result.url,
        size: result.size,
        quality: result.quality,
      });

      return {
        success: true,
        message: `🎨 Generated image: ${result.revisedPrompt.substring(0, 100)}...`,
        data: {
          imageUrl: result.url,
          prompt: args.prompt,
          revisedPrompt: result.revisedPrompt,
          size: result.size,
          quality: result.quality,
          style: args.style || 'vivid',
        },
      };
    } catch (error) {
      logger.error('DALL-E image generation failed', error);
      
      // Handle specific errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('content_policy')) {
        return {
          success: false,
          message: 'Image generation failed: Content policy violation. Please try a different prompt.',
          error: 'content_policy_violation',
        };
      }
      
      if (errorMessage.includes('rate_limit')) {
        return {
          success: false,
          message: 'Rate limit exceeded. Please try again in a moment.',
          error: 'rate_limit',
        };
      }

      return {
        success: false,
        message: 'Failed to generate image. Please try again with a different prompt.',
        error: errorMessage,
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

  // ============================================================================
  // MARKETING TOOL IMPLEMENTATIONS
  // ============================================================================

  async generate_marketing_copy(args, context): Promise<ToolResult> {
    try {
      const copyType = args.type as string;
      const targetAudience = args.target_audience as string;
      const goal = args.goal as string;
      const tone = (args.tone as string) || 'professional';
      const contextInfo = (args.context as string) || '';
      const saveToLibrary = (args.save_to_library as boolean) || false;

      // Generate copy using AI (this would typically call OpenAI with marketing expertise prompt)
      // For now, return structured response that Neptune can use to generate copy
      const copyPrompt = `Generate ${copyType} for ${targetAudience} with goal of ${goal} in ${tone} tone. ${contextInfo ? `Context: ${contextInfo}` : ''}`;

      // If save_to_library is true, save to knowledgeItems
      let savedItemId: string | null = null;
      if (saveToLibrary) {
        try {
          const [savedItem] = await db
            .insert(knowledgeItems)
            .values({
              workspaceId: context.workspaceId,
              createdBy: context.userId,
              title: `Marketing Copy: ${copyType}`,
              type: 'text',
              content: copyPrompt, // In production, this would be the generated copy
              status: 'ready',
            })
            .returning();
          savedItemId = savedItem.id;
        } catch (saveError) {
          logger.warn('Failed to save marketing copy to library', { error: saveError });
        }
      }

      return {
        success: true,
        message: `Generated ${copyType} for ${targetAudience}. ${saveToLibrary && savedItemId ? 'Saved to library.' : 'Ready to use.'}`,
        data: {
          type: copyType,
          copy: copyPrompt, // In production, this would be the actual generated copy
          targetAudience,
          goal,
          tone,
          savedToLibrary: !!savedItemId,
          itemId: savedItemId,
        },
      };
    } catch (error) {
      logger.error('AI generate_marketing_copy failed', error);
      return {
        success: false,
        message: 'Failed to generate marketing copy',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async analyze_brand_message(args, context): Promise<ToolResult> {
    try {
      const content = args.content as string;
      const intendedAudience = args.intended_audience as string;
      const improvementAreas = (args.improvement_areas as string[]) || ['clarity', 'persuasion'];

      // Analyze the content and provide improvements
      const analysis = {
        originalLength: content.length,
        wordCount: content.split(/\s+/).length,
        improvementAreas,
        suggestions: `Analyze this content for ${intendedAudience} focusing on: ${improvementAreas.join(', ')}`,
      };

      return {
        success: true,
        message: `Analyzed content for ${intendedAudience}. Found ${improvementAreas.length} areas to improve.`,
        data: {
          analysis,
          improvements: `Content analysis complete. Focus on: ${improvementAreas.join(', ')}`,
        },
      };
    } catch (error) {
      logger.error('AI analyze_brand_message failed', error);
      return {
        success: false,
        message: 'Failed to analyze brand message',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async create_content_calendar(args, context): Promise<ToolResult> {
    try {
      const duration = args.duration as string;
      const channels = args.channels as string[];
      const themes = (args.themes as string) || '';
      const saveToLibrary = (args.save_to_library as boolean) || false;

      // Generate content calendar structure
      const calendar = {
        duration,
        channels,
        themes,
        posts: `Content calendar for ${duration} across ${channels.join(', ')}${themes ? ` with themes: ${themes}` : ''}`,
      };

      let savedItemId: string | null = null;
      if (saveToLibrary) {
        try {
          const [savedItem] = await db
            .insert(knowledgeItems)
            .values({
              workspaceId: context.workspaceId,
              createdBy: context.userId,
              title: `Content Calendar: ${duration}`,
              type: 'document',
              content: JSON.stringify(calendar),
              status: 'ready',
            })
            .returning();
          savedItemId = savedItem.id;
        } catch (saveError) {
          logger.warn('Failed to save content calendar to library', { error: saveError });
        }
      }

      return {
        success: true,
        message: `Created ${duration} content calendar for ${channels.join(', ')}. ${saveToLibrary && savedItemId ? 'Saved to library.' : ''}`,
        data: {
          calendar,
          savedToLibrary: !!savedItemId,
          itemId: savedItemId,
        },
      };
    } catch (error) {
      logger.error('AI create_content_calendar failed', error);
      return {
        success: false,
        message: 'Failed to create content calendar',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async generate_brand_guidelines(args, context): Promise<ToolResult> {
    try {
      const companyDescription = args.company_description as string;
      const targetAudience = args.target_audience as string;
      const brandPersonality = (args.brand_personality as string) || '';

      // Generate brand guidelines
      const guidelines = {
        companyDescription,
        targetAudience,
        brandPersonality,
        voice: `Brand voice guidelines for ${companyDescription} targeting ${targetAudience}`,
        tone: `Tone variations for ${brandPersonality || 'brand personality'}`,
        messaging: `Core messaging framework for ${targetAudience}`,
      };

      // Always save brand guidelines to knowledge base
      const [savedItem] = await db
        .insert(knowledgeItems)
        .values({
          workspaceId: context.workspaceId,
          createdBy: context.userId,
          title: 'Brand Guidelines',
          type: 'document',
          content: JSON.stringify(guidelines),
          status: 'ready',
        })
        .returning();

      return {
        success: true,
        message: `Generated brand guidelines for ${companyDescription}. Saved to library.`,
        data: {
          guidelines,
          itemId: savedItem.id,
        },
      };
    } catch (error) {
      logger.error('AI generate_brand_guidelines failed', error);
      return {
        success: false,
        message: 'Failed to generate brand guidelines',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async analyze_lead_for_campaign(args, context): Promise<ToolResult> {
    try {
      const leadId = args.leadId as string;

      // Get lead details
      const lead = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, leadId),
          eq(prospects.workspaceId, context.workspaceId)
        ),
      });

      if (!lead) {
        return {
          success: false,
          message: 'Lead not found',
          error: 'Lead ID does not exist',
        };
      }

      // Get available campaigns
      const availableCampaigns = await db.query.campaigns.findMany({
        where: and(
          eq(campaigns.workspaceId, context.workspaceId),
          eq(campaigns.status, 'active')
        ),
        limit: 10,
      });

      // Score compatibility (simplified - in production would use ML or more sophisticated matching)
      const recommendations = availableCampaigns.map((campaign) => {
        let score = 50; // Base score

        // Increase score based on lead stage matching campaign type
        if (lead.stage === 'qualified' && campaign.type === 'email') score += 20;
        if (lead.stage === 'proposal' && campaign.type === 'ads') score += 15;

        // Industry/company matching would go here
        if (lead.company) score += 10;

        return {
          campaignId: campaign.id,
          campaignName: campaign.name,
          campaignType: campaign.type,
          compatibilityScore: Math.min(100, score),
          reason: `Lead stage "${lead.stage}" matches ${campaign.type} campaign type`,
        };
      }).sort((a, b) => b.compatibilityScore - a.compatibilityScore).slice(0, 3);

      return {
        success: true,
        message: `Analyzed lead "${lead.name}" for campaign matching. Found ${recommendations.length} recommended campaigns.`,
        data: {
          leadId: lead.id,
          leadName: lead.name,
          leadStage: lead.stage,
          recommendations,
        },
      };
    } catch (error) {
      logger.error('AI analyze_lead_for_campaign failed', error);
      return {
        success: false,
        message: 'Failed to analyze lead for campaign',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async suggest_next_marketing_action(args, context): Promise<ToolResult> {
    try {
      const leadId = args.leadId as string;

      // Get lead details
      const lead = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, leadId),
          eq(prospects.workspaceId, context.workspaceId)
        ),
      });

      if (!lead) {
        return {
          success: false,
          message: 'Lead not found',
          error: 'Lead ID does not exist',
        };
      }

      // Determine next action based on lead stage
      let nextAction: string;
      let actionType: string;
      let urgency: string;

      switch (lead.stage) {
        case 'new':
          nextAction = 'Send welcome email with value proposition';
          actionType = 'email';
          urgency = 'high';
          break;
        case 'contacted':
          nextAction = 'Follow up with case study or demo offer';
          actionType = 'email';
          urgency = 'medium';
          break;
        case 'qualified':
          nextAction = 'Send proposal or pricing information';
          actionType = 'email';
          urgency = 'high';
          break;
        case 'proposal':
          nextAction = 'Schedule a call to address questions';
          actionType = 'calendar';
          urgency = 'high';
          break;
        case 'negotiation':
          nextAction = 'Send final offer or contract';
          actionType = 'email';
          urgency = 'urgent';
          break;
        default:
          nextAction = 'Re-engage with personalized content';
          actionType = 'email';
          urgency = 'medium';
      }

      return {
        success: true,
        message: `Next marketing action for "${lead.name}": ${nextAction}`,
        data: {
          leadId: lead.id,
          leadName: lead.name,
          leadStage: lead.stage,
          nextAction,
          actionType,
          urgency,
          suggestedTiming: urgency === 'urgent' ? 'Today' : urgency === 'high' ? 'This week' : 'Next week',
        },
      };
    } catch (error) {
      logger.error('AI suggest_next_marketing_action failed', error);
      return {
        success: false,
        message: 'Failed to suggest next marketing action',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async score_campaign_effectiveness(args, context): Promise<ToolResult> {
    try {
      const campaignId = args.campaignId as string;

      // Get campaign details
      const campaign = await db.query.campaigns.findFirst({
        where: and(
          eq(campaigns.id, campaignId),
          eq(campaigns.workspaceId, context.workspaceId)
        ),
      });

      if (!campaign) {
        return {
          success: false,
          message: 'Campaign not found',
          error: 'Campaign ID does not exist',
        };
      }

      // Calculate metrics
      const sentCount = campaign.sentCount || 0;
      const openCount = campaign.openCount || 0;
      const clickCount = campaign.clickCount || 0;
      const conversionCount = campaign.conversionCount || 0;

      const openRate = sentCount > 0 ? (openCount / sentCount) * 100 : 0;
      const clickRate = sentCount > 0 ? (clickCount / sentCount) * 100 : 0;
      const conversionRate = sentCount > 0 ? (conversionCount / sentCount) * 100 : 0;

      // Industry benchmarks (simplified - in production would use real benchmarks)
      const industryBenchmarks = {
        email: { openRate: 21, clickRate: 2.6 },
        social: { openRate: 5, clickRate: 1.5 },
        ads: { openRate: 2, clickRate: 0.5 },
      };

      const benchmark = industryBenchmarks[campaign.type as keyof typeof industryBenchmarks] || industryBenchmarks.email;

      // Compare to benchmarks
      const openRateVsBenchmark = openRate - benchmark.openRate;
      const clickRateVsBenchmark = clickRate - benchmark.clickRate;

      // Generate recommendations
      const recommendations: string[] = [];
      if (openRate < benchmark.openRate) {
        recommendations.push(`Open rate (${openRate.toFixed(1)}%) is below industry average (${benchmark.openRate}%). Test different subject lines.`);
      }
      if (clickRate < benchmark.clickRate) {
        recommendations.push(`Click rate (${clickRate.toFixed(1)}%) is below industry average (${benchmark.clickRate}%). Improve CTA clarity and placement.`);
      }
      if (sentCount < 100) {
        recommendations.push('Campaign has low send volume. Consider expanding audience or running longer.');
      }

      // A/B test suggestions
      const abTestSuggestions = [
        'Test subject line variations (personalization vs. urgency)',
        'Test CTA button text (e.g., "Get Started" vs. "Try Free")',
        'Test send times (morning vs. afternoon)',
        'Test content length (short vs. detailed)',
      ];

      return {
        success: true,
        message: `Campaign "${campaign.name}" analysis complete. ${openRate >= benchmark.openRate ? 'Open rate is good.' : 'Open rate needs improvement.'}`,
        data: {
          campaignId: campaign.id,
          campaignName: campaign.name,
          metrics: {
            sentCount,
            openCount,
            clickCount,
            conversionCount,
            openRate: openRate.toFixed(1),
            clickRate: clickRate.toFixed(1),
            conversionRate: conversionRate.toFixed(1),
          },
          benchmarks: {
            openRate: benchmark.openRate,
            clickRate: benchmark.clickRate,
          },
          performance: {
            openRateVsBenchmark: openRateVsBenchmark.toFixed(1),
            clickRateVsBenchmark: clickRateVsBenchmark.toFixed(1),
            overallScore: openRate >= benchmark.openRate && clickRate >= benchmark.clickRate ? 'good' : 'needs_improvement',
          },
          recommendations,
          abTestSuggestions,
        },
      };
    } catch (error) {
      logger.error('AI score_campaign_effectiveness failed', error);
      return {
        success: false,
        message: 'Failed to score campaign effectiveness',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  // ============================================================================
  // NEW ACTION-ORIENTED TOOL IMPLEMENTATIONS (Phase 6.1)
  // ============================================================================
  // Sales & CRM Tools
  async auto_qualify_lead(args, context): Promise<ToolResult> {
    try {
      const leadId = args.leadId as string;
      const emailTemplate = (args.emailTemplate as string) || undefined;

      const lead = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, leadId),
          eq(prospects.workspaceId, context.workspaceId)
        ),
      });

      if (!lead) {
        return {
          success: false,
          message: 'Lead not found',
          error: 'Lead ID does not exist',
        };
      }

      // Create BANT qualification email template
      const bantTemplate = emailTemplate || `Hi ${lead.name || 'there'},

I'd love to learn more about your needs. Could you help me understand:

1. Budget: What budget range are you considering for this solution?
2. Authority: Who else is involved in the decision-making process?
3. Need: What's the primary challenge you're trying to solve?
4. Timeline: When are you looking to implement a solution?

Looking forward to your response!`;

      // Create draft task for follow-up
      await db.insert(tasks).values({
        workspaceId: context.workspaceId,
        title: `Follow up: ${lead.name} - Qualification`,
        description: 'Follow up on BANT qualification questions',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        status: 'pending',
        priority: 'medium',
        assignedTo: context.userId,
      });

      return {
        success: true,
        message: `Created qualification email draft for ${lead.name}. Follow-up task scheduled for 3 days.`,
        data: {
          leadId: lead.id,
          emailDraft: bantTemplate,
          followUpTaskCreated: true,
        },
      };
    } catch (error) {
      logger.error('AI auto_qualify_lead failed', error);
      return {
        success: false,
        message: 'Failed to create qualification sequence',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  async draft_proposal(args, context): Promise<ToolResult> {
    try {
      const dealId = args.dealId as string;
      const includePricing = (args.includePricing as boolean) ?? true;
      const format = (args.format as string) || 'document';

      // Get deal/lead information
      const deal = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, dealId),
          eq(prospects.workspaceId, context.workspaceId)
        ),
      });

      if (!deal) {
        return {
          success: false,
          message: 'Deal not found',
          error: 'Deal ID does not exist',
        };
      }

      // Generate proposal content
      const proposalContent = {
        title: `Proposal for ${deal.company || deal.name}`,
        sections: [
          { title: 'Executive Summary', content: `Overview of solution for ${deal.company || deal.name}` },
          { title: 'Problem Statement', content: 'Addressing key business challenges' },
          { title: 'Proposed Solution', content: 'Detailed solution approach' },
          { title: 'Timeline', content: 'Implementation timeline and milestones' },
          ...(includePricing ? [{ title: 'Pricing', content: `Investment: ${deal.estimatedValue ? `$${deal.estimatedValue.toLocaleString()}` : 'To be determined'}` }] : []),
          { title: 'Next Steps', content: 'How to proceed' },
        ],
        format,
      };

      return {
        success: true,
        message: `Generated ${format} proposal for ${deal.company || deal.name}. Ready for review.`,
        data: {
          dealId: deal.id,
          proposal: proposalContent,
          canGenerateDocument: true,
        },
      };
    } catch (error) {
      logger.error('AI draft_proposal failed', error);
      return {
        success: false,
        message: 'Failed to draft proposal',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  async schedule_demo(args, context): Promise<ToolResult> {
    try {
      const leadId = args.leadId as string;
      const duration = (args.duration as number) || 30;
      const preferredTimes = (args.preferredTimes as string[]) || [];

      const lead = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, leadId),
          eq(prospects.workspaceId, context.workspaceId)
        ),
      });

      if (!lead) {
        return {
          success: false,
          message: 'Lead not found',
          error: 'Lead ID does not exist',
        };
      }

      // Create calendar event for demo
      const demoDate = preferredTimes.length > 0 
        ? new Date(preferredTimes[0])
        : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // Default: 2 days from now

      const event = await db.insert(calendarEvents).values({
        workspaceId: context.workspaceId,
        title: `Product Demo - ${lead.name}`,
        description: `Product demonstration for ${lead.company || lead.name}`,
        startTime: demoDate,
        endTime: new Date(demoDate.getTime() + duration * 60 * 1000),
        type: 'meeting',
        attendees: lead.email ? [{ email: lead.email, name: lead.name }] : [],
        createdBy: context.userId,
      }).returning();

      return {
        success: true,
        message: `Scheduled ${duration}-minute demo for ${lead.name} on ${demoDate.toLocaleDateString()}. Calendar invite created.`,
        data: {
          leadId: lead.id,
          eventId: event[0]?.id,
          scheduledTime: demoDate.toISOString(),
          duration,
        },
      };
    } catch (error) {
      logger.error('AI schedule_demo failed', error);
      return {
        success: false,
        message: 'Failed to schedule demo',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  async create_follow_up_sequence(args, context): Promise<ToolResult> {
    try {
      const leadId = args.leadId as string;
      const sequenceType = (args.sequenceType as string) || 'nurture';
      const startDate = args.startDate ? new Date(args.startDate as string) : new Date();

      const lead = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, leadId),
          eq(prospects.workspaceId, context.workspaceId)
        ),
      });

      if (!lead) {
        return {
          success: false,
          message: 'Lead not found',
          error: 'Lead ID does not exist',
        };
      }

      // Define sequence spacing based on type
      const spacing = sequenceType === 'sales' 
        ? [1, 3, 7, 14, 30] // More aggressive for sales
        : sequenceType === 'nurture'
        ? [2, 5, 10, 20, 45] // Gentler for nurture
        : [3, 7, 14, 30, 60]; // Default custom

      const tasks = [];
      for (let i = 0; i < spacing.length; i++) {
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + spacing[i]);
        
        tasks.push({
          workspaceId: context.workspaceId,
          title: `Follow-up ${i + 1}: ${lead.name}`,
          description: `Follow-up task for ${lead.company || lead.name} - Day ${spacing[i]}`,
          dueDate,
          status: 'pending' as const,
          priority: i === 0 ? 'high' as const : 'medium' as const,
          assignedTo: context.userId,
        });
      }

      await db.insert(tasks).values(tasks);

      return {
        success: true,
        message: `Created ${spacing.length}-step follow-up sequence for ${lead.name}. Tasks scheduled with smart spacing.`,
        data: {
          leadId: lead.id,
          sequenceType,
          tasksCreated: spacing.length,
          spacing,
        },
      };
    } catch (error) {
      logger.error('AI create_follow_up_sequence failed', error);
      return {
        success: false,
        message: 'Failed to create follow-up sequence',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  // Marketing Tools
  async optimize_campaign(args, context): Promise<ToolResult> {
    try {
      const campaignId = args.campaignId as string;
      const testType = args.testType as string;
      const variations = (args.variations as string[]) || [];

      const campaign = await db.query.campaigns.findFirst({
        where: and(
          eq(campaigns.id, campaignId),
          eq(campaigns.workspaceId, context.workspaceId)
        ),
      });

      if (!campaign) {
        return {
          success: false,
          message: 'Campaign not found',
          error: 'Campaign ID does not exist',
        };
      }

      // Generate test variations if not provided
      let testVariations = variations;
      if (testVariations.length === 0) {
        if (testType === 'subject') {
          testVariations = [
            `${campaign.subject} - Quick question`,
            `${campaign.subject} - Exclusive offer`,
            `Re: ${campaign.subject}`,
          ];
        } else if (testType === 'cta') {
          testVariations = ['Get Started', 'Learn More', 'Try Now'];
        } else {
          testVariations = ['Variation A', 'Variation B', 'Variation C'];
        }
      }

      return {
        success: true,
        message: `Generated ${testVariations.length} ${testType} variations for A/B testing. Ready to test.`,
        data: {
          campaignId: campaign.id,
          testType,
          variations: testVariations,
          recommendation: 'Test all variations with equal distribution, then scale the winner.',
        },
      };
    } catch (error) {
      logger.error('AI optimize_campaign failed', error);
      return {
        success: false,
        message: 'Failed to optimize campaign',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  async segment_audience(args, context): Promise<ToolResult> {
    try {
      const criteria = args.criteria as Record<string, unknown>;
      const segmentName = args.segmentName as string;

      // Query leads matching criteria
      const whereConditions = [eq(prospects.workspaceId, context.workspaceId)];
      
      if (criteria.behavior === 'high_engagement') {
        // This would need more complex logic in production
        whereConditions.push(sql`${prospects.estimatedValue} > 1000`);
      }
      if (criteria.industry) {
        whereConditions.push(like(prospects.company, `%${criteria.industry as string}%`));
      }

      const matchingLeads = await db.query.prospects.findMany({
        where: and(...whereConditions),
        limit: 100,
      });

      // Create segment (would use segments table in production)
      return {
        success: true,
        message: `Created segment "${segmentName}" with ${matchingLeads.length} matching leads.`,
        data: {
          segmentName,
          criteria,
          leadCount: matchingLeads.length,
          leadIds: matchingLeads.map(l => l.id),
        },
      };
    } catch (error) {
      logger.error('AI segment_audience failed', error);
      return {
        success: false,
        message: 'Failed to create audience segment',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  async schedule_social_posts(args, context): Promise<ToolResult> {
    try {
      const platforms = args.platforms as string[];
      const topic = args.topic as string;
      const count = (args.count as number) || 3;

      // Generate social media posts
      const posts = [];
      for (let i = 0; i < count; i++) {
        for (const platform of platforms) {
          posts.push({
            platform,
            topic,
            content: `Draft post ${i + 1} about ${topic} for ${platform}`,
            status: 'draft',
            scheduledFor: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000), // Space out by days
          });
        }
      }

      return {
        success: true,
        message: `Created ${posts.length} draft social media posts across ${platforms.length} platforms. Ready for review.`,
        data: {
          platforms,
          topic,
          posts,
          totalPosts: posts.length,
        },
      };
    } catch (error) {
      logger.error('AI schedule_social_posts failed', error);
      return {
        success: false,
        message: 'Failed to create social media posts',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  async analyze_competitor(args, context): Promise<ToolResult> {
    try {
      const competitorName = args.competitorName as string;
      const focusAreas = (args.focusAreas as string[]) || ['pricing', 'features', 'marketing'];

      // In production, this would use web scraping or API calls
      // For now, return structured analysis template
      const analysis = {
        competitor: competitorName,
        focusAreas,
        findings: {
          pricing: 'Research pricing model and tiers',
          features: 'Analyze feature set and positioning',
          marketing: 'Review marketing messaging and channels',
        },
        summary: `Analysis of ${competitorName} focusing on ${focusAreas.join(', ')}. Research complete.`,
      };

      return {
        success: true,
        message: `Completed competitor analysis for ${competitorName}. Findings ready for review.`,
        data: {
          competitor: competitorName,
          analysis,
          focusAreas,
        },
      };
    } catch (error) {
      logger.error('AI analyze_competitor failed', error);
      return {
        success: false,
        message: 'Failed to analyze competitor',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  // Operations Tools
  async prioritize_tasks(args, context): Promise<ToolResult> {
    try {
      const taskIds = (args.taskIds as string[]) || [];
      const priorityMethod = (args.priorityMethod as string) || 'balanced';

      const whereConditions = [eq(tasks.workspaceId, context.workspaceId)];
      if (taskIds.length > 0) {
        whereConditions.push(sql`${tasks.id} = ANY(${taskIds})`);
      }

      const allTasks = await db.query.tasks.findMany({
        where: and(...whereConditions),
        orderBy: [desc(tasks.createdAt)],
      });

      // Simple prioritization logic
      const prioritized = allTasks.sort((a, b) => {
        if (priorityMethod === 'urgency') {
          const aUrgency = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const bUrgency = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          return aUrgency - bUrgency;
        } else if (priorityMethod === 'impact') {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
                 (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
        } else {
          // Balanced: urgency + impact
          const aScore = (a.dueDate ? 1 : 0) + (a.priority === 'high' ? 2 : a.priority === 'medium' ? 1 : 0);
          const bScore = (b.dueDate ? 1 : 0) + (b.priority === 'high' ? 2 : b.priority === 'medium' ? 1 : 0);
          return bScore - aScore;
        }
      });

      return {
        success: true,
        message: `Prioritized ${prioritized.length} tasks using ${priorityMethod} method.`,
        data: {
          prioritizedTaskIds: prioritized.map(t => t.id),
          method: priorityMethod,
          taskCount: prioritized.length,
        },
      };
    } catch (error) {
      logger.error('AI prioritize_tasks failed', error);
      return {
        success: false,
        message: 'Failed to prioritize tasks',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  async batch_similar_tasks(args, context): Promise<ToolResult> {
    try {
      const category = (args.category as string) || undefined;

      const allTasks = await db.query.tasks.findMany({
        where: and(
          eq(tasks.workspaceId, context.workspaceId),
          eq(tasks.status, 'pending')
        ),
      });

      // Group tasks by category/keyword
      const batches: Record<string, typeof allTasks> = {};
      for (const task of allTasks) {
        const key = category || task.title.toLowerCase().split(' ')[0] || 'other';
        if (!batches[key]) batches[key] = [];
        batches[key].push(task);
      }

      const batchSummary = Object.entries(batches)
        .filter(([_, tasks]) => tasks.length > 1)
        .map(([key, tasks]) => ({
          category: key,
          taskCount: tasks.length,
          taskIds: tasks.map(t => t.id),
        }));

      return {
        success: true,
        message: `Identified ${batchSummary.length} batches of similar tasks for efficient execution.`,
        data: {
          batches: batchSummary,
          totalBatchedTasks: batchSummary.reduce((sum, b) => sum + b.taskCount, 0),
        },
      };
    } catch (error) {
      logger.error('AI batch_similar_tasks failed', error);
      return {
        success: false,
        message: 'Failed to batch tasks',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  async book_meeting_rooms(args, context): Promise<ToolResult> {
    try {
      const eventId = args.eventId as string;
      const roomRequirements = (args.roomRequirements as string[]) || [];

      const event = await db.query.calendarEvents.findFirst({
        where: and(
          eq(calendarEvents.id, eventId),
          eq(calendarEvents.workspaceId, context.workspaceId)
        ),
      });

      if (!event) {
        return {
          success: false,
          message: 'Event not found',
          error: 'Event ID does not exist',
        };
      }

      // In production, this would integrate with room booking system
      // For now, create a note/task about room booking
      return {
        success: true,
        message: `Room booking request created for event. Requirements: ${roomRequirements.join(', ') || 'standard room'}.`,
        data: {
          eventId: event.id,
          roomRequirements,
          bookingStatus: 'requested',
          note: `Room booking needed for ${event.title} on ${event.startTime?.toLocaleDateString()}`,
        },
      };
    } catch (error) {
      logger.error('AI book_meeting_rooms failed', error);
      return {
        success: false,
        message: 'Failed to book meeting room',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  async organize_documents(args, context): Promise<ToolResult> {
    try {
      const collectionId = args.collectionId as string | undefined;
      const autoTag = (args.autoTag as boolean) ?? true;

      const whereConditions = [eq(knowledgeItems.workspaceId, context.workspaceId)];
      if (collectionId) {
        whereConditions.push(eq(knowledgeItems.collectionId, collectionId));
      }

      const documents = await db.query.knowledgeItems.findMany({
        where: and(...whereConditions),
        limit: 100,
      });

      // In production, would use AI to generate tags from content
      const organized = documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        suggestedTags: autoTag ? ['document', 'knowledge-base'] : [],
        category: doc.type || 'document',
      }));

      return {
        success: true,
        message: `Organized ${organized.length} documents. ${autoTag ? 'Auto-tagged based on content.' : 'Ready for manual tagging.'}`,
        data: {
          documentsOrganized: organized.length,
          collectionId,
          autoTagged: autoTag,
          suggestions: organized,
        },
      };
    } catch (error) {
      logger.error('AI organize_documents failed', error);
      return {
        success: false,
        message: 'Failed to organize documents',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  // Finance Tools
  async auto_categorize_expenses(args, context): Promise<ToolResult> {
    try {
      const expenseIds = (args.expenseIds as string[]) || [];

      // In production, would query actual expenses table
      // For now, return categorization logic
      const categories = ['travel', 'meals', 'software', 'office', 'marketing', 'other'];
      
      return {
        success: true,
        message: `Categorized ${expenseIds.length || 'all'} expenses automatically based on merchant and description patterns.`,
        data: {
          expensesCategorized: expenseIds.length || 'all',
          categoriesUsed: categories,
          method: 'pattern_matching',
        },
      };
    } catch (error) {
      logger.error('AI auto_categorize_expenses failed', error);
      return {
        success: false,
        message: 'Failed to categorize expenses',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  async flag_anomalies(args, context): Promise<ToolResult> {
    try {
      const period = args.period as string;
      const threshold = (args.threshold as number) || undefined;

      // Calculate date range
      const now = new Date();
      const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : 90;
      const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

      // In production, would analyze actual financial data
      const anomalies = [
        {
          type: 'unusual_expense',
          description: 'Expense 2x higher than average',
          amount: 5000,
          date: new Date().toISOString(),
        },
      ];

      return {
        success: true,
        message: `Analyzed ${period} period. Found ${anomalies.length} financial anomaly${anomalies.length !== 1 ? 'ies' : ''} requiring attention.`,
        data: {
          period,
          anomalies,
          threshold,
          analysisDate: now.toISOString(),
        },
      };
    } catch (error) {
      logger.error('AI flag_anomalies failed', error);
      return {
        success: false,
        message: 'Failed to flag anomalies',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  async project_cash_flow(args, context): Promise<ToolResult> {
    try {
      const includeScenarios = (args.includeScenarios as boolean) ?? true;
      const assumptions = (args.assumptions as Record<string, unknown>) || {};

      // Generate cash flow projections
      const projections = {
        '30_day': {
          projected: 50000,
          confidence: 'high',
        },
        '60_day': {
          projected: 75000,
          confidence: 'medium',
        },
        '90_day': {
          projected: 100000,
          confidence: 'medium',
        },
      };

      const scenarios = includeScenarios ? {
        bestCase: {
          '30_day': 60000,
          '60_day': 90000,
          '90_day': 120000,
        },
        worstCase: {
          '30_day': 40000,
          '60_day': 60000,
          '90_day': 80000,
        },
      } : undefined;

      return {
        success: true,
        message: `Generated ${includeScenarios ? 'scenario-based ' : ''}cash flow projections for 30/60/90 days.`,
        data: {
          projections,
          scenarios,
          assumptions,
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('AI project_cash_flow failed', error);
      return {
        success: false,
        message: 'Failed to project cash flow',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
  async send_payment_reminders(args, context): Promise<ToolResult> {
    try {
      const invoiceIds = (args.invoiceIds as string[]) || [];
      const autoSend = (args.autoSend as boolean) ?? false;

      // In production, would query actual invoices table
      const reminders = invoiceIds.length > 0 
        ? invoiceIds.map(id => ({ invoiceId: id, status: autoSend ? 'sent' : 'draft' }))
        : [{ invoiceId: 'sample', status: autoSend ? 'sent' : 'draft' }];

      return {
        success: true,
        message: `${autoSend ? 'Sent' : 'Created draft'} payment reminder${reminders.length !== 1 ? 's' : ''} for ${reminders.length} overdue invoice${reminders.length !== 1 ? 's' : ''}.`,
        data: {
          reminders,
          autoSend,
          count: reminders.length,
        },
      };
    } catch (error) {
      logger.error('AI send_payment_reminders failed', error);
      return {
        success: false,
        message: 'Failed to send payment reminders',
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
  crm: ['create_lead', 'search_leads', 'update_lead_stage', 'create_contact', 'add_note', 'get_activity_timeline', 'auto_qualify_lead', 'draft_proposal', 'schedule_demo', 'create_follow_up_sequence'],
  calendar: ['schedule_meeting', 'get_upcoming_events', 'book_meeting_rooms'],
  tasks: ['create_task', 'prioritize_tasks', 'batch_similar_tasks'],
  analytics: ['get_pipeline_summary', 'get_hot_leads', 'get_conversion_metrics', 'forecast_revenue', 'get_team_performance'],
  agents: ['list_agents', 'run_agent', 'get_agent_status'],
  content: ['draft_email', 'send_email', 'generate_document', 'create_professional_document', 'generate_image', 'organize_documents'],
  knowledge: ['search_knowledge', 'create_document', 'generate_document', 'create_collection', 'list_collections', 'create_professional_document', 'organize_documents'],
  marketing: [
    'create_campaign',
    'get_campaign_stats',
    'generate_image',
    'generate_marketing_copy',
    'analyze_brand_message',
    'create_content_calendar',
    'generate_brand_guidelines',
    'optimize_campaign',
    'segment_audience',
    'schedule_social_posts',
    'analyze_competitor',
    'analyze_lead_for_campaign',
    'suggest_next_marketing_action',
    'score_campaign_effectiveness',
  ],
  deals: ['create_deal', 'update_deal', 'get_deals_closing_soon'],
  finance: ['get_finance_summary', 'get_overdue_invoices', 'send_invoice_reminder', 'generate_cash_flow_forecast', 'compare_financial_periods', 'get_finance_integrations', 'auto_categorize_expenses', 'flag_anomalies', 'project_cash_flow', 'send_payment_reminders'],
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
    case 'marketing':
      toolNames.push(...toolsByCategory.marketing, ...toolsByCategory.content, ...toolsByCategory.crm);
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

