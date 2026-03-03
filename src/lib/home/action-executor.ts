import { logger } from '@/lib/logger';
import type { FeedActionRequest, FeedActionResponse } from '@/types/home-feed';

export async function executeCardAction(
  request: FeedActionRequest,
  workspaceId: string,
  _userId: string,
): Promise<FeedActionResponse> {
  const { action, cardId, args } = request;

  logger.info('Executing card action', { action, cardId, workspaceId });

  switch (action) {
    case 'dismiss':
      return {
        success: true,
        expansion: { cardId, message: "Got it. I won't bring this up again today." },
      };

    case 'contact_lead':
      return {
        success: true,
        expansion: {
          cardId,
          message: 'Done. I drafted an intro email and scheduled it for 9am tomorrow.',
          chips: [
            { id: 'edit-draft', label: 'Edit draft', action: 'edit_draft', variant: 'primary' },
            { id: 'send-now', label: 'Send now instead', action: 'send_now', variant: 'secondary' },
            { id: 'undo', label: 'Undo', action: 'undo_action', variant: 'ghost' },
          ],
        },
      };

    case 'view_lead':
      return {
        success: true,
        expansion: {
          cardId,
          message: 'Here are the details.',
          slidePanel: {
            title: 'Lead Details',
            href: `/crm?contactId=${args?.contactId ?? ''}`,
          },
        },
      };

    case 'send_followup':
      return {
        success: true,
        expansion: {
          cardId,
          message: "Reminder sent. I'll let you know when they respond.",
          chips: [
            { id: 'fu-view', label: 'View message', action: 'view_message', variant: 'secondary' },
          ],
        },
      };

    case 'view_campaign':
      return {
        success: true,
        expansion: {
          cardId,
          message: 'Opening campaign results.',
          slidePanel: {
            title: 'Campaign Results',
            href: `/marketing?campaignId=${args?.campaignId ?? ''}`,
          },
        },
      };

    case 'set_business_type':
      return {
        success: true,
        expansion: {
          cardId,
          message: `Great — I'll tailor everything for your ${args?.type ?? 'business'}. Let's get you set up.`,
          chips: [
            { id: 'ob-next', label: "What's next?", action: 'continue_onboarding', variant: 'primary' },
          ],
        },
      };

    case 'connect_integration':
      return {
        success: true,
        expansion: {
          cardId,
          message: 'Taking you to connect your account.',
          slidePanel: {
            title: 'Connect Integration',
            href: `/connected-apps?connect=${args?.provider ?? ''}`,
          },
        },
      };

    default:
      return {
        success: true,
        expansion: {
          cardId,
          message: "On it. I'll update you when it's done.",
        },
      };
  }
}
