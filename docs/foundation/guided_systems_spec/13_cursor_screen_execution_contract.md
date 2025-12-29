# GalaxyCo — Cursor Screen Execution Contract

> **Purpose**  
This document is the final execution layer for GalaxyCo. It removes interpretation and enforces consistency by defining *exactly* how Cursor must build screens using the existing anchors, brand assets, and design doctrine.

This is not a design document. It is an **execution contract**.

---

## 1. Mandatory Screen Classification

Before building anything, Cursor **must classify the screen** as exactly ONE of the following:

- Dashboard
- Workflow / Builder
- Onboarding / Setup
- Settings
- Review / Confirmation
- Empty / Loading State

If the screen cannot be classified, Cursor must stop and simplify until it can.

---

## 2. Anchor Usage Rules (Non-Negotiable)

Every screen must explicitly map each layer to a single anchor.

### Anchor Reference
- **Anchor 01 — System Authority (Hero)**
- **Anchor 02 — System Flow (Operational)**
- **Anchor 03 — Contained Focus (Micro)**
- **Anchor 04 — Passive Context (Surface)**

Anchors may not be blended inside a single component.

---

## 3. Screen-to-Anchor Mapping

### Dashboard
- Background / shell → **Anchor 04**
- Primary guidance card → **Anchor 03**
- Optional hero (max one) → **Anchor 01**
- No more than one dominant focus

---

### Workflow / Builder
- Overall structure & progression → **Anchor 02**
- Controls & steps → **Anchor 03**
- Background → **Anchor 04**
- Flow must be visually continuous

---

### Onboarding / Setup
- Progression → **Anchor 02**
- Active step surface → **Anchor 03**
- Background → **Anchor 04**
- One action per screen

---

### Settings
- Background → **Anchor 04**
- Setting blocks → **Anchor 03**
- No heroes, no flow visuals

---

### Review / Confirmation
- Background → **Anchor 04**
- Summary card → **Anchor 03**
- Optional subtle authority cue → **Anchor 01 (light use only)**

---

### Empty / Loading States
- Base surface → **Anchor 04**
- Optional single guidance element → **Anchor 03**
- No flow or hero imagery

---

## 4. Component Budget (Hard Limits)

Each screen is limited to:
- **1 primary action**
- **1 dominant card or focus surface**
- **Maximum 3 secondary elements**

If the screen requires more, the design must be split into multiple screens.

---

## 5. Build Order Enforcement

Cursor must build screens in this order:

1. Lay down background and surface framing (**Anchor 04**)
2. Place structural layout
3. Insert primary focus components (**Anchor 03**)
4. Add flow or progression if required (**Anchor 02**)
5. Add hero authority LAST and only if justified (**Anchor 01**)

Reversing this order is not allowed.

---

## 6. Visual Prohibitions

The following are strictly forbidden:

- Sharp edges or aggressive angles
- High-contrast lighting
- Dense grids or information walls
- Multiple competing CTAs
- Decorative gradients or effects
- Futuristic or sci-fi aesthetics

If a visual element draws attention to itself, it must be removed.

---

## 7. Reduction Rule

Before finalizing any screen, Cursor must:

- Attempt to remove at least one element
- Prefer fewer components over smaller components
- Choose clarity over completeness

Reduction is mandatory, not optional.

---

## 8. Validation Checklist (Required)

Before delivery, Cursor must confirm:

- Screen classification is clear
- Every component maps to exactly one anchor
- One dominant focus exists
- One primary action exists
- Visual tone feels calm and composed

If any check fails, the screen is incomplete.

---

## 9. Final Directive

GalaxyCo screens must feel:

> **Quietly confident. Structured. Non-performative.**

Cursor’s role is not to impress.

**Cursor’s role is to execute the system.**

---

_End of contract._