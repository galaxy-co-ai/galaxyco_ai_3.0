/**
 * Event Hooks System
 * 
 * Listens for key workspace actions and triggers proactive insights.
 * Integrates with existing API routes to fire async events.
 */

import { generateProactiveInsights, storeInsights } from './proactive-engine';
import { logger } from '@/lib/logger';

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
 */
export async function handleLeadCreated(
  workspaceId: string,
  userId: string,
  leadId: string
): Promise<void> {
  try {
    // Generate insights for new lead
    const insights = await generateProactiveInsights(workspaceId, userId);
    
    // Filter to lead-related insights
    const leadInsights = insights.filter(insight => 
      insight.category === 'sales' && 
      insight.title.toLowerCase().includes('lead')
    );

    if (leadInsights.length > 0) {
      await storeInsights(workspaceId, leadInsights, userId);
    }

    // Also create immediate insight for this specific lead
    const immediateInsight = {
      type: 'suggestion' as const,
      priority: 7,
      category: 'sales' as const,
      title: 'New Lead Added',
      description: 'Qualify this lead and set up follow-up sequence.',
      suggestedActions: [
        {
          action: 'Auto-qualify lead',
          toolName: 'auto_qualify_lead',
          args: { leadId },
        },
        {
          action: 'Create follow-up sequence',
          toolName: 'create_follow_up_sequence',
          args: { leadId, sequenceType: 'nurture' },
        },
      ],
      autoExecutable: false,
    };

    await storeInsights(workspaceId, [immediateInsight], userId);
  } catch (error) {
    logger.error('Failed to handle lead created event', { workspaceId, userId, leadId, error });
  }
}

/**
 * Handle deal stage changed event
 */
export async function handleDealStageChanged(
  workspaceId: string,
  userId: string,
  dealId: string,
  newStage: string
): Promise<void> {
  try {
    if (newStage === 'negotiation') {
      // High-priority: Deal in negotiation
      const insight = {
        type: 'opportunity' as const,
        priority: 9,
        category: 'sales' as const,
        title: 'Deal in Negotiation',
        description: 'Deal moved to negotiation stage. Draft proposal and push to close.',
        suggestedActions: [
          {
            action: 'Draft proposal',
            toolName: 'draft_proposal',
            args: { dealId, includePricing: true },
          },
        ],
        autoExecutable: false,
      };

      await storeInsights(workspaceId, [insight], userId);
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
    // Schedule follow-up analysis after 24 hours
    // For now, just create a reminder insight
    const insight = {
      type: 'suggestion' as const,
      priority: 5,
      category: 'marketing' as const,
      title: 'Review Campaign Performance',
      description: 'Check campaign performance after 24 hours and optimize if needed.',
      suggestedActions: [
        {
          action: 'Check campaign stats',
          toolName: 'get_campaign_stats',
          args: { campaignId },
        },
      ],
      autoExecutable: false,
    };

    await storeInsights(workspaceId, [insight], userId);
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
    const insight = {
      type: 'alert' as const,
      priority: 9,
      category: 'finance' as const,
      title: 'Invoice Overdue',
      description: 'Invoice is overdue. Send payment reminder to improve cash flow.',
      suggestedActions: [
        {
          action: 'Send payment reminder',
          toolName: 'send_payment_reminders',
          args: { invoiceIds: [invoiceId], autoSend: false },
        },
      ],
      autoExecutable: false,
    };

    await storeInsights(workspaceId, [insight], userId);
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
