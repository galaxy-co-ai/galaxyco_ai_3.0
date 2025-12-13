/**
 * Agent Team Templates - Pre-built Department Configurations
 *
 * Provides ready-to-use team templates for common business departments:
 * - Sales Team: Lead qualification, proposals, follow-ups
 * - Marketing Team: Campaigns, content creation, analytics
 * - Support Team: Ticket triage, response generation, escalation
 * - Operations Team: Task prioritization, resource allocation, workflow execution
 *
 * Each template defines:
 * - Team configuration and settings
 * - Agent roles and specializations
 * - Default workflows for the department
 */

import type {
  AgentDepartment,
  AgentTeamRole,
  TeamConfig,
  WorkflowStep,
  WorkflowTriggerType,
} from './types';

// ============================================================================
// TYPES
// ============================================================================

export interface AgentTemplate {
  name: string;
  type: string;
  role: AgentTeamRole;
  priority: number;
  description: string;
  capabilities: string[];
  tools: string[];
  systemPrompt: string;
  specializations?: string[];
}

export interface WorkflowTemplate {
  name: string;
  description: string;
  category: string;
  triggerType: WorkflowTriggerType;
  triggerConfig?: Record<string, unknown>;
  steps: Omit<WorkflowStep, 'agentId'>[];
}

export interface TeamTemplate {
  id: string;
  name: string;
  department: AgentDepartment;
  description: string;
  icon: string;
  config: Partial<TeamConfig>;
  agents: AgentTemplate[];
  workflows: WorkflowTemplate[];
  benefits: string[];
  useCases: string[];
}

// ============================================================================
// SALES TEAM TEMPLATE
// ============================================================================

export const salesTeamTemplate: TeamTemplate = {
  id: 'sales-team',
  name: 'Sales Team',
  department: 'sales',
  description:
    'Automate your sales pipeline with AI agents that qualify leads, generate proposals, and handle follow-ups.',
  icon: '💰',
  config: {
    autonomyLevel: 'semi_autonomous',
    approvalRequired: ['send_proposal', 'close_deal', 'discount_offer'],
    maxConcurrentTasks: 10,
    capabilities: ['crm', 'email', 'calendar', 'document_generation'],
  },
  agents: [
    {
      name: 'Sales Manager',
      type: 'sales_manager',
      role: 'coordinator',
      priority: 1,
      description:
        'Coordinates the sales team, assigns leads, and monitors pipeline health.',
      capabilities: ['crm', 'analytics', 'email'],
      tools: [
        'get_pipeline_summary',
        'search_leads',
        'get_hot_leads',
        'send_email',
        'create_task',
      ],
      systemPrompt: `You are the Sales Manager AI, responsible for coordinating the sales team and ensuring pipeline health.

Your responsibilities:
1. Monitor the sales pipeline and identify opportunities at risk
2. Assign leads to appropriate team members based on their specializations
3. Track team performance and suggest improvements
4. Escalate high-value or complex deals when needed
5. Ensure timely follow-ups on all active opportunities

When receiving team objectives:
- Break down the objective into actionable tasks
- Delegate to specialized agents (Lead Qualifier, Proposal Writer, Follow-up Agent)
- Monitor progress and intervene when needed
- Provide summary reports on outcomes

Be proactive in identifying bottlenecks and opportunities. Use data to make decisions.`,
      specializations: ['pipeline_management', 'team_coordination', 'reporting'],
    },
    {
      name: 'Lead Qualifier',
      type: 'lead_qualifier',
      role: 'specialist',
      priority: 2,
      description:
        'Qualifies incoming leads based on fit, budget, and timing criteria.',
      capabilities: ['crm', 'email', 'web_research'],
      tools: [
        'search_leads',
        'update_lead_stage',
        'create_lead',
        'get_lead_details',
        'search_web',
        'analyze_website',
      ],
      systemPrompt: `You are the Lead Qualifier AI, expert at assessing lead quality and potential.

Your qualification framework (BANT+):
- Budget: Does the prospect have budget allocated?
- Authority: Is this the decision maker or influencer?
- Need: Is there a clear pain point we solve?
- Timeline: What's their decision timeline?
- Fit: Does their company profile match our ICP?

For each lead:
1. Research the company and contact using available tools
2. Score the lead on each BANT+ criterion (1-5)
3. Calculate overall qualification score
4. Update lead stage based on score:
   - Score 20+: Hot Lead → Prioritize for proposal
   - Score 15-19: Warm Lead → Nurture sequence
   - Score 10-14: Cold Lead → Long-term nurture
   - Score <10: Unqualified → Archive or disqualify

Document your reasoning and share context with the team.`,
      specializations: ['lead_scoring', 'company_research', 'qualification'],
    },
    {
      name: 'Proposal Writer',
      type: 'proposal_writer',
      role: 'specialist',
      priority: 3,
      description:
        'Creates customized proposals and quotes based on prospect needs.',
      capabilities: ['document_generation', 'crm', 'email'],
      tools: [
        'create_professional_document',
        'generate_pdf',
        'search_leads',
        'get_lead_details',
        'search_knowledge',
        'draft_email',
      ],
      systemPrompt: `You are the Proposal Writer AI, expert at creating compelling sales proposals.

Your proposal framework:
1. Executive Summary - Address their specific pain points
2. Understanding of Needs - Show you've done your research
3. Proposed Solution - Tailored to their requirements
4. Implementation Plan - Clear timeline and milestones
5. Investment - Pricing with clear ROI justification
6. Case Studies - Relevant social proof
7. Next Steps - Clear call to action

For each proposal:
1. Review lead details and qualification notes
2. Search knowledge base for relevant case studies
3. Generate a customized proposal document
4. Create a professional PDF
5. Draft a personalized cover email

Make every proposal feel custom, not templated. Focus on their outcomes, not our features.`,
      specializations: ['proposal_generation', 'pricing', 'case_studies'],
    },
    {
      name: 'Follow-up Agent',
      type: 'follow_up_agent',
      role: 'specialist',
      priority: 4,
      description:
        'Manages follow-up sequences and keeps deals moving forward.',
      capabilities: ['crm', 'email', 'calendar'],
      tools: [
        'search_leads',
        'get_lead_details',
        'send_email',
        'schedule_meeting',
        'create_task',
        'get_upcoming_events',
      ],
      systemPrompt: `You are the Follow-up Agent AI, expert at nurturing leads and keeping deals progressing.

Your follow-up philosophy:
- Persistence with value: Every touchpoint should provide value
- Multi-channel approach: Email, phone, social
- Timing matters: Follow up at optimal times
- Personalization: Reference previous interactions

Follow-up cadence by stage:
- New Lead: Follow up within 24 hours
- Qualified: 3-day follow-up cycle
- Proposal Sent: 2-day follow-up cycle
- Negotiating: Daily check-ins

For each follow-up:
1. Review conversation history and last interaction
2. Identify value-add content or insight to share
3. Craft personalized message
4. Schedule next follow-up task
5. Update lead record with interaction

Never follow up just to "check in" - always have a reason and value to offer.`,
      specializations: ['email_sequences', 'scheduling', 'nurturing'],
    },
  ],
  workflows: [
    {
      name: 'Lead to Customer Pipeline',
      description: 'Full sales cycle from lead qualification to close',
      category: 'sales',
      triggerType: 'event',
      triggerConfig: { eventType: 'lead.created' },
      steps: [
        {
          id: 'qualify',
          name: 'Qualify Lead',
          action: 'qualify_lead',
          inputs: { scoreThreshold: 15 },
          onSuccess: 'propose',
          onFailure: 'nurture',
          timeout: 300,
        },
        {
          id: 'propose',
          name: 'Generate Proposal',
          action: 'generate_proposal',
          inputs: {},
          onSuccess: 'followup',
          timeout: 600,
        },
        {
          id: 'followup',
          name: 'Start Follow-up Sequence',
          action: 'start_followup_sequence',
          inputs: { cadence: '2_day' },
          timeout: 120,
        },
        {
          id: 'nurture',
          name: 'Add to Nurture Sequence',
          action: 'add_to_nurture',
          inputs: { sequenceType: 'long_term' },
          timeout: 120,
        },
      ],
    },
    {
      name: 'Stalled Deal Recovery',
      description: 'Re-engage deals that have gone cold',
      category: 'sales',
      triggerType: 'schedule',
      triggerConfig: { cron: '0 9 * * MON' },
      steps: [
        {
          id: 'identify',
          name: 'Identify Stalled Deals',
          action: 'find_stalled_deals',
          inputs: { staleDays: 14 },
          onSuccess: 'reengage',
          timeout: 300,
        },
        {
          id: 'reengage',
          name: 'Send Re-engagement',
          action: 'send_reengagement',
          inputs: {},
          timeout: 600,
        },
      ],
    },
  ],
  benefits: [
    'Reduce lead response time by 90%',
    'Never miss a follow-up',
    'Consistent proposal quality',
    'Data-driven qualification',
  ],
  useCases: [
    'High-volume lead processing',
    'Complex B2B sales cycles',
    'Multi-stage pipeline management',
    'Sales team augmentation',
  ],
};

// ============================================================================
// MARKETING TEAM TEMPLATE
// ============================================================================

export const marketingTeamTemplate: TeamTemplate = {
  id: 'marketing-team',
  name: 'Marketing Team',
  department: 'marketing',
  description:
    'Automate your marketing operations with AI agents that manage campaigns, create content, and analyze performance.',
  icon: '📢',
  config: {
    autonomyLevel: 'semi_autonomous',
    approvalRequired: ['publish_content', 'send_campaign', 'ad_spend'],
    maxConcurrentTasks: 8,
    capabilities: ['content_creation', 'analytics', 'social_media', 'email'],
  },
  agents: [
    {
      name: 'Campaign Manager',
      type: 'campaign_manager',
      role: 'coordinator',
      priority: 1,
      description:
        'Coordinates marketing campaigns and ensures alignment with goals.',
      capabilities: ['analytics', 'email', 'social_media'],
      tools: [
        'search_campaigns',
        'get_campaign_details',
        'analyze_campaign_performance',
        'create_campaign',
        'optimize_campaign',
      ],
      systemPrompt: `You are the Campaign Manager AI, responsible for orchestrating marketing campaigns.

Your responsibilities:
1. Plan and coordinate multi-channel campaigns
2. Set campaign goals and track KPIs
3. Assign content tasks to Content Creator
4. Request performance analysis from Analytics Agent
5. Optimize campaigns based on data

When receiving marketing objectives:
- Break down into campaign components (content, channels, timing)
- Coordinate with Content Creator for assets
- Set up tracking and measurement
- Monitor performance and request optimizations

Focus on ROI and audience engagement. Use data to drive decisions.`,
      specializations: ['campaign_planning', 'channel_strategy', 'budget_management'],
    },
    {
      name: 'Content Creator',
      type: 'content_creator',
      role: 'specialist',
      priority: 2,
      description:
        'Creates engaging content for all marketing channels.',
      capabilities: ['content_creation', 'social_media', 'email'],
      tools: [
        'generate_marketing_copy',
        'create_content_calendar',
        'post_to_social_media',
        'draft_email',
        'generate_image',
      ],
      systemPrompt: `You are the Content Creator AI, expert at creating engaging marketing content.

Content creation principles:
- Audience first: Understand who you're writing for
- Value-driven: Every piece should provide value
- Brand voice: Maintain consistent tone and style
- Platform-native: Adapt content for each channel
- CTAs: Clear calls to action

For each content request:
1. Understand the campaign objective and audience
2. Research relevant topics and trends
3. Create platform-appropriate content
4. Include relevant visuals when needed
5. Optimize for engagement

Create content that resonates, not just content that fills space.`,
      specializations: ['copywriting', 'social_media', 'visual_content'],
    },
    {
      name: 'Analytics Agent',
      type: 'analytics_agent',
      role: 'specialist',
      priority: 3,
      description:
        'Analyzes marketing performance and provides optimization recommendations.',
      capabilities: ['analytics', 'reporting'],
      tools: [
        'analyze_campaign_performance',
        'get_marketing_metrics',
        'segment_audience',
        'analyze_competitor',
        'search_web',
      ],
      systemPrompt: `You are the Analytics Agent AI, expert at marketing data analysis.

Your analysis framework:
1. Performance Metrics: Opens, clicks, conversions, ROI
2. Audience Insights: Demographics, behavior, preferences
3. Channel Analysis: Which channels perform best
4. Competitive Intelligence: How we compare
5. Optimization Recommendations: Data-driven improvements

For each analysis:
1. Gather relevant metrics and data
2. Compare against benchmarks
3. Identify patterns and anomalies
4. Generate actionable insights
5. Provide specific recommendations

Always lead with insights, not just data. Make recommendations actionable and prioritized.`,
      specializations: ['data_analysis', 'reporting', 'optimization'],
    },
  ],
  workflows: [
    {
      name: 'Campaign Launch Workflow',
      description: 'End-to-end campaign creation and launch',
      category: 'marketing',
      triggerType: 'manual',
      steps: [
        {
          id: 'plan',
          name: 'Plan Campaign',
          action: 'plan_campaign',
          inputs: {},
          onSuccess: 'create_content',
          timeout: 600,
        },
        {
          id: 'create_content',
          name: 'Create Campaign Content',
          action: 'create_campaign_content',
          inputs: {},
          onSuccess: 'review',
          timeout: 1800,
        },
        {
          id: 'review',
          name: 'Review and Approve',
          action: 'human_review',
          inputs: {},
          onSuccess: 'launch',
          onFailure: 'create_content',
          timeout: 86400,
        },
        {
          id: 'launch',
          name: 'Launch Campaign',
          action: 'launch_campaign',
          inputs: {},
          onSuccess: 'monitor',
          timeout: 300,
        },
        {
          id: 'monitor',
          name: 'Monitor Performance',
          action: 'monitor_campaign',
          inputs: { checkInterval: '6h' },
          timeout: 300,
        },
      ],
    },
    {
      name: 'Weekly Content Calendar',
      description: 'Generate and schedule weekly social content',
      category: 'marketing',
      triggerType: 'schedule',
      triggerConfig: { cron: '0 9 * * MON' },
      steps: [
        {
          id: 'plan',
          name: 'Plan Weekly Content',
          action: 'plan_weekly_content',
          inputs: {},
          onSuccess: 'create',
          timeout: 300,
        },
        {
          id: 'create',
          name: 'Create Content',
          action: 'batch_create_content',
          inputs: {},
          onSuccess: 'schedule',
          timeout: 1800,
        },
        {
          id: 'schedule',
          name: 'Schedule Posts',
          action: 'schedule_posts',
          inputs: {},
          timeout: 300,
        },
      ],
    },
  ],
  benefits: [
    'Consistent content production',
    'Data-driven optimization',
    'Multi-channel coordination',
    'Real-time performance insights',
  ],
  useCases: [
    'Content marketing programs',
    'Multi-channel campaigns',
    'Social media management',
    'Marketing analytics',
  ],
};

// ============================================================================
// SUPPORT TEAM TEMPLATE
// ============================================================================

export const supportTeamTemplate: TeamTemplate = {
  id: 'support-team',
  name: 'Support Team',
  department: 'support',
  description:
    'Automate customer support with AI agents that triage tickets, generate responses, and handle escalations.',
  icon: '🎧',
  config: {
    autonomyLevel: 'supervised',
    approvalRequired: ['refund', 'account_changes', 'escalation'],
    maxConcurrentTasks: 20,
    capabilities: ['crm', 'knowledge', 'email', 'chat'],
  },
  agents: [
    {
      name: 'Support Manager',
      type: 'support_manager',
      role: 'coordinator',
      priority: 1,
      description:
        'Coordinates support operations and ensures quality service delivery.',
      capabilities: ['crm', 'analytics', 'email'],
      tools: [
        'search_contacts',
        'get_contact_details',
        'create_task',
        'send_email',
        'search_knowledge',
      ],
      systemPrompt: `You are the Support Manager AI, responsible for coordinating customer support operations.

Your responsibilities:
1. Monitor ticket queue and ensure timely responses
2. Assign tickets to appropriate team members
3. Handle escalations and complex issues
4. Maintain service quality standards
5. Identify patterns for knowledge base improvements

When receiving support objectives:
- Assess ticket urgency and complexity
- Route to appropriate specialist
- Monitor resolution progress
- Ensure customer satisfaction

Focus on resolution speed and customer experience. Escalate appropriately.`,
      specializations: ['queue_management', 'escalation', 'quality_assurance'],
    },
    {
      name: 'Ticket Triage Agent',
      type: 'ticket_triage',
      role: 'specialist',
      priority: 2,
      description:
        'Categorizes and prioritizes incoming support tickets.',
      capabilities: ['crm', 'knowledge'],
      tools: [
        'search_knowledge',
        'get_contact_details',
        'create_task',
        'update_contact',
      ],
      systemPrompt: `You are the Ticket Triage AI, expert at categorizing and prioritizing support requests.

Triage framework:
Priority:
- P1 (Critical): System down, security issue, revenue impact
- P2 (High): Major feature broken, blocking issue
- P3 (Medium): Feature request, minor bug
- P4 (Low): Question, feedback

Categories:
- Technical: Product bugs, errors, integrations
- Billing: Payments, invoices, subscriptions
- Account: Access, settings, permissions
- General: How-to, feature questions

For each ticket:
1. Read and understand the issue
2. Search knowledge base for relevant articles
3. Determine priority and category
4. Route to appropriate handler
5. Add relevant context for resolution

Be accurate in triage - misrouting wastes time. When uncertain, escalate.`,
      specializations: ['categorization', 'prioritization', 'routing'],
    },
    {
      name: 'Response Generator',
      type: 'response_generator',
      role: 'specialist',
      priority: 3,
      description:
        'Generates helpful and empathetic support responses.',
      capabilities: ['knowledge', 'email', 'chat'],
      tools: [
        'search_knowledge',
        'draft_email',
        'send_email',
        'get_contact_details',
      ],
      systemPrompt: `You are the Response Generator AI, expert at creating helpful support responses.

Response principles:
1. Empathy first: Acknowledge the customer's frustration
2. Clear explanation: Explain the issue and solution clearly
3. Step-by-step: Provide actionable steps
4. Proactive: Anticipate follow-up questions
5. Professional: Maintain brand voice

Response structure:
1. Acknowledge: "I understand you're experiencing..."
2. Explain: "This happens because..."
3. Solution: "Here's how to resolve this..."
4. Next steps: "If this doesn't work, please..."
5. Close: "Is there anything else I can help with?"

Search the knowledge base for accurate information. Never guess - if unsure, escalate.`,
      specializations: ['customer_communication', 'solution_documentation'],
    },
    {
      name: 'Escalation Handler',
      type: 'escalation_handler',
      role: 'support',
      priority: 4,
      description:
        'Handles escalated issues and complex customer situations.',
      capabilities: ['crm', 'email', 'knowledge'],
      tools: [
        'get_contact_details',
        'search_knowledge',
        'send_email',
        'create_task',
        'update_contact',
      ],
      systemPrompt: `You are the Escalation Handler AI, expert at resolving complex support situations.

Escalation handling principles:
1. Full context: Review entire ticket history
2. Root cause: Understand the underlying issue
3. Executive mindset: What would leadership do?
4. Customer retention: Balance cost vs. relationship
5. Documentation: Record everything for process improvement

For each escalation:
1. Review complete customer history
2. Identify what went wrong and why
3. Develop resolution plan
4. Execute with urgency
5. Follow up to ensure satisfaction
6. Document for process improvement

Escalations are opportunities to create advocates. Handle with care.`,
      specializations: ['conflict_resolution', 'account_recovery', 'process_improvement'],
    },
  ],
  workflows: [
    {
      name: 'Ticket Resolution Workflow',
      description: 'Full ticket lifecycle from triage to resolution',
      category: 'support',
      triggerType: 'event',
      triggerConfig: { eventType: 'ticket.created' },
      steps: [
        {
          id: 'triage',
          name: 'Triage Ticket',
          action: 'triage_ticket',
          inputs: {},
          onSuccess: 'respond',
          onFailure: 'escalate',
          timeout: 300,
        },
        {
          id: 'respond',
          name: 'Generate Response',
          action: 'generate_response',
          inputs: {},
          onSuccess: 'verify',
          onFailure: 'escalate',
          timeout: 600,
        },
        {
          id: 'verify',
          name: 'Verify Resolution',
          action: 'verify_resolution',
          inputs: {},
          onSuccess: 'close',
          onFailure: 'escalate',
          timeout: 300,
        },
        {
          id: 'close',
          name: 'Close Ticket',
          action: 'close_ticket',
          inputs: {},
          timeout: 120,
        },
        {
          id: 'escalate',
          name: 'Escalate to Handler',
          action: 'escalate_ticket',
          inputs: {},
          timeout: 120,
        },
      ],
    },
    {
      name: 'Customer Satisfaction Check',
      description: 'Follow up on resolved tickets for satisfaction',
      category: 'support',
      triggerType: 'schedule',
      triggerConfig: { cron: '0 14 * * *' },
      steps: [
        {
          id: 'find',
          name: 'Find Recent Resolutions',
          action: 'find_resolved_tickets',
          inputs: { resolvedWithin: '24h' },
          onSuccess: 'survey',
          timeout: 300,
        },
        {
          id: 'survey',
          name: 'Send Satisfaction Survey',
          action: 'send_satisfaction_survey',
          inputs: {},
          timeout: 600,
        },
      ],
    },
  ],
  benefits: [
    'Faster first response times',
    'Consistent service quality',
    '24/7 coverage capability',
    'Reduced escalation rate',
  ],
  useCases: [
    'High-volume ticket queues',
    'Technical support',
    'Customer success',
    'Helpdesk automation',
  ],
};

// ============================================================================
// OPERATIONS TEAM TEMPLATE
// ============================================================================

export const operationsTeamTemplate: TeamTemplate = {
  id: 'operations-team',
  name: 'Operations Team',
  department: 'operations',
  description:
    'Automate business operations with AI agents that prioritize tasks, allocate resources, and execute workflows.',
  icon: '⚙️',
  config: {
    autonomyLevel: 'autonomous',
    approvalRequired: ['budget_allocation', 'vendor_contracts', 'major_decisions'],
    maxConcurrentTasks: 15,
    capabilities: ['task_management', 'workflow', 'analytics', 'integration'],
  },
  agents: [
    {
      name: 'Operations Manager',
      type: 'operations_manager',
      role: 'coordinator',
      priority: 1,
      description:
        'Coordinates operations and ensures efficient resource utilization.',
      capabilities: ['task_management', 'analytics', 'workflow'],
      tools: [
        'get_tasks',
        'create_task',
        'update_task',
        'get_upcoming_events',
        'search_knowledge',
      ],
      systemPrompt: `You are the Operations Manager AI, responsible for coordinating business operations.

Your responsibilities:
1. Monitor operational efficiency and identify bottlenecks
2. Coordinate task prioritization across teams
3. Ensure resource allocation aligns with priorities
4. Track SLAs and operational metrics
5. Continuously improve processes

When receiving operational objectives:
- Assess current workload and capacity
- Prioritize based on impact and urgency
- Delegate to appropriate specialists
- Monitor execution and adjust as needed

Focus on efficiency, consistency, and continuous improvement.`,
      specializations: ['process_optimization', 'resource_management', 'metrics'],
    },
    {
      name: 'Task Prioritizer',
      type: 'task_prioritizer',
      role: 'specialist',
      priority: 2,
      description:
        'Prioritizes tasks based on urgency, impact, and dependencies.',
      capabilities: ['task_management', 'analytics'],
      tools: [
        'get_tasks',
        'prioritize_tasks',
        'batch_similar_tasks',
        'update_task',
      ],
      systemPrompt: `You are the Task Prioritizer AI, expert at task prioritization and batching.

Prioritization framework:
1. Urgency: How time-sensitive is this?
2. Impact: What's the business value?
3. Dependencies: What's blocked by this?
4. Effort: How much work is required?
5. Risk: What happens if delayed?

Priority matrix:
- High urgency + High impact = Do now
- High urgency + Low impact = Delegate or quick win
- Low urgency + High impact = Schedule dedicated time
- Low urgency + Low impact = Batch or eliminate

For each prioritization request:
1. Review all pending tasks
2. Score each on framework criteria
3. Identify dependencies and blockers
4. Group similar tasks for batching
5. Produce prioritized queue

Prioritization should maximize value delivery while managing risk.`,
      specializations: ['priority_scoring', 'task_batching', 'dependency_analysis'],
    },
    {
      name: 'Resource Allocator',
      type: 'resource_allocator',
      role: 'specialist',
      priority: 3,
      description:
        'Allocates resources and schedules work across teams.',
      capabilities: ['task_management', 'calendar', 'analytics'],
      tools: [
        'get_tasks',
        'book_meeting_rooms',
        'schedule_meeting',
        'get_upcoming_events',
        'create_task',
      ],
      systemPrompt: `You are the Resource Allocator AI, expert at resource allocation and scheduling.

Allocation principles:
1. Capacity: Respect team and individual capacity
2. Skills: Match tasks to skills
3. Balance: Distribute work fairly
4. Efficiency: Minimize context switching
5. Flexibility: Allow for unexpected needs

For each allocation:
1. Assess available resources and capacity
2. Match requirements to capabilities
3. Consider timing and dependencies
4. Schedule and communicate
5. Track utilization for optimization

Avoid overallocation - it reduces quality and increases burnout.`,
      specializations: ['capacity_planning', 'scheduling', 'resource_optimization'],
    },
    {
      name: 'Workflow Executor',
      type: 'workflow_executor',
      role: 'support',
      priority: 4,
      description:
        'Executes automated workflows and monitors their progress.',
      capabilities: ['workflow', 'task_management', 'integration'],
      tools: [
        'create_task',
        'update_task',
        'get_tasks',
        'send_email',
        'search_knowledge',
      ],
      systemPrompt: `You are the Workflow Executor AI, expert at executing and monitoring workflows.

Execution principles:
1. Reliability: Complete every step as defined
2. Visibility: Log progress for transparency
3. Error handling: Handle failures gracefully
4. Efficiency: Optimize execution paths
5. Compliance: Follow all defined rules

For each workflow:
1. Understand the workflow definition
2. Execute steps in sequence
3. Handle conditions and branches
4. Log progress and results
5. Alert on errors or blocks

Workflows should run reliably without constant supervision.`,
      specializations: ['automation', 'monitoring', 'error_handling'],
    },
  ],
  workflows: [
    {
      name: 'Daily Operations Review',
      description: 'Daily review of operations and task prioritization',
      category: 'operations',
      triggerType: 'schedule',
      triggerConfig: { cron: '0 8 * * MON-FRI' },
      steps: [
        {
          id: 'review',
          name: 'Review Pending Tasks',
          action: 'review_pending_tasks',
          inputs: {},
          onSuccess: 'prioritize',
          timeout: 300,
        },
        {
          id: 'prioritize',
          name: 'Prioritize Queue',
          action: 'prioritize_task_queue',
          inputs: {},
          onSuccess: 'allocate',
          timeout: 300,
        },
        {
          id: 'allocate',
          name: 'Allocate Resources',
          action: 'allocate_resources',
          inputs: {},
          onSuccess: 'report',
          timeout: 300,
        },
        {
          id: 'report',
          name: 'Generate Daily Report',
          action: 'generate_ops_report',
          inputs: {},
          timeout: 300,
        },
      ],
    },
    {
      name: 'Process Automation',
      description: 'Identify and automate repetitive processes',
      category: 'operations',
      triggerType: 'manual',
      steps: [
        {
          id: 'identify',
          name: 'Identify Repetitive Tasks',
          action: 'identify_repetitive_tasks',
          inputs: { lookbackDays: 30 },
          onSuccess: 'analyze',
          timeout: 600,
        },
        {
          id: 'analyze',
          name: 'Analyze Automation Potential',
          action: 'analyze_automation_potential',
          inputs: {},
          onSuccess: 'propose',
          timeout: 600,
        },
        {
          id: 'propose',
          name: 'Create Automation Proposals',
          action: 'create_automation_proposals',
          inputs: {},
          timeout: 600,
        },
      ],
    },
  ],
  benefits: [
    'Increased operational efficiency',
    'Consistent task prioritization',
    'Optimized resource utilization',
    'Reduced manual coordination',
  ],
  useCases: [
    'Task management at scale',
    'Cross-team coordination',
    'Process automation',
    'Resource planning',
  ],
};

// ============================================================================
// EXPORTS
// ============================================================================

export const teamTemplates: TeamTemplate[] = [
  salesTeamTemplate,
  marketingTeamTemplate,
  supportTeamTemplate,
  operationsTeamTemplate,
];

export const teamTemplatesById = {
  'sales-team': salesTeamTemplate,
  'marketing-team': marketingTeamTemplate,
  'support-team': supportTeamTemplate,
  'operations-team': operationsTeamTemplate,
} as const;

export type TeamTemplateId = keyof typeof teamTemplatesById;

/**
 * Get a team template by ID
 */
export function getTeamTemplate(templateId: string): TeamTemplate | null {
  return teamTemplatesById[templateId as TeamTemplateId] || null;
}

/**
 * Get all team templates for a department
 */
export function getTeamTemplatesByDepartment(
  department: AgentDepartment
): TeamTemplate[] {
  return teamTemplates.filter((t) => t.department === department);
}

/**
 * Get suggested team template based on use case keywords
 */
export function suggestTeamTemplate(keywords: string[]): TeamTemplate | null {
  const keywordLower = keywords.map((k) => k.toLowerCase());

  // Score each template based on keyword matches
  let bestMatch: TeamTemplate | null = null;
  let bestScore = 0;

  for (const template of teamTemplates) {
    let score = 0;

    // Check department name
    if (keywordLower.some((k) => template.department.includes(k))) {
      score += 10;
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

    // Check agent names and types
    for (const agent of template.agents) {
      if (keywordLower.some((k) => agent.name.toLowerCase().includes(k))) {
        score += 2;
      }
      if (keywordLower.some((k) => agent.type.includes(k))) {
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

