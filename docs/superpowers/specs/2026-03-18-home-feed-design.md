# GalaxyCo 3.0 — Home Feed Design Spec

**Status:** Draft
**Date:** 2026-03-18
**Supersedes:** `docs/specs/galaxyco-vision/03-home-feed.md`, `docs/plans/2026-03-02-home-redesign-design.md`

---

## 1. The Paradigm: Neptune's Office

The Home screen is not a page. It's a **place**. You walk into Neptune's office every time you open GalaxyCo.

The screen is dominated by a single, generous conversational surface. No sidebar. No widget grid. No card layout. Just Neptune — present, aware, and ready to speak.

### Arrival

When the user opens GalaxyCo, there's a brief moment of composure (200–300ms of ambient presence), then Neptune addresses them. Not a canned greeting — a contextual opening that reflects what's actually happening:

> *"Morning. Your sales team had a strong night — Alex closed Henderson. One thing needs you: Jordan's waiting on pricing for a custom quote."*

Or on a quiet day:

> *"All quiet. Team handled everything overnight. I'll be here when you need me."*

### Inline Visuals

Neptune's words appear as natural language in a conversational thread. When a statement warrants a visual — a revenue figure, a trend, a comparison — it materializes **inline**, embedded in the conversation like a figure in a book.

Following the paradigm proven by Claude Desktop's "Custom Visuals in Chat" (March 2026):

- **Neptune decides** when a visual helps (or the user asks)
- **Rendered inline** in the conversation thread as interactive HTML/SVG
- **Interactive** — hover for detail, click to drill, expand to focus
- **Ephemeral** — they serve the current conversation, not a permanent layout
- **Iterative** — "break that down by agent" and Neptune rebuilds it in-place

Neptune takes this further than Claude Desktop because it has *business context* — it's not generating charts from a prompt, it's illustrating its own awareness of the user's company.

### What's NOT Here

- No notification badges or counts
- No sidebar navigation (modules accessible via minimal top nav or command palette)
- No static widgets, metric tiles, or chart grids
- No "card" metaphor — Neptune speaks in prose, not cards
- No traditional loading states — see Section 9 (Generation Latency) for what the user sees during generation

**The mental model:** You don't check your dashboard. You check in with Neptune.

---

## 2. Neptune's Voice: The Conversational Engine

Neptune doesn't template. It **speaks.**

Every message from Neptune is generated natural language — contextual, personal, calibrated to the user. No "Card Type: Agent Report" leaking into the UI. The user sees prose.

### The Opening Cadence

Neptune's first message on arrival follows a consistent *rhythm*, not a template:

1. **Acknowledge** — a single, human beat ("Morning." / "Welcome back." / "Quick one.")
2. **Lead with what matters most** — the highest-priority thing, in plain language
3. **Layer in context** — supporting details, secondary items, woven naturally
4. **Close with invitation** — implicit or explicit opening for the user to respond

**Busy morning:**
> *"Morning. Alex closed Henderson last night — $4,200, clean deal. Jordan's sitting on a custom pricing request from a lead that looks strong, needs your call on the number. Otherwise, the campaign emails are performing above average and I've left them running."*

**Quiet day:**
> *"All quiet. Team handled everything. The only thing on my radar is a contract renewal coming up Thursday — I'll prep the details if you want them."*

**Problem:**
> *"Heads up — invoice emails are bouncing for two clients. Looks like a domain verification issue. I can walk you through fixing it, or I'll handle it if you give me the DNS access."*

### Inline Visual Integration

When Neptune judges a visual would help, it appears woven into the prose:

> *"Revenue's been climbing steadily —"*
> [inline chart: 4-week revenue trend, interactive, hover for daily figures]
> *"— best trajectory since you started. The Henderson close pushed you past your monthly target two days early."*

The visual is part of the sentence, not a separate element.

### Signal Classifications (Backend Only)

The six signal types — Agent Report, Decision Required, Opportunity, Problem, Milestone, Briefing — still exist as **backend intelligence categories** that inform Neptune's priority scoring. They never surface as UI elements. Neptune's narrative engine uses them to determine *what* to say and in *what order*, then expresses it in natural language.

### Feedback Signals

After Neptune speaks, subtle interaction cues let the user shape Neptune's behavior over time:

- **Engagement signals** — Did the user respond to this topic? Expand it? Ignore it?
- **Pace signals** — Scroll depth, time-to-response
- **Explicit micro-feedback** — See Section 6 (Learning Engine) for the full micro-feedback specification.

---

## 3. The Trust Arc in Neptune's Voice

Neptune starts opinionated and vocal (Phase 1 proves competence), then calibrates to the user over time.

| Phase | Voice | Proactivity | Detail Level |
|-------|-------|-------------|--------------|
| **1 — Proving** | Confident but explains reasoning. "I'd recommend X because..." | High — leads every arrival | Rich — shows its work |
| **2 — Building** | Action-oriented. "I've done X. Here's the result." | High — but calibrating to preferences | Moderate — less justification |
| **3 — Trusted** | Bold, opinionated. "I went ahead and did X." | Selective — speaks when it matters | Lean — trusts user to ask for more |
| **4 — Partner** | Strategic peer. "I've been thinking about next quarter..." | Strategic — initiates big-picture conversations | Variable — matches the moment |

---

## 4. The Interaction Model: Conversation as Interface

The user's primary interaction with Home is **talking to Neptune**. Not clicking cards. Not navigating widgets. Typing (or eventually speaking) in a persistent input field.

### The Input Field

Always visible at the bottom. "Talk to Neptune..." placeholder. This is the command line, the search bar, the action trigger, and the conversation thread — all in one surface. No mode switching.

What the user can do from this single input:

- **Respond to Neptune** — "Go with $3,200 on that custom quote"
- **Ask anything** — "How did last week compare to the week before?"
- **Give commands** — "Draft a follow-up email to Henderson"
- **Navigate** — "Open the CRM" / "Show me Jordan's pipeline"
- **Provide feedback** — "Less detail on campaigns in the morning"

Neptune interprets intent and responds appropriately — sometimes with words, sometimes with an inline visual, sometimes by navigating the user to a module, sometimes by delegating to an agent and confirming.

### Command Palette (Cmd+K)

For power users who think faster than they type prose. A Raycast/Linear-style command palette that surfaces:

- Quick navigation to any module
- Recent conversations with Neptune
- Common actions ("Create invoice," "Add lead," "Launch campaign")
- Search across the entire business context

The command palette and the conversation input are **two expressions of the same interface** — fast structured access vs. natural language. Both route through Neptune's intelligence layer.

### Inline Actions

When Neptune mentions something actionable, the action is embedded in the conversation as **natural language affordances**:

> *"Jordan's waiting on pricing for that custom quote. Want me to pull up the lead details, or do you already have a number in mind?"*

The user responds in natural language. Neptune executes. If Neptune needs structured input (a specific dollar amount, a yes/no), it asks clearly. No forms. No modals. Conversation.

### Module Handoff

Some things genuinely need a richer surface — working a full pipeline, editing an invoice line by line, building a campaign flow. Neptune recognizes this and hands off gracefully:

> *"This one's easier to work in the CRM directly. I've opened Jordan's deal — I'll be there if you need me."*

Neptune navigates the user to the module. The conversation doesn't end — Neptune is contextually present in every module (a collapsed input at the bottom of every page). But the module's purpose-built UI takes over for deep work.

**The handoff principle:** Neptune is brilliant at synthesis, prioritization, and action. Modules are brilliant at manipulation, detail work, and visualization. Neptune knows the difference and never tries to be a spreadsheet.

### Real-Time Presence

Neptune doesn't only talk at arrival. During a session:

- If something happens mid-session (a deal closes, an email bounces), Neptune can interject — but only if it's important enough to interrupt
- Interruption threshold rises over time as Neptune learns the user's focus patterns
- Low-priority updates queue silently and surface at the next natural break or next arrival

---

## 5. The Environment: Ambient State

The Home screen isn't just Neptune's words. The **space itself** communicates.

### Ambient Presence

When Neptune isn't actively speaking, the environment has a subtle living quality:

- A gentle luminous pulse near the input field — Neptune is present, aware, listening
- Subtle atmospheric shifts that reflect business state (warmer tones when healthy, cooler/sharper when something needs attention)
- The absence of clutter IS the design. Negative space signals confidence. A busy screen means Neptune failed to prioritize.

### Three States, Not Three Zones

| State | When | What It Feels Like |
|-------|------|---------------------|
| **Active conversation** | User and Neptune are talking | Full conversational thread, inline visuals, input field is the focus |
| **Ambient presence** | Neptune has spoken, user hasn't engaged yet | Neptune's opening message in the space. Calm. Gentle pulse. Room to breathe. |
| **At rest** | Nothing happening, "all quiet" | Minimal. Neptune's presence felt but not demanding. A single line and the input field. Almost empty — intentionally. |

### No Persistent UI Chrome

No metric bars, no status strips, no "last updated" timestamps. The environment is clean by default. If Neptune needs to show a number, it shows it *in conversation*. When the conversation scrolls up, the space returns to calm.

### Time-of-Day Awareness

Neptune's environment subtly shifts across the day:

- **Morning** — slightly warmer, Neptune's opening is briefing-oriented
- **Midday** — neutral, Neptune is responsive rather than proactive
- **Evening** — softer, Neptune leans toward summary and wind-down

These are defaults that Neptune calibrates to the user's actual work patterns over time.

### Module Transitions

When the user navigates to CRM, Finance, or any module, the transition feels like **walking from Neptune's office into a department** — not a jarring page change. Neptune's presence carries over (collapsed input at the bottom), but the environment shifts to the module's purpose-built surface. Coming back to Home feels like returning to Neptune's space.

---

## 6. The Learning Engine: How Neptune Evolves

Neptune starts opinionated. It ends personalized.

### Three Feedback Channels (Ranked by Signal Strength)

**1. Behavioral (strongest, passive)**

Neptune watches what the user *does*, not what they say they want:

- Which topics does the user respond to vs. scroll past?
- How quickly does the user engage after arrival?
- When the user navigates to a module unprompted, what were they looking for that Neptune didn't surface?
- Which inline visuals get hovered/expanded vs. ignored?
- What time does the user actually show up?

**2. Conversational (strong, organic)**

Neptune asks calibration questions *naturally*, never as surveys:

> *"I've been leading with sales updates — want me to keep that up, or is marketing more top of mind right now?"*

Rare — maybe once a week. Always in context. Feels like a chief of staff checking in, not a product asking for ratings.

**3. Explicit micro-feedback (available, never pushed)**

A subtle affordance on any Neptune message — a barely-visible `···` that reveals "more like this" / "less like this" on hover. Never prominent. Never gamified. Just *there*.

### Calibration Dimensions

| Dimension | Phase 1 Default | Learns Toward |
|-----------|----------------|---------------|
| **Verbosity** | Rich, shows reasoning | User's preferred density |
| **Topics** | Everything, weighted by urgency | User's actual priorities |
| **Proactivity** | High — leads every arrival | User's tolerance for unprompted input |
| **Visual frequency** | Moderate — charts when helpful | User's preference for data vs. narrative |
| **Briefing rhythm** | Morning-focused | User's actual work pattern |
| **Detail level** | Explains the "why" | Some users want just the "what" |
| **Interruption threshold** | Only urgent things mid-session | Calibrated to focus patterns |

### Constraints

- Neptune never becomes passive — even Phase 4 users get honest assessments when something matters
- Learning preferences doesn't mean becoming a yes-man — Neptune calibrates *style*, not *substance*

### Anti-Patterns Neptune Avoids

- Never manufactures urgency to seem useful
- Never inflates good news or softens bad news
- Never gamifies feedback ("You've completed 5 actions today!")
- Never shows a "personalization score" or learning progress bar
- Never asks for feedback more than once on the same topic

---

## 7. Conversation Lifecycle

### Session Boundaries

A "session" begins when the user arrives at Home and ends when they leave GalaxyCo or are idle for 30+ minutes. Each arrival triggers a fresh contextual opening from Neptune — it does not resume mid-sentence from a prior session.

### What Persists

- **Conversation history** — All prior sessions are stored and retrievable. The user can scroll up to see previous conversations, or ask Neptune: "What did you tell me yesterday?" Neptune has full recall.
- **Action confirmations** — If Neptune said "I went ahead and did X," that message persists in history. The action's *result* lives in the relevant module (CRM, Finance, etc.), but Neptune's communication about it remains in the conversation log.
- **Inline visuals** — Stored as specs (data + chart type), not rendered HTML. They re-render when the user scrolls back to them, using current styling but historical data. If the underlying data source is unavailable, Neptune shows the visual with a "historical snapshot" indicator.

### What Regenerates

- **The opening message** — Every arrival gets a fresh contextual opening. Neptune never replays yesterday's briefing.
- **Ambient state** — The environment resets to reflect the current business state, not the last session's state.

### History Access

Users can scroll up in the conversation thread to see prior sessions. Sessions are separated by a subtle date divider. Neptune can also retrieve history on request: "What was that thing about Henderson last week?" Neptune searches its conversation log and responds in natural language.

### Storage

Conversations are stored per-user, per-workspace. Each message is a structured record: timestamp, role (neptune/user), content blocks (text, visual spec, action affordance), session ID. Indexed for Neptune's own recall and for the behavioral learning engine.

---

## 8. Multi-User Behavior

GalaxyCo targets agencies with small teams. Multiple users share a workspace but each has their own relationship with Neptune.

### Per-User Personalization

- **Separate conversation threads** — Each user has their own conversation history with Neptune. User A's morning briefing is different from User B's.
- **Per-user voice calibration** — Neptune's Trust Arc phase, verbosity preference, topic priorities, and interruption threshold are tracked per user.
- **Per-user behavioral signals** — Engagement patterns, preferred topics, and micro-feedback are individual.

### Shared Context, Different Perspectives

Neptune draws from the same workspace data (CRM, Finance, campaigns, agents) but tailors what it surfaces based on each user's role and demonstrated interests:

- An **owner** sees revenue, strategic opportunities, and cross-department summaries
- A **sales member** sees their pipeline, their leads, their agent activity
- An **admin** sees operational health, team performance, system issues

Neptune infers this from the user's Clerk role and behavioral signals — no explicit configuration needed.

### Concurrent Sessions

If two users are in Home simultaneously, they see completely independent Neptune conversations. Neptune is aware of both sessions but never cross-references ("Your colleague just approved that quote" is fine; "I told Sarah the same thing" is not).

---

## 9. Degradation and Edge Cases

### Generation Latency

Neptune's contextual opening requires LLM generation + business data retrieval. Realistic latency: 1–5 seconds. During this time:

1. **Ambient presence activates immediately** (< 100ms) — the luminous pulse, the environment, the input field. The user knows they're in Neptune's space.
2. **Text streams progressively** — Neptune's response renders token-by-token as it generates, creating the natural feeling of Neptune *composing a thought*. Not a loading bar. Not a spinner. A living, typing presence.
3. **Inline visuals render after the surrounding text** — the text flows first, then the chart materializes in-place once data is ready.

The ambient pulse IS the loading state. The streaming text IS the progress indicator. These are not workarounds — they're intentional design that makes generation feel like *thought*, not *loading*.

### LLM Failure

If the LLM call fails entirely:

- Neptune's ambient presence remains (the environment doesn't break)
- A composed fallback message appears: *"Give me a moment — I'm having trouble pulling everything together. You can ask me anything in the meantime, or head to any module directly."*
- The input field remains fully functional — the user can still type, and Neptune retries on their next message
- The command palette (Cmd+K) is always available as a non-AI fallback for navigation and actions

### Partial Data Availability

If some data sources are unavailable (e.g., CRM is reachable but Finance API is timing out):

- Neptune speaks about what it knows and omits what it doesn't — without calling attention to the gap unless it's material
- If the gap IS material (e.g., can't pull revenue data for the morning briefing), Neptune says so honestly: *"I can't reach your finance data right now — I'll update you when it's back. In the meantime, your sales team had a strong night..."*

### Factual Errors

Neptune can be wrong. The user's recourse:

- Correct Neptune in conversation: "That wasn't Henderson, that was the Morrison deal." Neptune acknowledges, corrects, and learns.
- The micro-feedback affordance ("less like this") also signals inaccuracy to the learning engine.
- Critical business actions (sending emails, changing pricing, closing deals) always require explicit user confirmation — Neptune never executes irreversible actions on a wrong assumption.

### Empty Workspace (New User)

Before any agents have produced work or data exists in modules, Neptune's opening reflects this honestly:

> *"Welcome. I'm getting set up — your agents are starting their first tasks. I'll have something to show you soon. In the meantime, want to tell me what's most important to you right now?"*

Neptune never fabricates activity. An empty workspace gets an honest, warm, forward-looking message.

---

## 10. Conversation Payload Structure

### Conceptual Schema

Neptune's conversation endpoint returns a stream of **content blocks**, not a flat string. Each block has a type that the frontend renders appropriately:

```typescript
type ContentBlock =
  | { type: 'text'; content: string }
  | { type: 'visual'; spec: VisualSpec }
  | { type: 'action-affordance'; prompt: string; actions: ActionOption[] }
  | { type: 'module-link'; module: string; entity?: string; label: string }

type VisualSpec = {
  chartType: 'line' | 'bar' | 'metric' | 'comparison' | 'trend'
  data: Record<string, unknown>
  interactive: boolean
  title?: string
}

type ActionOption = {
  label: string
  intent: string
  args?: Record<string, unknown>
  requiresConfirmation?: boolean
}

type NeptuneMessage = {
  id: string
  sessionId: string
  timestamp: string
  role: 'neptune' | 'user'
  blocks: ContentBlock[]
}
```

### Delivery Model

- **Streamed** — Neptune's responses stream token-by-token via SSE (Server-Sent Events)
- **Text blocks** stream progressively as tokens generate
- **Visual blocks** arrive as complete specs once data is assembled, inserted at the appropriate position in the text stream
- **Action affordances** arrive inline with text, rendered as natural language with interactive elements

### Command Palette Scope (v1)

The command palette is scoped for launch:

- **Navigation** — Jump to any module (CRM, Finance, Marketing, etc.)
- **Recent actions** — Last 10 Neptune-executed actions, re-invocable
- **Quick actions** — Create invoice, add lead, launch campaign (top 10 most-used)
- **Module search** — Search contacts, deals, invoices by name/number

Full cross-business semantic search is a future enhancement, not a v1 requirement.

---

## 11. Mobile: Neptune in Your Pocket

Same relationship, different posture. Mobile Neptune is not a shrunken desktop — it's Neptune adapting to context.

### Arrival on Mobile

Neptune's opening is **shorter and sharper**:

> *"Alex closed Henderson — $4,200. Jordan needs a pricing call. Want me to pull up the details?"*

Inline visuals still appear but are **simpler** — a single metric with a trend arrow rather than a full interactive chart. Tap to expand to the full visualization.

### Push Notifications as Neptune's Voice

Notifications aren't system alerts. They're Neptune talking to you outside the app:

> *"Quick — Jordan's lead just opened your proposal for the third time. Might be ready to close."*

Not: "New activity in CRM: Lead #4521 viewed document."

Neptune writes every notification. They sound like Neptune. They carry the same priority intelligence.

### Notification Tiers

| Tier | Behavior | When |
|------|----------|------|
| **Interrupt** | Vibrate, sound, lock screen | Genuinely time-sensitive decisions. Rare. |
| **Surface** | Silent push, notification center | "You'll see this next time you glance at your phone" |
| **Queue** | No push at all | Neptune holds it for your next arrival. Most things live here. |

The ratio shifts with the Trust Arc. Phase 1 has more Interrupt notifications (proving responsiveness). Phase 4 has almost none (Neptune handles it and tells you later).

### Voice (Future)

Neptune's natural language design makes audio briefings straightforward — the morning briefing is already written as something that sounds good read aloud. Voice is a future modality, not a launch feature, but the conversational architecture supports it natively.

---

## 12. What Changes From the Previous Spec

The existing 03 spec and Phase 1 implementation laid good groundwork. Here's what survives, what dies, and what transforms.

### Survives

- **Six signal classifications** (Agent Report, Decision Required, Opportunity, Problem, Milestone, Briefing) — become backend intelligence categories, not UI card types
- **Priority scoring engine** (urgency × impact × novelty × user relevance) — now feeds narrative decisions instead of card ordering
- **Trust Arc evolution model** — directly adopted, governs Neptune's voice calibration
- **Validation schemas and API structure** — adaptable to the new paradigm
- **Greeting Zone spirit** — Neptune's contextual opening replaces the static greeting

### Dies

- **Card UI entirely** — `NeptuneFeedCard`, `SmartChipBar`, card anatomy, department color indicators, chip variants. Neptune speaks in prose.
- **Three-zone layout** — Greeting / Feed / Input replaced by a single fluid conversational surface
- **Card categories as UI elements** — no icons, colored indicators, or category badges
- **Smart chips as interaction pattern** — replaced by natural language affordances
- **SlidePanel** — detail views happen inline or via module handoff
- **Feed persistence model** — Neptune regenerates contextually every arrival
- **Static card count** (3–7 cards) — Neptune decides how much to say based on what's happening

### Transforms

| Old Concept | New Form |
|------------|----------|
| Feed endpoint returning cards | Conversation endpoint returning Neptune's contextual narrative |
| Card prioritization engine | Narrative prioritization — same algorithm, outputs topic ordering for prose |
| Smart chip actions | Natural language action execution via conversation |
| Card inline expansion | Conversation continues — user asks for more, Neptune provides |
| Feed refresh on arrival | Neptune generates fresh contextual opening per arrival |
| Department color system | Neptune names the department in prose when relevant |

### Implementation Impact

- **Deprecated:** `NeptuneFeedCard.tsx`, `SmartChipBar.tsx`, `SlidePanel.tsx`
- **Rewritten:** `NeptuneFeed.tsx` → conversational interface
- **Simplified:** `HomePage.tsx` → Neptune's environment container
- **Restructured:** Feed API → conversational payload
- **New:** conversation history, behavioral signal collection, preference engine
- **Preserved (adapted):** validation schemas, priority scoring, action executor

---

## 13. Open Questions

These are unresolved decisions that need answers during implementation planning or design review:

1. **Conversation retention policy** — How long are conversation histories stored? Forever? Rolling 90 days? User-configurable?
2. **Ambient visual language** — The atmospheric shifts (Section 5) need a concrete visual spec before implementation. What exactly changes — background gradients, accent hue, particle density?
3. **Voice modality timeline** — When does voice input/output become a priority? Is it Phase 2 of implementation or a separate initiative?
4. **Neptune's cross-module memory** — When Neptune follows the user into CRM, does that conversation merge with the Home thread or remain module-scoped?
5. **Offline/degraded mobile** — What does mobile Neptune look like with poor connectivity? Cached last briefing? Offline-capable command palette?
6. **Visual data freshness** — When a user scrolls back to a historical inline visual, should the data be a frozen snapshot from generation time, or should it re-query for current data? Impacts storage model and the "historical snapshot" indicator behavior.

---

## Research Foundation

This spec was informed by analysis of current products and UX research (March 2026):

**Key references:**
- Claude Desktop "Custom Visuals in Chat" (March 2026) — inline interactive HTML/SVG in conversation
- NotebookLM 3-panel UI (Google, 2025–2026) — context-grounded AI interaction
- Pi by Inflection / ustwo (2023–2025) — emotional intelligence in AI relationships
- Dynamic Island (Apple, 2022–present) — contextual, fluid UI surfaces
- AG-UI Protocol (CopilotKit, 2026) — generative UI for agentic systems
- Granola (2025–2026) — selective AI visibility, "partial autonomy" concept
- Linear/Superhuman — keyboard-first, speed-is-UX principles
- Perplexity Discover — AI-curated editorial home surface
- GitHub Copilot Workspace — structured AI collaboration with steering points
- Limitless/Rewind (acquired by Meta, Dec 2025) — ambient intelligence capture
- Michal Malewicz "End of Dashboards" (Nov 2025) — the anti-dashboard movement
- NNGroup (2025–2026) — autonomous motivation, needy design anti-patterns, feature richness research

**Design principles derived from research:**
1. Context-first, not prompt-first
2. Fluid surfaces, not fixed zones
3. Relationship, not tool
4. Selective visibility
5. Generative, not templated

---

## Spec Dependencies

**Depends on:**
- `00-philosophy.md` — Core principles (Neptune is the product, Iceberg Principle, Trust Arc, modules as departments)
- `01-intelligence-layer.md` — Living Profile feeds Neptune's contextual awareness
- `04-neptune.md` — Neptune's personality, voice, delegation model, autonomy dial
- `05-agents.md` — Paperclip engine (agent activity data that Neptune surfaces)

**Informs:**
- `06-crm.md` — Neptune's contextual presence in CRM module
- `07-finance.md` — Neptune's contextual presence in Finance module
- `08-marketing.md` — Neptune's contextual presence in Marketing module
- `12-settings.md` — Neptune preference controls, personalization overrides
