# GalaxyCo.ai 3.0 — Milestone Plan (Execution Blueprint)
Date: 2025-12-31

This plan is milestone-based (not sprint-based). Each milestone has a goal, why it matters, scope, acceptance criteria, and dependencies.

## Milestone 0 — Canonicalize Blog + Public Funnel Integrity (P0 unblock)
Goal
- Make `/blog` truly public, consistent, crawlable, and conversion-ready.

Why
- This is your top-of-funnel and currently blocked by route protection + broken/legacy links.

Scope
- Decide canonical naming + route: **Blog** at `/blog`.
- Hard redirect `/launchpad(.*)` → `/blog(.*)` (backwards compatibility without maintaining two IA concepts).
- Ensure all blog UX dependencies work anonymously (search + newsletter subscribe).

Acceptance criteria
- Anonymous users can access:
  - `/blog`, `/blog/[slug]`, `/blog/category/[slug]`, `/blog/learn` without auth.
- No internal UI links point to routes that do not exist.
- Blog search and newsletter signup work for anonymous users (or are intentionally disabled with a clear UI state).
- No 404s from blog navigation.

Key tasks
- Update middleware allowlist to include `/blog(.*)`.
- Implement a **hard redirect** for `/launchpad(.*)` → `/blog(.*)` (prefer 308/301 as appropriate).
- Update internal links to stop using `/launchpad` (canonicalize to `/blog` everywhere).
- Audit + fix/remove references to `/blog/search` and `/blog/all` (implement or remove).
- Make sure any API endpoints required by blog layout are public-safe (ex: `/api/search` for blog-only search, `/api/newsletter/subscribe`).
- Align metadata titles/labels to “Blog” (optional: keep “Launchpad” as tagline only).

Dependencies
- None.

---

## Milestone 1 — Neptune “Single Surface” Consolidation (P0/P1)
Goal
- One Neptune experience across the app (UI + state + APIs), anchored to the dashboard command center.

Why
- Multiple assistant surfaces are causing drift and likely breakage (especially floating assistant).

Scope
- Canonical UI = `NeptuneProvider` + `NeptuneAssistPanel`.
- Deprecate or refactor:
  - `/assistant` page (duplicate streaming logic)
  - `FloatingAIAssistant` (JSON expectation vs SSE)
- Unify conversation APIs so there is one source of truth.

Acceptance criteria
- There is a single frontend path for assistant messaging and SSE stream handling.
- No assistant client attempts to parse JSON from `/api/assistant/chat`.
- Conversation load/refresh/history uses one canonical API namespace.

Key tasks
- Pick canonical conversation endpoints (`/api/assistant/*` recommended).
- Update `NeptuneContext` refresh/load to use canonical endpoints.
- Replace Floating assistant implementation with:
  - a wrapper that mounts `NeptuneAssistPanel`, or
  - remove floating assistant entirely.
- Decide what the `/assistant` route becomes:
  - redirect to dashboard “Fullscreen Neptune”, or
  - keep as a thin wrapper around the canonical Neptune panel.
- Remove Neptune HQ entirely (UI + routes + any APIs/data paths it depends on), after confirming no critical dependencies.

Dependencies
- Milestone 0 is independent, but doing Milestone 0 first improves conversion while AI consolidation work proceeds.

---

## Milestone 2 — Dashboard Command Center + IDE-style Side Panel (P1)
Goal
- Dashboard becomes the single “home,” with a persistent Neptune side panel (desktop) + fullscreen mode.

Why
- Best blend of trust, context, and action. Mirrors patterns that already exist in My Agents.

Scope
- Desktop: main content + right panel Neptune (resizable; defaults on).
- Mobile: Neptune bottom sheet.
- Panel tabs: Chat / History / Activity (at minimum).

Acceptance criteria
- Users can keep workspace context visible while Neptune runs tools.
- Neptune has an “Activity” view for tool execution + approvals (or a clear equivalent).

Key tasks
- Create a shared “Shell pattern” for right panel behavior (used on Dashboard and optionally My Agents).
- Ensure Neptune pageContext tracks current module/page accurately.
- Ensure quick actions are context-aware and tied to the journey (first-run prompts).

Dependencies
- Milestone 1 (to avoid building the new UX on duplicated assistant foundations).

---

## Milestone 3 — Conversion-ready Onboarding + Progressive Disclosure Navigation (P1)
Goal
- A clean Day-0 user journey: minimal nav, guided setup, fast first win.

Why
- Your biggest lever right now is conversion and clarity, not feature breadth.

Scope
- Onboarding captures:
  - business description, ICP, primary goal
  - optional website
- Progressive navigation:
  - Day 0: minimal nav (Dashboard + 2–4 core areas)
  - reveal advanced areas after milestones (first agent, first workflow, first integration)

Acceptance criteria
- New users can reach a “first win” path in < 5 minutes.
- Navigation is not overwhelming on Day 0.
- Neptune guidance matches the onboarding stage.

Key tasks
- Define “Activation events” (first agent created, first lead imported, etc.).
- Implement gating / disclosure rules.
- Ensure analytics exist for funnel steps (blog → signup → onboarding completion → activation).

Dependencies
- Milestone 2 for dashboard as the unified home.

---

## Milestone 4 — Agents + Orchestration Consolidation (P1/P2)
Goal
- One coherent automation story: everyday users live in “My Agents”; power users graduate to Orchestration.

Why
- Current duplication (teams/workflows in multiple places) is confusing and expensive.

Scope
- Decide the primary surface:
  - recommend: **My Agents** as primary, Orchestration as advanced.
- Integrate approvals and autonomy status so actions feel safe and transparent.

Acceptance criteria
- Users know where to go to:
  - create an agent
  - run a workflow
  - approve/reject actions
- No duplicated UI paths that disagree.

Key tasks
- Consolidate entry points and reduce redundant screens.
- Align Orchestration metrics/approvals into the Neptune “Activity” view (or link clearly).
- Confirm autonomy/risk classification rules are surfaced in UX.

Dependencies
- Milestone 1/2 (Neptune surface consolidation so orchestration actions appear consistently).

---

## Milestone 5 — Content Engine MVP (P1/P2)
Goal
- Turn Blog into a consistent publishing machine tied to product growth.

Why
- You already have most of the plumbing; you need a coherent pipeline and routing.

Scope
- Editorial pipeline:
  - Topic Ideas / Hit List → Outline → Draft → Pre-publish → Publish → Analyze → Iterate
- Automation:
  - weekly source discovery
  - quality checks as gates

Acceptance criteria
- You can reliably produce + publish content on a schedule.
- Admin workflow is smooth and aligned with quality gates.
- Blog analytics/engagement can inform what to write next.

Key tasks
- Make “Hit List” the canonical starting point for content.
- Ensure pre-publish checklist is integrated as a required step.
- Ensure post publish updates the topic status and records analytics.

Dependencies
- Milestone 0 (public blog routing and funnel integrity).

---

## Milestone 6 — Design System Hardening + Visual Library + Incremental Rollout (P2)
Goal
- A stable, enforceable visual language with a reference library.

Why
- Prevents UI drift while you consolidate surfaces.

Scope
- Build a “Visual Library” internal route (or Storybook-style page) showcasing components + patterns.
- Incrementally refactor high-traffic surfaces first: Dashboard/Neptune → Onboarding → Blog.

Acceptance criteria
- Single source-of-truth components are documented and previewable.
- Key surfaces share consistent spacing, typography, and interaction patterns.

Dependencies
- Best after Milestones 1–3 so you’re standardizing the right patterns.

---

## Cross-cutting Checks (do continuously)
- Workspace/tenant integrity: no API accepts workspaceId from client without validating against auth-derived workspace.
- Analytics: funnel events are consistent and measurable.
- Error handling: SSE failures and tool errors are surfaced clearly.
