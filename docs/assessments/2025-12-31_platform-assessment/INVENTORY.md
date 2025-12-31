# GalaxyCo.ai 3.0 — Inventory / Appendix
Date: 2025-12-31

## Key Frontend Files (High Signal)

### Dashboard
- `src/components/dashboard/DashboardV2Client.tsx`

### Neptune core (recommended canonical implementation)
- `src/contexts/neptune-context.tsx`
- `src/components/conversations/NeptuneAssistPanel.tsx`
- `src/lib/neptune/page-context.ts`
- `src/components/neptune/DynamicQuickActions.tsx`

### Neptune secondary surfaces (audit for removal/refactor)
- `src/app/(app)/assistant/page.tsx`
- `src/components/shared/FloatingAIAssistant.tsx`
- `src/app/(app)/neptune-hq/page.tsx`

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
