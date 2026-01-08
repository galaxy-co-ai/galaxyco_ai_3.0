# Repository Guidelines

## Project Structure & Module Organization
Source lives in `src/app` (routes + API), `src/components` (UI primitives/features), `src/lib` (AI + utilities), and `src/db` (Drizzle schema). Other key folders: `drizzle/` for migrations, `scripts/` for automation, `docs/` for product knowledge, `public/` for assets, `src/trigger/` for Trigger.dev, and `tests/` + `tests/e2e/` for Vitest and Playwright suites.

## Build, Test, and Development Commands
Use `npm run dev` locally; `npm run build && npm run start` mirrors production. Before every PR run `npm run env:check`, `npm run lint`, `npm run typecheck`, and `npm run format:check` (auto-fix with `npm run format`). Database helpers: `npm run db:push`, `npm run db:generate`, `npm run db:migrate`, `npm run db:studio`, and `npm run db:seed`. Testing commands: `npm test`, `npm run test:run`, `npm run test:coverage` (>=80%), `npm run test:e2e` or `npx playwright test`, plus `npm run trigger:dev` when touching background jobs.

## Coding Style & Naming Conventions
Ship only TypeScript on Next.js 16. Prettier enforces 2-space indentation, 100-character width, semicolons, and single quotes in TSX; always format before committing. ESLint (Next + `unused-imports`) must pass without new `eslint-disable` blocks. Components/hooks are PascalCase, helpers camelCase, and test files mirror their subjects. Use Lucide icons, Radix wrappers, Tailwind utilities, Zod validation, and update `.env.example` when introducing env vars.

## Testing Guidelines
Unit and integration specs belong in `tests/unit` or `tests/integration` using Vitest + Testing Library to assert observable behavior. UI changes require component coverage, and flows touching navigation, auth, or billing must re-run Playwright (`tests/e2e/*.spec.ts`) with shared fixtures in `tests/e2e/fixtures`. Keep coverage at or above 80% and note justified gaps in `tests/STATUS.md`.

## Commit & Pull Request Guidelines
Commits follow Conventional Commits (`feat(ai):`, `fix(app):`, `docs(status):`). PRs should summarize scope, link the ticket, attach screenshots or Looms for UI, and confirm lint, typecheck, build, tests, and migrations were run. Squash WIP commits, highlight schema or env updates, and tag platform/security reviewers when relevant.

## Security & Configuration
Secrets stay in `.env.local`; never paste credentials into issues or logs. Keep `.env.example` current, validate with `npm run env:check`, and document new providers in `docs/integrations/`. Changes to auth, billing, or uploads require a short risk summary plus a security reviewer tag. Report vulnerabilities privately (Slack or confidential issue), not in public threads.
