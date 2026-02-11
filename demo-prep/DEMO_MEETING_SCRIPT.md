# GalaxyCo.ai Demo Meeting Script
## 30-Minute Team Recruitment Demo | 1:00 PM EST

---

## BEFORE YOU START (T-15 min)

- [ ] Browser: Chrome/Edge, incognito mode, 100% zoom
- [ ] Close all other tabs and notifications
- [ ] Have galaxyco.ai logged in and on Dashboard
- [ ] Verify demo data is populated (contacts, deals, content)
- [ ] Test Neptune with one quick command
- [ ] Water nearby, phone on silent

---

## OPENING (0:00 - 3:00) — 3 minutes

### What to say:

> "Thanks for taking this meeting. [Investor name] brought us together because they believe what we're building at GalaxyCo is special, and I think you'll see why in the next 25 minutes.
>
> Here's what I want to show you today:
>
> 1. **The Problem** — why businesses are drowning in fragmented tools
> 2. **Neptune** — our AI assistant that actually *does* things, not just *talks*
> 3. **The Platform** — unified CRM, Finance, Marketing, Knowledge in one system
> 4. **The Architecture** — for the engineers: why this is technically interesting
>
> Then we'll have time for questions. Let's dive in."

### Key body language:
- Stand if presenting to a room, sit if it's a video call
- Make eye contact before starting
- Speak slower than feels natural

---

## THE PROBLEM (3:00 - 5:00) — 2 minutes

### What to say:

> "Every growing business hits the same wall. You've got Salesforce for CRM, QuickBooks for finance, HubSpot for marketing, Notion for docs, Slack for conversations — and none of them talk to each other.
>
> Your team spends 40% of their time on admin: copying data between tools, chasing follow-ups, updating spreadsheets. You hire an ops person just to manage the chaos.
>
> We asked: what if the software adapted to you instead of the other way around? What if you could just *tell* it what you want done?"

### Transition:

> "Let me show you what that looks like. This is Neptune."

---

## DEMO 1: NEPTUNE IN ACTION (5:00 - 12:00) — 7 minutes

### Setup:
- Navigate to Neptune (the AI assistant interface)
- Make sure the chat is clear or start fresh

### Demo Script:

**Step 1: Simple command with real execution**

Type or say:
> "Add Sarah Chen from TechFlow as a new contact. She's the VP of Engineering, email sarah@techflow.io, and we met at the AI Summit last week."

**What to point out:**
- Watch how Neptune parses this natural language
- It creates the contact in the CRM *immediately* — not just a suggestion
- Response time is under 3 seconds
- Show them the contact was actually created (quick flip to CRM)

**Step 2: Multi-step orchestration**

> "Now schedule a discovery call with Sarah for next Tuesday at 2pm, and draft a meeting agenda focused on their engineering team's workflow pain points."

**What to point out:**
- Neptune handles *multiple* actions from one request
- Creates calendar event AND drafts agenda
- Context carries over — it knows "Sarah" from the previous message
- This is 37+ tools working together, not a single-purpose chatbot

**Step 3: Context memory (big differentiator)**

> "What did I just ask you to do?"

**What to point out:**
- Neptune remembers the session context
- This seems simple but most AI assistants don't do this well
- Memory enables actual *assistance* not just Q&A

### For engineers, mention:

> "Under the hood, this is streaming responses from GPT-4 or Claude, with a tool orchestration layer that can chain 37 different actions. The architecture supports autonomy learning — over time, Neptune asks less and does more based on your patterns."

### For designers, mention:

> "Notice the progressive disclosure here. We don't overwhelm users with options. Neptune surfaces capabilities as you need them. The first-value moment is under 5 minutes."

---

## DEMO 2: UNIFIED PLATFORM (12:00 - 18:00) — 6 minutes

### The Goal:
Show that CRM, Finance, Marketing, and Knowledge are all connected — and Neptune orchestrates across them.

### Demo Script:

**Step 1: CRM quick tour**

Navigate to CRM > Contacts

> "Here's our CRM. Contacts, Organizations, Deals — standard stuff. But watch this..."

Show the contact you just created (Sarah Chen). Point out:
- Activity timeline shows the Neptune interaction
- Lead scoring is automatic
- Custom fields are flexible

**Step 2: Finance connection**

Navigate to Finance Dashboard

> "Finance is built in. No QuickBooks export hell. Revenue tracking, invoices, expenses — all in one view."

Point out:
- Real-time dashboard updates
- Integration with Stripe, QuickBooks is available
- Cash flow forecasting powered by AI

**Step 3: Knowledge Base**

Navigate to Knowledge

> "Every document your team needs, searchable with semantic AI. Upload a PDF, and Neptune can answer questions about it."

Quick demo:
- Show existing documents
- Type a search query and show semantic results
- Mention: "This uses RAG with vector embeddings — engineers, you'll appreciate the Upstash Vector integration."

**Step 4: The orchestration point**

> "The magic is these aren't separate products duct-taped together. Ask Neptune to 'create a proposal for Sarah based on our pricing doc' — it pulls from Knowledge, creates a doc, links it to the CRM contact, and can email it. One system."

---

## DEMO 3: TECHNICAL DEPTH (18:00 - 23:00) — 5 minutes

### For Engineers:

> "Let me speak to the architecture for a minute, because this is where it gets interesting if you're an engineer."

**Points to hit:**

1. **Stack**
   > "Next.js 16 with App Router, React 19, TypeScript in strict mode — zero compilation errors across 130,000 lines."

2. **Multi-tenancy**
   > "Full row-level security in Postgres. Every table has tenant_id, every query is scoped. This is enterprise-grade from day one, not bolted on later."

3. **AI Architecture**
   > "Multi-model support — OpenAI, Anthropic, Google. Neptune's tool system is extensible. Adding a new capability is a single file with a schema definition."

4. **Real-time**
   > "Pusher for WebSocket updates. Liveblocks configured for collaborative editing — that's coming next. Trigger.dev for background jobs."

5. **The interesting problem**
   > "The hard part isn't any single feature — it's making them work together seamlessly while keeping the UX simple. That's the engineering challenge we're solving."

### For Designers:

> "And for design: we built on Radix UI for accessibility, Tailwind with a custom Nebula color system, and a component library of 40+ primitives. Everything follows an 8px grid, and dark mode isn't an afterthought — it was designed first."

Navigate to Settings > Appearance and toggle themes if time permits.

---

## THE ASK (23:00 - 25:00) — 2 minutes

### What to say:

> "So that's GalaxyCo.ai. What we're building is ambitious — a unified AI-native operating system for business.
>
> We're looking for founding engineers and designers who want to work on genuinely interesting problems:
>
> - **For engineers**: AI orchestration, real-time collaboration, building a platform that scales
> - **For designers**: Defining what AI-native UX looks like, making complex workflows feel simple
>
> [Investor name] is backing this because they see the opportunity. But I know you need more than an opportunity — you need a team you respect and problems worth solving.
>
> I'd love to answer questions and talk about what working together could look like."

---

## Q&A (25:00 - 30:00) — 5 minutes

### Likely questions and answers:

**"What's your background?"**
> [Prepare your 30-second founder story — focus on relevant experience and why you're the person to build this]

**"How far along is this?"**
> "90% feature complete. We're in private beta prep — finalizing UX and onboarding. The infrastructure is production-ready."

**"What's the business model?"**
> "SaaS subscription. We're targeting B2B startups, agencies, and professional services. $50-200/user/month depending on tier."

**"Who else is on the team?"**
> "Right now it's me and AI-assisted development. That's exactly why this meeting matters — I'm looking for the founding team."

**"Why should I join something this early?"**
> "You'd be employee #1-3. Founding equity, real ownership over the product, and a chance to build something from scratch that actually ships — not maintain legacy code."

**"What's the competitive landscape?"**
> "HubSpot, Salesforce, Monday — they're all feature-rich but fragmented. None of them have an AI that actually *does* things. We're not competing on features; we're competing on paradigm."

---

## CLOSING (30:00)

> "Thanks for your time today. I'll follow up with [specific next step — technical deep-dive, design review, coffee chat]. If you have questions in the meantime, I'm available."

---

## POST-MEETING CHECKLIST

- [ ] Send thank-you email within 2 hours
- [ ] Include link to any materials discussed
- [ ] Propose specific next step with date/time
- [ ] Note any follow-up questions you promised to answer
- [ ] Update CRM with meeting notes (use Neptune!)

---

## EMERGENCY RECOVERY PHRASES

**If something breaks:**
> "Let me show you something else while that loads — this actually demonstrates the real-time error handling we built in."

**If you lose your place:**
> "Let me pause and make sure I'm covering what's most relevant to you. What would you like to see more of?"

**If someone asks something you don't know:**
> "That's a great question. I want to give you an accurate answer, so let me follow up after the meeting with specifics."

**If you run out of time:**
> "I know we're at time. Can I send you a recorded walkthrough of [feature X] so you can see it in detail?"

---

*Good luck. You've built something real. Now show them.*
