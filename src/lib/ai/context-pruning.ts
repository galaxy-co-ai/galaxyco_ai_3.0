/**
 * Neptune AI Context Pruning Module
 * 
 * Implements smart context pruning to reduce token usage while maintaining
 * response quality. Uses relevance scoring to prioritize high-value context.
 * 
 * Target: 50% token savings without accuracy loss
 */

import type {
  AIContextData,
  CRMContext,
  CalendarContext,
  TaskContext,
  AgentContext,
  MarketingContext,
  FinanceContext,
  ProactiveInsightsContext,
} from './context';

// ============================================================================
// TYPES
// ============================================================================

export interface ContextItem {
  type: 'crm' | 'calendar' | 'task' | 'agent' | 'marketing' | 'finance' | 'insight' | 'content';
  subType?: string;
  data: unknown;
  relevanceScore: number;
  tokenEstimate: number;
}

export interface PrunedContext {
  items: ContextItem[];
  totalTokens: number;
  prunedCount: number;
  includedTypes: string[];
}

export interface PruningConfig {
  maxTokens: number;
  minRelevanceScore: number;
  priorityBoosts: Record<string, number>;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: PruningConfig = {
  maxTokens: 4000, // Leave room for system prompt + user message + response
  minRelevanceScore: 2, // Minimum score to include (0-10 scale)
  priorityBoosts: {
    hotLead: 3,
    overdueTask: 3,
    todayEvent: 2,
    urgentInsight: 3,
    activeAgent: 1,
  },
};

// Token estimates per context type (approximate)
const TOKEN_ESTIMATES = {
  lead: 50,
  contact: 30,
  event: 40,
  task: 35,
  agent: 25,
  campaign: 45,
  insight: 60,
  invoice: 40,
  summary: 100,
  header: 20,
};

// ============================================================================
// RELEVANCE SCORING FUNCTIONS
// ============================================================================

/**
 * Score CRM items based on relevance
 */
function scoreCRMItems(crm: CRMContext, query?: string): ContextItem[] {
  const items: ContextItem[] = [];

  // Score hot leads (highest priority)
  crm.hotLeads.forEach((lead) => {
    let score = 7; // Base score for hot leads
    
    // Boost based on stage
    if (lead.stage === 'negotiation') score += 2;
    if (lead.stage === 'proposal') score += 1;
    
    // Boost based on value
    if (lead.estimatedValue && lead.estimatedValue > 10000) score += 1;
    
    // Query relevance boost
    if (query && (
      lead.name.toLowerCase().includes(query.toLowerCase()) ||
      lead.company?.toLowerCase().includes(query.toLowerCase())
    )) {
      score += 2;
    }

    items.push({
      type: 'crm',
      subType: 'hotLead',
      data: lead,
      relevanceScore: Math.min(score, 10),
      tokenEstimate: TOKEN_ESTIMATES.lead,
    });
  });

  // Score recent leads (lower priority than hot leads)
  crm.recentLeads.forEach((lead) => {
    // Skip if already included as hot lead
    if (crm.hotLeads.some(h => h.id === lead.id)) return;

    let score = 4; // Base score for recent leads
    
    // Recency boost (created in last 24h)
    const ageHours = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60);
    if (ageHours < 24) score += 2;
    else if (ageHours < 72) score += 1;

    items.push({
      type: 'crm',
      subType: 'recentLead',
      data: lead,
      relevanceScore: Math.min(score, 10),
      tokenEstimate: TOKEN_ESTIMATES.lead,
    });
  });

  // Add CRM summary (always include if workspace has data)
  if (crm.totalLeads > 0 || crm.totalContacts > 0) {
    items.push({
      type: 'crm',
      subType: 'summary',
      data: {
        totalLeads: crm.totalLeads,
        totalContacts: crm.totalContacts,
        totalCustomers: crm.totalCustomers,
        totalPipelineValue: crm.totalPipelineValue,
        leadsByStage: crm.leadsByStage,
      },
      relevanceScore: 8, // CRM summary is usually relevant
      tokenEstimate: TOKEN_ESTIMATES.summary,
    });
  }

  return items;
}

/**
 * Score calendar items based on relevance
 */
function scoreCalendarItems(calendar: CalendarContext): ContextItem[] {
  const items: ContextItem[] = [];
  const now = new Date();

  calendar.upcomingEvents.forEach((event) => {
    let score = 5; // Base score

    const eventTime = new Date(event.startTime);
    const hoursUntil = (eventTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Time-based scoring
    if (hoursUntil < 1) score = 10; // Within the hour
    else if (hoursUntil < 4) score = 9; // Next few hours
    else if (hoursUntil < 24) score = 7; // Today
    else if (hoursUntil < 48) score = 5; // Tomorrow

    // Attendee boost
    if (event.attendeeCount > 3) score += 1;

    items.push({
      type: 'calendar',
      subType: 'event',
      data: event,
      relevanceScore: Math.min(score, 10),
      tokenEstimate: TOKEN_ESTIMATES.event,
    });
  });

  // Add calendar summary if there are events
  if (calendar.todayEventCount > 0 || calendar.thisWeekEventCount > 0) {
    items.push({
      type: 'calendar',
      subType: 'summary',
      data: {
        todayEventCount: calendar.todayEventCount,
        thisWeekEventCount: calendar.thisWeekEventCount,
      },
      relevanceScore: 6,
      tokenEstimate: TOKEN_ESTIMATES.header,
    });
  }

  return items;
}

/**
 * Score task items based on relevance
 */
function scoreTaskItems(tasks: TaskContext): ContextItem[] {
  const items: ContextItem[] = [];
  const now = new Date();

  tasks.highPriorityTasks.forEach((task) => {
    let score = 6; // Base score for high priority

    // Priority boost
    if (task.priority === 'urgent') score += 3;
    if (task.priority === 'high') score += 1;

    // Overdue boost
    if (task.dueDate && new Date(task.dueDate) < now) {
      score += 2;
    }

    // Due soon boost (within 24h)
    if (task.dueDate) {
      const hoursUntilDue = (new Date(task.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60);
      if (hoursUntilDue > 0 && hoursUntilDue < 24) score += 1;
    }

    items.push({
      type: 'task',
      subType: task.priority,
      data: task,
      relevanceScore: Math.min(score, 10),
      tokenEstimate: TOKEN_ESTIMATES.task,
    });
  });

  // Add task summary if there are tasks
  if (tasks.pendingTasks > 0) {
    items.push({
      type: 'task',
      subType: 'summary',
      data: {
        pendingTasks: tasks.pendingTasks,
        overdueTasks: tasks.overdueTasks,
      },
      relevanceScore: tasks.overdueTasks > 0 ? 8 : 5,
      tokenEstimate: TOKEN_ESTIMATES.header,
    });
  }

  return items;
}

/**
 * Score agent items based on relevance
 */
function scoreAgentItems(agents: AgentContext): ContextItem[] {
  const items: ContextItem[] = [];

  // Only include top active agents
  const activeAgents = agents.recentAgents.filter(a => a.status === 'active');
  
  activeAgents.slice(0, 3).forEach((agent) => {
    let score = 4; // Base score

    // Execution frequency boost
    if (agent.executionCount > 100) score += 2;
    else if (agent.executionCount > 10) score += 1;

    items.push({
      type: 'agent',
      subType: agent.type,
      data: agent,
      relevanceScore: Math.min(score, 10),
      tokenEstimate: TOKEN_ESTIMATES.agent,
    });
  });

  // Add agent summary if there are active agents
  if (agents.activeAgents > 0) {
    items.push({
      type: 'agent',
      subType: 'summary',
      data: {
        activeAgents: agents.activeAgents,
        totalExecutions: agents.totalExecutions,
      },
      relevanceScore: 4,
      tokenEstimate: TOKEN_ESTIMATES.header,
    });
  }

  return items;
}

/**
 * Score marketing items based on relevance
 */
function scoreMarketingItems(marketing?: MarketingContext): ContextItem[] {
  if (!marketing || marketing.totalCampaigns === 0) return [];

  const items: ContextItem[] = [];

  // Score active campaigns
  marketing.activeCampaigns.slice(0, 3).forEach((campaign) => {
    let score = 5; // Base score

    // Performance-based scoring
    const openRate = campaign.sentCount > 0 
      ? (campaign.openCount / campaign.sentCount) * 100 
      : 0;
    
    if (openRate > 25) score += 2; // High performer
    else if (openRate < 10 && campaign.sentCount > 50) score += 1; // Needs attention

    items.push({
      type: 'marketing',
      subType: 'campaign',
      data: campaign,
      relevanceScore: Math.min(score, 10),
      tokenEstimate: TOKEN_ESTIMATES.campaign,
    });
  });

  // Add marketing summary
  items.push({
    type: 'marketing',
    subType: 'summary',
    data: {
      totalCampaigns: marketing.totalCampaigns,
      activeCampaigns: marketing.activeCampaigns.length,
      campaignStats: marketing.campaignStats,
    },
    relevanceScore: 5,
    tokenEstimate: TOKEN_ESTIMATES.summary,
  });

  return items;
}

/**
 * Score finance items based on relevance
 */
function scoreFinanceItems(finance?: FinanceContext): ContextItem[] {
  if (!finance || !finance.hasFinanceIntegrations) return [];

  const items: ContextItem[] = [];

  // Score overdue invoices (high priority)
  if (finance.recentInvoices) {
    finance.recentInvoices
      .filter(inv => inv.status === 'overdue')
      .slice(0, 3)
      .forEach((invoice) => {
        items.push({
          type: 'finance',
          subType: 'overdueInvoice',
          data: invoice,
          relevanceScore: 8, // Overdue invoices are urgent
          tokenEstimate: TOKEN_ESTIMATES.invoice,
        });
      });
  }

  // Add finance summary if available
  if (finance.summary) {
    items.push({
      type: 'finance',
      subType: 'summary',
      data: finance.summary,
      relevanceScore: 6,
      tokenEstimate: TOKEN_ESTIMATES.summary,
    });
  }

  return items;
}

/**
 * Score proactive insights based on relevance
 */
function scoreInsightItems(insights?: ProactiveInsightsContext): ContextItem[] {
  if (!insights || !insights.hasInsights) return [];

  const items: ContextItem[] = [];

  insights.insights.slice(0, 5).forEach((insight) => {
    // Use the insight's own priority as base score
    const score = Math.min(insight.priority, 10);

    items.push({
      type: 'insight',
      subType: insight.category,
      data: insight,
      relevanceScore: score,
      tokenEstimate: TOKEN_ESTIMATES.insight,
    });
  });

  return items;
}

// ============================================================================
// MAIN PRUNING FUNCTIONS
// ============================================================================

/**
 * Score all context items based on relevance to current query
 */
export function scoreContextRelevance(
  context: AIContextData,
  query?: string
): ContextItem[] {
  const allItems: ContextItem[] = [];

  // Score each context type
  allItems.push(...scoreCRMItems(context.crm, query));
  allItems.push(...scoreCalendarItems(context.calendar));
  allItems.push(...scoreTaskItems(context.tasks));
  allItems.push(...scoreAgentItems(context.agents));
  allItems.push(...scoreMarketingItems(context.marketing));
  allItems.push(...scoreFinanceItems(context.finance));
  allItems.push(...scoreInsightItems(context.proactiveInsights));

  return allItems;
}

/**
 * Prune context to fit within token budget
 * Prioritizes high-relevance items and ensures diversity of context types
 */
export function pruneContext(
  items: ContextItem[],
  config: Partial<PruningConfig> = {}
): PrunedContext {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { maxTokens, minRelevanceScore } = mergedConfig;

  // Filter by minimum relevance score
  const eligibleItems = items.filter(item => item.relevanceScore >= minRelevanceScore);

  // Sort by relevance score (descending)
  const sortedItems = [...eligibleItems].sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Select items within token budget
  const selectedItems: ContextItem[] = [];
  let totalTokens = 0;
  const includedTypes = new Set<string>();

  // First pass: ensure at least one summary per type if available
  const summaryItems = sortedItems.filter(item => item.subType === 'summary');
  for (const summary of summaryItems) {
    if (totalTokens + summary.tokenEstimate <= maxTokens) {
      selectedItems.push(summary);
      totalTokens += summary.tokenEstimate;
      includedTypes.add(summary.type);
    }
  }

  // Second pass: add high-relevance detail items
  const detailItems = sortedItems.filter(item => item.subType !== 'summary');
  for (const item of detailItems) {
    if (totalTokens + item.tokenEstimate <= maxTokens) {
      selectedItems.push(item);
      totalTokens += item.tokenEstimate;
      includedTypes.add(item.type);
    } else {
      // Stop if we've exceeded budget
      break;
    }
  }

  // Re-sort selected items by type for organized output
  const orderedItems = selectedItems.sort((a, b) => {
    // Group by type, summaries first within each type
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    if (a.subType === 'summary') return -1;
    if (b.subType === 'summary') return 1;
    return b.relevanceScore - a.relevanceScore;
  });

  return {
    items: orderedItems,
    totalTokens,
    prunedCount: items.length - selectedItems.length,
    includedTypes: Array.from(includedTypes),
  };
}

/**
 * Get pruned context from full AI context data
 * Convenience function that combines scoring and pruning
 */
export function getPrunedContext(
  context: AIContextData,
  query?: string,
  config?: Partial<PruningConfig>
): PrunedContext {
  const scoredItems = scoreContextRelevance(context, query);
  return pruneContext(scoredItems, config);
}

/**
 * Check if context should be pruned based on estimated size
 * Returns true if the context is likely to exceed token limits
 */
export function shouldPruneContext(context: AIContextData): boolean {
  let estimatedTokens = 0;

  // Quick estimates
  estimatedTokens += context.crm.hotLeads.length * TOKEN_ESTIMATES.lead;
  estimatedTokens += context.crm.recentLeads.length * TOKEN_ESTIMATES.lead;
  estimatedTokens += context.calendar.upcomingEvents.length * TOKEN_ESTIMATES.event;
  estimatedTokens += context.tasks.highPriorityTasks.length * TOKEN_ESTIMATES.task;
  estimatedTokens += context.agents.recentAgents.length * TOKEN_ESTIMATES.agent;
  
  if (context.marketing) {
    estimatedTokens += context.marketing.activeCampaigns.length * TOKEN_ESTIMATES.campaign;
  }
  
  if (context.proactiveInsights?.insights) {
    estimatedTokens += context.proactiveInsights.insights.length * TOKEN_ESTIMATES.insight;
  }

  // Prune if estimated tokens exceed 70% of budget (leave room for summaries)
  return estimatedTokens > DEFAULT_CONFIG.maxTokens * 0.7;
}
