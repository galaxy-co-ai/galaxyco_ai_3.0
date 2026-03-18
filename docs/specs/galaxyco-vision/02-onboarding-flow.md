# 02 — Onboarding Flow

> From stranger to running company. The sign-up form, the Activation Search, Neptune's first conversation, workforce assembly, and the moment the user realizes this isn't like anything they've used before.

---

## Vision

Traditional SaaS onboarding is a form → a wizard → an empty dashboard → "now what?" GalaxyCo's onboarding is a conversation with someone who already did their homework. The user doesn't configure a tool. They confirm what Neptune already found, and a company assembles around them as they talk.

By the end of the first session, the user has a working business with agents in their seats. Not "set up" — *working*.

---

## The Flow (End to End)

```
Landing Page → Sign Up Form → Activation Search (background) → Neptune Intro →
Conversation (confirm/correct) → Workforce Assembly (concurrent) → First Value Moment →
Home Feed (live, with agents working)
```

Total time from "Create Account" to "agents are working": **under 10 minutes.**

---

## Step 1: Sign-Up Form

### Design Principle

Bare minimum friction. The only required field that's non-standard is the company URL — because it triggers the Activation Search. Everything else Neptune can learn through conversation.

### Required Fields

| Field | Why |
|-------|-----|
| **Email** | Account identity + Clerk auth |
| **Password** | Clerk auth |
| **Company URL** | Triggers Activation Search. This is the key to the magic. |

### Optional Fields (Subtle, Not Required)

Below the required fields, a subtle expandable section or inline ghost-text fields. Visual treatment makes it clear these are optional — no asterisks, no required labels. Placeholder text signals helpfulness, not obligation.

| Field | Placeholder Text | Why It Helps |
|-------|-----------------|-------------|
| **Company name** | *"We'll find it from your URL"* | Saves Neptune a confirmation step |
| **Your role** | *"e.g., Founder, Marketing Director"* | Neptune tailors first conversation to their perspective |
| **Team size** | *"Just you? A small team?"* | Informs workforce design |
| **What's your biggest challenge?** | *"Optional — gives Neptune a head start"* | Seeds Neptune's first strategic question |

### Visual Treatment

- Required fields are prominent, clean, minimal
- Optional section is visually quieter — lighter text, slightly indented, or behind a gentle "Help Neptune get started faster" expandable
- No multi-step wizard, no progress bar, no "Step 1 of 5"
- Single page. Submit button says something like **"Let's go"** — not "Create Account" or "Start Free Trial"
- After submit, transition to a loading state while Activation Search runs

### What Happens on Submit

1. Clerk creates user account (email + password)
2. Workspace is provisioned
3. **Activation Search triggers** with the company URL (and any optional fields provided)
4. User sees a brief transition state (see Step 2)

---

## Step 2: The Activation Bridge

### What's Happening

While the user waits, the Intelligence Layer is running the Activation Search (defined in `01-intelligence-layer.md`):

1. Search Deep Library for existing dossier
2. Run real-time enrichment to fill gaps
3. Synthesize into Neptune-ready dossier with conversation seeds
4. Score dossier completeness (green/yellow/red)

### What the User Sees

NOT a loading spinner. NOT "Setting up your workspace..." with a progress bar.

The user sees a **brief, alive transition** that hints at what's happening without revealing the machinery. Options:

**Option A: The Arrival**
A clean, atmospheric screen — GalaxyCo's visual identity — with subtle animated text that feels like Neptune is preparing:

> *"Getting to know your business..."*
> *(2-3 seconds later)* *"Almost ready."*

Then the screen transitions to Neptune's conversation view.

**Option B: The Quick Reveal**
If the dossier was already in the Deep Library (hot prospect), skip any loading entirely. The user clicks "Let's go" and is immediately in conversation with Neptune. The Activation Search completed before they even signed up.

**Option C: Progressive Entry**
The transition screen shows very subtle signals of intelligence gathering — not a checklist, but organic animation. A globe rotating, connection lines drawing, abstract data visualization. Purely aesthetic, not literal. Lasts 5-15 seconds.

**Recommendation:** B when possible (instant), A as fallback (brief, clean). Never C — too theatrical. The magic isn't in showing the research happening; it's in Neptune already having the answers.

### Timing Targets

| Scenario | Target Time | User Experience |
|----------|-------------|----------------|
| Dossier exists (hot prospect) | < 3 seconds | Instant — straight to Neptune |
| Dossier exists (warm, needs gap-fill) | 5-10 seconds | Brief "Getting to know your business..." |
| No dossier (brand new, full research) | 30-90 seconds | Slightly longer bridge, Neptune starts with partial data and enriches during conversation |

If enrichment takes >90 seconds, Neptune starts the conversation with whatever it has. Background enrichment continues and Neptune incorporates new data as it arrives mid-conversation. The user should never wait more than 90 seconds.

---

## Step 3: Neptune's First Conversation

### The Most Important Moment in the Product

This is where trust is won or lost. The user just signed up for another SaaS tool. They expect a wizard, a tutorial, or an empty dashboard. Instead, they get a conversation with someone who already knows about their business.

### Conversation Structure

The first conversation follows a deliberate arc. Neptune has conversation seeds from the Activation Search (see `01-intelligence-layer.md`) that guide the flow.

#### Opening (0-30 seconds)

Neptune greets and immediately demonstrates knowledge. No "Welcome to GalaxyCo!" No "Let me tell you about our features."

**Green dossier (7+ categories):**
> "Hey — I've been looking into [Company Name]. Looks like you're running a [subVertical] focused on [positioning]. [Team size context]. That sound right?"

**Yellow dossier (4-6 categories):**
> "Hey — I did some digging on [Company Name]. I can see you're in the [industry] space, [one specific detail from scrape]. Tell me a bit more about what you do day-to-day."

**Red dossier (<4 categories):**
> "Hey — tell me about [Company Name]. I want to make sure I understand your business before I start building anything."

In all cases, Neptune is direct, warm, and immediately substantive. No fluff.

#### Confirmation Phase (1-3 minutes)

Neptune walks through what it found, framed as confirmations — not information dumps.

**Pattern:** State what Neptune found → ask if it's right → user confirms or corrects → Neptune adjusts model → next confirmation.

Example flow for a marketing agency:

1. **Identity:** "You're a digital marketing agency in Austin, focused on [services]. About [team size] on the team. Right?"
   - User confirms → brick laid
   - User corrects → Neptune adjusts, asks follow-up

2. **Online presence:** "Your Instagram is your strongest platform — solid engagement. And your website is clean, good positioning. Is social where most of your leads come from?"
   - Opens a door for the user to share their sales model

3. **Competitive context:** "Your market's competitive — I see [Competitor A] and [Competitor B] in your space. How do you differentiate?"
   - Uses competitive intel without naming it as such
   - Invites the user to share their self-perception vs. market reality

4. **Pain point probe:** "A lot of agencies your size tell me [demand signal pain point] is a constant headache. Does that resonate?"
   - Uses Demand Signal Agent data, not company-specific intel
   - If it resonates → Neptune has a direct path to value
   - If it doesn't → Neptune learns and pivots

Each confirmation accomplishes two things simultaneously:
- **Validates Neptune's model** (data accuracy)
- **Builds user trust** (Neptune is competent, prepared, not wasting my time)

#### Strategic Questions (2-5 minutes)

After core confirmations, Neptune shifts to questions it *can't* answer from research — the user's actual goals, priorities, and pain points.

These are sequenced strategically. Neptune doesn't ask "what are your goals?" — it asks questions shaped by what it already knows:

- "You've got solid brand presence but I'm not seeing much SEO traction. Is organic growth something you've been meaning to tackle, or is paid your main channel?"
- "Your client list looks strong but I notice you're [agency-specific observation]. Are you trying to scale client count, or deepen the relationships you have?"
- "What's the one thing that, if it just ran itself, would free up the most of your time?"

That last question is the **key unlock**. Whatever the user answers becomes the first agent Neptune builds. It's the fastest path to demonstrating value.

#### Workforce Assembly Preview (1-2 minutes)

Based on confirmations + strategic answers, Neptune proposes the initial workforce:

> "Based on what you've told me, here's what I'm thinking for your team:"
>
> - **Sales Agent** — Handles inbound leads, sends follow-ups, keeps your pipeline moving
> - **Content Agent** — Creates social posts and blog content based on your brand voice
> - **Finance Agent** — Sends invoices, tracks payments, flags overdue accounts
>
> "I'll start with these three and we can add more as we learn what your business needs. Sound good?"

**Key design points:**
- Neptune proposes, doesn't dictate. The user approves.
- Agents are described in human terms (role + responsibility), not technical terms.
- Three agents max to start. Not overwhelming. More can be added later.
- The first agent prioritized is whatever addresses the user's answer to "what would free up your time?"

If the user pushes back or wants changes, Neptune adapts immediately. This is a conversation, not a deployment script.

---

## Step 4: Workforce Goes Live

### What Happens Behind the Scenes

Once the user approves the initial workforce:

1. Neptune sends configuration to Paperclip via the delegation layer
2. Paperclip provisions agents with roles, budgets, schedules, and adapter configs
3. Agents receive their first tasks (informed by the dossier + user conversation)
4. Agents begin working — scraping leads, drafting content, preparing invoices

### What the User Sees

The conversation transitions smoothly from planning to action:

> "Your team's getting set up now. Give me a few minutes and I'll have your first updates ready. In the meantime, want to look around? Or I can keep you company."

The user can either:
- **Explore the platform** — see the modules, walk the floor (most modules will be sparse but alive)
- **Stay with Neptune** — continue chatting, ask questions, share more context
- **Leave and come back** — Neptune will have the Home feed ready when they return

### First Agent Actions

Within minutes of provisioning, agents should produce *something* visible:

| Agent | First Visible Action | Timeline |
|-------|---------------------|----------|
| Sales Agent | Imports contacts from connected tools (if integration set up) or drafts a lead intake form | 5-10 minutes |
| Content Agent | Drafts first social post or blog outline based on brand voice analysis | 10-15 minutes |
| Finance Agent | Creates invoice template based on business type, prepares first invoice draft | 5-10 minutes |

These first actions aren't about being perfect — they're about being *present*. The user returns to a Home feed that isn't empty. Agents have started. The company is alive.

---

## Step 5: First Value Moment

### Definition

The First Value Moment is when the user realizes GalaxyCo actually *did* something for their business — not demoed, not promised, *did*.

**Target:** Within the first 24 hours, ideally within the first session.

### Examples by Vertical

**Agency:**
- Sales agent identified 3 leads from their existing contacts and sent follow-up emails
- Content agent drafted a week's worth of social posts in their brand voice
- Neptune surfaces: "Your agent reached out to [Lead Name]. They opened the email. Want to see the thread?"

**E-commerce:**
- Sales agent drafted abandoned cart follow-up sequence
- Content agent created product description improvements based on SEO gaps
- Neptune surfaces: "I found 4 keywords your competitor ranks for that you don't. Your content agent drafted blog posts targeting them. Want to review?"

### What Makes It Work

1. **Speed** — Value in hours, not weeks
2. **Relevance** — The work addresses the user's stated priorities (from the conversation)
3. **Quality** — The drafts are good enough to use, not placeholder garbage
4. **Attribution** — Neptune explicitly connects the dots: "Your sales agent did this because you told me [priority]"

---

## The Anti-Onboarding

### What We're Replacing

| Traditional Onboarding | GalaxyCo Onboarding |
|-----------------------|---------------------|
| "Welcome! Let's set up your profile" | "Hey — I've been looking into your business" |
| Step 1 of 5 progress bar | Single conversation, no steps |
| "Connect your accounts" checklist | Agents handle integrations as they're needed |
| Empty dashboard after setup | Agents already working when you arrive |
| Tutorial tooltips and walkthroughs | Neptune explains things in context, when relevant |
| "Invite your team" prompt | Neptune suggests team invites when the timing makes sense |
| "Choose your plan" gate | Free tier works fully; Neptune surfaces upgrade when value is proven |
| Static onboarding cards | Killed. Dead. Buried. |

### What We're NOT Doing

- **No product tour.** Neptune introduces features in context, not in a scripted walkthrough.
- **No empty states with "Create your first X" CTAs.** Agents create the first X.
- **No progressive disclosure walls.** The full platform is accessible from day 1. What changes is the *depth* of what's happening inside each module.
- **No "onboarding complete" milestone.** Onboarding is a gradient, not a gate. The user transitions naturally from Phase 1 to Phase 2 as agents produce results and trust builds.

---

## Edge Cases

### User Provides Invalid or Unusable URL

Neptune handles gracefully:
> "I couldn't find much at that URL — might be a new site, or maybe it's under a different domain? What's the best way to learn about your business?"

Falls back to yellow/red dossier conversation pattern — more open exploration, less confirmation.

### User Provides Competitor's URL (Accidentally or Testing)

Neptune detects the mismatch during conversation (user's descriptions don't match the scraped data):
> "Hmm, some of what I found doesn't match what you're describing. Let me make sure I'm looking at the right site — is [URL] your main domain?"

### User Signs Up But Doesn't Complete Conversation

- Workspace is provisioned, dossier is ready
- Next time user logs in, Neptune picks up where they left off: "Hey — we didn't finish getting set up last time. Want to pick up where we left off?"
- Dossier doesn't expire. It just keeps enriching.

### User Has No Website

- Neptune falls back to conversation-first discovery
- Can still scout social profiles, review sites, business directories from the company name
- Experience is slightly less magical but still dramatically better than a form wizard

### User Provides Very Common/Generic Business

- Dossier may be shallow or ambiguous (e.g., "marketing" could mean anything)
- Neptune asks more specific questions earlier: "What kind of marketing — digital, content, PR, full-service? And who's your typical client?"

### User Signs Up from Mobile

- Same flow, optimized for mobile viewport
- Conversation interface works natively on mobile (chat is mobile-first by nature)
- Agent views (Cockpit/Office) may be simplified on mobile for first session

---

## Integration Touchpoints

### Existing Systems

| System | Role in Onboarding |
|--------|-------------------|
| **Clerk** | Auth, account creation, workspace provisioning |
| **Intelligence Layer** (01) | Deep Library search, Activation Search, dossier delivery |
| **Neptune** (04) | Conversation engine, personality, Trust Arc Phase 1 behavior |
| **Paperclip** | Agent provisioning when workforce is approved |
| **Courier** | Powers Activation Search inference (dossier synthesis, conversation seed generation) |

### New Systems Needed

| System | Purpose |
|--------|---------|
| **Activation Search orchestrator** | Coordinates Deep Library lookup + real-time enrichment + synthesis. Runs during signup flow. Must complete within timing targets. |
| **Conversation state machine** | Manages the onboarding conversation flow — tracks what's been confirmed, what's outstanding, when to transition from confirmation to strategic questions to workforce proposal. |
| **Workforce proposal engine** | Given dossier + user conversation, generates recommended agent roster with roles, responsibilities, and initial tasks. |
| **First-value tracker** | Monitors new users for their First Value Moment. Alerts Neptune when an agent produces something the user should see. Metrics: time-to-first-value, first-action-relevance-score. |

---

## Success Metrics

| Metric | Target | Why |
|--------|--------|-----|
| **Sign-up to Neptune conversation** | < 90 seconds | User should never wait long enough to lose interest |
| **Dossier completeness at conversation start** | > 70% (7+ categories) for warm/hot prospects | Neptune needs enough to demonstrate knowledge |
| **Conversation duration (first session)** | 5-10 minutes | Long enough to be substantive, short enough to not feel like work |
| **Workforce approval rate** | > 80% approve Neptune's first proposal | If users frequently reject, proposals need calibration |
| **Time to first value** | < 24 hours, ideally < 1 hour | Agents must produce visible work quickly |
| **Day-2 return rate** | > 60% | If the onboarding worked, they come back |
| **Phase 1 → Phase 2 transition** | < 7 days | User should be in "Neptune handles it" mode within a week |

---

## Open Questions

1. **Integration connections during onboarding:** When does Neptune suggest connecting tools (Google, Shopify, Slack, etc.)? During the first conversation, or after first value is demonstrated? Recommendation: after first value. Don't interrupt the conversation flow with OAuth modals.

2. **Free tier limits:** How much can agents do on the free tier? If agents can't take meaningful action, the first value moment is gated behind payment. Recommendation: generous free tier that allows full onboarding + first week of agent work. Paywall hits at scale, not at start.

3. **Concurrent sign-ups:** If Neptune is having deep conversations with hundreds of users simultaneously, how does the system scale? Neptune is AI-powered, so technically unlimited concurrency — but Activation Search has real resource costs (scraping, inference).

4. **Referral onboarding:** If User A refers User B, and User B is already in the Deep Library as a 2nd-degree connection, the onboarding is even more magical — "Your colleague [User A] has been using GalaxyCo for their business. I already know a bit about your space from working with them." How explicit should this connection be?

5. **Onboarding A/B testing:** How do we measure which conversation patterns produce the best Day-2 return rates and time-to-value? Need a framework for testing different Neptune opening strategies.

---

*This spec depends on: `00-philosophy.md` (Trust Arc, anti-patterns), `01-intelligence-layer.md` (Deep Library, Activation Search, dossier model), `04-neptune.md` (personality, Trust Arc Phase 1 behavior, conversation model)*
*This spec informs: `03-home-feed.md` (what the user sees after onboarding), `05-agents.md` (workforce assembly), `14-public-site.md` (sign-up form design)*
