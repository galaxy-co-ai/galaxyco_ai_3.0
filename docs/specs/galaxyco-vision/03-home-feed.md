# 03 — Home Feed

> The daily experience. What the user sees every time they open GalaxyCo — Neptune's morning briefing, agent work reports, opportunities, and decisions that need the user's eye.

---

## Vision

The Home feed is Neptune's primary proactive surface. It's not a dashboard of static metrics. It's not a to-do list. It's what the user sees when they "walk into the office" — a curated briefing of what happened, what's happening, and what needs their attention.

The shift from the existing design: cards are no longer generated from raw database queries. They're generated from **agent activity + Neptune's judgment.** A lead card doesn't appear because an uncontacted lead exists in the database — it appears because the Sales Agent worked the lead and Neptune decided the user should know.

**The Home feed is the answer to: "What did my company do while I was away, and what needs me right now?"**

---

## Layout

### Structure

```
┌──────────────────────────────────────────────────────┐
│  GREETING ZONE                                        │
│  "Morning, Dalton. Your team had a solid night."      │
│                                                        │
├──────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │  FEED CARD                                     │    │
│  │  💰 2 invoices paid overnight ($3,200)         │    │
│  │  [See details]  [Send more invoices]           │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │  FEED CARD                                     │    │
│  │  🧑‍💼 Alex closed the Henderson deal ($4,200)   │    │
│  │  [See the deal]  [Draft case study]            │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
│  ┌──────────────────────────────────────────────┐    │
│  │  FEED CARD                                     │    │
│  │  📊 Your email open rate dropped 3% this month │    │
│  │  [See analysis]  [Let Neptune adjust]          │    │
│  └──────────────────────────────────────────────┘    │
│                                                        │
├──────────────────────────────────────────────────────┤
│  INPUT ZONE                                           │
│  "Talk to Neptune..."                                  │
└──────────────────────────────────────────────────────┘
```

### Zones

| Zone | Purpose |
|------|---------|
| **Greeting Zone** | Personalized greeting + one-line summary of company status. Serif font, generous spacing. Sets the tone: "your company is running." |
| **Feed Zone** | Scrollable cards (3-7 max, never overwhelming). Ordered by Neptune's priority scoring. Each card is an agent work report, an opportunity, or a decision point. |
| **Input Zone** | Fixed at bottom. "Talk to Neptune..." input for direct conversation. Always available. |

### Design Principles

- **Full-width, centered layout** (max-width 2xl). No sidebar on Home — this is the main stage.
- **Swiss-inspired** — generous whitespace, clear hierarchy, restrained color.
- **Glass/neumorphic card styling** consistent with the existing design direction.
- **3-7 cards maximum.** Neptune curates ruthlessly. If there's nothing important, the feed can be as few as 1-2 cards. An empty feed with just the greeting is acceptable on quiet days.
- **No infinite scroll.** The feed ends. If the user wants more, they ask Neptune or navigate to a module.

---

## Card Types

### Rethinking Cards Through the Agent Lens

The existing design had 7 card types based on data categories. The new model reframes cards around **what happened and what needs you:**

| Card Type | When It Appears | Source |
|-----------|----------------|--------|
| **Agent Report** | An agent completed significant work | Agent activity stream + Neptune judgment |
| **Decision Required** | Something needs the user's approval or input | Agent escalation or Neptune judgment |
| **Opportunity** | Neptune spotted something the user should know about | Intelligence Layer + Neptune analysis |
| **Problem** | Something went wrong or needs attention | Agent error, metric anomaly, or external event |
| **Milestone** | A goal was hit or a significant threshold crossed | Agent operational data + goal tracking |
| **Briefing** | Neptune's periodic summary of company status | Scheduled (morning, evening, or custom) |

### Card Anatomy

Every card follows the same structure:

```
┌─────────────────────────────────────────────┐
│  [Department color indicator]                │
│                                               │
│  HEADLINE                                     │
│  One-line summary of what happened or what's  │
│  needed. Written by Neptune, not by a         │
│  template.                                    │
│                                               │
│  [Smart Chip A]  [Smart Chip B]  [Chip C]    │
│                                               │
└─────────────────────────────────────────────┘
```

| Element | Description |
|---------|-------------|
| **Department indicator** | Subtle color bar or dot — teal (Sales), violet (Marketing), rose (Finance), etc. Instant visual categorization. |
| **Headline** | Written by Neptune in natural language. Not templated. "Alex closed the Henderson deal ($4,200)" not "Deal Closed: Henderson - $4,200.00." |
| **Smart Chips** | 2-3 action buttons. Primary action, secondary action, optional tertiary. Each maps to a Neptune action or navigation. |

### Card Type Details

#### Agent Report
The most common card type. An agent did something worth knowing about.

**Examples:**
- "Alex sent 5 follow-ups this morning. One got a reply — Rivera Construction wants a quote."
  - `[See the conversation]` `[Draft the quote]`
- "Maya published 3 social posts. The reel about [topic] is getting traction — 2x your usual engagement."
  - `[See the posts]` `[Boost it]`
- "Riley sent invoice reminders to 3 overdue accounts. Meridian Co paid — $1,800 received."
  - `[See financials]` `[Send a thank-you]`

**Neptune writes these as narratives**, not data points. The card tells a story, not a fact.

#### Decision Required
Something needs the user's brain. Neptune couldn't or shouldn't decide alone.

**Examples:**
- "Jordan found a lead that wants custom pricing. Standard rates don't fit. Here's the context — what should we offer?"
  - `[See the details]` `[Let Neptune decide]` `[I'll handle it]`
- "Maya drafted a campaign for Black Friday. It's aggressive — 40% off everything. Want to review before it goes out?"
  - `[Review the campaign]` `[Approve it]` `[Tone it down]`

**These cards are rarer** — maybe 1-2 per day at most. If everything's running smoothly, there may be none.

#### Opportunity
Neptune spotted something strategic. Intelligence Layer data, market signal, or cross-module insight.

**Examples:**
- "Your competitor just dropped their prices 15%. Could be a quality issue on their end — or they're trying to grab market share. Want me to dig into it?"
  - `[Show me more]` `[Adjust our positioning]` `[Ignore it]`
- "It's Q4 prep season. Based on your last year's numbers, now's when you should start your holiday campaign. Want me to have Maya draft something?"
  - `[Start the campaign]` `[Not yet]`
- "Three of your clients mentioned 'TikTok' in conversations this month. None of your agents cover TikTok yet. Want me to hire a social video agent?"
  - `[Yes, hire one]` `[Tell me more]` `[Not now]`

#### Problem
Something needs fixing. Not panic — Neptune is calm — but attention is warranted.

**Examples:**
- "Riley's invoice emails to two clients are bouncing. Probably bad email addresses. I can look into it or you can update them manually."
  - `[Neptune, fix it]` `[I'll update them]`
- "Your website went down for 12 minutes this morning. It's back up. Here's what I know."
  - `[See details]` `[Ignore]`

**Problems are surfaced calmly.** Neptune doesn't alarm. It informs and offers solutions.

#### Milestone
Something worth celebrating. Keeps the user motivated and aware of progress.

**Examples:**
- "You hit $25K in revenue this month — your best month yet."
  - `[See the breakdown]` `[Set a new goal]`
- "Alex just contacted your 100th lead. Your pipeline has grown 3x since you started."
  - `[See the pipeline]` `[Nice]`

**Milestones are sparing.** One every few days at most. They should feel earned, not manufactured.

#### Briefing
Neptune's periodic summary. The "morning standup" from your Chief of Staff.

**Examples:**
- Morning: "Good morning. Three things from overnight: Henderson deal closed, two new leads came in, your content calendar is on track. One thing needs you — Maya wants approval on next week's campaign."
  - `[See the details]` `[Approve Maya's campaign]`
- Evening: "Wrapping up the day. Your agents handled 47 tasks. Revenue today: $2,400. Nothing urgent for tomorrow — but you've got a follow-up due on the Rivera quote by end of week."
  - `[See today's summary]` `[Set reminder for Rivera]`

**Briefing frequency adapts** to the user's preference (from Neptune calibration). Default: morning + evening. Some users want hourly. Some want daily only.

---

## Smart Chips

### Philosophy

Smart Chips are the user's one-click response to what Neptune surfaces. Each chip maps to a specific action — either navigating somewhere, triggering a Neptune delegation, or recording a decision.

### Chip Variants

| Variant | Purpose | Visual |
|---------|---------|--------|
| **Primary** | The recommended action | Solid fill, department color |
| **Secondary** | Alternative action | Outlined, subtle |
| **Ghost** | Dismiss or defer | Minimal, text-only |

### Chip Actions

When a user clicks a chip:

1. **Navigate** — Goes to a specific page/record (e.g., "See the deal" → CRM deal page)
2. **Delegate** — Tells Neptune to do something (e.g., "Draft the quote" → Neptune assigns to Sales Agent)
3. **Decide** — Records the user's choice (e.g., "Approve it" → Neptune executes the approved campaign)
4. **Dismiss** — Removes the card (e.g., "Not now" → Card dismissed, Neptune files the decision)

### Inline Expansion

After a chip is clicked, the card can expand inline to show Neptune's response:

```
┌─────────────────────────────────────────────┐
│  Alex closed the Henderson deal ($4,200)     │
│  [See the deal]  [Draft case study]          │
│                                               │
│  ── Expanded ──────────────────────────────  │
│  Neptune: "I've asked Maya to draft a case   │
│  study. She'll have it ready by tomorrow.    │
│  Want me to send it to Henderson for          │
│  approval when it's done?"                    │
│                                               │
│  [Yes, auto-send]  [I'll review first]       │
│                                               │
└─────────────────────────────────────────────┘
```

This creates a mini-conversation within the card without leaving the Home feed.

---

## Trust Arc Behavior

The Home feed evolves as the user progresses through the Trust Arc:

### Phase 1: First Days

- **More briefing cards, fewer agent reports** — agents are just getting started
- **More "Decision Required" cards** — Neptune is calibrating, needs more input
- **Onboarding-style cards mixed in** — "Want to connect your Google account? Your agents could do more with access to your calendar and contacts."
- **Greeting is warmer, more explanatory** — "Hey — your agents are getting settled. Here's what they've been up to."

### Phase 2: Weeks 1-4

- **Agent reports become the dominant card type** — agents are producing real work
- **Fewer decision cards** — Neptune is learning what the user approves
- **Opportunity cards start appearing** — Neptune has enough data to spot patterns
- **Greeting shifts to status** — "Morning. Your team handled 23 tasks overnight."

### Phase 3: Months 1-3

- **Feed is lean and strategic** — only what matters surfaces
- **Opportunity and milestone cards increase** — Neptune is proactive, the user is curious
- **Briefing cards are the anchor** — morning standup, evening wrap-up
- **Agent reports only for notable events** — routine work is handled silently
- **Greeting is peer-level** — "Solid week. Revenue's trending up. One thing needs you."

### Phase 4: Months 3+

- **Feed is a curated executive briefing** — 2-4 cards, high signal, no noise
- **Most agent work is invisible** — only escalations and wins surface
- **Strategic opportunities dominate** — Neptune is operating at the user's level
- **Greeting is minimal** — "Morning. All green. One opportunity worth looking at."

---

## Feed Generation Engine

### How Cards Are Created

```
Agent Activity Stream
    + Intelligence Layer signals
    + Neptune's judgment (priority, relevance, urgency)
    + User's Living Profile (what they care about, what they ignore)
    ────────────────────────────────────
    → Neptune Card Engine
    ────────────────────────────────────
    → Prioritized feed (3-7 cards, ranked)
```

### Priority Scoring

Neptune scores each potential card on:

| Factor | Weight | Description |
|--------|--------|-------------|
| **Urgency** | High | Time-sensitive? Overdue? Needs response today? |
| **Impact** | High | Financial impact? Strategic importance? |
| **Novelty** | Medium | Is this new information or a repeat pattern? |
| **User relevance** | Medium | Does this match what the user typically engages with? |
| **Agent confidence** | Low | How confident was the agent in the action? Lower confidence = more likely to surface for review. |

Cards below the threshold are logged but not surfaced. The threshold adjusts based on the user's engagement patterns — if they're ignoring low-priority cards, Neptune raises the bar.

### Card Generation Timing

| Trigger | What Happens |
|---------|-------------|
| **User opens Home** | Neptune generates/refreshes the feed. Fresh every visit. |
| **Significant event** | New card pushed to feed in real-time (via Pusher). |
| **Scheduled briefing** | Morning/evening card generated at configured time. |
| **Agent escalation** | Decision Required card created immediately. |

---

## Relationship to Other Modules

The Home feed is the **hub**. Every card connects to a **spoke** (a specific module):

| Card About... | Links To... |
|--------------|------------|
| Sales activity, leads, deals | CRM page (contact/deal record) |
| Content, campaigns, social | Marketing page (content/campaign record) |
| Invoices, payments, expenses | Finance page (invoice/expense record) |
| Agent performance, workforce | Agents page (agent detail panel) |
| Insights, trends, analytics | Insights page (specific report) |
| Integrations, connections | Connected Apps page |

The user can always act from Home (via smart chips) or drill into the module for deeper context. The feed is designed so that **most daily interactions can happen without leaving Home.** The modules are there for deep dives, not daily operations.

---

## Neptune's Input Zone

### Always Present

The "Talk to Neptune..." input is fixed at the bottom of the Home feed. It's the user's direct line to Neptune for anything not covered by the feed cards.

### Behaviors

- **Quick questions** — "How are my sales looking this week?" → Neptune responds inline below the input
- **Action requests** — "Send a follow-up to Henderson" → Neptune delegates, confirms in the feed
- **Strategic conversations** — "Let's talk about Q4 planning" → Neptune opens full conversation view (may transition to the assistant page or expand inline depending on complexity)
- **Feedback** — "That campaign card was irrelevant" → Neptune adjusts future card generation

### Voice Input (Future)

Same input zone, voice-enabled. User speaks, Neptune responds. The Home feed becomes a voice-first experience for hands-free operation.

---

## Mobile Home Feed

### Key Differences

- Cards are full-width, stacked vertically
- Smart chips wrap (2 per row on small screens)
- Greeting zone is more compact
- Input zone adapts to mobile keyboard
- Inline expansion → bottom sheet for longer responses
- Briefing cards can be summarized as push notifications

### Push Notifications

Neptune can send push notifications for high-priority cards:
- Decision Required cards (urgent)
- Problem cards
- Milestone cards (celebratory)

Notification frequency adapts to user preference. Default: only urgent. User can increase or mute.

---

## Open Questions

1. **Card persistence:** Do cards persist across sessions, or is the feed regenerated fresh each visit? Recommendation: regenerated fresh, but "Decision Required" cards persist until resolved.

2. **Card history:** Can the user scroll back to see yesterday's cards? Or is the feed always "right now"? Recommendation: feed is "right now" by default, with a "View history" option that shows a timeline of past cards.

3. **Multiple users per workspace:** If a team uses GalaxyCo, does each person see a personalized feed? Or the same feed? Recommendation: personalized per user based on their role, Living Profile, and engagement patterns.

4. **Feed empty state:** On a genuinely quiet day with no agent activity and nothing to report — what does the user see? Recommendation: Neptune greeting + "All quiet. Your team is running smoothly. Anything on your mind?" with the input zone.

5. **Card fatigue:** How do we prevent users from becoming numb to cards over time? Recommendation: Neptune's priority threshold rises as the user matures. Phase 4 users see fewer, higher-quality cards.

---

*This spec depends on: `00-philosophy.md` (Trust Arc, modules as departments), `01-intelligence-layer.md` (opportunity signals, demand signals), `02-onboarding-flow.md` (first feed experience), `04-neptune.md` (Neptune's voice, per-module behavior, Read the Room), `05-agents.md` (agent activity stream, agent reports)*
*This spec informs: `06-crm.md` through `11-insights.md` (each module's relationship to the feed), `14-public-site.md` (feed screenshots for marketing)*
