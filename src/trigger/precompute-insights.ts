/**
 * Precompute Insights Job
 * 
 * Runs daily to generate proactive insights for users
 * based on their workspace data and activity.
 */

import { schedules, task } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { proactiveInsights, prospects, campaigns, tasks, calendarEvents } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

interface InsightData {
  type: 'opportunity' | 'warning' | 'suggestion' | 'achievement';
  category: 'sales' | 'marketing' | 'operations' | 'finance';
  title: string;
  description: string;
  priority: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function gatherWorkspaceMetrics(workspaceId: string) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get lead metrics
  const allLeads = await db.query.prospects.findMany({
    where: eq(prospects.workspaceId, workspaceId),
  });

  const newLeadsThisWeek = allLeads.filter(
    l => new Date(l.createdAt) >= weekAgo
  ).length;

  const leadsByStage: Record<string, number> = {};
  let totalPipelineValue = 0;
  const stalledLeads: typeof allLeads = [];

  for (const lead of allLeads) {
    leadsByStage[lead.stage] = (leadsByStage[lead.stage] || 0) + 1;
    if (lead.estimatedValue && !['won', 'lost'].includes(lead.stage)) {
      totalPipelineValue += lead.estimatedValue;
    }
    // Check for stalled leads (no update in 7+ days, not won/lost)
    if (
      !['won', 'lost'].includes(lead.stage) &&
      new Date(lead.updatedAt) < weekAgo
    ) {
      stalledLeads.push(lead);
    }
  }

  // Get campaign metrics
  const activeCampaigns = await db.query.campaigns.findMany({
    where: and(
      eq(campaigns.workspaceId, workspaceId),
      eq(campaigns.status, 'active')
    ),
  });

  let totalSent = 0;
  let totalOpens = 0;
  let totalClicks = 0;
  const underperformingCampaigns: typeof activeCampaigns = [];

  for (const campaign of activeCampaigns) {
    totalSent += campaign.sentCount || 0;
    totalOpens += campaign.openCount || 0;
    totalClicks += campaign.clickCount || 0;
    
    // Check for underperforming campaigns (< 15% open rate with 100+ sends)
    if (campaign.sentCount && campaign.sentCount >= 100) {
      const openRate = (campaign.openCount || 0) / campaign.sentCount;
      if (openRate < 0.15) {
        underperformingCampaigns.push(campaign);
      }
    }
  }

  // Get task metrics
  const pendingTasks = await db.query.tasks.findMany({
    where: and(
      eq(tasks.workspaceId, workspaceId),
      eq(tasks.status, 'todo')
    ),
  });

  const overdueTasks = pendingTasks.filter(
    t => t.dueDate && new Date(t.dueDate) < now
  );

  // Get upcoming events (next 7 days)
  const upcomingEvents = await db.query.calendarEvents.findMany({
    where: and(
      eq(calendarEvents.workspaceId, workspaceId),
      gte(calendarEvents.startTime, now),
      lte(calendarEvents.startTime, weekAhead)
    ),
    limit: 10,
  });

  return {
    leads: {
      total: allLeads.length,
      newThisWeek: newLeadsThisWeek,
      byStage: leadsByStage,
      pipelineValue: totalPipelineValue / 100,
      stalled: stalledLeads,
    },
    campaigns: {
      active: activeCampaigns.length,
      avgOpenRate: totalSent > 0 ? (totalOpens / totalSent) * 100 : 0,
      avgClickRate: totalSent > 0 ? (totalClicks / totalSent) * 100 : 0,
      underperforming: underperformingCampaigns,
    },
    tasks: {
      pending: pendingTasks.length,
      overdue: overdueTasks.length,
    },
    events: {
      upcoming: upcomingEvents.length,
    },
  };
}

async function generateInsights(
  workspaceId: string,
  metrics: Awaited<ReturnType<typeof gatherWorkspaceMetrics>>
): Promise<InsightData[]> {
  const insights: InsightData[] = [];

  // Sales Insights
  if (metrics.leads.stalled.length > 0) {
    insights.push({
      type: 'warning',
      category: 'sales',
      title: `${metrics.leads.stalled.length} Stalled Leads Need Attention`,
      description: `You have ${metrics.leads.stalled.length} leads that haven't been updated in over a week. Consider following up to prevent them from going cold.`,
      priority: 80,
      metadata: {
        leadIds: metrics.leads.stalled.slice(0, 5).map(l => l.id),
        leadNames: metrics.leads.stalled.slice(0, 5).map(l => l.name),
      },
    });
  }

  if (metrics.leads.newThisWeek > 5) {
    insights.push({
      type: 'achievement',
      category: 'sales',
      title: `Great Week! ${metrics.leads.newThisWeek} New Leads`,
      description: `You added ${metrics.leads.newThisWeek} new leads this week. Keep the momentum going!`,
      priority: 40,
    });
  }

  if (metrics.leads.pipelineValue > 10000) {
    const qualifiedLeads = metrics.leads.byStage['qualified'] || 0;
    const proposalLeads = metrics.leads.byStage['proposal'] || 0;
    if (qualifiedLeads + proposalLeads > 0) {
      insights.push({
        type: 'opportunity',
        category: 'sales',
        title: `$${Math.round(metrics.leads.pipelineValue).toLocaleString()} in Active Pipeline`,
        description: `You have ${qualifiedLeads + proposalLeads} leads in qualified/proposal stages. Focus on moving these forward.`,
        priority: 70,
      });
    }
  }

  // Marketing Insights
  if (metrics.campaigns.underperforming.length > 0) {
    insights.push({
      type: 'warning',
      category: 'marketing',
      title: `${metrics.campaigns.underperforming.length} Campaigns Need Optimization`,
      description: `Some campaigns have open rates below 15%. Consider A/B testing subject lines or reviewing your audience segments.`,
      priority: 75,
      metadata: {
        campaignIds: metrics.campaigns.underperforming.map(c => c.id),
      },
    });
  }

  if (metrics.campaigns.avgOpenRate > 25) {
    insights.push({
      type: 'achievement',
      category: 'marketing',
      title: 'Excellent Email Performance!',
      description: `Your campaigns have a ${metrics.campaigns.avgOpenRate.toFixed(1)}% open rate - well above industry average!`,
      priority: 35,
    });
  }

  // Operations Insights
  if (metrics.tasks.overdue > 0) {
    insights.push({
      type: 'warning',
      category: 'operations',
      title: `${metrics.tasks.overdue} Overdue Tasks`,
      description: `You have ${metrics.tasks.overdue} tasks past their due date. Would you like help prioritizing them?`,
      priority: 85,
    });
  }

  if (metrics.tasks.pending > 10) {
    insights.push({
      type: 'suggestion',
      category: 'operations',
      title: 'Consider Task Review',
      description: `You have ${metrics.tasks.pending} pending tasks. A quick review might help identify what to delegate or defer.`,
      priority: 50,
    });
  }

  // Sort by priority (highest first)
  return insights.sort((a, b) => b.priority - a.priority);
}

// ============================================================================
// TRIGGER.DEV TASKS
// ============================================================================

/**
 * Precompute insights for a single workspace
 */
export const precomputeWorkspaceInsightsTask = task({
  id: "precompute-workspace-insights",
  run: async (payload: { workspaceId: string }) => {
    const { workspaceId } = payload;
    
    logger.info('[Insights] Computing insights for workspace', { workspaceId });

    try {
      // Gather metrics
      const metrics = await gatherWorkspaceMetrics(workspaceId);
      
      // Generate insights
      const insights = await generateInsights(workspaceId, metrics);
      
      if (insights.length === 0) {
        logger.info('[Insights] No insights generated', { workspaceId });
        return { success: true, insightsCount: 0 };
      }

      // Store insights in database
      for (const insight of insights) {
        await db.insert(proactiveInsights).values({
          workspaceId,
          type: insight.type,
          category: insight.category,
          title: insight.title,
          description: insight.description,
          priority: insight.priority,
          suggestedActions: insight.metadata?.leadIds 
            ? [{ action: 'Follow up with stalled leads', args: insight.metadata }]
            : [],
        });
      }

      logger.info('[Insights] Insights saved', { 
        workspaceId, 
        count: insights.length 
      });

      return { 
        success: true, 
        insightsCount: insights.length,
        topInsight: insights[0]?.title,
      };
    } catch (error) {
      logger.error('[Insights] Failed to compute insights', { workspaceId, error });
      return { success: false, error: String(error) };
    }
  },
});

/**
 * Daily scheduled job to precompute insights for all workspaces
 */
export const scheduledInsightsPrecompute = schedules.task({
  id: "scheduled-insights-precompute",
  // Run every day at 6 AM
  cron: "0 6 * * *",
  run: async () => {
    logger.info('[Insights] Starting daily insights precomputation');

    try {
      // Get all active workspaces
      const allWorkspaces = await db.query.workspaces.findMany({
        columns: { id: true },
      });

      logger.info('[Insights] Processing workspaces', { 
        count: allWorkspaces.length 
      });

      let processed = 0;
      let failed = 0;

      // Process each workspace
      for (const workspace of allWorkspaces) {
        try {
          await precomputeWorkspaceInsightsTask.trigger({
            workspaceId: workspace.id,
          });
          processed++;
        } catch (error) {
          logger.error('[Insights] Failed to trigger for workspace', { 
            workspaceId: workspace.id, 
            error 
          });
          failed++;
        }
      }

      logger.info('[Insights] Daily precomputation complete', { 
        processed, 
        failed 
      });

      return { processed, failed };
    } catch (error) {
      logger.error('[Insights] Daily precomputation failed', { error });
      throw error;
    }
  },
});
