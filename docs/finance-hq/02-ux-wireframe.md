# Finance HQ — UX Wireframe (GalaxyCo Tailored)

> **Document Purpose:** Defines the complete page layout, component regions, and interaction flows for Finance HQ. Tailored to fit within GalaxyCo's existing `AppLayout` structure.

---

## 1. Page Structure Overview

Finance HQ uses the existing GalaxyCo `AppLayout` component which provides:
- **Left Sidebar:** Primary navigation (from `src/components/galaxy/sidebar.tsx`)
- **Top Header:** Search + notifications (from `src/components/galaxy/header.tsx`)
- **Main Content Area:** Where Finance HQ dashboard renders
- **Floating Neptune:** Existing `FloatingAIAssistant` (bottom-right)

### Finance HQ Main Content Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ Finance HQ Header (title + date picker + filters + assistant)   │
├─────────────────────────────────────────────────────────────────┤
│ [KPI 1]  [KPI 2]  [KPI 3]  [KPI 4]  [KPI 5]                    │
├─────────────────────────────────────────────────────────────────┤
│ [Module Tile A]   [Module Tile B]   [Module Tile C]             │
│ [Module Tile D]   [Module Tile E]   [Module Tile F]             │
│ ... auto-expands based on connected integrations ...            │
├─────────────────────────────────────────────────────────────────┤
│ Financial Timeline (horizontal scrolling)                       │
├─────────────────────────────────────────────────────────────────┤
│ Recent Activity Table                                           │
└─────────────────────────────────────────────────────────────────┘
```

### With Detail Drawer Open
```
┌────────────────────────────────────────────┐┌───────────────┐
│ Main Finance HQ Dashboard                   ││ Detail Drawer │
│ (content shifts/shrinks slightly)           ││ (420-480px)   │
│                                             ││               │
└────────────────────────────────────────────┘└───────────────┘
```

---

## 2. Page Header Layout

Located at top of main content area (not the global header):

```
Finance HQ
"All your connected financial accounts in one place."

[Date Range Picker]  [Source Filter Chips]  [Neptune Button]
```

### Components
| Element | Description | Component Pattern |
|---------|-------------|-------------------|
| Page Title | "Finance HQ" | `<h1>` with `text-2xl font-semibold` |
| Subtitle | Descriptive text | `<p>` with `text-gray-500 text-sm` |
| Date Range Picker | Controls data range for all modules | Custom component using `react-day-picker` |
| Filter Chips | All / QuickBooks / Stripe / Shopify | Button group with active state |
| Neptune Button | Opens finance-specific Neptune panel | Matches existing Neptune button style |

### Existing Pattern Reference
Follow the header pattern from `src/components/integrations/GalaxyIntegrations.tsx`:
```tsx
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
  <div>
    <h1 className="text-2xl font-semibold text-gray-900">Finance HQ</h1>
    <p className="text-gray-500 text-sm mt-0.5">...</p>
  </div>
  <div className="flex items-center gap-3">
    {/* Actions */}
  </div>
</div>
```

---

## 3. KPI Row

Five metric cards displayed horizontally. Auto-populated based on available data.

```
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ [Icon]         │  │ [Icon]         │  │ [Icon]         │
│ $42,875        │  │ $12,330        │  │ $30,545        │
│ Revenue        │  │ Expenses       │  │ Profit         │
│ ↑ 4% vs last   │  │ ↓ 2% vs last   │  │ ↑ 6% vs last   │
└────────────────┘  └────────────────┘  └────────────────┘
```

### Layout Rules
- Grid: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4`
- Cards: Use pattern from existing `StatsCard` in `/components/galaxy/stats-card.tsx`
- Soft shadows matching existing design system
- Color-coded deltas (green positive, red negative)

### Existing Pattern Reference
From `DESIGN-SYSTEM.md` - StatsCard pattern:
```tsx
<StatsCard
  title="Revenue"
  value="$42,875"
  change={{ value: "+4%", isPositive: true }}
  icon={<DollarSign className="h-5 w-5" />}
/>
```

---

## 4. Module Grid Layout

Modules appear dynamically depending on connected integrations.

### Grid Rules
- Desktop: 3-column grid (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`)
- Uniform tile height for visual consistency
- Tiles auto-wrap based on number of connected modules

### Module Tile Structure
```
┌──────────────────────────────────────┐
│ [Icon]  Module Title          [•••]  │
│                                      │
│ Main visual: chart OR key metric     │
│                                      │
│ Secondary: list preview OR summary   │
└──────────────────────────────────────┘
```

### Module Types by Integration

| Source | Module | Content Type |
|--------|--------|--------------|
| QuickBooks | Invoices | List + status breakdown |
| QuickBooks | Expenses | Donut chart by category |
| Stripe | Revenue | Line chart + net amount |
| Stripe | Payouts | List of recent payouts |
| Shopify | Orders | Bar chart + order count |
| Unified | Cash Flow | Line chart + inflow/outflow |

### Existing Pattern Reference
Card styling from `src/components/ui/card.tsx`:
```tsx
<Card className="p-6 shadow-lg border-0">
  {/* Module content */}
</Card>
```

---

## 5. Financial Timeline (Horizontal Scroll)

A chronologically scannable visual feed combining events from all connected integrations.

```
←───────────── scrollable timeline ─────────────→

● Invoice #182 paid    ● Payout received    ● Order #1024
   $4,900 (QB)            $12,200 (Stripe)     $92 (Shopify)

   ↑ Click opens detail drawer
```

### Visual Rules
- Horizontal scroll container using `ScrollArea` from `/components/ui/scroll-area.tsx`
- Each event = circular badge/bubble
- Color-coded by source (soft tints, not harsh colors)
- Date labels for orientation
- Click event → open detail drawer

### Event Colors (following design system)
| Source | Color Class |
|--------|-------------|
| QuickBooks | `bg-emerald-50 text-emerald-700` |
| Stripe | `bg-indigo-50 text-indigo-700` |
| Shopify | `bg-green-50 text-green-700` |

---

## 6. Recent Activity Table

A unified ledger-like table showing all financial transactions.

### Columns
| Column | Description | Styling |
|--------|-------------|---------|
| Date | Transaction date | `text-gray-500 text-sm` |
| Source | QB / Stripe / Shopify badge | Use existing `Badge` component |
| Type | income/expense/refund/fee/payout | Text with icon |
| Description | Transaction description | Truncated with ellipsis |
| Amount | Dollar amount | Green positive, red negative, `font-mono` |
| Status | If applicable | Badge (paid/pending/etc.) |

### Table Layout
```
┌──────────────────────────────────────────────────────────┐
│ Date       Source    Type      Description       Amount   │
├──────────────────────────────────────────────────────────┤
│ 2025-03-12 [Stripe]  sale      Payment from...   +$120    │
│ 2025-03-12 [QB]      invoice   Invoice #229...   +$890    │
│ 2025-03-11 [QB]      expense   Office Rent       -$900    │
└──────────────────────────────────────────────────────────┘
```

### Interactions
- Row click → opens detail drawer
- Pagination or infinite scroll
- Sortable columns (date, amount)

### Existing Pattern Reference
Table styling without hard borders:
```tsx
<div className="rounded-xl border border-gray-200 overflow-hidden">
  <table className="w-full">
    <thead className="bg-gray-50">...</thead>
    <tbody className="divide-y divide-gray-100">...</tbody>
  </table>
</div>
```

---

## 7. Detail Drawer (Side Panel)

Slides in from right when user clicks any item (module tile, timeline event, table row).

### Drawer Specs
- Width: 420-480px
- Background: white
- Padding: 24-32px (`p-6` or `p-8`)
- Soft drop shadow
- Sticky header with close button

### Content Structure (varies by object type)
```
┌──────────────────────────────────────┐
│ [X Close]                            │
│ Invoice #223            [Overdue]    │
├──────────────────────────────────────┤
│ Customer: Acme Corp                  │
│ Amount: $4,500                       │
│ Due Date: March 15, 2025             │
│ Days Overdue: 14                     │
├──────────────────────────────────────┤
│ Line Items                           │
│ - Consulting (10 hrs) ... $2,500     │
│ - Materials ............ $2,000     │
├──────────────────────────────────────┤
│ [Send Reminder]  [Mark as Paid]      │
└──────────────────────────────────────┘
```

### Existing Pattern Reference
Use sheet/drawer pattern from Radix:
```tsx
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet"
```

---

## 8. Neptune Finance Panel

Extends the existing `FloatingAIAssistant` with finance-specific context.

### Panel Modes
| Mode | Trigger | Behavior |
|------|---------|----------|
| Overview | Click Neptune from Finance HQ header | Summarize entire dashboard |
| Module | Click on specific module tile | Context-aware for that module |
| Detail | Detail drawer is open | Assist with specific item |
| Forecast | User requests forecast | Cash flow projections |

### Panel Layout (Same as existing FloatingAIAssistant)
The existing Neptune panel structure remains, but suggestions and context adapt:

```
┌─────────────────────────────────────────┐
│ Neptune Finance Assistant               │
│─────────────────────────────────────────│
│ [Conversation window]                   │
│                                         │
│ Suggested: "Summarize this month"       │
│            "Show overdue invoices"      │
│            "Forecast next 30 days"      │
└─────────────────────────────────────────┘
```

---

## 9. Empty States

### No Integrations Connected
```
┌─────────────────────────────────────────┐
│        [Finance Icon]                   │
│                                         │
│   Connect a financial integration       │
│       to get started                    │
│                                         │
│   [Connect QuickBooks] [Connect Stripe] │
│             [Connect Shopify]           │
└─────────────────────────────────────────┘
```

### Integration Expired/Disconnected
Banner at top of page:
```
┌─────────────────────────────────────────────────────────┐
│ ⚠️ QuickBooks connection expired — [Reconnect]          │
└─────────────────────────────────────────────────────────┘
```

---

## 10. Interaction Flow Summary

1. User navigates to `/finance` via sidebar
2. Page verifies authentication (existing `getCurrentWorkspace()`)
3. Check integration status for QB/Stripe/Shopify
4. If no integrations → show empty state with connect CTAs
5. If integrations exist:
   - Fetch KPIs (cached)
   - Fetch modules (parallel)
   - Render dashboard progressively with skeletons
6. User clicks a tile → detail drawer slides in
7. User opens Neptune → panel shows finance context
8. Date range change → invalidate cache, refetch all

---

## End of UX Wireframe Specification

