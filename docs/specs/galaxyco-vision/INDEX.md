# GalaxyCo 3.0 — Vision Spec Index

> The complete product specification for GalaxyCo.ai, an AI-native business operating system where Neptune is your proactive business partner and autonomous agents run your company.

## Status Key

| Status | Meaning |
|--------|---------|
| **brainstorming** | Actively discussing, capturing ideas |
| **drafted** | First pass written, needs review |
| **spec'd** | Reviewed, approved, ready for planning |
| **planned** | Implementation plan written |
| **building** | In development |
| **shipped** | Live in production |

## Spec Files

| # | File | Topic | Status |
|---|------|-------|--------|
| 00 | [philosophy.md](./00-philosophy.md) | Product principles, Neptune personality, Trust Arc, Iceberg Principle | drafted |
| 01 | [intelligence-layer.md](./01-intelligence-layer.md) | Deep Library, Activation Search, Living Profile, recon systems | drafted |
| 02 | [onboarding-flow.md](./02-onboarding-flow.md) | Sign-up → recon → Neptune intro → workforce assembly | drafted |
| 03 | [home-feed.md](./03-home-feed.md) | Proactive cards, smart chips, daily experience, Trust Arc evolution | drafted |
| 04 | [neptune.md](./04-neptune.md) | Conversation model, per-module behavior, coaching philosophy | drafted |
| 05 | [agents.md](./05-agents.md) | Paperclip integration, Cockpit view, Office view, workforce scaling, agent identity, cost/budget | drafted |
| 06 | [crm.md](./06-crm.md) | Two-view toggle, decision cards, autonomy model, lead lifecycle, cross-dept handoffs | drafted |
| 07 | [finance.md](./07-finance.md) | Document types, expense categorization engine, cash flow projection, reconciliation logic, overdue escalation, recurring billing | drafted |
| 08 | [marketing.md](./08-marketing.md) | Content/campaign type taxonomies, brand voice engine, content strategy engine, campaign optimization logic, module evolution | drafted |
| 09 | [knowledge.md](./09-knowledge.md) | Document categories, capture decision logic, freshness monitoring with drift detection, conflict resolution, RAG retrieval architecture | drafted |
| 10 | [orchestration.md](./10-orchestration.md) | Pre-built core workflows, workflow anatomy (triggers/steps/conditions/errors), discovery logic, Trigger.dev execution | drafted |
| 11 | [insights.md](./11-insights.md) | Insight generation engine (detection/scoring/narrative), metrics taxonomy by department, report types, data pipeline | drafted |
| 12 | [integrations.md](./12-integrations.md) | Integration catalog with sync patterns, sonar toast discovery, error recovery, rate limit management, connection flow | drafted |
| 13 | [settings-admin.md](./13-settings-admin.md) | Neptune acts / Settings reflects / user overrides with Save, change propagation, audit log, Mission Control | drafted |
| 14 | [public-site.md](./14-public-site.md) | Conversion funnel logic, narrative scroll structure, two visitor types, experience-first positioning | drafted |

## Architecture Dependencies

```
Paperclip (open-source) ← Agent orchestration, cost control, governance
OpenClaw (TBD)          ← Neptune's agentic runtime
GalaxyCo modules        ← CRM, Finance, Marketing = data + tools agents act on
Neptune Intelligence    ← Deep Library + Activation Search + Living Profile
```

## Key Decisions Log

| Date | Decision | Context |
|------|----------|---------|
| 2026-03-18 | Paperclip powers "My Agents" page, not exposed to user | Neptune abstracts all Paperclip configuration |
| 2026-03-18 | Neptune powered by agentic framework (OpenClaw or similar) | Not just an LLM wrapper — full agentic runtime |
| 2026-03-18 | Two agent views: Cockpit (analytical) and Office (visual) | User toggles based on preference |
| 2026-03-18 | Agents own flows end-to-end, user oversees | Modules are departments, not user-operated tools |
| 2026-03-18 | Neptune's Iceberg Principle | Know everything, say what's useful, sequence for outcomes |
| 2026-03-18 | Three-tier intelligence: Deep Library → Activation → Living Profile | Neptune scouts before users exist |
| 2026-03-18 | Trust Arc: Recon → Confirm → Workforce → Curiosity → Scale | Progressive trust-building, not traditional onboarding |
| 2026-03-18 | Mirror Test: GalaxyCo runs on GalaxyCo | No external tools — if Neptune can't grow GalaxyCo, it can't grow anyone |
| 2026-03-18 | Target market: Agencies + E-commerce | Digitally native, small teams, execution-starved. NOT contractors/physical trades |
| 2026-03-18 | Scout/Analyst agents do recon, not Neptune | Neptune reads dossiers strategically; grunt work is agent work |
| 2026-03-18 | Deep Library = single database, two access patterns | Same dossier serves GalaxyCo's growth pipeline AND customer onboarding |
| 2026-03-18 | Neptune archetype: Chief of Staff | With Consigliere loyalty, Oracle questioning, Phil Jackson agent management |
| 2026-03-18 | Default voice: Claude-ChatGPT hybrid | Warm professional, adaptive, reads the room but doesn't mirror mood |
| 2026-03-18 | Personality customization is conversational, not a settings page | Neptune asks calibration questions organically, user can also direct |
| 2026-03-18 | Sign-up form: email + password + URL required, optional extras subtle | No friction. No wizard. No "Step 1 of 5" |
| 2026-03-18 | Existing onboarding cards and wizard flow are killed | Replaced entirely by Neptune conversation |
| 2026-03-18 | First Value Moment target: < 24 hours, ideally < 1 hour | Agents produce visible work immediately after provisioning |
| 2026-03-18 | Office View is default on Agents page | Target market (agencies, e-commerce) responds to visual "company" more than data dashboards |
| 2026-03-18 | Every department module has CRM/traditional ↔ Agent-first view toggle | Same data, different lens. User switches freely. |
| 2026-03-18 | CRM View default in Phase 1, Neptune nudges toward agent-first | Familiar first, agent-first earns its place through trust |
| 2026-03-18 | Agent communication: draft → one-click decide → execute | User stays in control without becoming a bottleneck |
| 2026-03-18 | Autonomy toggle: subtle switch, user's choice, not phase-gated | High-risk actions always surface regardless of toggle state |
| 2026-03-18 | Neptune nudges toward autonomy once, never nags | After streak of unedited approvals, one suggestion. Decline = never asked again. |
| 2026-03-18 | Agent activity toasts: iOS-style bubble with agent avatar | Platform-wide ambient awareness. Checkpoint actions only. Non-blocking, dismissable. |
| 2026-03-18 | Integration discovery: subtle first-session mention + sonar toast when walls are hit | Lower-right corner pulse, contextual, dismissable, 7-day cooldown per integration |
| 2026-03-18 | Settings: Neptune acts, page reflects, user overrides with Save | Every Neptune config visible and overridable. Neptune respects manual overrides. |
| 2026-03-18 | Insights: Neptune-narrated by default, charts available for depth | Narrative cards with "See the data" expandable. Story first, numbers second. |
