# 05 — Agents (My Agents Page)

> The living workforce. Paperclip under the hood, Neptune managing the floor, and two views that make the user feel like they're running a company — not monitoring a dashboard.

---

## Vision

The Agents page is the answer to "who's working for me right now?" It's not a control panel. It's not a monitoring tool. It's the office floor — walk in, see your team working, check in on whatever catches your eye, and walk out knowing the operation is running.

The user never configures an agent. They never define heartbeat schedules, adapter types, or context modes. Neptune built the team based on what it learned about the business during onboarding. Paperclip orchestrates everything underneath. The Agents page is a **window**, not a **control panel**.

---

## Architecture

### Paperclip: The Hidden Engine

[Paperclip](https://github.com/anthropics/paperclip) (or equivalent open-source agent orchestration framework) manages the entire agent lifecycle:

| Paperclip Handles | User Sees |
|-------------------|-----------|
| Agent provisioning, heartbeat, scheduling | "Alex is working on follow-ups" |
| Adapter configuration (tools, APIs, channels) | "Sales Agent sent an email to Henderson" |
| Cost budgets, token limits, rate limiting | Neptune: "Your marketing agent hit its monthly budget" |
| Context window management, memory | Agent remembers past interactions seamlessly |
| Multi-step task execution, retries | Completed tasks appear in the feed |
| Health monitoring, error recovery | Status dot: green/yellow/red |

**Zero Paperclip terminology reaches the UI.** No "adapters," "heartbeats," "context modes," "execution graphs." The user sees agents with names, roles, and work output.

### Neptune: The Floor Manager

Neptune doesn't do grunt work. Neptune manages the floor — Phil Jackson style:

- **Builds the system.** Designs the workforce during onboarding based on the dossier and user conversation (see `02-onboarding-flow.md`).
- **Recruits the talent.** Proposes new agents when the business needs them.
- **Creates conditions for greatness.** Configures agents with the right context, budgets, and priorities — all through Paperclip, invisible to the user.
- **Lets the workforce execute.** Agents work autonomously. Neptune reviews high-stakes output and intervenes only when it matters.
- **Steps in when needed.** Agent stuck? Neptune adjusts strategy. Agent made a mistake? Neptune corrects it. Budget exhausted? Neptune surfaces the decision to the user.

### Agent → Neptune → User Communication Flow

```
Agent completes task
    → Result flows to Neptune's oversight layer
        → Routine? → Logged. Appears in feed and module.
        → Notable? → Neptune adds context, surfaces as Home feed card.
        → Problem? → Neptune intervenes, may escalate to user.
        → Needs decision? → Neptune frames the choice, recommends, presents to user.
```

The user never talks to agents directly. Neptune is always the intermediary. When the user clicks "Send follow-up" on a card, Neptune delegates to the right agent. When an agent completes the task, Neptune reports back.

---

## The Two Views

Both views show the same underlying data — agent status, activity, performance, and recent work. Two different visual languages for two different cognitive styles. The user toggles freely between them.

### Cockpit View

**Metaphor:** Pilot's flight deck. Glance and know instantly where the energy is.
**For:** The analytical mind that wants data density, real-time metrics, and pattern recognition.

#### Layout

```
┌──────────────────────────────────────────────────────────┐
│  COCKPIT VIEW                          ● All Systems Active  │
├──────────────────────────────────────────────────────────┤
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐      │
│  │  94%    │ │   23    │ │  $42    │ │    7    │      │
│  │ UPTIME  │ │TASKS/HR │ │COST/DAY │ │ AGENTS  │      │
│  │ ━━━━━━━ │ │ ━━━━━━  │ │ ━━━     │ │ ━━━━━━━ │      │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘      │
│                                                          │
│  AGENT ACTIVITY — LAST 24H                               │
│  Sales    ░░░░░░▒▓██▓█████▓▒▒░░░░                       │
│  Content  ░░░▒▓██▓░░▒███████▓▒░░░░░░██                  │
│  Finance  ░░░░░░░░▒██▓░░█▓░░░░░░░░░░                    │
│           12am    6am    12pm    6pm    Now               │
│                                                          │
│  LIVE FEED                                               │
│  ● 2m ago — Sales Agent sent follow-up to Henderson      │
│  ● 8m ago — Content Agent published "5 SEO Tips"         │
│  ● 15m ago — Finance Agent sent invoice to Meridian      │
│  ● 22m ago — Sales Agent qualified lead: Rivera          │
└──────────────────────────────────────────────────────────┘
```

#### Components

| Component | Purpose |
|-----------|---------|
| **Gauge Row** | 4 key metrics at a glance — uptime %, tasks/hour, cost today, active agent count. Each with a progress bar showing relative position (cost against budget, uptime against target, etc.) |
| **Activity Heatmap** | 24-hour heatmap per agent. Color intensity = activity level. Instantly shows when agents are busiest, which are idle, and overall work distribution. One row per agent. |
| **Live Feed** | Reverse-chronological stream of agent actions. Color-coded by department. Clickable — each item links to the relevant record in its module (CRM contact, content draft, invoice, etc.) |
| **Status Indicator** | Top-right corner: system health at a glance. "All Systems Active" (green), "1 Agent Paused" (yellow), "Issue Detected" (red). |

#### Interaction

- **Click a gauge** → Expands to show breakdown (e.g., cost by agent, uptime per agent)
- **Click a heatmap row** → Opens that agent's detail panel (see Agent Detail below)
- **Click a feed item** → Navigates to the relevant record in the appropriate module
- **Hover a heatmap cell** → Tooltip with specific activity count and top actions for that hour

### Office View

**Metaphor:** Top-down miniature office floor plan. SimCity meets a real office.
**For:** The visual mind that wants to *see* the company in motion.

#### Layout

```
┌──────────────────────────────────────────────────────────┐
│  OFFICE VIEW                          Floor 1 — Main Office │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─── Sales ─────────┐    ┌─── Marketing ────────┐     │
│  │ 🧑‍💼 Alex  ● Active  │    │ 🎨 Maya  ● Active    │     │
│  │ 🧑‍💻 Jordan ● Active  │    │ 📊 Sam   ○ Idle      │     │
│  │ Sending follow-ups │    │ Drafting social...    │     │
│  └────────────────────┘    └───────────────────────┘     │
│                                                          │
│  ┌─── Finance ───────┐    ┌─── Neptune ──────────┐     │
│  │ 📋 Riley  ● Active │    │ 🌊 Neptune           │     │
│  │ Chasing invoices   │    │    ● Overseeing       │     │
│  │                    │    │ 3 tasks this hour     │     │
│  └────────────────────┘    └───────────────────────┘     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

#### Components

| Component | Purpose |
|-----------|---------|
| **Department zones** | Spatial groupings — Sales bullpen, Marketing studio, Finance office, etc. Subtle colored borders match department theme colors. |
| **Agent avatars** | Each agent has a distinct avatar (high-quality, not cartoonish), a name, and a status dot. Active agents have a subtle glow/pulse. Idle agents are dimmed. |
| **Activity text** | Below each department: one-line description of current activity. Updates in real-time. Italic, subtle. |
| **Neptune's office** | Neptune has its own station — larger avatar, "Chief of Staff" label. Shows oversight status and recent task count. Visually central or bottom-right (the boss's office with a view of the floor). |
| **Floor grid** | Subtle background grid lines — floor texture, not graph paper. Gives the spatial layout a sense of place. |

#### Interaction

- **Click an agent avatar** → Opens that agent's detail panel
- **Hover an agent** → Tooltip with current task, recent output, and performance summary
- **Click a department zone** → Navigates to that module (Sales → CRM page, Marketing → Marketing page, etc.)
- **Agents animate subtly** — typing indicators, document icons appearing, connection lines when agents communicate with each other

### Default View Decision

**Recommendation: Office View as default.**

Reasoning: The target market is agency owners and e-commerce founders, not engineers or data analysts. Office View immediately communicates "this is your company, these are your people, they're working." It's emotionally resonant in a way that gauges and heatmaps aren't.

Cockpit View is one toggle away for users who discover they prefer data density. Neptune can also suggest it during Phase 3 calibration: "I've noticed you dig into the numbers a lot — want me to switch your Agents page to Cockpit view by default?"

---

## Agent Identity

### Naming

Agents have human names. Not "Sales Bot 1" or "Agent_CRM_001." Neptune assigns names during workforce assembly. Names are:

- Gender-neutral or varied
- Professional but approachable (Alex, Jordan, Maya, Sam, Riley, Morgan, etc.)
- Consistent — once named, the agent keeps its name unless the user renames it
- Referenced by Neptune in conversation: "Alex sent the follow-up" not "your sales agent sent the follow-up" (though Neptune uses both, depending on context)

The user can rename agents at any time through Neptune conversation: "Can you rename the content agent to something else?" Neptune handles it.

### Roles

Agent roles map to business functions, not technical capabilities:

| Role | Department | What They Do |
|------|-----------|--------------|
| **Sales Agent** | CRM | Lead qualification, follow-ups, pipeline management, outreach sequences |
| **Content Agent** | Marketing | Social posts, blog drafts, email copy, brand voice content |
| **Campaign Agent** | Marketing | Campaign setup, A/B testing, audience targeting, performance optimization |
| **Finance Agent** | Finance | Invoice generation, payment tracking, expense categorization, overdue chasing |
| **Knowledge Agent** | Knowledge | Document organization, SOP maintenance, knowledge base curation |
| **Research Agent** | Intelligence | Competitor monitoring, market research, trend analysis |
| **Customer Agent** | CRM | Customer communication, satisfaction tracking, retention flows |

This is the initial role taxonomy. It expands as the platform matures. Users can request custom roles through Neptune: "I need an agent that handles client onboarding" — Neptune designs and provisions it.

### Avatars

Each agent has a distinct visual identity:

- **Style:** High-quality, semi-realistic. Not cartoon, not photorealistic. Think Notion-style illustrations but more polished.
- **Differentiated by department:** Color tinting matches department theme (teal for Sales, violet for Marketing, rose for Finance, etc.)
- **Active state:** Subtle glow/pulse border, full opacity
- **Idle state:** Dimmed, no glow, reduced opacity
- **Error state:** Red pulse, attention indicator

Future consideration: User-uploadable avatars or avatar customization (Phase 3+). Not MVP.

---

## Agent Detail Panel

Clicking an agent (in either view) opens a slide-out detail panel. This is the user's deep-dive into a specific agent's work.

### Panel Contents

| Section | What It Shows |
|---------|--------------|
| **Header** | Avatar, name, role, status, department |
| **Current task** | What the agent is doing right now, with progress if applicable |
| **Recent activity** | Last 10-20 actions, timestamped, with links to relevant records |
| **Performance summary** | Key metrics for this agent's domain (e.g., Sales: leads contacted, response rate, deals influenced; Content: posts drafted, engagement rates) |
| **Cost** | This agent's cost today/this week/this month. LLM tokens used, actions taken. |
| **Neptune's notes** | Neptune's assessment of this agent's performance. Brief, strategic. "Alex has been strong this week — follow-up rate is up 15%. The Henderson deal closed partly because Alex stayed on top of the cadence." |
| **Controls** | Pause/resume, adjust budget, request Neptune to reconfigure |

### Controls Are Neptune-Mediated

The detail panel has a few direct controls (pause/resume is a toggle), but anything more complex goes through Neptune:

- "Increase this agent's budget" → Neptune evaluates and suggests a specific increase with reasoning
- "This agent keeps sending bad emails" → Neptune reviews, adjusts the agent's prompt/context, may suggest retraining
- "I want this agent to also handle [new task]" → Neptune evaluates whether to expand this agent's role or provision a new one

The user never configures Paperclip parameters directly.

---

## Workforce Scaling

### How Agents Get Added

Agents are added through Neptune, never through a UI form:

1. **During onboarding** — Neptune proposes initial workforce (2-3 agents) based on dossier + conversation (see `02-onboarding-flow.md`)
2. **Neptune suggests** — As Neptune observes the business, it proposes new agents: "Your lead volume is growing faster than Alex can handle. Want me to hire a second sales agent?"
3. **User requests** — "I need help with social media" → Neptune designs and provisions a Content Agent or Campaign Agent
4. **Automatic scaling** — For high-volume operations, Neptune may auto-provision temporary agents for burst tasks (e.g., end-of-month invoicing blitz) within budget limits

### How Agents Get Removed

- Neptune recommends: "Sam hasn't been useful — your social content is mostly handled by Maya. Want to retire Sam and reallocate the budget?"
- User requests: "I don't need the research agent anymore"
- Budget constraints: If the user downscales their plan, Neptune recommends which agents to consolidate or retire

Removal is soft by default — agent is paused, data preserved. Hard removal (data deleted) requires explicit confirmation.

### Growth Path

| Phase | Typical Workforce |
|-------|------------------|
| **Phase 1** (Onboarding) | 2-3 agents — focused on user's stated priority |
| **Phase 2** (Weeks 1-4) | 3-5 agents — expanding as trust builds and needs surface |
| **Phase 3** (Months 1-3) | 5-8 agents — user actively requesting new capabilities |
| **Phase 4** (Months 3+) | 5-15 agents — full operational coverage, optimized and tuned |

---

## Agent Performance & Trust

### Trust Score (Internal)

Each agent has an internal trust score that Neptune uses to calibrate oversight:

| Signal | Effect on Trust |
|--------|----------------|
| Task completed successfully | +trust |
| User approved agent's output without edits | +trust |
| User edited or rejected agent's output | -trust, Neptune adjusts |
| Agent made an error Neptune caught | Neutral (system working as designed) |
| Agent made an error user caught | -trust, Neptune investigates |
| Consistent high performance over time | +trust → less Neptune oversight |

Higher trust = more autonomy. New agents get more oversight. Proven agents run freely. This mirrors the Trust Arc but at the individual agent level.

### Performance Metrics

Each agent type has domain-specific KPIs visible in the detail panel:

| Agent Type | Key Metrics |
|-----------|-------------|
| Sales | Leads contacted, response rate, meetings booked, deals influenced, pipeline value |
| Content | Posts drafted, posts published, engagement rate, content calendar adherence |
| Finance | Invoices sent, payment collected, overdue rate, time-to-payment |
| Research | Reports generated, insights surfaced, accuracy of predictions |
| Customer | Tickets handled, satisfaction score, retention rate, response time |

Neptune synthesizes these into a simple narrative: "Your team's running well. Sales is hot — 3 deals in the pipe. Marketing needs attention — engagement dipped. I've adjusted Maya's content strategy."

---

## Cost & Budget

### Visibility

Users see cost at three levels:

1. **Total** — Gauge in Cockpit view, summary in dashboard: "Your agents cost $42 today"
2. **Per agent** — In the detail panel: "Alex: $12 today ($180 this month)"
3. **Per action** — In the activity feed: each action has a tiny cost indicator on hover

### Budget Controls

Budgets are set through Neptune conversation, not through a pricing UI:

- "How much are my agents costing?" → Neptune gives a breakdown with context
- "That's too much for marketing" → Neptune suggests adjustments: "I can reduce Maya's posting frequency from daily to 3x/week. Saves ~$50/month without much impact."
- "Set a hard limit at $200/month" → Neptune configures Paperclip budgets, warns before limits are hit

### Subscription Tier Impact

| Tier | Agent Limits | Budget |
|------|-------------|--------|
| **Free** | 2 agents, limited actions/day | Capped (enough for first value moment) |
| **Starter** | 5 agents | Moderate budget ceiling |
| **Professional** | 15 agents | Higher ceiling, burst capacity |
| **Enterprise** | Unlimited agents | Custom budgets, dedicated capacity |

Neptune handles the upgrade conversation naturally: "Your team is doing great but we're hitting the ceiling on what your current plan allows. Want to look at the next tier?"

---

## Neptune on the Agents Page

When the user is on the Agents page, Neptune shifts to **operations overview** mode (see `04-neptune.md`):

**In Cockpit view:**
> "All systems nominal. Marketing agent is running hot — campaign engagement up 15%. Finance is quiet — end-of-month invoicing wrapped up yesterday."

**In Office view:**
Neptune provides context when the user hovers or clicks agents. More narrative, less metric:
> "Alex has been crushing it this week. Three follow-ups sent today, two got responses. Jordan's picking up the overflow from that Google Ads campaign."

**When something needs attention:**
> "Heads up — Riley's been getting bounce-backs on invoice emails to two clients. Might be bad email addresses. Want me to look into it?"

---

## Agent Activity Toasts (Platform-Wide)

Agents work across all departments, but the user shouldn't have to be on the Agents page to know what's happening. A **global toast notification system** provides ambient awareness anywhere in the platform.

### Behavior

- **iOS-style toast** — Small, temporary bubble that appears at the top or bottom of the screen
- **Agent avatar + one-line checkpoint** — Riley's icon + "Invoice reminder sent to Meridian." That's it.
- **Brief animation** — Slides in, holds for ~3 seconds, fades out. No interaction required.
- **Non-blocking** — Never interrupts workflow, never demands attention. If the user is mid-task, the toast is peripheral.
- **Cross-department** — You're on the CRM page and your Content Agent publishes a post? Toast with Maya's avatar. Finance Agent collects a payment? Toast with Riley's avatar.

### What Triggers a Toast

- Agent completes a checkpoint action (email sent, content published, invoice generated, lead qualified)
- NOT routine internal operations (agent thinking, context loading, data fetching)
- NOT errors or decisions — those go to the agent-first view decision cards or Neptune

### User Controls

- Toasts are on by default — dismissable globally in settings
- Per-agent mute option: "Stop showing me toasts from the Content Agent" (for high-volume agents)
- Neptune adapts: if the user consistently ignores or dismisses toasts from a specific agent, Neptune suggests muting

### Why This Matters

This is the ambient heartbeat of the company. The user doesn't need to check on their agents — they *feel* the work happening as they go about their day. It replaces the live feed concept (which was overkill) with something lighter: peripheral proof that the workforce is alive.

---

## Mobile Experience

### Cockpit View (Mobile)
- Gauges stack vertically (2x2 grid)
- Heatmap simplified to current status per agent (not full 24h)
- Live feed is the primary mobile interface — scrollable, tappable

### Office View (Mobile)
- Departments stack vertically instead of spatial layout
- Agent cards within each department
- Tap to expand agent detail (bottom sheet instead of side panel)

### Key Principle
Mobile is for checking in, not deep analysis. "Are my agents working? Anything need my attention? Good." Desktop is for the deep-dive.

---

## Technical Integration Points

### Existing Systems to Evolve

| System | Change |
|--------|--------|
| `src/app/(app)/agents/` or equivalent | Rebuild with two-view architecture |
| `src/components/agents/` | New components for Cockpit view, Office view, and Agent Detail panel |
| `src/lib/neptune/agentic-actions.ts` | Neptune → Paperclip delegation bridge (expand) |
| `src/lib/ai/cost-protection.ts` | Per-agent budget tracking |

### New Systems Needed

| System | Purpose |
|--------|---------|
| **Paperclip integration layer** | API client for agent provisioning, monitoring, task assignment, budget management. Neptune talks to this, UI reads from this. |
| **Agent registry** | Database model for agent identity (name, role, department, avatar, trust score, budget, status). Links to Paperclip agent IDs. |
| **Activity stream** | Real-time feed of agent actions. Powers both Cockpit live feed and Office activity text. WebSocket or Pusher-driven. |
| **Heatmap data pipeline** | Aggregates agent activity into hourly buckets for the 24h heatmap. Can be computed from the activity stream. |
| **Performance aggregation** | Computes per-agent KPIs from operational data across modules (CRM deals, content posts, invoices, etc.). |

### Data Model (Conceptual)

```typescript
interface Agent {
  id: string;
  workspaceId: string;
  paperclipAgentId: string;        // Link to Paperclip's internal ID

  // Identity
  name: string;                     // Human name (Alex, Maya, etc.)
  role: AgentRole;                  // sales, content, finance, etc.
  department: Department;           // Maps to module
  avatarUrl?: string;               // Custom avatar or generated

  // Status
  status: 'active' | 'idle' | 'paused' | 'error';
  currentTask?: string;             // One-line description of current work
  lastActiveAt: Date;

  // Performance
  trustScore: number;               // 0-100, internal
  metrics: Record<string, number>;  // Domain-specific KPIs

  // Budget
  budgetMonthly: number;            // Monthly cost ceiling
  costToday: number;
  costThisMonth: number;

  // Lifecycle
  provisionedAt: Date;
  provisionedBy: 'onboarding' | 'neptune_suggestion' | 'user_request' | 'auto_scale';
  pausedAt?: Date;
  retiredAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

interface AgentActivity {
  id: string;
  workspaceId: string;
  agentId: string;

  action: string;                   // "sent_follow_up", "drafted_post", "sent_invoice"
  description: string;              // Human-readable: "Sent follow-up to Henderson"
  department: Department;

  relatedEntityType?: string;       // "contact", "content", "invoice"
  relatedEntityId?: string;         // Link to the relevant record

  cost?: number;                    // Cost of this specific action
  timestamp: Date;
}
```

---

## Open Questions

1. **Paperclip selection:** Paperclip is the working assumption, but the final agent orchestration framework hasn't been locked. The abstraction layer should be framework-agnostic enough to swap if needed.

2. **Real-time updates:** Should agent activity be truly real-time (WebSocket/Pusher) or near-real-time (polling every 5-10 seconds)? Real-time is better UX but more infrastructure. Recommendation: Pusher for live feed and status changes, with polling fallback.

3. **Agent-to-agent communication:** Can agents collaborate? (e.g., Sales agent closes a deal → Finance agent auto-generates invoice → Content agent drafts a case study.) If so, how is this visualized? Connection lines between agents in Office view? Cross-department entries in Cockpit feed?

4. **Agent memory across interactions:** How much context does each agent retain between tasks? Paperclip manages this, but the user-facing question is: "Does Alex remember the Henderson deal from last week?" Answer should be yes.

5. **Custom agents (Phase 3+):** When users request agents for non-standard roles ("I need an agent that monitors court filings"), how deep does customization go? Neptune configures, but what are the boundaries of what an agent can do?

6. **Office View scaling:** Office View works beautifully with 5-7 agents. What happens at 15? 25? The spatial metaphor needs a scaling strategy — floors, departments expanding, or a list fallback at high agent counts.

---

*This spec depends on: `00-philosophy.md` (agents as real workers, user never sees wiring, modules as departments), `01-intelligence-layer.md` (Scout/Analyst agents, Paperclip orchestration), `02-onboarding-flow.md` (workforce assembly), `04-neptune.md` (Neptune-agent relationship, delegation model, Phil Jackson coaching)*
*This spec informs: `06-crm.md`, `07-finance.md`, `08-marketing.md` (each module's agent behavior), `10-orchestration.md` (agent-workflow bridge), `13-settings-admin.md` (agent management in Mission Control)*
