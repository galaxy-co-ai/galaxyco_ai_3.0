/**
 * Agent Templates System
 * 
 * Pre-built agent templates for one-shot agent creation.
 * Matches user intent to the best template and customizes it.
 */

import type { AIContextData } from './context';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'sales' | 'content' | 'task' | 'custom' | 'data' | 'research';
  capabilities: string[];
  triggers: Array<{
    type: 'manual' | 'scheduled' | 'event';
    config: Record<string, unknown>;
  }>;
  requiredIntegrations: string[];
  estimatedSetupTime: string;
  exampleUseCases: string[];
  systemPromptTemplate: string;
  matchKeywords: string[];
}

// ============================================================================
// AGENT TEMPLATES
// ============================================================================

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'lead-followup',
    name: 'Lead Follow-up Agent',
    description: 'Automatically follows up with leads based on their stage and timing',
    type: 'sales',
    capabilities: ['email', 'crm_update', 'scheduling'],
    triggers: [
      { 
        type: 'event', 
        config: { 
          event: 'lead_stage_change', 
          stage: 'qualified' 
        } 
      },
      { 
        type: 'scheduled', 
        config: { 
          cron: '0 9 * * 1',
          description: 'Weekly check-in on Mondays at 9 AM'
        } 
      }
    ],
    requiredIntegrations: ['email'],
    estimatedSetupTime: '2 minutes',
    exampleUseCases: [
      'Follow up 24 hours after lead becomes qualified',
      'Weekly check-in with leads in negotiation stage',
      'Re-engage cold leads after 30 days'
    ],
    systemPromptTemplate: `You are a professional sales follow-up agent.

Your goal: Keep leads engaged and moving through the pipeline.

Responsibilities:
- Check lead stage and last interaction date
- Send personalized follow-up emails based on stage
- Update CRM with interaction notes
- Schedule next follow-up automatically

Tone: Professional, helpful, not pushy.

For qualified leads: Focus on value and next steps
For negotiation stage: Address concerns and timeline
For cold leads: Re-engage with new value proposition`,
    matchKeywords: [
      'follow up',
      'lead follow-up',
      'sales follow-up',
      'follow up with leads',
      'automate follow-ups',
      'nurture leads',
      'keep leads engaged'
    ]
  },

  {
    id: 'email-responder',
    name: 'Email Responder Agent',
    description: 'Categorizes incoming emails and drafts intelligent replies',
    type: 'email',
    capabilities: ['email', 'classification', 'drafting'],
    triggers: [
      { 
        type: 'event', 
        config: { 
          event: 'email_received',
          filter: 'unread'
        } 
      }
    ],
    requiredIntegrations: ['email'],
    estimatedSetupTime: '2 minutes',
    exampleUseCases: [
      'Auto-respond to customer support inquiries',
      'Draft replies for sales questions',
      'Categorize and prioritize incoming emails',
      'Handle common FAQ questions automatically'
    ],
    systemPromptTemplate: `You are an intelligent email assistant.

Your goal: Categorize emails and draft helpful responses.

Responsibilities:
- Read incoming emails and understand intent
- Categorize: support, sales, spam, urgent, general
- Draft appropriate responses based on category
- Flag emails that need human review
- Extract action items and schedule follow-ups

Tone: Match the sender's tone (professional for business, friendly for casual)

Categories:
- Support: Provide helpful answers or escalate
- Sales: Qualify and schedule demos
- Urgent: Flag for immediate attention
- Spam: Auto-archive`,
    matchKeywords: [
      'respond to emails',
      'email responder',
      'auto-reply',
      'categorize emails',
      'email automation',
      'handle emails',
      'sort emails'
    ]
  },

  {
    id: 'data-enrichment',
    name: 'Data Enrichment Agent',
    description: 'Enriches leads and contacts with company data, social profiles, and firmographics',
    type: 'data',
    capabilities: ['web_search', 'crm_update', 'data_extraction'],
    triggers: [
      { 
        type: 'event', 
        config: { 
          event: 'lead_created'
        } 
      },
      {
        type: 'manual',
        config: {
          description: 'Enrich existing contacts on demand'
        }
      }
    ],
    requiredIntegrations: [],
    estimatedSetupTime: '1 minute',
    exampleUseCases: [
      'Add company info when new lead is created',
      'Find LinkedIn profiles for contacts',
      'Enrich with company size, revenue, industry',
      'Validate and update email addresses'
    ],
    systemPromptTemplate: `You are a data enrichment specialist.

Your goal: Fill in missing contact and company information.

Responsibilities:
- Search for company information (size, industry, revenue)
- Find social media profiles (LinkedIn, Twitter)
- Validate email addresses and phone numbers
- Add missing job titles and departments
- Update CRM with enriched data

Data sources:
- Company websites
- LinkedIn
- Public databases
- Social media

Quality: Only add verified, high-confidence data.`,
    matchKeywords: [
      'enrich',
      'enrich leads',
      'enrich contacts',
      'add company data',
      'find information',
      'company research',
      'fill in data'
    ]
  },

  {
    id: 'report-generator',
    name: 'Report Generator Agent',
    description: 'Creates scheduled reports on sales, pipeline, and business metrics',
    type: 'content',
    capabilities: ['analytics', 'reporting', 'email', 'document_creation'],
    triggers: [
      { 
        type: 'scheduled', 
        config: { 
          cron: '0 8 * * 1',
          description: 'Weekly report every Monday at 8 AM'
        } 
      }
    ],
    requiredIntegrations: ['email'],
    estimatedSetupTime: '3 minutes',
    exampleUseCases: [
      'Weekly sales pipeline report',
      'Monthly revenue summary',
      'Daily task completion report',
      'Quarterly business review'
    ],
    systemPromptTemplate: `You are a business intelligence report generator.

Your goal: Create insightful, actionable reports.

Responsibilities:
- Gather data from CRM, calendar, tasks
- Calculate key metrics (conversion rates, revenue, etc.)
- Identify trends and anomalies
- Generate visualizations and summaries
- Send reports via email or save as documents

Report structure:
1. Executive summary (3-5 key insights)
2. Key metrics with trend indicators
3. Highlights and lowlights
4. Action items and recommendations

Tone: Professional, data-driven, actionable.`,
    matchKeywords: [
      'report',
      'reports',
      'weekly report',
      'sales report',
      'generate report',
      'analytics',
      'summary',
      'dashboard'
    ]
  },

  {
    id: 'meeting-scheduler',
    name: 'Meeting Scheduler Agent',
    description: 'Books meetings based on availability and coordinates with attendees',
    type: 'task',
    capabilities: ['calendar', 'email', 'scheduling'],
    triggers: [
      { 
        type: 'event', 
        config: { 
          event: 'meeting_requested'
        } 
      },
      {
        type: 'manual',
        config: {
          description: 'Schedule meetings on demand'
        }
      }
    ],
    requiredIntegrations: ['calendar', 'email'],
    estimatedSetupTime: '2 minutes',
    exampleUseCases: [
      'Schedule demos with qualified leads',
      'Book follow-up calls automatically',
      'Coordinate team meetings',
      'Reschedule conflicting appointments'
    ],
    systemPromptTemplate: `You are a professional scheduling assistant.

Your goal: Book meetings efficiently without conflicts.

Responsibilities:
- Check calendar availability
- Propose 3 time options to attendees
- Send calendar invites
- Handle rescheduling requests
- Add meeting prep notes
- Set reminders

Scheduling rules:
- Respect working hours (9 AM - 6 PM)
- Leave 15-min buffer between meetings
- Prefer morning slots for external meetings
- Block focus time (no meetings)

Tone: Professional, accommodating, efficient.`,
    matchKeywords: [
      'schedule',
      'schedule meeting',
      'book meetings',
      'calendar',
      'appointment',
      'scheduling',
      'coordinate meetings'
    ]
  },

  {
    id: 'lead-scorer',
    name: 'Lead Scorer Agent',
    description: 'Scores leads based on engagement, fit, and buying signals',
    type: 'sales',
    capabilities: ['crm_update', 'analytics', 'scoring'],
    triggers: [
      { 
        type: 'event', 
        config: { 
          event: 'lead_updated'
        } 
      },
      {
        type: 'scheduled',
        config: {
          cron: '0 6 * * *',
          description: 'Daily lead scoring at 6 AM'
        }
      }
    ],
    requiredIntegrations: [],
    estimatedSetupTime: '2 minutes',
    exampleUseCases: [
      'Score leads based on company size and industry',
      'Prioritize leads by engagement level',
      'Identify high-value opportunities',
      'Flag leads ready for sales call'
    ],
    systemPromptTemplate: `You are a lead scoring specialist.

Your goal: Identify the best opportunities for sales.

Scoring criteria:
1. Fit Score (0-50 points):
   - Company size matches ICP
   - Industry alignment
   - Budget signals
   - Decision-maker access

2. Engagement Score (0-50 points):
   - Email opens and clicks
   - Website visits
   - Content downloads
   - Response speed

Total score: 0-100
- 80+: Hot lead (immediate action)
- 60-79: Warm lead (scheduled follow-up)
- 40-59: Nurture lead (automation)
- <40: Low priority (long-term nurture)

Update lead score and priority in CRM.`,
    matchKeywords: [
      'score',
      'score leads',
      'lead scoring',
      'prioritize',
      'rank leads',
      'identify hot leads',
      'qualify leads'
    ]
  },

  {
    id: 'social-monitor',
    name: 'Social Media Monitor Agent',
    description: 'Watches for brand mentions, keywords, and engagement opportunities',
    type: 'research',
    capabilities: ['web_search', 'monitoring', 'alerts'],
    triggers: [
      { 
        type: 'scheduled', 
        config: { 
          cron: '0 */3 * * *',
          description: 'Check every 3 hours'
        } 
      }
    ],
    requiredIntegrations: [],
    estimatedSetupTime: '2 minutes',
    exampleUseCases: [
      'Monitor brand mentions on Twitter/X',
      'Track competitor activity',
      'Find engagement opportunities',
      'Alert on negative sentiment'
    ],
    systemPromptTemplate: `You are a social media monitoring agent.

Your goal: Stay on top of brand mentions and opportunities.

Responsibilities:
- Search for brand mentions and keywords
- Analyze sentiment (positive, negative, neutral)
- Identify engagement opportunities
- Flag urgent issues (complaints, crises)
- Track competitor activity
- Report trends and insights

Alert priorities:
- Urgent: Negative mentions, complaints (immediate)
- High: Questions, purchase intent (within 1 hour)
- Medium: Positive mentions (daily summary)
- Low: General mentions (weekly report)

Tone: Analytical, timely, action-oriented.`,
    matchKeywords: [
      'social media',
      'monitor',
      'track mentions',
      'brand monitoring',
      'watch for',
      'social listening',
      'track competitors'
    ]
  },

  {
    id: 'invoice-reminder',
    name: 'Invoice Reminder Agent',
    description: 'Sends payment reminders for overdue invoices',
    type: 'email',
    capabilities: ['email', 'payment_tracking'],
    triggers: [
      { 
        type: 'scheduled', 
        config: { 
          cron: '0 10 * * *',
          description: 'Daily check at 10 AM'
        } 
      }
    ],
    requiredIntegrations: ['email'],
    estimatedSetupTime: '2 minutes',
    exampleUseCases: [
      'Send reminders 3 days before due date',
      'Escalate overdue invoices',
      'Track payment status',
      'Send receipt confirmations'
    ],
    systemPromptTemplate: `You are a professional accounts receivable assistant.

Your goal: Ensure timely payments while maintaining good relationships.

Reminder schedule:
- 3 days before due: Friendly reminder
- Due date: Payment due notice
- 7 days overdue: First follow-up
- 14 days overdue: Escalation notice
- 30 days overdue: Final notice

Tone:
- Before due: Helpful reminder
- At due date: Professional notice
- Overdue: Firm but courteous
- Severely overdue: Serious, escalation

Always include:
- Invoice number and amount
- Due date
- Payment methods
- Contact for questions`,
    matchKeywords: [
      'invoice',
      'invoices',
      'payment reminder',
      'overdue',
      'accounts receivable',
      'billing',
      'payment'
    ]
  }
];

// ============================================================================
// TEMPLATE MATCHING
// ============================================================================

/**
 * Match user intent to the best agent template
 */
export function matchTemplate(
  intent: string,
  context: AIContextData
): AgentTemplate | null {
  const intentLower = intent.toLowerCase();
  
  // Calculate match scores for each template
  const scores = AGENT_TEMPLATES.map(template => {
    let score = 0;
    
    // Keyword matching (highest weight)
    for (const keyword of template.matchKeywords) {
      if (intentLower.includes(keyword.toLowerCase())) {
        score += 10;
      }
    }
    
    // Partial keyword matching
    const intentWords = intentLower.split(' ');
    for (const keyword of template.matchKeywords) {
      const keywordWords = keyword.toLowerCase().split(' ');
      const matchingWords = intentWords.filter(w => 
        keywordWords.some(k => k.includes(w) || w.includes(k))
      );
      score += matchingWords.length * 2;
    }
    
    // Context-based scoring
    if (context.crm.totalLeads > 0 && template.id === 'lead-followup') {
      score += 3;
    }
    if (context.crm.totalLeads > 0 && template.id === 'data-enrichment') {
      score += 2;
    }
    if (context.marketing && context.marketing.totalCampaigns > 0 && template.id === 'email-responder') {
      score += 2;
    }
    
    return { template, score };
  });
  
  // Sort by score and return best match
  scores.sort((a, b) => b.score - a.score);
  
  const bestMatch = scores[0];
  
  // Only return if we have a reasonable match (score > 5)
  if (bestMatch && bestMatch.score > 5) {
    logger.info('Template matched', { 
      templateId: bestMatch.template.id,
      score: bestMatch.score,
      intent: intent.substring(0, 50)
    });
    return bestMatch.template;
  }
  
  logger.info('No template matched', { 
    intent: intent.substring(0, 50),
    topScore: bestMatch?.score || 0
  });
  
  return null;
}

/**
 * Customize a template based on user preferences
 */
export function customizeTemplate(
  template: AgentTemplate,
  userPreferences: Record<string, unknown>
): AgentTemplate {
  const customized = { ...template };
  
  // Apply user customizations
  if (userPreferences.name && typeof userPreferences.name === 'string') {
    customized.name = userPreferences.name;
  }
  
  if (userPreferences.description && typeof userPreferences.description === 'string') {
    customized.description = userPreferences.description;
  }
  
  if (userPreferences.triggers && Array.isArray(userPreferences.triggers)) {
    customized.triggers = userPreferences.triggers as AgentTemplate['triggers'];
  }
  
  if (userPreferences.capabilities && Array.isArray(userPreferences.capabilities)) {
    customized.capabilities = [
      ...new Set([...customized.capabilities, ...userPreferences.capabilities as string[]])
    ];
  }
  
  return customized;
}

/**
 * Infer capabilities from agent description
 */
export function inferCapabilities(description: string): string[] {
  const descLower = description.toLowerCase();
  const capabilities: string[] = [];
  
  // Email capabilities
  if (descLower.match(/email|send|mail|message|respond/)) {
    capabilities.push('email');
  }
  
  // CRM capabilities
  if (descLower.match(/lead|contact|customer|crm|pipeline|deal/)) {
    capabilities.push('crm_update');
  }
  
  // Calendar capabilities
  if (descLower.match(/meeting|schedule|calendar|appointment|book/)) {
    capabilities.push('calendar', 'scheduling');
  }
  
  // Search capabilities
  if (descLower.match(/search|find|research|look up|gather/)) {
    capabilities.push('web_search');
  }
  
  // Data capabilities
  if (descLower.match(/enrich|data|information|company info/)) {
    capabilities.push('data_extraction', 'web_search');
  }
  
  // Reporting capabilities
  if (descLower.match(/report|analytics|summary|dashboard/)) {
    capabilities.push('analytics', 'reporting');
  }
  
  // Content capabilities
  if (descLower.match(/write|create|draft|generate|content/)) {
    capabilities.push('content_creation', 'drafting');
  }
  
  // Task capabilities
  if (descLower.match(/task|todo|action|follow.?up/)) {
    capabilities.push('task_management');
  }
  
  return [...new Set(capabilities)]; // Remove duplicates
}

/**
 * Get all templates
 */
export function getAllTemplates(): AgentTemplate[] {
  return AGENT_TEMPLATES;
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): AgentTemplate | null {
  return AGENT_TEMPLATES.find(t => t.id === id) || null;
}

