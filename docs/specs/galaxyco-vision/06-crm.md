# 06 — CRM (Sales Department)

> The sales bullpen. Agents own the pipeline end-to-end — qualifying leads, sending follow-ups, booking meetings, and nudging deals forward. The user walks the floor, makes the calls only they can make, and lets the team handle the rest.

---

## Vision

The CRM isn't a tool the user operates. It's a sales department the user oversees. Agents qualify leads, send follow-ups, manage cadences, and move deals through the pipeline. The user steps in for relationship moments — the personal call, the strategic pricing decision, the handshake.

Traditional CRMs are spreadsheets with better UI. GalaxyCo's CRM is a bullpen full of salespeople who happen to be AI.

---

## Two Views, One Department

The CRM page has a view toggle — same data, different experience.

### CRM View (Traditional)

The familiar pipeline board. Kanban columns, contact lists, deal cards, filters. This is the "hands on the keyboard" view for users who want to manually work deals, drag cards between stages, or drill into contact history.

Existing CRM modules in the codebase (`src/app/(app)/crm/`) provide the foundation. The data model — contacts, deals, pipeline stages, activities — is fundamentally sound. CRM View evolves the current UI rather than replacing it.

**Key enhancement:** Even in CRM view, agent activity is visible. Deal cards show the assigned agent's avatar and last action. The pipeline isn't dead data — it reflects live agent work.

### Agent-First View

Neptune's curated surface. The user doesn't see a pipeline — they see what needs their attention.

**Top: Stat bar** — Pipeline value, active deals, close rate, leads this week. Collapsed by default into a single compact row. Expandable into a full scoreboard with trends, comparisons, and agent-level breakdowns. The stat bar is ambient awareness — glanceable, not demanding.

**Main: Decision cards** — Neptune surfaces only what requires human judgment:

- **Draft approvals** — Agent drafted an outreach email. One-click Send or Edit. No friction.
- **Stalled deals** — Neptune flags deals going cold with a recommended action. "Morrison hasn't responded in 6 days. Email isn't working — I'd try a call. Want talking points?"
- **New leads** — High-ICP leads that just came in. Agent has first outreach ready. Approve or review.
- **Wins and losses** — Brief celebration or debrief. "Chen closed at $6,800. Alex ran the cadence, you sealed it with the call."
- **Escalations** — Anything the agent can't handle alone. Custom pricing requests, unhappy prospects, competitive situations.

When there's nothing to decide, the view says so. "Your sales team is handling it. No decisions needed right now." The user isn't staring at an empty feed — they're seeing that the department is running.

**Tucked away but accessible: Autonomy switch** — A minimal toggle that lets the user flip from "agent drafts, I approve" to "agent sends, Neptune watches." High-risk actions (first contact with new leads, deals above a configurable threshold, anything Neptune flags) still surface regardless of autonomy mode.

### Default View & Trust Arc

| Phase | Default View | Why |
|-------|-------------|-----|
| Phase 1 | CRM View | Familiar. User just signed up. They've used CRMs before. |
| Phase 2 | CRM View, Neptune suggests agent-first | "Your team's handling most of the pipeline now. Want to try the agent view?" |
| Phase 3+ | Agent-First | User toggled voluntarily or accepted Neptune's suggestion. |

The user can switch freely at any time. Neptune suggests the transition once. If the user declines, Neptune doesn't ask again unless circumstances change significantly (e.g., agent count doubles, pipeline grows substantially).

---

## Agent Communication Model

### Default: Draft → Decide → Execute

1. Agent drafts outbound communication (email, follow-up, outreach sequence)
2. User sees a one-click decision card in the agent-first view (or a notification badge in CRM view)
3. User taps **Send** (approve as-is) or **Edit** (opens the draft for modification)
4. Agent proceeds based on the decision — sends the message, continues the cadence, or adjusts based on edits

This is fast. Not a review page with a form. A card with two buttons. The user spends 2 seconds per decision, not 2 minutes.

### Autonomy Mode

A toggle (subtle, out of the way but convenient) switches the agent to full-send mode:

- Agent sends outbound communication without waiting for approval
- Neptune monitors output and flags anything concerning
- **High-risk actions always surface regardless of autonomy mode:**
  - First contact with a new lead
  - Deals above a configurable dollar threshold
  - Any message Neptune considers reputation-sensitive
  - Communications the agent itself is uncertain about

### Neptune's Nudge

After the user has approved a significant streak of drafts without editing, Neptune offers once:

> "You've approved Alex's last 20 emails without changes. Want to let Alex send these on autopilot?"

If the user declines: noted, never asked again. If they accept: autonomy toggle flips, Neptune confirms. No nagging, no repeated suggestions, no passive-aggressive "are you sure you still want to review every email?"

---

## Lead Lifecycle

### How Leads Enter

| Source | How It Works |
|--------|-------------|
| **Inbound forms** | Website contact forms, landing pages. Auto-captured, agent begins qualification immediately. |
| **Integrations** | Imported from connected tools (HubSpot, Salesforce, Google Contacts, spreadsheet upload). Agent scores and prioritizes on import. |
| **Agent-sourced** | Research Agent or Scout Agent identifies prospects from the Intelligence Layer's Deep Library. Passes to Sales Agent for outreach. |
| **Referrals** | Existing customer refers someone. Neptune connects the dots — "Rivera was referred by Chen. High trust signal." |
| **Manual** | User adds a contact directly in CRM view. Agent picks up from there. |

### Qualification

Sales Agent scores every lead against the workspace's ICP (Ideal Customer Profile), which Neptune built during onboarding from the dossier and conversation:

- **ICP match score** (0-100) — How closely the lead matches the business's target customer
- **Intent signals** — Did they fill out a form? Visit pricing? Get referred?
- **Dossier depth** — If the lead's company is in the Deep Library, the agent has rich context before the first touch

Qualified leads get an outreach cadence. Low-score leads get tagged and warehoused — agents may re-engage if signals change.

### Outreach Intelligence

Agents don't send generic templates. Every outreach is informed by:

- **Dossier data** from the Intelligence Layer (if the lead's company is in the Deep Library)
- **Interaction history** across all touchpoints
- **Industry context** from the Demand Signal Agent
- **User's brand voice** learned during onboarding and refined from approved/edited drafts
- **What's worked before** — Agents learn from open rates, response rates, and successful closes

### Pipeline Stages

Default stages (customizable through Neptune conversation):

| Stage | Agent Behavior |
|-------|---------------|
| **New** | Agent qualifies, scores ICP, prepares first outreach |
| **Contacted** | Agent manages cadence — follow-ups, timing, channel selection |
| **Qualified** | Agent has confirmed interest. Surfaces to user if meeting needed. |
| **Meeting** | Neptune preps talking points and context. Agent handles scheduling logistics. |
| **Proposal** | Agent drafts proposal from templates + deal context. User reviews pricing. |
| **Negotiation** | High-touch. Neptune and user collaborate. Agent handles logistics. |
| **Closed Won** | Agent triggers cross-department handoffs — Finance Agent invoices, Customer Agent onboards. |
| **Closed Lost** | Agent logs outcome. Neptune surfaces debrief: what happened, what to learn. |

### Cross-Department Handoffs

When a deal closes, the CRM doesn't exist in isolation:

- **Finance Agent** receives deal details, generates invoice, begins payment tracking
- **Customer Agent** (if provisioned) starts client onboarding sequence
- **Knowledge Agent** (if provisioned) creates a client profile in the knowledge base
- **Neptune** connects the dots: "Chen deal closed. Invoice sent. Onboarding sequence started. Anything else you want for this client?"

These handoffs are automatic. The user sees the result, not the wiring.

---

## Neptune as Sales Strategist

On the CRM page, Neptune shifts to sales mode (see `04-neptune.md`):

| Situation | Neptune Does |
|-----------|-------------|
| New lead arrives | "New lead: Rivera Construction. ICP 85. Alex is starting outreach." |
| Deal stalling | "Henderson's been quiet for 5 days. Alex tried email twice. I'd suggest a call — want talking points?" |
| Win | "Chen closed — $6,800. Alex ran the cadence, you sealed it with the call. Nice." |
| Loss | "Lost Morrison to [competitor]. Here's what I think happened and what we can learn." |
| Volume spike | "12 new leads overnight from the Google campaign. Alex is qualifying — I'll surface the top ones." |
| Pattern detected | "Your close rate on referral leads is 3x higher than cold outreach. Want to lean into that?" |
| Budget impact | "Your sales agents' outreach volume is approaching the monthly budget. Want to extend or prioritize?" |

Neptune is strategic, not administrative. It doesn't say "3 emails were sent today." It says "Henderson is slipping — here's what I'd do."

---

## Data Model Enhancements

The existing CRM schema (`src/db/schema.ts`) needs agent-layer additions:

| Addition | Purpose |
|----------|---------|
| `assignedAgentId` | Which agent owns this lead/deal |
| `qualificationScore` | ICP match score (0-100) |
| `dossierId` | Link to Intelligence Layer dossier (if available) |
| `outreachCadenceId` | Active outreach sequence |
| `lastAgentAction` / `lastAgentActionAt` | Most recent agent touch |
| `attentionFlag` | Needs human decision |
| `attentionReason` | Why (draft pending, stalled, escalation, etc.) |
| `autonomyOverride` | Per-deal override of workspace autonomy setting |

Pipeline stages, contact fields, and deal structure remain as-is. The agent layer augments — it doesn't replace.

---

## Mobile

- Agent-first view translates naturally — decision cards are mobile-native (tap to approve)
- CRM view on mobile: list-based deal view instead of kanban (columns don't work on narrow screens)
- One-click approve/reject works perfectly on mobile — designed for thumb-speed decisions

---

## Open Questions

1. **Email sending infrastructure:** Agents send emails from the user's domain? A shared GalaxyCo domain? Custom SMTP? Deliverability and sender reputation management is critical — this is a technical decision with product implications.

2. **Multi-agent sales teams:** At what deal volume does a single Sales Agent bottleneck? Neptune should auto-detect and propose a second agent, but the threshold and scaling strategy need definition.

3. **Integration priority:** Which CRM import integrations matter most at launch? HubSpot and CSV cover 80% of the market. Salesforce, Google Contacts, and Pipedrive cover the next 15%.

4. **Outreach channel expansion:** Email is table stakes. When do agents get SMS, LinkedIn outreach, or phone call capabilities? These have very different compliance and cost profiles.

5. **Deal value thresholds:** The "high-risk always surfaces" rule needs configurable thresholds. What's the sensible default? $1,000? $5,000? Percentage of average deal size?

---

*This spec depends on: `00-philosophy.md` (modules as departments, agents own flows), `01-intelligence-layer.md` (Deep Library dossiers, ICP data), `02-onboarding-flow.md` (workforce assembly), `04-neptune.md` (sales strategist behavior, delegation model), `05-agents.md` (agent identity, communication flow, trust scores)*
*This spec informs: `07-finance.md` (deal → invoice handoff), `08-marketing.md` (lead source attribution), `10-orchestration.md` (sales workflows), `11-insights.md` (sales analytics)*
