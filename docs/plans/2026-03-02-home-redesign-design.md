# Home Page Redesign — Design Document

**Date**: 2026-03-02
**Status**: Approved
**Goal**: Replace the AI-chatbot-style dashboard with a proactive Neptune feed that surfaces real-world business impact with smart chips for instant action.

## Philosophy

- **AI is silent.** Neptune does the analysis, scoring, and prioritization on the backend. The user never sees "AI" — they see business results.
- **Real-world ROI is visual.** Every card answers: "What happened in my business?" and "What should I do next?"
- **Neptune talks first.** Not a chatbot waiting for input. A business partner who already did the homework.
- **User stays in control.** Smart chips offer graduated autonomy. Default: ask before acting.

## User Persona

The overwhelmed solo operator who wears every hat — plumber, consultant, agency founder. They ARE the sales team, the accountant, the marketer. Home = their command center for the whole business. Design for solo first; it scales naturally to small teams (2-10 people).

## Core Layout

Route: `/dashboard` (renamed to "Home" in navigation)

Three zones, full-width, no sidebar:

```
┌──────────────────────────────────────────────┐
│  GREETING ZONE                               │
│  "Good morning, Alex."                       │
│  (time-aware, personal, one line)            │
├──────────────────────────────────────────────┤
│                                              │
│  FEED ZONE (scrollable)                      │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Card 1: Most important thing           │  │
│  │ [Action chip] [Alternative] [Dismiss]  │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Card 2: Second most important          │  │
│  │ [Action chip] [Alternative]            │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ Card 3: Third thing                    │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  (3-5 cards max. Never overwhelming.)        │
│                                              │
├──────────────────────────────────────────────┤
│  INPUT ZONE (pinned bottom)                  │
│  ┌────────────────────────────────────────┐  │
│  │  Talk to Neptune...                    │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### Key Principles

- **3-5 cards max.** Neptune prioritizes ruthlessly. No information overload.
- **Every card has smart chips.** No card is just information — every one offers action.
- **Cards ordered by impact.** Biggest money/opportunity first.
- **Dismissed cards don't come back** (that session). Neptune learns preferences over time.
- **"Talk to Neptune" input** always available at bottom for free-form conversation.

## Card Types

| Category | When it appears | Example headline | Smart chips |
|----------|----------------|------------------|-------------|
| **Money** | Payment received, invoice overdue, cash flow alert | "2 invoices paid overnight ($3,200)" | `[See details]` `[Send more invoices]` |
| **Lead/Pipeline** | New lead, follow-up due, lead gone cold | "New lead: Kitchen remodel, Frisco" | `[Reach out]` `[Review]` `[Skip]` |
| **Follow-up** | Scheduled follow-up due, proposal awaiting response | "Sarah Chen hasn't responded in 5 days" | `[Send reminder]` `[Call instead]` `[Give it time]` |
| **Campaign** | Campaign sent, results in, engagement spike | "Email campaign hit 18% open rate" | `[See results]` `[Run it again]` |
| **Opportunity** | Market insight, competitor change, seasonal trend | "Roofing season peaks in 3 weeks — prep time" | `[Create campaign]` `[Tell me more]` |
| **Milestone** | Revenue goal hit, 100th contact, streak | "You closed $25K this month — best month yet" | `[See breakdown]` `[Set new goal]` |

### Card Anatomy

```
┌─────────────────────────────────────────────┐
│ 💰  2 invoices paid overnight ($3,200)       │
│                                             │
│ Jackson Roofing ($2,100) and Martinez       │
│ Kitchen ($1,100). Your outstanding          │
│ balance is now $4,800.                      │
│                                             │
│ [See details]  [Send more invoices]         │
└─────────────────────────────────────────────┘
```

- **Line 1**: Icon + bold headline (scannable in 1 second)
- **Lines 2-3**: Brief context (2-3 sentences max, natural language)
- **Bottom**: Smart chips (2-3 max per card, primary action first)

### Smart Chip Design

- **Primary action** (filled/accent): What Neptune recommends
- **Alternatives** (outlined): Other reasonable choices
- **Dismiss** (ghost/subtle): "Not now" or "Skip" — always available but not prominent

## Interaction: Inline Expansion

When a smart chip is tapped, the card expands inline:

```
┌─────────────────────────────────────────────┐
│ 👥  New lead: Kitchen remodel, Frisco        │
│                                             │
│ Came through your website. Matches your     │
│ ideal client profile.                       │
│                                             │
│ [Reach out] ← tapped                        │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Done. I drafted an intro email and      │ │
│ │ scheduled it for 9am tomorrow.          │ │
│ │                                         │ │
│ │ [Edit draft]  [Send now instead]  [Undo]│ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

- Card expands smoothly below with Neptune's confirmation
- Follow-up chips appear for next actions
- If detailed view needed (contact record, campaign stats), slide-in panel opens from right
- User never leaves Home unless they explicitly navigate

## Default Autonomy

Neptune asks before acting by default. User can gradually unlock more autonomy:
- Low-stakes actions: Neptune suggests, user confirms via chip
- Over time: user can say "just handle follow-ups like this" and Neptune auto-acts + notifies
- High-stakes (spending money, contacting new leads): always ask first

## Day 1 Experience (No Data)

New user has zero contacts, zero revenue data, zero campaigns. The feed is never empty.

```
┌──────────────────────────────────────────────┐
│  Welcome to Galaxy, Alex.                    │
│  I'm Neptune — your business partner.        │
│  Let's get started.                          │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ 🏢  Tell me about your business        │  │
│  │                                        │  │
│  │ What do you do, who do you serve,      │  │
│  │ and what's your biggest challenge       │  │
│  │ right now?                             │  │
│  │                                        │  │
│  │ [Roofing/Construction]                 │  │
│  │ [Marketing/Agency]                     │  │
│  │ [Service business]                     │  │
│  │ [Something else]                       │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │ 📱  Connect your tools                 │  │
│  │                                        │  │
│  │ I can pull in your contacts, invoices, │  │
│  │ and emails so I can start helping      │  │
│  │ right away.                            │  │
│  │                                        │  │
│  │ [Connect QuickBooks] [Connect Google]  │  │
│  │ [Skip for now]                         │  │
│  └────────────────────────────────────────┘  │
│                                              │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐  │
│  │  Talk to Neptune...                    │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### Progressive Enrichment

| Stage | Feed content |
|-------|-------------|
| **Day 1** | Business type selection, tool connections, market-based tips |
| **Day 3** | First contacts imported → lead cards appear |
| **Week 1** | Enough data for pattern recognition → opportunity cards |
| **Week 2+** | Financial data flows in → money cards, ROI tracking |
| **Month 1+** | Full intelligence → all card types, personalized insights |

## Codebase Changes

### New Components

| Component | Purpose |
|-----------|---------|
| `HomePage` | New page component replacing `DashboardV2Client` |
| `NeptuneFeed` | Scrollable feed container, manages card ordering |
| `NeptuneFeedCard` | Individual card with expand/collapse |
| `SmartChipBar` | Chip container with primary/secondary/dismiss patterns |
| `InlineExpansion` | Expanded response area within a card |
| `SlidePanel` | Right-side panel for detailed views |
| `/api/home/feed` | Returns prioritized cards for this workspace |
| `/api/home/action` | Executes a smart chip action, returns confirmation |

### Removed

| Component | Reason |
|-----------|--------|
| `WorkspacePanel` (Compass/Vision/Boards) | Replaced by feed |
| `DashboardCustomize` page | Neptune curates the feed — no widget toggles |
| `DashboardActivityFeed` | Activity is implicit in feed cards |
| Stats widgets (agents, contacts, tasks) | Vanity metrics replaced by impact cards |

### Migrated

| Feature | From | To |
|---------|------|----|
| Quick Actions | Widget grid | Smart chips on feed cards (contextual) |
| Roadmap/Checklist | Sidebar widget | Day-1 onboarding cards in feed |
| Real-time updates | Pusher → stats counters | Pusher → new cards at top of feed |
| Next-step detection | `getDashboardData()` | Card prioritization engine |

### Card Prioritization Engine (Backend)

```
Inputs:
  - CRM: new leads, overdue follow-ups, hot leads
  - Finance: payments received, invoices overdue, cash flow
  - Campaigns: recent results, engagement spikes
  - Market: industry trends, seasonal patterns
  - User behavior: dismissed cards, preferred actions

Algorithm:
  1. Score each potential card by urgency × impact × recency
  2. Deduplicate (don't show 5 follow-up cards — summarize)
  3. Cap at 5 cards
  4. Order by score (highest first)
  5. Cache for session (don't recalculate on every page load)
```

## Mobile Experience

The feed layout is inherently mobile-first:
- Cards slightly more compact on mobile (shorter context text)
- Smart chips wrap to 2 rows if needed on small screens
- Slide panel becomes a bottom sheet on mobile
- "Talk to Neptune" input uses native keyboard
- Greeting zone collapses to just the name

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Time to first meaningful action | User must type a question | 0 seconds (cards ready) |
| Daily return rate | Unknown | Users check Home like text messages |
| Cards acted on vs dismissed | N/A | >50% action rate |
| User needs to leave Home | Frequent | Rare (most actions inline) |

## Research Sources

- [Small business pain points](https://www.gogravity.com/blog/overcoming-pain-points-small-business) — 14 hrs/week on admin
- [Cash flow concerns](https://vervology.com/insights/top-pain-points-for-small-business-owners/) — 78% lose sleep over cash flow
- [Dashboard best practices](https://databox.com/dashboard-examples/small-business) — 5-7 metrics max, 3x tracking habit formation
- [Proactive AI in 2026](https://www.alpha-sense.com/resources/research-articles/proactive-ai/) — moving beyond the prompt
- [Agentic AI UX patterns](https://www.smashingmagazine.com/2026/02/designing-agentic-ai-practical-ux-patterns/) — autonomy dial, approval patterns
- [AI operating systems evolution](https://www.hey-steve.com/insights/the-evolution-of-ai-operating-systems-in-2026) — from assistants to agents
