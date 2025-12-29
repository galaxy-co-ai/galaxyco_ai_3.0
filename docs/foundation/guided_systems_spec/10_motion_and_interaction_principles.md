# GalaxyCo — Motion and Interaction Principles

> **Purpose**  
This document defines how motion and interaction behave across GalaxyCo. It ensures animation, transitions, and micro-interactions reinforce calm, trust, and guidance—never excitement or urgency.

Motion is not decoration. It is **evidence of control**.

---

## 1. Motion Philosophy

Motion exists to:
- Clarify change
- Preserve orientation
- Communicate system awareness

Motion must never:
- Demand attention
- Compete with content
- Signal urgency by default

If motion feels energetic, it violates Guided Systems.

---

## 2. Global Motion Rules (Non-Negotiable)

- Slow over fast
- Eased over linear
- Predictable over expressive
- Subtle over visible

Nothing should surprise the user.

---

## 3. Timing & Easing

### Timing Guidelines
- Micro transitions: 120–180ms
- Screen transitions: 220–320ms
- State transitions: 180–260ms

Avoid durations under 100ms or over 400ms.

---

### Easing Rules
- Use ease-in-out curves
- Avoid bounce, elastic, or overshoot
- Acceleration and deceleration must feel natural

Easing should feel like confidence, not flair.

---

## 4. Entry & Exit Transitions

### Entry
- Fade + slight positional settle
- Never slide aggressively

### Exit
- Gentle fade
- Avoid abrupt disappearances

Transitions should feel like *continuation*, not interruption.

---

## 5. Component-Level Motion

### Cards
- Subtle lift on hover
- No scale jumps
- No shadow spikes

### Buttons
- Soft highlight on hover
- No pulse animations

### Nodes
- State change via color and slight emphasis
- No spinning or flashing

---

## 6. Loading & Progress Motion

### Rules
- Linear or gently eased indicators
- No looping that draws attention
- Avoid fake progress

Loading motion should reassure, not entertain.

---

## 7. Attention Management

### Allowed
- Gentle emphasis for the primary action
- Subtle glow or highlight only when meaningful

### Forbidden
- Multiple moving elements at once
- Competing animations
- Motion used to compensate for poor hierarchy

Motion must follow hierarchy, never create it.

---

## 8. Feedback & Confirmation Motion

### Success
- Minimal confirmation
- Brief highlight or settle
- No celebration effects

### Error
- Stillness preferred
- Gentle appearance
- No shaking or vibration

The system remains composed at all times.

---

## 9. Scroll & Navigation Behavior

- Smooth scrolling
- No snap-by-default
- Avoid parallax unless extremely subtle

Navigation should feel frictionless and familiar.

---

## 10. Performance as a Principle

Dropped frames erode trust.

- Prefer simpler animations
- Degrade gracefully
- Motion must never block interaction

Performance is part of the experience.

---

## 11. Validation Checklist

Before approving motion, confirm:

- Does this clarify what changed?
- Does it preserve orientation?
- Does it feel calm and intentional?
- Would removing it make things worse?

If motion does not add clarity, remove it.

---

## 12. Final Rule

GalaxyCo motion should always feel like:

> **“The system is aware of my actio