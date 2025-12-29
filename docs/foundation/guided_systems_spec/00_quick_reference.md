# GalaxyCo — Quick Reference (Single Source of Truth)

> This document contains **implementation facts only**. No philosophy.

---

## Color Palette (Authoritative)

```txt
Void Black (Primary Background):  #0D0D12
Surface Dark:                     #161922
Surface Light:                    #F7F8FA
Electric Cyan (Primary Accent):   #00D4E8
Creamsicle (Secondary Accent):    #FF9966
```

No additional colors may be introduced without updating this file.

---

## Typography (Final)

```txt
Display / Headlines:  Space Grotesk
UI / Body:            Inter
Code / Technical:     JetBrains Mono
```

Geist and other fonts are deprecated unless explicitly reintroduced.

---

## Spacing Scale (Tokens)

```txt
xs   4px
sm   8px
md   16px
lg   24px
xl   32px
2xl  48px
```

Only these spacing values are permitted.

---

## Radius

```txt
Card Radius:        md
Modal Radius:       lg
Button Radius:      md
Hero / Containers:  lg
```

---

## Component → Anchor Mapping

```txt
Page Backgrounds        → Anchor 04 (Passive Context)
Cards / Controls        → Anchor 03 (Contained Focus)
Workflows / Paths       → Anchor 02 (System Flow)
Hero Sections           → Anchor 01 (System Authority)
```

Components may not blend anchors.

---

## Motion (Global)

```txt
Timing:        120–320ms
Easing:        ease-out / cubic-bezier(0.2, 0.8, 0.2, 1)
Motion Style:  Subtle, non-performative
```

---

_End of reference._