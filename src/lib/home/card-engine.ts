import { fetchWorkspaceSnapshot } from '@/lib/home/workspace-data';
import { logger } from '@/lib/logger';
import type { FeedCard } from '@/types/home-feed';

export type { WorkspaceSnapshot } from '@/lib/home/workspace-data';

const MAX_CARDS = 5;

/**
 * @deprecated Use the new Neptune conversation API instead.
 * This function will be removed once the conversation surface is fully wired.
 */
export async function generateFeedCards(
  workspaceId: string,
  userId: string,
  userName: string,
): Promise<FeedCard[]> {
  const cards: FeedCard[] = [];

  try {
    const snapshot = await fetchWorkspaceSnapshot(workspaceId);
    const { contactCount, hotContacts, overdueTasks, recentCampaigns, integrationCount, isNewUser } = snapshot;

    if (isNewUser) {
      return getOnboardingCards(userName, integrationCount > 0);
    }

    if (hotContacts.length > 0) {
      cards.push(createLeadCard(hotContacts));
    }

    if (overdueTasks.length > 0) {
      cards.push(createFollowupCard(overdueTasks));
    }

    for (const campaign of recentCampaigns) {
      cards.push(createCampaignCard(campaign));
    }

    if (contactCount > 0 && hotContacts.length === 0) {
      cards.push(createOpportunityCard(contactCount));
    }

    return cards
      .sort((a, b) => b.priority - a.priority)
      .slice(0, MAX_CARDS);
  } catch (error) {
    logger.error('Failed to generate feed cards', { error, workspaceId });
    return getOnboardingCards(userName, false);
  }
}

export function generateGreeting(userName: string): string {
  const hour = new Date().getHours();
  const name = userName.split(' ')[0] || userName;
  if (hour < 12) return `Good morning, ${name}.`;
  if (hour < 17) return `Good afternoon, ${name}.`;
  return `Good evening, ${name}.`;
}

// --- Onboarding cards (new user, no data) ---

function getOnboardingCards(userName: string, hasIntegrations: boolean): FeedCard[] {
  const cards: FeedCard[] = [
    {
      id: 'onboarding-business',
      category: 'onboarding',
      icon: '🏢',
      headline: 'Tell me about your business',
      context: 'What do you do, who do you serve, and what\'s your biggest challenge right now?',
      chips: [
        { id: 'ob-roofing', label: 'Roofing/Construction', action: 'set_business_type', variant: 'secondary', args: { type: 'roofing' } },
        { id: 'ob-agency', label: 'Marketing/Agency', action: 'set_business_type', variant: 'secondary', args: { type: 'agency' } },
        { id: 'ob-service', label: 'Service business', action: 'set_business_type', variant: 'secondary', args: { type: 'service' } },
        { id: 'ob-other', label: 'Something else', action: 'set_business_type', variant: 'ghost', args: { type: 'other' } },
      ],
      priority: 10,
      dismissible: false,
    },
  ];

  if (!hasIntegrations) {
    cards.push({
      id: 'onboarding-tools',
      category: 'onboarding',
      icon: '📱',
      headline: 'Connect your tools',
      context: 'I can pull in your contacts, invoices, and emails so I can start helping right away.',
      chips: [
        { id: 'ob-qb', label: 'Connect QuickBooks', action: 'connect_integration', variant: 'primary', args: { provider: 'quickbooks' } },
        { id: 'ob-google', label: 'Connect Google', action: 'connect_integration', variant: 'secondary', args: { provider: 'google' } },
        { id: 'ob-skip', label: 'Skip for now', action: 'dismiss', variant: 'ghost' },
      ],
      priority: 9,
      dismissible: true,
    });
  }

  return cards;
}

// --- Card creators ---

function createLeadCard(
  hotContacts: Array<{ id: string; firstName: string | null; lastName: string | null; company: string | null }>,
): FeedCard {
  const leadCount = hotContacts.length;
  const first = hotContacts[0];
  const name = [first?.firstName, first?.lastName].filter(Boolean).join(' ') || first?.company || 'New prospect';
  const headline = leadCount === 1
    ? `Hot lead: ${name}`
    : `${leadCount} hot leads waiting for follow-up`;
  const context = leadCount === 1
    ? 'Matches your ideal client profile. Ready to reach out?'
    : `Your hottest prospects need attention. Top: ${name}.`;

  return {
    id: `lead-${Date.now()}`,
    category: 'lead',
    icon: '👥',
    headline,
    context,
    chips: [
      { id: 'lead-reach', label: 'Reach out', action: 'contact_lead', variant: 'primary', args: { contactId: first?.id } },
      { id: 'lead-review', label: 'Review details', action: 'view_lead', variant: 'secondary', args: { contactId: first?.id } },
      { id: 'lead-skip', label: 'Not now', action: 'dismiss', variant: 'ghost' },
    ],
    priority: 9,
    dismissible: true,
    metadata: { contactIds: hotContacts.map((c) => c.id) },
  };
}

function createFollowupCard(
  overdue: Array<{ id: string; title: string; customerId: string | null }>,
): FeedCard {
  const taskCount = overdue.length;
  return {
    id: `followup-${Date.now()}`,
    category: 'followup',
    icon: '⏰',
    headline: taskCount === 1
      ? `Follow-up overdue: ${overdue[0]?.title ?? 'Pending task'}`
      : `${taskCount} follow-ups overdue`,
    context: taskCount === 1
      ? 'This was due yesterday. Want me to send a reminder?'
      : `Oldest is ${overdue[0]?.title ?? 'a pending task'}. Let's knock these out.`,
    chips: [
      { id: 'fu-remind', label: 'Send reminder', action: 'send_followup', variant: 'primary', args: { taskId: overdue[0]?.id } },
      { id: 'fu-call', label: 'Call instead', action: 'start_call', variant: 'secondary', args: { taskId: overdue[0]?.id } },
      { id: 'fu-wait', label: 'Give it time', action: 'dismiss', variant: 'ghost' },
    ],
    priority: 8,
    dismissible: true,
    metadata: { taskIds: overdue.map((t) => t.id) },
  };
}

function createCampaignCard(
  campaign: { id: string; name: string; sentCount: number | null; openCount: number | null; clickCount: number | null },
): FeedCard {
  const sent = campaign.sentCount ?? 0;
  const opens = campaign.openCount ?? 0;
  const openPct = sent > 0 ? Math.round((opens / sent) * 100) : 0;

  return {
    id: `campaign-${campaign.id}`,
    category: 'campaign',
    icon: '📈',
    headline: `${campaign.name} hit ${openPct}% open rate`,
    context: openPct > 15
      ? 'Above industry average. Nice work.'
      : 'Below average — might be worth tweaking the subject line.',
    chips: [
      { id: 'camp-details', label: 'See results', action: 'view_campaign', variant: 'primary', args: { campaignId: campaign.id } },
      { id: 'camp-rerun', label: 'Run it again', action: 'duplicate_campaign', variant: 'secondary', args: { campaignId: campaign.id } },
    ],
    priority: 6,
    dismissible: true,
    metadata: { campaignId: campaign.id },
  };
}

function createOpportunityCard(contactCount: number): FeedCard {
  return {
    id: `opportunity-${Date.now()}`,
    category: 'opportunity',
    icon: '💡',
    headline: `You have ${contactCount} contacts — time to activate them`,
    context: 'A targeted email campaign could turn some of these into paying customers.',
    chips: [
      { id: 'opp-campaign', label: 'Create campaign', action: 'create_campaign', variant: 'primary' },
      { id: 'opp-more', label: 'Tell me more', action: 'explain_campaigns', variant: 'secondary' },
    ],
    priority: 5,
    dismissible: true,
  };
}
