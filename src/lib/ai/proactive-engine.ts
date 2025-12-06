/**
 * Proactive Intelligence Engine
 * 
 * Monitors workspace data and generates proactive insights and suggestions.
 * Runs in background to identify opportunities, risks, and actions.
 */

import { db } from '@/lib/db';
import { proactiveInsights, prospects, campaigns, tasks, calendarEvents, invoices } from '@/db/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Insight {
  type: 'opportunity' | 'risk' | 'suggestion' | 'alert';
  priority: number; // 1-10
  category: 'sales' | 'marketing' | 'operations' | 'finance';
  title: string;
  description: string;
  suggestedActions: Array<{ action: string; toolName?: string; args?: Record<string, unknown> }>;
  autoExecutable: boolean;
}

// ============================================================================
// SALES & CRM MONITORING
// ============================================================================

/**
 * Analyze sales pipeline for opportunities and risks
 */
export async function analyzeSalesPipeline(workspaceId: string): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    // Get all leads
    const leads = await db.query.prospects.findMany({
      where: eq(prospects.workspaceId, workspaceId),
    });

    // Check for stalled deals
    const stalledLeads = leads.filter(lead => {
      if (!lead.updatedAt) return false;
      const daysSinceUpdate = (Date.now() - new Date(lead.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceUpdate > 7 && ['qualified', 'proposal', 'negotiation'].includes(lead.stage || '');
    });

    if (stalledLeads.length > 0) {
      insights.push({
        type: 'risk',
        priority: 7,
        category: 'sales',
        title: `${stalledLeads.length} Stalled Deal${stalledLeads.length !== 1 ? 's' : ''}`,
        description: `${stalledLeads.length} deal${stalledLeads.length !== 1 ? 's' : ''} haven't been updated in over a week. Follow up to re-engage.`,
        suggestedActions: stalledLeads.slice(0, 3).map(lead => ({
          action: `Follow up with ${lead.name}`,
          toolName: 'create_follow_up_sequence',
          args: { leadId: lead.id, sequenceType: 'sales' },
        })),
        autoExecutable: false,
      });
    }

    // Check for hot leads ready to close
    const hotLeads = leads.filter(lead => 
      lead.stage === 'negotiation' && lead.estimatedValue && lead.estimatedValue > 10000
    );

    if (hotLeads.length > 0) {
      insights.push({
        type: 'opportunity',
        priority: 9,
        category: 'sales',
        title: `${hotLeads.length} High-Value Deal${hotLeads.length !== 1 ? 's' : ''} in Negotiation`,
        description: `${hotLeads.length} deal${hotLeads.length !== 1 ? 's' : ''} worth $${hotLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0).toLocaleString()} in final stage. Push to close!`,
        suggestedActions: [
          {
            action: 'Draft proposal for top deal',
            toolName: 'draft_proposal',
            args: { dealId: hotLeads[0].id, includePricing: true },
          },
        ],
        autoExecutable: false,
      });
    }

    // Check for new leads without follow-up
    const newLeadsWithoutFollowUp = leads.filter(lead => {
      if (lead.stage !== 'new') return false;
      if (!lead.createdAt) return false;
      const daysSinceCreated = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreated > 2;
    });

    if (newLeadsWithoutFollowUp.length > 0) {
      insights.push({
        type: 'suggestion',
        priority: 6,
        category: 'sales',
        title: `${newLeadsWithoutFollowUp.length} New Lead${newLeadsWithoutFollowUp.length !== 1 ? 's' : ''} Need Follow-Up`,
        description: `Qualify and engage ${newLeadsWithoutFollowUp.length} new lead${newLeadsWithoutFollowUp.length !== 1 ? 's' : ''} before they go cold.`,
        suggestedActions: [
          {
            action: 'Auto-qualify leads',
            toolName: 'auto_qualify_lead',
            args: { leadId: newLeadsWithoutFollowUp[0].id },
          },
        ],
        autoExecutable: false,
      });
    }
  } catch (error) {
    logger.error('Failed to analyze sales pipeline', { workspaceId, error });
  }

  return insights;
}

// ============================================================================
// MARKETING MONITORING
// ============================================================================

/**
 * Analyze marketing campaigns for opportunities
 */
export async function analyzeMarketingCampaigns(workspaceId: string): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    const allCampaigns = await db.query.campaigns.findMany({
      where: eq(campaigns.workspaceId, workspaceId),
    });

    // Check for low-performing campaigns
    const lowPerformers = allCampaigns.filter(campaign => {
      if (!campaign.sentCount || campaign.sentCount < 50) return false; // Need meaningful volume
      const openRate = campaign.openCount && campaign.sentCount 
        ? (campaign.openCount / campaign.sentCount) * 100 
        : 0;
      return openRate < 15; // Below industry average
    });

    if (lowPerformers.length > 0) {
      insights.push({
        type: 'risk',
        priority: 6,
        category: 'marketing',
        title: `${lowPerformers.length} Campaign${lowPerformers.length !== 1 ? 's' : ''} Underperforming`,
        description: `${lowPerformers.length} campaign${lowPerformers.length !== 1 ? 's' : ''} have open rates below 15%. Optimize subject lines and content.`,
        suggestedActions: [
          {
            action: 'Optimize campaign',
            toolName: 'optimize_campaign',
            args: { campaignId: lowPerformers[0].id, testType: 'subject' },
          },
        ],
        autoExecutable: false,
      });
    }

    // Check for high-performing campaigns to scale
    const highPerformers = allCampaigns.filter(campaign => {
      if (!campaign.sentCount || campaign.sentCount < 50) return false;
      const openRate = campaign.openCount && campaign.sentCount 
        ? (campaign.openCount / campaign.sentCount) * 100 
        : 0;
      return openRate >= 25; // Well above average
    });

    if (highPerformers.length > 0) {
      insights.push({
        type: 'opportunity',
        priority: 7,
        category: 'marketing',
        title: `${highPerformers.length} High-Performing Campaign${highPerformers.length !== 1 ? 's' : ''}`,
        description: `Scale these winning campaigns to reach more leads.`,
        suggestedActions: [
          {
            action: 'Create similar campaign',
            toolName: 'create_campaign',
            args: {},
          },
        ],
        autoExecutable: false,
      });
    }
  } catch (error) {
    logger.error('Failed to analyze marketing campaigns', { workspaceId, error });
  }

  return insights;
}

// ============================================================================
// OPERATIONS MONITORING
// ============================================================================

/**
 * Analyze operations for efficiency opportunities
 */
export async function analyzeOperations(workspaceId: string): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    // Check for overdue tasks
    const allTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.workspaceId, workspaceId),
        eq(tasks.status, 'todo')
      ),
    });

    const overdueTasks = allTasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < new Date();
    });

    if (overdueTasks.length > 0) {
      insights.push({
        type: 'alert',
        priority: 8,
        category: 'operations',
        title: `${overdueTasks.length} Overdue Task${overdueTasks.length !== 1 ? 's' : ''}`,
        description: `You have ${overdueTasks.length} task${overdueTasks.length !== 1 ? 's' : ''} past their due date. Prioritize and complete them.`,
        suggestedActions: [
          {
            action: 'Prioritize tasks',
            toolName: 'prioritize_tasks',
            args: { priorityMethod: 'urgency' },
          },
        ],
        autoExecutable: true, // Safe to auto-execute
      });
    }

    // Check for tasks that can be batched
    const taskTitles = allTasks.map(t => t.title.toLowerCase());
    const commonWords = taskTitles
      .flatMap(title => title.split(' '))
      .filter(word => word.length > 3)
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const batchableKeywords = Object.entries(commonWords)
      .filter(([_, count]) => count >= 3)
      .map(([word]) => word);

    if (batchableKeywords.length > 0) {
      insights.push({
        type: 'suggestion',
        priority: 5,
        category: 'operations',
        title: 'Batch Similar Tasks',
        description: `You have multiple similar tasks that can be completed together for efficiency.`,
        suggestedActions: [
          {
            action: 'Group similar tasks',
            toolName: 'batch_similar_tasks',
            args: {},
          },
        ],
        autoExecutable: true,
      });
    }
  } catch (error) {
    logger.error('Failed to analyze operations', { workspaceId, error });
  }

  return insights;
}

// ============================================================================
// FINANCE MONITORING
// ============================================================================

/**
 * Analyze financial data for risks and opportunities
 */
export async function analyzeFinance(workspaceId: string): Promise<Insight[]> {
  const insights: Insight[] = [];

  try {
    // Check for overdue invoices
    const allInvoices = await db.query.invoices.findMany({
      where: eq(invoices.workspaceId, workspaceId),
    });

    const overdueInvoices = allInvoices.filter(invoice => {
      if (!invoice.dueDate || invoice.status === 'paid') return false;
      return new Date(invoice.dueDate) < new Date();
    });

    if (overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      insights.push({
        type: 'alert',
        priority: 9,
        category: 'finance',
        title: `${overdueInvoices.length} Overdue Invoice${overdueInvoices.length !== 1 ? 's' : ''}`,
        description: `$${totalOverdue.toLocaleString()} in overdue invoices. Send payment reminders to improve cash flow.`,
        suggestedActions: [
          {
            action: 'Send payment reminders',
            toolName: 'send_payment_reminders',
            args: { autoSend: false }, // Create drafts for review
          },
        ],
        autoExecutable: false,
      });
    }

    // Check for cash flow projection
    insights.push({
      type: 'suggestion',
      priority: 6,
      category: 'finance',
      title: 'Review Cash Flow Projection',
      description: 'Generate 30/60/90 day cash flow forecast to plan ahead.',
      suggestedActions: [
        {
          action: 'Project cash flow',
          toolName: 'project_cash_flow',
          args: { includeScenarios: true },
        },
      ],
      autoExecutable: true,
    });
  } catch (error) {
    logger.error('Failed to analyze finance', { workspaceId, error });
  }

  return insights;
}

// ============================================================================
// MAIN INSIGHT GENERATOR
// ============================================================================

/**
 * Generate all proactive insights for a workspace
 */
export async function generateProactiveInsights(workspaceId: string, userId?: string): Promise<Insight[]> {
  const allInsights: Insight[] = [];

  // Run all analyzers in parallel
  const [salesInsights, marketingInsights, operationsInsights, financeInsights] = await Promise.all([
    analyzeSalesPipeline(workspaceId),
    analyzeMarketingCampaigns(workspaceId),
    analyzeOperations(workspaceId),
    analyzeFinance(workspaceId),
  ]);

  allInsights.push(...salesInsights, ...marketingInsights, ...operationsInsights, ...financeInsights);

  // Sort by priority (highest first)
  allInsights.sort((a, b) => b.priority - a.priority);

  return allInsights;
}

/**
 * Store insights in database
 */
export async function storeInsights(workspaceId: string, insights: Insight[], userId?: string): Promise<void> {
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Expire after 7 days

    for (const insight of insights) {
      await db.insert(proactiveInsights).values({
        workspaceId,
        userId: userId || null,
        type: insight.type,
        priority: insight.priority,
        category: insight.category,
        title: insight.title,
        description: insight.description,
        suggestedActions: insight.suggestedActions,
        autoExecutable: insight.autoExecutable,
        expiresAt,
      });
    }

    logger.info('Stored proactive insights', { workspaceId, count: insights.length });
  } catch (error) {
    logger.error('Failed to store insights', { workspaceId, error });
  }
}

/**
 * Get active insights for a workspace/user
 */
export async function getActiveInsights(workspaceId: string, userId?: string, limit = 10): Promise<typeof proactiveInsights.$inferSelect[]> {
  try {
    const whereConditions = [
      eq(proactiveInsights.workspaceId, workspaceId),
      sql`${proactiveInsights.dismissedAt} IS NULL`,
      sql`(${proactiveInsights.expiresAt} IS NULL OR ${proactiveInsights.expiresAt} > NOW())`,
    ];

    if (userId) {
      whereConditions.push(
        sql`(${proactiveInsights.userId} IS NULL OR ${proactiveInsights.userId} = ${userId})`
      );
    }

    const insights = await db.query.proactiveInsights.findMany({
      where: and(...whereConditions),
      orderBy: [desc(proactiveInsights.priority), desc(proactiveInsights.createdAt)],
      limit,
    });

    return insights;
  } catch (error) {
    logger.error('Failed to get active insights', { workspaceId, userId, error });
    return [];
  }
}
