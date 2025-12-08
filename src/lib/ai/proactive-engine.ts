/**
 * Proactive Intelligence Engine
 * 
 * Monitors workspace data and generates real-time insights and suggestions.
 * Event-driven system that responds to changes in CRM, campaigns, tasks, etc.
 */

import { db } from '@/lib/db';
import { 
  prospects, 
  campaigns, 
  tasks, 
  calendarEvents,
  deals,
  proactiveInsights,
} from '@/db/schema';
import { eq, and, lt, gte, lte, desc, sql, or } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { getOpenAI } from '@/lib/ai-providers';

// ============================================================================
// TYPES
// ============================================================================

export interface ProactiveInsight {
  type: 'opportunity' | 'warning' | 'suggestion' | 'achievement';
  category: 'sales' | 'marketing' | 'operations' | 'finance';
  title: string;
  description: string;
  priority: number; // 1-10 (matches database schema)
  metadata?: Record<string, unknown>;
  suggestedActions?: Array<{
    action: string;
    args?: Record<string, unknown>;
  }>;
}

// ============================================================================
// EVENT DETECTORS
// ============================================================================

/**
 * Detect insights when a new lead is created
 */
export async function detectNewLeadInsights(
  workspaceId: string,
  leadId: string
): Promise<ProactiveInsight[]> {
  try {
    const lead = await db.query.prospects.findFirst({
      where: and(
        eq(prospects.id, leadId),
        eq(prospects.workspaceId, workspaceId)
      ),
    });

    if (!lead) return [];

    const insights: ProactiveInsight[] = [];

    // Suggest qualification if lead has high estimated value
    if (lead.estimatedValue && lead.estimatedValue > 10000) {
      insights.push({
        type: 'opportunity',
        category: 'sales',
        title: 'High-Value Lead Created',
        description: `${lead.name} has an estimated value of $${(lead.estimatedValue / 100).toFixed(2)}. Consider prioritizing qualification.`,
        priority: 9,
        metadata: { leadId: lead.id, leadName: lead.name },
        suggestedActions: [
          {
            action: 'auto_qualify_lead',
            args: { leadId: lead.id },
          },
        ],
      });
    }

    // Suggest adding to campaign if email provided
    if (lead.email) {
      insights.push({
        type: 'suggestion',
        category: 'marketing',
        title: 'Add Lead to Campaign',
        description: `${lead.name} has an email address. Consider adding them to a nurturing campaign.`,
        priority: 60,
        metadata: { leadId: lead.id, leadEmail: lead.email },
      });
    }

    return insights;
  } catch (error) {
    logger.error('[Proactive Engine] Failed to detect new lead insights', error);
    return [];
  }
}

/**
 * Detect insights when a deal enters negotiation stage
 */
export async function detectDealNegotiationInsights(
  workspaceId: string,
  dealId: string
): Promise<ProactiveInsight[]> {
  try {
    const deal = await db.query.deals.findFirst({
      where: and(
        eq(deals.id, dealId),
        eq(deals.workspaceId, workspaceId)
      ),
    });

    if (!deal || deal.stage !== 'negotiation') return [];

    const insights: ProactiveInsight[] = [];

    // Suggest drafting proposal
    insights.push({
      type: 'opportunity',
      category: 'sales',
      title: 'Deal in Negotiation - Draft Proposal',
      description: `Deal "${deal.name}" is in negotiation stage. Consider drafting a proposal to move it forward.`,
        priority: 9,
      metadata: { dealId: deal.id, dealName: deal.name, dealValue: deal.value },
      suggestedActions: [
        {
          action: 'draft_proposal',
          args: { dealId: deal.id },
        },
      ],
    });

    return insights;
  } catch (error) {
    logger.error('[Proactive Engine] Failed to detect deal negotiation insights', error);
    return [];
  }
}

/**
 * Detect insights for overdue tasks
 */
export async function detectOverdueTaskInsights(
  workspaceId: string
): Promise<ProactiveInsight[]> {
  try {
    const now = new Date();
    const overdueTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.workspaceId, workspaceId),
        eq(tasks.status, 'todo'),
        lt(tasks.dueDate, now)
      ),
      orderBy: [desc(tasks.dueDate)],
      limit: 10,
    });

    if (overdueTasks.length === 0) return [];

    return [{
      type: 'warning',
      category: 'operations',
      title: `${overdueTasks.length} Overdue Task${overdueTasks.length !== 1 ? 's' : ''}`,
      description: `You have ${overdueTasks.length} overdue task${overdueTasks.length !== 1 ? 's' : ''}. Consider prioritizing or rescheduling.`,
      priority: 85,
      metadata: { 
        overdueCount: overdueTasks.length,
        taskIds: overdueTasks.map(t => t.id),
      },
      suggestedActions: [
        {
          action: 'prioritize_tasks',
          args: { 
            taskIds: overdueTasks.map(t => t.id),
            priorityMethod: 'urgency',
          },
        },
      ],
    }];
  } catch (error) {
    logger.error('[Proactive Engine] Failed to detect overdue task insights', error);
    return [];
  }
}

/**
 * Detect insights for underperforming campaigns
 */
export async function detectCampaignPerformanceInsights(
  workspaceId: string
): Promise<ProactiveInsight[]> {
  try {
    const activeCampaigns = await db.query.campaigns.findMany({
      where: and(
        eq(campaigns.workspaceId, workspaceId),
        eq(campaigns.status, 'active')
      ),
    });

    const insights: ProactiveInsight[] = [];

    for (const campaign of activeCampaigns) {
      if (!campaign.sentCount || campaign.sentCount < 50) continue; // Need meaningful volume

      const openRate = (campaign.openCount || 0) / campaign.sentCount;
      const clickRate = (campaign.clickCount || 0) / campaign.sentCount;

      // Low open rate
      if (openRate < 0.15) {
        insights.push({
          type: 'warning',
          category: 'marketing',
          title: `Campaign "${campaign.name}" Underperforming`,
          description: `Open rate is ${(openRate * 100).toFixed(1)}% (industry average: 21%). Consider A/B testing subject lines.`,
          priority: 8,
          metadata: { 
            campaignId: campaign.id,
            campaignName: campaign.name,
            openRate: openRate * 100,
          },
          suggestedActions: [
            {
              action: 'optimize_campaign',
              args: { 
                campaignId: campaign.id,
                testType: 'subject',
              },
            },
          ],
        });
      }

      // Low click rate (but good open rate)
      if (openRate >= 0.20 && clickRate < 0.02) {
        insights.push({
          type: 'suggestion',
          category: 'marketing',
          title: `Campaign "${campaign.name}" - Low Click Rate`,
          description: `Click rate is ${(clickRate * 100).toFixed(1)}% despite good open rate. Consider optimizing CTAs.`,
          priority: 7,
          metadata: { 
            campaignId: campaign.id,
            campaignName: campaign.name,
            clickRate: clickRate * 100,
          },
          suggestedActions: [
            {
              action: 'optimize_campaign',
              args: { 
                campaignId: campaign.id,
                testType: 'cta',
              },
            },
          ],
        });
      }
    }

    return insights;
  } catch (error) {
    logger.error('[Proactive Engine] Failed to detect campaign performance insights', error);
    return [];
  }
}

/**
 * Detect insights for upcoming meetings
 */
export async function detectUpcomingMeetingInsights(
  workspaceId: string
): Promise<ProactiveInsight[]> {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const upcomingEvents = await db.query.calendarEvents.findMany({
      where: and(
        eq(calendarEvents.workspaceId, workspaceId),
        gte(calendarEvents.startTime, now),
        lte(calendarEvents.startTime, dayAfter)
      ),
      orderBy: [calendarEvents.startTime],
      limit: 5,
    });

    if (upcomingEvents.length === 0) return [];

    const insights: ProactiveInsight[] = [];

    // Check for meetings tomorrow
    const tomorrowEvents = upcomingEvents.filter(e => {
      const eventDate = new Date(e.startTime);
      return eventDate >= tomorrow && eventDate < dayAfter;
    });

    if (tomorrowEvents.length > 0) {
      insights.push({
        type: 'suggestion',
        category: 'operations',
        title: `${tomorrowEvents.length} Meeting${tomorrowEvents.length !== 1 ? 's' : ''} Tomorrow`,
        description: `You have ${tomorrowEvents.length} meeting${tomorrowEvents.length !== 1 ? 's' : ''} scheduled for tomorrow. Want me to prep briefs?`,
        priority: 70,
        metadata: { 
          eventCount: tomorrowEvents.length,
          eventIds: tomorrowEvents.map(e => e.id),
        },
      });
    }

    return insights;
  } catch (error) {
    logger.error('[Proactive Engine] Failed to detect upcoming meeting insights', error);
    return [];
  }
}

// ============================================================================
// MAIN INSIGHT GENERATION
// ============================================================================

/**
 * Generate all proactive insights for a workspace
 */
export async function generateProactiveInsights(
  workspaceId: string,
  options: {
    categories?: Array<'sales' | 'marketing' | 'operations' | 'finance'>;
    maxInsights?: number;
  } = {}
): Promise<ProactiveInsight[]> {
  const { categories = ['sales', 'marketing', 'operations', 'finance'], maxInsights = 10 } = options;

  const allInsights: ProactiveInsight[] = [];

  try {
    // Sales insights
    if (categories.includes('sales')) {
      // Overdue tasks that might be sales-related
      const overdueTaskInsights = await detectOverdueTaskInsights(workspaceId);
      allInsights.push(...overdueTaskInsights);

      // Stalled deals
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const stalledDeals = await db.query.deals.findMany({
        where: and(
          eq(deals.workspaceId, workspaceId),
          lt(deals.updatedAt, weekAgo),
          eq(deals.stage, 'negotiation')
        ),
        limit: 5,
      });

      if (stalledDeals.length > 0) {
        allInsights.push({
          type: 'warning',
          category: 'sales',
          title: `${stalledDeals.length} Stalled Deal${stalledDeals.length !== 1 ? 's' : ''}`,
          description: `${stalledDeals.length} deal${stalledDeals.length !== 1 ? 's' : ''} in negotiation haven't been updated in over a week. Consider following up.`,
          priority: 8,
          metadata: { 
            dealCount: stalledDeals.length,
            dealIds: stalledDeals.map(d => d.id),
          },
        });
      }
    }

    // Marketing insights
    if (categories.includes('marketing')) {
      const campaignInsights = await detectCampaignPerformanceInsights(workspaceId);
      allInsights.push(...campaignInsights);
    }

    // Operations insights
    if (categories.includes('operations')) {
      const meetingInsights = await detectUpcomingMeetingInsights(workspaceId);
      allInsights.push(...meetingInsights);
    }

    // Finance insights (handled by precompute-insights.ts)

    // Sort by priority and limit
    return allInsights
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxInsights);

  } catch (error) {
    logger.error('[Proactive Engine] Failed to generate insights', error);
    return [];
  }
}

/**
 * Get active (non-dismissed) insights for a workspace
 */
export async function getActiveInsights(
  workspaceId: string,
  userId: string,
  limit: number = 10
): Promise<Array<{
  id: string;
  type: ProactiveInsight['type'];
  category: ProactiveInsight['category'];
  title: string;
  description: string;
  priority: number;
  suggestedActions?: Array<{ action: string; args?: Record<string, unknown> }>;
  createdAt: Date;
}>> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get recent, non-dismissed insights
    const insights = await db.query.proactiveInsights.findMany({
      where: and(
        eq(proactiveInsights.workspaceId, workspaceId),
        gte(proactiveInsights.createdAt, sevenDaysAgo),
        sql`${proactiveInsights.dismissedAt} IS NULL`,
        or(
          eq(proactiveInsights.userId, userId),
          sql`${proactiveInsights.userId} IS NULL` // Workspace-wide insights
        )!
      ),
      orderBy: [desc(proactiveInsights.priority), desc(proactiveInsights.createdAt)],
      limit,
    });

    return insights.map(i => ({
      id: i.id,
      type: i.type as ProactiveInsight['type'],
      category: i.category as ProactiveInsight['category'],
      title: i.title,
      description: i.description,
      priority: i.priority,
      suggestedActions: i.suggestedActions as Array<{ action: string; args?: Record<string, unknown> }> || [],
      createdAt: i.createdAt,
    }));
  } catch (error) {
    logger.error('[Proactive Engine] Failed to get active insights', error);
    return [];
  }
}

/**
 * Store insights in database
 */
export async function storeProactiveInsights(
  workspaceId: string,
  insights: ProactiveInsight[],
  userId?: string
): Promise<void> {
  if (insights.length === 0) return;

  try {
    for (const insight of insights) {
      await db.insert(proactiveInsights).values({
        workspaceId,
        userId: userId || null,
        type: insight.type,
        category: insight.category,
        title: insight.title,
        description: insight.description,
        priority: insight.priority,
        suggestedActions: (insight.suggestedActions || []).map(sa => ({
          action: sa.action,
          args: sa.args,
        })),
        autoExecutable: false, // Default to false for safety
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expire after 7 days
      });
    }

    logger.info('[Proactive Engine] Stored insights', {
      workspaceId,
      userId,
      count: insights.length,
    });
  } catch (error) {
    logger.error('[Proactive Engine] Failed to store insights', error);
  }
}
