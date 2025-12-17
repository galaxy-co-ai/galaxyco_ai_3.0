# AI Agent Playbook — GalaxyCo.ai 3.0

> Comprehensive guide for AI agents working on this codebase.
> Read WARP.md first for foundation, use this for detailed decisions.

## Table of Contents
1. [Decision Framework](#decision-framework)
2. [Testing Strategy](#testing-strategy)
3. [Common Patterns](#common-patterns)
4. [Error Handling](#error-handling)
5. [Finding Things](#finding-things)
6. [What "Done" Means](#what-done-means)
7. [Communication Guidelines](#communication-guidelines)
8. [Common Pitfalls](#common-pitfalls)

---

## Decision Framework

### When should I ask permission vs execute?
```
ASK if:
- Deleting production data
- Changing database schema (destructive)
- Modifying authentication/security logic
- Large architectural changes (>500 lines)
- Unclear requirements

EXECUTE if:
- Fixing bugs/errors
- Adding features with clear requirements
- Refactoring without behavior changes
- Adding tests
- Documentation updates
- 80%+ confident on approach
```

### What if I'm uncertain?
1. **State assumption clearly:** "I'm assuming X because Y"
2. **Execute with assumption**
3. **Note it in commit/update**
4. User will correct if wrong

---

## Testing Strategy

### Test Requirements
**New features MUST have:**
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows (optional but recommended)

### Test Location
```
Unit tests:        tests/unit/[feature].test.ts
Integration tests: tests/integration/api/[route].test.ts
E2E tests:         tests/e2e/[flow].spec.ts
```

### Running Tests
```bash
npm test                    # Watch mode (during development)
npm run test:run            # Single run (CI-style)
npm run test:coverage       # Check coverage (target: 80%)
npx playwright test         # E2E tests
```

### What if tests are failing?
1. Check `tests/STATUS.md` for known failures
2. If new failure: debug and fix
3. If inherited failure: note in START.md and continue
4. Update STATUS.md with current state

---

## Common Patterns

### API Route Structure
```ts
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const workspace = await getCurrentWorkspace();
  const data = await db.query.table.findMany({
    where: eq(table.workspaceId, workspace.id),
  });
  return Response.json({ data });
}
```

### Component Structure
```ts
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function MyComponent() {
  return (
    <div className="space-y-4">
      {/* Tailwind classes only */}
    </div>
  );
}
```

### Database Queries
```ts
const contacts = await db.query.contacts.findMany({
  where: and(
    eq(contacts.workspaceId, workspace.id),
    eq(contacts.status, "active")
  ),
});
```

---

## Error Handling

### API Errors
```ts
try {
  return Response.json({ success: true });
} catch (error) {
  console.error("Operation failed:", error);
  return Response.json({ error: "Failed to complete operation" }, { status: 500 });
}
```

### Client Errors
```ts
import { toast } from "sonner";
try {
  const res = await fetch("/api/endpoint");
  if (!res.ok) throw new Error("Request failed");
  toast.success("Operation completed");
} catch (error) {
  toast.error("Something went wrong");
}
```

---

## Finding Things

### "Where is the code that does X?"

| Task | Location | Pattern |
|------|----------|---------|
| API endpoint | `src/app/api/[feature]/` | Next.js route.ts files |
| Database schema | `src/db/schema.ts` | Single file, search for table name |
| UI component | `src/components/[feature]/` | Feature-organized |
| Business logic | `src/lib/[domain]/` | Reusable functions |
| Background job | `src/trigger/` | Trigger.dev tasks |
| Types | in-place with code | Not a separate folder |

### Search Commands
```bash
grep -r "functionName" src/
find src/ -path "*feature-name*"
grep -r "TODO\|FIXME\|mock" src/
ls src/app/api/[feature]/
```

---

## What "Done" Means

### Feature Checklist
- [ ] Code written and working locally
- [ ] TypeScript: `npm run typecheck` passes
- [ ] Linting: `npm run lint` passes
- [ ] Tests: Existing pass, new added
- [ ] Tested: Feature works (manual/E2E)
- [ ] No console.logs in production code
- [ ] Multi-tenant: Queries filter by workspaceId
- [ ] Documentation: Update START.md if needed
- [ ] Conventional commit
- [ ] Pushed to main/feature branch

### When to present work
Present when checklist is complete. Test before asking.

---

## Communication Guidelines

### Progress Updates
- Give brief updates every ~5–8 tool calls.
- Be decisive; avoid asking permission for obvious tasks.

### Completion Summary
Provide: what changed, tests/results, issues, files touched (high level).

---

## Common Pitfalls

### ❌ Don't
1. Use `any`
2. Skip workspaceId filters
3. Duplicate components
4. Use inline styles
5. Skip tests
6. Commit without quality gates
7. Log env var values
8. Ask permission for trivial tasks

### ✅ Do
1. Reuse existing patterns
2. Use `src/components/ui/*`
3. Add tests with features
4. Run quality gates before commit
5. Reference env vars by name only
6. Execute confidently when clear

---

## Trust Hierarchy
1. Source code
2. docs/START.md
3. src/db/schema.ts
4. docs/status/AI_CONTEXT.md
5. Other docs

## Golden commands (run these; don’t guess)

### Install
```bash
npm ci
```

### Local env
```bash
cp .env.example .env.local
# Fill in real values in .env.local (never commit secrets)

# Optional: validate keys/config (reads .env.local)
npm run env:check
```

### Database (Drizzle)
```bash
# Push schema (common for dev/preview) — creates/updates tables
npm run db:push

# Seed dev data
npm run db:seed

# Studio (DB GUI)
npm run db:studio

# If you are working with migrations explicitly:
npm run db:generate
npm run db:migrate
```

### Dev server
```bash
npm run dev
```

### Quality gates (must pass before you finish)
```bash
npm run lint
npm run typecheck
npm run build
```

### Tests
```bash
# Unit/integration
npm test

# Headless, CI-like run
npm run test:run

# Coverage
npm run test:coverage

# E2E (Playwright)
npx playwright test
```

Notes:
- CI uses Node 20 and runs `npm ci`, then `npm run lint` and `npm run typecheck`.
- Vitest currently runs in CI as “non-blocking for now” (see `.github/workflows/ci.yml`).

## Day-to-day workflow for agents
1. Read the “Source of truth” docs above.
2. Make the smallest change that solves the problem.
3. Keep changes consistent with the design system and existing patterns.
4. Run: `npm run lint`, `npm run typecheck`, and at least relevant tests.
5. If you touch critical flows, run `npm run build`.

## Code + UI standards (high-signal)
- TypeScript strict: no silent `any` expansion.
- Validation: use Zod for API inputs.
- UI: follow `docs/guides/DESIGN-SYSTEM.md`.
  - Prefer canonical primitives in `src/components/ui/*`.
  - `NeptuneButton` exists for backwards compatibility; prefer `Button` for new code unless a feature explicitly standardizes on NeptuneButton.
- Accessibility: ARIA labels where needed, keyboard navigable UI, sensible focus states.
- Logging: prefer project logging utilities; avoid leaving `console.log` in production paths.

## Documentation rules (do not bloat root docs)
Follow `docs/guides/AGENT_INSTRUCTIONS.md`.
Key rule: do not paste large implementation logs into:
- `README.md`
- `docs/status/PROJECT_STATUS.md`

If you need to capture large implementation details, put them in the appropriate `docs/*` file (e.g. historical or phase documents).

## AI_CONTEXT automation
- `docs/status/AI_CONTEXT.md` is generated by `scripts/update-context.js`.
- It is auto-updated on pushes to `main` via `.github/workflows/ai-context.yml`.
- Do not add noisy, manual logs to AI_CONTEXT; keep it concise.

## Background jobs (Trigger.dev)
If you are working on Trigger.dev tasks:
```bash
npm run trigger:dev
```
Config is in `trigger.config.ts` and jobs live in `src/trigger/`.

## Common gotchas
- Env vars are expected in `.env.local` (not `.env`). The verifier script reads `.env.local`.
- Do not commit secrets. Reference env vars by name only.
- Prefer existing patterns and modules; avoid creating “v2” copies of features.

## Where things live
- App routes: `src/app/`
- API routes: `src/app/api/`
- UI primitives: `src/components/ui/`
- Feature components: `src/components/*/`
- DB schema: `src/db/`
- Tests: `tests/` (unit/integration), `tests/e2e/` (Playwright)
