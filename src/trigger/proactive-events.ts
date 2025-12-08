/**
 * Proactive Events - Real-Time Insight Generation
 * 
 * Event-driven tasks that generate insights when specific events occur:
 * - New lead created → suggest qualification
 * - Deal in negotiation → draft proposal
 * - Task overdue → notify user
 * - Campaign underperforming → suggest optimization
 */

import { task, schedules } from '@trigger.dev/sdk/v3';
import { logger } from '@/lib/logger';
import { 
  generateProactiveInsights, 
  storeProactiveInsights,
  detectNewLeadInsights,
  detectDealNegotiationInsights,
} from '@/lib/ai/proactive-engine';
import { db } from '@/lib/db';
import { workspaces } from '@/db/schema';

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle new lead created event
 */
export const onNewLeadCreated = task({
  id: 'proactive-new-lead',
  run: async (payload: { workspaceId: string; leadId: string }) => {
    const { workspaceId, leadId } = payload;
    
    logger.info('[Proactive Events] New lead created', { workspaceId, leadId });

    try {
      const insights = await detectNewLeadInsights(workspaceId, leadId);
      
      if (insights.length > 0) {
        await storeProactiveInsights(workspaceId, insights);
        logger.info('[Proactive Events] Stored new lead insights', { 
          workspaceId, 
          leadId,
          insightCount: insights.length,
        });
      }

      return { success: true, insightsCount: insights.length };
    } catch (error) {
      logger.error('[Proactive Events] Failed to process new lead event', { workspaceId, leadId, error });
      return { success: false, error: String(error) };
    }
  },
});

/**
 * Handle deal stage changed event
 */
export const onDealStageChanged = task({
  id: 'proactive-deal-stage-changed',
  run: async (payload: { workspaceId: string; dealId: string; newStage: string }) => {
    const { workspaceId, dealId, newStage } = payload;
    
    logger.info('[Proactive Events] Deal stage changed', { workspaceId, dealId, newStage });

    try {
      // Only generate insights for negotiation stage
      if (newStage === 'negotiation') {
        const insights = await detectDealNegotiationInsights(workspaceId, dealId);
        
        if (insights.length > 0) {
          await storeProactiveInsights(workspaceId, insights);
          logger.info('[Proactive Events] Stored deal negotiation insights', { 
            workspaceId, 
            dealId,
            insightCount: insights.length,
          });
        }

        return { success: true, insightsCount: insights.length };
      }

      return { success: true, insightsCount: 0 };
    } catch (error) {
      logger.error('[Proactive Events] Failed to process deal stage change', { workspaceId, dealId, error });
      return { success: false, error: String(error) };
    }
  },
});

/**
 * Handle task overdue event (runs periodically)
 */
export const onTasksOverdue = task({
  id: 'proactive-tasks-overdue',
  run: async (payload: { workspaceId: string }) => {
    const { workspaceId } = payload;
    
    logger.info('[Proactive Events] Checking overdue tasks', { workspaceId });

    try {
      const insights = await generateProactiveInsights(workspaceId, {
        categories: ['operations'],
        maxInsights: 5,
      });

      // Filter to only overdue task insights
      const overdueInsights = insights.filter(i => 
        i.category === 'operations' && i.title.toLowerCase().includes('overdue')
      );
      
      if (overdueInsights.length > 0) {
        await storeProactiveInsights(workspaceId, overdueInsights);
        logger.info('[Proactive Events] Stored overdue task insights', { 
          workspaceId,
          insightCount: overdueInsights.length,
        });
      }

      return { success: true, insightsCount: overdueInsights.length };
    } catch (error) {
      logger.error('[Proactive Events] Failed to process overdue tasks', { workspaceId, error });
      return { success: false, error: String(error) };
    }
  },
});

/**
 * Handle campaign performance check (runs periodically)
 */
export const onCampaignPerformanceCheck = task({
  id: 'proactive-campaign-performance',
  run: async (payload: { workspaceId: string }) => {
    const { workspaceId } = payload;
    
    logger.info('[Proactive Events] Checking campaign performance', { workspaceId });

    try {
      const insights = await generateProactiveInsights(workspaceId, {
        categories: ['marketing'],
        maxInsights: 10,
      });

      // Filter to only campaign performance insights
      const campaignInsights = insights.filter(i => 
        i.category === 'marketing' && (i.title.toLowerCase().includes('campaign') || i.title.toLowerCase().includes('underperforming'))
      );
      
      if (campaignInsights.length > 0) {
        await storeProactiveInsights(workspaceId, campaignInsights);
        logger.info('[Proactive Events] Stored campaign performance insights', { 
          workspaceId,
          insightCount: campaignInsights.length,
        });
      }

      return { success: true, insightsCount: campaignInsights.length };
    } catch (error) {
      logger.error('[Proactive Events] Failed to process campaign performance', { workspaceId, error });
      return { success: false, error: String(error) };
    }
  },
});

// ============================================================================
// SCHEDULED TASKS
// ============================================================================

/**
 * Scheduled task to check for overdue tasks (runs every 6 hours)
 */
export const scheduledOverdueTasksCheck = schedules.task({
  id: 'scheduled-overdue-tasks-check',
  cron: '0 */6 * * *', // Every 6 hours
  run: async () => {
    logger.info('[Proactive Events] Starting scheduled overdue tasks check');

    try {
      const { workspaces } = await import('@/db/schema');
      const allWorkspaces = await db.query.workspaces.findMany({
        columns: { id: true },
      });

      let processed = 0;
      let failed = 0;

      for (const workspace of allWorkspaces) {
        try {
          await onTasksOverdue.trigger({
            workspaceId: workspace.id,
          });
          processed++;
        } catch (error) {
          logger.error('[Proactive Events] Failed to trigger overdue tasks check', {
            workspaceId: workspace.id,
            error,
          });
          failed++;
        }
      }

      logger.info('[Proactive Events] Scheduled overdue tasks check complete', {
        processed,
        failed,
      });

      return { processed, failed };
    } catch (error) {
      logger.error('[Proactive Events] Scheduled overdue tasks check failed', { error });
      throw error;
    }
  },
});

/**
 * Scheduled task to check campaign performance (runs daily at 9 AM)
 */
export const scheduledCampaignPerformanceCheck = schedules.task({
  id: 'scheduled-campaign-performance-check',
  cron: '0 9 * * *', // Daily at 9 AM
  run: async () => {
    logger.info('[Proactive Events] Starting scheduled campaign performance check');

    try {
      const { workspaces } = await import('@/db/schema');
      const allWorkspaces = await db.query.workspaces.findMany({
        columns: { id: true },
      });

      let processed = 0;
      let failed = 0;

      for (const workspace of allWorkspaces) {
        try {
          await onCampaignPerformanceCheck.trigger({
            workspaceId: workspace.id,
          });
          processed++;
        } catch (error) {
          logger.error('[Proactive Events] Failed to trigger campaign performance check', {
            workspaceId: workspace.id,
            error,
          });
          failed++;
        }
      }

      logger.info('[Proactive Events] Scheduled campaign performance check complete', {
        processed,
        failed,
      });

      return { processed, failed };
    } catch (error) {
      logger.error('[Proactive Events] Scheduled campaign performance check failed', { error });
      throw error;
    }
  },
});

/**
 * Scheduled task to check upcoming meetings (runs daily at 8 AM)
 */
export const scheduledUpcomingMeetingsCheck = schedules.task({
  id: 'scheduled-upcoming-meetings-check',
  cron: '0 8 * * *', // Daily at 8 AM
  run: async () => {
    logger.info('[Proactive Events] Starting scheduled upcoming meetings check');

    try {
      const { workspaces } = await import('@/db/schema');
      const allWorkspaces = await db.query.workspaces.findMany({
        columns: { id: true },
      });

      let processed = 0;
      let failed = 0;

      for (const workspace of allWorkspaces) {
        try {
          await onUpcomingMeetingsCheck.trigger({
            workspaceId: workspace.id,
          });
          processed++;
        } catch (error) {
          logger.error('[Proactive Events] Failed to trigger upcoming meetings check', {
            workspaceId: workspace.id,
            error,
          });
          failed++;
        }
      }

      logger.info('[Proactive Events] Scheduled upcoming meetings check complete', {
        processed,
        failed,
      });

      return { processed, failed };
    } catch (error) {
      logger.error('[Proactive Events] Scheduled upcoming meetings check failed', { error });
      throw error;
    }
  },
});

/**
 * Handle upcoming meetings check (runs daily)
 */
export const onUpcomingMeetingsCheck = task({
  id: 'proactive-upcoming-meetings',
  run: async (payload: { workspaceId: string }) => {
    const { workspaceId } = payload;
    
    logger.info('[Proactive Events] Checking upcoming meetings', { workspaceId });

    try {
      const insights = await generateProactiveInsights(workspaceId, {
        categories: ['operations'],
        maxInsights: 5,
      });

      // Filter to only meeting insights
      const meetingInsights = insights.filter(i => 
        i.title.toLowerCase().includes('meeting') || i.title.toLowerCase().includes('tomorrow')
      );
      
      if (meetingInsights.length > 0) {
        await storeProactiveInsights(workspaceId, meetingInsights);
        logger.info('[Proactive Events] Stored upcoming meeting insights', { 
          workspaceId,
          insightCount: meetingInsights.length,
        });
      }

      return { success: true, insightsCount: meetingInsights.length };
    } catch (error) {
      logger.error('[Proactive Events] Failed to process upcoming meetings', { workspaceId, error });
      return { success: false, error: String(error) };
    }
  },
});
