# Home Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the AI-chatbot dashboard with a proactive Neptune feed — cards with smart chips that surface real-world business impact and let users take action inline.

**Architecture:** Server-fetched card prioritization engine generates 3-5 scored cards per session. New API routes (`/api/home/feed`, `/api/home/action`) serve/execute cards. Client renders a full-width scrollable feed with inline expansion. Pusher delivers new cards in real-time. Old dashboard components (WorkspacePanel, Customize, activity widgets) are removed.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Drizzle ORM, Zod, Vitest, Tailwind v4, Pusher, Framer Motion

**Design doc:** `docs/plans/2026-03-02-home-redesign-design.md`

---

## Phase 1: Backend Foundation

### Task 1: Define Feed Card Types & Validation Schema

**Files:**
- Create: `src/types/home-feed.ts`
- Create: `src/lib/validation/home-feed.ts`
- Test: `tests/lib/validation/home-feed.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/lib/validation/home-feed.test.ts
import { describe, it, expect } from 'vitest';
import {
  FeedCardSchema,
  FeedActionRequestSchema,
  type FeedCard,
  type FeedActionRequest,
} from '@/lib/validation/home-feed';

describe('FeedCardSchema', () => {
  it('should validate a valid money card', () => {
    const card: FeedCard = {
      id: 'card-1',
      category: 'money',
      icon: '💰',
      headline: '2 invoices paid overnight ($3,200)',
      context: 'Jackson Roofing ($2,100) and Martinez Kitchen ($1,100).',
      chips: [
        { id: 'chip-1', label: 'See details', action: 'view_invoices', variant: 'primary' },
        { id: 'chip-2', label: 'Send more invoices', action: 'create_invoice', variant: 'secondary' },
      ],
      priority: 9,
      dismissible: true,
    };
    const result = FeedCardSchema.safeParse(card);
    expect(result.success).toBe(true);
  });

  it('should reject a card with no chips', () => {
    const card = {
      id: 'card-1',
      category: 'money',
      icon: '💰',
      headline: 'Test',
      context: 'Test context',
      chips: [],
      priority: 5,
      dismissible: true,
    };
    const result = FeedCardSchema.safeParse(card);
    expect(result.success).toBe(false);
  });

  it('should reject invalid category', () => {
    const card = {
      id: 'card-1',
      category: 'invalid',
      icon: '💰',
      headline: 'Test',
      context: 'Test',
      chips: [{ id: 'c1', label: 'Go', action: 'do_thing', variant: 'primary' }],
      priority: 5,
      dismissible: true,
    };
    const result = FeedCardSchema.safeParse(card);
    expect(result.success).toBe(false);
  });
});

describe('FeedActionRequestSchema', () => {
  it('should validate an action request', () => {
    const req: FeedActionRequest = {
      cardId: 'card-1',
      chipId: 'chip-1',
      action: 'view_invoices',
    };
    const result = FeedActionRequestSchema.safeParse(req);
    expect(result.success).toBe(true);
  });

  it('should reject missing cardId', () => {
    const result = FeedActionRequestSchema.safeParse({ chipId: 'c1', action: 'go' });
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/validation/home-feed.test.ts`
Expected: FAIL — modules don't exist yet

**Step 3: Create the types file**

```typescript
// src/types/home-feed.ts

export type FeedCardCategory =
  | 'money'
  | 'lead'
  | 'followup'
  | 'campaign'
  | 'opportunity'
  | 'milestone'
  | 'onboarding';

export type ChipVariant = 'primary' | 'secondary' | 'ghost';

export interface SmartChip {
  id: string;
  label: string;
  action: string;
  variant: ChipVariant;
  args?: Record<string, unknown>;
}

export interface FeedCard {
  id: string;
  category: FeedCardCategory;
  icon: string;
  headline: string;
  context: string;
  chips: SmartChip[];
  priority: number;
  dismissible: boolean;
  metadata?: Record<string, unknown>;
}

export interface FeedCardExpansion {
  cardId: string;
  message: string;
  chips?: SmartChip[];
  slidePanel?: {
    title: string;
    href: string;
  };
}

export interface FeedActionRequest {
  cardId: string;
  chipId: string;
  action: string;
  args?: Record<string, unknown>;
}

export interface FeedActionResponse {
  success: boolean;
  expansion: FeedCardExpansion;
}

export interface HomeFeedResponse {
  greeting: string;
  cards: FeedCard[];
  isNewUser: boolean;
}
```

**Step 4: Create the validation schema**

```typescript
// src/lib/validation/home-feed.ts
import { z } from 'zod';

const feedCardCategories = [
  'money', 'lead', 'followup', 'campaign',
  'opportunity', 'milestone', 'onboarding',
] as const;

const chipVariants = ['primary', 'secondary', 'ghost'] as const;

export const SmartChipSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  action: z.string().min(1),
  variant: z.enum(chipVariants),
  args: z.record(z.unknown()).optional(),
});

export const FeedCardSchema = z.object({
  id: z.string().min(1),
  category: z.enum(feedCardCategories),
  icon: z.string().min(1),
  headline: z.string().min(1).max(200),
  context: z.string().min(1).max(500),
  chips: z.array(SmartChipSchema).min(1).max(4),
  priority: z.number().min(1).max(10),
  dismissible: z.boolean(),
  metadata: z.record(z.unknown()).optional(),
});

export const FeedActionRequestSchema = z.object({
  cardId: z.string().min(1),
  chipId: z.string().min(1),
  action: z.string().min(1),
  args: z.record(z.unknown()).optional(),
});

export type { FeedCard, SmartChip, FeedActionRequest } from '@/types/home-feed';
```

**Step 5: Run test to verify it passes**

Run: `npx vitest run tests/lib/validation/home-feed.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/types/home-feed.ts src/lib/validation/home-feed.ts tests/lib/validation/home-feed.test.ts
git commit -m "feat(home): add feed card types and validation schemas"
```

---

### Task 2: Card Prioritization Engine

**Files:**
- Create: `src/lib/home/card-engine.ts`
- Test: `tests/lib/home/card-engine.test.ts`

**Context:** This is the "silent AI" — the backend brain that decides which 3-5 cards to show. It queries CRM, finance, campaigns, and tasks, then scores and ranks potential cards. The user never sees this logic.

**Depends on:** Task 1 (FeedCard types)

**Step 1: Write the failing test**

```typescript
// tests/lib/home/card-engine.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateFeedCards } from '@/lib/home/card-engine';
import type { FeedCard } from '@/types/home-feed';

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    })),
    query: {
      contacts: { findMany: vi.fn(() => Promise.resolve([])) },
      leads: { findMany: vi.fn(() => Promise.resolve([])) },
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('generateFeedCards', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return an array of FeedCard objects', async () => {
    const cards = await generateFeedCards('workspace-1', 'user-1', 'Alex');
    expect(Array.isArray(cards)).toBe(true);
    cards.forEach((card: FeedCard) => {
      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('category');
      expect(card).toHaveProperty('headline');
      expect(card).toHaveProperty('chips');
      expect(card.chips.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should return max 5 cards', async () => {
    const cards = await generateFeedCards('workspace-1', 'user-1', 'Alex');
    expect(cards.length).toBeLessThanOrEqual(5);
  });

  it('should return cards sorted by priority (highest first)', async () => {
    const cards = await generateFeedCards('workspace-1', 'user-1', 'Alex');
    for (let i = 1; i < cards.length; i++) {
      expect(cards[i - 1].priority).toBeGreaterThanOrEqual(cards[i].priority);
    }
  });

  it('should return onboarding cards for new users (no data)', async () => {
    const cards = await generateFeedCards('workspace-1', 'user-1', 'Alex');
    // With all mocks returning empty, should get onboarding cards
    const hasOnboarding = cards.some((c: FeedCard) => c.category === 'onboarding');
    expect(hasOnboarding).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/home/card-engine.test.ts`
Expected: FAIL — module doesn't exist

**Step 3: Implement the card engine**

```typescript
// src/lib/home/card-engine.ts
import { db } from '@/lib/db';
import { agents, contacts, tasks, leads, campaigns, financeIntegrations } from '@/db/schema';
import { eq, and, desc, gte, sql, count } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import type { FeedCard } from '@/types/home-feed';

const MAX_CARDS = 5;

export async function generateFeedCards(
  workspaceId: string,
  userId: string,
  userName: string,
): Promise<FeedCard[]> {
  const cards: FeedCard[] = [];

  try {
    // Gather workspace state in parallel
    const [
      contactCount,
      hotLeads,
      overdueFollowups,
      recentCampaigns,
      activeAgentCount,
      financeConns,
    ] = await Promise.all([
      getContactCount(workspaceId),
      getHotLeads(workspaceId),
      getOverdueFollowups(workspaceId),
      getRecentCampaignResults(workspaceId),
      getActiveAgentCount(workspaceId),
      getFinanceConnectionCount(workspaceId),
    ]);

    const isNewUser = contactCount === 0 && activeAgentCount === 0;

    if (isNewUser) {
      return getOnboardingCards(userName, financeConns > 0);
    }

    // Generate cards from each data source
    if (hotLeads.length > 0) {
      cards.push(createLeadCard(hotLeads));
    }

    if (overdueFollowups.length > 0) {
      cards.push(createFollowupCard(overdueFollowups));
    }

    for (const campaign of recentCampaigns) {
      cards.push(createCampaignCard(campaign));
    }

    if (contactCount > 0 && hotLeads.length === 0) {
      cards.push(createOpportunityCard(contactCount));
    }

    // Sort by priority (highest first) and cap
    return cards
      .sort((a, b) => b.priority - a.priority)
      .slice(0, MAX_CARDS);
  } catch (error) {
    logger.error('Failed to generate feed cards', { error, workspaceId });
    return getOnboardingCards(userName, false);
  }
}

function getOnboardingCards(userName: string, hasFinance: boolean): FeedCard[] {
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

  if (!hasFinance) {
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

// --- Data fetchers (all filtered by workspaceId) ---

async function getContactCount(workspaceId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(contacts)
      .where(eq(contacts.workspaceId, workspaceId));
    return result[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

async function getHotLeads(workspaceId: string) {
  try {
    return await db
      .select()
      .from(leads)
      .where(and(eq(leads.workspaceId, workspaceId), eq(leads.temperature, 'hot')))
      .orderBy(desc(leads.updatedAt))
      .limit(5);
  } catch {
    return [];
  }
}

async function getOverdueFollowups(workspaceId: string) {
  try {
    return await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.status, 'pending'),
          gte(sql`NOW()`, tasks.dueDate),
        ),
      )
      .orderBy(desc(tasks.dueDate))
      .limit(5);
  } catch {
    return [];
  }
}

async function getRecentCampaignResults(workspaceId: string) {
  try {
    return await db
      .select()
      .from(campaigns)
      .where(
        and(
          eq(campaigns.workspaceId, workspaceId),
          eq(campaigns.status, 'sent'),
          gte(campaigns.updatedAt, sql`NOW() - INTERVAL '7 days'`),
        ),
      )
      .orderBy(desc(campaigns.updatedAt))
      .limit(2);
  } catch {
    return [];
  }
}

async function getActiveAgentCount(workspaceId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(agents)
      .where(and(eq(agents.workspaceId, workspaceId), eq(agents.isActive, true)));
    return result[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

async function getFinanceConnectionCount(workspaceId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(financeIntegrations)
      .where(eq(financeIntegrations.workspaceId, workspaceId));
    return result[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

// --- Card creators ---

function createLeadCard(hotLeads: Array<{ id: string; name: string | null; company: string | null }>): FeedCard {
  const leadCount = hotLeads.length;
  const firstLead = hotLeads[0];
  const headline = leadCount === 1
    ? `Hot lead: ${firstLead?.name ?? firstLead?.company ?? 'New prospect'}`
    : `${leadCount} hot leads waiting for follow-up`;
  const context = leadCount === 1
    ? `Matches your ideal client profile. Ready to reach out?`
    : `Your hottest prospects need attention. Top: ${firstLead?.name ?? 'New prospect'}.`;

  return {
    id: `lead-${Date.now()}`,
    category: 'lead',
    icon: '👥',
    headline,
    context,
    chips: [
      { id: 'lead-reach', label: 'Reach out', action: 'contact_lead', variant: 'primary', args: { leadId: firstLead?.id } },
      { id: 'lead-review', label: 'Review details', action: 'view_lead', variant: 'secondary', args: { leadId: firstLead?.id } },
      { id: 'lead-skip', label: 'Not now', action: 'dismiss', variant: 'ghost' },
    ],
    priority: 9,
    dismissible: true,
    metadata: { leadIds: hotLeads.map(l => l.id) },
  };
}

function createFollowupCard(overdue: Array<{ id: string; title: string | null; contactId: string | null }>): FeedCard {
  const count = overdue.length;
  return {
    id: `followup-${Date.now()}`,
    category: 'followup',
    icon: '⏰',
    headline: count === 1
      ? `Follow-up overdue: ${overdue[0]?.title ?? 'Pending task'}`
      : `${count} follow-ups overdue`,
    context: count === 1
      ? 'This was due yesterday. Want me to send a reminder?'
      : `Oldest is ${overdue[0]?.title ?? 'a pending task'}. Let's knock these out.`,
    chips: [
      { id: 'fu-remind', label: 'Send reminder', action: 'send_followup', variant: 'primary', args: { taskId: overdue[0]?.id } },
      { id: 'fu-call', label: 'Call instead', action: 'start_call', variant: 'secondary', args: { taskId: overdue[0]?.id } },
      { id: 'fu-wait', label: 'Give it time', action: 'dismiss', variant: 'ghost' },
    ],
    priority: 8,
    dismissible: true,
    metadata: { taskIds: overdue.map(t => t.id) },
  };
}

function createCampaignCard(campaign: { id: string; name: string | null; openRate?: number | null; clickRate?: number | null }): FeedCard {
  const openRate = campaign.openRate ?? 0;
  const openPct = Math.round(openRate * 100);
  return {
    id: `campaign-${campaign.id}`,
    category: 'campaign',
    icon: '📈',
    headline: `${campaign.name ?? 'Campaign'} hit ${openPct}% open rate`,
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

export function generateGreeting(userName: string): string {
  const hour = new Date().getHours();
  const name = userName.split(' ')[0] || userName;
  if (hour < 12) return `Good morning, ${name}.`;
  if (hour < 17) return `Good afternoon, ${name}.`;
  return `Good evening, ${name}.`;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/home/card-engine.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/home/card-engine.ts tests/lib/home/card-engine.test.ts
git commit -m "feat(home): add card prioritization engine"
```

---

### Task 3: Feed API Endpoint

**Files:**
- Create: `src/app/api/home/feed/route.ts`
- Test: `tests/api/home-feed.test.ts`

**Depends on:** Task 1, Task 2

**Step 1: Write the failing test**

```typescript
// tests/api/home-feed.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/home/feed/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getCurrentWorkspace: vi.fn(() =>
    Promise.resolve({
      workspaceId: 'ws-1',
      userId: 'user-1',
      user: { firstName: 'Alex', lastName: 'Smith' },
    }),
  ),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => Promise.resolve({ success: true, limit: 100, remaining: 99, reset: 0 })),
}));

vi.mock('@/lib/home/card-engine', () => ({
  generateFeedCards: vi.fn(() =>
    Promise.resolve([
      {
        id: 'card-1',
        category: 'onboarding',
        icon: '🏢',
        headline: 'Tell me about your business',
        context: 'What do you do?',
        chips: [{ id: 'c1', label: 'Go', action: 'go', variant: 'primary' }],
        priority: 10,
        dismissible: false,
      },
    ]),
  ),
  generateGreeting: vi.fn(() => 'Good morning, Alex.'),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('GET /api/home/feed', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should return feed with greeting and cards', async () => {
    const request = new NextRequest('http://localhost:3000/api/home/feed');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('greeting');
    expect(data).toHaveProperty('cards');
    expect(data.greeting).toBe('Good morning, Alex.');
    expect(data.cards).toHaveLength(1);
    expect(data.cards[0].category).toBe('onboarding');
  });

  it('should return isNewUser flag', async () => {
    const request = new NextRequest('http://localhost:3000/api/home/feed');
    const response = await GET(request);
    const data = await response.json();

    expect(data).toHaveProperty('isNewUser');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/home-feed.test.ts`
Expected: FAIL — route doesn't exist

**Step 3: Implement the API route**

```typescript
// src/app/api/home/feed/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { generateFeedCards, generateGreeting } from '@/lib/home/card-engine';
import { createErrorResponse } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger';
import type { HomeFeedResponse } from '@/types/home-feed';

export async function GET(_request: NextRequest) {
  try {
    const { workspaceId, userId, user } = await getCurrentWorkspace();
    const userName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'there';

    const rateLimitResult = await rateLimit(`api:home:feed:${userId}`, 60, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 },
      );
    }

    const cards = await generateFeedCards(workspaceId, userId, userName);
    const greeting = generateGreeting(userName);
    const isNewUser = cards.some(c => c.category === 'onboarding');

    const response: HomeFeedResponse = { greeting, cards, isNewUser };

    return NextResponse.json(response, {
      headers: {
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      },
    });
  } catch (error) {
    logger.error('Home feed error', { error });
    return createErrorResponse(error, 'Home feed error');
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/api/home-feed.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/app/api/home/feed/route.ts tests/api/home-feed.test.ts
git commit -m "feat(home): add /api/home/feed endpoint"
```

---

### Task 4: Action API Endpoint

**Files:**
- Create: `src/app/api/home/action/route.ts`
- Create: `src/lib/home/action-executor.ts`
- Test: `tests/api/home-action.test.ts`

**Depends on:** Task 1

**Step 1: Write the failing test**

```typescript
// tests/api/home-action.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/home/action/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getCurrentWorkspace: vi.fn(() =>
    Promise.resolve({ workspaceId: 'ws-1', userId: 'user-1' }),
  ),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => Promise.resolve({ success: true, limit: 50, remaining: 49, reset: 0 })),
}));

vi.mock('@/lib/home/action-executor', () => ({
  executeCardAction: vi.fn(() =>
    Promise.resolve({
      success: true,
      expansion: {
        cardId: 'card-1',
        message: 'Done. I drafted an intro email.',
        chips: [
          { id: 'edit', label: 'Edit draft', action: 'edit_draft', variant: 'primary' as const },
        ],
      },
    }),
  ),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('POST /api/home/action', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('should execute an action and return expansion', async () => {
    const request = new NextRequest('http://localhost:3000/api/home/action', {
      method: 'POST',
      body: JSON.stringify({
        cardId: 'card-1',
        chipId: 'chip-1',
        action: 'contact_lead',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.expansion).toHaveProperty('message');
    expect(data.expansion.chips).toBeDefined();
  });

  it('should reject invalid request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/home/action', {
      method: 'POST',
      body: JSON.stringify({ invalid: true }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/home-action.test.ts`
Expected: FAIL

**Step 3: Implement the action executor**

```typescript
// src/lib/home/action-executor.ts
import { logger } from '@/lib/logger';
import type { FeedActionRequest, FeedActionResponse } from '@/types/home-feed';

export async function executeCardAction(
  request: FeedActionRequest,
  workspaceId: string,
  userId: string,
): Promise<FeedActionResponse> {
  const { action, cardId, args } = request;

  logger.info('Executing card action', { action, cardId, workspaceId });

  // Route to action handler
  switch (action) {
    case 'dismiss':
      return {
        success: true,
        expansion: { cardId, message: 'Got it. I won\'t bring this up again today.' },
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
            href: `/crm?leadId=${args?.leadId ?? ''}`,
          },
        },
      };

    case 'send_followup':
      return {
        success: true,
        expansion: {
          cardId,
          message: 'Reminder sent. I\'ll let you know when they respond.',
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
            { id: 'ob-next', label: 'What\'s next?', action: 'continue_onboarding', variant: 'primary' },
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
          message: 'On it. I\'ll update you when it\'s done.',
        },
      };
  }
}
```

**Step 4: Implement the API route**

```typescript
// src/app/api/home/action/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { FeedActionRequestSchema } from '@/lib/validation/home-feed';
import { executeCardAction } from '@/lib/home/action-executor';
import { createErrorResponse } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    const rateLimitResult = await rateLimit(`api:home:action:${userId}`, 30, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    const body = await request.json();
    const validation = FeedActionRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const result = await executeCardAction(validation.data, workspaceId, userId);
    return NextResponse.json(result);
  } catch (error) {
    logger.error('Home action error', { error });
    return createErrorResponse(error, 'Home action error');
  }
}
```

**Step 5: Run test to verify it passes**

Run: `npx vitest run tests/api/home-action.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/lib/home/action-executor.ts src/app/api/home/action/route.ts tests/api/home-action.test.ts
git commit -m "feat(home): add /api/home/action endpoint with action executor"
```

---

## Phase 2: UI Components

### Task 5: SmartChipBar Component

**Files:**
- Create: `src/components/home/SmartChipBar.tsx`
- Test: `tests/components/home/SmartChipBar.test.tsx`

**Step 1: Write the failing test**

```typescript
// tests/components/home/SmartChipBar.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SmartChipBar } from '@/components/home/SmartChipBar';
import type { SmartChip } from '@/types/home-feed';

describe('SmartChipBar', () => {
  const chips: SmartChip[] = [
    { id: 'c1', label: 'Reach out', action: 'contact_lead', variant: 'primary' },
    { id: 'c2', label: 'Review', action: 'view_lead', variant: 'secondary' },
    { id: 'c3', label: 'Skip', action: 'dismiss', variant: 'ghost' },
  ];

  it('should render all chips', () => {
    render(<SmartChipBar chips={chips} onChipClick={vi.fn()} />);
    expect(screen.getByText('Reach out')).toBeDefined();
    expect(screen.getByText('Review')).toBeDefined();
    expect(screen.getByText('Skip')).toBeDefined();
  });

  it('should call onChipClick with chip data when clicked', () => {
    const onClick = vi.fn();
    render(<SmartChipBar chips={chips} onChipClick={onClick} />);
    fireEvent.click(screen.getByText('Reach out'));
    expect(onClick).toHaveBeenCalledWith(chips[0]);
  });

  it('should disable all chips when loading', () => {
    render(<SmartChipBar chips={chips} onChipClick={vi.fn()} loading />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => expect(btn).toHaveProperty('disabled', true));
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/home/SmartChipBar.test.tsx`
Expected: FAIL

**Step 3: Implement the component**

```tsx
// src/components/home/SmartChipBar.tsx
'use client';

import { cn } from '@/lib/utils';
import type { SmartChip } from '@/types/home-feed';

interface SmartChipBarProps {
  chips: SmartChip[];
  onChipClick: (chip: SmartChip) => void;
  loading?: boolean;
}

const variantStyles: Record<SmartChip['variant'], string> = {
  primary:
    'bg-teal-600 text-white hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600',
  secondary:
    'border border-nebula-frost/20 text-nebula-frost hover:bg-nebula-frost/10',
  ghost:
    'text-nebula-frost/50 hover:text-nebula-frost/80 hover:bg-white/5',
};

export function SmartChipBar({ chips, onChipClick, loading }: SmartChipBarProps) {
  return (
    <div className="flex flex-wrap gap-2 pt-3">
      {chips.map((chip) => (
        <button
          key={chip.id}
          onClick={() => onChipClick(chip)}
          disabled={loading}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            variantStyles[chip.variant],
          )}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/home/SmartChipBar.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/home/SmartChipBar.tsx tests/components/home/SmartChipBar.test.tsx
git commit -m "feat(home): add SmartChipBar component"
```

---

### Task 6: NeptuneFeedCard Component

**Files:**
- Create: `src/components/home/NeptuneFeedCard.tsx`
- Test: `tests/components/home/NeptuneFeedCard.test.tsx`

**Depends on:** Task 5 (SmartChipBar)

**Step 1: Write the failing test**

```typescript
// tests/components/home/NeptuneFeedCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NeptuneFeedCard } from '@/components/home/NeptuneFeedCard';
import type { FeedCard } from '@/types/home-feed';

describe('NeptuneFeedCard', () => {
  const card: FeedCard = {
    id: 'card-1',
    category: 'lead',
    icon: '👥',
    headline: 'New lead: Kitchen remodel, Frisco',
    context: 'Came through your website. Matches your ideal client profile.',
    chips: [
      { id: 'c1', label: 'Reach out', action: 'contact_lead', variant: 'primary' },
      { id: 'c2', label: 'Skip', action: 'dismiss', variant: 'ghost' },
    ],
    priority: 9,
    dismissible: true,
  };

  it('should render headline and context', () => {
    render(<NeptuneFeedCard card={card} onChipClick={vi.fn()} />);
    expect(screen.getByText('New lead: Kitchen remodel, Frisco')).toBeDefined();
    expect(screen.getByText(/Came through your website/)).toBeDefined();
  });

  it('should render icon', () => {
    render(<NeptuneFeedCard card={card} onChipClick={vi.fn()} />);
    expect(screen.getByText('👥')).toBeDefined();
  });

  it('should render smart chips', () => {
    render(<NeptuneFeedCard card={card} onChipClick={vi.fn()} />);
    expect(screen.getByText('Reach out')).toBeDefined();
    expect(screen.getByText('Skip')).toBeDefined();
  });

  it('should show expansion content when provided', () => {
    const expansion = {
      cardId: 'card-1',
      message: 'Done. I drafted an intro email.',
      chips: [{ id: 'e1', label: 'Edit draft', action: 'edit', variant: 'primary' as const }],
    };
    render(
      <NeptuneFeedCard card={card} onChipClick={vi.fn()} expansion={expansion} />,
    );
    expect(screen.getByText(/drafted an intro email/)).toBeDefined();
    expect(screen.getByText('Edit draft')).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/home/NeptuneFeedCard.test.tsx`
Expected: FAIL

**Step 3: Implement the component**

```tsx
// src/components/home/NeptuneFeedCard.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { SmartChipBar } from './SmartChipBar';
import type { FeedCard, FeedCardExpansion, SmartChip } from '@/types/home-feed';

interface NeptuneFeedCardProps {
  card: FeedCard;
  onChipClick: (chip: SmartChip, cardId: string) => void;
  expansion?: FeedCardExpansion;
  loading?: boolean;
}

export function NeptuneFeedCard({ card, onChipClick, expansion, loading }: NeptuneFeedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl border border-nebula-frost/10 bg-nebula-void/50 p-5 backdrop-blur-sm"
    >
      {/* Headline */}
      <div className="flex items-start gap-3">
        <span className="text-xl leading-none" role="img" aria-hidden>
          {card.icon}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-nebula-frost">
            {card.headline}
          </h3>
          <p className="mt-1.5 text-sm text-nebula-frost/70 leading-relaxed">
            {card.context}
          </p>
        </div>
      </div>

      {/* Smart chips */}
      {!expansion && (
        <SmartChipBar
          chips={card.chips}
          onChipClick={(chip) => onChipClick(chip, card.id)}
          loading={loading}
        />
      )}

      {/* Inline expansion */}
      <AnimatePresence>
        {expansion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-4 rounded-lg border border-teal-500/20 bg-teal-500/5 p-4"
          >
            <p className="text-sm text-nebula-frost/90">{expansion.message}</p>
            {expansion.chips && (
              <SmartChipBar
                chips={expansion.chips}
                onChipClick={(chip) => onChipClick(chip, card.id)}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/components/home/NeptuneFeedCard.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/home/NeptuneFeedCard.tsx tests/components/home/NeptuneFeedCard.test.tsx
git commit -m "feat(home): add NeptuneFeedCard with inline expansion"
```

---

### Task 7: NeptuneFeed Container & SlidePanel

**Files:**
- Create: `src/components/home/NeptuneFeed.tsx`
- Create: `src/components/home/SlidePanel.tsx`
- Test: `tests/components/home/NeptuneFeed.test.tsx`

**Depends on:** Task 6

**Step 1: Write the failing test**

```typescript
// tests/components/home/NeptuneFeed.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NeptuneFeed } from '@/components/home/NeptuneFeed';
import type { FeedCard } from '@/types/home-feed';

// Mock fetch for action calls
global.fetch = vi.fn();

describe('NeptuneFeed', () => {
  const cards: FeedCard[] = [
    {
      id: 'card-1',
      category: 'lead',
      icon: '👥',
      headline: 'Hot lead waiting',
      context: 'Someone wants to hire you.',
      chips: [{ id: 'c1', label: 'Go', action: 'go', variant: 'primary' }],
      priority: 9,
      dismissible: true,
    },
    {
      id: 'card-2',
      category: 'campaign',
      icon: '📈',
      headline: 'Campaign results',
      context: '18% open rate.',
      chips: [{ id: 'c2', label: 'See', action: 'see', variant: 'primary' }],
      priority: 6,
      dismissible: true,
    },
  ];

  it('should render greeting', () => {
    render(
      <NeptuneFeed greeting="Good morning, Alex." cards={cards} isNewUser={false} />,
    );
    expect(screen.getByText('Good morning, Alex.')).toBeDefined();
  });

  it('should render all cards', () => {
    render(
      <NeptuneFeed greeting="Good morning, Alex." cards={cards} isNewUser={false} />,
    );
    expect(screen.getByText('Hot lead waiting')).toBeDefined();
    expect(screen.getByText('Campaign results')).toBeDefined();
  });

  it('should render the Neptune input at the bottom', () => {
    render(
      <NeptuneFeed greeting="Good morning, Alex." cards={cards} isNewUser={false} />,
    );
    const input = screen.getByPlaceholderText(/Talk to Neptune/i);
    expect(input).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/home/NeptuneFeed.test.tsx`
Expected: FAIL

**Step 3: Implement SlidePanel**

```tsx
// src/components/home/SlidePanel.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SlidePanelProps {
  open: boolean;
  title: string;
  href: string;
  onClose: () => void;
}

export function SlidePanel({ open, title, href, onClose }: SlidePanelProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-lg border-l border-nebula-frost/10 bg-nebula-void shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-nebula-frost/10 px-6 py-4">
              <h2 className="text-lg font-semibold text-nebula-frost">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-nebula-frost/50 hover:bg-white/5 hover:text-nebula-frost"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <iframe src={href} className="h-[calc(100%-65px)] w-full border-0" title={title} />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

**Step 4: Implement NeptuneFeed**

```tsx
// src/components/home/NeptuneFeed.tsx
'use client';

import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { NeptuneFeedCard } from './NeptuneFeedCard';
import { SlidePanel } from './SlidePanel';
import type { FeedCard, FeedCardExpansion, SmartChip } from '@/types/home-feed';

interface NeptuneFeedProps {
  greeting: string;
  cards: FeedCard[];
  isNewUser: boolean;
}

export function NeptuneFeed({ greeting, cards: initialCards, isNewUser }: NeptuneFeedProps) {
  const [cards, setCards] = useState<FeedCard[]>(initialCards);
  const [expansions, setExpansions] = useState<Record<string, FeedCardExpansion>>({});
  const [loadingCard, setLoadingCard] = useState<string | null>(null);
  const [slidePanel, setSlidePanel] = useState<{ title: string; href: string } | null>(null);
  const [neptuneInput, setNeptuneInput] = useState('');

  const handleChipClick = useCallback(async (chip: SmartChip, cardId: string) => {
    // Dismiss action — remove card from feed
    if (chip.action === 'dismiss') {
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      return;
    }

    setLoadingCard(cardId);

    try {
      const response = await fetch('/api/home/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId,
          chipId: chip.id,
          action: chip.action,
          args: chip.args,
        }),
      });

      if (!response.ok) throw new Error('Action failed');

      const data = await response.json();

      if (data.success && data.expansion) {
        setExpansions((prev) => ({ ...prev, [cardId]: data.expansion }));

        if (data.expansion.slidePanel) {
          setSlidePanel(data.expansion.slidePanel);
        }
      }
    } catch {
      // Silently handle — the card stays visible for retry
    } finally {
      setLoadingCard(null);
    }
  }, []);

  const handleNeptuneSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!neptuneInput.trim()) return;
    // Navigate to Neptune conversation with the message
    window.location.href = `/assistant?message=${encodeURIComponent(neptuneInput)}`;
  }, [neptuneInput]);

  return (
    <div className="flex h-full flex-col">
      {/* Greeting zone */}
      <div className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-light text-nebula-frost">{greeting}</h1>
        {isNewUser && (
          <p className="mt-1 text-sm text-nebula-frost/50">
            I&apos;m Neptune — your business partner. Let&apos;s get started.
          </p>
        )}
      </div>

      {/* Feed zone */}
      <div className="flex-1 overflow-y-auto px-6 pb-32">
        <div className="mx-auto max-w-2xl space-y-4">
          <AnimatePresence mode="popLayout">
            {cards.map((card) => (
              <NeptuneFeedCard
                key={card.id}
                card={card}
                onChipClick={handleChipClick}
                expansion={expansions[card.id]}
                loading={loadingCard === card.id}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Input zone */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-nebula-frost/10 bg-nebula-void/95 px-6 py-4 backdrop-blur-lg">
        <form onSubmit={handleNeptuneSubmit} className="mx-auto max-w-2xl">
          <input
            type="text"
            value={neptuneInput}
            onChange={(e) => setNeptuneInput(e.target.value)}
            placeholder="Talk to Neptune..."
            className="w-full rounded-xl border border-nebula-frost/20 bg-white/5 px-5 py-3 text-sm text-nebula-frost placeholder:text-nebula-frost/30 focus:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500/20"
          />
        </form>
      </div>

      {/* Slide panel */}
      <SlidePanel
        open={!!slidePanel}
        title={slidePanel?.title ?? ''}
        href={slidePanel?.href ?? ''}
        onClose={() => setSlidePanel(null)}
      />
    </div>
  );
}
```

**Step 5: Run test to verify it passes**

Run: `npx vitest run tests/components/home/NeptuneFeed.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/home/NeptuneFeed.tsx src/components/home/SlidePanel.tsx tests/components/home/NeptuneFeed.test.tsx
git commit -m "feat(home): add NeptuneFeed container and SlidePanel"
```

---

## Phase 3: Page Assembly

### Task 8: HomePage Client Component

**Files:**
- Create: `src/components/home/HomePage.tsx`
- Create: `src/components/home/index.ts`

**Depends on:** Task 7

**Step 1: Implement the component**

```tsx
// src/components/home/HomePage.tsx
'use client';

import { NeptuneFeed } from './NeptuneFeed';
import { useRealtime } from '@/hooks/use-realtime';
import type { HomeFeedResponse } from '@/types/home-feed';

interface HomePageProps {
  initialData: HomeFeedResponse;
  workspaceId: string;
  userId: string;
}

export function HomePage({ initialData, workspaceId, userId }: HomePageProps) {
  // Subscribe to real-time events for new cards
  useRealtime({
    workspaceId,
    userId,
    enabled: true,
  });

  return (
    <div className="h-full bg-nebula-void">
      <NeptuneFeed
        greeting={initialData.greeting}
        cards={initialData.cards}
        isNewUser={initialData.isNewUser}
      />
    </div>
  );
}
```

```typescript
// src/components/home/index.ts
export { HomePage } from './HomePage';
export { NeptuneFeed } from './NeptuneFeed';
export { NeptuneFeedCard } from './NeptuneFeedCard';
export { SmartChipBar } from './SmartChipBar';
export { SlidePanel } from './SlidePanel';
```

**Step 2: Commit**

```bash
git add src/components/home/HomePage.tsx src/components/home/index.ts
git commit -m "feat(home): add HomePage client component with realtime"
```

---

### Task 9: Update Dashboard Route to Use New Home

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

**Depends on:** Task 8

**Step 1: Read the current page.tsx**

Read `src/app/(app)/dashboard/page.tsx` to understand the current server component structure.

**Step 2: Update the page**

Replace the page content to use the new Home components. Keep the same server-side auth pattern but swap the client component:

```tsx
// src/app/(app)/dashboard/page.tsx
import { Metadata } from 'next';
import { getCurrentWorkspace } from '@/lib/auth';
import { generateFeedCards, generateGreeting } from '@/lib/home/card-engine';
import { HomePage } from '@/components/home';
import type { HomeFeedResponse } from '@/types/home-feed';

export const metadata: Metadata = {
  title: 'Home | GalaxyCo.ai',
  description: 'Your business command center',
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  try {
    const { workspaceId, userId, user } = await getCurrentWorkspace();
    const userName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'there';

    const [cards, greeting] = await Promise.all([
      generateFeedCards(workspaceId, userId, userName),
      Promise.resolve(generateGreeting(userName)),
    ]);

    const isNewUser = cards.some(c => c.category === 'onboarding');

    const initialData: HomeFeedResponse = { greeting, cards, isNewUser };

    return <HomePage initialData={initialData} workspaceId={workspaceId} userId={userId} />;
  } catch {
    // Fallback for auth errors — redirect handled by middleware
    const fallback: HomeFeedResponse = {
      greeting: 'Welcome back.',
      cards: [],
      isNewUser: true,
    };
    return <HomePage initialData={fallback} workspaceId="" userId="" />;
  }
}
```

**Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/app/\(app\)/dashboard/page.tsx
git commit -m "feat(home): replace dashboard with Neptune feed"
```

---

### Task 10: Update Navigation — "Dashboard" → "Home"

**Files:**
- Modify: Navigation config/sidebar (find the nav items — likely in `src/components/layout/` or similar)

**Step 1: Find the navigation config**

Search for `dashboard` in navigation/sidebar components:
```bash
rg -l "dashboard" src/components/layout/ src/components/shared/ src/app/\(app\)/layout.tsx
```

**Step 2: Rename "Dashboard" to "Home" in the nav items**

Change the label from "Dashboard" to "Home" and the icon from `LayoutDashboard` (or similar) to `Home` from lucide-react. Keep the route as `/dashboard` (URL doesn't need to change — the page content is what matters).

**Step 3: Run typecheck and build**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add [modified-nav-files]
git commit -m "feat(home): rename Dashboard to Home in navigation"
```

---

## Phase 4: Cleanup

### Task 11: Remove Old Dashboard Components

**Files to remove:**
- `src/components/dashboard/DashboardV2Client.tsx`
- `src/components/dashboard/WorkspacePanel.tsx`
- `src/components/dashboard/CompassTab.tsx`
- `src/components/dashboard/VisionTab.tsx`
- `src/components/dashboard/BoardsTab.tsx`
- `src/app/(app)/dashboard/customize/page.tsx`

**Files to keep** (used elsewhere):
- `src/lib/dashboard.ts` — still provides data for other features
- `src/components/dashboard/` — only remove the specific files above

**Step 1: Check for imports**

Search for imports of each file to remove:
```bash
rg "DashboardV2Client|WorkspacePanel|CompassTab|VisionTab|BoardsTab" src/ --type ts --type tsx
```

If any file besides the old `page.tsx` imports them, do NOT remove — investigate first.

**Step 2: Remove files**

Only remove files with zero remaining imports (besides the old page.tsx which was already updated).

**Step 3: Remove the customize page**

Delete `src/app/(app)/dashboard/customize/page.tsx`. If there's a link to `/dashboard/customize` in the nav, remove it too.

**Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS (no broken imports)

**Step 5: Run tests**

Run: `npm run test:run`
Expected: All tests pass (old component tests may need removal too)

**Step 6: Commit**

```bash
git add -A
git commit -m "chore(home): remove old dashboard components (WorkspacePanel, Customize, tabs)"
```

---

### Task 12: Update INDEX.md and Documentation

**Files:**
- Modify: `INDEX.md`
- Modify: `CLAUDE.md` (if dashboard is referenced)

**Step 1: Update INDEX.md**

Update the Dashboard module row to reflect the new Home page:
- Pages: `(app)/dashboard/` (renamed to "Home" in nav)
- Components: `components/home/` (new), `components/dashboard/` (reduced)
- Logic: `lib/home/` (new card engine)

**Step 2: Update any dashboard references in CLAUDE.md**

Search for "dashboard" and update to "Home" where appropriate.

**Step 3: Commit**

```bash
git add INDEX.md CLAUDE.md
git commit -m "docs: update INDEX.md and CLAUDE.md for Home page redesign"
```

---

## Summary

| Phase | Tasks | Key Deliverables |
|-------|-------|-----------------|
| **1: Backend** | 1-4 | Types, validation, card engine, feed API, action API |
| **2: UI** | 5-7 | SmartChipBar, NeptuneFeedCard, NeptuneFeed, SlidePanel |
| **3: Assembly** | 8-10 | HomePage component, route update, nav rename |
| **4: Cleanup** | 11-12 | Remove old components, update docs |

**Total new files:** ~12
**Total removed files:** ~6
**Total modified files:** ~4
