/**
 * CRM Tool Definitions
 */
import type { ToolDefinitions } from '../types';

export const crmToolDefinitions: ToolDefinitions = [
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
];
