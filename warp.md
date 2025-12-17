# Warp Drive — GalaxyCo.ai 3.0

> AI-native business platform. Next.js 15 + TypeScript strict + Neon Postgres.
> Production: app.galaxyco.ai | Status: Active development

## Verify System Health (30 seconds)
```bash
npm run typecheck  # Should pass: 0 errors
npm test           # Check tests/STATUS.md for current state
npm run dev        # Should start on :3000
```
**Expected:** All green. If not, check Troubleshooting section.

## Mental Model
```
src/
├── app/             Routes & API endpoints (Next.js App Router)
├── components/      UI (organized by feature domain)
├── db/              Database schema + migrations (Drizzle)
├── lib/             Business logic & utilities
└── trigger/         Background jobs (15 jobs total)

docs/
├── START.md         ← Read first every session
├── STUBS.md         ← Known gaps/incomplete features  
└── status/
    └── AI_CONTEXT.md  ← Auto-generated, always current
```

## Non-Negotiables
1. **TypeScript strict** - Zero `any` types, ever
2. **Multi-tenant** - Every DB query MUST filter by workspaceId
3. **Quality gates** - lint + typecheck + test before committing
4. **Security** - Reference env vars by name only, never log values
5. **Conventional commits** - `type(scope): description`

## Quick Commands
```bash
# Development
npm run dev                      # Start local (:3000)
npm run build                    # Production build test

# Quality (run before commits)
npm run lint && npm run typecheck  # Must pass
npm test                         # Add tests for new features

# Database
npm run db:push                  # Push schema changes
npm run db:studio                # Visual DB browser
npm run db:generate              # Generate migrations
npm run db:migrate               # Run migrations

# Testing
npm test                         # Unit tests (watch mode)
npm run test:run                 # Single run
npm run test:coverage            # Coverage report
npx playwright test              # E2E tests

# Background Jobs
npm run trigger:dev              # Start Trigger.dev dev server

# Utilities
npm run env:check                # Validate environment variables
npm run update-context           # Regenerate AI_CONTEXT.md
```

## Session Workflow
```bash
# 1. Start (Gain Clarity)
cat docs/START.md                # Current state + priorities
cat docs/STUBS.md                # Known gaps
cat tests/STATUS.md              # Test coverage

# 2. Verify baseline
npm run typecheck && npm test

# 3. Work (Execute with confidence)
# [Make changes]

# 4. Validate (Before presenting)
npm run lint && npm run typecheck
npm test
# Test feature manually or via Playwright

# 5. Document (Update state)
# Update docs/START.md if needed
# Commit with conventional format
```

## Truth Hierarchy (When info conflicts)
1. **Source code** - What's actually implemented
2. **docs/START.md** - Current verified state
3. **Database schema** - `src/db/schema.ts`
4. **AI_CONTEXT.md** - Auto-generated snapshot
5. **Other docs** - May be outdated, verify first

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

## Troubleshooting
| Symptom | Fix |
|---------|-----|
| Type errors after pull | `npm ci` then `npm run typecheck` |
| Tests failing | Check `tests/STATUS.md` for known issues |
| DB errors | Verify `.env.local` has DATABASE_URL |
| Build fails | Run quality gates individually to isolate |
| "Module not found" | `npm ci` (clean install) |

## Environment
- `.env.local` - Secrets (NEVER commit, NEVER log values)
- `.env.example` - Template with all required vars
- `npm run env:check` - Validates your .env.local

## Need More Detail?
- **Agent workflow/FAQ:** `AGENTS.md`
- **Design patterns:** `docs/guides/DESIGN-SYSTEM.md`
- **Tech snapshot:** `docs/status/AI_CONTEXT.md`
- **Database schema:** `src/db/schema.ts`

---
*This is your starting point. Read docs/START.md next.*
