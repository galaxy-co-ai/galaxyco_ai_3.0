# GalaxyCo — Dark & Light Mode Rules

## Status: Authoritative

This document defines **exact rules** for how Dark Mode and Light Mode are implemented within the GalaxyCo Guided Systems framework.

Dark Mode is the **primary expression** of the brand. Light Mode is a **supported, derivative mode** that must preserve calm, structure, and hierarchy.

---

## 1. Mode Philosophy

### Dark Mode (Primary)
- Default mode for GalaxyCo
- Expresses calm authority, depth, and system control
- Used in all marketing, demos, and default product entry points

### Light Mode (Secondary)
- Accessibility and preference-driven
- Must feel equally calm, never stark or clinical
- Should never feel like a “reversal” of dark mode

Light Mode is not an opportunity to redesign — it is a translation.

---

## 2. Background & Surface Rules

### Dark Mode
```txt
Primary Background:  #0D0D12 (Void Black)
Surface Dark:       #161922
Surface Elevated:   rgba(255,255,255,0.04–0.06)
```

- Depth is created via **elevation**, not contrast
- Surfaces separate gently

### Light Mode
```txt
Primary Background:  #F7F8FA
Surface Light:       #FFFFFF
Surface Elevated:    rgba(0,0,0,0.04–0.06)
```

- White is softened, never pure
- Separation relies on subtle shadow, not borders

---

## 3. Text & Contrast

### Dark Mode
- Primary text: near-white, not pure white
- Secondary text: reduced opacity
- Never use pure white on large surfaces

### Light Mode
- Primary text: near-black, softened
- Secondary text: reduced opacity
- Avoid harsh black (#000000)

Contrast must always pass accessibility thresholds **without feeling sharp**.

---

## 4. Accent & Color Usage

```txt
Primary Accent:    #00D4E8 (Electric Cyan)
Secondary Accent:  #FF9966 (Creamsicle)
```

Rules:
- Accents behave identically in both modes
- Accents are **signals**, not decoration
- No additional accent colors per mode

---

## 5. Components Across Modes

### Cards (Anchor 03)
- Shape, spacing, and hierarchy are identical
- Only surface color and shadow change
- No borders added in light mode

### Workflows (Anchor 02)
- Path continuity remains identical
- Active step emphasis uses opacity, not brightness

### Heroes (Anchor 01)
- Rare in light mode
- Must maintain restraint and negative space

---

## 6. Motion & Interaction

Motion behavior is **identical** in both modes.

```txt
Timing: 120–320ms
Easing: cubic-bezier(0.2, 0.8, 0.2, 1)
```

No additional motion is introduced for mode switching.

---

## 7. Prohibitions (Both Modes)

The following are forbidden in both dark and light mode:

- Hard borders as separators
- High-contrast outlines
- Mode-specific layouts
- Decorative lighting or glow
- Re-styled components per mode

If a component requires redesign to work in light mode, the component is incorrect.

---

## 8. Validation Checklist

Before approving a screen in either mode:

- Visual hierarchy remains identical
- One dominant focus remains
- Calm tone is preserved
- No new visual elements introduced

If any fail, reduce.

---

## Final Principle

> Dark Mode defines the system.  
> Light Mode respects the system.

---

_End of document._