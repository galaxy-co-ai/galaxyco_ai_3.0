# GalaxyCo.ai 3.0 — Project Index

> Definitive project map. If you still need to explore after reading this, this file failed.

## Application Modules

Each module follows the same pattern: pages in `src/app/(app)/[module]/`, API routes in `src/app/api/[module]/`, components in `src/components/[module]/`, and business logic in `src/lib/[module]/` or `src/lib/ai/tools/[module]/`.

| Module | Pages | API Routes | Components | Logic |
|--------|-------|------------|------------|-------|
| **Dashboard** | `(app)/dashboard/` | `api/dashboard/` | `components/dashboard/` | `lib/dashboard.ts` |
| **CRM** | `(app)/crm/` | `api/crm/` | `components/crm/` | `lib/crm/` |
| **Finance** | `(app)/finance/`, `(app)/finance-hq/` | `api/finance/` | `components/finance-hq/` | `lib/finance/` |
| **Neptune AI** | `(app)/assistant/`, `(app)/neptune-hq/` | `api/assistant/` | `components/assistant/`, `components/neptune/`, `components/neptune-hq/` | `lib/ai/`, `lib/neptune/` |
| **Agents** | `(app)/agents/` | `api/agents/`, `api/agent-templates/` | `components/agents/` | `lib/ai/agent-templates.ts` |
| **Knowledge Base** | `(app)/knowledge/`, `(app)/knowledge-base/` | `api/knowledge/` | `components/knowledge-base/` | `lib/ai/rag.ts`, `lib/search.ts` |
| **Marketing** | `(app)/marketing/` | `api/marketing/`, `api/campaigns/`, `api/newsletter/` | `components/marketing/` | `lib/ai/marketing-expertise.ts` |
| **Content Creator** | `(app)/creator/` | `api/creator/`, `api/blog/` | `components/creator/` | `lib/ai/tools/content/` |
| **Orchestration** | `(app)/orchestration/` | `api/orchestration/`, `api/workflows/` | `components/orchestration/` | `lib/orchestration/`, `db/workflow-schema.ts` |
| **Insights** | `(app)/insights/` | `api/insights/`, `api/analytics/` | `components/insights/`, `components/analytics/` | `lib/analytics/` |
| **Settings** | `(app)/settings/` | `api/settings/` | `components/settings/` | — |
| **Admin** | `(app)/admin/` | `api/admin/` | `components/admin/` | `lib/admin/` |
| **Integrations** | `(app)/connected-apps/` | `api/integrations/` | `components/integrations/` | `lib/integrations/`, `lib/oauth.ts` |
| **Communications** | — | `api/communications/` | — | `lib/communications/`, `lib/signalwire.ts` |
| **Activity** | `(app)/activity/` | `api/activity/` | `components/activity/` | `lib/user-activity.ts` |
| **Conversations** | `(app)/conversations/` | `api/conversations/` | `components/conversations/` | — |
| **Library** | `(app)/library/` | — | — | `lib/storage.ts` |
| **Onboarding** | `(app)/onboarding/` | — | — | — |
| **Lunar Labs** | `(app)/lunar-labs/` | — | `components/lunar-labs/` | — |

## Core Infrastructure

### Database (`src/db/`)

| File | Lines | Purpose |
|------|-------|---------|
| `schema.ts` | ~8900 | All application tables (50+). Multi-tenant with `workspaceId` on every table. |
| `workflow-schema.ts` | — | Workflow/orchestration tables (grids, nodes, edges, executions) |

**Client**: `src/lib/db.ts` — Drizzle client configured for Neon serverless.
**Migrations**: `drizzle/migrations/` — Managed by drizzle-kit.

### Authentication (`src/middleware.ts` + `src/lib/auth.ts`)

- Clerk middleware protects all `(app)/` routes
- `src/lib/auth.ts` provides workspace context helpers and system admin checks
- Webhook sync at `/api/webhooks/clerk`

### AI System (`src/lib/ai/`)

```
ai/
├── system-prompt.ts        # Neptune personality + capability framing
├── context.ts              # Primary context builder (workspace-aware)
├── context-pruning.ts      # Token budget management
├── intent-classifier.ts    # Routes user intent to handlers
├── session-memory.ts       # In-conversation memory
├── memory.ts               # Persistent memory
├── rag.ts                  # Base RAG implementation
├── rag-enhanced.ts         # Enhanced RAG with reranking
├── proactive-engine.ts     # Anticipatory suggestions
├── proactive-triggers.ts   # Trigger detection patterns
├── autonomy-learning.ts    # Auto-execution confidence learning
├── resilient-executor.ts   # Retry/fallback logic
├── cost-protection.ts      # → actually at lib/cost-protection.ts
├── tool-selector.ts        # Dynamic tool selection
├── style-matcher.ts        # Communication style adaptation
├── voice.ts                # Voice synthesis
├── voice-profile.ts        # Voice profile management
├── collaboration.ts        # Multi-agent coordination
├── patterns.ts             # Common AI patterns
├── reasoning.ts            # Chain-of-thought utilities
├── progress-stream.ts      # Streaming progress indicators
├── index.ts                # Exports
│
├── tools/                  # 33 AI tools organized by domain
│   ├── agents/             # Agent management
│   ├── analytics/          # Analytics queries
│   ├── automation/         # Automation triggers
│   ├── calendar/           # Calendar operations
│   ├── content/            # Content generation
│   ├── crm/                # CRM operations
│   ├── finance/            # Finance operations
│   ├── knowledge/          # Knowledge base queries
│   ├── marketing/          # Marketing operations
│   ├── orchestration/      # Workflow triggers
│   ├── tasks/              # Task management
│   ├── index.ts            # Tool registry
│   └── types.ts            # Tool type definitions
│
└── [domain-specific].ts    # Website analysis, document generation, etc.
```

### Neptune Layer (`src/lib/neptune/`)

```
neptune/
├── unified-context.ts      # Page-aware context assembly
├── agentic-actions.ts      # Multi-step action chains
├── business-intelligence.ts# BI insight generation
├── proactive-insights.ts   # Proactive suggestion engine
├── quick-actions.ts        # One-click action definitions
├── page-context.ts         # Per-page context rules
├── shared-context.ts       # Cross-page shared context
└── index.ts                # Exports
```

### Background Jobs (`src/trigger/`)

| Job File | Purpose |
|----------|---------|
| `campaign-sender.ts` | Marketing campaign delivery |
| `document-indexing.ts` | Knowledge base document indexing + embeddings |
| `lead-scoring.ts` | CRM lead scoring calculations |
| `hit-list-prioritization.ts` | Lead priority ranking |
| `follow-up-sequence.ts` | Automated follow-up emails |
| `precompute-insights.ts` | Dashboard insight pre-computation |
| `proactive-events.ts` | Neptune proactive event processing |
| `social-posting.ts` | Social media scheduled posts |
| `website-analysis.ts` | Website crawling + analysis |
| `workflow-executor.ts` | Workflow step execution |
| `workflow-executor-orchestration.ts` | Workflow orchestration logic |
| `approvals.ts` | Approval workflow processing |
| `content-source-discovery.ts` | Content source discovery |
| `team-executor.ts` | Team task execution |
| `jobs.ts` | Job registry |
| `queues.ts` | Queue definitions |
| `streams.ts` | Stream definitions |
| `client.ts` | Trigger.dev client config |

### Shared Utilities (`src/lib/`)

| File | Purpose |
|------|---------|
| `auth.ts` | Clerk helpers, workspace context, admin checks |
| `db.ts` | Drizzle client |
| `utils.ts` | General utilities (cn, formatters, etc.) |
| `email.ts` | Resend email sending |
| `storage.ts` | Vercel Blob file storage |
| `encryption.ts` | AES encryption for sensitive data |
| `rate-limit.ts` | Upstash Redis rate limiting |
| `cache.ts` | General caching |
| `llm-cache.ts` | LLM response caching |
| `logger.ts` | Structured logging |
| `observability.ts` | Tracing and metrics |
| `analytics.ts` | Analytics tracking |
| `openai.ts` | OpenAI client configuration |
| `ai-providers.ts` | Multi-model provider config |
| `search.ts` | Vector search utilities |
| `upstash.ts` | Upstash Redis + Vector clients |
| `vector.ts` | Vector operations |
| `pusher-client.ts` | Pusher frontend client |
| `pusher-server.ts` | Pusher backend client |
| `liveblocks.ts` | Liveblocks collaboration config |
| `signalwire.ts` | SignalWire SMS/voice |
| `oauth.ts` | OAuth flow helpers |
| `document-processing.ts` | PDF/DOCX parsing |
| `pdf-generator.ts` | PDF generation |
| `dalle.ts` | DALL-E image generation |
| `gamma.ts` | Gamma document generation |
| `website-crawler.ts` | Full website crawler |
| `website-crawler-lite.ts` | Lightweight crawler |
| `phone-numbers.ts` | Phone formatting/validation |
| `cost-protection.ts` | LLM cost guards |
| `code-splitting.tsx` | Dynamic import helpers |
| `accessibility.ts` | A11y utilities |
| `theme-provider.tsx` | Next-themes dark mode provider |
| `toast.tsx` | Toast notification system |
| `integration-status.ts` | Integration health checks |
| `team-channels.ts` | Team channel creation |
| `push-notifications.ts` | Push notification service |
| `user-activity.ts` | Activity tracking |
| `dashboard.ts` | Dashboard data fetching |

### Validation (`src/lib/validation/`)

Zod schemas for API input validation. Organized by domain.

### React Hooks (`src/lib/hooks/`)

Custom hooks for shared component logic.

### UI Primitives (`src/components/ui/`)

shadcn/ui components built on Radix UI. Standard primitives: Button, Dialog, Sheet, Popover, Select, Tabs, Table, Card, Badge, Input, Textarea, etc.

## Landing & Public Pages

| Route | Components |
|-------|------------|
| `/` (landing) | `components/landing/` or `components/landing-v2/` |
| `/pricing` | In landing components |
| `/features` | In landing components |
| `/blog` | `components/blog/` |
| `/contact` | Contact form |
| `/sign-in`, `/sign-up` | Clerk-managed |

## CI/CD & Tooling

| File | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | Lint, typecheck, test, build, E2E |
| `.github/workflows/ai-context.yml` | Auto-update AI_CONTEXT.md on main pushes |
| `.github/ISSUE_TEMPLATE/bug_report.md` | Bug report template |
| `.github/PULL_REQUEST_TEMPLATE.md` | PR template with checklist |
| `.husky/` | Git hooks (currently disabled) |
| `sentry.*.config.ts` | Sentry error monitoring config |
| `trigger.config.ts` | Trigger.dev project config |
| `drizzle.config.ts` | Drizzle ORM migration config |
| `vitest.config.ts` | Vitest test runner config |
| `playwright.config.ts` | Playwright E2E config |

## Documentation Map (`docs/`)

| Path | Contents |
|------|----------|
| `docs/START.md` | Canonical onboarding guide |
| `docs/guides/` | Neptune capabilities, troubleshooting, deployment |
| `docs/specs/` | Feature specifications |
| `docs/assessments/` | Platform health assessments |
| `docs/status/` | Current status tracking, `AI_CONTEXT.md` |
| `docs/strategy/` | Product strategy documents |
| `docs/design-system/` | Component/design documentation |
| `docs/foundation/` | Foundation architecture docs |
| `docs/bugs/` | Bug tracking |
| `docs/launch/` | Launch checklists |

## Known Technical Debt

1. **4 cache implementations** — `lib/cache.ts`, `lib/llm-cache.ts`, `ai/cache.ts`, `ai/smart-cache.ts` need consolidation
2. **Schema size** — `schema.ts` at ~8900 lines could be split by domain
3. **Husky hooks disabled** — pre-commit quality gates not enforced
4. **Test coverage** — needs audit, target is 70%+
5. **MCP feature** — experimental, in-memory state only, not production-durable
6. **Legacy folders** — `_to-delete/`, `_archive*/`, `src/legacy-pages/` exist but are excluded from builds
