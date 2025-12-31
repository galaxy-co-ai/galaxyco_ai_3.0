# GalaxyCo.ai 3.0 — Inventory / Appendix
Date: 2025-12-31 (Updated with line counts and bloat analysis)

## Key Frontend Files (High Signal)

### Dashboard
- `src/components/dashboard/DashboardV2Client.tsx`

### Neptune core (recommended canonical implementation)
- `src/contexts/neptune-context.tsx`
- `src/components/conversations/NeptuneAssistPanel.tsx`
- `src/lib/neptune/page-context.ts`
- `src/components/neptune/DynamicQuickActions.tsx`

### Neptune secondary surfaces (audit for removal/refactor)
- `src/app/(app)/assistant/page.tsx` — **1,387 lines** (DUPLICATE - has own SSE parsing)
- `src/components/shared/FloatingAIAssistant.tsx` — **702 lines** (BROKEN - expects JSON, gets SSE)
- `src/app/(app)/neptune-hq/page.tsx` — 120 lines (analytics view, may be useful)

### Agents / Orchestration
- `src/app/(app)/activity/page.tsx`
- `src/components/agents/MyAgentsDashboard.tsx`
- `src/app/(app)/orchestration/page.tsx`
- `src/app/(app)/orchestration/teams/page.tsx`
- `src/app/(app)/orchestration/workflows/page.tsx`
- `src/app/(app)/orchestration/approvals/page.tsx`
- `src/components/orchestration/*`

### Blog / Public content
- `src/app/blog/layout.tsx`
- `src/app/blog/page.tsx`
- `src/app/blog/[slug]/page.tsx`
- `src/app/blog/category/[slug]/page.tsx`
- `src/app/blog/learn/page.tsx`
- `src/app/blog/bookmarks/page.tsx`

### Auth + route protection
- `src/middleware.ts`
- `src/lib/auth.ts`

---

## Key Backend Endpoints

### Neptune / Assistant
- `POST /api/assistant/chat` (SSE streaming)
- `GET /api/assistant/conversations`
- `GET /api/assistant/conversations/[id]`
- `DELETE /api/assistant/conversations/[id]`
- `POST /api/assistant/upload`
- `POST /api/assistant/feedback`
- (Referenced in UI) `POST /api/assistant/voice/transcribe`
- (Referenced in UI) `POST /api/assistant/voice/speak`
- `GET|POST /api/neptune/conversation` (duplication risk)

### Orchestration
- `POST /api/orchestration/route`
- `POST /api/orchestration/delegate`
- `/api/orchestration/teams` (GET/POST)
- `/api/orchestration/teams/[id]` (GET/PATCH/DELETE)
- `/api/orchestration/teams/[id]/members` (GET/POST/DELETE)
- `/api/orchestration/teams/[id]/run` (POST)
- `/api/orchestration/workflows` (GET/POST)
- `/api/orchestration/workflows/[id]` (GET/PATCH/DELETE)
- `/api/orchestration/workflows/[id]/execute` (POST)
- `/api/orchestration/workflows/executions/[executionId]` (GET/PATCH)
- `/api/orchestration/workflows/[id]/versions` (GET/POST)
- `/api/orchestration/approvals` (GET/POST)
- `/api/orchestration/approvals/[id]` (GET/POST)
- `/api/orchestration/approvals/bulk` (POST)
- `/api/orchestration/memory` (GET/POST/DELETE)
- `/api/orchestration/messages` (GET/POST)
- `/api/orchestration/metrics` (GET)
- `/api/orchestration/audit` (GET)
- `/api/orchestration/audit/[teamId]` (GET)

### Blog + Content
- `GET /api/blog/posts` (public list)
- `/api/blog/engagement` (auth required)
- `/api/admin/posts` (admin CRUD)
- (Used by blog layout) `/api/search`
- (Used by blog layout) `/api/newsletter/subscribe`

---

## Known Mismatches / Broken Routes to Fix

### Blog naming + routing
- Desired: canonical `/blog` route and “Blog” naming.
- Current state:
  - Middleware allowlist includes `/launchpad(.*)` but not `/blog(.*)` → blog is not truly public.
  - Many links/breadcrumbs reference `/launchpad`, but there is no `/launchpad` route folder.
  - Blog page references `/blog/all` and `/blog/search`, but those routes do not exist.

Recommended direction:
- Canonicalize on `/blog`.
- Keep `/launchpad` as a redirect/alias if needed for backwards compatibility.

### Neptune consistency
- Floating assistant expects JSON from `/api/assistant/chat`, but endpoint streams SSE.
- Multiple conversation APIs: `/api/assistant/conversations*` vs `/api/neptune/conversation`.

### Neptune HQ alignment
- Neptune HQ appears to use separate tables/endpoints (e.g., `neptuneConversations`) from the main assistant conversation system (`aiConversations/aiMessages`).

---

## Content Engine Notes
Existing strong foundation:
- topicIdeas + hit list concepts
- Article Studio UI + pre-publish checks
- weekly source discovery job

Missing glue:
- canonical public route + public-safe APIs (search/newsletter)
- unified editorial pipeline view tying Topic → Draft → Publish → Analyze

---

## Code Bloat Analysis ("Tank" Evidence)

### lib/ai/ Directory — 40+ files
Most significant:
- `src/lib/ai/tools.ts` — **10,399 lines / 344KB** — Contains 96+ tool definitions + implementations in ONE file
- `src/lib/ai/system-prompt.ts` — Large prompt construction
- `src/lib/ai/context.ts` — Context gathering

**Note**: A proper `src/lib/ai/tools/` subdirectory already exists with domain-organized structure (crm/, calendar/, agents/, etc.) but tools.ts hasn't been migrated to use it.

### lib/neptune/ Directory — 8 files, 4 unused
Per `src/lib/neptune/index.ts`, only 3 modules are actually exported:
- `agentic-actions.ts` — USED
- `page-context.ts` — USED
- `quick-actions.ts` — USED (types only)

Marked as "pending schema compatibility work" (effectively dead code):
- `business-intelligence.ts` — NOT EXPORTED
- `proactive-insights.ts` — NOT EXPORTED
- `shared-context.ts` — NOT EXPORTED
- `unified-context.ts` — NOT EXPORTED

### Duplicate Systems Pattern
Multiple implementations of the same concept:

**Context systems:**
- `src/lib/ai/context.ts`
- `src/lib/ai/context-pruning.ts`
- `src/lib/neptune/unified-context.ts` (unused)
- `src/lib/neptune/shared-context.ts` (unused)

**Memory systems:**
- `src/lib/ai/memory.ts`
- `src/lib/ai/session-memory.ts`

**Intelligence systems:**
- `src/lib/ai/workspace-intelligence.ts`
- `src/lib/ai/website-intelligence.ts`
- `src/lib/neptune/business-intelligence.ts` (unused)

**Proactive systems:**
- `src/lib/ai/proactive-engine.ts`
- `src/lib/ai/proactive-triggers.ts`
- `src/lib/neptune/proactive-insights.ts` (unused)

### Summary by Category

| Category | Current Lines | Removable |
|----------|---------------|-----------|
| FloatingAIAssistant | 702 | 702 (broken) |
| /assistant page | 1,387 | 1,387 (duplicate) |
| tools.ts | 10,399 | ~9,000 (migrate to subdirectory) |
| Unused lib/neptune | ~1,000 | ~1,000 (dead code) |
| **Total removable** | | **~12,000 lines** |
