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
  topicIdeas,
  contentSources,
  articleAnalytics,
  useCases,
  blogPosts,
} from '@/db/schema';
import { eq, and, lt, gte, lte, desc, sql, or, isNotNull } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface ProactiveInsight {
  type: 'opportunity' | 'warning' | 'suggestion' | 'achievement';
  category: 'sales' | 'marketing' | 'operations' | 'finance' | 'content';
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
      description: `Deal "${deal.title}" is in negotiation stage. Consider drafting a proposal to move it forward.`,
        priority: 9,
      metadata: { dealId: deal.id, dealName: deal.title, dealValue: deal.value },
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
// CONTENT COCKPIT INSIGHT DETECTORS
// ============================================================================

/**
 * Detect insights for Content Cockpit hit list
 */
export async function detectHitListInsights(
  workspaceId: string
): Promise<ProactiveInsight[]> {
  try {
    const insights: ProactiveInsight[] = [];

    // Get hit list stats
    const [hitListStats] = await db
      .select({
        queued: sql<number>`COUNT(*) FILTER (WHERE status = 'saved')`,
        inProgress: sql<number>`COUNT(*) FILTER (WHERE status = 'in_progress')`,
        highPriority: sql<number>`COUNT(*) FILTER (WHERE priority_score >= 75)`,
      })
      .from(topicIdeas)
      .where(
        and(
          eq(topicIdeas.workspaceId, workspaceId),
          isNotNull(topicIdeas.hitListAddedAt)
        )
      );

    // High priority topics waiting
    if (Number(hitListStats?.highPriority || 0) >= 3) {
      insights.push({
        type: 'opportunity',
        category: 'content',
        title: 'High-Priority Content Opportunities',
        description: `You have ${hitListStats?.highPriority} high-priority topics in your hit list. Consider scheduling time to write these high-impact articles.`,
        priority: 8,
        metadata: { highPriorityCount: hitListStats?.highPriority },
        suggestedActions: [
          {
            action: 'get_hit_list_insights',
            args: {},
          },
        ],
      });
    }

    // Many topics in progress
    if (Number(hitListStats?.inProgress || 0) > 3) {
      insights.push({
        type: 'warning',
        category: 'content',
        title: 'Multiple Articles In Progress',
        description: `You have ${hitListStats?.inProgress} articles currently in progress. Consider finishing some before starting new ones.`,
        priority: 7,
        metadata: { inProgressCount: hitListStats?.inProgress },
      });
    }

    // Empty hit list
    if (Number(hitListStats?.queued || 0) === 0 && Number(hitListStats?.inProgress || 0) === 0) {
      insights.push({
        type: 'suggestion',
        category: 'content',
        title: 'Build Your Content Queue',
        description: 'Your hit list is empty. Add topic ideas to plan your content calendar and maintain consistent publishing.',
        priority: 6,
        suggestedActions: [
          {
            action: 'navigate_to_page',
            args: { page: '/admin/content/hit-list' },
          },
        ],
      });
    }

    return insights;
  } catch (error) {
    logger.error('[Proactive Engine] Failed to detect hit list insights', error);
    return [];
  }
}

/**
 * Detect insights for new source suggestions
 */
export async function detectSourceSuggestionInsights(
  workspaceId: string
): Promise<ProactiveInsight[]> {
  try {
    const insights: ProactiveInsight[] = [];

    // Count suggested sources
    const [suggestedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contentSources)
      .where(
        and(
          eq(contentSources.workspaceId, workspaceId),
          eq(contentSources.status, 'suggested')
        )
      );

    if (Number(suggestedCount?.count || 0) > 0) {
      insights.push({
        type: 'suggestion',
        category: 'content',
        title: `${suggestedCount?.count} New Source Suggestions`,
        description: `I discovered ${suggestedCount?.count} new research sources for your content. Review them in Sources Hub.`,
        priority: 5,
        metadata: { suggestedCount: suggestedCount?.count },
        suggestedActions: [
          {
            action: 'get_source_suggestions',
            args: {},
          },
        ],
      });
    }

    return insights;
  } catch (error) {
    logger.error('[Proactive Engine] Failed to detect source suggestion insights', error);
    return [];
  }
}

/**
 * Detect insights for content performance anomalies
 */
export async function detectContentPerformanceInsights(
  workspaceId: string
): Promise<ProactiveInsight[]> {
  try {
    const insights: ProactiveInsight[] = [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get current period views
    const [currentViews] = await db
      .select({ total: sql<number>`COALESCE(SUM(${articleAnalytics.totalViews}), 0)` })
      .from(articleAnalytics)
      .where(
        and(
          eq(articleAnalytics.workspaceId, workspaceId),
          gte(articleAnalytics.periodStart, thirtyDaysAgo)
        )
      );

    // Get previous period views
    const [previousViews] = await db
      .select({ total: sql<number>`COALESCE(SUM(${articleAnalytics.totalViews}), 0)` })
      .from(articleAnalytics)
      .where(
        and(
          eq(articleAnalytics.workspaceId, workspaceId),
          gte(articleAnalytics.periodStart, previousPeriodStart),
          lt(articleAnalytics.periodEnd, thirtyDaysAgo)
        )
      );

    const current = Number(currentViews?.total || 0);
    const previous = Number(previousViews?.total || 0);

    // Significant decline (> 20%)
    if (previous > 100 && current < previous * 0.8) {
      const decline = Math.round((1 - current / previous) * 100);
      insights.push({
        type: 'warning',
        category: 'content',
        title: 'Content Views Declining',
        description: `Article views are down ${decline}% compared to last month. Consider refreshing older content or promoting top performers.`,
        priority: 7,
        metadata: { currentViews: current, previousViews: previous, declinePercent: decline },
        suggestedActions: [
          {
            action: 'get_article_analytics',
            args: { period: '30d' },
          },
        ],
      });
    }

    // Significant growth (> 30%)
    if (previous > 50 && current > previous * 1.3) {
      const growth = Math.round((current / previous - 1) * 100);
      insights.push({
        type: 'achievement',
        category: 'content',
        title: 'Content Views Growing!',
        description: `Great news! Article views are up ${growth}% compared to last month. Keep up the momentum!`,
        priority: 6,
        metadata: { currentViews: current, previousViews: previous, growthPercent: growth },
      });
    }

    return insights;
  } catch (error) {
    logger.error('[Proactive Engine] Failed to detect content performance insights', error);
    return [];
  }
}

/**
 * Detect insights for incomplete use cases
 */
export async function detectUseCaseInsights(
  workspaceId: string
): Promise<ProactiveInsight[]> {
  try {
    const insights: ProactiveInsight[] = [];

    // Find draft use cases without roadmaps
    const incompleteUseCases = await db
      .select({ id: useCases.id, name: useCases.name })
      .from(useCases)
      .where(
        and(
          eq(useCases.workspaceId, workspaceId),
          eq(useCases.status, 'draft'),
          sql`jsonb_array_length(${useCases.roadmap}) = 0`
        )
      )
      .limit(3);

    if (incompleteUseCases.length > 0) {
      insights.push({
        type: 'suggestion',
        category: 'content',
        title: 'Incomplete Use Cases',
        description: `${incompleteUseCases.length} use case${incompleteUseCases.length > 1 ? 's' : ''} need${incompleteUseCases.length === 1 ? 's' : ''} a roadmap. Generate AI roadmaps to help guide users.`,
        priority: 5,
        metadata: { 
          incompleteCount: incompleteUseCases.length,
          useCaseIds: incompleteUseCases.map(uc => uc.id),
        },
        suggestedActions: [
          {
            action: 'navigate_to_page',
            args: { page: `/admin/content/use-cases/${incompleteUseCases[0].id}` },
          },
        ],
      });
    }

    return insights;
  } catch (error) {
    logger.error('[Proactive Engine] Failed to detect use case insights', error);
    return [];
  }
}

/**
 * Detect content gap opportunities
 */
export async function detectContentGapInsights(
  workspaceId: string
): Promise<ProactiveInsight[]> {
  try {
    const insights: ProactiveInsight[] = [];

    // Check for long gaps since last publish
    const [lastPublished] = await db
      .select({ publishedAt: blogPosts.publishedAt })
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(1);

    if (lastPublished?.publishedAt) {
      const daysSincePublish = Math.floor(
        (Date.now() - new Date(lastPublished.publishedAt).getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysSincePublish >= 14) {
        insights.push({
          type: 'warning',
          category: 'content',
          title: 'Content Publishing Gap',
          description: `It's been ${daysSincePublish} days since your last article. Consistent publishing helps maintain audience engagement.`,
          priority: 7,
          metadata: { daysSincePublish },
          suggestedActions: [
            {
              action: 'get_hit_list_insights',
              args: {},
            },
          ],
        });
      }
    }

    return insights;
  } catch (error) {
    logger.error('[Proactive Engine] Failed to detect content gap insights', error);
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
    categories?: Array<'sales' | 'marketing' | 'operations' | 'finance' | 'content'>;
    maxInsights?: number;
  } = {}
): Promise<ProactiveInsight[]> {
  const { categories = ['sales', 'marketing', 'operations', 'finance', 'content'], maxInsights = 10 } = options;

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

    // Content Cockpit insights
    if (categories.includes('content')) {
      const hitListInsights = await detectHitListInsights(workspaceId);
      allInsights.push(...hitListInsights);

      const sourceInsights = await detectSourceSuggestionInsights(workspaceId);
      allInsights.push(...sourceInsights);

      const performanceInsights = await detectContentPerformanceInsights(workspaceId);
      allInsights.push(...performanceInsights);

      const useCaseInsights = await detectUseCaseInsights(workspaceId);
      allInsights.push(...useCaseInsights);

      const contentGapInsights = await detectContentGapInsights(workspaceId);
      allInsights.push(...contentGapInsights);
    }

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
