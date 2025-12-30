/**
 * Marketing Tool Definitions
 */
import type { ToolDefinitions } from '../types';

export const marketingToolDefinitions: ToolDefinitions = [
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
      name: 'update_campaign_roadmap',
      description: 'Update the campaign creation roadmap. Use this to add roadmap items or mark them as completed when building a campaign with the user.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['add', 'complete', 'replace'],
            description: 'Action to take: "replace" to build initial roadmap, "add" to add items, "complete" to mark items done',
          },
          items: {
            type: 'array',
            description: 'Array of roadmap items to add or update',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Unique identifier for the roadmap item' },
                title: { type: 'string', description: 'Title of the roadmap item' },
                description: { type: 'string', description: 'Optional description' },
                value: { type: 'string', description: 'Captured value when completing an item' },
              },
              required: ['id', 'title'],
            },
          },
        },
        required: ['action', 'items'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'launch_campaign',
      description: 'Launch/create the campaign when all roadmap items are complete and user confirms. This creates the campaign and moves it to the Campaigns tab.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Campaign name',
          },
          type: {
            type: 'string',
            enum: ['email', 'social', 'ads', 'content', 'drip', 'newsletter', 'promotion'],
            description: 'Campaign type',
          },
          content: {
            type: 'object',
            description: 'Campaign content (subject, body, images, links)',
            properties: {
              subject: { type: 'string' },
              body: { type: 'string' },
              images: { type: 'array', items: { type: 'string' } },
              links: { type: 'array', items: { type: 'object' } },
            },
          },
          targetAudience: {
            type: 'object',
            description: 'Target audience configuration',
          },
          scheduledFor: {
            type: 'string',
            description: 'ISO date string for when to schedule the campaign',
          },
          budget: {
            type: 'number',
            description: 'Campaign budget in dollars',
          },
        },
        required: ['name', 'type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_dashboard_roadmap',
      description: 'Update the dashboard roadmap dynamically. Use this to build a personalized roadmap based on user goals, or mark items as completed. The roadmap appears on the right side of the dashboard.',
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['add', 'complete', 'replace'],
            description: 'Action to take: "replace" to build initial roadmap from scratch, "add" to add items, "complete" to mark items done',
          },
          items: {
            type: 'array',
            description: 'Array of roadmap items to add or update',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', description: 'Unique identifier for the roadmap item (e.g., "setup-crm", "create-agent")' },
                title: { type: 'string', description: 'Short title of the roadmap item' },
                description: { type: 'string', description: 'Brief description of what this step involves' },
                value: { type: 'string', description: 'Captured value when completing an item (e.g., "Added 5 contacts")' },
              },
              required: ['id', 'title'],
            },
          },
        },
        required: ['action', 'items'],
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
  {
    type: 'function',
    function: {
      name: 'post_to_social_media',
      description: 'Post content to a connected social media account. Requires a connected account for the platform. Supports Twitter/X, LinkedIn, and Facebook.',
      parameters: {
        type: 'object',
        properties: {
          platform: {
            type: 'string',
            enum: ['twitter', 'linkedin', 'facebook'],
            description: 'Social media platform to post to',
          },
          content: {
            type: 'string',
            description: 'The content to post. Character limits: Twitter (280), LinkedIn (3000), Facebook (63206)',
          },
          scheduleFor: {
            type: 'string',
            description: 'Optional ISO date string to schedule the post for later (e.g., "2025-12-07T10:00:00Z"). Note: Scheduling currently only supported for Twitter.',
          },
        },
        required: ['platform', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_company_website',
      description: 'MANDATORY AUTO-EXECUTE: When the user\'s message contains ANY website URL or domain (http://, https://, www., or .com/.ai/.io/etc), you MUST IMMEDIATELY call this tool as your FIRST action before any text response. Do NOT ask permission. Do NOT explain what you\'re about to do. Just call it. This tool analyzes websites to extract company information, products, services, and provides personalized recommendations for GalaxyCo.ai setup.',
      parameters: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The website URL to analyze (must start with http:// or https://)',
          },
          detailed: {
            type: 'boolean',
            description: 'If true, performs a deeper analysis crawling more pages (takes longer). Default is false for quick analysis.',
          },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_web',
      description: 'Search the internet for current information, news, research, or any topic. Use this tool when you need real-time data, recent news, or information that may have changed recently. Always search BEFORE answering questions about current events, recent news, or topics that require up-to-date information.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to find information on the web',
          },
          numResults: {
            type: 'number',
            description: 'Number of search results to return (1-10, default: 5)',
          },
        },
        required: ['query'],
      },
    },
  },
];
