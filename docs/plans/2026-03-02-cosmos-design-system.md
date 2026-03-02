# Cosmos Design System — GalaxyCo 3.0

> Approved 2026-03-02. This is the design source of truth for GalaxyCo's unified UI.
> Two deliverables: `GALAXYCO-ENGINEERING-RULES.md` (the law) + `galaxyco-cosmos.pen` (the proof).

---

## Context

GalaxyCo 3.0 has ~350 components across 18 modules with severe design fragmentation:
- 5% of components use the existing Nebula color tokens
- 95% use raw Tailwind colors or hardcoded hex
- Spacing, typography, and layout patterns are ad-hoc per module
- No enforcement mechanism exists

### Decision
Design a new unified system ("Cosmos") in Pencil before touching code. Light mode for the app shell. Landing pages stay dark (as-is).

### Reference Systems
- **CB Collab** — engineering rigor, oklch tokens, neumorphic shadows, graph paper texture, Swiss red accent discipline
- **Flashpoint** — glass panel treatment, warm dark palette, amber accent, 4px grid discipline, engineering rules format

### Philosophy
**Glass carries the aesthetic, teal punctuates.** The quality of layered depth, shadow craft, and translucency does the heavy lifting. Teal appears only at decision points — if you removed all teal from a screen and it still looks beautiful, we did it right.

---

## 1. Color Foundation

**Color space:** oklch (Tailwind v4 native, perceptual uniformity)

### Light Theme Core

| Token | oklch | Hex Ref | Role |
|-------|-------|---------|------|
| `--background` | `oklch(0.97 0.004 240)` | `#F2F4F8` | Page canvas — cool blue-gray |
| `--foreground` | `oklch(0.20 0.018 250)` | `#1C2030` | Primary text — deep blue-black |
| `--card` | `oklch(0.995 0.002 240)` | `#FBFCFE` | Card surface — near-white |
| `--card-foreground` | `oklch(0.20 0.018 250)` | `#1C2030` | Card text |
| `--muted` | `oklch(0.94 0.006 240)` | `#E6E9F0` | Subtle backgrounds, disabled |
| `--muted-foreground` | `oklch(0.53 0.014 250)` | `#6E7790` | Secondary text, placeholders |
| `--border` | `oklch(0.90 0.006 240)` | `#D6DAE4` | Default borders |
| `--input` | `oklch(0.92 0.006 240)` | `#DEE2EC` | Input borders |

### Primary Accent — Nebula Teal

| Token | oklch | Hex Ref | Role |
|-------|-------|---------|------|
| `--primary` | `oklch(0.58 0.10 195)` | `#3D8E8E` | Primary actions, active states, links |
| `--primary-foreground` | `oklch(0.99 0.002 195)` | `#FBFFFF` | Text on primary |
| `--primary-subtle` | `oklch(0.58 0.10 195 / 0.08)` | — | Tinted backgrounds |
| `--primary-hover` | via `color-mix(in oklch, var(--primary), black 10%)` | — | Derived at point of use |

**Usage rule:** Max 3 teal-accented elements per visible screen. Glass carries the aesthetic.

### Secondary — Nebula Violet

| Token | oklch | Hex Ref | Role |
|-------|-------|---------|------|
| `--secondary` | `oklch(0.55 0.12 290)` | `#7C6BA0` | Tags, categories, secondary CTAs |
| `--secondary-foreground` | `oklch(0.99 0.002 290)` | `#FDFBFF` | Text on secondary |
| `--secondary-subtle` | `oklch(0.55 0.12 290 / 0.08)` | — | Tinted backgrounds |

### Status Triplets (bg + text + border)

| Status | Dot/Icon | Background | Text | Border |
|--------|----------|------------|------|--------|
| Success | `oklch(0.62 0.17 155)` | `.../ 0.08` | `oklch(0.40 0.12 155)` | `.../ 0.20` |
| Warning | `oklch(0.75 0.14 75)` | `.../ 0.08` | `oklch(0.48 0.10 75)` | `.../ 0.20` |
| Error | `oklch(0.55 0.20 27)` | `.../ 0.08` | `oklch(0.40 0.16 27)` | `.../ 0.20` |
| Info | `oklch(0.60 0.16 250)` | `.../ 0.08` | `oklch(0.40 0.12 250)` | `.../ 0.20` |

### Destructive
`oklch(0.55 0.20 27)` — muted red-brown. "Careful" vs "do this."

### Glass Intensity Scale

| Level | Blur | BG Opacity | Border | Use |
|-------|------|-----------|--------|-----|
| `--glass-subtle` | 8px | `oklch(0.99 0.002 240 / 0.70)` | `oklch(0.20 0.018 250 / 0.06)` | Standard cards, dropdowns |
| `--glass-medium` | 12px | `oklch(0.99 0.002 240 / 0.60)` | `oklch(0.20 0.018 250 / 0.10)` | Feature panels, modals, toolbar |
| `--glass-neptune` | 16px | `oklch(0.58 0.10 195 / 0.04)` | `oklch(0.58 0.10 195 / 0.12)` | Neptune surfaces only |

### Sidebar (Dark Rail)

| Token | oklch | Role |
|-------|-------|------|
| `--sidebar` | `oklch(0.18 0.018 250)` | Dark graphite with blue undertone |
| `--sidebar-foreground` | `oklch(0.88 0.006 250)` | Light text |
| `--sidebar-accent` | `oklch(0.22 0.018 250)` | Active nav item bg |
| `--sidebar-muted` | `oklch(0.50 0.010 250)` | Inactive icons |
| Active indicator | `var(--primary)` | Teal icon tint for active nav |

### Canvas Texture — Dot Grid

```css
background-image: radial-gradient(
  oklch(0.20 0.018 250 / 0.07) 1px,
  transparent 1px
);
background-size: 24px 24px;
```

Applied to `body` only. Cards and panels are solid — the dot grid shows through gaps.

---

## 2. Typography

### Three-Font System

| Layer | Font | Role |
|-------|------|------|
| Display/Authority | Space Grotesk | Page titles, hero metrics, section headers |
| Body/Engineering | Inter | Nav, buttons, labels, body text |
| Data | JetBrains Mono | KPIs, percentages, timestamps, financial figures |

### Type Scale

| Token | Font | Size | Weight | Tracking | Use |
|-------|------|------|--------|----------|-----|
| `display` | Space Grotesk | `clamp(32px, 4vw, 48px)` | 500 | `-0.02em` | Dashboard hero, Neptune greeting |
| `h1` | Space Grotesk | `clamp(24px, 3vw, 36px)` | 500 | `-0.015em` | Page titles |
| `h2` | Space Grotesk | `clamp(18px, 2.5vw, 24px)` | 500 | `-0.01em` | Section headings |
| `h3` | Inter | 16px | 600 | normal | Card titles, panel headers |
| `section-label` | Inter | 11px | 500 | `0.08em` | Uppercase tracked labels |
| `body` | Inter | 14px | 400 | normal | Default text |
| `body-sm` | Inter | 13px | 400 | normal | Secondary text, metadata |
| `caption` | Inter | 11px | 500 | `0.02em` | Timestamps, badges |
| `data` | JetBrains Mono | 13px | 500 | normal | KPIs, dollar amounts |
| `data-lg` | JetBrains Mono | 20px | 500 | `-0.01em` | Large metric values |

### Rules
- 14px body (not 16px) — data-dense app needs density
- Inputs stay 16px minimum — iOS zoom prevention
- All headings use `clamp()` — no breakpoint-based font changes
- `tabular-nums` on all changing numbers
- `text-wrap: balance` on all headings
- `max-width: 65ch` on paragraph text
- Max weight 600 — no bold (700) anywhere
- Negative letter-spacing on display/h1 only

---

## 3. Spacing (4px Grid, Strict)

| Token | Value | Use |
|-------|-------|-----|
| `--space-1` | 4px | Tight element gaps |
| `--space-2` | 8px | Component padding, small gaps |
| `--space-3` | 12px | Between related items |
| `--space-4` | 16px | Card padding, grid gaps |
| `--space-5` | 20px | Between card groups |
| `--space-6` | 24px | Section spacing, large card padding |
| `--space-8` | 32px | Page padding, major section gaps |
| `--space-10` | 40px | Page top/bottom margins |
| `--space-12` | 48px | Hero spacing |

**Rule:** Nothing outside this scale. No `p-2.5`, no `gap-1.5`, no arbitrary values.

### Spacing Contexts (Locked)

| Context | Padding | Gap |
|---------|---------|-----|
| Page container | 32px | — |
| Card (standard) | 16px | 12px internal |
| Card (large/feature) | 24px | 16px internal |
| Stat card | 16px | 8px internal |
| Table cell | 12px h / 8px v | — |
| Form fields | 12px | 16px between fields |
| Button (md) | 8px v / 16px h | 8px icon gap |
| Sidebar nav items | 8px v / 12px h | 4px between items |
| Modal | 24px | 16px internal |

### Layout Dimensions

| Element | Value |
|---------|-------|
| Sidebar (expanded) | 260px |
| Sidebar (collapsed) | 56px |
| Top bar height | 56px |
| Neptune panel width | 380px |
| Content max-width | 1280px |

---

## 4. Border Radius

6px is the anchor. Moderate — warmer than CB Collab's austerity, sharper than bubbly SaaS.

| Token | Value | Use |
|-------|-------|-----|
| `--radius-none` | 0px | Dividers, full-bleed elements |
| `--radius-xs` | 2px | Inline badges, tiny chips |
| `--radius-sm` | 4px | Table cells, inputs, small buttons |
| `--radius-md` | 6px | Default — buttons, cards, dropdowns |
| `--radius-lg` | 10px | Large cards, modals, panels |
| `--radius-xl` | 14px | Feature panels, Neptune glass |
| `--radius-pill` | 9999px | Avatars, toggles, status dots |

---

## 5. Shadow System

### Standard Surfaces (Neumorphic Lift)

```css
--shadow-raised: 2px 2px 6px oklch(0.20 0.018 250 / 0.06), -1px -1px 4px oklch(1.00 0.00 0 / 0.60);
--shadow-raised-hover: 4px 4px 12px oklch(0.20 0.018 250 / 0.09), -2px -2px 6px oklch(1.00 0.00 0 / 0.70);
--shadow-inset: inset 2px 2px 4px oklch(0.20 0.018 250 / 0.08), inset -1px -1px 3px oklch(1.00 0.00 0 / 0.50);
--shadow-focus: 0 0 0 2px var(--background), 0 0 0 4px var(--primary);
--shadow-elevated: 0 8px 24px oklch(0.20 0.018 250 / 0.10), 0 2px 8px oklch(0.20 0.018 250 / 0.06);
```

### Neptune Glass Shadows (Teal Glow)

```css
--shadow-neptune: 0 0 0 1px var(--neptune-glass-border), 0 0 16px oklch(0.58 0.10 195 / 0.08);
--shadow-neptune-hover: 0 0 0 1px var(--neptune-glass-border), 0 0 24px oklch(0.58 0.10 195 / 0.14);
--shadow-neptune-active: 0 0 0 1px oklch(0.58 0.10 195 / 0.25), 0 0 32px oklch(0.58 0.10 195 / 0.18);
```

**Data modules lift (neumorphic). Neptune glows (teal aura). Never mix on one element.**

---

## 6. Motion

### Timing

| Token | Value | Use |
|-------|-------|-----|
| `--duration-instant` | 100ms | Tooltips, color changes |
| `--duration-fast` | 150ms | Hover states, icons |
| `--duration-normal` | 200ms | Panels, page crossfades |
| `--duration-smooth` | 300ms | Drawers, modals, sidebars |
| `--duration-neptune` | 400ms | Neptune panel, AI responses |

### Easing

```css
--ease-standard:  cubic-bezier(0.2, 0, 0, 1);
--ease-enter:     cubic-bezier(0, 0, 0, 1);
--ease-exit:      cubic-bezier(0.3, 0, 1, 1);
--ease-emphasized: cubic-bezier(0.05, 0.7, 0.1, 1);
```

### Rules
- Exit is always 30% faster than enter
- Only animate `transform` and `opacity`
- `prefers-reduced-motion` respected for all non-essential motion
- No spring physics, no parallax, no bounce
- CSS transitions for standard UI. Framer Motion reserved for Neptune expressive states
- Hover: change ONE property only

### Interactive States (All 5, Non-Negotiable)

| State | Implementation |
|-------|----------------|
| Default | Base appearance |
| Hover | Behind `@media (hover: hover)`. 150ms. Shadow lifts |
| Active/Pressed | Scale 0.97. Shadow returns to resting |
| Focus-visible | `--shadow-focus` ring. Keyboard only |
| Disabled | Opacity 0.5, `cursor: not-allowed` |

### Color Derivation (No separate hover tokens)

```css
color-mix(in oklch, var(--primary), white 15%)  /* hover */
color-mix(in oklch, var(--primary), black 10%)  /* active */
color-mix(in oklch, var(--primary), var(--background) 90%)  /* subtle */
```

### Neptune Motion

| State | Visual |
|-------|--------|
| Idle | Glass panel, static, subtle teal border |
| Listening | Border glow intensifies over 300ms |
| Thinking | Gentle opacity pulse (0.6→1.0, 2s cycle) on teal dot. No skeleton shimmer |
| Responding | Text chunks appear with 100ms fade-in per chunk |
| Suggesting | Proactive cards slide up, 300ms emphasized ease |

---

## 7. Z-Index Scale

| Z | Element |
|---|---------|
| 0 | Page content |
| 1 | Cards with elevation |
| 10 | Sticky headers, sidebar |
| 20 | Dropdowns, popovers |
| 25 | Neptune panel |
| 30 | Modals, dialogs |
| 35 | Command palette |
| 40 | Toasts |

---

## 8. Component Inventory (Pencil Build)

### Layer 1: Atoms

| Component | Variants |
|-----------|----------|
| Button | primary, secondary, ghost, destructive, icon-only. Sizes: sm/md/lg |
| Input | text, search, with icon, with addon |
| Textarea | default, with character count |
| Select | default, with search |
| Checkbox | unchecked, checked, indeterminate |
| Switch | off, on |
| Badge | default, success, warning, error, info, muted |
| Avatar | image, initials, fallback. Sizes: sm/md/lg |
| Tooltip | default |
| Separator | horizontal, vertical |

### Layer 2: Molecules

| Component | Notes |
|-----------|-------|
| Card | `--glass-subtle`, `--shadow-raised`, `--radius-md` |
| Stat Card | JetBrains Mono value, delta only gets teal if positive |
| Data Table | Sticky header, sortable, alternating rows |
| Form Field | Label + input + helper/error |
| Nav Item | Active = glass bg + 4px teal dot |
| Search Bar | `--glass-subtle`, cmd+K affordance |
| Empty State | Icon + title + description + optional CTA |
| Loading Skeleton | Pulsing shapes matching layout dimensions |
| Toast | `--glass-medium`, enter from bottom-right |

### Layer 3: Organisms

| Component | Notes |
|-----------|-------|
| App Shell | Sidebar + top bar + content area |
| Sidebar | Dark rail, teal dot for active nav |
| Top Bar | Breadcrumb + title + actions + Neptune toggle |
| Page Layout | Header + content grid, 32px padding, 1280px max |
| Dashboard Grid | 4→2→1 responsive stat cards + charts |
| Neptune Panel | `--glass-neptune`, 380px right panel, 400ms emphasized slide |
| Neptune Message | AI = teal left border (2px). User = plain |
| Modal | `--glass-medium`, `--radius-lg`, scale enter |
| Command Palette | `--glass-medium`, centered, cmd+K |
| Tab Group | Active = teal underline (2px) |

### Reference Screens (4)

1. **Dashboard** — stat cards, chart grid, activity feed, Neptune panel open
2. **CRM** — data table, filters, search bar, tab group
3. **Neptune Panel** — conversation thread, thinking state, proactive suggestions
4. **Settings** — form-heavy, inputs, switches, card sections

### Pencil File Organization

```
galaxyco-cosmos.pen
├── [System]       ← Tokens, swatches, type scale, spacing, glass samples
├── [Components]   ← Atoms + molecules + organisms
└── [Screens]      ← 4 reference screens
```

---

## 9. Engineering Rules

Delivered as `GALAXYCO-ENGINEERING-RULES.md` (~450 lines). Adapted from Flashpoint's format.

Covers: Stack, TypeScript, React/Next.js, State Management, Data Layer (Multi-Tenant), API Routes, AI Integration (Neptune), Error Handling, Cosmos Tokens (colors/type/spacing/shadows/glass), Interactive Elements, Motion, Z-Index, Accessibility, Performance, Copy & Voice, Naming Conventions, Ops & Shipping, The "Never" List, Global CSS, Project Structure.

Key GalaxyCo-specific additions:
- Multi-tenant `workspaceId` isolation on every query
- Neptune glass treatment tiers
- Accent restraint (max 3 teal elements per screen)
- Module organization pattern

---

## Implementation Order

1. Write `GALAXYCO-ENGINEERING-RULES.md`
2. Build `galaxyco-cosmos.pen` — System layer (tokens, swatches)
3. Build atoms in Pencil
4. Build molecules in Pencil
5. Build organisms in Pencil
6. Compose 4 reference screens
7. Screenshot and validate

*Design authored 2026-03-02. Ready for implementation.*
