/**
 * Neptune Business Intelligence Layer
 * 
 * This module provides Neptune with holistic business awareness by:
 * - Aggregating signals from CRM, Marketing, Finance, and Operations
 * - Detecting cross-domain correlations humans might miss
 * - Scoring overall business health
 * - Identifying opportunities and risks across the business
 * 
 * Philosophy: Neptune holds the ENTIRE business in mind, not just individual modules.
 */

import { db } from '@/lib/db';
import { 
  prospects, 
  contacts, 
  customers,
  tasks,
  calendarEvents,
  campaigns,
  expenses,
  invoices,
  agents,
  agentExecutions,
} from '@/db/schema';
import { eq, and, gte, lte, desc, sql, count, sum, avg } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Business domain signals aggregated from various modules
 */
export interface BusinessSignals {
  // CRM Signals
  crm: {
    totalLeads: number;
    newLeadsThisWeek: number;
    leadVelocity: number; // Leads moving through pipeline per week
    hotLeads: number;
    coldLeads: number; // Stale prospects (no activity in 14+ days)
    avgDealSize: number;
    pipelineValue: number;
    conversionRate: number;
    contactEngagement: number; // % of contacts with recent activity
  };
  
  // Marketing Signals
  marketing: {
    activeCampaigns: number;
    avgOpenRate: number;
    avgClickRate: number;
    topPerformingChannel: string | null;
    campaignsNeedingAttention: number;
    leadSourceBreakdown: Record<string, number>;
    contentVelocity: number; // Content pieces per week
  };
  
  // Finance Signals
  finance: {
    monthlyRevenue: number;
    monthlyExpenses: number;
    profit: number;
    profitMargin: number;
    cashFlow: number;
    outstandingInvoices: number;
    overdueAmount: number;
    avgDaysToPayment: number;
    revenueGrowth: number; // Month-over-month %
  };
  
  // Operations Signals
  operations: {
    pendingTasks: number;
    overdueTasks: number;
    taskCompletionRate: number;
    avgTaskAge: number; // Days
    upcomingEvents: number;
    activeAgents: number;
    agentSuccessRate: number;
    automationCoverage: number; // % of manual tasks automated
  };
}

/**
 * Cross-domain correlation detected by Neptune
 */
export interface BusinessCorrelation {
  id: string;
  type: 'opportunity' | 'risk' | 'insight' | 'trend';
  domains: ('crm' | 'marketing' | 'finance' | 'operations')[];
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number; // 0-1
  suggestedAction?: string;
  relatedEntities?: Array<{
    type: string;
    id: string;
    name: string;
  }>;
  detectedAt: Date;
}

/**
 * Overall business health score
 */
export interface BusinessHealthScore {
  overall: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  dimensions: {
    revenue: number;
    pipeline: number;
    operations: number;
    marketing: number;
    cashFlow: number;
  };
  topStrengths: string[];
  topRisks: string[];
  momentum: 'gaining' | 'steady' | 'losing';
}

/**
 * Complete business intelligence snapshot
 */
export interface BusinessIntelligence {
  signals: BusinessSignals;
  correlations: BusinessCorrelation[];
  healthScore: BusinessHealthScore;
  generatedAt: Date;
  workspaceId: string;
}

// ============================================================================
// SIGNAL COLLECTION
// ============================================================================

/**
 * Collect CRM signals for a workspace
 */
async function collectCRMSignals(workspaceId: string): Promise<BusinessSignals['crm']> {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    // Get lead counts and stats
    const leadStats = await db.select({
      totalLeads: count(),
      pipelineValue: sum(prospects.estimatedValue),
      avgDealSize: avg(prospects.estimatedValue),
    })
      .from(prospects)
      .where(eq(prospects.workspaceId, workspaceId));
    
    // New prospects this week
    const newLeadsResult = await db.select({ count: count() })
      .from(prospects)
      .where(and(
        eq(prospects.workspaceId, workspaceId),
        gte(prospects.createdAt, oneWeekAgo)
      ));
    
    // Hot prospects (in proposal/negotiation stage)
    const hotLeadsResult = await db.select({ count: count() })
      .from(prospects)
      .where(and(
        eq(prospects.workspaceId, workspaceId),
        sql`${prospects.stage} IN ('proposal', 'negotiation')`
      ));
    
    // Cold prospects (no activity in 14+ days)
    const coldLeadsResult = await db.select({ count: count() })
      .from(prospects)
      .where(and(
        eq(prospects.workspaceId, workspaceId),
        lte(prospects.updatedAt, twoWeeksAgo),
        sql`${prospects.stage} NOT IN ('closed-won', 'closed-lost')`
      ));
    
    // Contact engagement (contacts with activity in last week)
    const totalContactsResult = await db.select({ count: count() })
      .from(contacts)
      .where(eq(contacts.workspaceId, workspaceId));
    
    const activeContactsResult = await db.select({ count: count() })
      .from(contacts)
      .where(and(
        eq(contacts.workspaceId, workspaceId),
        gte(contacts.updatedAt, oneWeekAgo)
      ));
    
    const totalContacts = totalContactsResult[0]?.count ?? 0;
    const activeContacts = activeContactsResult[0]?.count ?? 0;
    const contactEngagement = totalContacts > 0 ? (activeContacts / totalContacts) * 100 : 0;
    
    // Conversion rate (won / total closed this month)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const wonResult = await db.select({ count: count() })
      .from(prospects)
      .where(and(
        eq(prospects.workspaceId, workspaceId),
        eq(prospects.stage, 'won'),
        gte(prospects.updatedAt, monthStart)
      ));
    
    const closedResult = await db.select({ count: count() })
      .from(prospects)
      .where(and(
        eq(prospects.workspaceId, workspaceId),
        sql`${prospects.stage} IN ('won', 'lost')`,
        gte(prospects.updatedAt, monthStart)
      ));
    
    const wonCount = wonResult[0]?.count ?? 0;
    const closedCount = closedResult[0]?.count ?? 0;
    const conversionRate = closedCount > 0 ? (wonCount / closedCount) * 100 : 0;
    
    return {
      totalLeads: Number(leadStats[0]?.totalLeads ?? 0),
      newLeadsThisWeek: Number(newLeadsResult[0]?.count ?? 0),
      leadVelocity: Number(newLeadsResult[0]?.count ?? 0), // Simplified for now
      hotLeads: Number(hotLeadsResult[0]?.count ?? 0),
      coldLeads: Number(coldLeadsResult[0]?.count ?? 0),
      avgDealSize: Number(leadStats[0]?.avgDealSize ?? 0),
      pipelineValue: Number(leadStats[0]?.pipelineValue ?? 0),
      conversionRate,
      contactEngagement,
    };
  } catch (error) {
    logger.error('[BusinessIntelligence] Failed to collect CRM signals', { workspaceId, error });
    return {
      totalLeads: 0,
      newLeadsThisWeek: 0,
      leadVelocity: 0,
      hotLeads: 0,
      coldLeads: 0,
      avgDealSize: 0,
      pipelineValue: 0,
      conversionRate: 0,
      contactEngagement: 0,
    };
  }
}

/**
 * Collect Marketing signals for a workspace
 */
async function collectMarketingSignals(workspaceId: string): Promise<BusinessSignals['marketing']> {
  try {
    // Get campaign performance - calculate rates from counts
    const allCampaigns = await db.select({
      sentCount: campaigns.sentCount,
      openCount: campaigns.openCount,
      clickCount: campaigns.clickCount,
    })
      .from(campaigns)
      .where(eq(campaigns.workspaceId, workspaceId));
    
    const totalCampaigns = allCampaigns.length;
    let totalOpenRate = 0;
    let totalClickRate = 0;
    let validOpenRates = 0;
    let validClickRates = 0;
    
    allCampaigns.forEach(campaign => {
      if (campaign.sentCount && campaign.sentCount > 0) {
        totalOpenRate += ((campaign.openCount || 0) / campaign.sentCount) * 100;
        validOpenRates++;
        
        totalClickRate += ((campaign.clickCount || 0) / campaign.sentCount) * 100;
        validClickRates++;
      }
    });
    
    const avgOpenRate = validOpenRates > 0 ? totalOpenRate / validOpenRates : 0;
    const avgClickRate = validClickRates > 0 ? totalClickRate / validClickRates : 0;
    
    // Active campaigns
    const activeCampaignsResult = await db.select({ count: count() })
      .from(campaigns)
      .where(and(
        eq(campaigns.workspaceId, workspaceId),
        eq(campaigns.status, 'active')
      ));
    
    // Campaigns needing attention (low performance - less than 15% open rate)
    const lowPerformersResult = await db.select({ count: count() })
      .from(campaigns)
      .where(and(
        eq(campaigns.workspaceId, workspaceId),
        eq(campaigns.status, 'active'),
        sql`(${campaigns.openCount}::float / NULLIF(${campaigns.sentCount}, 0)) * 100 < 15`
      ));
    
    // Lead source breakdown
    const leadSourceResults = await db.select({
      source: prospects.source,
      count: count(),
    })
      .from(prospects)
      .where(eq(prospects.workspaceId, workspaceId))
      .groupBy(prospects.source);
    
    const leadSourceBreakdown: Record<string, number> = {};
    for (const row of leadSourceResults) {
      if (row.source) {
        leadSourceBreakdown[row.source] = Number(row.count);
      }
    }
    
    // Determine top channel
    const topChannel = Object.entries(leadSourceBreakdown)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null;
    
    return {
      activeCampaigns: Number(activeCampaignsResult[0]?.count ?? 0),
      avgOpenRate: avgOpenRate,
      avgClickRate: avgClickRate,
      topPerformingChannel: topChannel,
      campaignsNeedingAttention: Number(lowPerformersResult[0]?.count ?? 0),
      leadSourceBreakdown,
      contentVelocity: 0, // Would need content tracking
    };
  } catch (error) {
    logger.error('[BusinessIntelligence] Failed to collect marketing signals', { workspaceId, error });
    return {
      activeCampaigns: 0,
      avgOpenRate: 0,
      avgClickRate: 0,
      topPerformingChannel: null,
      campaignsNeedingAttention: 0,
      leadSourceBreakdown: {},
      contentVelocity: 0,
    };
  }
}

/**
 * Collect Finance signals for a workspace
 */
async function collectFinanceSignals(workspaceId: string): Promise<BusinessSignals['finance']> {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    // This month's expenses (revenue tracked separately via invoices)
    const thisMonthStats = await db.select({
      expenses: sum(expenses.amount),
    })
      .from(expenses)
      .where(and(
        eq(expenses.workspaceId, workspaceId),
        gte(expenses.expenseDate, monthStart)
      ));
    
    // Revenue from paid invoices this month and last month
    const thisMonthRevenue = await db.select({
      revenue: sum(invoices.total),
    })
      .from(invoices)
      .where(and(
        eq(invoices.workspaceId, workspaceId),
        eq(invoices.status, 'paid'),
        gte(invoices.paidAt, monthStart)
      ));
    
    const lastMonthRevenue = await db.select({
      revenue: sum(invoices.total),
    })
      .from(invoices)
      .where(and(
        eq(invoices.workspaceId, workspaceId),
        eq(invoices.status, 'paid'),
        gte(invoices.paidAt, lastMonthStart),
        lte(invoices.paidAt, lastMonthEnd)
      ));
    
    const thisRevenue = Number(thisMonthRevenue[0]?.revenue ?? 0);
    const thisExpenses = Number(thisMonthStats[0]?.expenses ?? 0);
    const lastRevenue = Number(lastMonthRevenue[0]?.revenue ?? 0);
    const profit = thisRevenue - thisExpenses;
    const profitMargin = thisRevenue > 0 ? (profit / thisRevenue) * 100 : 0;
    const revenueGrowth = lastRevenue > 0 ? ((thisRevenue - lastRevenue) / lastRevenue) * 100 : 0;
    
    // Outstanding and overdue invoices
    const invoiceStats = await db.select({
      outstanding: sql<number>`SUM(CASE WHEN ${invoices.status} = 'sent' THEN ${invoices.total} ELSE 0 END)`,
      overdue: sql<number>`SUM(CASE WHEN ${invoices.status} = 'overdue' THEN ${invoices.total} ELSE 0 END)`,
    })
      .from(invoices)
      .where(eq(invoices.workspaceId, workspaceId));
    
    return {
      monthlyRevenue: thisRevenue,
      monthlyExpenses: thisExpenses,
      profit,
      profitMargin,
      cashFlow: profit, // Simplified
      outstandingInvoices: Number(invoiceStats[0]?.outstanding ?? 0),
      overdueAmount: Number(invoiceStats[0]?.overdue ?? 0),
      avgDaysToPayment: 0, // Would need more data
      revenueGrowth,
    };
  } catch (error) {
    logger.error('[BusinessIntelligence] Failed to collect finance signals', { workspaceId, error });
    return {
      monthlyRevenue: 0,
      monthlyExpenses: 0,
      profit: 0,
      profitMargin: 0,
      cashFlow: 0,
      outstandingInvoices: 0,
      overdueAmount: 0,
      avgDaysToPayment: 0,
      revenueGrowth: 0,
    };
  }
}

/**
 * Collect Operations signals for a workspace
 */
async function collectOperationsSignals(workspaceId: string): Promise<BusinessSignals['operations']> {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneWeekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    // Task stats
    const taskStats = await db.select({
      pending: sql<number>`SUM(CASE WHEN ${tasks.status} = 'todo' OR ${tasks.status} = 'in_progress' THEN 1 ELSE 0 END)`,
      overdue: sql<number>`SUM(CASE WHEN ${tasks.dueDate} < ${now} AND ${tasks.status} != 'done' THEN 1 ELSE 0 END)`,
      completedThisWeek: sql<number>`SUM(CASE WHEN ${tasks.status} = 'done' AND ${tasks.updatedAt} >= ${oneWeekAgo} THEN 1 ELSE 0 END)`,
      totalThisWeek: sql<number>`SUM(CASE WHEN ${tasks.createdAt} >= ${oneWeekAgo} THEN 1 ELSE 0 END)`,
    })
      .from(tasks)
      .where(eq(tasks.workspaceId, workspaceId));
    
    const pending = Number(taskStats[0]?.pending ?? 0);
    const overdue = Number(taskStats[0]?.overdue ?? 0);
    const completedThisWeek = Number(taskStats[0]?.completedThisWeek ?? 0);
    const totalThisWeek = Number(taskStats[0]?.totalThisWeek ?? 0);
    const completionRate = totalThisWeek > 0 ? (completedThisWeek / totalThisWeek) * 100 : 0;
    
    // Upcoming events
    const upcomingEventsResult = await db.select({ count: count() })
      .from(calendarEvents)
      .where(and(
        eq(calendarEvents.workspaceId, workspaceId),
        gte(calendarEvents.startTime, now),
        lte(calendarEvents.startTime, oneWeekAhead)
      ));
    
    // Agent stats (active = status is 'active' or 'published')
    const agentStats = await db.select({ count: count() })
      .from(agents)
      .where(and(
        eq(agents.workspaceId, workspaceId),
        sql`${agents.status} IN ('active', 'published')`
      ));
    
    // Agent success rate (executions that succeeded vs total)
    const executionStats = await db.select({
      total: count(),
      successful: sql<number>`SUM(CASE WHEN ${agentExecutions.status} = 'completed' THEN 1 ELSE 0 END)`,
    })
      .from(agentExecutions)
      .where(and(
        eq(agentExecutions.workspaceId, workspaceId),
        gte(agentExecutions.startedAt, oneWeekAgo)
      ));
    
    const totalExecutions = Number(executionStats[0]?.total ?? 0);
    const successfulExecutions = Number(executionStats[0]?.successful ?? 0);
    const agentSuccessRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 100;
    
    return {
      pendingTasks: pending,
      overdueTasks: overdue,
      taskCompletionRate: completionRate,
      avgTaskAge: 0, // Would need more calculation
      upcomingEvents: Number(upcomingEventsResult[0]?.count ?? 0),
      activeAgents: Number(agentStats[0]?.count ?? 0),
      agentSuccessRate,
      automationCoverage: Number(agentStats[0]?.count ?? 0) > 0 ? 25 : 0, // Estimate
    };
  } catch (error) {
    logger.error('[BusinessIntelligence] Failed to collect operations signals', { workspaceId, error });
    return {
      pendingTasks: 0,
      overdueTasks: 0,
      taskCompletionRate: 0,
      avgTaskAge: 0,
      upcomingEvents: 0,
      activeAgents: 0,
      agentSuccessRate: 100,
      automationCoverage: 0,
    };
  }
}

// ============================================================================
// CORRELATION DETECTION
// ============================================================================

/**
 * Detect cross-domain correlations and insights
 */
function detectCorrelations(signals: BusinessSignals): BusinessCorrelation[] {
  const correlations: BusinessCorrelation[] = [];
  const now = new Date();
  
  // Correlation 1: Marketing driving prospects
  if (signals.crm.newLeadsThisWeek > 0 && signals.marketing.activeCampaigns > 0) {
    const leadsPerCampaign = signals.crm.newLeadsThisWeek / signals.marketing.activeCampaigns;
    if (leadsPerCampaign > 2) {
      correlations.push({
        id: `corr-marketing-prospects-${Date.now()}`,
        type: 'insight',
        domains: ['crm', 'marketing'],
        title: 'Marketing campaigns driving strong lead flow',
        description: `Your ${signals.marketing.activeCampaigns} active campaigns are generating ~${leadsPerCampaign.toFixed(1)} new prospects each this week. ${signals.marketing.topPerformingChannel ? `${signals.marketing.topPerformingChannel} is your top channel.` : ''}`,
        impact: 'medium',
        confidence: 0.8,
        suggestedAction: signals.marketing.topPerformingChannel 
          ? `Consider doubling down on ${signals.marketing.topPerformingChannel} content.`
          : 'Review which campaigns are performing best.',
        detectedAt: now,
      });
    }
  }
  
  // Correlation 2: Revenue at risk from cold prospects
  if (signals.crm.coldLeads > 0 && signals.crm.pipelineValue > 0) {
    const coldPercentage = (signals.crm.coldLeads / signals.crm.totalLeads) * 100;
    if (coldPercentage > 30) {
      const atRiskValue = (signals.crm.coldLeads / signals.crm.totalLeads) * signals.crm.pipelineValue;
      correlations.push({
        id: `corr-cold-prospects-${Date.now()}`,
        type: 'risk',
        domains: ['crm', 'finance'],
        title: 'Pipeline value at risk from stale prospects',
        description: `${signals.crm.coldLeads} prospects haven't been touched in 2+ weeks, putting ~$${(atRiskValue / 1000).toFixed(0)}K in pipeline value at risk.`,
        impact: 'high',
        confidence: 0.85,
        suggestedAction: 'I can draft re-engagement emails for these prospects to revive the conversations.',
        detectedAt: now,
      });
    }
  }
  
  // Correlation 3: Cash flow concern from overdue invoices
  if (signals.finance.overdueAmount > 0) {
    const overdueImpact = signals.finance.monthlyRevenue > 0 
      ? (signals.finance.overdueAmount / signals.finance.monthlyRevenue) * 100 
      : 100;
    if (overdueImpact > 20) {
      correlations.push({
        id: `corr-overdue-cashflow-${Date.now()}`,
        type: 'risk',
        domains: ['finance'],
        title: 'Cash flow impacted by overdue invoices',
        description: `Overdue invoices ($${(signals.finance.overdueAmount / 1000).toFixed(0)}K) represent ${overdueImpact.toFixed(0)}% of monthly revenue. This could strain operations.`,
        impact: 'high',
        confidence: 0.9,
        suggestedAction: 'I can send payment reminders to these customers automatically.',
        detectedAt: now,
      });
    }
  }
  
  // Correlation 4: Operational efficiency with agents
  if (signals.operations.activeAgents > 0 && signals.operations.taskCompletionRate > 70) {
    correlations.push({
      id: `corr-automation-efficiency-${Date.now()}`,
      type: 'insight',
      domains: ['operations'],
      title: 'Automation improving task throughput',
      description: `With ${signals.operations.activeAgents} active agents and ${signals.operations.taskCompletionRate.toFixed(0)}% task completion rate, your operational efficiency is solid.`,
      impact: 'medium',
      confidence: 0.75,
      suggestedAction: 'Consider adding agents for your most repetitive remaining tasks.',
      detectedAt: now,
    });
  }
  
  // Correlation 5: Marketing not converting
  if (signals.marketing.avgOpenRate > 20 && signals.crm.newLeadsThisWeek < 2) {
    correlations.push({
      id: `corr-marketing-conversion-${Date.now()}`,
      type: 'opportunity',
      domains: ['marketing', 'crm'],
      title: 'Marketing engagement not converting to prospects',
      description: `Your emails are getting opened (${signals.marketing.avgOpenRate.toFixed(0)}% open rate) but only ${signals.crm.newLeadsThisWeek} new prospects this week. There might be a CTA or landing page opportunity.`,
      impact: 'medium',
      confidence: 0.7,
      suggestedAction: 'Review your email CTAs and landing pages for conversion optimization.',
      detectedAt: now,
    });
  }
  
  // Correlation 6: Hot prospects + upcoming events
  if (signals.crm.hotLeads > 0 && signals.operations.upcomingEvents > 0) {
    correlations.push({
      id: `corr-hot-prospects-events-${Date.now()}`,
      type: 'opportunity',
      domains: ['crm', 'operations'],
      title: 'Momentum building with hot prospects and meetings',
      description: `You have ${signals.crm.hotLeads} hot prospects and ${signals.operations.upcomingEvents} meetings scheduled this week. Good momentum building.`,
      impact: 'medium',
      confidence: 0.8,
      suggestedAction: 'I can prepare meeting briefs or proposal drafts for these hot prospects.',
      detectedAt: now,
    });
  }
  
  // Correlation 7: Revenue growth with pipeline health
  if (signals.finance.revenueGrowth > 10 && signals.crm.pipelineValue > signals.finance.monthlyRevenue * 2) {
    correlations.push({
      id: `corr-growth-pipeline-${Date.now()}`,
      type: 'insight',
      domains: ['finance', 'crm'],
      title: 'Strong growth trajectory with healthy pipeline',
      description: `Revenue is up ${signals.finance.revenueGrowth.toFixed(0)}% month-over-month and your pipeline (${formatCurrency(signals.crm.pipelineValue)}) is 2x+ monthly revenue. The business is scaling well.`,
      impact: 'high',
      confidence: 0.85,
      detectedAt: now,
    });
  }
  
  // Correlation 8: Overdue tasks impacting everything
  if (signals.operations.overdueTasks > 5) {
    correlations.push({
      id: `corr-overdue-tasks-${Date.now()}`,
      type: 'risk',
      domains: ['operations'],
      title: 'Task backlog may be slowing progress',
      description: `${signals.operations.overdueTasks} overdue tasks could be creating bottlenecks. Consider which ones are blocking deals or campaigns.`,
      impact: 'medium',
      confidence: 0.75,
      suggestedAction: 'I can help prioritize and reschedule these tasks.',
      detectedAt: now,
    });
  }
  
  return correlations;
}

// ============================================================================
// HEALTH SCORING
// ============================================================================

/**
 * Calculate overall business health score
 */
function calculateHealthScore(signals: BusinessSignals): BusinessHealthScore {
  // Revenue dimension (0-100)
  let revenueScore = 50; // Base
  if (signals.finance.monthlyRevenue > 0) {
    revenueScore = 60;
    if (signals.finance.revenueGrowth > 0) revenueScore += 15;
    if (signals.finance.revenueGrowth > 10) revenueScore += 10;
    if (signals.finance.profitMargin > 20) revenueScore += 15;
  }
  revenueScore = Math.min(100, revenueScore);
  
  // Pipeline dimension (0-100)
  let pipelineScore = 30; // Base
  if (signals.crm.totalLeads > 0) {
    pipelineScore = 50;
    if (signals.crm.hotLeads > 0) pipelineScore += 20;
    if (signals.crm.newLeadsThisWeek > 3) pipelineScore += 15;
    if (signals.crm.conversionRate > 20) pipelineScore += 15;
    // Penalize cold prospects
    const coldRatio = signals.crm.coldLeads / (signals.crm.totalLeads || 1);
    pipelineScore -= coldRatio * 20;
  }
  pipelineScore = Math.max(0, Math.min(100, pipelineScore));
  
  // Operations dimension (0-100)
  let operationsScore = 50; // Base
  operationsScore += signals.operations.taskCompletionRate * 0.3;
  if (signals.operations.activeAgents > 0) operationsScore += 10;
  if (signals.operations.agentSuccessRate > 90) operationsScore += 10;
  // Penalize overdue tasks
  operationsScore -= signals.operations.overdueTasks * 2;
  operationsScore = Math.max(0, Math.min(100, operationsScore));
  
  // Marketing dimension (0-100)
  let marketingScore = 40; // Base
  if (signals.marketing.activeCampaigns > 0) {
    marketingScore = 50;
    if (signals.marketing.avgOpenRate > 15) marketingScore += 15;
    if (signals.marketing.avgOpenRate > 25) marketingScore += 10;
    if (signals.marketing.avgClickRate > 2) marketingScore += 15;
    // Penalize campaigns needing attention
    marketingScore -= signals.marketing.campaignsNeedingAttention * 5;
  }
  marketingScore = Math.max(0, Math.min(100, marketingScore));
  
  // Cash flow dimension (0-100)
  let cashFlowScore = 50; // Base
  if (signals.finance.monthlyRevenue > 0) {
    const overdueRatio = signals.finance.overdueAmount / (signals.finance.monthlyRevenue || 1);
    cashFlowScore = 70 - (overdueRatio * 50);
    if (signals.finance.cashFlow > 0) cashFlowScore += 20;
  }
  cashFlowScore = Math.max(0, Math.min(100, cashFlowScore));
  
  // Calculate overall (weighted average)
  const overall = Math.round(
    revenueScore * 0.25 +
    pipelineScore * 0.25 +
    operationsScore * 0.20 +
    marketingScore * 0.15 +
    cashFlowScore * 0.15
  );
  
  // Determine trend and momentum
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  let momentum: 'gaining' | 'steady' | 'losing' = 'steady';
  
  if (signals.finance.revenueGrowth > 5 && signals.crm.newLeadsThisWeek > 2) {
    trend = 'improving';
    momentum = 'gaining';
  } else if (signals.finance.revenueGrowth < -5 || signals.crm.coldLeads > signals.crm.hotLeads * 2) {
    trend = 'declining';
    momentum = 'losing';
  }
  
  // Identify strengths and risks
  const strengths: string[] = [];
  const risks: string[] = [];
  
  if (pipelineScore >= 70) strengths.push('Strong sales pipeline');
  if (revenueScore >= 70) strengths.push('Healthy revenue growth');
  if (operationsScore >= 70) strengths.push('Efficient operations');
  if (marketingScore >= 70) strengths.push('Effective marketing');
  if (cashFlowScore >= 70) strengths.push('Solid cash position');
  
  if (pipelineScore < 40) risks.push('Pipeline needs attention');
  if (signals.crm.coldLeads > 5) risks.push('Stale prospects accumulating');
  if (signals.finance.overdueAmount > 0) risks.push('Overdue invoices');
  if (signals.operations.overdueTasks > 3) risks.push('Task backlog');
  if (marketingScore < 40) risks.push('Marketing underperforming');
  
  return {
    overall,
    trend,
    dimensions: {
      revenue: revenueScore,
      pipeline: pipelineScore,
      operations: operationsScore,
      marketing: marketingScore,
      cashFlow: cashFlowScore,
    },
    topStrengths: strengths.slice(0, 3),
    topRisks: risks.slice(0, 3),
    momentum,
  };
}

// ============================================================================
// MAIN EXPORT FUNCTIONS
// ============================================================================

/**
 * Generate complete business intelligence for a workspace
 * 
 * This is the main function Neptune uses to understand the entire business.
 */
export async function generateBusinessIntelligence(
  workspaceId: string
): Promise<BusinessIntelligence> {
  logger.info('[BusinessIntelligence] Generating intelligence', { workspaceId });
  
  // Collect all signals in parallel
  const [crmSignals, marketingSignals, financeSignals, operationsSignals] = await Promise.all([
    collectCRMSignals(workspaceId),
    collectMarketingSignals(workspaceId),
    collectFinanceSignals(workspaceId),
    collectOperationsSignals(workspaceId),
  ]);
  
  const signals: BusinessSignals = {
    crm: crmSignals,
    marketing: marketingSignals,
    finance: financeSignals,
    operations: operationsSignals,
  };
  
  // Detect correlations
  const correlations = detectCorrelations(signals);
  
  // Calculate health score
  const healthScore = calculateHealthScore(signals);
  
  logger.info('[BusinessIntelligence] Generated intelligence', {
    workspaceId,
    correlationCount: correlations.length,
    healthScore: healthScore.overall,
  });
  
  return {
    signals,
    correlations,
    healthScore,
    generatedAt: new Date(),
    workspaceId,
  };
}

/**
 * Get a concise business summary for Neptune's context
 */
export async function getBusinessSummary(workspaceId: string): Promise<string> {
  const intel = await generateBusinessIntelligence(workspaceId);
  
  const parts: string[] = [];
  
  // Health overview
  const healthEmoji = intel.healthScore.overall >= 70 ? '🟢' : intel.healthScore.overall >= 50 ? '🟡' : '🔴';
  parts.push(`## Business Health: ${healthEmoji} ${intel.healthScore.overall}% (${intel.healthScore.momentum})`);
  
  // Key metrics
  parts.push(`### Key Metrics
- Pipeline: ${formatCurrency(intel.signals.crm.pipelineValue)} (${intel.signals.crm.hotLeads} hot prospects)
- Revenue: ${formatCurrency(intel.signals.finance.monthlyRevenue)} (${intel.signals.finance.revenueGrowth > 0 ? '+' : ''}${intel.signals.finance.revenueGrowth.toFixed(0)}% MoM)
- Tasks: ${intel.signals.operations.pendingTasks} pending (${intel.signals.operations.overdueTasks} overdue)
- Marketing: ${intel.signals.marketing.activeCampaigns} active campaigns`);
  
  // Top correlations (insights for Neptune to mention)
  if (intel.correlations.length > 0) {
    const topCorrelations = intel.correlations
      .sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      })
      .slice(0, 3);
    
    parts.push(`### Cross-Domain Insights (mention naturally)
${topCorrelations.map(c => {
  const typeEmoji = c.type === 'opportunity' ? '💡' : c.type === 'risk' ? '⚠️' : '📊';
  return `${typeEmoji} **${c.title}**: ${c.description}${c.suggestedAction ? ` → ${c.suggestedAction}` : ''}`;
}).join('\n')}`);
  }
  
  // Strengths and risks
  if (intel.healthScore.topStrengths.length > 0) {
    parts.push(`### Strengths: ${intel.healthScore.topStrengths.join(', ')}`);
  }
  if (intel.healthScore.topRisks.length > 0) {
    parts.push(`### Areas to Watch: ${intel.healthScore.topRisks.join(', ')}`);
  }
  
  return parts.join('\n\n');
}

/**
 * Get top correlations/insights for Neptune to proactively mention
 */
export async function getTopInsights(
  workspaceId: string, 
  limit = 3
): Promise<BusinessCorrelation[]> {
  const intel = await generateBusinessIntelligence(workspaceId);
  
  return intel.correlations
    .filter(c => c.confidence >= 0.7)
    .sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    })
    .slice(0, limit);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

// Types are already exported via export interface above
