# GalaxyCo — UI State and Feedback System

> **Purpose**  
This document defines how GalaxyCo communicates system state to the user. It ensures all feedback—loading, empty, success, error—feels calm, predictable, and reassuring.

States are where trust is either reinforced or lost.

---

## 1. State Philosophy

GalaxyCo treats state changes as **normal system behavior**, not events.

The system is always working. The UI simply reflects *where it is*.

States should never:
- Surprise
- Alarm
- Interrupt momentum

If a state draws attention to itself, it violates Guided Systems.

---

## 2. Global State Hierarchy

At any moment, the UI should communicate **one primary state**:

1. Ready
2. In Progress
3. Waiting
4. Completed
5. Adjusting (error or correction)

Multiple states competing at once is not allowed.

---

## 3. Loading States

### Purpose
Communicate that the system is working without creating urgency.

### Visual Rules
- Slow, predictable motion
- Subtle progress indication
- No pulsing or flashing

### Copy Rules
- Calm, neutral language
- Avoid time estimates unless exact

Example:
> “Preparing your workspace.”

Loading should feel like quiet competence.

---

## 4. Empty States

### Purpose
Signal readiness, not absence.

### Structure
- One focal visual or node
- Brief explanatory message
- One clear next step

### Copy Tone
- Reassuring
- Forward-looking

Example:
> “Nothing here yet. Create your first agent to get started.”

Empty is a beginning, not a failure.

---

## 5. Success States

### Purpose
Confirm completion without celebration.

### Visual Rules
- Subtle accent color
- Minimal animation (if any)
- No confetti or rewards

### Copy Rules
- Acknowledge outcome
- Suggest next step quietly

Example:
> “Agent connected. Ready to continue.”

Success should feel composed.

---

## 6. Error & Adjustment States

### Philosophy
Errors are system adjustments, not user mistakes.

The system takes responsibility.

---

### Visual Rules
- Neutral colors
- No red dominance
- No aggressive icons

### Copy Rules
- Calm, respectful language
- Clear resolution path
- Never blame the user

Example:
> “We couldn’t connect just now. Try again in a moment.”

Errors should feel solvable, not stressful.

---

## 7. Inline Feedback

### Purpose
Provide guidance without interruption.

### Rules
- Appear near the point of action
- Disappear when resolved
- Never stack multiple messages

Inline feedback should feel like a quiet nudge.

---

## 8. Progress & Completion Indicators

### Rules
- Prefer steps over percentages
- Show progress only when meaningful
- Avoid fake precision

Progress indicators should reassure, not pressure.

---

## 9. Notification Strategy

### Philosophy
Notifications are informational, not emotional.

### Rules
- Only surface what matters
- Avoid urgency unless critical
- No badges for vanity

If something can wait, it should wait.

---

## 10. Timing & Transitions

- State changes should never be abrupt
- Allow brief visual settling
- Avoid instant disappearances

Transitions should feel natural.

---

## 11. Validation Checklist

Before approving a state design, confirm:

- Does it reduce anxiety?
- Is the system taking responsibility?
- Is the next step clear?
- Does it maintain composure?

If not, simplify.

---

## 12. Final Rule

States are moments of truth.

GalaxyCo should always feel like:

> **“The system is aware, steady, and handling it.”**