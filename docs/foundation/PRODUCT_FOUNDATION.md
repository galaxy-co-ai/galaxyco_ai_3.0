# GalaxyCo.ai — Product Foundation

**Version:** 1.0
**Last Updated:** December 27, 2024
**Status:** Active

---

## What GalaxyCo Is

**One-liner:**
GalaxyCo is an **AI-native operating system for modern work** — a cohesive system that thinks alongside the user, not a collection of disconnected tools.

**Elevator Pitch:**
Most business tools require you to work FOR them — endless data entry, clicking through menus, context-switching between apps. GalaxyCo exists to contain complexity, orchestrate intelligence, and guide users forward without friction. Neptune isn't a chatbot — it's a system intelligence partner. You describe what you need, and the system responds with calm, confident action.

**What GalaxyCo Is NOT:**
- A flashy AI demo
- A hype-driven productivity toy
- A black-box that overwhelms users
- A replacement for human judgment

If something feels impressive but confusing, it violates the brand.

---

## Mission

**Why We Exist:**
To eliminate the gap between business intent and execution. When you decide "I need to follow up with that lead" — it should happen. Not tomorrow after you remember to update three tools. Now.

**What We Believe:**
1. AI should DO things, not just answer questions
2. Users shouldn't have to learn complex interfaces
3. Trust is earned through listening, not feature demos
4. Simple actions should feel effortless; complex actions should feel guided

---

## Who We're For

### Primary Target Users

| Vertical | Profile | Core Pain |
|----------|---------|-----------|
| **B2B SaaS / Startups** | Seed to Series B teams with small sales/marketing or founder-led GTM | RevOps fragmented across tools; leads don't get followed up |
| **Marketing / Creative Agencies** | Agencies managing multiple clients and campaigns | Content doesn't scale; campaign execution scattered |
| **Consultants / Coaches** | Independent consultants, coaches, small advisory firms | CRM is overkill and never maintained; client knowledge scattered |
| **Professional Services** | Accountants, lawyers, bookkeepers serving ongoing clients | Documents scattered; admin eats billable hours |
| **Sales Teams / SDRs** | Small-to-mid B2B sales teams, SDRs, founder-led sales | Leads not prioritized; pipeline visibility unreliable |

### Who We're NOT For (Yet)
- Large enterprises with heavily customized Salesforce/HubSpot
- One-off project businesses with no repeat clients
- Non-B2B consumer apps

---

## Core Problems We Solve

### 1. Tool Fragmentation
**The Pain:** CRM in one place, outreach in another, notes in Notion, follow-ups in Slack. No single source of truth.
**Our Solution:** Everything lives in GalaxyCo. Neptune orchestrates across all modules.

### 2. Inconsistent Follow-Up
**The Pain:** Leads sit untouched, follow-ups slip, reps work off memory instead of systems.
**Our Solution:** AI agents score leads, trigger follow-ups, and surface next-best actions automatically.

### 3. Admin Overhead
**The Pain:** Manual proposals, scheduling, reminders, data entry. Steals time from actual work.
**Our Solution:** Neptune handles the repeatable work. You approve.

### 4. Scaling Requires Headcount
**The Pain:** Scaling outbound/delivery means hiring SDRs or coordinators too early.
**Our Solution:** AI agents handle research, qualification, outreach drafts, and CRM updates.

### 5. No Time to Value
**The Pain:** New software takes weeks to set up and see results.
**Our Solution:** First win in 3-5 minutes. Trust-first onboarding through conversation.

---

## Product Principles

### 1. Trust-First UX
**We ask, listen, then offer — not categorize and command.**

- No vertical selection modal on signup
- Neptune earns context through conversation
- Value before signup (landing page demonstrates value)
- Progressive disclosure (features revealed as trust builds)

See: `docs/strategy/TRUST_FIRST_UX_STRATEGY.md`

### 2. Action Over Explanation
Neptune prioritizes doing over discussing. When a user says "schedule a follow-up," the follow-up gets scheduled — Neptune doesn't explain how scheduling works.

### 3. Human-in-the-Loop
AI can draft, suggest, prepare — but irreversible actions require approval. Users stay in control.

### 4. Progressive Disclosure
New users see minimal UI. Features surface as users demonstrate readiness. Power users unlock everything.

### 5. Simple Things Are Effortless
Adding a contact? One sentence to Neptune. Creating a follow-up? One click. No friction for common actions.

### 6. Complex Things Are Guided
Multi-step workflows? Neptune walks you through. Heavy configuration? Wizard-style UI with clear progress.

---

## Feature Inventory

### Core Platform (92% Complete)

| Feature | Status | Description |
|---------|--------|-------------|
| **Neptune AI Assistant** | Live | 37+ executable AI tools, context-aware, multi-model |
| **Dashboard** | Live | Real-time metrics, activity feed, command palette |
| **Authentication** | Live | Clerk SSO, multi-tenant workspaces |
| **Global Search** | Live | Multi-entity semantic search |
| **Mobile Navigation** | Live | Bottom nav, swipe gestures, pull-to-refresh |

### CRM (100% Complete)

| Feature | Status | Description |
|---------|--------|-------------|
| **Contacts** | Live | Full CRUD, custom fields, merge, segmentation |
| **Deals** | Live | Kanban pipeline, probability scoring, forecasting |
| **Organizations** | Live | Company profiles, multi-contact relationships |
| **Lead Scoring** | Live | AI-powered scoring, routing automation |
| **Activity Timeline** | Live | Full interaction history |

### Agent Orchestration (100% Complete)

| Feature | Status | Description |
|---------|--------|-------------|
| **Agent Teams** | Live | Multi-agent coordination, department templates |
| **Workflows** | Live | Visual builder, templates, versioning |
| **Approvals** | Live | Risk classification, bulk operations, autonomy levels |
| **Agent Memory** | Live | Three-tier memory, sharing between agents |
| **Marketplace** | Live | Agent and workflow templates |

### Content & Marketing (95% Complete)

| Feature | Status | Description |
|---------|--------|-------------|
| **Content Cockpit** | Live | Full article studio with AI writing |
| **Campaigns** | Live | Multi-channel, templates, performance tracking |
| **Marketing Analytics** | Live | ROI visualization, attribution |
| **Content Sources** | Live | AI-powered source discovery |

### Finance (100% Complete)

| Feature | Status | Description |
|---------|--------|-------------|
| **Finance Dashboard** | Live | Revenue, cash flow, expenses |
| **Invoicing** | Live | Creation, tracking, reminders |
| **Integrations** | Live | Stripe, QuickBooks, Shopify |
| **Expense Management** | Live | Full CRUD with categories |

### Knowledge Base (100% Complete)

| Feature | Status | Description |
|---------|--------|-------------|
| **Document Storage** | Live | Vercel Blob, multi-format |
| **Vector Search** | Live | RAG integration, semantic search |
| **Collaboration** | Live | Liveblocks real-time editing |

### Conversations (100% Complete)

| Feature | Status | Description |
|---------|--------|-------------|
| **Multi-channel** | Live | Email, SMS, voice (SignalWire) |
| **Threads** | Live | Nested replies, file attachments |
| **Voice Messages** | Live | Recording, transcription |

---

## Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.7 (strict mode)
- **UI:** React 19, Tailwind CSS 4.0, Radix UI
- **Animation:** Framer Motion
- **Real-time:** Pusher

### Backend
- **Database:** Neon Postgres + Drizzle ORM
- **Auth:** Clerk
- **Background Jobs:** Trigger.dev
- **Caching:** Upstash Redis
- **Vector DB:** Upstash Vector
- **Storage:** Vercel Blob

### AI
- **Primary:** OpenAI (GPT-4, DALL-E 3)
- **Secondary:** Anthropic (Claude), Google AI (Gemini)
- **Search:** Perplexity API

### Integrations
- **Payments:** Stripe
- **Accounting:** QuickBooks
- **E-commerce:** Shopify
- **Communications:** SignalWire (SMS/Voice)
- **Calendar:** Google Calendar, Outlook
- **Collaboration:** Liveblocks

---

## Quick Win Paths Per Vertical

These define the ideal first 5 minutes for each user type:

| Vertical | Dashboard Headline | First Action | Success Moment |
|----------|-------------------|--------------|----------------|
| **B2B SaaS** | "Turn leads into qualified pipeline" | Add a lead | Lead scored, in pipeline |
| **Agency** | "Deliver more client work" | Create client workspace | Content draft generated |
| **Consultant** | "Never forget a follow-up" | Add a client | Follow-up scheduled |
| **Pro Services** | "Keep records audit-ready" | Create secure workspace | Document organized |
| **Sales/SDR** | "Focus on deals likely to close" | Import leads | Prioritized lead list |

---

## What Makes Us Different

1. **Neptune is the core** — Most competitors added AI as afterthought. Neptune is how you interact with everything.

2. **37+ Executable Tools** — AI can actually DO things: create deals, send emails, schedule meetings. Not just chat.

3. **Unified System** — CRM + Finance + Marketing + Agents in one platform. No integration hell.

4. **Trust-First Onboarding** — We ask, listen, offer. Not demand info then command actions.

5. **Finance Built-In** — Competitors don't have financial management. We do.

6. **Modern Stack** — Next.js 15, React 19, real-time. Not a decade-old codebase with AI bolted on.

---

## Pricing Tiers

| Tier | Target | Key Features |
|------|--------|--------------|
| **Free** | Solo users exploring | Basic CRM, limited Neptune |
| **Starter** | Small teams | Full CRM, workflows, integrations |
| **Professional** | Growing teams | Full platform, priority support |
| **Enterprise** | Large orgs | Custom limits, SSO, dedicated support |

---

## Key Metrics to Track

### Product Health
- Time to first Neptune response
- Time to first "win" moment
- Feature adoption by vertical
- Neptune task completion rate

### Trust Indicators
- Return visit rate within 48 hours
- Feature progression (simple → advanced)
- User allows autonomous AI actions (ultimate trust signal)

### Business
- Activation rate (signup → first action)
- Retention (7-day, 30-day)
- NPS score
- Revenue per user

---

## Related Documents

| Document | Purpose |
|----------|---------|
| `docs/strategy/TRUST_FIRST_UX_STRATEGY.md` | UX philosophy and implementation |
| `docs/strategy/ROADMAP.md` | Feature roadmap |
| `docs/foundation/guided_systems_spec/` | **Canonical design system** (supersedes old brand docs) |
| `docs/foundation/TECH_STACK.md` | Detailed technical architecture |
| `docs/launch/Vertical Use Cases/` | Detailed per-vertical documentation |
| `docs/guides/` | Developer and operational guides |
| `public/assets/` | Production brand assets (logos, icons, images) |

---

## Document Maintenance

This document is the **single source of truth** for product identity. Update it when:
- Core positioning changes
- Major features ship
- Target market evolves
- Product principles are refined

**Do not duplicate** this content elsewhere. Link to this document instead.

---

*This is who we are. Everything we build should align with this foundation.*
