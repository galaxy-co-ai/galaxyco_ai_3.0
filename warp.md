# Warp Drive Context — GalaxyCo.ai 3.0

## Project Overview
AI-native business platform and startup studio. Next.js 14+ App Router with TypeScript strict mode.

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict)
- **Database:** Drizzle ORM + Neon Postgres
- **Auth:** Clerk
- **Styling:** Tailwind CSS + shadcn/ui
- **Background Jobs:** Trigger.dev
- **Testing:** Vitest (unit) + Playwright (E2E)

## Essential Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build            # Production build
npm run start            # Start production server

# Quality Gates (run before commits)
npm run lint             # ESLint check
npm run typecheck        # TypeScript check
npm run lint && npm run typecheck  # Both (recommended)

# Database (Drizzle)
npm run db:push          # Push schema changes to DB
npm run db:studio        # Open Drizzle Studio GUI
npm run db:seed          # Seed development data
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations

# Testing
npm test                 # Vitest watch mode
npm run test:run         # Vitest single run
npm run test:coverage    # Coverage report
npx playwright test      # E2E tests

# Background Jobs
npm run trigger:dev      # Start Trigger.dev dev server

# Utilities
npm run env:check        # Validate environment variables
```

## Directory Structure

```
src/
├── app/                 # Next.js App Router pages & API routes
│   ├── api/            # API routes
│   ├── (auth)/         # Auth pages (sign-in, sign-up)
│   ├── (dashboard)/    # Protected dashboard routes
│   └── (marketing)/    # Public marketing pages
├── components/
│   ├── ui/             # shadcn/ui primitives (Button, Card, etc.)
│   └── */              # Feature components by domain
├── db/                  # Drizzle schema & queries
├── lib/                 # Utilities, helpers, constants
├── trigger/            # Trigger.dev background jobs
└── types/              # TypeScript type definitions

tests/                   # Vitest unit/integration tests
tests/e2e/              # Playwright E2E tests
docs/                    # Documentation
```

## Git Workflow

**Branch naming:**
- `feature/*` — New features
- `fix/*` — Bug fixes
- `refactor/*` — Code improvements

**Commit format (Conventional Commits):**
```
type(scope): description

# Examples:
feat(crm): add contact import dialog
fix(dashboard): correct stats calculation
refactor(api): simplify auth middleware
docs(readme): update setup instructions
```

**Types:** feat, fix, refactor, docs, style, test, chore

## Common Workflows

### Starting a feature
```bash
git checkout -b feature/your-feature-name
npm run dev
# Make changes, test manually
npm run lint && npm run typecheck
git add .
git commit -m "feat(scope): description"
git push -u origin feature/your-feature-name
```

### Database changes
```bash
# After modifying src/db/schema.ts
npm run db:push          # Push to Neon (dev)
npm run db:studio        # Verify in GUI
```

### Before pushing
```bash
npm run lint && npm run typecheck && npm run build
```

## Environment

- `.env.local` holds secrets (never commit)
- `.env.example` documents required variables
- Run `npm run env:check` to validate

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Type errors after pulling | `npm run typecheck` then fix issues |
| DB connection failed | Check `.env.local` DATABASE_URL |
| Clerk auth issues | Verify CLERK_SECRET_KEY in .env.local |
| Build fails | Run `npm run lint && npm run typecheck` first |
| Module not found | Try `npm ci` to clean reinstall |

## Key Files

- `AGENTS.md` — AI agent instructions
- `docs/status/PROJECT_STATUS.md` — Current status
- `docs/status/AI_CONTEXT.md` — Auto-generated context
- `docs/guides/DESIGN-SYSTEM.md` — UI patterns
- `src/db/schema.ts` — Database schema

## Notes for Warp Drive

- Always suggest `npm run lint && npm run typecheck` before commits
- Use conventional commit format
- Prefer existing npm scripts over raw commands
- This is a TypeScript strict project — type safety matters
- When in doubt, check `AGENTS.md` for conventions
