# GalaxyCo.ai 3.0 Design System

## Overview

This design system is built to match the exact Figma designs for GalaxyCo.ai 3.0. It uses Tailwind CSS 4 with CSS variables for theming and follows a mobile-first, accessible approach.

## Design Tokens

### Colors

#### Primary Colors
- **Primary**: `#007AFF` (iOS Blue)
- **Primary Foreground**: `#ffffff`

#### Status Colors
- **Success**: `#34C759` (Green)
- **Warning**: `#FF9500` (Orange)
- **Error**: `#FF3B30` (Red)
- **Info**: `#007AFF` (Blue)

#### Lead Status Colors
- **Hot**: `#FF3B30` (Red)
- **Warm**: `#FF9500` (Orange)
- **Cold**: `#8E8E93` (Gray)

#### Campaign Status Colors
- **Active**: `#34C759` (Green)
- **Draft**: `#8E8E93` (Gray)
- **Paused**: `#FF9500` (Orange)

#### Semantic Colors
- **Background**: `#ffffff` (Light) / `oklch(0.145 0 0)` (Dark)
- **Foreground**: `oklch(0.145 0 0)` (Light) / `oklch(0.985 0 0)` (Dark)
- **Muted**: `#ececf0` (Light) / `oklch(0.269 0 0)` (Dark)
- **Border**: `rgba(0, 0, 0, 0.1)` (Light) / `oklch(0.269 0 0)` (Dark)

### Typography

- **Base Font Size**: `16px`
- **Font Family**: Geist Sans (primary), Geist Mono (monospace)
- **Font Weights**:
  - Normal: `400`
  - Medium: `500`
  - Semibold: `600`
  - Bold: `700`

#### Type Scale
- **H1**: `text-4xl` (2.25rem) / `lg:text-5xl` (3rem) - Bold
- **H2**: `text-3xl` (1.875rem) - Semibold
- **H3**: `text-2xl` (1.5rem) - Semibold
- **H4**: `text-xl` (1.25rem) - Semibold
- **H5**: `text-lg` (1.125rem) - Semibold
- **H6**: `text-base` (1rem) - Semibold
- **Body**: `text-base` (1rem) - Normal
- **Small**: `text-sm` (0.875rem) - Normal

### Spacing

Uses Tailwind's default spacing scale (0.25rem increments):
- `0` = 0px
- `1` = 0.25rem (4px)
- `2` = 0.5rem (8px)
- `3` = 0.75rem (12px)
- `4` = 1rem (16px)
- `6` = 1.5rem (24px)
- `8` = 2rem (32px)

### Border Radius

- **Default**: `0.625rem` (10px)
- **Small**: `calc(var(--radius) - 4px)` (6px)
- **Medium**: `calc(var(--radius) - 2px)` (8px)
- **Large**: `var(--radius)` (10px)
- **XL**: `calc(var(--radius) + 4px)` (14px)

### Shadows

- **Card**: `shadow-sm` (subtle elevation)
- **Hover**: `shadow-md` (medium elevation)
- **Focus Ring**: `ring-2 ring-ring/40 ring-offset-2`

## Components

### Base UI Components (`@/components/ui`)

#### Button
- **Canonical**: `src/components/ui/button.tsx` (`Button`)
- **Variants**: default, surface, destructive, outline, secondary, ghost, link, success, warning
- **Sizes**: default (h-9), sm (h-8), lg (h-10), icon (size-9)
- **Notes**:
  - Use `variant="surface"` for Neptune-style low-emphasis buttons (headers, toggles, toolbars).
  - `NeptuneButton` exists for backwards compatibility, but new code should import `Button`.

#### Card
- **Sub-components**: CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- **Features**: Hover effects, shadow transitions

#### Badge
- **Canonical**: `src/components/ui/badge.tsx` (`Badge`)
- **Visual variants**: default, secondary, destructive, outline, soft
- **Tone** (for `variant="soft"`): neutral, success, info, warning, danger, violet, indigo, pink, orange, teal, lime
- **Sizes**: sm, md, pill
- **Usage**: Prefer `variant="soft" size="pill"` for dashboard header stats and compact status chips.

#### PageTitle
Standardized gradient icon + Space Grotesk branded title.
- **File**: `src/components/ui/page-title.tsx`
- **Use for**: dashboard headers (Creator, My Agents, CRM, Marketing, Library, Conversations)

#### PillTabs
Rounded segmented navigation (glass + pills).
- **File**: `src/components/ui/pill-tabs.tsx`
- **Use for**: dashboard-level tab bars (and any repeated segmented control)

#### Chip
Small filter pill built on Button.
- **File**: `src/components/ui/chip.tsx`
- **Use for**: filters (multi-select / toggles), not primary actions

#### Input
- **Features**: Focus states, disabled states, placeholder styling, file input support

#### Tabs
- **Sub-components**: TabsList, TabsTrigger, TabsContent
- **Features**: Keyboard navigation, ARIA support

#### Avatar
- **Sub-components**: AvatarImage, AvatarFallback
- **Features**: Fallback with initials, image loading states

#### Progress
- **Features**: Animated progress bar, customizable height

#### Separator
- **Orientations**: horizontal, vertical
- **Features**: Decorative option

### Galaxy Components (`@/components/galaxy`)

#### StatsCard
Displays key metrics with optional change indicators.

**Props:**
- `title`: string
- `value`: string | number
- `change?`: { value: string | number, isPositive?: boolean }
- `icon?`: React.ReactNode
- `description?`: string

#### ActionCard
Interactive card for quick actions.

**Props:**
- `title`: string
- `description`: string
- `action?`: { label: string, onClick: () => void }
- `metadata?`: string
- `icon?`: React.ReactNode

#### StatusBadge
Specialized badge for status indicators.

**Props:**
- `status`: "active" | "draft" | "paused" | "hot" | "warm" | "cold" | "success" | "warning" | "error" | "info"
- `showDot?`: boolean

## Usage Examples

### Button
```tsx
import { Button } from "@/components/ui/button";

<Button variant="default" size="default">
  Click me
</Button>
```

### PageTitle
```tsx
import { PageTitle } from "@/components/ui/page-title";
import { Sparkles } from "lucide-react";

<PageTitle title="Dashboard" icon={Sparkles} />
```

### PillTabs
```tsx
import { useState } from "react";
import { PillTabs, type PillTab } from "@/components/ui/pill-tabs";
import { FolderOpen, PenTool } from "lucide-react";

type Tab = "create" | "collections";

const tabs: Array<PillTab<Tab>> = [
  {
    value: "create",
    label: "Create",
    Icon: PenTool,
    activeClassName: "bg-violet-100 text-violet-700",
  },
  {
    value: "collections",
    label: "Collections",
    Icon: FolderOpen,
    activeClassName: "bg-emerald-100 text-emerald-700",
  },
];

export function Example() {
  const [value, setValue] = useState<Tab>("create");
  return <PillTabs value={value} onValueChange={setValue} tabs={tabs} />;
}
```

### StatsCard
```tsx
import { StatsCard } from "@/components/galaxy/stats-card";
import { Users } from "lucide-react";

<StatsCard
  title="Active Agents"
  value={12}
  change={{ value: "+2", isPositive: true }}
  icon={<Users className="h-5 w-5" />}
/>
```

### ActionCard
```tsx
import { ActionCard } from "@/components/galaxy/action-card";

<ActionCard
  title="Auto-respond to 12 emails"
  description="Save ~45 min • Drafts ready for review"
  action={{
    label: "Execute",
    onClick: () => {
      // TODO: wire to an action handler
    }
  }}
/>
```

## Accessibility

All components follow WCAG AA compliance:
- **ARIA Labels**: All interactive elements have proper ARIA labels
- **Keyboard Navigation**: Full keyboard support (Tab, Enter, Space, Arrow keys)
- **Focus Indicators**: Visible focus rings on all focusable elements
- **Semantic HTML**: Proper use of semantic elements (button, nav, main, etc.)
- **Screen Reader Support**: Descriptive labels and status announcements

## Responsive Design

Mobile-first approach using Tailwind breakpoints:
- **Default**: Mobile (320px+)
- **sm**: 640px+
- **md**: 768px+
- **lg**: 1024px+
- **xl**: 1280px+

## Dark Mode

Full dark mode support via CSS variables. Toggle using `next-themes`:
```tsx
import { useTheme } from "next-themes";
```

## Next Steps

1. Build navigation components (Sidebar, Header)
2. Create page-specific components (Dashboard, Studio, CRM, etc.)
3. Implement workflow builder components
4. Add animation and transition utilities
5. Create component documentation with Storybook (optional)

