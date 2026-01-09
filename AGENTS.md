# Repository Guidelines

## Project Structure & Module Organization
GalaxyCo.ai keeps runtime code inside `src/`: `src/app` (Next.js routes + API handlers), `src/components` (UI primitives and layouts), `src/lib` (AI orchestration, caching, utilities), `src/db` (Drizzle schema) and `src/trigger` (Trigger.dev jobs). Database migrations stay in `drizzle/`, shared automation scripts live in `scripts/`, docs plus checkpoint status logs sit in `docs/`, and static assets belong in `public/`. Tests mirror the runtime folders in `tests/` (unit + integration) and `tests/e2e/` (Playwright flows).

## Build, Test, and Development Commands
Use Node 18+ and copy `.env.example` to `.env.local` before running commands. Core workflow:
- `npm run dev` - start the Next.js dev server on http://localhost:3000.
- `npm run build && npm run start` - production build and runtime smoke test.
- `npm run lint`, `npm run typecheck`, `npm run format:check` - enforce style and types (auto-fix with `npm run format`).
- Database helpers: `npm run db:generate`, `npm run db:migrate`, `npm run db:push`, `npm run db:seed`, `npm run db:studio`.
- Tests: `npm test` (Vitest watch), `npm run test:run`, `npm run test:coverage`, `npm run test:e2e` (Playwright), and `npm run trigger:dev` when iterating on background jobs.

## Coding Style & Naming Conventions
TypeScript + React only; avoid `.js` files unless migrating legacy code. Prettier enforces 2-space indentation, semicolons, single quotes, and 100 character width; run formatting before commits. ESLint (Next config plus `unused-imports`) must pass without new suppressions. Components, hooks, and providers use PascalCase; helpers and utilities use camelCase; route folders follow Next.js kebab-case (for example `crm-dashboard`). Update `.env.example` whenever a new secret or feature flag is introduced.

## Testing Guidelines
Vitest with Testing Library powers unit and integration suites in `tests/lib`, `tests/app`, and `tests/components`; match test names to their sources (for example `TeamChat.test.tsx`). Keep coverage >=80% and document intentional gaps in `tests/STATUS.md`. End-to-end coverage runs with Playwright specs in `tests/e2e`; smoke the spec relevant to your feature plus `tests/e2e/marketing-qa.spec.ts` before merging. Store fixtures under `tests/e2e/fixtures` or feature folders rather than inlining JSON blobs.

## Commit & Pull Request Guidelines
Commits follow Conventional Commits (`feat(ai):`, `fix(app):`, `docs(status):`). A pull request should describe scope, link the issue or checkpoint, include screenshots or Looms for UI changes, and confirm lint, typecheck, unit, E2E, and database tasks were executed. Squash noisy WIP commits, call out schema or env impacts in the description, and ping platform/security reviewers for auth, billing, or storage modifications.

## Security & Configuration Tips
Never commit `.env.local`; secrets stay local or in the managed vault. Run `npm run env:check` before builds to verify required keys. When touching Trigger.dev jobs, Sentry config, or webhook handlers, document the new variables in `docs/integrations/` and outline rotation steps. Report vulnerabilities privately (Slack #security or a confidential GitHub issue) rather than public threads.