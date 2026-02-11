# Start Here — GalaxyCo.ai

This is the canonical onboarding guide for engineers, designers, and contributors.
For current system status, see `docs/status/AI_CONTEXT.md` (auto-updated on `main`).

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local

# Push database schema (local/dev)
npm run db:push

# Start the dev server
npm run dev
```

Visit http://localhost:3000.

## Prerequisites

- Node.js 18+
- PostgreSQL database (Neon recommended)
- Service API keys from `.env.example`

## Environment Setup

- Copy `.env.example` to `.env.local` and fill required values.
- Optional sanity check: `npm run env:check`.
- Security note: `ALLOW_DEV_BYPASS` is for local development only and must be `false` in production.

## Database

- Migrations live in `drizzle/`.
- Common commands:
  - `npm run db:push` (local/dev schema sync)
  - `npm run db:migrate` (apply migrations)
  - `npm run db:studio` (database UI)

## Common Scripts

```bash
npm run dev           # Next.js dev server
npm run build         # Production build
npm run start         # Production server
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm run test:run      # Vitest (CI mode)
npm run test:e2e      # Playwright
npm run format        # Prettier
```

## Project Map

- `src/app/` — Next.js routes (App Router + API handlers)
- `src/components/` — UI components
- `src/lib/` — Core logic (AI, orchestration, integrations)
- `src/db/` — Drizzle schema
- `src/trigger/` — Trigger.dev jobs
- `tests/` — Vitest suites
- `tests/e2e/` — Playwright flows
- `docs/` — Documentation and runbooks

## Testing Notes

- Unit/integration tests: `npm run test:run`
- E2E tests: `npm run test:e2e` (requires test secrets)
- Current test status is tracked in `tests/STATUS.md`.

## MCP (Experimental)

- MCP endpoints are disabled by default.
- To enable locally, set `MCP_ENABLED=true` in `.env.local`.
- State for MCP OAuth is in-memory today and not production-durable.

## Design System

- Design references live in `docs/design-system/README.md`.

## If You Are Using an AI Coding Agent

Start with `AGENTS.md` for repo-specific instructions.
