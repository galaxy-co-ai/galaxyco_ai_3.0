# GalaxyCo.ai 3.0

AI-native business operating system. CRM, finance, workflows, knowledge base, marketing, and Neptune AI assistant — all multi-tenant, deployed on Vercel at galaxyco.ai.

## Quick Reference

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Test (watch) | `npm test` |
| Test (CI) | `npm run test:run` |
| Test (coverage) | `npm run test:coverage` |
| E2E tests | `npm run test:e2e` |
| E2E (UI mode) | `npm run test:e2e:ui` |
| DB push (dev only) | `npm run db:push` |
| DB generate migration | `npm run db:generate` |
| DB apply migrations | `npm run db:migrate` |
| DB studio | `npm run db:studio` |
| DB seed | `npm run db:seed` |
| Trigger.dev | `npm run trigger:dev` |
| Env check | `npm run env:check` |
| Bundle analyze | `npm run analyze` |

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5.7 (strict)
- **Styling**: Tailwind CSS 4, Radix UI primitives, Framer Motion
- **Database**: PostgreSQL (Neon serverless) + Drizzle ORM
- **Auth**: Clerk (SSO, MFA, webhooks)
- **AI**: OpenAI GPT-4 + Anthropic Claude + Google Gemini (multi-model)
- **Vector/RAG**: Upstash Vector + Redis
- **Background Jobs**: Trigger.dev
- **Realtime**: Pusher (events) + Liveblocks (collaboration)
- **Payments**: Stripe
- **Communications**: SignalWire (SMS/voice), Resend (email)
- **Storage**: Vercel Blob
- **Monitoring**: Sentry
- **Package Manager**: npm (not pnpm — package-lock.json is source of truth)

## Project Structure

```
src/
├── app/
│   ├── (app)/          # Authenticated routes (dashboard, crm, finance, assistant, etc.)
│   └── api/            # ~50 API route groups (assistant, crm, finance, admin, etc.)
├── components/         # ~350 components organized by feature domain
│   ├── ui/             # shadcn/ui primitives (buttons, dialogs, etc.)
│   └── [feature]/      # Feature-specific components (crm/, finance-hq/, neptune/, etc.)
├── lib/                # Business logic, AI orchestration, integrations
│   ├── ai/             # AI system — tools, context, prompts, RAG, caching
│   ├── neptune/        # Neptune assistant — actions, insights, context
│   ├── validation/     # Zod schemas
│   ├── hooks/          # React hooks
│   └── [domain].ts     # Domain utilities (auth, db, email, storage, etc.)
├── db/
│   ├── schema.ts       # Main schema (~8900 lines, 50+ tables)
│   └── workflow-schema.ts
├── trigger/            # Background jobs (campaigns, indexing, lead scoring, etc.)
└── middleware.ts       # Clerk auth + route protection

tests/                  # Mirrors src/ structure
├── lib/                # Unit tests
├── api/                # API route tests
├── components/         # Component tests
└── e2e/                # Playwright E2E specs

drizzle/migrations/     # Database migrations (managed by drizzle-kit)
docs/                   # Architecture, guides, specs, assessments
```

## Critical Rules

### Multi-Tenant Isolation (MANDATORY)

Every table has a `workspaceId` column. **Every query MUST filter by workspaceId.** No exceptions. Cross-tenant data leaks are security incidents.

```typescript
// CORRECT
const contacts = await db.select().from(contactsTable).where(eq(contactsTable.workspaceId, workspaceId));

// WRONG — exposes all tenants' data
const contacts = await db.select().from(contactsTable);
```

Workspace context comes from `src/lib/auth.ts` helpers. Always use them — never hardcode or assume workspace identity.

### Security

- Never commit `.env.local` — secrets stay local or in Vercel dashboard
- Run `npm run env:check` before builds to verify required keys
- `ALLOW_DEV_BYPASS` must be `false` in production
- Encryption for sensitive data via `src/lib/encryption.ts` (AES)
- Rate limiting via Upstash Redis (`src/lib/rate-limit.ts`)
- Report vulnerabilities privately, not in public issues

### Authentication

Clerk middleware handles auth. Route protection is defined in `src/middleware.ts`:
- **Public**: `/`, `/pricing`, `/features`, `/blog`, `/sign-in`, `/sign-up`, `/api/webhooks/*`, `/api/public/*`
- **Protected**: Everything in `(app)/` route group and authenticated API routes

System admin access (Mission Control) requires either:
- Email in `SYSTEM_ADMIN_EMAILS` array in `src/lib/auth.ts`
- `publicMetadata.isSystemAdmin = true` set in Clerk

## Code Conventions

- **TypeScript only** — no `.js` files unless migrating legacy
- **ES modules** — `import/export`, never `require`
- **Prettier**: 2 spaces, semicolons, single quotes, 100 char width, trailing commas
- **ESLint**: Next.js config + `unused-imports` plugin. No new suppressions.
- **Naming**:
  - Components, hooks, providers: `PascalCase`
  - Helpers, utilities: `camelCase`
  - Route folders: `kebab-case`
  - Database columns: `snake_case`
  - Env vars: `SCREAMING_SNAKE_CASE`
- **Path alias**: `@/*` maps to `./src/*`
- Update `.env.example` whenever you add a new env var

## Database

### Schema Conventions

- Drizzle ORM with PostgreSQL dialect
- Schema files: `src/db/schema.ts` + `src/db/workflow-schema.ts`
- Primary keys: UUIDs with `defaultRandom()`
- Every table: `workspaceId` (uuid), `createdAt`, `updatedAt` timestamps
- Column names: `snake_case` (Drizzle maps to camelCase in TypeScript)

### Migration Workflow

```bash
# Local development — push schema directly (no migration files)
npm run db:push

# Production — generate then apply migration files
npm run db:generate    # Creates migration in drizzle/migrations/
npm run db:migrate     # Applies pending migrations

# NEVER use db:push in production
```

### Drizzle Config

- Schema: `['./src/db/schema.ts', './src/db/workflow-schema.ts']`
- Migrations: `./drizzle/migrations`
- Migration table: `drizzle_migrations` in `public` schema
- Strict mode enabled

### Key Enums

`userRoleEnum`: owner, admin, member, viewer
`agentTypeEnum`: scope, call, email, note, task, roadmap, content, custom, browser, cross-app, knowledge, sales, trending, research, meeting, code, data, security
`subscriptionTierEnum`: free, starter, professional, enterprise
`executionStatusEnum`: pending, running, completed, failed, cancelled

## Neptune AI System

Neptune is the AI assistant. Key architecture:

| Layer | Location | Purpose |
|-------|----------|---------|
| System prompt | `src/lib/ai/system-prompt.ts` | Personality + capabilities |
| Context builder | `src/lib/ai/context.ts` | Workspace-aware context assembly |
| Intent classifier | `src/lib/ai/intent-classifier.ts` | Route user intent to right handler |
| Tool registry | `src/lib/ai/tools/` | 33 AI tools organized by domain |
| RAG | `src/lib/ai/rag.ts` + `rag-enhanced.ts` | Knowledge retrieval |
| Proactive engine | `src/lib/ai/proactive-engine.ts` | Anticipatory suggestions |
| Session memory | `src/lib/ai/session-memory.ts` | In-conversation memory |
| Neptune actions | `src/lib/neptune/agentic-actions.ts` | Multi-step action chains |
| Unified context | `src/lib/neptune/unified-context.ts` | Page-aware context builder |

### When Working on Neptune

- Neptune's personality is warm, proactive, and efficient — maintain this tone in system prompts
- Context pruning (`src/lib/ai/context-pruning.ts`) manages token budgets — respect token limits
- Cost protection (`src/lib/cost-protection.ts`) guards against runaway LLM costs
- LLM responses are cached (`src/lib/llm-cache.ts`, `src/lib/ai/smart-cache.ts`) — invalidate when changing prompts
- Multi-model: OpenAI is primary, Anthropic + Gemini are fallbacks. Check `src/lib/ai-providers.ts`

## Testing

### Strategy

- **Unit/Integration**: Vitest + Testing Library (happy-dom)
- **E2E**: Playwright (Chromium desktop + mobile)
- **Coverage target**: 70% minimum (lines, functions, branches, statements)
- **Test timeout**: 10s per test

### Conventions

- Test files mirror `src/` structure: `tests/lib/`, `tests/api/`, `tests/components/`
- Name tests to match source: `TeamChat.test.tsx` for `TeamChat.tsx`
- E2E specs in `tests/e2e/`, fixtures in `tests/e2e/fixtures/`
- Document intentional coverage gaps in `tests/STATUS.md`
- Prefer testing one feature at a time (`npm test -- path/to/test`) over full suite

### Before Merging

Run the full quality gate:
```bash
npm run lint && npm run typecheck && npm run test:run && npm run build
```

For UI changes, also run: `npm run test:e2e`

## Environment Variables

Run `npm run env:check` to validate. Full reference in `.env.example`.

### Required for Dev

| Variable | Service |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL |
| `CLERK_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Auth |
| `ENCRYPTION_KEY` | AES encryption (32-byte hex) |
| `NEXT_PUBLIC_APP_URL` | App base URL |
| `OPENAI_API_KEY` | AI (primary) |

### Optional (Feature-Dependent)

| Category | Variables |
|----------|-----------|
| AI (secondary) | `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY` |
| Vector/Cache | `UPSTASH_REDIS_REST_URL/TOKEN`, `UPSTASH_VECTOR_REST_URL/TOKEN` |
| Storage | `BLOB_READ_WRITE_TOKEN` |
| Background Jobs | `TRIGGER_SECRET_KEY` |
| Payments | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Realtime | `PUSHER_*`, `LIVEBLOCKS_*` |
| Communications | `SIGNALWIRE_*`, `RESEND_API_KEY` |
| Monitoring | `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` |
| OAuth | `GOOGLE_CLIENT_ID/SECRET`, `MICROSOFT_CLIENT_ID/SECRET` |

## Background Jobs (Trigger.dev)

Jobs live in `src/trigger/`. Dev mode: `npm run trigger:dev`.

Key jobs: campaign sending, document indexing, lead scoring, proactive events, social posting, website analysis, workflow execution.

- Project ID: `proj_kztbsnnuypnyibmslcvd`
- Max duration: 3600s (configurable per task)
- Retries: 3 attempts by default
- Queue definitions in `src/trigger/queues.ts`

## Styling

- **Tailwind v4** with PostCSS plugin
- **Dark mode**: class-based (`'class'` strategy)
- **Custom palette**: Nebula theme (nebula-void, nebula-deep, nebula-dark, nebula-frost, plus teal/violet/rose/blue with full shade scales)
- **Custom shadows**: `soft`, `soft-hover`, `soft-lg`
- **Typography plugin** enabled for prose content
- Component primitives from Radix UI (via shadcn/ui in `src/components/ui/`)

## Deployment

- **Host**: Vercel (project: `galaxyco-ai-3-0`)
- **Live URL**: galaxyco.ai
- **CI**: GitHub Actions (`ci.yml`) — lint, typecheck, test, build, E2E
- **Sentry**: Source maps uploaded on build, tunnel at `/monitoring`
- **Cron**: Automatic Vercel Cron monitors

## Common Gotchas

1. **`db:push` is dev-only** — use `db:generate` + `db:migrate` for production schema changes
2. **Schema is ~8900 lines** — search for table names rather than scrolling. Use `src/db/schema.ts` for main tables, `src/db/workflow-schema.ts` for workflow tables
3. **MCP feature is experimental** — disabled by default (`MCP_ENABLED=false`), state is in-memory only
4. **Husky pre-commit hooks are disabled** — run quality checks manually before committing
5. **4 cache implementations exist** — `src/lib/cache.ts`, `src/lib/llm-cache.ts`, `src/lib/ai/cache.ts`, `src/lib/ai/smart-cache.ts`. Consolidation is a known debt item
6. **Bundle size matters** — use `npm run analyze` when adding large dependencies. Dynamic imports via `src/lib/code-splitting.tsx`
7. **Clerk webhooks** need `CLERK_WEBHOOK_SECRET` — endpoint at `/api/webhooks/clerk`
8. **Trigger.dev dev server** runs separately from Next.js — start with `npm run trigger:dev` when working on background jobs
9. **ESLint ignores**: `.next/`, `_to-delete/`, `docs/archive/`, `src/legacy-pages/`, `**/_archive*`
10. **TSConfig excludes**: `_to-delete*`, `**/_archive*`, `scripts/**/*`

## Working with This Codebase

### Before Your First Session

```bash
cp .env.example .env.local   # Then fill in required values
npm install
npm run env:check
npm run dev
```

### Efficient Session Patterns

- **Exploring**: This codebase has ~1000 TypeScript files. Use subagents for open-ended exploration. Don't read files speculatively.
- **Feature work**: Check `src/app/(app)/[feature]/` for pages, `src/app/api/[feature]/` for API routes, `src/components/[feature]/` for UI, `src/lib/[feature]/` or `src/lib/ai/tools/[feature]/` for logic.
- **Schema changes**: Edit `src/db/schema.ts`, run `npm run db:generate`, verify migration in `drizzle/migrations/`, then `npm run db:migrate`.
- **AI tool changes**: Tools live in `src/lib/ai/tools/[domain]/`. Registry in `src/lib/ai/tools/index.ts`. Test with Neptune after changes.
- **Background jobs**: Edit in `src/trigger/`, register in `src/trigger/jobs.ts`, test with `npm run trigger:dev`.

### Commit Conventions

Conventional Commits: `feat(crm):`, `fix(ai):`, `docs(status):`, `chore(deps):`
Squash WIP commits. Call out schema or env changes in PR descriptions. Tag security/platform reviewers for auth, billing, or storage changes.

### Reference Docs

| Doc | Purpose |
|-----|---------|
| `AGENTS.md` | Guidelines for AI coding agents (GitHub Copilot, etc.) |
| `docs/START.md` | Canonical onboarding guide |
| `docs/guides/NEPTUNE_CAPABILITIES.md` | Neptune AI features |
| `docs/guides/NEPTUNE_TROUBLESHOOTING.md` | Neptune debugging |
| `docs/status/AI_CONTEXT.md` | Auto-generated project context |
| `.env.example` | Full env var reference with descriptions |
