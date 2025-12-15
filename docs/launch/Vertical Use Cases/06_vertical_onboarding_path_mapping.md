# Vertical Onboarding Path Mapping — GalaxyCo.ai

**Purpose:** Define clear, role-specific onboarding paths so users reach a meaningful win within minutes — without overwhelming them.

**Current Reality:** Users land directly in the dashboard (no formal onboarding wizard yet).

**Primary Success Metric:** User experiences a *quick, meaningful win*.

---

## Global Onboarding Principles (Applies to All Verticals)

- Dashboard is the entry point — onboarding happens *inside* the product, not before it.
- Each vertical gets:
  - One clear **first action**
  - One visible **success state**
  - One obvious **next step**
- Neptune is proactive, contextual, and opinionated — not passive.
- CRM is safe to expose immediately.
- Agent templates are exposed carefully; advanced workflows come later.

---

## Vertical 1: B2B SaaS / Tech Startups

### First 60 Seconds
- **Dashboard headline:** “Turn leads into qualified pipeline — automatically.”
- **Primary CTA:** “Add your first lead”
- **Neptune prompt:**
  > “Want to see how GalaxyCo qualifies and follows up with leads automatically?”

### First Quick Win (3–5 minutes)
- User adds or imports a single lead
- AI enriches + scores the lead
- Deal appears in pipeline

### What’s Emphasized
- CRM
- Pipeline
- Lead scoring
- Neptune next actions

### What’s De-emphasized
- Deep agent configuration
- Advanced automation rules

### Success Moment
- User sees a lead scored and sitting in a deal stage

---

## Vertical 2: Marketing / Creative Agencies

### First 60 Seconds
- **Dashboard headline:** “Deliver more client work without burning out.”
- **Primary CTA:** “Create your first client workspace”
- **Neptune prompt:**
  > “Want me to generate a campaign draft for a client?”

### First Quick Win (3–5 minutes)
- User creates a client workspace
- AI generates a content or campaign draft

### What’s Emphasized
- Client workspaces
- Content creation
- Campaign views

### What’s De-emphasized
- CRM depth
- Sales pipeline

### Success Moment
- User sees usable content generated for a real client

---

## Vertical 3: Consultants / Coaches

### First 60 Seconds
- **Dashboard headline:** “Never forget a follow-up again.”
- **Primary CTA:** “Add a client or prospect”
- **Neptune prompt:**
  > “Want me to remember everything about your clients for you?”

### First Quick Win (3–5 minutes)
- User adds a client
- Neptune generates notes, follow-ups, or a proposal draft

### What’s Emphasized
- CRM simplicity
- Notes
- Follow-ups
- Client history

### What’s De-emphasized
- Campaign features
- Advanced analytics

### Success Moment
- User sees client context captured automatically

---

## Vertical 4: Professional Services

### First 60 Seconds
- **Dashboard headline:** “Keep client records clean, secure, and audit-ready.”
- **Primary CTA:** “Create a secure client workspace”
- **Neptune prompt:**
  > “Want help organizing a client engagement?”

### First Quick Win (3–5 minutes)
- User creates a client workspace
- Uploads a document or adds a note
- Task or reminder is auto-created

### What’s Emphasized
- Document management
- Client timelines
- Tasks and reminders

### What’s De-emphasized
- Outreach sequences
- Marketing tools

### Success Moment
- User sees a structured, compliant client record

---

## Vertical 5: Sales Teams / SDRs

### First 60 Seconds
- **Dashboard headline:** “Focus on the deals most likely to close.”
- **Primary CTA:** “Add or import leads”
- **Neptune prompt:**
  > “Want me to tell you who to contact first today?”

### First Quick Win (3–5 minutes)
- User imports or adds leads
- AI scores and prioritizes them
- Next-best actions appear

### What’s Emphasized
- Pipeline
- Lead scoring
- Outreach suggestions

### What’s De-emphasized
- Document creation
- Long-term reporting

### Success Moment
- User sees a ranked list of leads with clear actions

---

## Implementation Notes (Cursor / Engineering)

- On signup, require **vertical selection** (modal or banner).
- Store vertical as a workspace-level attribute.
- Use vertical to:
  - Change dashboard copy
  - Toggle default widgets
  - Prime Neptune’s system context
- Do NOT hard-block features — only reorder and emphasize.
- Track:
  - Time to first action
  - Time to first success moment

---

**If onboarding fails, it’s not the user — it’s the path.**

