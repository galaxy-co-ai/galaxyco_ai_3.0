# Badge

**Version 1.0.0**

Badges are compact, non-interactive labels used to communicate status, categories, or metadata. They provide at-a-glance information and visual distinction for different states or types.

---

## Table of Contents

- [Overview](#overview)
- [Anatomy](#anatomy)
- [Options](#options)
- [Behaviors](#behaviors)
- [Usage Guidelines](#usage-guidelines)
- [Content Standards](#content-standards)
- [Accessibility](#accessibility)
- [Implementation](#implementation)
- [Examples](#examples)

---

## Overview

### When to Use
- **Status indicators**: Show state (active, pending, completed, etc.)
- **Categories/tags**: Categorize content or items
- **Counts**: Display numerical counts (notifications, messages, etc.)
- **Metadata**: Show additional info (new, beta, featured, etc.)
- **Labels**: Provide quick identification
- **Color coding**: Visual distinction between types

### When Not to Use
- **Interactive actions**: Use [Button](#) or [Chip](#) instead
- **Long text**: Use regular text or [Label](#) instead
- **Form inputs**: Use actual form components
- **Navigation**: Use navigation components
- **Critical alerts**: Use [Alert](#) component instead

---

## Anatomy

```
┌─────────────────┐
│  ● Label Text   │  ← Badge container with icon (optional) + text
└─────────────────┘
    │      │
    │      └─ Text content
    └─ Icon (optional)
```

**Component Parts:**
1. **Container** - Background, border, padding, rounded corners
2. **Icon** (optional) - Leading visual indicator
3. **Text** - Label content

---

## Options

### Variants

#### Default (Primary)
High emphasis with primary color.

```typescript
<Badge variant="default">Active</Badge>
```

**Design tokens:**
- Background: `button-background-color-default` (`var(--primary)`)
- Foreground: `button-foreground-color-default` (`var(--primary-foreground)`)
- Border: Transparent

#### Secondary
Medium emphasis with secondary color.

```typescript
<Badge variant="secondary">Pending</Badge>
```

**Design tokens:**
- Background: `secondary-background-color-default` (`var(--secondary)`)
- Foreground: `secondary-foreground-color-default` (`var(--secondary-foreground)`)
- Border: Transparent

#### Destructive
For errors, deletions, or critical warnings.

```typescript
<Badge variant="destructive">Deleted</Badge>
```

**Design tokens:**
- Background: `destructive-background-color-default` (`var(--destructive)`)
- Foreground: White
- Border: Transparent

#### Outline
Low emphasis with border only.

```typescript
<Badge variant="outline">Draft</Badge>
```

**Design tokens:**
- Background: Transparent
- Foreground: `foreground-color-default` (`var(--foreground)`)
- Border: `border-color-default` (`var(--border)`)

#### Soft (with Tone)
Subtle background with semantic color tones. **This is the most versatile variant** for status chips and categorization.

```typescript
<Badge variant="soft" tone="success">Completed</Badge>
<Badge variant="soft" tone="warning">Pending</Badge>
<Badge variant="soft" tone="danger">Failed</Badge>
```

### Tone Colors (used with `variant="soft"`)

#### Neutral (Default)
```typescript
<Badge variant="soft" tone="neutral">Default</Badge>
```
Muted gray, good for non-semantic labels.

#### Success (Emerald/Green)
```typescript
<Badge variant="soft" tone="success">Completed</Badge>
```
Use for: completed, success, active, online, verified.

#### Info (Blue)
```typescript
<Badge variant="soft" tone="info">In Progress</Badge>
```
Use for: in progress, info, new, draft, review.

#### Warning (Amber/Yellow)
```typescript
<Badge variant="soft" tone="warning">Pending</Badge>
```
Use for: pending, warning, attention, scheduled, paused.

#### Danger (Red)
```typescript
<Badge variant="soft" tone="danger">Failed</Badge>
```
Use for: error, failed, deleted, critical, blocked.

#### Brand (Electric Cyan - GalaxyCo Primary)
```typescript
<Badge variant="soft" tone="brand">Featured</Badge>
```
Use for: featured, premium, highlighted, brand-specific.

#### Warm (Creamsicle Orange)
```typescript
<Badge variant="soft" tone="warm">Popular</Badge>
```
Use for: popular, trending, hot, recommended.

#### Violet
```typescript
<Badge variant="soft" tone="violet">Creative</Badge>
```
Use for: creative, design, art, inspiration.

#### Indigo
```typescript
<Badge variant="soft" tone="indigo">Enterprise</Badge>
```
Use for: enterprise, business, professional, corporate.

#### Pink
```typescript
<Badge variant="soft" tone="pink">Love</Badge>
```
Use for: favorites, saved, bookmarked, liked.

#### Orange
```typescript
<Badge variant="soft" tone="orange">Updated</Badge>
```
Use for: updated, modified, changed, edited.

#### Teal
```typescript
<Badge variant="soft" tone="teal">Developer</Badge>
```
Use for: developer, technical, code, API.

#### Lime
```typescript
<Badge variant="soft" tone="lime">Growth</Badge>
```
Use for: growth, increase, gain, positive change.

### Sizes

```typescript
<Badge size="sm">Small</Badge>       // Default, compact
<Badge size="md">Medium</Badge>      // Larger
<Badge size="pill">Pill</Badge>      // Rounded pill shape
```

**Dimensions:**
- Small (`sm`): `px-2 py-0.5 text-xs` - Compact, most common
- Medium (`md`): `px-2.5 py-1 text-sm` - More prominent
- Pill (`pill`): `px-3 py-1.5 text-sm rounded-full` - Fully rounded

### States

- **Default** - Normal resting state
- **Hover** - Subtle background change (on linkable badges)
- **Focus** - Focus ring (if interactive)

---

## Behaviors

### Static (Default)
- Non-interactive, display-only
- No hover or click effects

### As Link (Optional)
When wrapped in `<a>` tag, badge becomes hoverable.

```typescript
<a href="/status">
  <Badge variant="soft" tone="success">View Status</Badge>
</a>
```

- Hover effect: `[a&]:hover:bg-*/90`
- Cursor changes to pointer
- Focus ring appears on keyboard focus

### Icon Support
Badges support leading icons.

```typescript
<Badge variant="soft" tone="success">
  <CheckCircle className="w-3 h-3" />
  Verified
</Badge>
```

**Icon sizing:**
- Small badge: `w-3 h-3` (12px)
- Medium badge: `w-3.5 h-3.5` (14px)

---

## Usage Guidelines

### ✅ Do's

**Use appropriate semantic colors**
```typescript
✅ <Badge variant="soft" tone="success">Completed</Badge>
✅ <Badge variant="soft" tone="danger">Failed</Badge>
✅ <Badge variant="soft" tone="warning">Pending</Badge>
```

**Keep text concise**
```typescript
✅ <Badge>Active</Badge>
✅ <Badge>New</Badge>
✅ <Badge>3</Badge>
```

**Use consistent colors for same meanings**
```typescript
✅ Always use tone="success" for completed/success states
✅ Always use tone="danger" for errors/failures
```

**Use icons for clarity**
```typescript
✅
<Badge variant="soft" tone="success">
  <CheckCircle className="w-3 h-3" />
  Verified
</Badge>
```

### ❌ Don'ts

**Don't use long text**
```typescript
❌ <Badge>This is a very long status message</Badge>

✅ <Badge>Status</Badge> + separate text
```

**Don't mix color meanings**
```typescript
❌ <Badge variant="soft" tone="danger">Success</Badge>  // Confusing
❌ <Badge variant="soft" tone="success">Error</Badge>   // Contradictory
```

**Don't use for actions**
```typescript
❌ <Badge onClick={handleClick}>Click me</Badge>

✅ <Button size="sm">Click me</Button>
```

**Don't overuse badges**
```typescript
❌ 
<div>
  <Badge>Tag 1</Badge>
  <Badge>Tag 2</Badge>
  <Badge>Tag 3</Badge>
  <Badge>Tag 4</Badge>
  <Badge>Tag 5</Badge>
  // Too many, overwhelming
</div>

✅ Limit to 2-3 badges, or use other UI patterns
```

**Don't use for critical alerts**
```typescript
❌ <Badge variant="destructive">Your account will be deleted</Badge>

✅ <Alert variant="destructive">Your account will be deleted</Alert>
```

---

## Content Standards

### Be Concise
Badge text should be 1-2 words maximum.

```typescript
✅ "Active"
✅ "New"
✅ "Beta"
✅ "3 unread"
❌ "This item is currently active"
```

### Use Sentence Case
Always use sentence case, never title case or all caps (unless abbreviation).

```typescript
✅ "In progress"
✅ "API" (abbreviation)
❌ "In Progress"  // Title case
❌ "IN PROGRESS"  // All caps
```

### Be Specific
Use precise language that immediately conveys meaning.

```typescript
✅ "Shipped"
✅ "Verified"
✅ "Expired"
❌ "Done"  // Vague
❌ "OK"    // Unclear
```

### Use Standard Conventions
Follow common patterns users recognize.

```typescript
✅ "New" - recently added
✅ "Beta" - testing phase
✅ "Pro" - premium tier
✅ "Sale" - promotional
```

---

## Accessibility

### Color is Not Enough
Never rely solely on color to convey meaning. Always include text.

```typescript
❌ <Badge variant="soft" tone="success" aria-label="Success" />  // Color only

✅ <Badge variant="soft" tone="success">Success</Badge>  // Text + color
```

### Screen Readers
- Badge content is automatically announced
- For icon-only badges, add `aria-label`
- For count badges, ensure numbers are announced

```typescript
// Icon with text - accessible
<Badge variant="soft" tone="success">
  <CheckCircle className="w-3 h-3" />
  Verified
</Badge>

// Count badge - accessible
<Badge>5</Badge>

// Icon-only (avoid, but if needed)
<Badge aria-label="Verified">
  <CheckCircle className="w-3 h-3" />
</Badge>
```

### Color Contrast
- All badge variants meet WCAG 2.1 AA standards
- Text contrast: 4.5:1 minimum against background
- Border contrast: 3:1 minimum (for outline variant)

### Focus States (Interactive Badges)
When badges are interactive (inside links/buttons):
- Focus ring: `focus-visible:ring-2 focus-visible:ring-ring`
- Clear focus indicator required

### Non-interactive
- Badges are non-focusable by default
- Not part of keyboard tab order
- Announced as static text by screen readers

---

## Implementation

### Basic Badge
```typescript
import { Badge } from '@/components/ui/badge';

function Example() {
  return <Badge>Default</Badge>;
}
```

### All Variants
```typescript
<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="soft" tone="success">Soft Success</Badge>
```

### All Tone Colors (with `variant="soft"`)
```typescript
<Badge variant="soft" tone="neutral">Neutral</Badge>
<Badge variant="soft" tone="success">Success</Badge>
<Badge variant="soft" tone="info">Info</Badge>
<Badge variant="soft" tone="warning">Warning</Badge>
<Badge variant="soft" tone="danger">Danger</Badge>
<Badge variant="soft" tone="brand">Brand</Badge>
<Badge variant="soft" tone="warm">Warm</Badge>
<Badge variant="soft" tone="violet">Violet</Badge>
<Badge variant="soft" tone="indigo">Indigo</Badge>
<Badge variant="soft" tone="pink">Pink</Badge>
<Badge variant="soft" tone="orange">Orange</Badge>
<Badge variant="soft" tone="teal">Teal</Badge>
<Badge variant="soft" tone="lime">Lime</Badge>
```

### All Sizes
```typescript
<Badge size="sm">Small</Badge>
<Badge size="md">Medium</Badge>
<Badge size="pill">Pill</Badge>
```

### With Icons
```typescript
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

<Badge variant="soft" tone="success">
  <CheckCircle className="w-3 h-3" />
  Verified
</Badge>

<Badge variant="soft" tone="warning">
  <AlertTriangle className="w-3 h-3" />
  Warning
</Badge>

<Badge variant="soft" tone="danger">
  <XCircle className="w-3 h-3" />
  Error
</Badge>
```

### As Link
```typescript
<Badge asChild>
  <Link href="/status">
    View Status
  </Link>
</Badge>
```

---

## Examples

### Status Badges
```typescript
<Badge variant="soft" tone="success">Active</Badge>
<Badge variant="soft" tone="info">Pending</Badge>
<Badge variant="soft" tone="warning">Scheduled</Badge>
<Badge variant="soft" tone="danger">Failed</Badge>
```

### Count Badges (Notifications)
```typescript
<div className="relative">
  <Bell className="w-5 h-5" />
  <Badge 
    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
    variant="destructive"
  >
    3
  </Badge>
</div>
```

### Table Status Indicators
```typescript
<Table>
  <TableRow>
    <TableCell>Project Alpha</TableCell>
    <TableCell>
      <Badge variant="soft" tone="success">Completed</Badge>
    </TableCell>
  </TableRow>
  <TableRow>
    <TableCell>Project Beta</TableCell>
    <TableCell>
      <Badge variant="soft" tone="info">In Progress</Badge>
    </TableCell>
  </TableRow>
</Table>
```

### Card with Status
```typescript
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>Website Redesign</CardTitle>
      <Badge variant="soft" tone="success">Completed</Badge>
    </div>
    <CardDescription>Client: Acme Corp</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Project completed successfully.</p>
  </CardContent>
</Card>
```

### Feature Tags
```typescript
<div className="flex gap-2">
  <Badge variant="soft" tone="brand">New</Badge>
  <Badge variant="soft" tone="warm">Popular</Badge>
  <Badge variant="soft" tone="violet">Featured</Badge>
</div>
```

### User Role Badges
```typescript
<div className="flex items-center gap-2">
  <Avatar>
    <AvatarImage src="/avatar.jpg" />
    <AvatarFallback>JD</AvatarFallback>
  </Avatar>
  <div>
    <p className="font-medium">John Doe</p>
    <div className="flex gap-1 mt-1">
      <Badge size="sm" variant="soft" tone="brand">Admin</Badge>
      <Badge size="sm" variant="soft" tone="success">
        <CheckCircle className="w-3 h-3" />
        Verified
      </Badge>
    </div>
  </div>
</div>
```

### Product Labels
```typescript
<Card>
  <CardHeader>
    <div className="flex gap-2 mb-2">
      <Badge variant="soft" tone="danger">Sale</Badge>
      <Badge variant="soft" tone="brand">Limited</Badge>
    </div>
    <CardTitle>Premium Package</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-bold">$99</p>
  </CardContent>
</Card>
```

### Priority Indicators
```typescript
<Badge variant="soft" tone="danger">High Priority</Badge>
<Badge variant="soft" tone="warning">Medium Priority</Badge>
<Badge variant="soft" tone="neutral">Low Priority</Badge>
```

### Version/Beta Labels
```typescript
<div className="flex items-center gap-2">
  <h2 className="text-xl font-bold">New Feature</h2>
  <Badge size="sm" variant="soft" tone="info">Beta</Badge>
</div>
```

### Multiple States
```typescript
function OrderStatus({ status }) {
  const statusConfig = {
    pending: { tone: 'warning', label: 'Pending' },
    processing: { tone: 'info', label: 'Processing' },
    shipped: { tone: 'success', label: 'Shipped' },
    delivered: { tone: 'success', label: 'Delivered', icon: CheckCircle },
    cancelled: { tone: 'danger', label: 'Cancelled', icon: XCircle },
  };
  
  const config = statusConfig[status];
  const Icon = config.icon;
  
  return (
    <Badge variant="soft" tone={config.tone}>
      {Icon && <Icon className="w-3 h-3" />}
      {config.label}
    </Badge>
  );
}
```

---

## Design Tokens Reference

```typescript
// From tokens/colors.ts
badge-background-color-neutral: var(--muted)
badge-foreground-color-neutral: var(--muted-foreground)

// Soft variant color tokens are dynamic per tone
// Success (Emerald)
bg-emerald-50 text-emerald-700 border-emerald-200 (light)
dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800 (dark)

// Info (Blue)
bg-blue-50 text-blue-700 border-blue-200 (light)
dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 (dark)

// Warning (Amber)
bg-amber-50 text-amber-700 border-amber-200 (light)
dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800 (dark)

// Danger (Red)
bg-red-50 text-red-700 border-red-200 (light)
dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 (dark)

// From tokens/spacing.ts
// Small (sm)
px-2 py-0.5  // Horizontal: 8px, Vertical: 2px

// Medium (md)
px-2.5 py-1  // Horizontal: 10px, Vertical: 4px

// Pill
px-3 py-1.5  // Horizontal: 12px, Vertical: 6px

// From tokens/effects.ts
radius-md: 0.5rem      // 8px - sm/md badges
radius-full: 9999px    // Full - pill badges
```

---

## Related Components

- [Chip](#) - Interactive, removable tags
- [Button](#) - For actions, not status
- [Alert](#) - For important messages
- [Status Indicator](#) - For connection/system status

---

## Changelog

### Version 1.0.0 (2025-12-30)
- Initial documentation following Spectrum 2 structure
- Documented 5 variants and 13 tone colors
- Added comprehensive usage guidelines
- Added accessibility documentation
- Added design token references
- Added 10 real-world examples

---

**Last Updated**: 2025-12-30  
**Component Location**: `src/components/ui/badge.tsx`  
**Primitive Wrapper**: N/A (use base component directly)
