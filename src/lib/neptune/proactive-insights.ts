/**
 * Neptune Proactive Insight Engine
 * 
 * Neptune doesn't wait to be asked - it notices patterns, identifies opportunities,
 * and surfaces risks before they become problems. This engine powers that capability.
 * 
 * Key behaviors:
 * - Pattern detection across business domains
 * - Anomaly/opportunity identification
 * - Risk early warning system
 * - Actionable recommendation generation
 * 
 * Philosophy: Orchestrate, don't direct. Surface insights, offer to act.
 */

import { db } from '@/lib/db';
import { 
  prospects, 
  contacts, 
  tasks,
  calendarEvents,
  campaigns,
  invoices,
  agents,
  agentExecutions,
} from '@/db/schema';
import { eq, and, gte, lte, desc, sql, count } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { getCache, setCache } from '@/lib/cache';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * A proactive insight Neptune can surface
 */
export interface ProactiveInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'pattern' | 'anomaly' | 'milestone' | 'suggestion';
  urgency: 'immediate' | 'soon' | 'when-relevant';
  domain: 'crm' | 'marketing' | 'finance' | 'operations' | 'cross-domain';
  
  // Content
  title: string;
  description: string;
  impact: string;
  
  // Action orientation
  suggestedAction: string;
  offerToHelp: string; // "Want me to..." phrasing
  
  // Metadata
  confidence: number; // 0-1
  priority: number; // 1-10
  
  // Related data
  relatedEntities?: Array<{
    type: string;
    id: string;
    name: string;
  }>;
  
  detectedAt: Date;
  expiresAt?: Date;
}

/**
 * Pattern detected over time
 */
export interface DetectedPattern {
  id: string;
  name: string;
  description: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'sporadic';
  lastOccurred: Date;
  occurrenceCount: number;
  trend: 'increasing' | 'stable' | 'decreasing';
}

/**
 * Insight engine output
 */
export interface InsightEngineOutput {
  insights: ProactiveInsight[];
  patterns: DetectedPattern[];
  generatedAt: Date;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  CACHE_PREFIX: 'neptune:insights',
  CACHE_TTL: 15 * 60, // 15 minutes - insights should be relatively fresh
  MAX_INSIGHTS: 10,
  MIN_CONFIDENCE: 0.6,
};

// ============================================================================
// INSIGHT DETECTORS
// ============================================================================

/**
 * Detect CRM-related insights
 */
async function detectCRMInsights(workspaceId: string): Promise<ProactiveInsight[]> {
  const insights: ProactiveInsight[] = [];
  const now = new Date();
  
  try {
    // 1. Stale prospects opportunity
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const staleLeadsResult = await db.select({
      count: count(),
      value: sql<number>`SUM(${prospects.estimatedValue})`,
    })
      .from(prospects)
      .where(and(
        eq(prospects.workspaceId, workspaceId),
        lte(prospects.updatedAt, twoWeeksAgo),
        sql`${prospects.stage} NOT IN ('closed-won', 'closed-lost')`
      ));
    
    const staleCount = Number(staleLeadsResult[0]?.count ?? 0);
    const staleValue = Number(staleLeadsResult[0]?.value ?? 0);
    
    if (staleCount >= 3) {
      insights.push({
        id: `insight-stale-prospects-${Date.now()}`,
        type: 'opportunity',
        urgency: 'soon',
        domain: 'crm',
        title: 'Leads going cold',
        description: `${staleCount} prospects haven't been touched in 2+ weeks${staleValue > 0 ? ` (~$${(staleValue / 1000).toFixed(0)}K at stake)` : ''}.`,
        impact: 'Re-engaging these prospects could recover lost pipeline value.',
        suggestedAction: 'Review and re-engage stale prospects with personalized outreach.',
        offerToHelp: 'Want me to draft re-engagement emails for these prospects?',
        confidence: 0.85,
        priority: staleValue > 10000 ? 8 : 6,
        detectedAt: now,
      });
    }
    
    // 2. Hot prospects ready to close
    const hotLeadsResult = await db.select({
      count: count(),
      value: sql<number>`SUM(${prospects.estimatedValue})`,
    })
      .from(prospects)
      .where(and(
        eq(prospects.workspaceId, workspaceId),
        sql`${prospects.stage} IN ('proposal', 'negotiation')`
      ));
    
    const hotCount = Number(hotLeadsResult[0]?.count ?? 0);
    const hotValue = Number(hotLeadsResult[0]?.value ?? 0);
    
    if (hotCount > 0) {
      insights.push({
        id: `insight-hot-prospects-${Date.now()}`,
        type: 'opportunity',
        urgency: 'immediate',
        domain: 'crm',
        title: 'Deals ready to close',
        description: `${hotCount} prospects in proposal/negotiation stage${hotValue > 0 ? ` worth ~$${(hotValue / 1000).toFixed(0)}K` : ''}.`,
        impact: 'These deals are close - focused attention could accelerate close.',
        suggestedAction: 'Prioritize follow-ups and address any blockers.',
        offerToHelp: 'Want me to prepare follow-up messages or proposal drafts for these?',
        confidence: 0.9,
        priority: 8,
        detectedAt: now,
      });
    }
    
    // 3. No recent lead activity
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentLeadsResult = await db.select({ count: count() })
      .from(prospects)
      .where(and(
        eq(prospects.workspaceId, workspaceId),
        gte(prospects.createdAt, oneWeekAgo)
      ));
    
    const recentLeads = Number(recentLeadsResult[0]?.count ?? 0);
    const totalLeadsResult = await db.select({ count: count() })
      .from(prospects)
      .where(eq(prospects.workspaceId, workspaceId));
    
    const totalLeads = Number(totalLeadsResult[0]?.count ?? 0);
    
    if (totalLeads > 5 && recentLeads === 0) {
      insights.push({
        id: `insight-no-new-prospects-${Date.now()}`,
        type: 'risk',
        urgency: 'soon',
        domain: 'crm',
        title: 'Pipeline replenishment needed',
        description: 'No new prospects in the past week. Pipeline could dry up.',
        impact: 'Without new prospects, future revenue may be impacted.',
        suggestedAction: 'Consider ramping up outbound or marketing activities.',
        offerToHelp: 'Want me to help brainstorm lead generation ideas for your business?',
        confidence: 0.75,
        priority: 7,
        detectedAt: now,
      });
    }
  } catch (error) {
    logger.error('[ProactiveInsights] CRM detection failed', { workspaceId, error });
  }
  
  return insights;
}

/**
 * Detect Finance-related insights
 */
async function detectFinanceInsights(workspaceId: string): Promise<ProactiveInsight[]> {
  const insights: ProactiveInsight[] = [];
  const now = new Date();
  
  try {
    // 1. Overdue invoices
    const overdueResult = await db.select({
      count: count(),
      total: sql<number>`SUM(${invoices.amount})`,
    })
      .from(invoices)
      .where(and(
        eq(invoices.workspaceId, workspaceId),
        eq(invoices.status, 'overdue')
      ));
    
    const overdueCount = Number(overdueResult[0]?.count ?? 0);
    const overdueTotal = Number(overdueResult[0]?.total ?? 0);
    
    if (overdueCount > 0) {
      insights.push({
        id: `insight-overdue-invoices-${Date.now()}`,
        type: 'risk',
        urgency: overdueTotal > 5000 ? 'immediate' : 'soon',
        domain: 'finance',
        title: 'Overdue invoices need attention',
        description: `${overdueCount} invoices are overdue, totaling $${overdueTotal.toLocaleString()}.`,
        impact: 'Outstanding payments affect cash flow and operations.',
        suggestedAction: 'Send payment reminders to customers with overdue invoices.',
        offerToHelp: 'Want me to send payment reminder emails to these customers?',
        confidence: 0.95,
        priority: overdueTotal > 10000 ? 9 : 7,
        detectedAt: now,
      });
    }
    
    // 2. Invoices about to be due (7 days)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingResult = await db.select({
      count: count(),
      total: sql<number>`SUM(${invoices.amount})`,
    })
      .from(invoices)
      .where(and(
        eq(invoices.workspaceId, workspaceId),
        eq(invoices.status, 'sent'),
        lte(invoices.dueDate, sevenDaysFromNow),
        gte(invoices.dueDate, now)
      ));
    
    const upcomingCount = Number(upcomingResult[0]?.count ?? 0);
    const upcomingTotal = Number(upcomingResult[0]?.total ?? 0);
    
    if (upcomingCount >= 3 || upcomingTotal > 10000) {
      insights.push({
        id: `insight-upcoming-invoices-${Date.now()}`,
        type: 'pattern',
        urgency: 'when-relevant',
        domain: 'finance',
        title: 'Invoices coming due soon',
        description: `${upcomingCount} invoices (${upcomingTotal > 0 ? `$${upcomingTotal.toLocaleString()}` : ''}) are due within 7 days.`,
        impact: 'Proactive reminders can improve on-time payment rates.',
        suggestedAction: 'Consider sending friendly payment reminders.',
        offerToHelp: 'Want me to send a friendly reminder to these customers before due date?',
        confidence: 0.8,
        priority: 5,
        detectedAt: now,
      });
    }
  } catch (error) {
    logger.error('[ProactiveInsights] Finance detection failed', { workspaceId, error });
  }
  
  return insights;
}

/**
 * Detect Operations-related insights
 */
async function detectOperationsInsights(workspaceId: string): Promise<ProactiveInsight[]> {
  const insights: ProactiveInsight[] = [];
  const now = new Date();
  
  try {
    // 1. Overdue tasks
    const overdueTasksResult = await db.select({ count: count() })
      .from(tasks)
      .where(and(
        eq(tasks.workspaceId, workspaceId),
        lte(tasks.dueDate, now),
        sql`${tasks.status} != 'done'`
      ));
    
    const overdueCount = Number(overdueTasksResult[0]?.count ?? 0);
    
    if (overdueCount >= 3) {
      insights.push({
        id: `insight-overdue-tasks-${Date.now()}`,
        type: 'risk',
        urgency: 'soon',
        domain: 'operations',
        title: 'Task backlog building up',
        description: `${overdueCount} tasks are past their due date.`,
        impact: 'Overdue tasks can block progress and create cascading delays.',
        suggestedAction: 'Review and prioritize overdue tasks, reschedule or delegate.',
        offerToHelp: 'Want me to help prioritize these and suggest new due dates?',
        confidence: 0.9,
        priority: 6,
        detectedAt: now,
      });
    }
    
    // 2. Busy day ahead
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const todayEventsResult = await db.select({ count: count() })
      .from(calendarEvents)
      .where(and(
        eq(calendarEvents.workspaceId, workspaceId),
        gte(calendarEvents.startTime, todayStart),
        lte(calendarEvents.startTime, todayEnd)
      ));
    
    const todayEvents = Number(todayEventsResult[0]?.count ?? 0);
    
    if (todayEvents >= 5) {
      insights.push({
        id: `insight-busy-day-${Date.now()}`,
        type: 'pattern',
        urgency: 'immediate',
        domain: 'operations',
        title: 'Full calendar today',
        description: `You have ${todayEvents} meetings/events scheduled today.`,
        impact: 'Heavy meeting days leave less time for focused work.',
        suggestedAction: 'Consider blocking time for priority tasks between meetings.',
        offerToHelp: 'Want me to identify which meetings might be candidates for async follow-ups?',
        confidence: 0.85,
        priority: 5,
        detectedAt: now,
        expiresAt: todayEnd,
      });
    }
    
    // 3. Agent performance issues
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const agentExecutionResult = await db.select({
      total: count(),
      failed: sql<number>`SUM(CASE WHEN ${agentExecutions.status} = 'failed' THEN 1 ELSE 0 END)`,
    })
      .from(agentExecutions)
      .where(and(
        eq(agentExecutions.workspaceId, workspaceId),
        gte(agentExecutions.startedAt, oneWeekAgo)
      ));
    
    const totalExecutions = Number(agentExecutionResult[0]?.total ?? 0);
    const failedExecutions = Number(agentExecutionResult[0]?.failed ?? 0);
    const failRate = totalExecutions > 0 ? (failedExecutions / totalExecutions) * 100 : 0;
    
    if (totalExecutions >= 5 && failRate > 20) {
      insights.push({
        id: `insight-agent-failures-${Date.now()}`,
        type: 'risk',
        urgency: 'soon',
        domain: 'operations',
        title: 'Agent reliability issue',
        description: `${failRate.toFixed(0)}% of agent executions failed this week (${failedExecutions}/${totalExecutions}).`,
        impact: 'Failing agents may be missing important automations.',
        suggestedAction: 'Review failing agents and fix configuration issues.',
        offerToHelp: 'Want me to identify which agents are having issues and suggest fixes?',
        confidence: 0.85,
        priority: 7,
        detectedAt: now,
      });
    }
  } catch (error) {
    logger.error('[ProactiveInsights] Operations detection failed', { workspaceId, error });
  }
  
  return insights;
}

/**
 * Detect Marketing-related insights
 */
async function detectMarketingInsights(workspaceId: string): Promise<ProactiveInsight[]> {
  const insights: ProactiveInsight[] = [];
  const now = new Date();
  
  try {
    // 1. Underperforming campaigns
    const lowPerformersResult = await db.select({
      count: count(),
    })
      .from(campaigns)
      .where(and(
        eq(campaigns.workspaceId, workspaceId),
        eq(campaigns.status, 'active'),
        sql`${campaigns.openRate} < 15`,
        sql`${campaigns.sentCount} > 50`
      ));
    
    const lowPerformers = Number(lowPerformersResult[0]?.count ?? 0);
    
    if (lowPerformers > 0) {
      insights.push({
        id: `insight-low-campaigns-${Date.now()}`,
        type: 'opportunity',
        urgency: 'when-relevant',
        domain: 'marketing',
        title: 'Campaigns need optimization',
        description: `${lowPerformers} active campaign(s) have below-average open rates (<15%).`,
        impact: 'Better subject lines and timing could significantly improve results.',
        suggestedAction: 'Test new subject lines or adjust send times.',
        offerToHelp: 'Want me to suggest some A/B test variations for these campaigns?',
        confidence: 0.8,
        priority: 5,
        detectedAt: now,
      });
    }
    
    // 2. High-performing campaigns to scale
    const highPerformersResult = await db.select({
      count: count(),
    })
      .from(campaigns)
      .where(and(
        eq(campaigns.workspaceId, workspaceId),
        eq(campaigns.status, 'active'),
        sql`${campaigns.openRate} > 30`,
        sql`${campaigns.sentCount} > 20`
      ));
    
    const highPerformers = Number(highPerformersResult[0]?.count ?? 0);
    
    if (highPerformers > 0) {
      insights.push({
        id: `insight-high-campaigns-${Date.now()}`,
        type: 'opportunity',
        urgency: 'when-relevant',
        domain: 'marketing',
        title: 'Winning campaigns to scale',
        description: `${highPerformers} campaign(s) are performing exceptionally well (30%+ open rate).`,
        impact: 'Scaling successful content can multiply results.',
        suggestedAction: 'Consider expanding audience or creating similar campaigns.',
        offerToHelp: 'Want me to analyze what\'s working and suggest ways to scale these?',
        confidence: 0.85,
        priority: 6,
        detectedAt: now,
      });
    }
  } catch (error) {
    logger.error('[ProactiveInsights] Marketing detection failed', { workspaceId, error });
  }
  
  return insights;
}

/**
 * Detect cross-domain insights (patterns that span multiple areas)
 */
async function detectCrossDomainInsights(workspaceId: string): Promise<ProactiveInsight[]> {
  const insights: ProactiveInsight[] = [];
  const now = new Date();
  
  try {
    // 1. No automation in use
    const agentsResult = await db.select({ count: count() })
      .from(agents)
      .where(and(
        eq(agents.workspaceId, workspaceId),
        eq(agents.isActive, true)
      ));
    
    const activeAgents = Number(agentsResult[0]?.count ?? 0);
    
    // Check if there's enough activity to warrant automation
    const leadsResult = await db.select({ count: count() })
      .from(prospects)
      .where(eq(prospects.workspaceId, workspaceId));
    
    const totalLeads = Number(leadsResult[0]?.count ?? 0);
    
    if (activeAgents === 0 && totalLeads > 10) {
      insights.push({
        id: `insight-no-automation-${Date.now()}`,
        type: 'opportunity',
        urgency: 'when-relevant',
        domain: 'cross-domain',
        title: 'Automation opportunity',
        description: 'No AI agents are active yet. With your lead volume, automation could save significant time.',
        impact: 'Agents can handle follow-ups, reminders, and data entry automatically.',
        suggestedAction: 'Consider setting up a lead follow-up agent to start.',
        offerToHelp: 'Want me to create a lead follow-up agent for you?',
        confidence: 0.75,
        priority: 5,
        detectedAt: now,
      });
    }
    
    // 2. Pipeline + Finance alignment
    // Check if hot prospects exist but no proposals sent
    const hotLeadsResult = await db.select({ count: count() })
      .from(prospects)
      .where(and(
        eq(prospects.workspaceId, workspaceId),
        sql`${prospects.stage} IN ('proposal', 'negotiation')`
      ));
    
    const hotLeads = Number(hotLeadsResult[0]?.count ?? 0);
    
    const recentInvoicesResult = await db.select({ count: count() })
      .from(invoices)
      .where(and(
        eq(invoices.workspaceId, workspaceId),
        gte(invoices.createdAt, new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
      ));
    
    const recentInvoices = Number(recentInvoicesResult[0]?.count ?? 0);
    
    if (hotLeads > 3 && recentInvoices < hotLeads / 2) {
      insights.push({
        id: `insight-pipeline-finance-gap-${Date.now()}`,
        type: 'pattern',
        urgency: 'when-relevant',
        domain: 'cross-domain',
        title: 'Pipeline to invoice gap',
        description: `You have ${hotLeads} hot prospects but fewer recent invoices. Some deals may be stuck.`,
        impact: 'Closing deals faster improves cash flow.',
        suggestedAction: 'Review deal blockers and push stalled proposals.',
        offerToHelp: 'Want me to identify which hot prospects haven\'t progressed recently?',
        confidence: 0.7,
        priority: 6,
        detectedAt: now,
      });
    }
  } catch (error) {
    logger.error('[ProactiveInsights] Cross-domain detection failed', { workspaceId, error });
  }
  
  return insights;
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Generate proactive insights for a workspace
 * 
 * This is Neptune's "always thinking" capability - identifying things
 * worth mentioning before the user asks.
 */
export async function generateProactiveInsights(
  workspaceId: string
): Promise<InsightEngineOutput> {
  // Check cache first
  const cacheKey = `${CONFIG.CACHE_PREFIX}:${workspaceId}`;
  const cached = await getCache<InsightEngineOutput>(cacheKey, {
    prefix: '',
    ttl: CONFIG.CACHE_TTL,
  });
  
  if (cached) {
    logger.debug('[ProactiveInsights] Returning cached insights');
    return cached;
  }
  
  logger.info('[ProactiveInsights] Generating insights', { workspaceId });
  
  // Run all detectors in parallel
  const [
    crmInsights,
    financeInsights,
    operationsInsights,
    marketingInsights,
    crossDomainInsights,
  ] = await Promise.all([
    detectCRMInsights(workspaceId),
    detectFinanceInsights(workspaceId),
    detectOperationsInsights(workspaceId),
    detectMarketingInsights(workspaceId),
    detectCrossDomainInsights(workspaceId),
  ]);
  
  // Combine and sort by priority
  const allInsights = [
    ...crmInsights,
    ...financeInsights,
    ...operationsInsights,
    ...marketingInsights,
    ...crossDomainInsights,
  ]
    .filter(i => i.confidence >= CONFIG.MIN_CONFIDENCE)
    .sort((a, b) => {
      // Sort by urgency first, then priority
      const urgencyOrder = { immediate: 3, soon: 2, 'when-relevant': 1 };
      const urgencyDiff = urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.priority - a.priority;
    })
    .slice(0, CONFIG.MAX_INSIGHTS);
  
  const output: InsightEngineOutput = {
    insights: allInsights,
    patterns: [], // Could add pattern detection here
    generatedAt: new Date(),
  };
  
  // Cache the results
  await setCache(cacheKey, output, { prefix: '', ttl: CONFIG.CACHE_TTL });
  
  logger.info('[ProactiveInsights] Generated insights', {
    workspaceId,
    insightCount: allInsights.length,
  });
  
  return output;
}

/**
 * Get top insights to proactively mention
 */
export async function getTopInsightsToMention(
  workspaceId: string,
  limit = 3
): Promise<ProactiveInsight[]> {
  const output = await generateProactiveInsights(workspaceId);
  
  // Filter to immediate/soon urgency for proactive mention
  return output.insights
    .filter(i => i.urgency === 'immediate' || i.urgency === 'soon')
    .slice(0, limit);
}

/**
 * Build a prompt section for proactive insights
 * This gets injected into the system prompt
 */
export async function buildProactiveInsightsPrompt(
  workspaceId: string
): Promise<string> {
  const output = await generateProactiveInsights(workspaceId);
  
  if (output.insights.length === 0) {
    return '';
  }
  
  const topInsights = output.insights.slice(0, 5);
  
  const parts: string[] = [];
  parts.push('## PROACTIVE INSIGHTS (Surface naturally when relevant)');
  parts.push('');
  parts.push('Neptune has detected these patterns that may be worth mentioning:');
  parts.push('');
  
  for (const insight of topInsights) {
    const urgencyIcon = insight.urgency === 'immediate' ? '🔴' : 
                        insight.urgency === 'soon' ? '🟡' : '💡';
    
    parts.push(`${urgencyIcon} **${insight.title}**`);
    parts.push(`   ${insight.description}`);
    parts.push(`   → ${insight.offerToHelp}`);
    parts.push('');
  }
  
  parts.push(`**How to use these insights:**`);
  parts.push(`- Mention naturally: "By the way, I noticed..."`);
  parts.push(`- Offer to help: Use the "Want me to..." phrasing`);
  parts.push(`- Don't dump all at once - pick the most relevant one`);
  parts.push(`- If user is focused on something else, save for later`);
  
  return parts.join('\n');
}

/**
 * Check if there are urgent insights that should interrupt
 */
export async function hasUrgentInsights(workspaceId: string): Promise<boolean> {
  const output = await generateProactiveInsights(workspaceId);
  return output.insights.some(i => i.urgency === 'immediate' && i.priority >= 8);
}

/**
 * Get insights relevant to a specific topic
 */
export async function getRelevantInsights(
  workspaceId: string,
  topic: string
): Promise<ProactiveInsight[]> {
  const output = await generateProactiveInsights(workspaceId);
  
  const topicLower = topic.toLowerCase();
  
  // Map topics to domains
  const topicDomainMap: Record<string, string[]> = {
    lead: ['crm'],
    pipeline: ['crm'],
    deal: ['crm'],
    sales: ['crm'],
    invoice: ['finance'],
    payment: ['finance'],
    revenue: ['finance'],
    money: ['finance'],
    task: ['operations'],
    meeting: ['operations'],
    calendar: ['operations'],
    agent: ['operations'],
    campaign: ['marketing'],
    email: ['marketing'],
    marketing: ['marketing'],
  };
  
  // Find relevant domains
  const relevantDomains: string[] = [];
  for (const [keyword, domains] of Object.entries(topicDomainMap)) {
    if (topicLower.includes(keyword)) {
      relevantDomains.push(...domains);
    }
  }
  
  if (relevantDomains.length === 0) {
    return output.insights.slice(0, 2);
  }
  
  return output.insights.filter(i => 
    relevantDomains.includes(i.domain) || i.domain === 'cross-domain'
  );
}

// Export types
export type { InsightEngineOutput, DetectedPattern };
