# Landing Page Specification — Trust-First Redesign

**Status:** Awaiting Approval
**Checkpoint:** 1.1 - Define Page Structure

---

## Objective

Replace the current feature-first landing page with a trust-first landing page that:
1. Leads with recognition of user pain (not feature announcements)
2. Demonstrates value before asking for signup (the "pull-up bar")
3. Follows Guided Systems design language
4. Works flawlessly on mobile

---

## Current State (What We're Replacing)

```
Current Flow:
Hero: "AI-native operating system for modern work"
CTA: "Enter Platform" (goes directly to dashboard)
Sections: Features, Benefits, Three Pillars
Problem: Feature-first, no value demonstration, asks before earning trust
```

---

## New Page Structure

### Section 1: Hero (Above the Fold)

**Purpose:** Recognize user's pain, invite interaction, NOT pitch features.

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]                                    [Sign In] (subtle)   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│         [Pain-recognition headline]                             │
│         [Empathetic sub-headline]                               │
│                                                                 │
│    ┌─────────────────────────────────────────────────────┐      │
│    │                                                     │      │
│    │        [PULL-UP BAR INTERACTION]                    │      │
│    │        (Interactive element - see Section 1.2)      │      │
│    │                                                     │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                 │
│              "No signup required. Just curiosity."              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Content Requirements:**
- Headline: Question or statement that recognizes a common pain
- Sub-headline: Empathetic, not capability-focused
- Pull-up bar: Interactive element (detailed in Step 1.2)
- Trust signal: "No signup required" reinforces low commitment

**What's NOT Here:**
- No feature list
- No "powerful AI" claims
- No aggressive signup CTA
- No pricing

---

### Section 2: Value Demonstration

**Purpose:** Show what Neptune can do, AFTER user has engaged with hero.

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              "What happens when you let Neptune help"           │
│                                                                 │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│   │             │   │             │   │             │          │
│   │  Example 1  │   │  Example 2  │   │  Example 3  │          │
│   │  [Outcome]  │   │  [Outcome]  │   │  [Outcome]  │          │
│   │             │   │             │   │             │          │
│   └─────────────┘   └─────────────┘   └─────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Content Requirements:**
- 3 concrete outcomes (not abstract features)
- Each shows: User situation → Neptune action → Result
- Real, specific, believable

**Examples:**
1. "You said 'remind me to follow up with John' → Neptune scheduled it → You got reminded"
2. "You added a lead → Neptune scored and prioritized it → You focused on the right one"
3. "You asked about cash flow → Neptune pulled the numbers → You made an informed decision"

---

### Section 3: How It Works

**Purpose:** Simple explanation for users who want to understand before committing.

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                     "Simple as talking"                         │
│                                                                 │
│        1. Tell Neptune what you need                            │
│                    ↓                                            │
│        2. Neptune handles the details                           │
│                    ↓                                            │
│        3. You stay focused on what matters                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Content Requirements:**
- 3 steps maximum
- Focus on user outcome, not product mechanics
- No jargon

---

### Section 4: Social Proof (Conditional)

**Purpose:** Build credibility through real testimonials.

**Rules:**
- ONLY include if we have real testimonials
- If no real testimonials, SKIP this section entirely
- Fake social proof destroys trust

**Layout (if included):**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    "What people are saying"                                     │
│                                                                 │
│    ┌─────────────────────────────────────────────────────┐      │
│    │  "[Quote]"                                          │      │
│    │  — Name, Role, Company                              │      │
│    └─────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Section 5: Final CTA

**Purpose:** Soft invitation to sign up, AFTER value has been demonstrated.

**Layout:**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│              "Ready to try it for real?"                        │
│                                                                 │
│              [Get Started — Free]                               │
│                                                                 │
│         "No credit card required. Cancel anytime."              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Content Requirements:**
- Soft language ("Ready to try" not "Start now")
- Reinforce low commitment (no credit card)
- Single CTA button

---

### Section 6: Footer

**Purpose:** Standard footer with necessary links.

**Content:**
- Logo
- Product links (if any)
- Legal links (Privacy, Terms)
- Copyright

**Rules:**
- No aggressive CTAs
- Keep minimal

---

## Navigation

**Visible Elements:**
- Logo (links to top of page)
- Sign In (subtle, text link or ghost button)

**NOT Visible:**
- No "Pricing" link (we don't lead with pricing)
- No feature dropdowns
- No complex navigation

---

## Mobile Considerations

**Requirements:**
- All sections stack vertically
- Pull-up bar interaction works on touch
- Hero fits on mobile viewport without scrolling (headline + interaction visible)
- Tap targets minimum 44px
- No horizontal scrolling

---

## Design System Alignment

**References:**
- `docs/foundation/guided_systems_spec/05_color_typography_and_surface_system.md`
- `docs/foundation/guided_systems_spec/10_motion_and_interaction_principles.md`

**Key Tokens:**
- Background: Void Black (#0D0D12)
- Surface: Elevated surfaces for cards
- Accent: Electric Cyan (sparingly — one per section)
- Typography: Confident, calm, concise
- Motion: Slow, eased, predictable

---

## What This Page Does NOT Include

| Excluded | Reason |
|----------|--------|
| Feature list | Features don't build trust |
| Pricing section | Premature — value first |
| Animated demos | Decoration, not value |
| Multiple CTAs | Fragments attention |
| "Powered by AI" badges | Hype, not trust |
| Comparison tables | Competitive, not empathetic |

---

## Success Criteria

- [ ] User can engage with pull-up bar without signing up
- [ ] Value is demonstrated before any signup prompt
- [ ] Page loads fast (< 3s on 3G)
- [ ] Mobile experience is excellent
- [ ] Copy aligns with Guided Systems tone (calm, confident, no hype)
- [ ] Single clear path through the page

---

## Decisions Made

1. **Social Proof:** No testimonials. Replace with real AI industry headlines for third-party validation.
2. **Pull-Up Bar:** Version A — Chip-based guided conversation (detailed below)
3. **Sign In:** Custom Apple-quality UI using Clerk Pro Elements

---

## Pull-Up Bar: Version A Specification

### Design

| Element | Spec |
|---------|------|
| **Style** | Google Search minimal — clean white/light, no noise |
| **Layout** | Full-screen hero, maximized to viewport |
| **Question** | One focused, carefully crafted question — large text |
| **Interaction** | 3 smart chips below — user clicks answer |
| **Response** | Neptune fades in with node animation showing solution |
| **Continuation** | Next question auto-generates slowly — chains engagement |
| **Transition** | Gentle auto-scroll to next section (Apple keynote style) |

### Question Flow (Conversation Tree)

**Opening Question:**
> "What's quietly costing you the most time?"

**Chips:**
1. "Leads slipping through the cracks"
2. "Follow-ups I keep forgetting"
3. "Jumping between too many tools"

---

**Path 1: "Leads slipping through the cracks"**

*Neptune Response (nodes animate):*
```
[Lead comes in] → [Neptune scores & prioritizes] → [You focus on the right ones]
```

*Follow-up Question:*
> "What happens to a lead after it comes in?"

*Chips:*
1. "I try to remember to follow up"
2. "It sits in a spreadsheet somewhere"
3. "Honestly? It depends on the day"

*Neptune Response:*
Shows how Neptune captures, tracks, and reminds automatically.

---

**Path 2: "Follow-ups I keep forgetting"**

*Neptune Response (nodes animate):*
```
[You mention it once] → [Neptune remembers] → [You get reminded at the right time]
```

*Follow-up Question:*
> "How do you currently track what needs follow-up?"

*Chips:*
1. "Mental notes (risky)"
2. "Scattered across apps"
3. "I don't — things slip"

*Neptune Response:*
Shows unified follow-up system with smart reminders.

---

**Path 3: "Jumping between too many tools"**

*Neptune Response (nodes animate):*
```
[CRM here] → [Notes there] → [Calendar somewhere else] → [Neptune: One place]
```

*Follow-up Question:*
> "How many tools are you using to run your business?"

*Chips:*
1. "3-5 (manageable chaos)"
2. "6-10 (daily juggling)"
3. "I've lost count"

*Neptune Response:*
Shows consolidation into single system.

---

### After Conversation Completes

**Soft CTA appears:**
> "Want Neptune to actually do this for you?"
> [Try it free — no card required]

**Then:** Gentle auto-scroll to Value Demonstration section.

---

---

## Component Architecture

### File Structure
```
src/components/landing-v2/
├── TrustFirstLanding.tsx      # Main page orchestrator
├── HeroSection.tsx            # Full-screen hero with pull-up bar
├── PullUpBar/
│   ├── PullUpBar.tsx          # Container for chip interaction
│   ├── QuestionDisplay.tsx    # Animated question text
│   ├── ChipGroup.tsx          # 3 smart chips
│   ├── NeptuneResponse.tsx    # Neptune fade-in with nodes
│   └── NodeAnimation.tsx      # Animated solution flow
├── ValueSection.tsx           # 3 outcome examples
├── HowItWorksSection.tsx      # Simple 3-step explanation
├── IndustryValidation.tsx     # AI headlines (replaces testimonials)
├── FinalCTA.tsx               # Soft signup prompt
├── MinimalNav.tsx             # Logo + Sign In only
└── LandingFooter.tsx          # Minimal footer
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `TrustFirstLanding` | Page layout, section ordering, scroll behavior |
| `HeroSection` | Full-viewport hero, houses PullUpBar |
| `PullUpBar` | State machine for question flow |
| `QuestionDisplay` | Animates question text in/out |
| `ChipGroup` | Renders 3 chips, handles selection |
| `NeptuneResponse` | Fades in Neptune, triggers node animation |
| `NodeAnimation` | Draws animated solution flow nodes |
| `ValueSection` | Static 3-column outcomes |
| `HowItWorksSection` | Static 3-step process |
| `IndustryValidation` | Fetches/displays AI industry headlines |
| `FinalCTA` | Signup button + trust signals |
| `MinimalNav` | Fixed nav, logo left, sign-in right |
| `LandingFooter` | Links, copyright |

### State Management

**PullUpBar State Machine:**
```typescript
type PullUpBarState =
  | { step: 'question'; questionIndex: number }
  | { step: 'responding'; selectedChip: string }
  | { step: 'complete' }

// Flow: question → user clicks chip → responding (Neptune animates) → next question or complete
```

### No Backend Required

All question/response content is **static configuration** — no API calls needed for the pull-up bar. This keeps it fast and simple.

### Key Technical Notes

1. **Full-viewport hero:** Use `h-screen` or `100dvh` for mobile accuracy
2. **Smooth scroll:** CSS `scroll-behavior: smooth` + JS for auto-scroll trigger
3. **Node animation:** Framer Motion for sequenced node reveals
4. **Light theme hero:** Override dark Guided Systems for hero only, return to dark below
5. **Mobile chips:** Stack vertically on small screens

---

## Status

1. ✅ Page structure — Done
2. ✅ Pull-up bar interaction — Done
3. ✅ Component architecture — Done
4. → Copy and messaging — Next
5. → Design implementation
6. → Testing
7. → Deploy

---

*Specification complete. Ready for implementation.*
