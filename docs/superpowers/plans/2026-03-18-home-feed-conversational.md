# Home Feed Conversational Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Home screen from a card-based dashboard feed into a fully conversational interface where Neptune IS the interface — prose, inline visuals, and natural language actions replace cards, chips, and slide panels.

**Architecture:** Reuse existing `neptuneConversations` + `neptuneMessages` tables for conversation storage. Adapt the existing `/api/assistant/chat` streaming SSE pattern for a new `/api/home/conversation` endpoint. The card-engine's data fetchers survive as inputs to a new narrative builder that composes Neptune's contextual opening. The frontend replaces `NeptuneFeed` (card renderer) with `NeptuneConversation` (streaming message thread with content block rendering).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5.7 strict, Tailwind CSS 4, Drizzle ORM + Neon, Framer Motion, Recharts (inline visuals), SSE streaming, OpenAI GPT-4 (with Anthropic/Gemini fallback)

**Spec:** `docs/superpowers/specs/2026-03-18-home-feed-design.md`

**Open Question Decisions (locked for implementation):**
1. **Conversation retention** — No TTL for v1. All history stored indefinitely. Revisit with usage data.
2. **Ambient visual language** — Background gradient hue shift + accent opacity changes. Concrete CSS in Task 13.
3. **Voice modality** — Out of scope. Architecture supports it natively (prose-first).
4. **Cross-module memory** — Home conversation is Home-scoped. Module conversations are separate threads.
5. **Offline mobile** — Out of scope for v1. Command palette works without AI.
6. **Visual data freshness** — Frozen snapshot at generation time. For v1, conversation history replays messages as text-only (visual/action blocks are not persisted in structured form). The `neptuneMessages.content` column stores raw LLM output. Adding a `metadata: jsonb` column for structured block storage is deferred to v2 when usage data justifies the schema migration.

---

## File Structure

### New Files

| File | Responsibility |
|------|---------------|
| `src/types/neptune-conversation.ts` | ContentBlock, VisualSpec, ActionOption, NeptuneMessage types (from spec Section 10) |
| `src/lib/validation/neptune-conversation.ts` | Zod schemas for conversation types |
| `src/lib/home/narrative-builder.ts` | Composes Neptune's contextual opening from workspace data + LLM |
| `src/lib/home/session-manager.ts` | Session lifecycle: create, resume, idle timeout detection |
| `src/lib/home/behavioral-signals.ts` | Engagement tracking: scroll depth, response time, topic interaction |
| `src/app/api/home/conversation/route.ts` | Streaming SSE endpoint for Neptune conversation |
| `src/app/api/home/conversation/history/route.ts` | GET conversation history with pagination |
| `src/components/home/NeptuneConversation.tsx` | Main conversational surface (replaces NeptuneFeed) |
| `src/components/home/ConversationMessage.tsx` | Renders a single message with content blocks |
| `src/components/home/ContentBlockRenderer.tsx` | Renders individual content blocks (text, visual, action, module-link) |
| `src/components/home/InlineVisual.tsx` | Chart/metric rendering inline in conversation |
| `src/components/home/ActionAffordance.tsx` | Natural language action buttons inline |
| `src/components/home/ConversationInput.tsx` | Persistent input field with ambient pulse |
| `src/components/home/AmbientPulse.tsx` | Luminous presence indicator |
| `src/components/home/MicroFeedback.tsx` | Subtle `···` feedback affordance on messages |
| `src/components/home/SessionDivider.tsx` | Date separator between conversation sessions |
| `tests/lib/home/narrative-builder.test.ts` | Narrative builder unit tests |
| `tests/lib/home/session-manager.test.ts` | Session manager unit tests |
| `tests/api/home-conversation.test.ts` | Conversation API route tests |
| `tests/components/home/ContentBlockRenderer.test.tsx` | Content block rendering tests |
| `tests/components/home/NeptuneConversation.test.tsx` | Conversation surface integration tests |
| `tests/components/home/ConversationInput.test.tsx` | Input component tests |

### Modified Files

| File | Change |
|------|--------|
| `src/components/home/HomePage.tsx` | Simplify to environment container for NeptuneConversation |
| `src/components/home/index.ts` | Update exports (add new, keep old with `@deprecated` JSDoc) |
| `src/app/(app)/dashboard/page.tsx` | Adapt server component to initialize conversation session |
| `src/lib/home/card-engine.ts` | Extract data fetchers into `workspace-data.ts`, deprecate card formatters |
| `src/types/home-feed.ts` | Add `@deprecated` JSDoc markers |
| `src/lib/validation/home-feed.ts` | Add `@deprecated` JSDoc markers |

### Extracted Files

| File | Responsibility |
|------|---------------|
| `src/lib/home/workspace-data.ts` | Pure data fetchers extracted from card-engine (contacts, tasks, campaigns, agents, integrations) |

---

## Phase 1: Conversational Foundation (Tasks 1–8)

**Ship gate:** User sees Neptune's contextual opening as streamed prose in a conversation thread. Can type responses that route to Neptune. No inline visuals yet — text blocks only. Card feed is still the default behind a feature flag.

---

### Task 1: Conversation Types

**Files:**
- Create: `src/types/neptune-conversation.ts`
- Test: `tests/types/neptune-conversation.test.ts`

- [x] **Step 1: Write the type definitions**

```typescript
// src/types/neptune-conversation.ts

// --- Content Blocks (spec Section 10) ---

export type ContentBlock =
  | TextBlock
  | VisualBlock
  | ActionAffordanceBlock
  | ModuleLinkBlock;

export interface TextBlock {
  type: 'text';
  content: string;
}

export interface VisualBlock {
  type: 'visual';
  spec: VisualSpec;
}

export interface ActionAffordanceBlock {
  type: 'action-affordance';
  prompt: string;
  actions: ActionOption[];
}

export interface ModuleLinkBlock {
  type: 'module-link';
  module: string;
  entity?: string;
  label: string;
}

export type ChartType = 'line' | 'bar' | 'metric' | 'comparison' | 'trend';

export interface VisualSpec {
  chartType: ChartType;
  data: Record<string, unknown>;
  interactive: boolean;
  title?: string;
}

export interface ActionOption {
  label: string;
  intent: string;
  args?: Record<string, unknown>;
  requiresConfirmation?: boolean;
}

// --- Messages ---

export interface ConversationMessage {
  id: string;
  sessionId: string;
  timestamp: string;
  role: 'neptune' | 'user';
  blocks: ContentBlock[];
}

// --- Session ---

export interface ConversationSession {
  id: string;
  conversationId: string;
  startedAt: string;
  lastActiveAt: string;
}

// --- API Types ---

export interface ConversationInitRequest {
  sessionId?: string; // Resume existing session, or omit for new
}

export interface ConversationSendRequest {
  sessionId: string;
  message: string;
}

export interface ConversationHistoryResponse {
  sessions: ConversationSession[];
  messages: ConversationMessage[];
  hasMore: boolean;
  cursor?: string;
}

// --- Streaming Event Types (SSE) ---

export type StreamEvent =
  | { type: 'session'; session: ConversationSession }
  | { type: 'block-start'; blockType: ContentBlock['type']; index: number }
  | { type: 'text-delta'; content: string }
  | { type: 'block-complete'; block: ContentBlock; index: number }
  | { type: 'message-complete'; message: ConversationMessage }
  | { type: 'error'; message: string };
```

- [x] **Step 2: Write type validation tests**

```typescript
// tests/types/neptune-conversation.test.ts
import { describe, it, expectTypeOf } from 'vitest';
import type {
  ContentBlock,
  TextBlock,
  VisualBlock,
  ActionAffordanceBlock,
  ModuleLinkBlock,
  ConversationMessage,
  StreamEvent,
} from '@/types/neptune-conversation';

describe('neptune-conversation types', () => {
  it('ContentBlock discriminates on type field', () => {
    const text: ContentBlock = { type: 'text', content: 'hello' };
    const visual: ContentBlock = {
      type: 'visual',
      spec: { chartType: 'metric', data: { value: 42 }, interactive: false },
    };
    const action: ContentBlock = {
      type: 'action-affordance',
      prompt: 'Approve?',
      actions: [{ label: 'Yes', intent: 'approve' }],
    };
    const link: ContentBlock = {
      type: 'module-link',
      module: 'crm',
      label: 'Open CRM',
    };

    expectTypeOf(text).toMatchTypeOf<ContentBlock>();
    expectTypeOf(visual).toMatchTypeOf<ContentBlock>();
    expectTypeOf(action).toMatchTypeOf<ContentBlock>();
    expectTypeOf(link).toMatchTypeOf<ContentBlock>();
  });

  it('ConversationMessage requires blocks array', () => {
    const msg: ConversationMessage = {
      id: '1',
      sessionId: 's1',
      timestamp: new Date().toISOString(),
      role: 'neptune',
      blocks: [{ type: 'text', content: 'Morning.' }],
    };
    expectTypeOf(msg.blocks).toMatchTypeOf<ContentBlock[]>();
  });

  it('StreamEvent discriminates on type', () => {
    const delta: StreamEvent = { type: 'text-delta', content: 'Hi' };
    expectTypeOf(delta).toMatchTypeOf<StreamEvent>();
  });
});
```

- [x] **Step 3: Run tests to verify types compile**

Run: `npx vitest run tests/types/neptune-conversation.test.ts`
Expected: PASS — type-level tests verify structure

- [x] **Step 4: Commit**

```bash
git add src/types/neptune-conversation.ts tests/types/neptune-conversation.test.ts
git commit -m "feat(home): add conversation type definitions (spec Section 10)"
```

---

### Task 2: Conversation Validation Schemas

**Files:**
- Create: `src/lib/validation/neptune-conversation.ts`
- Test: `tests/lib/validation/neptune-conversation.test.ts`

- [x] **Step 1: Write the failing test**

```typescript
// tests/lib/validation/neptune-conversation.test.ts
import { describe, it, expect } from 'vitest';
import {
  ContentBlockSchema,
  ConversationMessageSchema,
  ConversationInitRequestSchema,
  ConversationSendRequestSchema,
} from '@/lib/validation/neptune-conversation';

describe('neptune-conversation validation', () => {
  it('validates text block', () => {
    const result = ContentBlockSchema.safeParse({ type: 'text', content: 'hello' });
    expect(result.success).toBe(true);
  });

  it('rejects text block without content', () => {
    const result = ContentBlockSchema.safeParse({ type: 'text' });
    expect(result.success).toBe(false);
  });

  it('validates visual block', () => {
    const result = ContentBlockSchema.safeParse({
      type: 'visual',
      spec: { chartType: 'metric', data: { value: 42 }, interactive: false },
    });
    expect(result.success).toBe(true);
  });

  it('rejects visual block with invalid chartType', () => {
    const result = ContentBlockSchema.safeParse({
      type: 'visual',
      spec: { chartType: 'donut', data: {}, interactive: false },
    });
    expect(result.success).toBe(false);
  });

  it('validates action-affordance block', () => {
    const result = ContentBlockSchema.safeParse({
      type: 'action-affordance',
      prompt: 'Approve?',
      actions: [{ label: 'Yes', intent: 'approve' }],
    });
    expect(result.success).toBe(true);
  });

  it('validates module-link block', () => {
    const result = ContentBlockSchema.safeParse({
      type: 'module-link',
      module: 'crm',
      label: 'Open CRM',
    });
    expect(result.success).toBe(true);
  });

  it('validates full ConversationMessage', () => {
    const result = ConversationMessageSchema.safeParse({
      id: 'msg-1',
      sessionId: 'sess-1',
      timestamp: '2026-03-18T10:00:00Z',
      role: 'neptune',
      blocks: [{ type: 'text', content: 'Morning.' }],
    });
    expect(result.success).toBe(true);
  });

  it('validates ConversationInitRequest without sessionId', () => {
    const result = ConversationInitRequestSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('validates ConversationSendRequest', () => {
    const result = ConversationSendRequestSchema.safeParse({
      sessionId: 'sess-1',
      message: 'How did last week go?',
    });
    expect(result.success).toBe(true);
  });

  it('rejects ConversationSendRequest without message', () => {
    const result = ConversationSendRequestSchema.safeParse({
      sessionId: 'sess-1',
    });
    expect(result.success).toBe(false);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/validation/neptune-conversation.test.ts`
Expected: FAIL — module not found

- [x] **Step 3: Write the validation schemas**

```typescript
// src/lib/validation/neptune-conversation.ts
import { z } from 'zod';

const ChartTypeSchema = z.enum(['line', 'bar', 'metric', 'comparison', 'trend']);

const VisualSpecSchema = z.object({
  chartType: ChartTypeSchema,
  data: z.record(z.unknown()),
  interactive: z.boolean(),
  title: z.string().optional(),
});

const ActionOptionSchema = z.object({
  label: z.string(),
  intent: z.string(),
  args: z.record(z.unknown()).optional(),
  requiresConfirmation: z.boolean().optional(),
});

const TextBlockSchema = z.object({
  type: z.literal('text'),
  content: z.string(),
});

const VisualBlockSchema = z.object({
  type: z.literal('visual'),
  spec: VisualSpecSchema,
});

const ActionAffordanceBlockSchema = z.object({
  type: z.literal('action-affordance'),
  prompt: z.string(),
  actions: z.array(ActionOptionSchema).min(1),
});

const ModuleLinkBlockSchema = z.object({
  type: z.literal('module-link'),
  module: z.string(),
  entity: z.string().optional(),
  label: z.string(),
});

export const ContentBlockSchema = z.discriminatedUnion('type', [
  TextBlockSchema,
  VisualBlockSchema,
  ActionAffordanceBlockSchema,
  ModuleLinkBlockSchema,
]);

export const ConversationMessageSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  timestamp: z.string(),
  role: z.enum(['neptune', 'user']),
  blocks: z.array(ContentBlockSchema).min(1),
});

export const ConversationInitRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
});

export const ConversationSendRequestSchema = z.object({
  sessionId: z.string().uuid(),
  message: z.string().min(1).max(4000),
});
```

- [x] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/lib/validation/neptune-conversation.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/lib/validation/neptune-conversation.ts tests/lib/validation/neptune-conversation.test.ts
git commit -m "feat(home): add conversation validation schemas"
```

---

### Task 3: Extract Workspace Data Fetchers

**Files:**
- Create: `src/lib/home/workspace-data.ts`
- Modify: `src/lib/home/card-engine.ts`
- Test: `tests/lib/home/workspace-data.test.ts`

The card-engine has 6 data fetchers that query workspace state (contacts, tasks, campaigns, agents, integrations). These are reused by the narrative builder. Extract them into a dedicated module.

- [x] **Step 1: Write the failing test**

```typescript
// tests/lib/home/workspace-data.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchWorkspaceSnapshot } from '@/lib/home/workspace-data';

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    })),
  },
}));

describe('fetchWorkspaceSnapshot', () => {
  it('returns a snapshot object with all expected fields', async () => {
    const snapshot = await fetchWorkspaceSnapshot('ws-1');

    expect(snapshot).toHaveProperty('contactCount');
    expect(snapshot).toHaveProperty('hotContacts');
    expect(snapshot).toHaveProperty('overdueTasks');
    expect(snapshot).toHaveProperty('recentCampaigns');
    expect(snapshot).toHaveProperty('activeAgentCount');
    expect(snapshot).toHaveProperty('integrationCount');
    expect(snapshot).toHaveProperty('isNewUser');
  });

  it('detects new user when no contacts and no agents', async () => {
    const snapshot = await fetchWorkspaceSnapshot('ws-1');
    expect(snapshot.isNewUser).toBe(true);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/home/workspace-data.test.ts`
Expected: FAIL — module not found

- [x] **Step 3: Create workspace-data.ts by extracting fetchers from card-engine.ts**

```typescript
// src/lib/home/workspace-data.ts
import { db } from '@/lib/db';
import { agents, contacts, tasks, campaigns, integrations } from '@/db/schema';
import { eq, and, desc, lte, sql, count } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export interface WorkspaceSnapshot {
  contactCount: number;
  hotContacts: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    company: string | null;
  }>;
  overdueTasks: Array<{
    id: string;
    title: string;
    customerId: string | null;
  }>;
  recentCampaigns: Array<{
    id: string;
    name: string;
    sentCount: number | null;
    openCount: number | null;
    clickCount: number | null;
  }>;
  activeAgentCount: number;
  integrationCount: number;
  isNewUser: boolean;
}

export async function fetchWorkspaceSnapshot(
  workspaceId: string,
): Promise<WorkspaceSnapshot> {
  try {
    const [
      contactCount,
      hotContacts,
      overdueTasks,
      recentCampaigns,
      activeAgentCount,
      integrationCount,
    ] = await Promise.all([
      getContactCount(workspaceId),
      getHotContacts(workspaceId),
      getOverdueTasks(workspaceId),
      getRecentCampaignResults(workspaceId),
      getActiveAgentCount(workspaceId),
      getIntegrationCount(workspaceId),
    ]);

    return {
      contactCount,
      hotContacts,
      overdueTasks,
      recentCampaigns,
      activeAgentCount,
      integrationCount,
      isNewUser: contactCount === 0 && activeAgentCount === 0,
    };
  } catch (error) {
    logger.error('Failed to fetch workspace snapshot', { error, workspaceId });
    return {
      contactCount: 0,
      hotContacts: [],
      overdueTasks: [],
      recentCampaigns: [],
      activeAgentCount: 0,
      integrationCount: 0,
      isNewUser: true,
    };
  }
}

// --- Data fetchers (all filtered by workspaceId) ---
// Extracted from src/lib/home/card-engine.ts

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

async function getHotContacts(workspaceId: string) {
  try {
    return await db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        company: contacts.company,
      })
      .from(contacts)
      .where(and(eq(contacts.workspaceId, workspaceId), eq(contacts.leadStatus, 'hot')))
      .orderBy(desc(contacts.updatedAt))
      .limit(5);
  } catch {
    return [];
  }
}

async function getOverdueTasks(workspaceId: string) {
  try {
    return await db
      .select({
        id: tasks.id,
        title: tasks.title,
        customerId: tasks.customerId,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.status, 'todo'),
          lte(tasks.dueDate, sql`NOW()`),
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
      .select({
        id: campaigns.id,
        name: campaigns.name,
        sentCount: campaigns.sentCount,
        openCount: campaigns.openCount,
        clickCount: campaigns.clickCount,
      })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.workspaceId, workspaceId),
          eq(campaigns.status, 'completed'),
          lte(sql`NOW() - INTERVAL '7 days'`, campaigns.updatedAt),
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
      .where(and(eq(agents.workspaceId, workspaceId), eq(agents.status, 'active')));
    return result[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

async function getIntegrationCount(workspaceId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(integrations)
      .where(and(eq(integrations.workspaceId, workspaceId), eq(integrations.status, 'active')));
    return result[0]?.count ?? 0;
  } catch {
    return 0;
  }
}
```

- [x] **Step 4: Update card-engine.ts to import from workspace-data.ts**

Replace the data fetchers in `src/lib/home/card-engine.ts` with imports from the new module. Keep `generateFeedCards` and `generateGreeting` working — they now call `fetchWorkspaceSnapshot()` internally. Add `@deprecated` JSDoc to `generateFeedCards`.

```typescript
// At top of card-engine.ts, replace all data fetcher imports/functions:
import { fetchWorkspaceSnapshot } from './workspace-data';
import type { WorkspaceSnapshot } from './workspace-data';

// Replace generateFeedCards body to use snapshot:
/** @deprecated Use narrative-builder.ts for conversational Home */
export async function generateFeedCards(
  workspaceId: string,
  userId: string,
  userName: string,
): Promise<FeedCard[]> {
  const snapshot = await fetchWorkspaceSnapshot(workspaceId);
  // ... rest uses snapshot.hotContacts, snapshot.overdueTasks, etc.
```

- [x] **Step 5: Run existing card-engine tests to ensure no regression**

Run: `npx vitest run tests/api/home-feed.test.ts tests/lib/validation/home-feed.test.ts`
Expected: PASS — existing behavior unchanged

- [x] **Step 6: Run new workspace-data tests**

Run: `npx vitest run tests/lib/home/workspace-data.test.ts`
Expected: PASS

- [x] **Step 7: Commit**

```bash
git add src/lib/home/workspace-data.ts src/lib/home/card-engine.ts tests/lib/home/workspace-data.test.ts
git commit -m "refactor(home): extract workspace data fetchers from card-engine"
```

---

### Task 4: Session Manager

**Files:**
- Create: `src/lib/home/session-manager.ts`
- Test: `tests/lib/home/session-manager.test.ts`

Handles conversation session lifecycle: create new, resume existing, detect idle timeout (30 min per spec Section 7).

- [x] **Step 1: Write the failing test**

```typescript
// tests/lib/home/session-manager.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSession,
  getOrCreateSession,
  isSessionExpired,
  SESSION_IDLE_TIMEOUT_MS,
} from '@/lib/home/session-manager';

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{
          id: 'conv-1',
          workspaceId: 'ws-1',
          userId: 'user-1',
          title: 'Home Session',
          lastActiveAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          messageCount: 0,
          toolExecutionCount: 0,
          summary: null,
          topic: 'home',
        }])),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('session-manager', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('SESSION_IDLE_TIMEOUT_MS is 30 minutes', () => {
    expect(SESSION_IDLE_TIMEOUT_MS).toBe(30 * 60 * 1000);
  });

  it('isSessionExpired returns true for sessions older than 30 minutes', () => {
    const oldDate = new Date(Date.now() - 31 * 60 * 1000);
    expect(isSessionExpired(oldDate)).toBe(true);
  });

  it('isSessionExpired returns false for recent sessions', () => {
    const recentDate = new Date(Date.now() - 5 * 60 * 1000);
    expect(isSessionExpired(recentDate)).toBe(false);
  });

  it('createSession returns a session object', async () => {
    const session = await createSession('ws-1', 'user-1');
    expect(session).toHaveProperty('id');
    expect(session).toHaveProperty('conversationId');
    expect(session).toHaveProperty('startedAt');
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/home/session-manager.test.ts`
Expected: FAIL — module not found

- [x] **Step 3: Write the session manager**

```typescript
// src/lib/home/session-manager.ts
import { db } from '@/lib/db';
import { neptuneConversations } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import type { ConversationSession } from '@/types/neptune-conversation';

export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function isSessionExpired(lastActiveAt: Date): boolean {
  return Date.now() - lastActiveAt.getTime() > SESSION_IDLE_TIMEOUT_MS;
}

export async function createSession(
  workspaceId: string,
  userId: string,
): Promise<ConversationSession> {
  const [conversation] = await db
    .insert(neptuneConversations)
    .values({
      workspaceId,
      userId,
      title: 'Home Session',
      topic: 'home',
    })
    .returning();

  logger.info('Created new home session', {
    conversationId: conversation.id,
    workspaceId,
    userId,
  });

  return {
    id: conversation.id, // session ID = conversation ID for home
    conversationId: conversation.id,
    startedAt: conversation.createdAt.toISOString(),
    lastActiveAt: conversation.lastActiveAt.toISOString(),
  };
}

export async function getOrCreateSession(
  workspaceId: string,
  userId: string,
): Promise<{ session: ConversationSession; isNew: boolean }> {
  // Find most recent home conversation for this user
  const recent = await db
    .select()
    .from(neptuneConversations)
    .where(
      and(
        eq(neptuneConversations.workspaceId, workspaceId),
        eq(neptuneConversations.userId, userId),
        eq(neptuneConversations.topic, 'home'),
      ),
    )
    .orderBy(desc(neptuneConversations.lastActiveAt))
    .limit(1);

  const existing = recent[0];

  // Resume if exists and not expired
  if (existing && !isSessionExpired(existing.lastActiveAt)) {
    // Touch lastActiveAt
    await db
      .update(neptuneConversations)
      .set({ lastActiveAt: new Date(), updatedAt: new Date() })
      .where(eq(neptuneConversations.id, existing.id));

    return {
      session: {
        id: existing.id,
        conversationId: existing.id,
        startedAt: existing.createdAt.toISOString(),
        lastActiveAt: new Date().toISOString(),
      },
      isNew: false,
    };
  }

  // Create new session
  const session = await createSession(workspaceId, userId);
  return { session, isNew: true };
}

export async function touchSession(sessionId: string): Promise<void> {
  await db
    .update(neptuneConversations)
    .set({ lastActiveAt: new Date(), updatedAt: new Date() })
    .where(eq(neptuneConversations.id, sessionId));
}
```

- [x] **Step 4: Run tests**

Run: `npx vitest run tests/lib/home/session-manager.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/lib/home/session-manager.ts tests/lib/home/session-manager.test.ts
git commit -m "feat(home): add session manager with 30-min idle timeout"
```

---

### Task 5: Narrative Builder

**Files:**
- Create: `src/lib/home/narrative-builder.ts`
- Test: `tests/lib/home/narrative-builder.test.ts`

The core intelligence: takes workspace data + user context and produces Neptune's contextual opening as content blocks. Uses LLM for natural language generation with structured output.

- [x] **Step 1: Write the failing test**

```typescript
// tests/lib/home/narrative-builder.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildNarrativePrompt, parseNarrativeResponse } from '@/lib/home/narrative-builder';
import type { WorkspaceSnapshot } from '@/lib/home/workspace-data';

describe('narrative-builder', () => {
  const baseSnapshot: WorkspaceSnapshot = {
    contactCount: 50,
    hotContacts: [
      { id: 'c1', firstName: 'Alex', lastName: 'Henderson', company: 'Henderson Co' },
    ],
    overdueTasks: [
      { id: 't1', title: 'Send proposal', customerId: 'c2' },
    ],
    recentCampaigns: [
      { id: 'camp1', name: 'Spring Outreach', sentCount: 100, openCount: 35, clickCount: 12 },
    ],
    activeAgentCount: 3,
    integrationCount: 2,
    isNewUser: false,
  };

  describe('buildNarrativePrompt', () => {
    it('includes workspace data summary in prompt', () => {
      const prompt = buildNarrativePrompt(baseSnapshot, 'Dalton', 'morning');
      expect(prompt).toContain('Alex Henderson');
      expect(prompt).toContain('Send proposal');
      expect(prompt).toContain('Spring Outreach');
    });

    it('adjusts tone for time of day', () => {
      const morning = buildNarrativePrompt(baseSnapshot, 'Dalton', 'morning');
      const evening = buildNarrativePrompt(baseSnapshot, 'Dalton', 'evening');
      expect(morning).toContain('morning');
      expect(evening).toContain('evening');
    });

    it('handles new user with empty workspace', () => {
      const emptySnapshot: WorkspaceSnapshot = {
        contactCount: 0, hotContacts: [], overdueTasks: [],
        recentCampaigns: [], activeAgentCount: 0, integrationCount: 0,
        isNewUser: true,
      };
      const prompt = buildNarrativePrompt(emptySnapshot, 'Dalton', 'morning');
      expect(prompt).toContain('new');
    });
  });

  describe('parseNarrativeResponse', () => {
    it('parses plain text into text blocks', () => {
      const blocks = parseNarrativeResponse('Morning. Alex closed Henderson.');
      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('text');
    });

    it('parses text with visual markers into mixed blocks', () => {
      const response = 'Revenue is up.\n[VISUAL:metric:{"value":4200,"label":"Revenue","trend":"up"}]\nBest week yet.';
      const blocks = parseNarrativeResponse(response);
      expect(blocks.length).toBeGreaterThanOrEqual(2);
      expect(blocks.some(b => b.type === 'visual')).toBe(true);
    });

    it('parses action affordances', () => {
      const response = 'Jordan needs pricing.\n[ACTION:{"prompt":"Want me to pull up details?","actions":[{"label":"Show details","intent":"view_lead"}]}]';
      const blocks = parseNarrativeResponse(response);
      expect(blocks.some(b => b.type === 'action-affordance')).toBe(true);
    });
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/home/narrative-builder.test.ts`
Expected: FAIL — module not found

- [x] **Step 3: Write the narrative builder**

```typescript
// src/lib/home/narrative-builder.ts
import { logger } from '@/lib/logger';
import type { WorkspaceSnapshot } from './workspace-data';
import type { ContentBlock } from '@/types/neptune-conversation';

type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

/**
 * Build the LLM prompt for Neptune's contextual opening.
 * The prompt instructs the LLM to produce natural prose with embedded
 * visual/action markers that parseNarrativeResponse will extract.
 */
export function buildNarrativePrompt(
  snapshot: WorkspaceSnapshot,
  userName: string,
  timeOfDay: TimeOfDay,
): string {
  const firstName = userName.split(' ')[0] || userName;

  // Build workspace context summary
  const contextLines: string[] = [];

  if (snapshot.isNewUser) {
    contextLines.push(
      'This is a new user with an empty workspace. No contacts, no agents, no data yet.',
      'Be warm, forward-looking, and honest. Ask what matters most to them.',
    );
  } else {
    if (snapshot.hotContacts.length > 0) {
      const names = snapshot.hotContacts
        .map(c => [c.firstName, c.lastName].filter(Boolean).join(' ') || c.company || 'Unknown')
        .join(', ');
      contextLines.push(`Hot leads awaiting follow-up: ${names} (${snapshot.hotContacts.length} total)`);
    }

    if (snapshot.overdueTasks.length > 0) {
      const taskNames = snapshot.overdueTasks.map(t => t.title).join(', ');
      contextLines.push(`Overdue tasks: ${taskNames} (${snapshot.overdueTasks.length} total)`);
    }

    if (snapshot.recentCampaigns.length > 0) {
      for (const c of snapshot.recentCampaigns) {
        const sent = c.sentCount ?? 0;
        const opens = c.openCount ?? 0;
        const openPct = sent > 0 ? Math.round((opens / sent) * 100) : 0;
        contextLines.push(`Campaign "${c.name}": ${openPct}% open rate (${sent} sent, ${opens} opened, ${c.clickCount ?? 0} clicks)`);
      }
    }

    contextLines.push(`Total contacts: ${snapshot.contactCount}`);
    contextLines.push(`Active agents: ${snapshot.activeAgentCount}`);
  }

  const toneGuidance = {
    morning: 'It is morning. Lead with a briefing-oriented opening. Be direct and energizing.',
    afternoon: 'It is afternoon. Be responsive and action-oriented. The user is in their workflow.',
    evening: 'It is evening. Lean toward summary and wind-down. Be softer and reflective.',
  }[timeOfDay];

  return `You are Neptune, the AI chief of staff for ${firstName}'s business.

## Your Role
You are composing your contextual opening — the first thing ${firstName} sees when they arrive.

## Voice Rules
- Speak in natural prose. No bullet points. No card layouts. No headers.
- Follow this rhythm: (1) Acknowledge briefly, (2) Lead with the most important thing, (3) Layer in supporting context naturally, (4) Close with an implicit or explicit invitation to respond.
- Be confident but not performative. Direct but warm.
- ${toneGuidance}

## Workspace State
${contextLines.join('\n')}

## Output Format
Write natural prose. When a visual would help, embed it on its own line using this exact format:
[VISUAL:chartType:{"key":"value"}]

When an action is available, embed it on its own line:
[ACTION:{"prompt":"question","actions":[{"label":"Button text","intent":"action_name"}]}]

When referring to a module, embed a link:
[LINK:{"module":"crm","label":"Open CRM"}]

Keep it concise. 2-4 sentences for a normal day. More only if there's genuinely more to say.
Do NOT fabricate data. Only reference what's in the workspace state above.
Do NOT use greetings like "Good morning" — just the user's name or a casual beat.`;
}

/**
 * Parse Neptune's LLM response into typed ContentBlocks.
 * Extracts embedded [VISUAL:...], [ACTION:...], and [LINK:...] markers.
 */
export function parseNarrativeResponse(response: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];

  // Balanced-bracket parser: find [MARKER_TYPE:...] with proper bracket nesting
  let lastIndex = 0;
  const markerStartRegex = /\[(VISUAL|ACTION|LINK):/g;
  let startMatch: RegExpExecArray | null;

  while ((startMatch = markerStartRegex.exec(response)) !== null) {
    // Find the matching closing bracket by counting bracket depth
    let depth = 1;
    let pos = startMatch.index + startMatch[0].length;
    while (pos < response.length && depth > 0) {
      if (response[pos] === '[') depth++;
      else if (response[pos] === ']') depth--;
      if (depth > 0) pos++;
    }
    if (depth !== 0) continue; // Unbalanced — skip this marker

    const markerType = startMatch[1];
    const markerData = response.slice(startMatch.index + startMatch[0].length, pos);

    // Add preceding text as a text block
    const textBefore = response.slice(lastIndex, startMatch.index).trim();
    if (textBefore) {
      blocks.push({ type: 'text', content: textBefore });
    }

    // Advance the start regex past this marker
    markerStartRegex.lastIndex = pos + 1;

    try {
      if (markerType === 'VISUAL') {
        // Format: VISUAL:chartType:jsonData
        const colonIdx = markerData.indexOf(':');
        const chartType = markerData.slice(0, colonIdx) as ContentBlock extends { type: 'visual' } ? never : string;
        const data = JSON.parse(markerData.slice(colonIdx + 1));
        blocks.push({
          type: 'visual',
          spec: {
            chartType: chartType as 'line' | 'bar' | 'metric' | 'comparison' | 'trend',
            data,
            interactive: true,
          },
        });
      } else if (markerType === 'ACTION') {
        const parsed = JSON.parse(markerData);
        blocks.push({
          type: 'action-affordance',
          prompt: parsed.prompt,
          actions: parsed.actions,
        });
      } else if (markerType === 'LINK') {
        const parsed = JSON.parse(markerData);
        blocks.push({
          type: 'module-link',
          module: parsed.module,
          entity: parsed.entity,
          label: parsed.label,
        });
      }
    } catch (error) {
      logger.warn('Failed to parse narrative marker', { markerType, markerData, error });
      // Fall back to including it as text
      blocks.push({ type: 'text', content: response.slice(startMatch.index, pos + 1) });
    }

    lastIndex = pos + 1;
  }

  // Add trailing text
  const trailing = response.slice(lastIndex).trim();
  if (trailing) {
    blocks.push({ type: 'text', content: trailing });
  }

  // If no blocks were created, wrap the whole response as text
  if (blocks.length === 0 && response.trim()) {
    blocks.push({ type: 'text', content: response.trim() });
  }

  return blocks;
}
```

- [x] **Step 4: Run tests**

Run: `npx vitest run tests/lib/home/narrative-builder.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/lib/home/narrative-builder.ts tests/lib/home/narrative-builder.test.ts
git commit -m "feat(home): add narrative builder for Neptune's contextual opening"
```

---

### Task 6: Streaming Conversation API Endpoint

**Files:**
- Create: `src/app/api/home/conversation/route.ts`
- Test: `tests/api/home-conversation.test.ts`

SSE streaming endpoint that handles: (1) Session init with contextual opening, (2) User message processing.

- [x] **Step 1: Write the failing test**

```typescript
// tests/api/home-conversation.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/home/conversation/route';
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

vi.mock('@/lib/home/session-manager', () => ({
  getOrCreateSession: vi.fn(() =>
    Promise.resolve({
      session: {
        id: 'sess-1',
        conversationId: 'conv-1',
        startedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      },
      isNew: true,
    }),
  ),
  touchSession: vi.fn(),
}));

vi.mock('@/lib/home/workspace-data', () => ({
  fetchWorkspaceSnapshot: vi.fn(() =>
    Promise.resolve({
      contactCount: 10,
      hotContacts: [],
      overdueTasks: [],
      recentCampaigns: [],
      activeAgentCount: 2,
      integrationCount: 1,
      isNewUser: false,
    }),
  ),
}));

vi.mock('@/lib/home/narrative-builder', () => ({
  buildNarrativePrompt: vi.fn(() => 'Mock prompt'),
  parseNarrativeResponse: vi.fn(() => [{ type: 'text', content: 'Morning.' }]),
  getTimeOfDay: vi.fn(() => 'morning'),
}));

vi.mock('@/lib/ai-providers', () => ({
  getOpenAI: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(() => Promise.resolve({
          choices: [{ message: { content: 'Morning. All quiet.' } }],
        })),
      },
    },
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

describe('POST /api/home/conversation', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns a streaming response for session init', async () => {
    const request = new NextRequest('http://localhost:3000/api/home/conversation', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/event-stream');
  });

  it('returns a streaming response for user message', async () => {
    const request = new NextRequest('http://localhost:3000/api/home/conversation', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: 'sess-1',
        message: 'How did last week go?',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/home-conversation.test.ts`
Expected: FAIL — module not found

- [x] **Step 3: Write the streaming endpoint**

```typescript
// src/app/api/home/conversation/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { getOpenAI } from '@/lib/ai-providers';
import { getOrCreateSession, touchSession } from '@/lib/home/session-manager';
import { fetchWorkspaceSnapshot } from '@/lib/home/workspace-data';
import {
  buildNarrativePrompt,
  parseNarrativeResponse,
  getTimeOfDay,
} from '@/lib/home/narrative-builder';
import type { WorkspaceSnapshot } from '@/lib/home/workspace-data';
import { db } from '@/lib/db';
import { neptuneMessages, neptuneConversations } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import type { StreamEvent, ConversationMessage } from '@/types/neptune-conversation';

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, userId, user } = await getCurrentWorkspace();

    const { success } = await rateLimit(userId, 30, 60);
    if (!success) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    const body = await request.json();
    const sessionId = body.sessionId as string | undefined;
    const userMessage = body.message as string | undefined;

    const userName =
      `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'there';

    // Get or create session
    const { session, isNew } = sessionId
      ? { session: { id: sessionId, conversationId: sessionId, startedAt: '', lastActiveAt: '' }, isNew: false }
      : await getOrCreateSession(workspaceId, userId);

    // Store user message if provided
    if (userMessage) {
      await db.insert(neptuneMessages).values({
        workspaceId,
        conversationId: session.conversationId,
        userId,
        role: 'user',
        content: userMessage,
      });
      await touchSession(session.id);
    }

    // Build context
    const snapshot = await fetchWorkspaceSnapshot(workspaceId);
    const timeOfDay = getTimeOfDay();

    const prompt = isNew && !userMessage
      ? buildNarrativePrompt(snapshot, userName, timeOfDay)
      : buildConversationPrompt(snapshot, userName, userMessage ?? '');

    // Stream response via SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: StreamEvent) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };

        try {
          // Send session info
          send({ type: 'session', session });

          // Generate Neptune's response
          const openai = getOpenAI();
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: prompt },
              ...(userMessage ? [{ role: 'user' as const, content: userMessage }] : []),
            ],
            temperature: 0.7,
            max_tokens: 1000,
          });

          const responseText = completion.choices[0]?.message?.content ?? '';
          const blocks = parseNarrativeResponse(responseText);

          // Stream blocks
          for (let i = 0; i < blocks.length; i++) {
            send({ type: 'block-start', blockType: blocks[i].type, index: i });

            if (blocks[i].type === 'text') {
              // Simulate streaming for text blocks
              send({ type: 'text-delta', content: (blocks[i] as { type: 'text'; content: string }).content });
            }

            send({ type: 'block-complete', block: blocks[i], index: i });
          }

          // Build complete message
          const message: ConversationMessage = {
            id: crypto.randomUUID(),
            sessionId: session.id,
            timestamp: new Date().toISOString(),
            role: 'neptune',
            blocks,
          };

          send({ type: 'message-complete', message });

          // Store Neptune's response
          await db.insert(neptuneMessages).values({
            workspaceId,
            conversationId: session.conversationId,
            userId,
            role: 'assistant',
            content: responseText,
            tokenCount: completion.usage?.total_tokens,
          });

          // Increment conversation stats
          const increment = userMessage ? 2 : 1; // user + neptune, or just neptune opening
          await db
            .update(neptuneConversations)
            .set({
              messageCount: sql`${neptuneConversations.messageCount} + ${increment}`,
              lastActiveAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(neptuneConversations.id, session.conversationId));

        } catch (error) {
          logger.error('Conversation stream error', { error, workspaceId });
          send({
            type: 'error',
            message: "Give me a moment — I'm having trouble pulling everything together. You can ask me anything in the meantime, or head to any module directly.",
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Conversation endpoint error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function buildConversationPrompt(
  snapshot: WorkspaceSnapshot,
  userName: string,
  userMessage: string,
): string {
  const firstName = userName.split(' ')[0] || userName;

  const contextLines: string[] = [];
  if (snapshot.hotContacts.length > 0) {
    contextLines.push(`Hot leads: ${snapshot.hotContacts.map(c => [c.firstName, c.lastName].filter(Boolean).join(' ')).join(', ')}`);
  }
  if (snapshot.overdueTasks.length > 0) {
    contextLines.push(`Overdue tasks: ${snapshot.overdueTasks.map(t => t.title).join(', ')}`);
  }
  contextLines.push(`Contacts: ${snapshot.contactCount}, Active agents: ${snapshot.activeAgentCount}`);

  return `You are Neptune, AI chief of staff for ${firstName}'s business.
Respond conversationally to their message. Be direct, warm, and helpful.

Workspace context:
${contextLines.join('\n')}

Rules:
- Speak in natural prose, not bullet points
- Use [VISUAL:chartType:jsonData] for inline visuals when helpful
- Use [ACTION:{"prompt":"...","actions":[...]}] for actionable suggestions
- Use [LINK:{"module":"...","label":"..."}] for module navigation
- Be concise. Answer what was asked.`;
}

// Note: WorkspaceSnapshot type is imported at the top of the file
// alongside other workspace-data imports
```

- [x] **Step 4: Run tests**

Run: `npx vitest run tests/api/home-conversation.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/app/api/home/conversation/route.ts tests/api/home-conversation.test.ts
git commit -m "feat(home): add streaming conversation API endpoint"
```

---

### Task 7: ContentBlockRenderer Component

**Files:**
- Create: `src/components/home/ContentBlockRenderer.tsx`
- Create: `src/components/home/ActionAffordance.tsx`
- Create: `src/components/home/SessionDivider.tsx`
- Test: `tests/components/home/ContentBlockRenderer.test.tsx`

The core UI primitive: renders a single ContentBlock based on its type discriminator.

- [x] **Step 1: Write the failing test**

```tsx
// tests/components/home/ContentBlockRenderer.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContentBlockRenderer } from '@/components/home/ContentBlockRenderer';
import type { ContentBlock } from '@/types/neptune-conversation';

describe('ContentBlockRenderer', () => {
  it('renders text block as paragraph', () => {
    const block: ContentBlock = { type: 'text', content: 'Morning. All quiet.' };
    render(<ContentBlockRenderer block={block} />);
    expect(screen.getByText('Morning. All quiet.')).toBeInTheDocument();
  });

  it('renders module-link block as a link', () => {
    const block: ContentBlock = {
      type: 'module-link',
      module: 'crm',
      label: 'Open CRM',
    };
    render(<ContentBlockRenderer block={block} />);
    expect(screen.getByText('Open CRM')).toBeInTheDocument();
  });

  it('renders action-affordance block with buttons', () => {
    const block: ContentBlock = {
      type: 'action-affordance',
      prompt: 'Want details?',
      actions: [
        { label: 'Show details', intent: 'view_lead' },
        { label: 'Skip', intent: 'dismiss' },
      ],
    };
    render(<ContentBlockRenderer block={block} onAction={vi.fn()} />);
    expect(screen.getByText('Want details?')).toBeInTheDocument();
    expect(screen.getByText('Show details')).toBeInTheDocument();
    expect(screen.getByText('Skip')).toBeInTheDocument();
  });

  it('renders visual block placeholder for Phase 1', () => {
    const block: ContentBlock = {
      type: 'visual',
      spec: { chartType: 'metric', data: { value: 42 }, interactive: false },
    };
    const { container } = render(<ContentBlockRenderer block={block} />);
    // Phase 1: renders a placeholder div with data-chart-type attribute
    expect(container.querySelector('[data-chart-type="metric"]')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/home/ContentBlockRenderer.test.tsx`
Expected: FAIL — module not found

- [x] **Step 3: Write ActionAffordance component**

```tsx
// src/components/home/ActionAffordance.tsx
'use client';

import type { ActionOption } from '@/types/neptune-conversation';

interface ActionAffordanceProps {
  prompt: string;
  actions: ActionOption[];
  onAction?: (action: ActionOption) => void;
}

export function ActionAffordance({ prompt, actions, onAction }: ActionAffordanceProps) {
  return (
    <div className="my-2">
      <p className="font-[family-name:var(--font-dm-sans)] text-sm text-muted-foreground italic">
        {prompt}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.intent}
            onClick={() => onAction?.(action)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 font-[family-name:var(--font-dm-sans)] text-xs text-foreground transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [x] **Step 4: Write SessionDivider component**

```tsx
// src/components/home/SessionDivider.tsx
interface SessionDividerProps {
  date: string;
}

export function SessionDivider({ date }: SessionDividerProps) {
  const formatted = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex items-center gap-3 py-4">
      <div className="h-px flex-1 bg-border/50" />
      <span className="font-[family-name:var(--font-dm-sans)] text-xs text-muted-foreground">
        {formatted}
      </span>
      <div className="h-px flex-1 bg-border/50" />
    </div>
  );
}
```

- [x] **Step 5: Write ContentBlockRenderer component**

```tsx
// src/components/home/ContentBlockRenderer.tsx
'use client';

import Link from 'next/link';
import { ActionAffordance } from './ActionAffordance';
import type { ContentBlock, ActionOption } from '@/types/neptune-conversation';

interface ContentBlockRendererProps {
  block: ContentBlock;
  onAction?: (action: ActionOption) => void;
}

const MODULE_ROUTES: Record<string, string> = {
  crm: '/crm',
  finance: '/finance-hq',
  marketing: '/marketing',
  agents: '/agents',
  settings: '/settings',
  knowledge: '/knowledge',
};

export function ContentBlockRenderer({ block, onAction }: ContentBlockRendererProps) {
  switch (block.type) {
    case 'text':
      return (
        <p className="font-[family-name:var(--font-dm-sans)] text-sm leading-relaxed text-foreground">
          {block.content}
        </p>
      );

    case 'visual':
      // Phase 2 will replace this with InlineVisual component
      return (
        <div
          data-chart-type={block.spec.chartType}
          className="my-2 rounded-lg border border-border/50 bg-card/50 p-4"
        >
          <span className="font-[family-name:var(--font-dm-sans)] text-xs text-muted-foreground">
            {block.spec.title ?? `${block.spec.chartType} visualization`}
          </span>
        </div>
      );

    case 'action-affordance':
      return (
        <ActionAffordance
          prompt={block.prompt}
          actions={block.actions}
          onAction={onAction}
        />
      );

    case 'module-link':
      return (
        <Link
          href={MODULE_ROUTES[block.module] ?? `/${block.module}`}
          className="inline-flex items-center gap-1 font-[family-name:var(--font-dm-sans)] text-sm text-accent-foreground underline decoration-accent-foreground/30 underline-offset-2 transition-colors duration-[var(--duration-fast)] hover:decoration-accent-foreground"
        >
          {block.label}
        </Link>
      );
  }
}
```

- [x] **Step 6: Run tests**

Run: `npx vitest run tests/components/home/ContentBlockRenderer.test.tsx`
Expected: PASS

- [x] **Step 7: Commit**

```bash
git add src/components/home/ContentBlockRenderer.tsx src/components/home/ActionAffordance.tsx src/components/home/SessionDivider.tsx tests/components/home/ContentBlockRenderer.test.tsx
git commit -m "feat(home): add content block renderer with action affordances"
```

---

### Task 8: ConversationInput + AmbientPulse

**Files:**
- Create: `src/components/home/ConversationInput.tsx`
- Create: `src/components/home/AmbientPulse.tsx`
- Test: `tests/components/home/ConversationInput.test.tsx`

The persistent input field at the bottom of the conversational surface with the ambient luminous pulse.

- [x] **Step 1: Write the failing test**

```tsx
// tests/components/home/ConversationInput.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationInput } from '@/components/home/ConversationInput';

describe('ConversationInput', () => {
  it('renders input with placeholder', () => {
    render(<ConversationInput onSubmit={vi.fn()} />);
    expect(screen.getByPlaceholderText('Talk to Neptune...')).toBeInTheDocument();
  });

  it('calls onSubmit with trimmed message on form submit', () => {
    const onSubmit = vi.fn();
    render(<ConversationInput onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText('Talk to Neptune...');
    fireEvent.change(input, { target: { value: '  How did last week go?  ' } });
    fireEvent.submit(input.closest('form')!);

    expect(onSubmit).toHaveBeenCalledWith('How did last week go?');
  });

  it('does not submit empty messages', () => {
    const onSubmit = vi.fn();
    render(<ConversationInput onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText('Talk to Neptune...');
    fireEvent.submit(input.closest('form')!);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears input after submit', () => {
    const onSubmit = vi.fn();
    render(<ConversationInput onSubmit={onSubmit} />);

    const input = screen.getByPlaceholderText('Talk to Neptune...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(input.closest('form')!);

    expect(input.value).toBe('');
  });

  it('disables input when loading', () => {
    render(<ConversationInput onSubmit={vi.fn()} isLoading />);
    const input = screen.getByPlaceholderText('Talk to Neptune...');
    expect(input).toBeDisabled();
  });

  it('renders ambient pulse', () => {
    const { container } = render(<ConversationInput onSubmit={vi.fn()} />);
    expect(container.querySelector('[data-ambient-pulse]')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/home/ConversationInput.test.tsx`
Expected: FAIL — module not found

- [x] **Step 3: Write AmbientPulse component**

```tsx
// src/components/home/AmbientPulse.tsx
'use client';

import { motion } from 'framer-motion';

interface AmbientPulseProps {
  isActive?: boolean;
}

export function AmbientPulse({ isActive = true }: AmbientPulseProps) {
  if (!isActive) return null;

  return (
    <motion.div
      data-ambient-pulse
      className="pointer-events-none absolute -left-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full"
      style={{
        background: 'var(--accent-cyan)',
        boxShadow: '0 0 8px var(--accent-cyan-soft)',
      }}
      animate={{
        opacity: [0.4, 0.8, 0.4],
        scale: [0.9, 1.1, 0.9],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
```

- [x] **Step 4: Write ConversationInput component**

```tsx
// src/components/home/ConversationInput.tsx
'use client';

import { useState, useCallback } from 'react';
import { AmbientPulse } from './AmbientPulse';

interface ConversationInputProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
}

export function ConversationInput({ onSubmit, isLoading }: ConversationInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;
      onSubmit(trimmed);
      setValue('');
    },
    [value, onSubmit],
  );

  return (
    <div className="glass-surface fixed bottom-0 left-0 right-0 z-30 px-6 py-4">
      <form onSubmit={handleSubmit} className="relative mx-auto max-w-2xl">
        <AmbientPulse isActive={!isLoading} />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={isLoading}
          placeholder="Talk to Neptune..."
          className="glass-input w-full rounded-xl px-5 py-3 pl-6 font-[family-name:var(--font-dm-sans)] text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
        />
      </form>
    </div>
  );
}
```

- [x] **Step 5: Run tests**

Run: `npx vitest run tests/components/home/ConversationInput.test.tsx`
Expected: PASS

- [x] **Step 6: Commit**

```bash
git add src/components/home/ConversationInput.tsx src/components/home/AmbientPulse.tsx tests/components/home/ConversationInput.test.tsx
git commit -m "feat(home): add conversation input with ambient pulse"
```

---

## Phase 2: Conversational Surface Assembly (Tasks 9–11)

**Ship gate:** Full conversational Home surface working end-to-end. User arrives, Neptune's opening streams in, user can respond, Neptune replies. Feature flag controls which UI shows (card vs. conversation).

---

### Task 9: ConversationMessage Component

**Files:**
- Create: `src/components/home/ConversationMessage.tsx`
- Test: `tests/components/home/ConversationMessage.test.tsx`

Renders a single message (neptune or user) as a series of content blocks.

- [x] **Step 1: Write the failing test**

```tsx
// tests/components/home/ConversationMessage.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConversationMessage } from '@/components/home/ConversationMessage';
import type { ConversationMessage as MessageType } from '@/types/neptune-conversation';

describe('ConversationMessage', () => {
  it('renders neptune message with text blocks', () => {
    const message: MessageType = {
      id: 'msg-1',
      sessionId: 'sess-1',
      timestamp: new Date().toISOString(),
      role: 'neptune',
      blocks: [
        { type: 'text', content: 'Morning. Alex closed Henderson.' },
        { type: 'text', content: 'One thing needs your attention.' },
      ],
    };
    render(<ConversationMessage message={message} />);
    expect(screen.getByText('Morning. Alex closed Henderson.')).toBeInTheDocument();
    expect(screen.getByText('One thing needs your attention.')).toBeInTheDocument();
  });

  it('renders user message as plain text', () => {
    const message: MessageType = {
      id: 'msg-2',
      sessionId: 'sess-1',
      timestamp: new Date().toISOString(),
      role: 'user',
      blocks: [{ type: 'text', content: 'How did last week compare?' }],
    };
    render(<ConversationMessage message={message} />);
    expect(screen.getByText('How did last week compare?')).toBeInTheDocument();
  });

  it('applies different styling for neptune vs user messages', () => {
    const neptuneMsg: MessageType = {
      id: 'msg-1', sessionId: 's1', timestamp: '', role: 'neptune',
      blocks: [{ type: 'text', content: 'Hello' }],
    };
    const userMsg: MessageType = {
      id: 'msg-2', sessionId: 's1', timestamp: '', role: 'user',
      blocks: [{ type: 'text', content: 'Hi' }],
    };

    const { rerender, container } = render(<ConversationMessage message={neptuneMsg} />);
    const neptuneEl = container.firstChild as HTMLElement;
    expect(neptuneEl.getAttribute('data-role')).toBe('neptune');

    rerender(<ConversationMessage message={userMsg} />);
    const userEl = container.firstChild as HTMLElement;
    expect(userEl.getAttribute('data-role')).toBe('user');
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/home/ConversationMessage.test.tsx`
Expected: FAIL — module not found

- [x] **Step 3: Write ConversationMessage component**

```tsx
// src/components/home/ConversationMessage.tsx
'use client';

import { motion } from 'framer-motion';
import { ContentBlockRenderer } from './ContentBlockRenderer';
import type {
  ConversationMessage as MessageType,
  ActionOption,
} from '@/types/neptune-conversation';

interface ConversationMessageProps {
  message: MessageType;
  onAction?: (action: ActionOption) => void;
}

export function ConversationMessage({ message, onAction }: ConversationMessageProps) {
  const isNeptune = message.role === 'neptune';

  return (
    <motion.div
      data-role={message.role}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.2, 0, 0, 1], // var(--ease-standard)
      }}
      className={
        isNeptune
          ? 'space-y-2'
          : 'ml-auto max-w-[80%] rounded-xl bg-card px-4 py-2.5'
      }
    >
      {message.blocks.map((block, i) => (
        <ContentBlockRenderer
          key={`${message.id}-block-${i}`}
          block={block}
          onAction={onAction}
        />
      ))}
    </motion.div>
  );
}
```

- [x] **Step 4: Run tests**

Run: `npx vitest run tests/components/home/ConversationMessage.test.tsx`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/components/home/ConversationMessage.tsx tests/components/home/ConversationMessage.test.tsx
git commit -m "feat(home): add conversation message component"
```

---

### Task 10: NeptuneConversation — Main Surface

**Files:**
- Create: `src/components/home/NeptuneConversation.tsx`
- Create: `src/components/home/MicroFeedback.tsx`
- Test: `tests/components/home/NeptuneConversation.test.tsx`

The main conversational surface that replaces NeptuneFeed. Manages SSE connection, message list, and user input.

- [x] **Step 1: Write the failing test**

```tsx
// tests/components/home/NeptuneConversation.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { NeptuneConversation } from '@/components/home/NeptuneConversation';

// Mock fetch for SSE
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('NeptuneConversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the conversation container', () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: null,
    });

    const { container } = render(<NeptuneConversation />);
    expect(container.querySelector('[data-neptune-conversation]')).toBeInTheDocument();
  });

  it('renders the input field', () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: null,
    });

    render(<NeptuneConversation />);
    expect(screen.getByPlaceholderText('Talk to Neptune...')).toBeInTheDocument();
  });

  it('shows fallback message on fetch error', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    render(<NeptuneConversation />);

    await waitFor(() => {
      expect(screen.getByText(/trouble pulling everything together/i)).toBeInTheDocument();
    });
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/home/NeptuneConversation.test.tsx`
Expected: FAIL — module not found

- [x] **Step 3: Write MicroFeedback component**

```tsx
// src/components/home/MicroFeedback.tsx
'use client';

import { useState } from 'react';

interface MicroFeedbackProps {
  messageId: string;
  onFeedback?: (messageId: string, signal: 'more' | 'less') => void;
}

export function MicroFeedback({ messageId, onFeedback }: MicroFeedbackProps) {
  const [given, setGiven] = useState<'more' | 'less' | null>(null);

  if (given) return null;

  return (
    <div className="group/feedback mt-1 flex items-center gap-1 opacity-0 transition-opacity duration-[var(--duration-fast)] group-hover/message:opacity-100">
      <button
        onClick={() => { setGiven('more'); onFeedback?.(messageId, 'more'); }}
        className="rounded px-1.5 py-0.5 font-[family-name:var(--font-dm-sans)] text-[10px] text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        aria-label="More like this"
      >
        more like this
      </button>
      <span className="text-border">·</span>
      <button
        onClick={() => { setGiven('less'); onFeedback?.(messageId, 'less'); }}
        className="rounded px-1.5 py-0.5 font-[family-name:var(--font-dm-sans)] text-[10px] text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        aria-label="Less like this"
      >
        less like this
      </button>
    </div>
  );
}
```

- [x] **Step 4: Write NeptuneConversation component**

```tsx
// src/components/home/NeptuneConversation.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ConversationMessage } from './ConversationMessage';
import { ConversationInput } from './ConversationInput';
import { MicroFeedback } from './MicroFeedback';
import { SessionDivider } from './SessionDivider';
import type {
  ConversationMessage as MessageType,
  ConversationSession,
  StreamEvent,
  ActionOption,
} from '@/types/neptune-conversation';

export function NeptuneConversation() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [session, setSession] = useState<ConversationSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize: fetch Neptune's opening
  useEffect(() => {
    initConversation();
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function initConversation() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/home/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) throw new Error('Failed to init conversation');
      if (!response.body) return;

      await processStream(response.body);
    } catch {
      setError(
        "Give me a moment — I'm having trouble pulling everything together. You can ask me anything in the meantime, or head to any module directly.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function processStream(body: ReadableStream<Uint8Array>) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event: StreamEvent = JSON.parse(line.slice(6));
          handleStreamEvent(event);
        } catch {
          // Skip malformed events
        }
      }
    }
  }

  function handleStreamEvent(event: StreamEvent) {
    switch (event.type) {
      case 'session':
        setSession(event.session);
        break;
      case 'message-complete':
        setMessages((prev) => [...prev, event.message]);
        break;
      case 'error':
        setError(event.message);
        break;
    }
  }

  const handleSend = useCallback(
    async (message: string) => {
      if (!session) return;

      // Add user message optimistically
      const userMsg: MessageType = {
        id: crypto.randomUUID(),
        sessionId: session.id,
        timestamp: new Date().toISOString(),
        role: 'user',
        blocks: [{ type: 'text', content: message }],
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/home/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: session.id,
            message,
          }),
        });

        if (!response.ok) throw new Error('Failed to send message');
        if (!response.body) return;

        await processStream(response.body);
      } catch {
        setError("Something went wrong. Try again or head to any module directly.");
      } finally {
        setIsLoading(false);
      }
    },
    [session],
  );

  const handleAction = useCallback(
    (action: ActionOption) => {
      // Action intents that navigate to modules
      if (action.intent.startsWith('view_') || action.intent.startsWith('open_')) {
        // Let the user's message handler deal with it
        handleSend(action.label);
        return;
      }
      // Otherwise send as a message
      handleSend(action.label);
    },
    [handleSend],
  );

  return (
    <div data-neptune-conversation className="flex h-full flex-col">
      {/* Conversation thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 pb-32 pt-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <div key={msg.id} className="group/message">
                <ConversationMessage message={msg} onAction={handleAction} />
                {msg.role === 'neptune' && (
                  <MicroFeedback messageId={msg.id} />
                )}
              </div>
            ))}
          </AnimatePresence>

          {/* Error fallback */}
          {error && (
            <p className="font-[family-name:var(--font-dm-sans)] text-sm text-muted-foreground italic">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Input */}
      <ConversationInput onSubmit={handleSend} isLoading={isLoading} />
    </div>
  );
}
```

- [x] **Step 5: Run tests**

Run: `npx vitest run tests/components/home/NeptuneConversation.test.tsx`
Expected: PASS

- [x] **Step 6: Commit**

```bash
git add src/components/home/NeptuneConversation.tsx src/components/home/MicroFeedback.tsx tests/components/home/NeptuneConversation.test.tsx
git commit -m "feat(home): add NeptuneConversation main surface with SSE streaming"
```

---

### Task 11: Wire Up HomePage + Feature Flag

**Files:**
- Modify: `src/components/home/HomePage.tsx`
- Modify: `src/components/home/index.ts`
- Modify: `src/app/(app)/dashboard/page.tsx`

Connect the conversational surface to the page. Use a feature flag (`NEXT_PUBLIC_HOME_CONVERSATIONAL`) to toggle between card and conversation UI.

- [x] **Step 1: Update HomePage.tsx**

```tsx
// src/components/home/HomePage.tsx
'use client';

import { NeptuneFeed } from './NeptuneFeed';
import { NeptuneConversation } from './NeptuneConversation';
import type { HomeFeedResponse } from '@/types/home-feed';

interface HomePageProps {
  initialData: HomeFeedResponse;
  useConversational?: boolean;
}

export function HomePage({ initialData, useConversational }: HomePageProps) {
  if (useConversational) {
    return (
      <div className="h-full">
        <NeptuneConversation />
      </div>
    );
  }

  return (
    <div className="h-full">
      <NeptuneFeed
        greeting={initialData.greeting}
        cards={initialData.cards}
        isNewUser={initialData.isNewUser}
      />
    </div>
  );
}
```

- [x] **Step 2: Update index.ts barrel exports**

```typescript
// src/components/home/index.ts
export { HomePage } from './HomePage';
export { NeptuneFeed } from './NeptuneFeed';
export { NeptuneConversation } from './NeptuneConversation';
export { ConversationMessage } from './ConversationMessage';
export { ContentBlockRenderer } from './ContentBlockRenderer';
export { ConversationInput } from './ConversationInput';
export { AmbientPulse } from './AmbientPulse';
export { ActionAffordance } from './ActionAffordance';
export { MicroFeedback } from './MicroFeedback';
export { SessionDivider } from './SessionDivider';

/** @deprecated Use NeptuneConversation instead */
export { NeptuneFeedCard } from './NeptuneFeedCard';
/** @deprecated Use NeptuneConversation instead */
export { SmartChipBar } from './SmartChipBar';
/** @deprecated Use NeptuneConversation instead */
export { SlidePanel } from './SlidePanel';
```

- [x] **Step 3: Update dashboard page.tsx to pass feature flag**

```typescript
// In src/app/(app)/dashboard/page.tsx, add after initialData construction:
const useConversational = process.env.NEXT_PUBLIC_HOME_CONVERSATIONAL === 'true';

// Update the return:
return (
  <ErrorBoundary>
    <HomePage initialData={initialData} useConversational={useConversational} />
  </ErrorBoundary>
);
```

- [x] **Step 4: Add env var to .env.example**

Add to `.env.example`:
```
# Feature Flags
NEXT_PUBLIC_HOME_CONVERSATIONAL=false  # Enable conversational Home (Neptune's Office)
```

- [x] **Step 5: Run typecheck**

Run: `npm run typecheck`
Expected: PASS — no type errors

- [x] **Step 6: Run all home tests**

Run: `npx vitest run tests/api/home-feed.test.ts tests/api/home-conversation.test.ts tests/components/home/`
Expected: PASS — all existing + new tests pass

- [x] **Step 7: Commit**

```bash
git add src/components/home/HomePage.tsx src/components/home/index.ts src/app/\(app\)/dashboard/page.tsx .env.example
git commit -m "feat(home): wire conversational surface with feature flag"
```

---

## Phase 3: Inline Visuals (Tasks 12–13)

**Ship gate:** Neptune can render inline charts and metrics within conversation messages. Visual blocks display real data visualizations.

---

### Task 12: InlineVisual Component

**Files:**
- Create: `src/components/home/InlineVisual.tsx`
- Modify: `src/components/home/ContentBlockRenderer.tsx`
- Test: `tests/components/home/InlineVisual.test.tsx`

Renders `VisualSpec` as interactive Recharts visualizations inline in the conversation.

- [x] **Step 1: Write the failing test**

```tsx
// tests/components/home/InlineVisual.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InlineVisual } from '@/components/home/InlineVisual';
import type { VisualSpec } from '@/types/neptune-conversation';

describe('InlineVisual', () => {
  it('renders metric visualization', () => {
    const spec: VisualSpec = {
      chartType: 'metric',
      data: { value: 4200, label: 'Revenue', prefix: '$' },
      interactive: false,
    };
    render(<InlineVisual spec={spec} />);
    expect(screen.getByText('$4,200')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('renders trend visualization with direction', () => {
    const spec: VisualSpec = {
      chartType: 'trend',
      data: { value: 15, label: 'Open Rate', suffix: '%', direction: 'up' },
      interactive: false,
    };
    render(<InlineVisual spec={spec} />);
    expect(screen.getByText('15%')).toBeInTheDocument();
  });

  it('renders chart container for line/bar types', () => {
    const spec: VisualSpec = {
      chartType: 'line',
      data: {
        points: [
          { label: 'Mon', value: 100 },
          { label: 'Tue', value: 150 },
          { label: 'Wed', value: 130 },
        ],
      },
      interactive: true,
      title: 'Weekly Revenue',
    };
    const { container } = render(<InlineVisual spec={spec} />);
    expect(container.querySelector('[data-chart-type="line"]')).toBeInTheDocument();
    expect(screen.getByText('Weekly Revenue')).toBeInTheDocument();
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/components/home/InlineVisual.test.tsx`
Expected: FAIL — module not found

- [x] **Step 3: Write InlineVisual component**

```tsx
// src/components/home/InlineVisual.tsx
'use client';

import dynamic from 'next/dynamic';
import type { VisualSpec } from '@/types/neptune-conversation';

// Lazy load Recharts to keep bundle small
const LazyLineChart = dynamic(
  () => import('recharts').then((m) => ({ default: m.LineChart })),
  { ssr: false },
);
const LazyBarChart = dynamic(
  () => import('recharts').then((m) => ({ default: m.BarChart })),
  { ssr: false },
);
const LazyLine = dynamic(
  () => import('recharts').then((m) => ({ default: m.Line })),
  { ssr: false },
);
const LazyBar = dynamic(
  () => import('recharts').then((m) => ({ default: m.Bar })),
  { ssr: false },
);
const LazyXAxis = dynamic(
  () => import('recharts').then((m) => ({ default: m.XAxis })),
  { ssr: false },
);
const LazyYAxis = dynamic(
  () => import('recharts').then((m) => ({ default: m.YAxis })),
  { ssr: false },
);
const LazyTooltip = dynamic(
  () => import('recharts').then((m) => ({ default: m.Tooltip })),
  { ssr: false },
);
const LazyResponsiveContainer = dynamic(
  () => import('recharts').then((m) => ({ default: m.ResponsiveContainer })),
  { ssr: false },
);

interface InlineVisualProps {
  spec: VisualSpec;
}

function formatNumber(value: number, prefix?: string, suffix?: string): string {
  const formatted = value >= 1000 ? value.toLocaleString() : String(value);
  return `${prefix ?? ''}${formatted}${suffix ?? ''}`;
}

export function InlineVisual({ spec }: InlineVisualProps) {
  const { chartType, data, title } = spec;

  switch (chartType) {
    case 'metric':
      return (
        <div
          data-chart-type="metric"
          className="my-2 inline-flex items-baseline gap-2"
        >
          <span className="font-[family-name:var(--font-space-grotesk)] text-2xl font-semibold text-foreground">
            {formatNumber(
              data.value as number,
              data.prefix as string | undefined,
              data.suffix as string | undefined,
            )}
          </span>
          {data.label && (
            <span className="font-[family-name:var(--font-dm-sans)] text-xs text-muted-foreground">
              {data.label as string}
            </span>
          )}
        </div>
      );

    case 'trend':
      return (
        <div
          data-chart-type="trend"
          className="my-2 inline-flex items-center gap-2"
        >
          <span className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-foreground">
            {formatNumber(
              data.value as number,
              data.prefix as string | undefined,
              data.suffix as string | undefined,
            )}
          </span>
          {data.direction && (
            <span
              className="text-xs"
              style={{
                color: data.direction === 'up'
                  ? 'var(--status-success)'
                  : 'var(--status-error)',
              }}
            >
              {data.direction === 'up' ? '↑' : '↓'}
            </span>
          )}
          {data.label && (
            <span className="font-[family-name:var(--font-dm-sans)] text-xs text-muted-foreground">
              {data.label as string}
            </span>
          )}
        </div>
      );

    case 'line':
    case 'bar': {
      const points = (data.points as Array<{ label: string; value: number }>) ?? [];
      const ChartComponent = chartType === 'line' ? LazyLineChart : LazyBarChart;
      const DataComponent = chartType === 'line' ? LazyLine : LazyBar;

      return (
        <div data-chart-type={chartType} className="my-3 rounded-lg border border-border/50 bg-card/50 p-3">
          {title && (
            <p className="mb-2 font-[family-name:var(--font-dm-sans)] text-xs font-medium text-muted-foreground">
              {title}
            </p>
          )}
          <LazyResponsiveContainer width="100%" height={120}>
            <ChartComponent data={points}>
              <LazyXAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <LazyYAxis hide />
              <LazyTooltip
                contentStyle={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <DataComponent
                dataKey="value"
                stroke="var(--accent-cyan)"
                fill="var(--accent-cyan-soft)"
                strokeWidth={2}
                {...(chartType === 'line' ? { dot: false } : {})}
              />
            </ChartComponent>
          </LazyResponsiveContainer>
        </div>
      );
    }

    case 'comparison':
      // Rendered as side-by-side metrics for v1
      return (
        <div data-chart-type="comparison" className="my-2 flex gap-6">
          {Object.entries(data).map(([key, val]) => (
            <div key={key} className="flex flex-col">
              <span className="font-[family-name:var(--font-space-grotesk)] text-lg font-semibold text-foreground">
                {typeof val === 'number' ? val.toLocaleString() : String(val)}
              </span>
              <span className="font-[family-name:var(--font-dm-sans)] text-xs text-muted-foreground">
                {key}
              </span>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}
```

- [x] **Step 4: Update ContentBlockRenderer to use InlineVisual**

In `src/components/home/ContentBlockRenderer.tsx`, replace the visual case:

```tsx
// Replace the 'visual' case in ContentBlockRenderer:
case 'visual':
  return <InlineVisual spec={block.spec} />;
```

Add the import at top:
```tsx
import { InlineVisual } from './InlineVisual';
```

- [x] **Step 5: Run tests**

Run: `npx vitest run tests/components/home/InlineVisual.test.tsx tests/components/home/ContentBlockRenderer.test.tsx`
Expected: PASS

- [x] **Step 6: Commit**

```bash
git add src/components/home/InlineVisual.tsx src/components/home/ContentBlockRenderer.tsx tests/components/home/InlineVisual.test.tsx
git commit -m "feat(home): add inline visual component with Recharts"
```

---

### Task 13: Conversation History Endpoint

**Files:**
- Create: `src/app/api/home/conversation/history/route.ts`
- Test: `tests/api/home-conversation-history.test.ts`

GET endpoint for retrieving past conversation sessions and messages with cursor-based pagination.

- [x] **Step 1: Write the failing test**

```typescript
// tests/api/home-conversation-history.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/home/conversation/history/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getCurrentWorkspace: vi.fn(() =>
    Promise.resolve({ workspaceId: 'ws-1', userId: 'user-1', user: { firstName: 'Alex' } }),
  ),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => Promise.resolve({ success: true, limit: 100, remaining: 99, reset: 0 })),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('GET /api/home/conversation/history', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('returns conversation history', async () => {
    const request = new NextRequest('http://localhost:3000/api/home/conversation/history');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('sessions');
    expect(data).toHaveProperty('messages');
    expect(data).toHaveProperty('hasMore');
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/api/home-conversation-history.test.ts`
Expected: FAIL — module not found

- [x] **Step 3: Write the history endpoint**

```typescript
// src/app/api/home/conversation/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { neptuneConversations, neptuneMessages } from '@/db/schema';
import { eq, and, desc, lt, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    const { success } = await rateLimit(userId, 30, 60);
    if (!success) {
      return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
    }

    const cursor = request.nextUrl.searchParams.get('cursor');

    // Fetch recent home conversations
    const whereClause = cursor
      ? and(
          eq(neptuneConversations.workspaceId, workspaceId),
          eq(neptuneConversations.userId, userId),
          eq(neptuneConversations.topic, 'home'),
          lt(neptuneConversations.createdAt, new Date(cursor)),
        )
      : and(
          eq(neptuneConversations.workspaceId, workspaceId),
          eq(neptuneConversations.userId, userId),
          eq(neptuneConversations.topic, 'home'),
        );

    const sessions = await db
      .select()
      .from(neptuneConversations)
      .where(whereClause)
      .orderBy(desc(neptuneConversations.createdAt))
      .limit(PAGE_SIZE + 1);

    const hasMore = sessions.length > PAGE_SIZE;
    const returnedSessions = sessions.slice(0, PAGE_SIZE);

    // Fetch messages for these sessions
    const sessionIds = returnedSessions.map((s) => s.id);
    let messages: Array<{
      id: string;
      conversationId: string;
      role: string;
      content: string;
      createdAt: Date;
    }> = [];

    if (sessionIds.length > 0) {
      messages = await db
        .select({
          id: neptuneMessages.id,
          conversationId: neptuneMessages.conversationId,
          role: neptuneMessages.role,
          content: neptuneMessages.content,
          createdAt: neptuneMessages.createdAt,
        })
        .from(neptuneMessages)
        .where(
          and(
            eq(neptuneMessages.workspaceId, workspaceId),
            inArray(neptuneMessages.conversationId, sessionIds),
          ),
        )
        .orderBy(neptuneMessages.createdAt);
    }

    return NextResponse.json({
      sessions: returnedSessions.map((s) => ({
        id: s.id,
        conversationId: s.id,
        startedAt: s.createdAt.toISOString(),
        lastActiveAt: s.lastActiveAt.toISOString(),
      })),
      // v1: History replays as text-only. Visual/action blocks from
      // the original response are not persisted in structured form.
      // The role mapping 'assistant' -> 'neptune' bridges the DB schema
      // (which uses 'assistant') with the frontend type (which uses 'neptune').
      messages: messages.map((m) => ({
        id: m.id,
        sessionId: m.conversationId,
        timestamp: m.createdAt.toISOString(),
        role: m.role === 'assistant' ? 'neptune' as const : 'user' as const,
        blocks: [{ type: 'text' as const, content: m.content }],
      })),
      hasMore,
      cursor: hasMore
        ? returnedSessions[returnedSessions.length - 1]?.createdAt.toISOString()
        : undefined,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    logger.error('Conversation history error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

- [x] **Step 4: Run tests**

Run: `npx vitest run tests/api/home-conversation-history.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/app/api/home/conversation/history/route.ts tests/api/home-conversation-history.test.ts
git commit -m "feat(home): add conversation history endpoint with pagination"
```

---

## Phase 4: Ambient Environment & Polish (Tasks 14–16)

**Ship gate:** The Home screen has atmospheric presence — ambient pulse, time-of-day color shifts, smooth streaming text animation. Feels like entering Neptune's space, not loading a page.

---

### Task 14: Ambient Environment Styling

**Files:**
- Modify: `src/app/globals.css` — add ambient state CSS variables
- Modify: `src/components/home/NeptuneConversation.tsx` — apply ambient background

- [ ] **Step 1: Add ambient CSS variables to globals.css**

Add to `@layer base` in `globals.css` (dark theme section):

```css
/* Neptune Ambient States */
--ambient-base-hue: 180;       /* Teal-based default */
--ambient-warm-hue: 35;        /* Warm shift for healthy state */
--ambient-cool-hue: 220;       /* Cool shift for attention needed */
--ambient-glow-opacity: 0.03;
--ambient-glow-radius: 40%;

/* Time-of-day modifiers */
--ambient-morning-warmth: 0.1;
--ambient-evening-softness: 0.15;
```

Add matching light theme values in `:root`.

- [ ] **Step 2: Add ambient background utility class**

Add to `@layer components` in `globals.css`:

```css
.neptune-ambient {
  position: relative;
  background: var(--background);
  transition: background var(--duration-smooth) var(--ease-standard);
}

.neptune-ambient::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse var(--ambient-glow-radius) var(--ambient-glow-radius) at 50% 80%,
    hsla(var(--ambient-base-hue), 40%, 50%, var(--ambient-glow-opacity)),
    transparent
  );
  pointer-events: none;
  transition: all 1s var(--ease-standard);
}
```

- [ ] **Step 3: Apply ambient class to NeptuneConversation**

In `NeptuneConversation.tsx`, update the outer div:

```tsx
<div data-neptune-conversation className="neptune-ambient flex h-full flex-col">
```

- [ ] **Step 4: Run typecheck and visual verification**

Run: `npm run typecheck`
Expected: PASS

Note: Visual verification requires running `npm run dev` with `NEXT_PUBLIC_HOME_CONVERSATIONAL=true` and checking the Home page.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/components/home/NeptuneConversation.tsx
git commit -m "feat(home): add ambient environment styling with radial glow"
```

---

### Task 15: Streaming Text Animation

**Files:**
- Modify: `src/components/home/NeptuneConversation.tsx` — progressive text streaming
- Modify: `src/app/api/home/conversation/route.ts` — stream tokens individually

Currently Neptune's response appears all at once. This task adds progressive text rendering — tokens appear as they generate, creating the feeling of Neptune *composing a thought*.

- [ ] **Step 1: Update the API endpoint to stream text tokens**

In `src/app/api/home/conversation/route.ts`, replace the non-streaming OpenAI call with a streaming one:

```typescript
// Replace the openai.chat.completions.create block with:
const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [
    { role: 'system', content: prompt },
    ...(userMessage ? [{ role: 'user' as const, content: userMessage }] : []),
  ],
  temperature: 0.7,
  max_tokens: 1000,
  stream: true,
});

let fullText = '';
send({ type: 'block-start', blockType: 'text', index: 0 });

for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content ?? '';
  if (delta) {
    fullText += delta;
    send({ type: 'text-delta', content: delta });
  }
}

const blocks = parseNarrativeResponse(fullText);

for (let i = 0; i < blocks.length; i++) {
  send({ type: 'block-complete', block: blocks[i], index: i });
}
```

- [ ] **Step 2: Update NeptuneConversation to handle streaming text**

Add state for streaming text and update `handleStreamEvent`:

```typescript
const [streamingText, setStreamingText] = useState('');

// In handleStreamEvent:
case 'text-delta':
  setStreamingText((prev) => prev + event.content);
  break;
case 'message-complete':
  setStreamingText('');
  setMessages((prev) => [...prev, event.message]);
  break;
```

Render streaming text below messages:

```tsx
{/* Streaming text (in progress) */}
{streamingText && (
  <div className="space-y-2">
    <p className="font-[family-name:var(--font-dm-sans)] text-sm leading-relaxed text-foreground">
      {streamingText}
      <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-accent-foreground/50" />
    </p>
  </div>
)}
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/api/home-conversation.test.ts tests/components/home/NeptuneConversation.test.tsx`
Expected: PASS (tests use mocked fetch, not real streaming)

- [ ] **Step 4: Commit**

```bash
git add src/app/api/home/conversation/route.ts src/components/home/NeptuneConversation.tsx
git commit -m "feat(home): add streaming text animation for Neptune responses"
```

---

### Task 16: Enhanced Command Palette

**Files:**
- Modify: `src/components/shared/CommandPalette.tsx`

Extend the existing command palette with conversation-specific actions per spec Section 10.

- [ ] **Step 1: Add recent Neptune actions to CommandPalette**

In `src/components/shared/CommandPalette.tsx`, add a "Neptune" group with:
- "New conversation with Neptune" → navigates to `/dashboard`
- "Recent Neptune actions" → last 5 Neptune-executed actions from localStorage

```tsx
// Add to CommandPalette's command groups:
<CommandGroup heading="Neptune">
  <CommandItem
    onSelect={() => {
      router.push('/dashboard');
      setOpen(false);
    }}
  >
    <MessageSquare className="mr-2 h-4 w-4" />
    Talk to Neptune
  </CommandItem>
</CommandGroup>
```

- [ ] **Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/CommandPalette.tsx
git commit -m "feat(home): add Neptune actions to command palette"
```

---

## Phase 5: Behavioral Intelligence (Tasks 17–18)

**Ship gate:** Neptune records engagement signals and user preferences. Micro-feedback is functional. Foundation for learning engine is in place.

---

### Task 17: Behavioral Signal Collection

**Files:**
- Create: `src/lib/home/behavioral-signals.ts`
- Test: `tests/lib/home/behavioral-signals.test.ts`

Records behavioral signals per spec Section 6: scroll depth, response timing, topic engagement, visual interaction.

- [x] **Step 1: Write the failing test**

```typescript
// tests/lib/home/behavioral-signals.test.ts
import { describe, it, expect, vi } from 'vitest';
import {
  createSignalCollector,
  SignalType,
} from '@/lib/home/behavioral-signals';

describe('behavioral-signals', () => {
  it('creates a signal collector', () => {
    const collector = createSignalCollector('user-1', 'ws-1', 'sess-1');
    expect(collector).toBeDefined();
    expect(collector.record).toBeTypeOf('function');
    expect(collector.flush).toBeTypeOf('function');
  });

  it('records engagement signals', () => {
    const collector = createSignalCollector('user-1', 'ws-1', 'sess-1');
    collector.record({
      type: 'topic_engaged',
      messageId: 'msg-1',
      metadata: { topic: 'sales' },
    });
    expect(collector.pending()).toBe(1);
  });

  it('stores signals in localStorage on flush', async () => {
    const mockStorage: Record<string, string> = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => mockStorage[key] ?? null),
      setItem: vi.fn((key: string, val: string) => { mockStorage[key] = val; }),
    });

    const collector = createSignalCollector('user-1', 'ws-1', 'sess-1');
    collector.record({ type: 'topic_engaged', messageId: 'msg-1' });
    collector.record({ type: 'topic_ignored', messageId: 'msg-2' });

    await collector.flush();

    expect(collector.pending()).toBe(0);
    const stored = JSON.parse(mockStorage['neptune_signals'] ?? '[]');
    expect(stored).toHaveLength(2);
    expect(stored[0].type).toBe('topic_engaged');
    expect(stored[1].type).toBe('topic_ignored');
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/home/behavioral-signals.test.ts`
Expected: FAIL — module not found

- [x] **Step 3: Write the behavioral signals module**

```typescript
// src/lib/home/behavioral-signals.ts

export type SignalType =
  | 'topic_engaged'      // User responded to this topic
  | 'topic_ignored'      // User scrolled past without engaging
  | 'visual_expanded'    // User hovered/clicked an inline visual
  | 'visual_ignored'     // Visual was in viewport but not interacted with
  | 'response_time'      // Time between Neptune's message and user's reply
  | 'scroll_depth'       // How far user scrolled in conversation
  | 'micro_feedback'     // Explicit "more like this" / "less like this"
  | 'session_duration'   // Total session time
  | 'unprompted_nav';    // User navigated to a module without Neptune suggesting it

interface BehavioralSignal {
  type: SignalType;
  messageId?: string;
  metadata?: Record<string, unknown>;
  timestamp?: string;
}

interface StoredSignal extends BehavioralSignal {
  userId: string;
  workspaceId: string;
  sessionId: string;
  timestamp: string;
}

export function createSignalCollector(
  userId: string,
  workspaceId: string,
  sessionId: string,
) {
  const buffer: StoredSignal[] = [];

  return {
    record(signal: BehavioralSignal) {
      buffer.push({
        ...signal,
        userId,
        workspaceId,
        sessionId,
        timestamp: signal.timestamp ?? new Date().toISOString(),
      });
    },

    pending() {
      return buffer.length;
    },

    async flush() {
      if (buffer.length === 0) return;

      const signals = [...buffer];
      buffer.length = 0;

      // v1: Store signals in localStorage for future batch upload.
      // The /api/home/signals endpoint will be added when the learning
      // engine (v2) is ready to consume this data.
      try {
        const stored = JSON.parse(localStorage.getItem('neptune_signals') ?? '[]');
        stored.push(...signals);
        // Keep max 500 signals in local storage
        const trimmed = stored.slice(-500);
        localStorage.setItem('neptune_signals', JSON.stringify(trimmed));
      } catch {
        // Re-add to buffer on failure
        buffer.push(...signals);
      }
    },
  };
}
```

- [x] **Step 4: Run tests**

Run: `npx vitest run tests/lib/home/behavioral-signals.test.ts`
Expected: PASS

- [x] **Step 5: Commit**

```bash
git add src/lib/home/behavioral-signals.ts tests/lib/home/behavioral-signals.test.ts
git commit -m "feat(home): add behavioral signal collection for learning engine"
```

---

### Task 18: Wire Micro-Feedback + Signals into Conversation

**Files:**
- Modify: `src/components/home/NeptuneConversation.tsx`

Connect the MicroFeedback component and behavioral signal collector to the conversation surface.

- [x] **Step 1: Add signal collector to NeptuneConversation**

```tsx
// In NeptuneConversation.tsx, add:
import { createSignalCollector } from '@/lib/home/behavioral-signals';

// Inside component:
const signalCollector = useRef(
  createSignalCollector('', '', ''), // initialized with empty, updated when session arrives
);

// When session is set:
useEffect(() => {
  if (session) {
    // Re-create with actual IDs (userId comes from session context)
    signalCollector.current = createSignalCollector('current-user', 'current-workspace', session.id);
  }
}, [session]);

// Flush signals periodically
useEffect(() => {
  const interval = setInterval(() => {
    signalCollector.current.flush();
  }, 30_000); // Flush every 30s
  return () => clearInterval(interval);
}, []);

// Flush on unmount
useEffect(() => {
  return () => { signalCollector.current.flush(); };
}, []);
```

- [x] **Step 2: Wire micro-feedback handler**

```tsx
const handleFeedback = useCallback((messageId: string, signal: 'more' | 'less') => {
  signalCollector.current.record({
    type: 'micro_feedback',
    messageId,
    metadata: { signal },
  });
}, []);

// Update MicroFeedback rendering:
<MicroFeedback messageId={msg.id} onFeedback={handleFeedback} />
```

- [x] **Step 3: Run tests**

Run: `npx vitest run tests/components/home/NeptuneConversation.test.tsx`
Expected: PASS

- [x] **Step 4: Commit**

```bash
git add src/components/home/NeptuneConversation.tsx
git commit -m "feat(home): wire behavioral signals and micro-feedback"
```

---

## Phase 6: Migration & Cleanup (Tasks 19–20)

**Ship gate:** Old card-based components are deprecated with JSDoc markers. Feature flag is documented. All tests pass. Ready for production rollout behind the flag.

---

### Task 19: Deprecation Markers + Type Cleanup

**Files:**
- Modify: `src/types/home-feed.ts`
- Modify: `src/lib/validation/home-feed.ts`
- Modify: `src/lib/home/card-engine.ts`
- Modify: `src/lib/home/action-executor.ts`

- [ ] **Step 1: Add @deprecated JSDoc to old types**

In `src/types/home-feed.ts`, add to the top:

```typescript
/**
 * @deprecated These types support the card-based Home feed.
 * The conversational Home uses types from '@/types/neptune-conversation'.
 * These will be removed once NEXT_PUBLIC_HOME_CONVERSATIONAL is the default.
 */
```

- [ ] **Step 2: Add @deprecated to card-engine exports**

In `src/lib/home/card-engine.ts`:
- Add `@deprecated` to `generateFeedCards`
- Add `@deprecated` to card creator functions
- Keep `generateGreeting` without deprecation (still useful)

- [ ] **Step 3: Add @deprecated to validation schemas**

In `src/lib/validation/home-feed.ts`:

```typescript
/** @deprecated Use schemas from '@/lib/validation/neptune-conversation' */
```

- [ ] **Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/types/home-feed.ts src/lib/validation/home-feed.ts src/lib/home/card-engine.ts src/lib/home/action-executor.ts
git commit -m "chore(home): add deprecation markers to card-based feed types"
```

---

### Task 20: Full Test Suite + Final Verification

**Files:** All test files

- [ ] **Step 1: Run full test suite**

Run: `npm run test:run`
Expected: PASS — all existing + new tests pass

- [ ] **Step 2: Run linting**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: PASS — build succeeds with no errors

- [ ] **Step 5: Commit any fixes if needed**

If any step above required fixes:

```bash
git add -A
git commit -m "fix(home): resolve lint/type/test issues from conversational redesign"
```

---

## Summary

| Phase | Tasks | What Ships |
|-------|-------|-----------|
| **1: Foundation** | 1–8 | Types, schemas, workspace data, sessions, narrative builder, API endpoint, content blocks, input |
| **2: Assembly** | 9–11 | ConversationMessage, NeptuneConversation surface, feature flag wiring |
| **3: Inline Visuals** | 12–13 | InlineVisual with Recharts, conversation history endpoint |
| **4: Ambient & Polish** | 14–16 | Ambient CSS, streaming text animation, command palette |
| **5: Intelligence** | 17–18 | Behavioral signal collection, micro-feedback wiring |
| **6: Migration** | 19–20 | Deprecation markers, full verification |

**Total: 20 tasks, ~100 steps**

**What's NOT in this plan (future work):**
- Voice input/output (spec says "future modality")
- Cross-module Neptune presence (collapsed input in every module)
- Trust Arc voice calibration (requires significant LLM prompt engineering iteration)
- Push notifications on mobile (spec Section 11 — requires native app layer)
- Full semantic search in command palette (spec says "future enhancement")
- Behavioral learning engine (preference storage + prompt modification — needs the signal data to accumulate first)
- Conversation retention policy configuration (using "forever" for v1)
