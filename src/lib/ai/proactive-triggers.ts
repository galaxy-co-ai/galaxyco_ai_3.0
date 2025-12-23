/**
 * Proactive Trigger Engine (Phase 2C - Neptune Transformation)
 * 
 * Enables Neptune to lead conversations by detecting patterns in workspace state
 * and suggesting relevant actions before the user even asks.
 * 
 * ## Philosophy:
 * 
 * Traditional assistants are **reactive** - they wait for commands.  
 * Neptune is **proactive** - it notices opportunities and suggests next steps.
 * 
 * ## How It Works:
 * 
 * 1. **Context Analysis**: Every message, Neptune analyzes workspace state
 * 2. **Trigger Matching**: Evaluates all triggers against current context
 * 3. **Priority Ranking**: Selects highest-priority matching trigger
 * 4. **Injection**: Adds trigger to system prompt as a suggestion
 * 5. **Natural Mention**: GPT-4o weaves suggestion into conversation
 * 
 * ## Trigger Categories:
 * 
 * ### CRM (Customer Relationship Management)
 * - Empty CRM → Suggest first lead creation
 * - Hot leads → Prioritize closing high-value deals
 * - Stale leads → Automate qualification process
 * 
 * ### Automation
 * - No agents → Introduce agent capabilities
 * - Underutilized agents → Optimize agent usage
 * - Manual patterns → Suggest automation
 * 
 * ### Tasks
 * - Overdue tasks → Prioritize and reschedule
 * - Many pending → Help with prioritization
 * - No task system → Introduce task management
 * 
 * ### Marketing
 * - No campaigns → Set up first campaign
 * - Low engagement → Optimize existing campaigns
 * - Inactive campaigns → Resume or archive
 * 
 * ### Finance
 * - Overdue invoices → Send reminders
 * - Anomalies → Flag unusual transactions
 * - No tracking → Set up finance monitoring
 * 
 * ### Calendar
 * - Free today → Suggest productive actions
 * - Back-to-back meetings → Suggest breaks
 * - No scheduling → Introduce calendar features
 * 
 * ### Knowledge
 * - Empty knowledge base → Suggest document organization
 * - Disorganized docs → Offer to categorize
 * 
 * ## Priority System:
 * 
 * **10 (Critical)**: Immediate attention needed (empty CRM, overdue tasks)
 * **9 (High)**: Important opportunities (hot leads, high-value pipeline)
 * **8 (Medium-High)**: Optimization opportunities (automation gaps)
 * **7 (Medium)**: Improvements (stale leads, underutilized features)
 * **6 (Low-Medium)**: Nice-to-haves (organization, cleanup)
 * **5 and below**: Optional suggestions
 * 
 * ## Example Flow:
 * 
 * ```
 * Workspace State:
 * - 15 leads in CRM
 * - 0 agents created
 * - 5 leads stuck in "new" stage
 * 
 * Triggered: "leads-no-automation" (priority 8)
 * 
 * Neptune Response:
 * "You have 15 leads but no automation set up. Want me to build 
 * a lead qualifier agent? Takes 10 seconds and will automatically 
 * score and prioritize your leads."
 * 
 * User: "Yes"
 * 
 * Neptune: *Executes create_agent_quick*
 * "Done! Your lead qualifier agent is running now."
 * ```
 * 
 * ## Performance:
 * 
 * - **Trigger Evaluation**: <5ms (pure JavaScript conditions)
 * - **Runs**: Every message (lightweight)
 * - **Injection**: Adds ~50-100 tokens to system prompt
 * - **No API Calls**: Pattern matching only, no external dependencies
 * 
 * ## Design Principles:
 * 
 * 1. **Context-Aware**: Only trigger when actually relevant
 * 2. **Action-Oriented**: Always include concrete next steps
 * 3. **Non-Intrusive**: Suggestions, not commands
 * 4. **Value-Focused**: Trigger on opportunities, not problems
 * 5. **Tool-Enabled**: Always include suggested tool calls
 * 
 * @example
 * ```typescript
 * // Evaluate triggers against current context
 * const trigger = evaluateProactiveTriggers(aiContext);
 * 
 * if (trigger) {
 *   console.log(`Triggered: ${trigger.title}`);
 *   console.log(`Suggestion: ${trigger.suggestedResponse}`);
 *   console.log(`Tools: ${trigger.suggestedTools.join(', ')}`);
 * }
 * ```
 */

import type { AIContextData } from './context';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ProactiveTrigger {
  id: string;
  priority: number; // 1-10 (10 = most urgent)
  title: string;
  description: string;
  condition: (context: AIContextData) => boolean;
  suggestedResponse: string;
  suggestedTools: string[];
  category: 'crm' | 'automation' | 'tasks' | 'marketing' | 'finance' | 'calendar' | 'knowledge';
}

// ============================================================================
// TRIGGER DEFINITIONS
// ============================================================================

export const PROACTIVE_TRIGGERS: ProactiveTrigger[] = [
  // ========================================
  // CRM TRIGGERS
  // ========================================
  {
    id: 'empty-crm',
    priority: 10,
    title: 'Empty CRM',
    category: 'crm',
    description: 'No leads in the system',
    condition: (ctx) => ctx.crm.totalLeads === 0 && ctx.crm.totalContacts === 0,
    suggestedResponse: "Your CRM is empty. Got a customer list I can help import? Or want me to show you how to add your first lead?",
    suggestedTools: ['create_lead', 'create_contact'],
  },
  
  {
    id: 'hot-leads-need-attention',
    priority: 9,
    title: 'Hot Leads Ready to Close',
    category: 'crm',
    description: 'Multiple leads in late-stage pipeline',
    condition: (ctx) => ctx.crm.hotLeads.length >= 3,
    suggestedResponse: "You've got multiple hot leads in proposal/negotiation. Want me to help prioritize them or draft follow-ups?",
    suggestedTools: ['create_task', 'send_email'],
  },
  
  {
    id: 'stale-leads',
    priority: 7,
    title: 'Stale Leads in Pipeline',
    category: 'crm',
    description: 'Leads stuck in pipeline stages',
    condition: (ctx) => ctx.crm.totalLeads > 10 && ctx.crm.leadsByStage['new'] > 5,
    suggestedResponse: "You have several leads stuck in 'new' stage. Want me to help qualify them or set up an automation to move them along?",
    suggestedTools: ['create_agent_quick', 'update_lead'],
  },
  
  {
    id: 'high-value-pipeline',
    priority: 8,
    title: 'High-Value Pipeline Needs Focus',
    category: 'crm',
    description: 'Significant pipeline value at risk',
    condition: (ctx) => ctx.crm.totalPipelineValue > 50000 && ctx.crm.hotLeads.length > 0,
    suggestedResponse: "Your pipeline has significant value. Let me help you focus on the highest-value deals to close them faster.",
    suggestedTools: ['create_task', 'create_document'],
  },
  
  // ========================================
  // AUTOMATION TRIGGERS
  // ========================================
  {
    id: 'leads-no-automation',
    priority: 8,
    title: 'Leads Without Automation',
    category: 'automation',
    description: 'CRM has leads but no agents',
    condition: (ctx) => ctx.crm.totalLeads >= 5 && ctx.agents.activeAgents === 0,
    suggestedResponse: "You have multiple leads but no automation. Let me build a lead qualifier agent - takes 10 seconds and will score/prioritize them automatically.",
    suggestedTools: ['create_agent_quick'],
  },
  
  {
    id: 'no-agents',
    priority: 7,
    title: 'No AI Agents Created',
    category: 'automation',
    description: 'User has not created any agents',
    condition: (ctx) => ctx.agents.activeAgents === 0 && (ctx.crm.totalLeads > 0 || ctx.tasks.pendingTasks > 0),
    suggestedResponse: "You haven't created any AI agents yet. They can automate repetitive tasks like lead follow-ups or email responses. Want me to show you?",
    suggestedTools: ['create_agent_quick', 'list_agent_templates'],
  },
  
  {
    id: 'underutilized-agents',
    priority: 6,
    title: 'Underutilized Agents',
    category: 'automation',
    description: 'Agents exist but rarely execute',
    condition: (ctx) => ctx.agents.activeAgents > 0 && ctx.agents.totalExecutions < ctx.agents.activeAgents * 5,
    suggestedResponse: "You have agents but they're barely running. Want me to check if they're configured correctly or suggest better use cases?",
    suggestedTools: ['list_agents', 'update_agent'],
  },
  
  // ========================================
  // TASK MANAGEMENT TRIGGERS
  // ========================================
  {
    id: 'overdue-tasks',
    priority: 9,
    title: 'Multiple Overdue Tasks',
    category: 'tasks',
    description: 'User has overdue tasks',
    condition: (ctx) => ctx.tasks.overdueTasks >= 3,
    suggestedResponse: "Heads up - multiple overdue tasks. Want to reschedule them or knock them out together? I can help prioritize.",
    suggestedTools: ['list_tasks', 'update_task', 'delete_task'],
  },
  
  {
    id: 'high-priority-tasks',
    priority: 8,
    title: 'High Priority Tasks Pending',
    category: 'tasks',
    description: 'Multiple high-priority tasks waiting',
    condition: (ctx) => ctx.tasks.highPriorityTasks.length >= 3,
    suggestedResponse: "You've got multiple high-priority tasks on your plate. Want me to help you tackle the most important one first?",
    suggestedTools: ['list_tasks', 'create_agent_quick'],
  },
  
  {
    id: 'task-backlog',
    priority: 6,
    title: 'Growing Task Backlog',
    category: 'tasks',
    description: 'Many pending tasks accumulating',
    condition: (ctx) => ctx.tasks.pendingTasks >= 10,
    suggestedResponse: "Your task list is growing. Want me to help organize them by priority or identify what can be automated?",
    suggestedTools: ['list_tasks', 'create_agent_quick'],
  },
  
  // ========================================
  // MARKETING TRIGGERS
  // ========================================
  {
    id: 'low-performing-campaigns',
    priority: 7,
    title: 'Campaign Performance Issues',
    category: 'marketing',
    description: 'Campaigns with low engagement',
    condition: (ctx) => {
      if (!ctx.marketing) return false;
      const avgOpenRate = parseFloat(ctx.marketing.campaignStats.avgOpenRate.replace('%', ''));
      return avgOpenRate > 0 && avgOpenRate < 15 && ctx.marketing.totalCampaigns > 2;
    },
    suggestedResponse: "Your campaigns have low open rates (below industry average of 21%). Want optimization tips to improve engagement?",
    suggestedTools: ['analyze_campaign', 'create_campaign'],
  },
  
  {
    id: 'no-marketing-campaigns',
    priority: 6,
    title: 'No Marketing Campaigns',
    category: 'marketing',
    description: 'No active marketing efforts',
    condition: (ctx) => ctx.crm.totalLeads > 5 && (!ctx.marketing || ctx.marketing.totalCampaigns === 0),
    suggestedResponse: "You have leads but no marketing campaigns. Want me to help create an email campaign or nurture sequence to engage them?",
    suggestedTools: ['create_campaign', 'create_agent_quick'],
  },
  
  {
    id: 'successful-campaigns-to-scale',
    priority: 5,
    title: 'Successful Campaigns to Scale',
    category: 'marketing',
    description: 'High-performing campaigns worth expanding',
    condition: (ctx) => {
      if (!ctx.marketing) return false;
      const avgOpenRate = parseFloat(ctx.marketing.campaignStats.avgOpenRate.replace('%', ''));
      return avgOpenRate >= 25 && ctx.marketing.activeCampaigns.length > 0;
    },
    suggestedResponse: "Your campaigns are crushing it with high open rates! Want to scale these winners or replicate the success?",
    suggestedTools: ['create_campaign', 'analyze_campaign'],
  },
  
  // ========================================
  // FINANCE TRIGGERS
  // ========================================
  {
    id: 'overdue-invoices',
    priority: 9,
    title: 'Overdue Invoices',
    category: 'finance',
    description: 'Multiple invoices past due',
    condition: (ctx) => {
      if (!ctx.finance?.recentInvoices) return false;
      const overdueCount = ctx.finance.recentInvoices.filter(inv => inv.status === 'overdue').length;
      return overdueCount >= 2;
    },
    suggestedResponse: "You have overdue invoices that need attention. Want me to draft payment reminder emails or show you the details?",
    suggestedTools: ['list_invoices', 'send_email'],
  },
  
  {
    id: 'negative-cashflow',
    priority: 10,
    title: 'Negative Cash Flow Alert',
    category: 'finance',
    description: 'Expenses exceeding revenue',
    condition: (ctx) => {
      if (!ctx.finance?.summary) return false;
      return ctx.finance.summary.cashflow < 0;
    },
    suggestedResponse: "Cash flow is negative this period. Want me to analyze your expenses or help prioritize revenue-generating activities?",
    suggestedTools: ['analyze_expenses', 'create_invoice'],
  },
  
  // ========================================
  // CALENDAR TRIGGERS
  // ========================================
  {
    id: 'busy-day-ahead',
    priority: 7,
    title: 'Busy Day Ahead',
    category: 'calendar',
    description: 'Many meetings scheduled today',
    condition: (ctx) => ctx.calendar.todayEventCount >= 4,
    suggestedResponse: "Busy day with many meetings scheduled. Want me to prep agendas or block focus time between calls?",
    suggestedTools: ['list_events', 'create_document'],
  },
  
  {
    id: 'meeting-heavy-week',
    priority: 5,
    title: 'Meeting-Heavy Week',
    category: 'calendar',
    description: 'Overbooked calendar',
    condition: (ctx) => ctx.calendar.thisWeekEventCount >= 15,
    suggestedResponse: "You have many meetings this week. Want me to help identify what could be async or consolidated?",
    suggestedTools: ['list_events', 'update_event'],
  },
  
  // ========================================
  // KNOWLEDGE & ONBOARDING TRIGGERS
  // ========================================
  {
    id: 'new-workspace',
    priority: 10,
    title: 'Brand New Workspace',
    category: 'knowledge',
    description: 'User just started, needs onboarding',
    condition: (ctx) => {
      const isEmpty = ctx.crm.totalLeads === 0 && 
                      ctx.crm.totalContacts === 0 && 
                      ctx.agents.activeAgents === 0 &&
                      ctx.tasks.pendingTasks === 0;
      return isEmpty && !ctx.website?.hasAnalysis;
    },
    suggestedResponse: "Hey! Brand new workspace - exciting! Drop your company website and I'll analyze it, then build you a personalized setup plan. What's your URL?",
    suggestedTools: ['analyze_company_website'],
  },
  
  {
    id: 'website-analyzed-no-action',
    priority: 7,
    title: 'Website Analyzed But No Progress',
    category: 'knowledge',
    description: 'User analyzed website but hasn\'t started setup',
    condition: (ctx) => {
      return ctx.website?.hasAnalysis === true &&
             ctx.crm.totalLeads === 0 &&
             ctx.agents.activeAgents === 0;
    },
    suggestedResponse: "I analyzed your website, but you haven't set anything up yet. Want me to walk you through adding your first lead or creating an automation?",
    suggestedTools: ['create_lead', 'create_agent_quick'],
  },
];

// ============================================================================
// TRIGGER DETECTION ENGINE
// ============================================================================

/**
 * Detect which triggers are currently active based on workspace context
 * @param context Current AI context data
 * @returns Array of active triggers, sorted by priority (highest first)
 */
export function detectTriggers(context: AIContextData): ProactiveTrigger[] {
  try {
    // Filter triggers where condition is true
    const activeTriggers = PROACTIVE_TRIGGERS.filter(trigger => {
      try {
        return trigger.condition(context);
      } catch (error) {
        logger.warn('[ProactiveTriggers] Trigger condition failed', {
          triggerId: trigger.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return false;
      }
    });
    
    // Sort by priority (highest first)
    const sortedTriggers = activeTriggers.sort((a, b) => b.priority - a.priority);
    
    // Return top 3 most urgent
    const topTriggers = sortedTriggers.slice(0, 3);
    
    if (topTriggers.length > 0) {
      logger.info('[ProactiveTriggers] Active triggers detected', {
        count: activeTriggers.length,
        topTriggers: topTriggers.map(t => ({
          id: t.id,
          priority: t.priority,
          title: t.title,
        })),
      });
    }
    
    return topTriggers;
  } catch (error) {
    logger.error('[ProactiveTriggers] Failed to detect triggers', { error });
    return [];
  }
}

/**
 * Get triggers by category
 */
export function getTriggersByCategory(
  category: ProactiveTrigger['category'],
  context: AIContextData
): ProactiveTrigger[] {
  const allTriggers = detectTriggers(context);
  return allTriggers.filter(t => t.category === category);
}

/**
 * Check if a specific trigger is active
 */
export function isTriggerActive(
  triggerId: string,
  context: AIContextData
): boolean {
  const trigger = PROACTIVE_TRIGGERS.find(t => t.id === triggerId);
  if (!trigger) return false;
  
  try {
    return trigger.condition(context);
  } catch {
    return false;
  }
}

/**
 * Get all available trigger IDs (for debugging/testing)
 */
export function getAllTriggerIds(): string[] {
  return PROACTIVE_TRIGGERS.map(t => t.id);
}

/**
 * Get trigger by ID
 */
export function getTriggerById(triggerId: string): ProactiveTrigger | null {
  return PROACTIVE_TRIGGERS.find(t => t.id === triggerId) || null;
}

