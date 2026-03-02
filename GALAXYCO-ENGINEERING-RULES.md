# GalaxyCo 3.0 — Engineering Rules

> Single-file reference for Claude Code. Cosmos design tokens + build rules.
> Load this file at session start. Follow as law.

---

## Stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript 5.7 strict
- **Styling:** Tailwind CSS 4 (oklch native), Radix UI via shadcn/ui, Framer Motion (Neptune only)
- **ORM:** Drizzle (Neon Postgres), schema at `src/db/schema.ts` (~8900 lines, 50+ tables)
- **Auth:** Clerk (SSO, MFA, webhooks). Middleware at `src/middleware.ts`
- **AI:** OpenAI GPT-4 (primary) + Anthropic Claude + Google Gemini (fallbacks). Multi-model via `src/lib/ai-providers.ts`
- **Vector/RAG:** Upstash Vector + Redis
- **Background Jobs:** Trigger.dev (`src/trigger/`)
- **Realtime:** Pusher (events) + Liveblocks (collaboration)
- **Payments:** Stripe
- **Communications:** SignalWire (SMS/voice), Resend (email)
- **Storage:** Vercel Blob
- **Monitoring:** Sentry (source maps, tunnel at `/monitoring`)
- **Icons:** Lucide React (outlined, 1.5px stroke, sizes 14/16/20)
- **Package Manager:** npm (not pnpm)

---

## TypeScript

- `strict: true`, `noUncheckedIndexedAccess: true`. No `any`. No `@ts-ignore`.
- Zod validation on every trust boundary: API response, form input, URL params, env vars, webhook payload, AI output.
- Derive types from Zod schemas: `z.infer<typeof schema>`. Never define types AND schemas separately.
- Use `unknown` + type guard when truly untyped.

---

## React / Next.js

- **Server Components by default.** Add `"use client"` only for: useState, useEffect, event handlers, browser APIs.
- **Server Actions for mutations.** API routes only for webhooks, cron, external consumers.
- **Every server action returns:** `{ success: true, data } | { success: false, error }`. No exceptions thrown to client.
- **Auth check is FIRST line** of every protected server action and API route. Check authentication AND authorization.
- **workspaceId is SECOND.** Every query filters by workspace. No exceptions.
- **Component structure order:** Types > Function > Hooks > Derived values > Handlers > Early returns (loading/error/empty) > JSX.
- **File naming:** Components `PascalCase.tsx`, hooks `use-kebab-case.ts`, utils `kebab-case.ts`, types `kebab-case.types.ts`.
- **Props:** Interfaces (not types), name `ComponentNameProps`, destructure in signature, max 5-7 props.
- **No `useEffect` for data fetching.** Server Components or Server Actions.
- **Dynamic imports** for heavy components: charts, modals, rich editors via `next/dynamic`.

---

## State Management

Priority order (prefer higher):
1. **Server state** — Server Components, pass as props
2. **URL state** — `useSearchParams` for filters, pagination, tabs
3. **Server cache** — React Query for client-side refetching needs
4. **Component state** — `useState` for ephemeral UI (panel open/closed, form inputs)
5. **Global client state** — Zustand for cross-component UI state

URL state for anything a user might share or bookmark. `router.replace` for filters, `router.push` for navigation.

---

## Data Layer — Multi-Tenant

- **workspaceId on every table, every query.** Cross-tenant data leaks are security incidents.
- **Table names:** singular PascalCase (`Contact`, `Deal`). Columns: snake_case. Drizzle maps to camelCase in TypeScript.
- **Every table gets:** `id` (uuid, `defaultRandom()`), `workspaceId` (uuid), `createdAt`, `updatedAt`.
- **Foreign keys:** named `{model}Id`, always indexed, both sides of relation defined.
- **Enums:** defined in both DB and Zod, kept in sync.
- **Migrations only in production.** `db:push` for local dev. Never edit deployed migrations.
- **Select needed fields only.** Paginate all lists. Index WHERE/ORDER BY/JOIN columns.
- **Transactions** for multi-step mutations.
- **Cache invalidation:** `revalidatePath()` / `revalidateTag()` after mutations. Narrowest scope.

---

## API Routes (when needed)

Response shape for ALL routes:
```
Success: { success: true, data: T }
Error:   { success: false, error: { code: string, message: string, details?: unknown } }
```
Status codes: 200, 201, 400, 401, 403, 404, 429, 500. Never return 200 with error body.

---

## AI Integration — Neptune

- **Stream responses** for all user-facing generation.
- **Set `maxTokens`** on every call. No unbounded generation.
- **Validate AI output with Zod** before using in app. AI output is untrusted external data.
- **Rate limit all AI endpoints** — Claude and GPT-4 calls cost real money.
- **Cost protection:** `src/lib/cost-protection.ts` guards against runaway spend.
- **Cache identical prompts** when appropriate (`src/lib/llm-cache.ts`).
- **Multi-model config:** OpenAI primary, Anthropic + Gemini fallbacks. `src/lib/ai-providers.ts`.
- **Neptune personality:** warm, proactive, efficient. Maintain tone in all system prompts.

---

## Error Handling

- Result pattern everywhere: `{ success: true, data } | { success: false, error }`.
- Log technical error server-side. Return human-safe message to client.
- Every data-fetching component has three states: loading skeleton, error state, empty state.
- Error messages: **what happened + why + what to do next.**
- Never show raw error messages or stack traces to users.

---

## Colors — Cosmos Light Theme

Color space: oklch (Tailwind v4 native, perceptual uniformity).

### Core

```css
--background:          oklch(0.97 0.004 240);   /* #F2F4F8  page canvas, cool blue-gray */
--foreground:          oklch(0.20 0.018 250);   /* #1C2030  primary text, deep blue-black */
--card:                oklch(0.995 0.002 240);  /* #FBFCFE  card surface, near-white */
--card-foreground:     oklch(0.20 0.018 250);   /* #1C2030  card text */
--muted:               oklch(0.94 0.006 240);   /* #E6E9F0  disabled, subtle bg */
--muted-foreground:    oklch(0.53 0.014 250);   /* #6E7790  secondary text, placeholders */
--border:              oklch(0.90 0.006 240);   /* #D6DAE4  default borders */
--input:               oklch(0.92 0.006 240);   /* #DEE2EC  input borders */
```

### Primary — Nebula Teal

```css
--primary:             oklch(0.58 0.10 195);    /* #3D8E8E  actions, active states, links */
--primary-foreground:  oklch(0.99 0.002 195);   /* #FBFFFF  text on primary */
--primary-subtle:      oklch(0.58 0.10 195 / 0.08);  /* tinted backgrounds */
```

**Usage rule:** Max 3 teal-accented elements per visible screen. Glass carries the aesthetic.

### Secondary — Nebula Violet

```css
--secondary:           oklch(0.55 0.12 290);    /* #7C6BA0  tags, categories */
--secondary-foreground: oklch(0.99 0.002 290);  /* #FDFBFF  text on secondary */
--secondary-subtle:    oklch(0.55 0.12 290 / 0.08);  /* tinted backgrounds */
```

### Status Triplets (dot/icon, bg, text, border)

```css
/* Success */
--success:             oklch(0.62 0.17 155);    /* dot/icon */
--success-bg:          oklch(0.62 0.17 155 / 0.08);
--success-foreground:  oklch(0.40 0.12 155);
--success-border:      oklch(0.62 0.17 155 / 0.20);

/* Warning */
--warning:             oklch(0.75 0.14 75);
--warning-bg:          oklch(0.75 0.14 75 / 0.08);
--warning-foreground:  oklch(0.48 0.10 75);
--warning-border:      oklch(0.75 0.14 75 / 0.20);

/* Error / Destructive */
--destructive:         oklch(0.55 0.20 27);     /* muted red-brown, "careful" vs "do this" */
--destructive-bg:      oklch(0.55 0.20 27 / 0.08);
--destructive-foreground: oklch(0.40 0.16 27);
--destructive-border:  oklch(0.55 0.20 27 / 0.20);

/* Info */
--info:                oklch(0.60 0.16 250);
--info-bg:             oklch(0.60 0.16 250 / 0.08);
--info-foreground:     oklch(0.40 0.12 250);
--info-border:         oklch(0.60 0.16 250 / 0.20);
```

### Sidebar (Dark Rail)

```css
--sidebar:             oklch(0.18 0.018 250);   /* #1A1E2C  dark graphite */
--sidebar-foreground:  oklch(0.88 0.006 250);   /* #D6DAE4  light text */
--sidebar-accent:      oklch(0.22 0.018 250);   /* #232840  active nav bg */
--sidebar-muted:       oklch(0.50 0.010 250);   /* #6A7080  inactive icons */
```

Active nav indicator: glass bg + 4px `var(--primary)` teal dot. Not teal fill.

### Glass Intensity Scale

| Level | Blur | Background | Border | Use |
|-------|------|-----------|--------|-----|
| glass-subtle | 8px | `oklch(0.99 0.002 240 / 0.70)` | `oklch(0.20 0.018 250 / 0.06)` | Cards, dropdowns |
| glass-medium | 12px | `oklch(0.99 0.002 240 / 0.60)` | `oklch(0.20 0.018 250 / 0.10)` | Modals, toolbar |
| glass-neptune | 16px | `oklch(0.58 0.10 195 / 0.04)` | `oklch(0.58 0.10 195 / 0.12)` | Neptune surfaces only |

**Data surfaces lift (neumorphic). Neptune glows (teal aura). Never mix on one element.**

### Canvas Texture — Dot Grid

```css
background-image: radial-gradient(oklch(0.20 0.018 250 / 0.07) 1px, transparent 1px);
background-size: 24px 24px;
```

Applied to `body` only. Cards are solid — the dot grid shows through gaps.

### Color Derivation (No separate hover tokens)

```css
color-mix(in oklch, var(--primary), white 15%)           /* hover */
color-mix(in oklch, var(--primary), black 10%)            /* active */
color-mix(in oklch, var(--primary), var(--background) 90%) /* subtle */
```

---

## Typography

Three-font system. All loaded via `next/font` in root layout.

| Layer | Font | Role |
|-------|------|------|
| Display | Space Grotesk | Page titles, hero metrics, section headers |
| Body | Inter | Nav, buttons, labels, body text |
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

- 14px body (not 16px) — data-dense app needs density.
- Inputs stay 16px minimum — iOS zoom prevention.
- All headings use `clamp()`. No breakpoint-based font changes.
- `tabular-nums` on all changing numbers.
- `text-wrap: balance` on all headings.
- `max-width: 65ch` on paragraph text.
- Max weight 600. No bold (700) anywhere.
- Negative letter-spacing on display/h1/h2 only.

---

## Spacing — 4px Grid

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

**Nothing outside this scale.** No `p-2.5`, no `gap-1.5`, no arbitrary values.

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

## Shadows & Glass

### Standard Surfaces (Neumorphic Lift)

```css
--shadow-raised:       2px 2px 6px oklch(0.20 0.018 250 / 0.06),
                       -1px -1px 4px oklch(1.00 0.00 0 / 0.60);
--shadow-raised-hover: 4px 4px 12px oklch(0.20 0.018 250 / 0.09),
                       -2px -2px 6px oklch(1.00 0.00 0 / 0.70);
--shadow-inset:        inset 2px 2px 4px oklch(0.20 0.018 250 / 0.08),
                       inset -1px -1px 3px oklch(1.00 0.00 0 / 0.50);
--shadow-focus:        0 0 0 2px var(--background), 0 0 0 4px var(--primary);
--shadow-elevated:     0 8px 24px oklch(0.20 0.018 250 / 0.10),
                       0 2px 8px oklch(0.20 0.018 250 / 0.06);
```

### Neptune Glass Shadows (Teal Glow)

```css
--shadow-neptune:       0 0 0 1px var(--glass-neptune-border),
                        0 0 16px oklch(0.58 0.10 195 / 0.08);
--shadow-neptune-hover: 0 0 0 1px var(--glass-neptune-border),
                        0 0 24px oklch(0.58 0.10 195 / 0.14);
--shadow-neptune-active: 0 0 0 1px oklch(0.58 0.10 195 / 0.25),
                         0 0 32px oklch(0.58 0.10 195 / 0.18);
```

**Data modules lift (neumorphic). Neptune glows (teal aura). Never mix on one element.**

---

## Border Radius

6px anchor. Moderate — warmer than austerity, sharper than bubbly SaaS.

| Token | Value | Use |
|-------|-------|-----|
| `--radius-none` | 0px | Dividers, full-bleed |
| `--radius-xs` | 2px | Inline badges, tiny chips |
| `--radius-sm` | 4px | Table cells, inputs, small buttons |
| `--radius-md` | 6px | Default — buttons, cards, dropdowns |
| `--radius-lg` | 10px | Large cards, modals, panels |
| `--radius-xl` | 14px | Feature panels, Neptune glass |
| `--radius-pill` | 9999px | Avatars, toggles, status dots |

---

## Interactive Elements

Every interactive element needs all 5 states: default, hover, active/pressed, focus-visible, disabled.

| State | Implementation |
|-------|----------------|
| Default | Base appearance |
| Hover | Behind `@media (hover: hover)`. 150ms. Shadow lifts. ONE property change |
| Active/Pressed | Scale 0.97. Shadow returns to resting |
| Focus-visible | `--shadow-focus` ring. Keyboard only |
| Disabled | Opacity 0.5, `cursor: not-allowed` |

### Buttons

- Sizes: sm (32px), md (40px), lg (48px). Min touch target: 44x44px.
- **Primary:** `--primary` fill, `--primary-foreground` text. ONE per screen area.
- **Secondary:** Glass-subtle surface, `--foreground` text, subtle border. Not teal.
- **Ghost:** Transparent, `--foreground` text, hover shows `--muted` bg.
- **Destructive:** `--destructive` fill, white text.
- **Icon-only:** 40x40, `--radius-md`, centered icon (16px).
- Press: `scale(0.97)`. Loading: spinner replaces text, maintain dimensions.
- Labels: verb + noun ("Create project" not "Submit").

### Inputs

- Height 40px, padding 0 12px, `--radius-sm`, font-size 16px (iOS zoom prevention).
- Focus: `box-shadow: var(--shadow-focus)`. Never border change (layout shift).
- Always visible `<label>` with `htmlFor`. Never placeholder as only label.
- Errors: `--destructive` text below input, `--destructive-border` on input, `aria-describedby`.
- Validate on blur, not keystroke.

---

## Motion

| Token | Value | Use |
|-------|-------|-----|
| `--duration-instant` | 100ms | Tooltips, color changes |
| `--duration-fast` | 150ms | Hover states, icons |
| `--duration-normal` | 200ms | Panels, page crossfades |
| `--duration-smooth` | 300ms | Drawers, modals, sidebars |
| `--duration-neptune` | 400ms | Neptune panel, AI responses |

### Easing

```css
--ease-standard:   cubic-bezier(0.2, 0, 0, 1);
--ease-enter:      cubic-bezier(0, 0, 0, 1);
--ease-exit:       cubic-bezier(0.3, 0, 1, 1);
--ease-emphasized:  cubic-bezier(0.05, 0.7, 0.1, 1);
```

### Rules

- Exit is 30% faster than enter.
- **Only animate `transform` and `opacity`.** Never width, height, margin, padding, top, left.
- `prefers-reduced-motion` respected for all non-essential motion.
- No spring physics, no parallax, no bounce.
- CSS transitions for standard UI. Framer Motion reserved for Neptune expressive states only.
- Hover: change ONE property.

### Neptune Motion

| State | Visual |
|-------|--------|
| Idle | Glass panel, static, subtle teal border |
| Listening | Border glow intensifies over 300ms |
| Thinking | Gentle opacity pulse (0.6 > 1.0, 2s cycle) on teal dot |
| Responding | Text chunks appear with 100ms fade-in per chunk |
| Suggesting | Proactive cards slide up, 300ms emphasized ease |

---

## Z-Index Scale

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

No other values. No `z-999`. No `z-9999`.

---

## Accessibility

- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<section>`. One `<h1>` per page. Never skip heading levels.
- `:focus-visible` ring on all interactive elements via `--shadow-focus`.
- Icon-only buttons get `aria-label`. Icons get `aria-hidden="true"`.
- Color + secondary indicator for all status (icon or text). Never color alone.
- `aria-live="polite"` for dynamic updates. `role="alert"` for errors.
- Modals: focus trap, Escape to close, return focus to trigger.
- Min 44x44px touch targets.
- Contrast: 4.5:1 normal text, 3:1 large text and UI components.

---

## Performance

- **Fonts:** `next/font` only, 3 families max (Space Grotesk, Inter, JetBrains Mono), max 4 weights. Never CDN.
- **Images:** Next.js `<Image>`, always specify dimensions, `priority` only for above-fold LCP.
- **Bundle:** check bundlephobia before adding deps. Dynamic import for charts, modals, rich editors.
- **Layout shift:** reserve space for all async content. Skeleton loaders match real dimensions.
- **Animations:** `transform` and `opacity` only. `will-change` sparingly, remove after animation.
- **Caching:** static assets immutable. API data with appropriate `revalidate`.

---

## Copy & Voice

- **Clear, confident, human.** Fewest words possible.
- Button labels: verb + noun. Never "Submit" or "OK".
- Errors: what happened + why + what to do next.
- Success: state what happened. Never use "successfully" — redundant. No exclamation marks.
- Empty states: what would be here + why empty + action to fill it.
- Loading: specific ("Loading contacts..." not "Loading..."). Progressive messages for Neptune.
- Sentence case everywhere. No Title Case except brand names.
- Numerals for all numbers in UI. Relative time for recent ("5 min ago"), absolute for older ("Jan 15, 2026").
- Large numbers: human-readable ("12.4k" not "12,423") unless precision needed.
- Contractions are fine. Active voice. "You" and "your", not "the user."

---

## Naming Conventions

- Booleans: `is`, `has`, `should`, `can` prefix (`isLoading`, `hasContacts`)
- Handlers: `handle` prefix (`handleRowClick`, `handleFilterChange`)
- Event props: `on` prefix (`onClick`, `onTabChange`)
- Async: action verb suffix (`fetchContacts`, `createDeal`)
- Arrays: plural (`contacts`, `deals`). Single: singular (`contact`, `deal`).
- Constants: SCREAMING_SNAKE (`MAX_RETRIES`, `DEBOUNCE_MS`, `ITEMS_PER_PAGE`).
- No single-letter vars except `i` in loops, `e` in event handlers.

---

## Ops & Shipping

- **Conventional commits:** `feat(crm):`, `fix(ai):`, `refactor:`, `chore:`.
- **Three environments:** local, Vercel preview, production. Separate databases.
- **Pre-deploy:** `npm run build` passes, `npm run typecheck` clean, no console.log, env vars set.
- **Sentry** before first user. Source maps configured.
- **Structured JSON logging.** No `console.log` in production.
- **Every cron job idempotent.** Log start/end/items processed.
- **Trigger.dev** for complex workflows. Vercel Cron for simple tasks.

---

## The "Never" List

### Code
- **Never use `any`.** Use `unknown` + type guard.
- **Never use `@ts-ignore` or `@ts-expect-error`** without a linked issue.
- **Never use `useEffect` for data fetching.** Server Components or Server Actions.
- **Never use `console.log` in production.** Structured logging server-side only.
- **Never throw errors to the client.** Return `{ success: false, error }`.
- **Never trust external data without Zod.** API responses, form inputs, AI output, webhooks.
- **Never use `as` type assertions on external data.** Parse it.
- **Never install a dependency without checking bundle size** at bundlephobia.com.
- **Never use `React.FC`.** Declare function components directly with typed props.
- **Never create API routes for standard CRUD.** Server Actions handle mutations.

### Multi-Tenant
- **Never query without workspaceId.** Cross-tenant data leaks are security incidents.
- **Never hardcode workspace identity.** Use `src/lib/auth.ts` helpers.

### Styling
- **Never use raw hex in components.** Everything through `var(--color-*)` tokens.
- **Never use Tailwind color literals** like `bg-gray-800` or `text-blue-500`. Map through semantic tokens.
- **Never use spacing values off the 4px grid.** No 5px, 7px, 15px, 30px.
- **Never use `font-weight: 700` on any background.** Max 600 for headings.
- **Never animate `width`, `height`, `margin`, `padding`, `top`, `left`.** Only `transform` and `opacity`.
- **Never use `outline: none` without a replacement focus style.**
- **Never use `border` changes for focus states.** Use `box-shadow` ring.
- **Never use z-index values outside the scale** (0, 1, 10, 20, 25, 30, 35, 40).

### Glass & Accent
- **Never mix shadow systems on one element.** Neumorphic lift OR Neptune glow. Not both.
- **Never use `glass-neptune` on non-AI surfaces.** Neptune tier is reserved for Neptune.
- **Never place more than 3 teal-accented elements per visible screen.** Glass carries the aesthetic.
- **Never apply dot grid to anything except `body`.** Cards are solid surfaces.

### Neptune
- **Never call an LLM without `maxTokens` set.**
- **Never trust AI output without Zod validation.**
- **Never use Framer Motion outside of Neptune.** CSS transitions for everything else.
- **Never skip cost protection guards** (`src/lib/cost-protection.ts`).

### Process
- **Never commit broken builds.** `npm run build` must pass.
- **Never accumulate type errors.** Run `npm run typecheck` frequently.
- **Never use `db:push` in production.** Migrations only.
- **Never commit `.env.local`.** Secrets stay local or in Vercel dashboard.

---

## Global CSS (Applied Once)

```css
*, *::before, *::after { box-sizing: border-box; }

body {
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
  font-feature-settings: "kern" 1;
  text-size-adjust: 100%;
  background: var(--background);
  color: var(--foreground);
  background-image: radial-gradient(oklch(0.20 0.018 250 / 0.07) 1px, transparent 1px);
  background-size: 24px 24px;
}

button, a, [role="button"] {
  -webkit-tap-highlight-color: transparent;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Project Structure

```
src/
├── app/
│   ├── (app)/            # Authenticated routes (dashboard, crm, finance, assistant, etc.)
│   └── api/              # ~50 API route groups
├── components/
│   ├── ui/               # shadcn/ui primitives (Button, Input, Card, Badge)
│   └── [feature]/        # Feature components (crm/, finance-hq/, neptune/, etc.)
├── lib/
│   ├── ai/               # AI system — tools, context, prompts, RAG, caching
│   ├── neptune/          # Neptune — actions, insights, context
│   ├── validation/       # Zod schemas
│   ├── hooks/            # React hooks
│   └── [domain].ts       # Domain utilities
├── db/
│   ├── schema.ts         # Main schema (50+ tables)
│   └── workflow-schema.ts
├── trigger/              # Background jobs
└── middleware.ts          # Clerk auth + route protection
```

---

*Cosmos design system for GalaxyCo 3.0.*
*~470 lines. Every token, every rule, no prose.*
*Last updated: March 2, 2026*
