# Cosmos Design System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Cosmos design system as a Pencil file + engineering rules doc for GalaxyCo 3.0.

**Architecture:** Engineering rules doc adapted from Flashpoint's format (~450 lines). Pencil file organized as [System] > [Components] > [Screens] with oklch tokens, three-tier glass, neumorphic shadows.

**Tech Stack:** Pencil MCP tools, Tailwind v4 oklch tokens, shadcn/ui component patterns.

**Design doc:** `docs/plans/2026-03-02-cosmos-design-system.md` (approved, read it for full token specs)

---

## Task 1: Write GALAXYCO-ENGINEERING-RULES.md

**Files:**
- Create: `GALAXYCO-ENGINEERING-RULES.md` (project root)
- Reference: `docs/plans/2026-03-02-cosmos-design-system.md` (approved design)
- Reference: Flashpoint engineering rules at `C:\Users\Owner\workspace\flashpoint\docs\FLASHPOINT-ENGINEERING-RULES.md` (structural template)

**Step 1: Read the Flashpoint engineering rules file**

Read the full file for structural reference. The GalaxyCo version follows the same format.

**Step 2: Write the engineering rules**

Create `GALAXYCO-ENGINEERING-RULES.md` at the project root. ~450 lines. Sections:

1. Stack (Next.js 16, React 19, Tailwind v4 oklch, shadcn/ui, Drizzle/Neon, Clerk, OpenAI+Anthropic+Gemini, Trigger.dev, Pusher+Liveblocks, Stripe, Lucide icons)
2. TypeScript (strict, no any, Zod on boundaries, derive types from schemas)
3. React / Next.js (Server Components default, Server Actions for mutations, result pattern, component structure order, file naming, props interface max 5-7)
4. State Management (server > URL > React Query > component > Zustand)
5. Data Layer — Multi-Tenant (workspaceId on every table and query, transactions, migrations-only in prod, select needed fields, paginate all lists)
6. API Routes (result pattern, status codes)
7. AI Integration — Neptune (stream responses, maxTokens, Zod-validate AI output, rate limit, cost protection, cache prompts, multi-model config)
8. Error Handling (result pattern, three UI states, human-safe messages)
9. Colors — Cosmos Light Theme (full oklch palette from design doc Section 1, glass intensity scale, sidebar dark rail, canvas dot grid)
10. Typography (Space Grotesk / Inter / JetBrains Mono, full type scale from design doc Section 2, all rules)
11. Spacing — 4px Grid (full token table, spacing contexts, layout dimensions from design doc Section 3)
12. Shadows & Glass (neumorphic + Neptune glow from design doc Section 5, glass intensity scale)
13. Border Radius (full table from design doc Section 4)
14. Interactive Elements (all 5 states, button sizes/variants, input specs, color-mix derivation)
15. Motion (timing tokens, easing functions, animation specs, Neptune-specific motion from design doc Section 6)
16. Z-Index Scale (from design doc Section 7)
17. Accessibility (semantic HTML, focus-visible, color + secondary indicator, contrast ratios, 44px touch targets, aria patterns)
18. Performance (next/font max 3 families, bundlephobia check, dynamic imports, skeleton loaders match dimensions)
19. Copy & Voice (verb+noun buttons, sentence case, no "successfully", no exclamation marks, numerals in UI, relative time for recent, large numbers human-readable)
20. Naming Conventions (boolean is/has, handler handle, event on, async verb suffix, SCREAMING_SNAKE constants)
21. Ops & Shipping (conventional commits, three environments, pre-deploy checklist)
22. The "Never" List (all universal rules from Flashpoint + GalaxyCo-specific: workspaceId, raw Tailwind colors, off-grid spacing, mixing shadow systems, overusing teal, font-weight 700, dot grid on non-body, glass-neptune on non-AI surfaces, LLM without maxTokens, trusting AI output without Zod)
23. Global CSS (box-sizing, font-smoothing, tap-highlight, reduced-motion)
24. Project Structure (mirror existing src/ layout from INDEX.md)

Each section should include the actual token values (oklch colors, px values, CSS snippets) — not references to the design doc. This file must be self-contained.

**Step 3: Verify the file**

Read it back. Confirm:
- All oklch token values from the design doc are present
- All spacing values are listed
- The "Never" list is comprehensive
- No section references external docs for its values (self-contained)

**Step 4: Commit**

```bash
git add GALAXYCO-ENGINEERING-RULES.md
git commit -m "docs: add Cosmos engineering rules — unified design system law"
```

---

## Task 2: Create Pencil File + Set Variables

**Files:**
- Create: `designs/galaxyco-cosmos.pen` (new Pencil file)
- Reference: `docs/plans/2026-03-02-cosmos-design-system.md` (color tokens, spacing, typography)

**Step 1: Create the designs directory and open a new Pencil document**

```bash
mkdir -p designs
```

Use `mcp__pencil__open_document` with `filePathOrTemplate: "new"` to create a new document.

**Step 2: Save the file**

The file will be at the Pencil default location. We'll work with whatever path it provides.

**Step 3: Set design variables using `mcp__pencil__set_variables`**

Define the full Cosmos token system as Pencil variables:

**Colors (oklch values from design doc Section 1):**
- `$--background`: oklch(0.97 0.004 240) → #F2F4F8
- `$--foreground`: oklch(0.20 0.018 250) → #1C2030
- `$--card`: oklch(0.995 0.002 240) → #FBFCFE
- `$--card-foreground`: oklch(0.20 0.018 250) → #1C2030
- `$--muted`: oklch(0.94 0.006 240) → #E6E9F0
- `$--muted-foreground`: oklch(0.53 0.014 250) → #6E7790
- `$--border`: oklch(0.90 0.006 240) → #D6DAE4
- `$--input`: oklch(0.92 0.006 240) → #DEE2EC
- `$--primary`: oklch(0.58 0.10 195) → #3D8E8E
- `$--primary-foreground`: #FBFFFF
- `$--secondary`: oklch(0.55 0.12 290) → #7C6BA0
- `$--secondary-foreground`: #FDFBFF
- `$--destructive`: oklch(0.55 0.20 27) → #C44040
- `$--destructive-foreground`: #FFFBFB
- `$--success`: oklch(0.62 0.17 155) → #2D9960
- `$--success-foreground`: oklch(0.40 0.12 155) → #1B6B3F
- `$--warning`: oklch(0.75 0.14 75) → #C89520
- `$--warning-foreground`: oklch(0.48 0.10 75) → #8A6515
- `$--error`: oklch(0.55 0.20 27) → #C44040
- `$--error-foreground`: oklch(0.40 0.16 27) → #8B2D2D
- `$--info`: oklch(0.60 0.16 250) → #4070C4
- `$--info-foreground`: oklch(0.40 0.12 250) → #2B4F8A
- `$--sidebar`: oklch(0.18 0.018 250) → #1A1E2C
- `$--sidebar-foreground`: oklch(0.88 0.006 250) → #D6DAE4
- `$--sidebar-accent`: oklch(0.22 0.018 250) → #232840
- `$--sidebar-muted`: oklch(0.50 0.010 250) → #6A7080

**Typography:**
- `$--font-primary`: "Space Grotesk"
- `$--font-secondary`: "Inter"
- `$--font-mono`: "JetBrains Mono"

**Border Radius:**
- `$--radius-none`: 0
- `$--radius-xs`: 2
- `$--radius-sm`: 4
- `$--radius-md`: 6
- `$--radius-lg`: 10
- `$--radius-xl`: 14
- `$--radius-pill`: 9999

**Step 4: Verify variables**

Use `mcp__pencil__get_variables` to confirm all tokens are set correctly.

---

## Task 3: Build System Layer — Token Showcase

**Purpose:** Visual documentation of the token system. Color swatches, type scale, spacing grid, glass samples. This is the [System] section of the Pencil file.

**Step 1: Create the [System] container frame**

Use `mcp__pencil__batch_design` to insert a container frame at the document root:
- Name: "System"
- Layout: vertical, gap 48
- Width: 1440, auto height
- Fill: `$--background`

**Step 2: Build color swatches section**

Inside [System], create a section showing all color tokens:
- Section title: "Colors" (Space Grotesk, h2)
- Row of core color swatches: background, foreground, card, muted, border, input
- Row of accent swatches: primary, secondary, destructive
- Row of status swatches: success, warning, error, info (each showing dot + bg + text + border variants)
- Row of sidebar swatches: sidebar, sidebar-foreground, sidebar-accent, sidebar-muted

Each swatch: 80x80 rectangle with color fill + label below (caption size, muted-foreground).

**Step 3: Build typography scale section**

- Section title: "Typography" (Space Grotesk, h2)
- Display each type token as a line of sample text at its actual size/weight/font:
  - display: "Display — Space Grotesk 48px/500"
  - h1: "Heading 1 — Space Grotesk 36px/500"
  - h2: "Heading 2 — Space Grotesk 24px/500"
  - h3: "Heading 3 — Inter 16px/600"
  - section-label: "SECTION LABEL — INTER 11PX/500"
  - body: "Body text — Inter 14px/400"
  - body-sm: "Body small — Inter 13px/400"
  - caption: "Caption — Inter 11px/500"
  - data: "1,234.56 — JetBrains Mono 13px/500"
  - data-lg: "$12,450 — JetBrains Mono 20px/500"

**Step 4: Build spacing grid section**

- Section title: "Spacing" (Space Grotesk, h2)
- Visual blocks showing each spacing token: colored rectangles at 4, 8, 12, 16, 20, 24, 32, 40, 48px widths with labels

**Step 5: Build glass samples section**

- Section title: "Glass" (Space Grotesk, h2)
- Three side-by-side panels demonstrating each glass tier:
  - glass-subtle: 8px blur, 70% opacity, labeled
  - glass-medium: 12px blur, 60% opacity, labeled
  - glass-neptune: 16px blur, teal tint, labeled
- Place on a background with the dot grid texture visible

**Step 6: Build shadow samples section**

- Section title: "Shadows" (Space Grotesk, h2)
- Cards showing each shadow level:
  - shadow-raised (resting)
  - shadow-raised-hover
  - shadow-inset (input)
  - shadow-elevated (dropdown)
  - shadow-neptune (teal glow)

**Step 7: Build border radius samples**

- Section title: "Radius" (Space Grotesk, h2)
- Row of rectangles showing each radius token: none, xs, sm, md, lg, xl, pill

**Step 8: Screenshot and verify**

Use `mcp__pencil__get_screenshot` on the [System] frame. Verify:
- All colors render correctly
- Typography samples show correct fonts/sizes
- Glass panels look distinct from each other
- No visual errors

---

## Task 4: Build Atoms — Buttons

**Step 1: Create [Components] container frame**

Below [System], insert a new container frame:
- Name: "Components"
- Layout: vertical, gap 48
- Width: 1440, auto height
- Fill: `$--background`

**Step 2: Build Button component set**

Inside [Components], create a section "Buttons" with reusable button components:

- **Primary Button:** `$--primary` fill, `$--primary-foreground` text, `$--radius-md`, padding 8v/16h, Inter 14px/500. Mark as reusable.
- **Secondary Button:** `$--glass-subtle` surface (card fill at 70% opacity), `$--foreground` text, subtle border. Mark as reusable.
- **Ghost Button:** transparent fill, `$--foreground` text, hover shows `$--muted` bg. Mark as reusable.
- **Destructive Button:** `$--destructive` fill, `$--destructive-foreground` text. Mark as reusable.
- **Icon Button:** 40x40, `$--radius-md`, centered Lucide icon (16px). Mark as reusable.

Show each in three sizes: sm (32px height), md (40px height), lg (48px height).

**Step 3: Screenshot buttons**

Verify visual hierarchy: primary stands out, secondary is glass-like, ghost is minimal.

---

## Task 5: Build Atoms — Inputs & Form Elements

**Step 1: Build Input components**

- **Text Input:** 40px height, `$--radius-sm`, `$--input` border, `$--card` fill, `$--foreground` text, `$--muted-foreground` placeholder. Mark reusable.
- **Search Input:** Text input + search icon (Lucide, 16px) left-aligned. Mark reusable.
- **Textarea:** Same styling as input, min-height 96px. Mark reusable.
- **Select:** Input styling + chevron-down icon right-aligned. Mark reusable.

**Step 2: Build toggle elements**

- **Checkbox:** 18x18, `$--radius-xs`, `$--border` stroke. Checked variant: `$--primary` fill + white check icon.
- **Switch:** 40x20 pill, `$--muted` off / `$--primary` on, white circle indicator.

**Step 3: Screenshot inputs**

Verify consistent heights, alignment, focus ring visibility.

---

## Task 6: Build Atoms — Badges, Avatars, Misc

**Step 1: Build Badge variants**

- **Default Badge:** `$--muted` fill, `$--foreground` text, `$--radius-xs`, padding 2v/8h, caption size (11px).
- **Status Badges:** success, warning, error, info — each using status triplet (bg/text/border from design doc).
- **Muted Badge:** Lower contrast version.

All marked reusable.

**Step 2: Build Avatar component**

- Sizes: sm (28px), md (36px), lg (48px). `$--radius-pill`.
- Fallback variant: `$--muted` fill with initials in `$--muted-foreground`.

**Step 3: Build Separator**

- Horizontal: 1px height, `$--border` fill, full width.
- Vertical: 1px width, `$--border` fill, full height.

**Step 4: Screenshot atoms**

Verify all atom components render correctly and consistently.

---

## Task 7: Build Molecules — Card, Stat Card, Nav Item

**Step 1: Build Card component**

Reusable card with slots:
- Container: `$--card` fill, `$--shadow-raised` (approximate in Pencil), `$--radius-md`, padding 16.
- Header slot: Space for title (Inter 16px/600) + optional action.
- Content slot: Flexible content area.
- Footer slot: Optional actions row.

Mark as reusable.

**Step 2: Build Stat Card component**

Compact card variant:
- Container: card styling, padding 16.
- Label: section-label style (Inter 11px/500, uppercase, `$--muted-foreground`).
- Value: data-lg style (JetBrains Mono 20px/500, `$--foreground`).
- Delta: caption style, `$--success` for positive, `$--error` for negative.
- Optional sparkline area.

Mark as reusable.

**Step 3: Build Nav Item component**

- Default: transparent bg, `$--sidebar-foreground` text, Lucide icon 16px, Inter 14px/400, padding 8v/12h.
- Active: glass bg (`$--sidebar-accent`), `$--sidebar-foreground` text, 4px `$--primary` dot indicator left-aligned.

Mark as reusable.

**Step 4: Screenshot molecules**

Verify card elevation looks neumorphic, stat card is compact, nav item active state shows teal dot (not teal fill).

---

## Task 8: Build Molecules — Table, Form Field, Search Bar

**Step 1: Build Data Table component**

Follow Pencil table guidelines (Table > Row > Cell structure):
- Header row: `$--muted` fill, Inter 11px/500 uppercase text, `$--muted-foreground`.
- Body rows: `$--card` fill, Inter 14px/400, `$--foreground`.
- Alternating row: `$--muted` at low opacity.
- Cell padding: 12h/8v.
- Sortable column indicator: chevron icon.

**Step 2: Build Form Field component**

- Label: Inter 14px/500, `$--foreground`, margin-bottom 4px.
- Input: from Task 5 atom.
- Helper text: Inter 13px/400, `$--muted-foreground`.
- Error text: Inter 13px/400, `$--error`.

Mark as reusable.

**Step 3: Build Search Bar component**

- `$--card` fill with subtle glass, `$--radius-md`, search icon left, "Search..." placeholder, "Cmd+K" badge right-aligned.

Mark as reusable.

**Step 4: Screenshot molecules**

Verify table alignment, form field label-input spacing, search bar layout.

---

## Task 9: Build Molecules — Empty State, Toast, Loading Skeleton, Tab Group

**Step 1: Build Empty State component**

- Centered layout, padding 32.
- Icon: 48px, `$--muted-foreground`.
- Title: h3 (Inter 16px/600).
- Description: body-sm, `$--muted-foreground`, max-width 320.
- Optional CTA button (primary, sm).

Mark as reusable.

**Step 2: Build Toast component**

- Glass-medium surface, `$--radius-lg`, padding 12/16.
- Icon (16px) + message (Inter 14px) + optional action link.
- Variants: success, error, info (icon + left border color changes).

Mark as reusable.

**Step 3: Build Loading Skeleton**

- Pulsing rectangles in `$--muted` color.
- Card skeleton: rounded rect.
- Table skeleton: row of rects.
- Stat skeleton: small rect + large rect.

**Step 4: Build Tab Group**

- Row of tab labels (Inter 14px/500).
- Active tab: `$--foreground` text + 2px `$--primary` underline.
- Inactive tab: `$--muted-foreground` text.

Mark as reusable.

**Step 5: Screenshot**

Verify empty state centering, toast glass effect, tab active underline is teal.

---

## Task 10: Build Organisms — App Shell

**Step 1: Create [Screens] container frame**

Below [Components], insert:
- Name: "Screens"
- Layout: horizontal, gap 80
- Width: auto, auto height

**Step 2: Build Sidebar organism**

Full-height left panel (260px x 900px):
- `$--sidebar` fill (dark graphite).
- Top: Logo area (Space Grotesk, 18px, "GalaxyCo", white text), padding 16.
- Nav section: Stack of Nav Item molecules (Dashboard, CRM, Finance, Marketing, Agents, Knowledge, Orchestration, Insights, Creator). Active = Dashboard.
- Bottom: User avatar + name + settings gear, `$--sidebar-muted` text.

**Step 3: Build Top Bar organism**

Full-width bar (fill x 56px):
- Glass-subtle surface.
- Left: Breadcrumb (Home > Dashboard), `$--muted-foreground`.
- Center: Page title (h2, Space Grotesk).
- Right: Search bar (compact) + Neptune toggle button (ghost, with Neptune icon) + notification bell.

**Step 4: Build Page Layout frame**

Container showing sidebar + top bar + content area composed:
- Sidebar left (260px).
- Right column: Top bar (56px) + content area (fill, `$--background` with dot grid, padding 32).
- Total: 1440x900.

**Step 5: Screenshot app shell**

Verify: dark sidebar contrasts with light content area, dot grid visible in content, top bar glass is subtle, nav active state shows teal dot.

---

## Task 11: Build Organisms — Neptune Panel

**Step 1: Build Neptune Panel organism**

Right-side panel (380px x full height):
- `--glass-neptune` treatment: teal-tinted translucent bg, `$--radius-xl` on left edge, subtle teal border.
- Header: "Neptune" title (Space Grotesk h3) + status dot (teal, 8px) + minimize button.
- Message thread area (scrollable):
  - AI message: 2px teal left border, content area, timestamp in caption.
  - User message: plain, right-aligned.
- Input area: bottom, text input + send button.

**Step 2: Build Neptune thinking state variant**

Same panel but:
- Status dot pulses (represent with slightly larger/glowing dot).
- Thinking indicator: "Neptune is thinking..." in `$--muted-foreground` with teal dot.

**Step 3: Screenshot Neptune panel**

Verify: glass effect is visible and distinct from standard cards, teal is restrained (border + dot + message accent only), panel feels "alive" but not overwhelming.

---

## Task 12: Build Organisms — Modal, Command Palette

**Step 1: Build Modal organism**

- Overlay: semi-transparent dark fill.
- Container: glass-medium, `$--radius-lg`, max-width 480, padding 24.
- Header: h3 title + close button (ghost, icon-only).
- Content slot.
- Footer: cancel (ghost) + confirm (primary) buttons, right-aligned.

**Step 2: Build Command Palette organism**

- Centered, glass-medium, `$--radius-lg`, max-width 560.
- Search input at top (no border, large, Inter 16px).
- Categorized results: section labels (section-label style) + result items (icon + label + optional shortcut badge).
- Highlighted result: `$--muted` bg.

**Step 3: Screenshot**

Verify modal overlay + glass effect, command palette search prominence.

---

## Task 13: Compose Screen — Dashboard

**Step 1: Compose the Dashboard screen**

Use the App Shell from Task 10 as the base. In the content area:

- Page header: "Dashboard" (h1, Space Grotesk) + "Welcome back" subtitle + date.
- Stat cards row: 4 stat cards (Revenue, Leads, Deals, Tasks) using the Stat Card molecule. 4-column grid, 16px gap.
- Charts section: 2-column grid with placeholder chart cards (large cards, 280px height).
- Activity feed: Card with list of recent items (avatar + description + timestamp).
- Neptune panel open on the right side.

Total frame: 1440 + 380 = 1820px wide (or show Neptune overlaying).

**Step 2: Screenshot dashboard**

Verify: visual hierarchy (stat cards prominent, charts secondary), glass on Neptune panel, teal only on active nav + Neptune dot + one primary CTA, neumorphic lift on cards.

---

## Task 14: Compose Screen — CRM

**Step 1: Compose the CRM screen**

App Shell base, CRM nav item active:

- Page header: "CRM" (h1) + "Manage contacts and deals" + action buttons (primary: "Add Contact", ghost: "Import").
- Tab group: Leads | Contacts | Deals | Organizations. Leads active.
- Search bar: below tabs, full width.
- Data table: columns — Name (avatar+name), Company, Status (badge), Value (JetBrains Mono), Last Contact (relative time), Actions (icon buttons).
- 8 sample rows with realistic data.
- Pagination below table.

**Step 2: Screenshot CRM**

Verify: table density feels right (compact but readable), teal only on active tab underline + "Add Contact" button, badges use status triplets.

---

## Task 15: Compose Screen — Neptune Conversation

**Step 1: Compose Neptune-focused screen**

App Shell base, Neptune panel expanded to show a full conversation:

- 3-4 message exchanges showing:
  - User: "What's our pipeline looking like this month?"
  - Neptune: Formatted response with inline data (JetBrains Mono for numbers), a mini stat summary.
  - User: "Create a follow-up task for the Acme deal"
  - Neptune: Confirmation with action card ("Task created: Follow up with Acme Corp — Due Mar 5").
- Proactive suggestion card at bottom: "You have 3 deals closing this week. Want a summary?"

**Step 2: Screenshot Neptune**

Verify: glass treatment is the star, teal is minimal (border accents, dots), messages are readable, data figures use mono font.

---

## Task 16: Compose Screen — Settings

**Step 1: Compose Settings screen**

App Shell base, form-heavy layout:

- Page header: "Settings" (h1) + "Manage your workspace".
- Card sections (vertical stack, 24px gap):
  - **Profile card:** Avatar (lg) + form fields (Name, Email, Role select).
  - **Notifications card:** Switch toggles for Email, Push, In-app notifications.
  - **Workspace card:** Workspace name input + timezone select + save button (primary).
  - **Danger zone card:** subtle destructive border, "Delete workspace" destructive button.

**Step 2: Screenshot Settings**

Verify: form fields are consistent, switches align, card sections create clear grouping, destructive button is visually distinct.

---

## Task 17: Final Validation

**Step 1: Screenshot each reference screen**

Take screenshots of all 4 composed screens + the [System] + [Components] sections.

**Step 2: Validate against design doc**

Check each screen against `docs/plans/2026-03-02-cosmos-design-system.md`:
- [ ] Colors match oklch specs (no raw hex, no off-palette colors)
- [ ] Typography uses correct fonts/sizes/weights per scale
- [ ] Spacing follows 4px grid (no off-grid values)
- [ ] Glass tiers are visually distinct (subtle < medium < neptune)
- [ ] Teal appears max 3 times per screen
- [ ] Neumorphic shadows visible on cards
- [ ] Neptune panel has distinct glass treatment
- [ ] Sidebar is dark, content is light
- [ ] Dot grid visible on canvas behind cards
- [ ] All interactive elements show correct border radius

**Step 3: Fix any issues found**

Iterate on any visual inconsistencies.

**Step 4: Commit design doc + .pen file**

```bash
git add docs/plans/2026-03-02-cosmos-design-system.md
git add docs/plans/2026-03-02-cosmos-implementation-plan.md
git add GALAXYCO-ENGINEERING-RULES.md
git add designs/
git commit -m "feat: add Cosmos design system — engineering rules + Pencil design file"
```

---

## Summary

| Task | What | Estimated Effort |
|------|------|-----------------|
| 1 | Engineering rules doc | Medium (writing) |
| 2 | Create .pen + set variables | Quick |
| 3 | System layer (token showcase) | Medium |
| 4 | Atoms — Buttons | Quick |
| 5 | Atoms — Inputs & form elements | Quick |
| 6 | Atoms — Badges, avatars, misc | Quick |
| 7 | Molecules — Card, stat card, nav item | Medium |
| 8 | Molecules — Table, form field, search | Medium |
| 9 | Molecules — Empty state, toast, skeleton, tabs | Medium |
| 10 | Organisms — App shell (sidebar + top bar + layout) | Medium-Heavy |
| 11 | Organisms — Neptune panel | Medium |
| 12 | Organisms — Modal, command palette | Quick |
| 13 | Screen — Dashboard | Medium |
| 14 | Screen — CRM | Medium |
| 15 | Screen — Neptune conversation | Medium |
| 16 | Screen — Settings | Quick |
| 17 | Final validation | Quick |

**Total: 17 tasks.** Atoms and molecules build the vocabulary. Organisms compose them. Screens prove the system works at scale.
