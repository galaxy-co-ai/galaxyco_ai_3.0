/**
 * Event Hooks System
 * 
 * Listens for key workspace actions and triggers proactive insights.
 * Integrates with existing API routes to fire async events.
 * Uses Trigger.dev for async processing.
 */

import { 
  detectNewLeadInsights, 
  detectDealNegotiationInsights,
  storeProactiveInsights,
} from './proactive-engine';
import { logger } from '@/lib/logger';
import { onNewLeadCreated, onDealStageChanged } from '@/trigger/proactive-events';

// ============================================================================
// EVENT TYPES
// ============================================================================

export type WorkspaceEvent = 
  | { type: 'lead_created'; workspaceId: string; userId: string; leadId: string }
  | { type: 'deal_stage_changed'; workspaceId: string; userId: string; dealId: string; newStage: string }
  | { type: 'campaign_sent'; workspaceId: string; userId: string; campaignId: string }
  | { type: 'invoice_overdue'; workspaceId: string; userId: string; invoiceId: string }
  | { type: 'task_created'; workspaceId: string; userId: string; taskId: string };

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle lead created event
 * Triggers async Trigger.dev task for processing
 */
export async function handleLeadCreated(
  workspaceId: string,
  userId: string,
  leadId: string
): Promise<void> {
  try {
    // Trigger async task for proactive insights
    if (process.env.TRIGGER_SECRET_KEY) {
      await onNewLeadCreated.trigger({
        workspaceId,
        leadId,
      });
      logger.info('[Event Hooks] Triggered new lead proactive task', { workspaceId, leadId });
    } else {
      // Fallback: generate insights synchronously if Trigger.dev not configured
      const insights = await detectNewLeadInsights(workspaceId, leadId);
      if (insights.length > 0) {
        await storeProactiveInsights(workspaceId, insights);
      }
    }
  } catch (error) {
    logger.error('Failed to handle lead created event', { workspaceId, userId, leadId, error });
  }
}

/**
 * Handle deal stage changed event
 * Triggers async Trigger.dev task for processing
 */
export async function handleDealStageChanged(
  workspaceId: string,
  userId: string,
  dealId: string,
  newStage: string
): Promise<void> {
  try {
    // Trigger async task for proactive insights
    if (process.env.TRIGGER_SECRET_KEY) {
      await onDealStageChanged.trigger({
        workspaceId,
        dealId,
        newStage,
      });
      logger.info('[Event Hooks] Triggered deal stage change proactive task', { workspaceId, dealId, newStage });
    } else {
      // Fallback: generate insights synchronously if Trigger.dev not configured
      if (newStage === 'negotiation') {
        const insights = await detectDealNegotiationInsights(workspaceId, dealId);
        if (insights.length > 0) {
          await storeProactiveInsights(workspaceId, insights);
        }
      }
    }
  } catch (error) {
    logger.error('Failed to handle deal stage changed event', { workspaceId, userId, dealId, error });
  }
}

/**
 * Handle campaign sent event
 */
export async function handleCampaignSent(
  workspaceId: string,
  userId: string,
  campaignId: string
): Promise<void> {
  try {
    // Trigger campaign performance check task
    if (process.env.TRIGGER_SECRET_KEY) {
      const { onCampaignPerformanceCheck } = await import('@/trigger/proactive-events');
      await onCampaignPerformanceCheck.trigger({
        workspaceId,
      });
      logger.info('[Event Hooks] Triggered campaign performance check', { workspaceId, campaignId });
    } else {
      // Fallback: create reminder insight
      const { generateProactiveInsights, storeProactiveInsights } = await import('./proactive-engine');
      const insights = await generateProactiveInsights(workspaceId, {
        categories: ['marketing'],
        maxInsights: 5,
      });
      const campaignInsights = insights.filter(i => 
        i.category === 'marketing' && i.title.toLowerCase().includes('campaign')
      );
      if (campaignInsights.length > 0) {
        await storeProactiveInsights(workspaceId, campaignInsights);
      }
    }
  } catch (error) {
    logger.error('Failed to handle campaign sent event', { workspaceId, userId, campaignId, error });
  }
}

/**
 * Handle invoice overdue event
 */
export async function handleInvoiceOverdue(
  workspaceId: string,
  userId: string,
  invoiceId: string
): Promise<void> {
  try {
    const { storeProactiveInsights } = await import('./proactive-engine');
    const insight = {
      type: 'warning' as const,
      priority: 90,
      category: 'finance' as const,
      title: 'Invoice Overdue',
      description: 'Invoice is overdue. Send payment reminder to improve cash flow.',
      metadata: { invoiceId },
      suggestedActions: [
        {
          action: 'send_payment_reminders',
          args: { invoiceIds: [invoiceId], autoSend: false },
        },
      ],
    };

    await storeProactiveInsights(workspaceId, [insight]);
  } catch (error) {
    logger.error('Failed to handle invoice overdue event', { workspaceId, userId, invoiceId, error });
  }
}

/**
 * Fire an event (to be called from API routes)
 */
export async function fireEvent(event: WorkspaceEvent): Promise<void> {
  // Fire async - don't wait for completion
  setImmediate(async () => {
    try {
      switch (event.type) {
        case 'lead_created':
          await handleLeadCreated(event.workspaceId, event.userId, event.leadId);
          break;
        case 'deal_stage_changed':
          await handleDealStageChanged(event.workspaceId, event.userId, event.dealId, event.newStage);
          break;
        case 'campaign_sent':
          await handleCampaignSent(event.workspaceId, event.userId, event.campaignId);
          break;
        case 'invoice_overdue':
          await handleInvoiceOverdue(event.workspaceId, event.userId, event.invoiceId);
          break;
        default:
          logger.warn('Unknown event type', { event });
      }
    } catch (error) {
      logger.error('Failed to process event', { event, error });
    }
  });
}
