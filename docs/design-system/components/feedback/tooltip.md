# Tooltip

**Version 1.0.0**

A small popup that displays brief, helpful text when users hover over or focus on an element. Tooltips provide supplementary information without cluttering the interface.

---

## Table of Contents

- [Overview](#overview)
- [Anatomy](#anatomy)
- [Components](#components)
- [Variants](#variants)
- [States](#states)
- [Usage Guidelines](#usage-guidelines)
- [Content Standards](#content-standards)
- [Accessibility](#accessibility)
- [Implementation](#implementation)
- [Examples](#examples)

---

## Overview

### When to Use
- **Icon labels**: Explain icon-only buttons
- **Truncated text**: Show full text when truncated
- **Definitions**: Brief explanations of terms
- **Keyboard shortcuts**: Display hotkeys
- **Disabled states**: Explain why something is disabled
- **Supplementary info**: Additional context that's not critical
- **Help text**: Brief instructions or tips

### When Not to Use
- **Critical information**: Users must see it immediately
- **Interactive content**: Use Popover instead
- **Long text**: Keep tooltips brief (1-2 lines)
- **Mobile primary UI**: Touch doesn't support hover
- **Rich content**: Use Popover or Dialog for complex content
- **Always visible info**: Use inline text instead

---

## Anatomy

```
┌────────────────────────┐
│  [Trigger Element]     │ ← TooltipTrigger
│         ↓              │
│  ┌──────────────┐      │
│  │ Tooltip text │      │ ← TooltipContent
│  └──────────────┘      │
└────────────────────────┘

Positioning:
├─ top (above trigger)
├─ bottom (below trigger) - default
├─ left (left of trigger)
└─ right (right of trigger)

Timing:
├─ Delay: 0ms (default)
├─ Enter delay: Configurable
└─ Leave delay: Immediate dismiss
```

**Component Parts:**
1. **TooltipProvider** - Context provider (wraps app or section)
2. **Tooltip** - Root container (manages state)
3. **TooltipTrigger** - Element that activates tooltip
4. **TooltipContent** - Text content displayed

---

## Components

### TooltipProvider

Context provider that configures tooltip behavior for all child tooltips.

```typescript
<TooltipProvider delayDuration={0}>
  {/* App or section content with tooltips */}
</TooltipProvider>
```

**Props:**
- `delayDuration?: number` - Delay before showing (ms, default: 0)
- `skipDelayDuration?: number` - Skip delay when moving between tooltips (ms, default: 300)
- `disableHoverableContent?: boolean` - Whether content can be hovered

**Usage:**
- Place in app root or section containing tooltips
- Configure global tooltip timing

### Tooltip (Root)

The root container for a single tooltip.

```typescript
<Tooltip>
  <TooltipTrigger>...</TooltipTrigger>
  <TooltipContent>...</TooltipContent>
</Tooltip>
```

**Props:**
- `open?: boolean` - Controlled open state
- `defaultOpen?: boolean` - Uncontrolled default open state
- `onOpenChange?: (open: boolean) => void` - Open state change handler
- `delayDuration?: number` - Override provider delay

### TooltipTrigger

The element that activates the tooltip.

```typescript
<TooltipTrigger asChild>
  <Button variant="ghost" size="icon">
    <Info className="size-4" />
  </Button>
</TooltipTrigger>
```

**Props:**
- `asChild?: boolean` - Merge props with child element (recommended)
- All button attributes

**Usage:**
- Always use `asChild` to render your own element
- Trigger must be focusable for keyboard access

### TooltipContent

The text content displayed in the tooltip.

```typescript
<TooltipContent
  side="top"
  align="center"
  sideOffset={8}
>
  Tooltip text
</TooltipContent>
```

**Props:**
- `side?: "top" | "right" | "bottom" | "left"` - Preferred side (default: bottom)
- `align?: "start" | "center" | "end"` - Alignment (default: center)
- `sideOffset?: number` - Distance from trigger in pixels (default: 8)
- `alignOffset?: number` - Alignment offset in pixels
- `avoidCollisions?: boolean` - Flip to avoid viewport edges (default: true)
- `collisionPadding?: number` - Padding from viewport edges

**Design tokens:**
- Background: `bg-primary`
- Text: `text-primary-foreground`
- Font size: `text-xs` (0.75rem)
- Padding: `px-3 py-1.5`
- Border radius: `rounded-md` (8px)
- Z-index: `z-50`
- Max width: Fits content, balanced text
- Text balance: `text-balance` (prevents orphans)

**Animations:**
- **Appear**: `fade-in-0 zoom-in-95 slide-in-from-*`
- **Disappear**: `fade-out-0 zoom-out-95`
- Duration: Fast (~150ms)

---

## Variants

### Side Positioning

```typescript
// Bottom (default)
<TooltipContent side="bottom">

// Top
<TooltipContent side="top">

// Left
<TooltipContent side="left">

// Right
<TooltipContent side="right">
```

**Automatic positioning:**
- Radix auto-flips to avoid viewport edges
- Prefers specified side when space available

### Delay Variants

```typescript
// Instant (default)
<TooltipProvider delayDuration={0}>

// Short delay (300ms)
<TooltipProvider delayDuration={300}>

// Longer delay (700ms)
<TooltipProvider delayDuration={700}>
```

**Recommendations:**
- **0ms**: Icon buttons, truncated text
- **300ms**: Standard tooltips
- **700ms**: Less critical supplementary info

---

## States

### Hover State

```typescript
// Shows on hover
<Tooltip>
  <TooltipTrigger>Hover me</TooltipTrigger>
  <TooltipContent>Tooltip appears</TooltipContent>
</Tooltip>
```

### Focus State

```typescript
// Shows on keyboard focus
<Tooltip>
  <TooltipTrigger asChild>
    <Button>Focus me</Button>
  </TooltipTrigger>
  <TooltipContent>Tooltip appears</TooltipContent>
</Tooltip>
```

### Controlled State

```typescript
const [open, setOpen] = useState(false);

<Tooltip open={open} onOpenChange={setOpen}>
  <TooltipTrigger>Trigger</TooltipTrigger>
  <TooltipContent>Controlled tooltip</TooltipContent>
</Tooltip>
```

### Disabled Trigger

```typescript
<Tooltip>
  <TooltipTrigger asChild>
    <Button disabled>
      Disabled button
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    This feature is not available in your plan
  </TooltipContent>
</Tooltip>
```

---

## Usage Guidelines

### ✅ Do's

- **Keep text brief**: 1-10 words maximum
  ```typescript
  ✅ <TooltipContent>Save changes</TooltipContent>
  ✅ <TooltipContent>Delete item (⌘⌫)</TooltipContent>
  ❌ <TooltipContent>
    This button will save all your changes to the database and
    send a confirmation email to your inbox.
  </TooltipContent>
  ```

- **Use for icon-only buttons**: Always label icons
  ```typescript
  ✅
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">
        <Settings className="size-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Settings</TooltipContent>
  </Tooltip>
  ```

- **Explain disabled states**: Help users understand why
  ```typescript
  ✅
  <Tooltip>
    <TooltipTrigger asChild>
      <Button disabled>Export</Button>
    </TooltipTrigger>
    <TooltipContent>Select items to export</TooltipContent>
  </Tooltip>
  ```

- **Show keyboard shortcuts**: Include hotkeys
  ```typescript
  ✅ <TooltipContent>Save (⌘S)</TooltipContent>
  ✅ <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
  ```

- **Clarify truncated text**: Show full text
  ```typescript
  ✅
  <Tooltip>
    <TooltipTrigger asChild>
      <p className="truncate">Very long text...</p>
    </TooltipTrigger>
    <TooltipContent>
      Very long text that was truncated
    </TooltipContent>
  </Tooltip>
  ```

- **Position appropriately**: Avoid covering important content
  ```typescript
  ✅ <TooltipContent side="top"> // Opens above, away from content
  ```

### ❌ Don'ts

- **Don't use for critical information**: Must be discoverable
  ```typescript
  ❌ <TooltipContent>Required field</TooltipContent>
  ✅ // Use inline error message or label
  ```

- **Don't make tooltips interactive**: They dismiss on hover away
  ```typescript
  ❌ 
  <TooltipContent>
    <Button>Click me</Button> // Can't click
  </TooltipContent>
  
  ✅ // Use Popover for interactive content
  ```

- **Don't use on mobile-first UI**: Hover doesn't exist on touch
  ```typescript
  // Conditionally hide tooltips on mobile
  const isMobile = useMediaQuery("(max-width: 768px)");
  {!isMobile && <Tooltip>...</Tooltip>}
  ```

- **Don't repeat visible text**: Tooltip should add information
  ```typescript
  ❌
  <Tooltip>
    <TooltipTrigger>
      <Button>Save</Button>
    </TooltipTrigger>
    <TooltipContent>Save</TooltipContent> // Redundant
  </Tooltip>
  ```

- **Don't use for long explanations**: Keep concise
  ```typescript
  ❌ <TooltipContent>
    {/* 3 paragraphs of text */}
  </TooltipContent>
  
  ✅ // Use Popover or Dialog for long content
  ```

- **Don't nest tooltips**: One tooltip at a time
  ```typescript
  ❌
  <Tooltip>
    <TooltipContent>
      <Tooltip>...</Tooltip> // Nested
    </TooltipContent>
  </Tooltip>
  ```

---

## Content Standards

### Text Length

**Guidelines:**
- **Ideal**: 2-6 words
- **Maximum**: 10 words or 1 line
- **Special cases**: Keyboard shortcuts can be slightly longer

**Examples:**
```typescript
✅ "Save"
✅ "Delete item"
✅ "Save changes (⌘S)"
✅ "Edit profile settings"
❌ "This button will save all your changes" // Too long
```

### Capitalization

**Rules:**
- Sentence case for most tooltips
- Title Case only for proper nouns
- No ending punctuation (unless multiple sentences)

**Examples:**
```typescript
✅ "Save changes"
✅ "New York office"
✅ "Settings"
❌ "Save Changes" // Don't use Title Case
❌ "Save." // No period for single phrase
```

### Content Types

**Labels:**
```typescript
✅ "Settings"
✅ "Help"
✅ "Notifications"
```

**Actions:**
```typescript
✅ "Save changes"
✅ "Delete item"
✅ "Copy to clipboard"
```

**Keyboard shortcuts:**
```typescript
✅ "Save (⌘S)"
✅ "Undo (Ctrl+Z)"
✅ "Search (⌘K)"
```

**Disabled explanations:**
```typescript
✅ "Upgrade to enable"
✅ "Select items first"
✅ "Insufficient permissions"
```

**Definitions:**
```typescript
✅ "AI-powered content generation"
✅ "Last synchronized 2 hours ago"
```

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Focus trigger (tooltip appears) |
| `Esc` | Dismiss tooltip |
| `Shift + Tab` | Move focus back |

**Behavior:**
- Tooltip appears on focus (keyboard users)
- Tooltip appears on hover (mouse users)
- No keyboard interaction needed with tooltip itself

### Screen Reader Support

**ARIA attributes (automatic):**
- `role="tooltip"` on content
- `aria-describedby` on trigger (links to content)
- Content announced when trigger focused

**Implementation:**
```typescript
// Automatically accessible
<Tooltip>
  <TooltipTrigger asChild>
    <Button>Save</Button>
  </TooltipTrigger>
  <TooltipContent>
    Save changes (⌘S)
  </TooltipContent>
</Tooltip>
```

**Screen reader announcements:**
- "Save button, Save changes command S"
- Content read after element name

### Visual Requirements

**Contrast:**
- Text: 4.5:1 minimum on background (AA)
- Default uses `bg-primary` with `text-primary-foreground` for high contrast

**Timing:**
- Instant display (0ms default)
- Screen readers announce immediately on focus
- Visual users see on hover

### Touch Accessibility

**Mobile considerations:**
- Tooltips don't work well on touch devices
- Consider alternative patterns on mobile:
  ```typescript
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  {isMobile ? (
    <Button>
      <span className="sr-only">Settings</span>
      <Settings className="size-4" />
    </Button>
  ) : (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Settings</TooltipContent>
    </Tooltip>
  )}
  ```

---

## Implementation

### Installation

```bash
npm install @radix-ui/react-tooltip
```

### Setup

Wrap your app with `TooltipProvider`:

```typescript
// app/layout.tsx (Next.js)
import { TooltipProvider } from "@/components/ui/tooltip";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TooltipProvider delayDuration={0}>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
```

### Basic Usage

```typescript
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function IconButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon">
          <Info className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        More information
      </TooltipContent>
    </Tooltip>
  );
}
```

### With Keyboard Shortcut

```typescript
<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="ghost" size="icon">
      <Save className="size-4" />
    </Button>
  </TooltipTrigger>
  <TooltipContent>
    Save (⌘S)
  </TooltipContent>
</Tooltip>
```

### Disabled Element Tooltip

```typescript
<Tooltip>
  <TooltipTrigger asChild>
    <span> {/* Wrapper needed for disabled elements */}
      <Button disabled>
        Export
      </Button>
    </span>
  </TooltipTrigger>
  <TooltipContent>
    Select items to export
  </TooltipContent>
</Tooltip>
```

---

## Examples

### Example 1: Icon Button Tooltips

```typescript
<div className="flex gap-2">
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">
        <Edit className="size-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Edit</TooltipContent>
  </Tooltip>

  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">
        <Copy className="size-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Duplicate</TooltipContent>
  </Tooltip>

  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon">
        <Trash2 className="size-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Delete</TooltipContent>
  </Tooltip>
</div>
```

### Example 2: Toolbar with Shortcuts

```typescript
<div className="flex items-center gap-1 p-2 border rounded-md">
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="sm">
        <Bold className="size-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Bold (⌘B)</TooltipContent>
  </Tooltip>

  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="sm">
        <Italic className="size-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Italic (⌘I)</TooltipContent>
  </Tooltip>

  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="sm">
        <Underline className="size-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Underline (⌘U)</TooltipContent>
  </Tooltip>

  <Separator orientation="vertical" className="h-6" />

  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="sm">
        <Link className="size-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Insert link (⌘K)</TooltipContent>
  </Tooltip>
</div>
```

### Example 3: Status Icons

```typescript
<div className="flex items-center gap-4">
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="flex items-center gap-2 cursor-help">
        <div className="size-2 rounded-full bg-green-500" />
        <span>Online</span>
      </div>
    </TooltipTrigger>
    <TooltipContent>
      Connected to server
    </TooltipContent>
  </Tooltip>

  <Tooltip>
    <TooltipTrigger asChild>
      <div className="flex items-center gap-2 cursor-help">
        <Loader2 className="size-4 animate-spin" />
        <span>Syncing</span>
      </div>
    </TooltipTrigger>
    <TooltipContent>
      Syncing changes to cloud
    </TooltipContent>
  </Tooltip>
</div>
```

### Example 4: Truncated Text

```typescript
function TruncatedName({ name }: { name: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <p className="max-w-[200px] truncate cursor-default">
          {name}
        </p>
      </TooltipTrigger>
      <TooltipContent>
        {name}
      </TooltipContent>
    </Tooltip>
  );
}

// Usage
<TruncatedName name="Very Long Project Name That Gets Truncated" />
```

### Example 5: Disabled Button

```typescript
<Tooltip>
  <TooltipTrigger asChild>
    <span>
      <Button disabled className="cursor-not-allowed">
        <Download className="mr-2 size-4" />
        Export
      </Button>
    </span>
  </TooltipTrigger>
  <TooltipContent>
    Select at least one item to export
  </TooltipContent>
</Tooltip>
```

### Example 6: Info Icons

```typescript
<div className="flex items-center gap-2">
  <Label htmlFor="api-key">API Key</Label>
  <Tooltip>
    <TooltipTrigger asChild>
      <Info className="size-4 text-muted-foreground cursor-help" />
    </TooltipTrigger>
    <TooltipContent>
      Find your API key in account settings
    </TooltipContent>
  </Tooltip>
</div>
<Input id="api-key" type="password" />
```

### Example 7: Avatar with Name

```typescript
<Tooltip>
  <TooltipTrigger asChild>
    <Avatar className="cursor-pointer">
      <AvatarImage src="/user.jpg" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  </TooltipTrigger>
  <TooltipContent>
    John Doe (john@example.com)
  </TooltipContent>
</Tooltip>
```

### Example 8: Badge with Details

```typescript
<Tooltip>
  <TooltipTrigger asChild>
    <Badge variant="secondary" className="cursor-help">
      3 pending
    </Badge>
  </TooltipTrigger>
  <TooltipContent>
    3 tasks awaiting your review
  </TooltipContent>
</Tooltip>
```

### Example 9: Progress Indicator

```typescript
<div className="space-y-2">
  <div className="flex justify-between text-sm">
    <span>Storage used</span>
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-muted-foreground cursor-help">
          4.2 GB / 10 GB
        </span>
      </TooltipTrigger>
      <TooltipContent>
        42% of storage used
      </TooltipContent>
    </Tooltip>
  </div>
  <Progress value={42} />
</div>
```

### Example 10: Conditional Tooltip

```typescript
function ConditionalTooltip({
  show,
  content,
  children
}: {
  show: boolean;
  content: string;
  children: React.ReactNode;
}) {
  if (!show) return children;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent>
        {content}
      </TooltipContent>
    </Tooltip>
  );
}

// Usage
<ConditionalTooltip
  show={isDisabled}
  content="Feature not available in free plan"
>
  <Button disabled={isDisabled}>
    Premium Feature
  </Button>
</ConditionalTooltip>
```

---

**Related Components:**
- [Popover](../containers/popover.md) - Interactive floating content
- [Button](../actions/button.md) - Action triggers
- [Badge](../data/badge.md) - Status indicators
- [Toast](./toast.md) - Temporary notifications

**Design Tokens:**
- [Colors](../../tokens/colors.md)
- [Spacing](../../tokens/spacing.md)
- [Typography](../../tokens/typography.md)
- [Effects](../../tokens/effects.md)
