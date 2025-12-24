# GalaxyCo — UI Component System

> **Purpose**  
This document defines GalaxyCo’s core UI components and how they behave. It translates the Guided Systems philosophy into buildable, repeatable interface elements.

This is not a component catalog for visuals alone. It is a **behavioral system** for how components guide users.

---

## 1. Component Philosophy

Every UI component in GalaxyCo must:
- Reduce cognitive load
- Imply the next step
- Feel stable and trustworthy

Components never shout. They **invite**.

If a component competes for attention, it violates the system.

---

## 2. Component Hierarchy (Global)

### Priority Order
1. **Primary Guidance Component** (one per screen)
2. **Supporting Context Components**
3. **Optional / Secondary Components**

There must never be more than **one** primary guidance component visible at a time.

---

## 3. Cards (Foundational Component)

### Purpose
Cards represent **stable system units** (agents, workflows, summaries, recommendations).

### Structure
- Rounded rectangle
- Soft elevation
- Clear internal hierarchy:
  1. Title
  2. Status
  3. Primary action

### Rules
- One primary action only
- Secondary actions must be visually de-emphasized
- No decorative elements

Cards should feel dependable, not clickable toys.

---

## 4. Nodes (Agents, Steps, Checkpoints)

### Purpose
Nodes represent **decision points or system checkpoints**.

### Structure
- Always circular
- Consistent diameter per context
- Centered icon or label

### States
- Inactive: muted tone
- Active: soft cyan accent
- Complete: subdued confirmation color

Nodes should feel calm, never urgent.

---

## 5. Paths & Connectors

### Purpose
Paths guide attention between components.

### Rules
- Smooth curves only
- Consistent stroke width
- Never intersect aggressively
- Direction implied subtly

Paths exist to orient the user, not to decorate space.

---

## 6. Buttons & Actions

### Primary Action
- One per screen
- Calm prominence
- Clear outcome

### Secondary Actions
- Visually quieter
- Never compete with primary

Buttons must feel intentional, not demanding.

---

## 7. Status Indicators

### Purpose
Communicate system state without alarm.

### Rules
- Use color sparingly
- Prefer icons or labels over animation
- No flashing or pulsing

Status should reassure, not alert.

---

## 8. Lists & Collections

### Purpose
Display multiple system elements without overwhelm.

### Rules
- Clear spacing between items
- Group related elements
- Avoid dense stacking

Lists should feel browsable, not exhaustive.

---

## 9. Empty Containers

### Purpose
Signal readiness, not absence.

### Structure
- Single focal element
- Calm explanatory text
- One clear next step

Empty means waiting with intention.

---

## 10. Overlays & Modals

### Purpose
Focus attention without disorientation.

### Rules
- Use sparingly
- Centered content
- Clear exit path

Overlays should feel like a pause, not a trap.

---

## 11. Error Components

### Philosophy
Errors are system adjustments, not failures.

### Rules
- Neutral language
- Calm presentation
- Clear resolution path

Never blame the user.

---

## 12. Component Validation Checklist

Before approving a component, confirm:

- Does it guide rather than demand?
- Is hierarchy immediately obvious?
- Does it feel calm and stable?
- Is its purpose singular?

If not, simplify.

---

## 13. Final Rule

Components are the **hands of the system**.

They should always feel steady.

> **Nothing in GalaxyCo should feel fragile, rushed, or noisy.**