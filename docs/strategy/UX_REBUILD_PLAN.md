# UX Rebuild Plan — GalaxyCo.ai

**Created:** December 27, 2024
**Status:** Planning Phase
**Approach:** Trust-First UX (see TRUST_FIRST_UX_STRATEGY.md)

---

## Overview

This document defines the detailed execution plan for rebuilding GalaxyCo's user experience from first touch (landing page) through established usage (adapted dashboard). Each checkpoint must be fully completed and verified before moving to the next.

**Guiding Principles:**
- Build new, don't mold old
- No legacy bias or assumptions
- Trust is earned through listening, not feature demos
- Every step documented before execution

---

# Checkpoint 1: Landing Page (NEW)

## Objective
Create a new landing page that earns trust before asking for signup. Implement the "pull-up bar" concept — an interactive element that demonstrates value with zero commitment.

## Success Criteria
- [ ] User can interact with Neptune without signing up
- [ ] Value is delivered before any signup prompt
- [ ] Page reflects Guided Systems design language (calm, confident, composed)
- [ ] Mobile-responsive from launch
- [ ] No feature-first messaging — pain-first messaging only

---

### Step 1.1: Define Page Structure

**Deliverable:** Written specification of all sections and their purpose

**Sections to Define:**
1. **Hero Section**
   - Headline (pain-recognition, not feature-announcement)
   - Sub-headline (empathy, not capability claims)
   - The "pull-up bar" interactive element
   - No signup CTA above the fold — interaction CTA only

2. **Value Demonstration Section**
   - Show what Neptune can do (after hero interaction)
   - Use real examples, not abstract features
   - Keep it minimal — 3 max

3. **Social Proof Section** (if applicable)
   - Only if we have real testimonials
   - Skip if we don't — fake proof destroys trust

4. **How It Works Section**
   - Simple 3-step explanation
   - Focus on user outcome, not product mechanics

5. **Final CTA Section**
   - Soft ask: "Ready to try it for real?"
   - Reinforces that they've already seen value

6. **Footer**
   - Standard links
   - No aggressive CTAs

**Tasks:**
- [ ] Write specification for each section
- [ ] Define content hierarchy (what's most important)
- [ ] Get user approval on structure before design

---

### Step 1.2: Define the "Pull-Up Bar" Interaction

**Deliverable:** Complete specification of what the interactive element does

**Questions to Answer:**
1. What does the user input? (text? selection? voice?)
2. What does Neptune respond with?
3. Does this require a backend call? (API route needed?)
4. What happens after the interaction? (soft CTA to signup?)
5. How do we handle edge cases? (empty input, nonsense, abuse)

**Options to Evaluate:**

| Option | User Input | Neptune Response | Complexity |
|--------|-----------|------------------|------------|
| **A: Pain Input** | "What's slowing you down?" (text) | One actionable insight | Medium |
| **B: Quick Diagnosis** | "Describe your biggest bottleneck" | Diagnosis + suggestion | Medium |
| **C: Micro-Demo** | Click to see Neptune work | Pre-scripted demo | Low |
| **D: Identity Mirror** | "What do you do?" (selection) | "Here's what people like you struggle with" | Low |

**Tasks:**
- [ ] Evaluate options with user
- [ ] Select one approach
- [ ] Write detailed interaction flow (user action → system response → next step)
- [ ] Define error states and edge cases
- [ ] Determine if backend API is needed
- [ ] Get user approval before building

---

### Step 1.3: Define Component Architecture

**Deliverable:** Component tree and file structure

**Components to Create:**
```
src/components/landing/
├── LandingPage.tsx              # Main page component
├── HeroSection.tsx              # Hero with pull-up bar
├── PullUpBarInteraction.tsx     # The interactive element
├── ValueDemoSection.tsx         # Value demonstration
├── HowItWorksSection.tsx        # 3-step explanation
├── FinalCTASection.tsx          # Soft signup prompt
└── LandingFooter.tsx            # Footer
```

**Technical Decisions:**
- [ ] Server component or client component for each?
- [ ] Does PullUpBarInteraction need real-time streaming?
- [ ] State management approach (local state? context?)
- [ ] Animation library usage (Framer Motion per design system)

**Tasks:**
- [ ] Create component tree diagram
- [ ] Define props interface for each component
- [ ] Identify shared components (buttons, inputs, etc.)
- [ ] Document which existing components can be reused
- [ ] Get user approval on architecture before building

---

### Step 1.4: Define Copy and Messaging

**Deliverable:** All copy for the landing page, aligned with Guided Systems tone

**Tone Requirements (from Brand Identity Core):**
- Clear, direct, warm but not casual
- No jargon, no hype, no urgency
- Concrete outcomes over abstract promises
- Short sentences preferred

**Copy to Write:**
- [ ] Hero headline
- [ ] Hero sub-headline
- [ ] Pull-up bar prompt text
- [ ] Pull-up bar CTA text
- [ ] Value demonstration headlines (x3)
- [ ] Value demonstration descriptions (x3)
- [ ] How it works steps (x3)
- [ ] Final CTA headline
- [ ] Final CTA button text

**Anti-Patterns to Avoid:**
- "Unlock the power of..."
- "Revolutionary AI..."
- "10x your productivity..."
- Any urgency language

**Tasks:**
- [ ] Draft all copy
- [ ] Review against Guided Systems tone
- [ ] Get user approval before implementing

---

### Step 1.5: Design Implementation

**Deliverable:** Styled landing page following Guided Systems design

**Design System References:**
- `docs/foundation/guided_systems_spec/05_color_typography_and_surface_system.md`
- `docs/foundation/guided_systems_spec/06_ui_component_system.md`
- `docs/foundation/guided_systems_spec/10_motion_and_interaction_principles.md`

**Design Requirements:**
- Deep navy / midnight blue backgrounds
- Soft cyan accent (sparingly — one per section max)
- Typography: confident, calm, concise
- Spacing: generous, intentional
- Animation: subtle, purposeful (no decorative motion)

**Tasks:**
- [ ] Apply color system to components
- [ ] Apply typography system
- [ ] Implement spacing and layout
- [ ] Add motion/animation per principles
- [ ] Test dark mode compatibility
- [ ] Verify mobile responsiveness at all breakpoints

---

### Step 1.6: Backend Integration (if needed)

**Deliverable:** API route for pull-up bar interaction (if required)

**Depends on:** Step 1.2 decision

**If API is needed:**
- [ ] Create `/api/landing/interact` route
- [ ] Define request/response schema
- [ ] Implement rate limiting (prevent abuse)
- [ ] Implement response generation (Neptune lite?)
- [ ] Handle errors gracefully
- [ ] Test thoroughly

**If API is NOT needed:**
- [ ] Document why (pre-scripted, client-side only)
- [ ] Skip this step

---

### Step 1.7: Testing and Verification

**Deliverable:** Verified, working landing page

**Tests:**
- [ ] Visual review on desktop (1920px, 1440px, 1280px)
- [ ] Visual review on tablet (768px)
- [ ] Visual review on mobile (375px, 390px)
- [ ] Interaction flow works as specified
- [ ] Error states handled
- [ ] Performance check (Lighthouse score > 90)
- [ ] Accessibility check (no major violations)

**User Verification:**
- [ ] User reviews and approves before checkpoint complete

---

### Step 1.8: Deployment

**Deliverable:** Landing page live and accessible

**Tasks:**
- [ ] Create new route or replace existing
- [ ] Verify production build works
- [ ] Test in production environment
- [ ] Monitor for errors post-deploy

---

# Checkpoint 2: Signup Flow

## Objective
Streamlined signup with minimal friction. No vertical selection. No overwhelming forms. User gets into the product fast.

## Success Criteria
- [ ] Signup takes < 60 seconds
- [ ] No questions beyond essential (email, password, name)
- [ ] No vertical selection modal
- [ ] User lands directly in first-run experience after signup
- [ ] Works on mobile

---

### Step 2.1: Audit Current Signup Flow

**Deliverable:** Documentation of current flow and what to change

**Tasks:**
- [ ] Map current signup steps
- [ ] Identify friction points
- [ ] Identify what to remove
- [ ] Identify what to keep
- [ ] Document Clerk configuration requirements

---

### Step 2.2: Define New Signup Flow

**Deliverable:** Specification of new flow

**Flow:**
```
Landing Page → Click "Get Started" → Clerk Signup (email/Google/etc) →
→ Workspace Creation (auto or single input) → Redirect to First-Run Experience
```

**Questions to Answer:**
- [ ] Do we need workspace name during signup or auto-generate?
- [ ] Do we allow OAuth (Google, etc.) or email-only?
- [ ] What's the exact redirect path after signup?
- [ ] How do we handle existing users who return?

**Tasks:**
- [ ] Write flow specification
- [ ] Define each screen/state
- [ ] Get user approval

---

### Step 2.3: Implement Signup Changes

**Deliverable:** Updated signup flow

**Tasks:**
- [ ] Configure Clerk for minimal signup
- [ ] Remove any post-signup modals (vertical selection, etc.)
- [ ] Set correct redirect paths
- [ ] Test complete flow
- [ ] Verify mobile experience

---

### Step 2.4: Testing and Verification

**Deliverable:** Verified signup flow

**Tests:**
- [ ] New user can sign up in < 60 seconds
- [ ] OAuth signup works (if enabled)
- [ ] Email signup works
- [ ] Redirect to first-run experience works
- [ ] Returning user login works
- [ ] Mobile signup works

---

# Checkpoint 3: First-Run Experience

## Objective
When a new user lands in the product for the first time, they should immediately enter a Neptune conversation — not a complex dashboard.

## Success Criteria
- [ ] New user sees Neptune conversation immediately
- [ ] No overwhelming navigation or options visible
- [ ] Neptune opens with curiosity, not feature pitch
- [ ] User can engage naturally
- [ ] First action is taken within 3 minutes

---

### Step 3.1: Define First-Run State Detection

**Deliverable:** Logic for detecting first-run users

**Questions to Answer:**
- [ ] How do we know if a user is first-run? (no prior sessions? flag in DB?)
- [ ] Where is this state stored?
- [ ] How do we transition out of first-run state?

**Tasks:**
- [ ] Define first-run detection logic
- [ ] Document database changes if needed
- [ ] Get user approval

---

### Step 3.2: Define First-Run UI

**Deliverable:** Specification of what first-run UI looks like

**Concept:**
- Neptune chat is full-focus (or near-full)
- Minimal chrome (no full navigation visible)
- Clear, calm, inviting

**Tasks:**
- [ ] Sketch/describe first-run layout
- [ ] Define what navigation is visible (if any)
- [ ] Define Neptune panel state (expanded, minimal, etc.)
- [ ] Get user approval

---

### Step 3.3: Implement First-Run UI

**Deliverable:** Working first-run experience

**Tasks:**
- [ ] Create first-run layout component
- [ ] Implement Neptune in first-run mode
- [ ] Implement first-run detection
- [ ] Implement transition to normal UI after first-run complete
- [ ] Test flow end-to-end

---

### Step 3.4: Testing and Verification

**Deliverable:** Verified first-run experience

**Tests:**
- [ ] New user lands in first-run mode
- [ ] Neptune conversation works
- [ ] User can complete first action
- [ ] Transition to normal UI works
- [ ] Returning user does NOT see first-run
- [ ] Mobile experience works

---

# Checkpoint 4: Neptune Conversation System

## Objective
Build the conversation engine that powers the trust-first experience. Neptune asks, listens, reflects, offers, and infers vertical — all through natural conversation.

## Success Criteria
- [ ] Neptune opens with curiosity ("What brings you here?")
- [ ] Neptune reflects user input back (proves listening)
- [ ] Neptune offers one small action based on user's words
- [ ] Neptune can complete that action
- [ ] Neptune asks permission to customize (infers vertical)
- [ ] Vertical is stored after conversation

---

### Step 4.1: Define Conversation Flow

**Deliverable:** Complete conversation tree/flow

**Flow:**
```
Neptune: "What's the main thing you're hoping I can help with?"
    ↓
User: [types pain/need]
    ↓
Neptune: [reflects back] "Sounds like [X] is the issue..."
    ↓
Neptune: [offers small action] "Want to try [specific thing]?"
    ↓
User: [engages or not]
    ↓
Neptune: [delivers value]
    ↓
Neptune: [asks permission] "I can tailor my suggestions for [inferred context]. Want me to?"
    ↓
Vertical stored
```

**Tasks:**
- [ ] Write out full conversation tree
- [ ] Define branch points (what if user says no? what if input is unclear?)
- [ ] Define Neptune's tone per message
- [ ] Map user inputs to vertical inference
- [ ] Get user approval

---

### Step 4.2: Define Vertical Inference Logic

**Deliverable:** Rules for inferring vertical from conversation

**Verticals:**
- b2b_saas
- agency
- consultant
- professional_services
- sales_team
- general (default)

**Inference Signals:**
| User Says | Inferred Vertical |
|-----------|-------------------|
| "leads", "pipeline", "MRR", "churn" | b2b_saas |
| "clients", "campaigns", "content", "deliverables" | agency |
| "consulting", "coaching", "follow-ups", "sessions" | consultant |
| "documents", "compliance", "billable hours" | professional_services |
| "prospects", "cold outreach", "quota", "deals" | sales_team |

**Tasks:**
- [ ] Define inference rules
- [ ] Define confidence thresholds (when to ask vs. assume)
- [ ] Define fallback behavior (if unclear → ask, don't guess)
- [ ] Get user approval

---

### Step 4.3: Define System Prompts

**Deliverable:** Neptune system prompts for conversation flow

**Prompts Needed:**
- [ ] Opening conversation prompt (curiosity mode)
- [ ] Reflection/listening prompt
- [ ] Action offering prompt
- [ ] Vertical inference prompt
- [ ] Post-vertical prompts (per vertical)

**Tasks:**
- [ ] Write each system prompt
- [ ] Test prompts with sample inputs
- [ ] Refine based on output quality
- [ ] Get user approval

---

### Step 4.4: Implement Conversation Engine

**Deliverable:** Working Neptune conversation system

**Technical Components:**
- [ ] Conversation state machine (tracks where in flow)
- [ ] Message handler (processes user input)
- [ ] Inference engine (extracts vertical signals)
- [ ] Action executor (performs offered actions)
- [ ] State persistence (saves conversation progress)

**Tasks:**
- [ ] Design state machine
- [ ] Implement message handling
- [ ] Implement inference logic
- [ ] Integrate with existing Neptune tools
- [ ] Test end-to-end

---

### Step 4.5: Testing and Verification

**Deliverable:** Verified conversation system

**Tests:**
- [ ] Happy path: user engages, action taken, vertical inferred
- [ ] Unclear input: Neptune asks clarifying question
- [ ] User declines action: Neptune handles gracefully
- [ ] User declines customization: vertical stays general
- [ ] Various vertical inference scenarios work
- [ ] Actions actually execute (not just suggested)

---

# Checkpoint 5: Dashboard (Redesign)

## Objective
Redesign the dashboard to be Neptune-centric with progressive disclosure. Minimal until context is earned. Features surface as trust builds.

## Success Criteria
- [ ] Neptune is the primary focus
- [ ] Navigation is simplified (not 13 items)
- [ ] Empty states are intentional, not broken-looking
- [ ] Features appear progressively based on usage
- [ ] Dashboard adapts once vertical is known

---

### Step 5.1: Audit Current Dashboard

**Deliverable:** Documentation of current state and problems

**Tasks:**
- [ ] List all current dashboard elements
- [ ] Identify what's overwhelming for new users
- [ ] Identify what should be hidden initially
- [ ] Identify what should always be visible
- [ ] Document navigation structure

---

### Step 5.2: Define New Dashboard Structure

**Deliverable:** Specification of new dashboard

**Concept:**
```
┌─────────────────────────────────────────────────────────────┐
│  [Minimal Nav]                              [Profile]       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Neptune Panel                            │
│                  (Primary Focus)                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              Quick Actions / Context Panel                  │
│            (Appears after first actions)                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Tasks:**
- [ ] Define layout structure
- [ ] Define navigation items (minimal set)
- [ ] Define what's hidden vs. visible by default
- [ ] Define progressive disclosure rules
- [ ] Get user approval

---

### Step 5.3: Define Progressive Disclosure Rules

**Deliverable:** Rules for when features appear

**Examples:**
| Trigger | Feature Unlocked |
|---------|------------------|
| First contact added | Contacts nav item appears |
| First deal created | Deals nav item appears |
| Vertical = b2b_saas | Pipeline view emphasized |
| 5+ actions taken | Full navigation unlocked |

**Tasks:**
- [ ] Define all progressive disclosure triggers
- [ ] Define what unlocks at each stage
- [ ] Document in code-ready format
- [ ] Get user approval

---

### Step 5.4: Implement Dashboard Redesign

**Deliverable:** Working new dashboard

**Tasks:**
- [ ] Create new dashboard layout
- [ ] Implement minimal navigation
- [ ] Implement Neptune as primary focus
- [ ] Implement progressive disclosure logic
- [ ] Implement vertical-aware adaptations
- [ ] Handle all states (new user, returning user, power user)

---

### Step 5.5: Testing and Verification

**Deliverable:** Verified dashboard

**Tests:**
- [ ] New user sees minimal, Neptune-centric view
- [ ] Progressive disclosure works correctly
- [ ] Vertical adaptation works
- [ ] Power user can access everything
- [ ] Mobile layout works
- [ ] No regressions in core functionality

---

# Checkpoint 6: Vertical Adaptation Layer

## Objective
Build the system that stores, tracks, and uses vertical information to customize the entire experience.

## Success Criteria
- [ ] Vertical stored in database
- [ ] Vertical passed to Neptune system prompts
- [ ] Dashboard adapts based on vertical
- [ ] Quick actions relevant to vertical
- [ ] Neptune suggestions relevant to vertical

---

### Step 6.1: Define Database Schema

**Deliverable:** Schema changes for vertical storage

**Changes:**
```sql
ALTER TABLE workspaces ADD COLUMN vertical VARCHAR(50) DEFAULT 'general';
-- Values: b2b_saas, agency, consultant, professional_services, sales_team, general
```

**Tasks:**
- [ ] Define schema change
- [ ] Create migration file
- [ ] Test migration
- [ ] Get user approval

---

### Step 6.2: Define Vertical Context Types

**Deliverable:** TypeScript types for vertical system

**Types:**
```typescript
type Vertical =
  | 'b2b_saas'
  | 'agency'
  | 'consultant'
  | 'professional_services'
  | 'sales_team'
  | 'general';

interface VerticalConfig {
  vertical: Vertical;
  dashboardHeadline: string;
  primaryCTA: string;
  neptune: {
    openingMessage: string;
    systemPromptAdditions: string;
    tone: string;
  };
  emphasizedFeatures: string[];
  deemphasizedFeatures: string[];
}
```

**Tasks:**
- [ ] Define all types
- [ ] Create config for each vertical
- [ ] Document usage patterns
- [ ] Get user approval

---

### Step 6.3: Implement Vertical Storage

**Deliverable:** API and logic for storing/retrieving vertical

**Tasks:**
- [ ] Create API route for updating vertical
- [ ] Create hook/utility for reading vertical
- [ ] Integrate with workspace settings
- [ ] Test storage and retrieval

---

### Step 6.4: Implement Vertical Adaptations

**Deliverable:** Components that adapt to vertical

**Adaptations:**
- [ ] Dashboard headline per vertical
- [ ] Neptune system prompt per vertical
- [ ] Neptune opening message per vertical
- [ ] Quick actions per vertical
- [ ] Feature emphasis per vertical

**Tasks:**
- [ ] Implement each adaptation
- [ ] Test all 6 vertical configurations
- [ ] Verify fallback (general) works

---

### Step 6.5: Testing and Verification

**Deliverable:** Verified vertical system

**Tests:**
- [ ] Vertical can be set via conversation
- [ ] Vertical persists across sessions
- [ ] Dashboard adapts correctly for each vertical
- [ ] Neptune behaves differently per vertical
- [ ] Changing vertical updates experience
- [ ] General vertical works as fallback

---

# Checkpoint Completion Verification

Before moving to the next checkpoint, verify:

| # | Checkpoint | Verification |
|---|------------|--------------|
| 1 | Landing Page | User approves, live and working |
| 2 | Signup Flow | User approves, < 60 second signup |
| 3 | First-Run Experience | User approves, Neptune-first works |
| 4 | Neptune Conversation | User approves, vertical inference works |
| 5 | Dashboard Redesign | User approves, progressive disclosure works |
| 6 | Vertical Adaptation | User approves, all verticals adapt correctly |

---

# Dependencies

```
Checkpoint 1 (Landing Page)
    ↓
Checkpoint 2 (Signup Flow)
    ↓
Checkpoint 3 (First-Run Experience)
    ↓ ↔ Checkpoint 4 (Neptune Conversation) — tightly coupled
    ↓
Checkpoint 5 (Dashboard Redesign)
    ↓
Checkpoint 6 (Vertical Adaptation) — can partially run parallel with 5
```

---

# Open Questions (To Resolve Before Building)

1. **Pull-up bar approach:** Which option (A, B, C, D) do we use?
2. **OAuth providers:** Google/GitHub/email or email-only?
3. **Workspace creation:** Auto-generate name or ask user?
4. **First-run exit trigger:** What action completes first-run?
5. **Navigation items:** What's the minimal set?
6. **Progressive disclosure thresholds:** Exact trigger counts?

---

*This plan will be updated as decisions are made. No building begins until relevant section is approved.*
