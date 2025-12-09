/**
 * Workflow Templates - Pre-built Multi-Agent Workflows
 *
 * Ready-to-use workflow templates for common business processes:
 * - Lead-to-Customer Pipeline: Lead qualification → Proposal → Follow-up → Onboarding
 * - Content Campaign Workflow: Create → Optimize → Schedule → Track → Improve
 * - Support Ticket Resolution: Triage → Response → Escalation → Resolution
 */

import type {
  WorkflowStep,
  WorkflowTriggerType,
  WorkflowTriggerConfig,
  AgentDepartment,
} from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface WorkflowStepTemplate {
  id: string;
  name: string;
  description: string;
  action: string;
  agentType: string; // The type of agent that should handle this step
  agentRole: 'coordinator' | 'specialist' | 'support';
  inputs: Record<string, unknown>;
  conditions?: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
    value: unknown;
  }>;
  onSuccess?: string;
  onFailure?: string;
  timeout?: number;
  retryConfig?: {
    maxAttempts: number;
    backoffMs: number;
  };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  department: AgentDepartment;
  icon: string;
  triggerType: WorkflowTriggerType;
  triggerConfig: WorkflowTriggerConfig;
  steps: WorkflowStepTemplate[];
  benefits: string[];
  useCases: string[];
  estimatedDuration: string;
  requiredAgentTypes: string[];
}

// ============================================================================
// LEAD-TO-CUSTOMER PIPELINE
// ============================================================================

export const leadToCustomerPipeline: WorkflowTemplate = {
  id: 'lead-to-customer',
  name: 'Lead-to-Customer Pipeline',
  description:
    'Automated sales pipeline that qualifies leads, generates proposals, handles follow-ups, and initiates onboarding for won deals.',
  category: 'sales',
  department: 'sales',
  icon: '🎯',
  triggerType: 'event',
  triggerConfig: {
    eventType: 'lead.created',
    conditions: [
      { field: 'source', operator: 'exists', value: true },
    ],
  },
  steps: [
    {
      id: 'qualify-lead',
      name: 'Qualify Lead',
      description: 'Research and score the lead using BANT+ criteria',
      action: 'qualify_lead',
      agentType: 'lead_qualifier',
      agentRole: 'specialist',
      inputs: {
        scoreThreshold: 15,
        researchDepth: 'standard',
        criteria: ['budget', 'authority', 'need', 'timeline', 'fit'],
      },
      onSuccess: 'check-qualification',
      onFailure: 'add-to-nurture',
      timeout: 600,
      retryConfig: {
        maxAttempts: 2,
        backoffMs: 5000,
      },
    },
    {
      id: 'check-qualification',
      name: 'Check Qualification Score',
      description: 'Route based on qualification score',
      action: 'evaluate_score',
      agentType: 'sales_manager',
      agentRole: 'coordinator',
      inputs: {},
      conditions: [
        { field: 'Qualify_Lead_result.score', operator: 'greater_than', value: 15 },
      ],
      onSuccess: 'generate-proposal',
      onFailure: 'add-to-nurture',
      timeout: 120,
    },
    {
      id: 'generate-proposal',
      name: 'Generate Proposal',
      description: 'Create customized proposal based on lead needs',
      action: 'generate_proposal',
      agentType: 'proposal_writer',
      agentRole: 'specialist',
      inputs: {
        template: 'standard',
        includeROI: true,
        includeCaseStudies: true,
      },
      onSuccess: 'send-proposal',
      onFailure: 'notify-manager',
      timeout: 1200,
      retryConfig: {
        maxAttempts: 2,
        backoffMs: 10000,
      },
    },
    {
      id: 'send-proposal',
      name: 'Send Proposal',
      description: 'Send proposal with personalized cover email',
      action: 'send_proposal',
      agentType: 'follow_up_agent',
      agentRole: 'specialist',
      inputs: {
        emailType: 'proposal',
        schedulFollowUp: true,
        followUpDays: 3,
      },
      onSuccess: 'schedule-followup',
      timeout: 300,
    },
    {
      id: 'schedule-followup',
      name: 'Schedule Follow-up Sequence',
      description: 'Set up automated follow-up cadence',
      action: 'create_followup_sequence',
      agentType: 'follow_up_agent',
      agentRole: 'specialist',
      inputs: {
        cadence: '3_day',
        maxTouchpoints: 5,
        channels: ['email', 'phone'],
      },
      onSuccess: 'monitor-engagement',
      timeout: 300,
    },
    {
      id: 'monitor-engagement',
      name: 'Monitor Engagement',
      description: 'Track proposal views and engagement',
      action: 'track_engagement',
      agentType: 'sales_manager',
      agentRole: 'coordinator',
      inputs: {
        trackOpens: true,
        trackClicks: true,
        alertOnEngagement: true,
      },
      timeout: 300,
    },
    {
      id: 'add-to-nurture',
      name: 'Add to Nurture Sequence',
      description: 'Add unqualified lead to long-term nurture',
      action: 'add_to_nurture',
      agentType: 'follow_up_agent',
      agentRole: 'specialist',
      inputs: {
        sequenceType: 'long_term',
        touchpointInterval: 14,
        contentType: 'educational',
      },
      timeout: 300,
    },
    {
      id: 'notify-manager',
      name: 'Notify Sales Manager',
      description: 'Alert manager for manual intervention',
      action: 'send_notification',
      agentType: 'sales_manager',
      agentRole: 'coordinator',
      inputs: {
        channel: 'email',
        urgency: 'high',
        message: 'Lead requires manual review - proposal generation failed',
      },
      timeout: 120,
    },
  ],
  benefits: [
    'Reduce lead response time from hours to minutes',
    'Consistent qualification scoring across all leads',
    'Automated proposal generation saves 2+ hours per deal',
    'Never miss a follow-up with automated sequences',
    'Data-driven pipeline insights',
  ],
  useCases: [
    'B2B software sales',
    'Enterprise deal management',
    'High-volume lead processing',
    'Consultative sales cycles',
  ],
  estimatedDuration: '15-30 minutes per lead',
  requiredAgentTypes: ['lead_qualifier', 'proposal_writer', 'follow_up_agent', 'sales_manager'],
};

// ============================================================================
// CONTENT CAMPAIGN WORKFLOW
// ============================================================================

export const contentCampaignWorkflow: WorkflowTemplate = {
  id: 'content-campaign',
  name: 'Content Campaign Workflow',
  description:
    'End-to-end content campaign management from ideation to optimization, including creation, scheduling, tracking, and performance improvement.',
  category: 'marketing',
  department: 'marketing',
  icon: '📢',
  triggerType: 'manual',
  triggerConfig: {},
  steps: [
    {
      id: 'plan-content',
      name: 'Plan Content Strategy',
      description: 'Define campaign goals, audience, and content themes',
      action: 'plan_campaign',
      agentType: 'campaign_manager',
      agentRole: 'coordinator',
      inputs: {
        planningHorizon: 'week',
        channels: ['social', 'email', 'blog'],
        audienceSegments: ['prospects', 'customers'],
      },
      onSuccess: 'research-topics',
      timeout: 600,
    },
    {
      id: 'research-topics',
      name: 'Research Trending Topics',
      description: 'Identify trending topics and competitor content',
      action: 'research_content',
      agentType: 'analytics_agent',
      agentRole: 'specialist',
      inputs: {
        sources: ['social', 'news', 'competitors'],
        lookbackDays: 7,
        includeKeywords: true,
      },
      onSuccess: 'create-content',
      timeout: 600,
    },
    {
      id: 'create-content',
      name: 'Create Campaign Content',
      description: 'Generate content for all planned channels',
      action: 'create_campaign_content',
      agentType: 'content_creator',
      agentRole: 'specialist',
      inputs: {
        contentTypes: ['posts', 'images', 'captions'],
        tone: 'professional',
        includeVisuals: true,
        batchSize: 7,
      },
      onSuccess: 'optimize-content',
      onFailure: 'notify-team',
      timeout: 1800,
      retryConfig: {
        maxAttempts: 2,
        backoffMs: 15000,
      },
    },
    {
      id: 'optimize-content',
      name: 'Optimize Content',
      description: 'Review and optimize content for engagement',
      action: 'optimize_content',
      agentType: 'analytics_agent',
      agentRole: 'specialist',
      inputs: {
        optimizeFor: ['engagement', 'seo', 'conversion'],
        abTestVariants: 2,
        suggestHashtags: true,
      },
      onSuccess: 'schedule-posts',
      timeout: 900,
    },
    {
      id: 'schedule-posts',
      name: 'Schedule Content',
      description: 'Schedule posts at optimal times',
      action: 'schedule_content',
      agentType: 'campaign_manager',
      agentRole: 'coordinator',
      inputs: {
        optimizeTimings: true,
        timezone: 'auto',
        spreadPosts: true,
      },
      onSuccess: 'setup-tracking',
      timeout: 600,
    },
    {
      id: 'setup-tracking',
      name: 'Set Up Tracking',
      description: 'Configure analytics and tracking',
      action: 'setup_tracking',
      agentType: 'analytics_agent',
      agentRole: 'specialist',
      inputs: {
        trackMetrics: ['impressions', 'engagement', 'clicks', 'conversions'],
        setupGoals: true,
        enableAlerts: true,
      },
      onSuccess: 'monitor-performance',
      timeout: 300,
    },
    {
      id: 'monitor-performance',
      name: 'Monitor Performance',
      description: 'Track campaign performance and identify optimization opportunities',
      action: 'monitor_campaign',
      agentType: 'analytics_agent',
      agentRole: 'specialist',
      inputs: {
        checkInterval: '6h',
        compareToBaseline: true,
        alertThreshold: 0.8,
      },
      onSuccess: 'generate-report',
      timeout: 600,
    },
    {
      id: 'generate-report',
      name: 'Generate Performance Report',
      description: 'Create campaign performance summary',
      action: 'generate_report',
      agentType: 'campaign_manager',
      agentRole: 'coordinator',
      inputs: {
        reportType: 'campaign_summary',
        includeInsights: true,
        recommendActions: true,
      },
      timeout: 600,
    },
    {
      id: 'notify-team',
      name: 'Notify Marketing Team',
      description: 'Alert team for manual intervention',
      action: 'send_notification',
      agentType: 'campaign_manager',
      agentRole: 'coordinator',
      inputs: {
        channel: 'email',
        urgency: 'normal',
        message: 'Content creation requires review',
      },
      timeout: 120,
    },
  ],
  benefits: [
    'Reduce content creation time by 70%',
    'Consistent brand voice across channels',
    'Data-driven content optimization',
    'Automated scheduling at optimal times',
    'Real-time performance insights',
  ],
  useCases: [
    'Social media campaigns',
    'Product launches',
    'Seasonal promotions',
    'Thought leadership programs',
    'Brand awareness campaigns',
  ],
  estimatedDuration: '2-4 hours for weekly content',
  requiredAgentTypes: ['campaign_manager', 'content_creator', 'analytics_agent'],
};

// ============================================================================
// SUPPORT TICKET RESOLUTION
// ============================================================================

export const supportTicketResolution: WorkflowTemplate = {
  id: 'support-ticket-resolution',
  name: 'Support Ticket Resolution',
  description:
    'Automated support workflow that triages incoming tickets, generates responses, handles escalations, and tracks resolution metrics.',
  category: 'support',
  department: 'support',
  icon: '🎧',
  triggerType: 'event',
  triggerConfig: {
    eventType: 'ticket.created',
  },
  steps: [
    {
      id: 'triage-ticket',
      name: 'Triage Ticket',
      description: 'Categorize and prioritize the incoming ticket',
      action: 'triage_ticket',
      agentType: 'ticket_triage',
      agentRole: 'specialist',
      inputs: {
        autoDetectCategory: true,
        autoPrioritize: true,
        searchKnowledgeBase: true,
      },
      onSuccess: 'check-knowledge-base',
      onFailure: 'escalate-to-manager',
      timeout: 300,
      retryConfig: {
        maxAttempts: 2,
        backoffMs: 2000,
      },
    },
    {
      id: 'check-knowledge-base',
      name: 'Search Knowledge Base',
      description: 'Find relevant articles and solutions',
      action: 'search_knowledge_base',
      agentType: 'ticket_triage',
      agentRole: 'specialist',
      inputs: {
        maxResults: 5,
        relevanceThreshold: 0.7,
        includeInternalDocs: true,
      },
      onSuccess: 'check-priority',
      timeout: 300,
    },
    {
      id: 'check-priority',
      name: 'Check Ticket Priority',
      description: 'Route based on ticket priority',
      action: 'evaluate_priority',
      agentType: 'support_manager',
      agentRole: 'coordinator',
      inputs: {},
      conditions: [
        { field: 'Triage_Ticket_result.priority', operator: 'equals', value: 'P1' },
      ],
      onSuccess: 'escalate-immediately',
      onFailure: 'generate-response',
      timeout: 120,
    },
    {
      id: 'generate-response',
      name: 'Generate Response',
      description: 'Create helpful and empathetic response',
      action: 'generate_response',
      agentType: 'response_generator',
      agentRole: 'specialist',
      inputs: {
        tone: 'empathetic',
        includeSteps: true,
        suggestRelatedArticles: true,
        maxLength: 500,
      },
      onSuccess: 'send-response',
      onFailure: 'escalate-to-handler',
      timeout: 600,
      retryConfig: {
        maxAttempts: 2,
        backoffMs: 5000,
      },
    },
    {
      id: 'send-response',
      name: 'Send Response',
      description: 'Send response and schedule follow-up',
      action: 'send_ticket_response',
      agentType: 'response_generator',
      agentRole: 'specialist',
      inputs: {
        channel: 'auto',
        scheduleFollowUp: true,
        followUpHours: 24,
      },
      onSuccess: 'verify-resolution',
      timeout: 300,
    },
    {
      id: 'verify-resolution',
      name: 'Verify Resolution',
      description: 'Check if customer confirmed resolution',
      action: 'check_resolution_status',
      agentType: 'support_manager',
      agentRole: 'coordinator',
      inputs: {
        waitHours: 24,
        checkCustomerResponse: true,
      },
      conditions: [
        { field: 'customer_satisfied', operator: 'equals', value: true },
      ],
      onSuccess: 'close-ticket',
      onFailure: 'escalate-to-handler',
      timeout: 300,
    },
    {
      id: 'close-ticket',
      name: 'Close Ticket',
      description: 'Mark ticket as resolved and send satisfaction survey',
      action: 'close_ticket',
      agentType: 'support_manager',
      agentRole: 'coordinator',
      inputs: {
        sendSurvey: true,
        updateMetrics: true,
        archiveTicket: false,
      },
      timeout: 120,
    },
    {
      id: 'escalate-immediately',
      name: 'Immediate Escalation',
      description: 'Escalate P1 tickets immediately to handler',
      action: 'escalate_ticket',
      agentType: 'escalation_handler',
      agentRole: 'support',
      inputs: {
        urgency: 'critical',
        notifyTeam: true,
        slaTimer: true,
      },
      onSuccess: 'monitor-escalation',
      timeout: 120,
    },
    {
      id: 'escalate-to-handler',
      name: 'Escalate to Handler',
      description: 'Escalate complex issues to specialist',
      action: 'escalate_ticket',
      agentType: 'escalation_handler',
      agentRole: 'support',
      inputs: {
        urgency: 'high',
        includeContext: true,
        suggestResolution: true,
      },
      onSuccess: 'monitor-escalation',
      timeout: 300,
    },
    {
      id: 'escalate-to-manager',
      name: 'Escalate to Manager',
      description: 'Alert manager for triage failure',
      action: 'notify_manager',
      agentType: 'support_manager',
      agentRole: 'coordinator',
      inputs: {
        urgency: 'high',
        includeError: true,
      },
      timeout: 120,
    },
    {
      id: 'monitor-escalation',
      name: 'Monitor Escalation',
      description: 'Track escalated ticket progress',
      action: 'monitor_escalation',
      agentType: 'support_manager',
      agentRole: 'coordinator',
      inputs: {
        checkInterval: '1h',
        alertOnSlaRisk: true,
      },
      timeout: 300,
    },
  ],
  benefits: [
    'Reduce first response time by 80%',
    'Consistent quality across all responses',
    'Automatic routing of critical issues',
    'Reduced escalation rate with better initial responses',
    '24/7 support coverage',
  ],
  useCases: [
    'Customer support helpdesk',
    'Technical support',
    'Product support inquiries',
    'Billing questions',
    'Feature requests',
  ],
  estimatedDuration: '5-15 minutes per ticket',
  requiredAgentTypes: ['ticket_triage', 'response_generator', 'escalation_handler', 'support_manager'],
};

// ============================================================================
// EXPORTS
// ============================================================================

export const workflowTemplates: WorkflowTemplate[] = [
  leadToCustomerPipeline,
  contentCampaignWorkflow,
  supportTicketResolution,
];

export const workflowTemplatesById = {
  'lead-to-customer': leadToCustomerPipeline,
  'content-campaign': contentCampaignWorkflow,
  'support-ticket-resolution': supportTicketResolution,
} as const;

export type WorkflowTemplateId = keyof typeof workflowTemplatesById;

/**
 * Get a workflow template by ID
 */
export function getWorkflowTemplate(templateId: string): WorkflowTemplate | null {
  return workflowTemplatesById[templateId as WorkflowTemplateId] || null;
}

/**
 * Get all workflow templates for a department
 */
export function getWorkflowTemplatesByDepartment(
  department: AgentDepartment
): WorkflowTemplate[] {
  return workflowTemplates.filter((t) => t.department === department);
}

/**
 * Get all workflow templates for a category
 */
export function getWorkflowTemplatesByCategory(category: string): WorkflowTemplate[] {
  return workflowTemplates.filter((t) => t.category === category);
}

/**
 * Convert workflow template to workflow steps with agent IDs
 * Maps agent types to actual agent IDs from the workspace
 */
export function convertTemplateToSteps(
  template: WorkflowTemplate,
  agentMapping: Record<string, string> // agentType -> agentId
): WorkflowStep[] {
  return template.steps.map((stepTemplate) => {
    const agentId = agentMapping[stepTemplate.agentType];

    if (!agentId) {
      throw new Error(`No agent found for type: ${stepTemplate.agentType}`);
    }

    return {
      id: stepTemplate.id,
      name: stepTemplate.name,
      agentId,
      action: stepTemplate.action,
      inputs: stepTemplate.inputs,
      conditions: stepTemplate.conditions,
      onSuccess: stepTemplate.onSuccess,
      onFailure: stepTemplate.onFailure,
      timeout: stepTemplate.timeout,
      retryConfig: stepTemplate.retryConfig,
    };
  });
}

/**
 * Suggest a workflow template based on keywords
 */
export function suggestWorkflowTemplate(keywords: string[]): WorkflowTemplate | null {
  const keywordLower = keywords.map((k) => k.toLowerCase());

  let bestMatch: WorkflowTemplate | null = null;
  let bestScore = 0;

  for (const template of workflowTemplates) {
    let score = 0;

    // Check department/category
    if (keywordLower.some((k) => template.department.includes(k))) {
      score += 10;
    }
    if (keywordLower.some((k) => template.category.includes(k))) {
      score += 10;
    }

    // Check name
    if (keywordLower.some((k) => template.name.toLowerCase().includes(k))) {
      score += 8;
    }

    // Check use cases
    for (const useCase of template.useCases) {
      if (keywordLower.some((k) => useCase.toLowerCase().includes(k))) {
        score += 5;
      }
    }

    // Check benefits
    for (const benefit of template.benefits) {
      if (keywordLower.some((k) => benefit.toLowerCase().includes(k))) {
        score += 3;
      }
    }

    // Check step actions
    for (const step of template.steps) {
      if (keywordLower.some((k) => step.action.includes(k))) {
        score += 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = template;
    }
  }

  return bestScore > 0 ? bestMatch : null;
}

/**
 * Validate that all required agent types are available
 */
export function validateAgentAvailability(
  template: WorkflowTemplate,
  availableAgentTypes: string[]
): { valid: boolean; missingTypes: string[] } {
  const missingTypes = template.requiredAgentTypes.filter(
    (type) => !availableAgentTypes.includes(type)
  );

  return {
    valid: missingTypes.length === 0,
    missingTypes,
  };
}

