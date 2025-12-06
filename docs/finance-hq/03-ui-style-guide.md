# Finance HQ — UI Style Guide (GalaxyCo Tailored)

> **Document Purpose:** Defines the visual design language for Finance HQ, specifically aligned with GalaxyCo's existing design system from `DESIGN-SYSTEM.md` while adding Apple-inspired financial dashboard aesthetics.

---

## 1. Design Philosophy

Finance HQ should feel like a **premium financial command center** that matches GalaxyCo's existing aesthetic while elevating the finance experience:

- **Apple Card/Wallet inspired:** Soft, minimal, calm
- **iOS widget grid:** Data-forward, beautifully spaced
- **GalaxyCo consistent:** Same component library, colors, and patterns
- **Financial clarity:** Numbers prominent, hierarchy clear

### Keywords
- Breathable
- Structured
- Polished
- Confident
- Gentle depth
- Zero clutter

---

## 2. GalaxyCo Design System Integration

Finance HQ MUST use existing design tokens from `DESIGN-SYSTEM.md`:

### Primary Colors (Existing)
| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#007AFF` (iOS Blue) | Actions, links, active states |
| Primary Foreground | `#ffffff` | Text on primary |
| Success | `#34C759` | Positive amounts, gains |
| Warning | `#FF9500` | Overdue, attention needed |
| Error | `#FF3B30` | Losses, disconnected |
| Info | `#007AFF` | Informational badges |

### Finance-Specific Accent Colors
| Provider | Background | Text | Usage |
|----------|------------|------|-------|
| QuickBooks | `bg-emerald-50` | `text-emerald-700` | QB source indicators |
| Stripe | `bg-indigo-50` | `text-indigo-700` | Stripe source indicators |
| Shopify | `bg-lime-50` | `text-lime-700` | Shopify source indicators |

### Semantic Colors (Existing)
| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| Background | `#ffffff` | `oklch(0.145 0 0)` | Page background |
| Foreground | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Primary text |
| Muted | `#ececf0` | `oklch(0.269 0 0)` | Secondary backgrounds |
| Border | `rgba(0,0,0,0.1)` | `oklch(0.269 0 0)` | Card borders |

---

## 3. Typography (Existing System)

Use the existing Geist font family:

```css
font-family: 'Geist Sans', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Type Scale for Finance HQ
| Element | Class | Weight | Usage |
|---------|-------|--------|-------|
| Page Title | `text-2xl` | `font-semibold` | "Finance HQ" |
| KPI Number | `text-3xl` or `text-4xl` | `font-bold` | $42,875 |
| KPI Label | `text-sm` | `font-medium` | "Revenue" |
| KPI Delta | `text-xs` | `font-medium` | "+4% vs last month" |
| Module Title | `text-lg` | `font-semibold` | "Invoices" |
| Table Header | `text-xs` | `font-medium uppercase` | Column headers |
| Table Cell | `text-sm` | `font-normal` | Data cells |
| Amount | `text-sm` | `font-medium font-mono` | $1,234.56 |

### Line Height
Use Tailwind defaults (`leading-normal` = 1.5, `leading-tight` = 1.25)

---

## 4. Spacing System (Existing)

Use existing 8px grid from Tailwind:

| Spacing | Value | Usage |
|---------|-------|-------|
| `p-4` | 16px | Card interior padding (default) |
| `p-6` | 24px | Card interior padding (larger cards) |
| `gap-4` | 16px | Grid gaps (default) |
| `gap-6` | 24px | Grid gaps (larger sections) |
| `space-y-6` | 24px | Section vertical spacing |
| `mb-2` | 8px | Label to value spacing |

### Section Layout
```
Page padding: px-6 py-6
Section gaps: space-y-6
Card padding: p-4 md:p-6
```

---

## 5. Cards & Tiles

Finance HQ uses card-based design for KPIs and modules.

### Standard Finance Card
```tsx
<Card className="p-6 bg-white rounded-2xl shadow-sm border-0 hover:shadow-md transition-shadow">
  {/* Content */}
</Card>
```

### Card Properties
| Property | Value | Notes |
|----------|-------|-------|
| Border Radius | `rounded-2xl` (16px) | More rounded than default 10px for Apple feel |
| Background | `bg-white` | Clean white |
| Shadow | `shadow-sm` | Subtle elevation |
| Hover Shadow | `shadow-md` | Interactive feedback |
| Border | `border-0` or `border border-gray-100` | Minimal |

### KPI Card with Gradient (Premium Feel)
```tsx
<Card className="p-6 rounded-2xl shadow-sm bg-gradient-to-br from-white to-gray-50/50 border-0">
  <div className="flex items-center gap-3 mb-3">
    <div className="p-2 rounded-xl bg-blue-50">
      <DollarSign className="h-5 w-5 text-blue-600" />
    </div>
  </div>
  <div className="text-3xl font-bold text-gray-900">$42,875</div>
  <div className="text-sm text-gray-500 mt-1">Revenue</div>
  <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
    <TrendingUp className="h-3 w-3" />
    +4% vs last month
  </div>
</Card>
```

---

## 6. Shadows

Use soft shadows matching Apple aesthetic:

| Level | Class | CSS Equivalent | Usage |
|-------|-------|----------------|-------|
| Subtle | `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Default cards |
| Medium | `shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Hover states, drawers |
| Large | `shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, popovers |

### Finance-Specific Dual Shadow (Optional Premium)
For extra polish on KPI cards:
```css
box-shadow: 
  0 1px 3px rgba(0,0,0,0.04),
  0 6px 16px rgba(0,0,0,0.06);
```

---

## 7. Iconography

### Style Rules
- Use Lucide React icons (already in project)
- Size: `h-4 w-4` (small), `h-5 w-5` (medium), `h-6 w-6` (large)
- Stroke: Default 2px (Lucide default)
- Color: Match text or use accent color

### Finance Icons
| Use Case | Icon | Class |
|----------|------|-------|
| Revenue/Money | `DollarSign` | `text-green-600` |
| Expenses | `ArrowDownLeft` or `Receipt` | `text-red-600` |
| Profit | `TrendingUp` | `text-green-600` |
| Cash Flow | `ArrowLeftRight` | `text-blue-600` |
| Invoices | `FileText` | `text-gray-600` |
| QuickBooks | Custom or `Calculator` | `text-emerald-600` |
| Stripe | Custom or `CreditCard` | `text-indigo-600` |
| Shopify | Custom or `ShoppingBag` | `text-lime-600` |

### Icon Container Pattern
```tsx
<div className="p-2 rounded-xl bg-blue-50">
  <DollarSign className="h-5 w-5 text-blue-600" />
</div>
```

---

## 8. Charts & Visualizations

Use existing Recharts setup from `/components/ui/chart.tsx`.

### Chart Styling Rules
| Property | Value | Notes |
|----------|-------|-------|
| Container | `ChartContainer` | Existing component |
| Colors | Use `ChartConfig` with design tokens | Consistent theming |
| Grid lines | Minimal, light gray | Not distracting |
| Animations | `ease-out`, 200-300ms | Smooth but quick |

### Example Chart Config
```tsx
const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "#34C759", // Success green
  },
  expenses: {
    label: "Expenses", 
    color: "#FF3B30", // Error red
  },
} satisfies ChartConfig;
```

### Chart Types for Finance
| Data | Chart Type | Component |
|------|------------|-----------|
| Revenue trend | Line chart | `<LineChart>` |
| Expense breakdown | Donut/Pie | `<PieChart>` |
| Orders by period | Bar chart | `<BarChart>` |
| Cash flow | Area chart | `<AreaChart>` |

---

## 9. Tables

Following existing patterns from GalaxyCo:

### Table Container
```tsx
<div className="rounded-xl border border-gray-200 overflow-hidden">
  <table className="w-full">
    <thead className="bg-gray-50 border-b border-gray-200">
      <tr>
        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          Column
        </th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-100">
      {/* Rows */}
    </tbody>
  </table>
</div>
```

### Row Styling
| State | Classes |
|-------|---------|
| Default | `bg-white` |
| Hover | `hover:bg-gray-50` |
| Selected | `bg-indigo-50` |

### Amount Display
```tsx
// Positive
<span className="text-sm font-medium font-mono text-green-600">+$1,234.56</span>

// Negative
<span className="text-sm font-medium font-mono text-red-600">-$567.89</span>

// Neutral
<span className="text-sm font-medium font-mono text-gray-900">$890.12</span>
```

---

## 10. Badges

Use existing Badge component with finance-specific variants:

```tsx
import { Badge } from "@/components/ui/badge"

// Status badges
<Badge variant="success">Paid</Badge>
<Badge variant="warning">Overdue</Badge>
<Badge variant="secondary">Draft</Badge>
<Badge variant="error">Failed</Badge>

// Source badges
<Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">QuickBooks</Badge>
<Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">Stripe</Badge>
<Badge className="bg-lime-50 text-lime-700 border-lime-200">Shopify</Badge>
```

---

## 11. Financial Timeline Styling

### Event Bubble
```tsx
<button className="flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-50 hover:bg-emerald-100 transition-colors border border-emerald-200">
  <div className="h-2 w-2 rounded-full bg-emerald-500" />
  <span className="text-sm font-medium text-emerald-900">Invoice #182 paid</span>
  <span className="text-xs text-emerald-600">$4,900</span>
</button>
```

### Timeline Container
```tsx
<ScrollArea className="w-full whitespace-nowrap">
  <div className="flex gap-3 pb-4">
    {/* Event bubbles */}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>
```

---

## 12. Detail Drawer Styling

### Drawer Container
```tsx
<Sheet open={isOpen} onOpenChange={setIsOpen}>
  <SheetContent className="w-[480px] sm:max-w-[480px] p-0">
    <SheetHeader className="px-6 py-4 border-b border-gray-100">
      <SheetTitle>Invoice #223</SheetTitle>
      <Badge variant="warning">Overdue</Badge>
    </SheetHeader>
    <div className="px-6 py-4 space-y-4">
      {/* Content */}
    </div>
    <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
      {/* Actions */}
    </div>
  </SheetContent>
</Sheet>
```

---

## 13. Animations & Transitions

| Element | Animation | Duration | Easing |
|---------|-----------|----------|--------|
| Card hover | Shadow increase | 200ms | `ease-out` |
| Drawer open | Slide in from right | 300ms | `ease-out` |
| Neptune panel | Scale + fade | 200ms | `spring` (framer-motion) |
| Skeleton loading | Pulse | 1.5s | `ease-in-out` |
| Charts | Draw on load | 300ms | `ease-out` |

### Framer Motion (Existing)
```tsx
import { motion } from "framer-motion"

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>
```

---

## 14. Loading States

Use existing Skeleton component:

```tsx
import { Skeleton } from "@/components/ui/skeleton"

// KPI loading
<Card className="p-6">
  <Skeleton className="h-4 w-20 mb-3" />
  <Skeleton className="h-8 w-32 mb-2" />
  <Skeleton className="h-3 w-24" />
</Card>

// Table row loading
<tr>
  <td><Skeleton className="h-4 w-20" /></td>
  <td><Skeleton className="h-5 w-16" /></td>
  <td><Skeleton className="h-4 w-32" /></td>
  <td><Skeleton className="h-4 w-16" /></td>
</tr>
```

---

## 15. Accessibility Requirements

Following existing GalaxyCo WCAG patterns:

| Requirement | Implementation |
|-------------|----------------|
| Focus indicators | `focus:ring-2 focus:ring-ring focus:ring-offset-2` |
| ARIA labels | All interactive elements labeled |
| Keyboard navigation | Tab through all controls |
| Color contrast | Minimum 4.5:1 for text |
| Screen reader | Semantic HTML, aria-live for updates |

---

## 16. Dark Mode Considerations

Finance HQ should support dark mode using existing `next-themes`:

```tsx
// Card in dark mode
<Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">

// Text
<span className="text-gray-900 dark:text-gray-100">

// Amounts (keep colors consistent)
<span className="text-green-600 dark:text-green-400">+$1,234</span>
```

---

## End of UI Style Guide






















