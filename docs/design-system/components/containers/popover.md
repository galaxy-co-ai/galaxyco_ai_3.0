# Popover

**Version 1.0.0**

A floating container that displays rich content when triggered. Popovers are positioned relative to their trigger element and can contain interactive elements, unlike tooltips.

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
- **Rich interactive content**: Forms, menus, pickers, or controls
- **Additional context**: More details about an element
- **Quick actions**: Contextual actions without full dialog
- **Settings panels**: Compact configuration options
- **Date/time pickers**: Selection interfaces
- **Color pickers**: Visual selection tools
- **User profiles**: Quick info cards

### When Not to Use
- **Simple labels**: Use Tooltip for plain text
- **Critical information**: Use Dialog for important content
- **Long content**: Use Dialog or Sheet for extensive info
- **Navigation menus**: Use Dropdown Menu instead
- **Non-dismissible content**: Content must be closeable
- **Mobile primary UI**: Limited space on mobile

---

## Anatomy

```
┌──────────────────────────────┐
│  [Trigger Element]           │ ← PopoverTrigger
│                              │
│      ▼                       │
│  ┌──────────────────────┐   │
│  │ Popover Content      │   │ ← PopoverContent
│  │                      │   │
│  │ • Rich content       │   │
│  │ • Interactive        │   │
│  │ • Forms/controls     │   │
│  │                      │   │
│  │ [Button] [Button]    │   │
│  └──────────────────────┘   │
└──────────────────────────────┘

Positioning:
├─ top (above trigger)
├─ bottom (below trigger)
├─ left (left of trigger)
└─ right (right of trigger)

Alignment:
├─ start (align to start edge)
├─ center (centered)
└─ end (align to end edge)
```

**Component Parts:**
1. **Popover** - Root container (manages state)
2. **PopoverTrigger** - Element that opens the popover
3. **PopoverContent** - Floating content container
4. **PopoverAnchor** - Alternative anchor point (optional)

---

## Components

### Popover (Root)

The root container that manages popover state.

```typescript
<Popover
  open={isOpen}
  onOpenChange={setIsOpen}
  defaultOpen={false}
>
  {/* PopoverTrigger and PopoverContent */}
</Popover>
```

**Props:**
- `open?: boolean` - Controlled open state
- `onOpenChange?: (open: boolean) => void` - Open state change handler
- `defaultOpen?: boolean` - Uncontrolled default open state
- `modal?: boolean` - Whether popover is modal (default: false)

### PopoverTrigger

The element that activates the popover.

```typescript
<PopoverTrigger asChild>
  <Button>Open</Button>
</PopoverTrigger>
```

**Props:**
- `asChild?: boolean` - Merge props with child element
- All button attributes

**Usage:**
- Use `asChild` to render your own trigger element
- Without `asChild`, renders a basic button

### PopoverContent

The floating content container.

```typescript
<PopoverContent
  align="center"
  side="bottom"
  sideOffset={4}
>
  {/* Content */}
</PopoverContent>
```

**Props:**
- `side?: "top" | "right" | "bottom" | "left"` - Preferred side (default: bottom)
- `align?: "start" | "center" | "end"` - Alignment (default: center)
- `sideOffset?: number` - Distance from trigger in pixels (default: 4)
- `alignOffset?: number` - Alignment offset in pixels
- `avoidCollisions?: boolean` - Flip to avoid collisions (default: true)
- `collisionPadding?: number` - Padding from viewport edges

**Design tokens:**
- Background: `bg-popover`
- Text: `text-popover-foreground`
- Border: `border`
- Border radius: `rounded-md` (8px)
- Shadow: `shadow-md`
- Padding: `p-4` (1rem)
- Default width: `w-72` (18rem / 288px)
- Z-index: `z-50`

**Animations:**
- **Open**: `fade-in-0 zoom-in-95 slide-in-from-*`
- **Close**: `fade-out-0 zoom-out-95`
- Direction-based entrance animations

### PopoverAnchor

Alternative anchor point for positioning.

```typescript
<PopoverAnchor>
  <div>Anchor element</div>
</PopoverAnchor>
```

**Usage:**
- Use when trigger and anchor are different elements
- Rare use case; most popovers use trigger as anchor

---

## Variants

### Side Positioning

```typescript
// Bottom (default)
<PopoverContent side="bottom" align="center">

// Top
<PopoverContent side="top" align="center">

// Left
<PopoverContent side="left" align="center">

// Right
<PopoverContent side="right" align="center">
```

### Alignment

```typescript
// Center (default)
<PopoverContent align="center">

// Start
<PopoverContent align="start">

// End
<PopoverContent align="end">
```

### Width Variants

```typescript
// Default (18rem)
<PopoverContent className="w-72">

// Small (12rem)
<PopoverContent className="w-48">

// Medium (24rem)
<PopoverContent className="w-96">

// Full width (fit content)
<PopoverContent className="w-auto">

// Match trigger width
<PopoverContent className="w-[--radix-popover-trigger-width]">
```

---

## States

### Open States

```typescript
// Uncontrolled
<Popover defaultOpen={false}>

// Controlled
const [open, setOpen] = useState(false);
<Popover open={open} onOpenChange={setOpen}>
```

### Disabled State

```typescript
<PopoverTrigger disabled>
  <Button disabled>Open</Button>
</PopoverTrigger>
```

### Modal vs Non-Modal

```typescript
// Non-modal (default) - can interact with page
<Popover modal={false}>

// Modal - blocks page interaction
<Popover modal={true}>
```

---

## Usage Guidelines

### ✅ Do's

- **Use for rich interactive content**: Forms, controls, complex info
  ```typescript
  ✅
  <Popover>
    <PopoverTrigger><Button>Settings</Button></PopoverTrigger>
    <PopoverContent>
      <div className="space-y-4">
        <Label>Notifications</Label>
        <Switch />
      </div>
    </PopoverContent>
  </Popover>
  ```

- **Keep content focused**: One primary purpose per popover
  ```typescript
  ✅ // Focused on color selection
  <PopoverContent>
    <ColorPicker />
  </PopoverContent>
  ```

- **Position intelligently**: Choose side based on context
  ```typescript
  ✅ // Open upward if trigger is near bottom
  <PopoverContent side="top">
  ```

- **Provide close mechanism**: X button or "Cancel" action
  ```typescript
  ✅
  <PopoverContent>
    <Button onClick={() => setOpen(false)}>Close</Button>
  </PopoverContent>
  ```

- **Use appropriate width**: Match content needs
  ```typescript
  ✅ <PopoverContent className="w-80"> // Wider for forms
  ✅ <PopoverContent className="w-64"> // Narrower for simple content
  ```

- **Make interactive elements accessible**: Keyboard navigable
  ```typescript
  ✅
  <PopoverContent>
    <Button>Action 1</Button>
    <Button>Action 2</Button>
  </PopoverContent>
  ```

### ❌ Don'ts

- **Don't use for simple text**: Use Tooltip instead
  ```typescript
  ❌ 
  <Popover>
    <PopoverContent>Simple description</PopoverContent>
  </Popover>
  
  ✅ <Tooltip>Simple description</Tooltip>
  ```

- **Don't nest popovers**: Avoid popover within popover
  ```typescript
  ❌
  <PopoverContent>
    <Popover> // Nested popover
      ...
    </Popover>
  </PopoverContent>
  ```

- **Don't use for critical actions**: Use Dialog for important decisions
  ```typescript
  ❌ 
  <PopoverContent>
    <Button variant="destructive">Delete account</Button>
  </PopoverContent>
  
  ✅ // Use AlertDialog for destructive actions
  ```

- **Don't make content too long**: Keep scrolling minimal
  ```typescript
  ❌ <PopoverContent className="h-screen overflow-auto">
  ✅ <PopoverContent className="max-h-[400px] overflow-auto">
  ```

- **Don't forget mobile considerations**: Popovers may not work well on small screens
  ```typescript
  // Consider using Sheet on mobile
  const isMobile = useMediaQuery("(max-width: 768px)");
  {isMobile ? <Sheet /> : <Popover />}
  ```

- **Don't block critical UI**: Ensure popover can be dismissed
  ```typescript
  ❌ // No way to close
  <PopoverContent>Content with no close button</PopoverContent>
  
  ✅ // Click outside to dismiss (default behavior)
  ```

---

## Content Standards

### Content Length

**Guidelines:**
- Keep concise: Users should scan quickly
- Maximum height: ~400px before scrolling
- Focus on one task or piece of info

**Examples:**
```typescript
✅ // Focused color picker
<PopoverContent className="w-64">
  <ColorPicker />
</PopoverContent>

✅ // Quick settings
<PopoverContent className="w-80">
  <div className="space-y-4">
    <SwitchField label="Enable notifications" />
    <SwitchField label="Show preview" />
  </div>
</PopoverContent>

❌ // Too much content
<PopoverContent>
  {/* 50 form fields */}
</PopoverContent>
```

### Headers

**Structure:**
- Optional heading at top
- Font size: `text-base` or `text-lg`
- Font weight: `font-medium` or `font-semibold`

**Examples:**
```typescript
✅
<PopoverContent>
  <div className="space-y-2">
    <h4 className="font-medium">Share document</h4>
    <p className="text-sm text-muted-foreground">
      Choose who can view this file
    </p>
  </div>
</PopoverContent>
```

### Actions

**Guidelines:**
- Primary actions at bottom-right
- Cancel/close at bottom-left
- Icon buttons for simple actions

**Examples:**
```typescript
✅
<PopoverContent>
  <div className="space-y-4">
    {/* Content */}
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={close}>Cancel</Button>
      <Button onClick={save}>Save</Button>
    </div>
  </div>
</PopoverContent>
```

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Space` / `Enter` | Open popover (on trigger) |
| `Esc` | Close popover |
| `Tab` | Navigate through interactive elements |
| `Shift + Tab` | Navigate backwards |

### Screen Reader Support

**ARIA attributes (automatic):**
- `role="dialog"` on popover content
- `aria-haspopup="dialog"` on trigger
- `aria-expanded` reflects open state
- `aria-controls` links trigger to content
- `aria-labelledby` if heading present

**Implementation:**
```typescript
// Add heading for screen readers
<PopoverContent>
  <h3 id="popover-title" className="text-lg font-medium">
    Settings
  </h3>
  <div>{/* Content */}</div>
</PopoverContent>
```

### Focus Management

- **Initial focus**: First focusable element in popover
- **Focus trap**: Focus stays within popover when modal
- **Return focus**: Focus returns to trigger on close

```typescript
// Manual focus control
<PopoverContent>
  <Input autoFocus /> {/* Focus first input */}
</PopoverContent>
```

### Visual Requirements

**Contrast:**
- Content: 4.5:1 minimum (AA)
- Interactive elements: Meet button/input contrast requirements

**Focus indicators:**
- Clear focus rings on all interactive elements
- Default: `focus-visible:ring-[3px] focus-visible:ring-ring/50`

### Touch Targets

**Minimum sizes:**
- Trigger: 44×44px minimum on mobile
- Interactive elements inside: 44×44px
- Adequate spacing between elements

---

## Implementation

### Installation

```bash
npm install @radix-ui/react-popover
```

### Basic Implementation

```typescript
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function BasicPopover() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-2">
          <h4 className="font-medium">Popover heading</h4>
          <p className="text-sm text-muted-foreground">
            This is the popover content.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### Controlled State

```typescript
import { useState } from "react";

export function ControlledPopover() {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button>Open</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p>Content</p>
        <Button onClick={() => setOpen(false)}>Close</Button>
      </PopoverContent>
    </Popover>
  );
}
```

### With Form

```typescript
export function FormPopover() {
  const [value, setValue] = useState("");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Edit</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          </div>
          <Button className="w-full">Save</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

---

## Examples

### Example 1: User Profile Card

```typescript
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon">
      <Avatar>
        <AvatarImage src="/user.jpg" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-80">
    <div className="flex gap-4">
      <Avatar className="size-12">
        <AvatarImage src="/user.jpg" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <h4 className="font-medium">John Doe</h4>
        <p className="text-sm text-muted-foreground">
          john@example.com
        </p>
        <div className="flex gap-2 pt-2">
          <Button size="sm">Profile</Button>
          <Button size="sm" variant="outline">
            Logout
          </Button>
        </div>
      </div>
    </div>
  </PopoverContent>
</Popover>
```

### Example 2: Date Picker

```typescript
import { Calendar } from "@/components/ui/calendar";

function DatePickerPopover() {
  const [date, setDate] = useState<Date>();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <CalendarIcon className="mr-2 size-4" />
          {date ? format(date, "PPP") : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
```

### Example 3: Share Menu

```typescript
function SharePopover() {
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Share2 className="mr-2 size-4" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Share this page</h4>
            <div className="flex gap-2">
              <Input value={window.location.href} readOnly />
              <Button size="icon" onClick={copyLink}>
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Twitter className="mr-2 size-4" />
              Twitter
            </Button>
            <Button variant="outline" className="flex-1">
              <Facebook className="mr-2 size-4" />
              Facebook
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### Example 4: Color Picker

```typescript
function ColorPickerPopover() {
  const [color, setColor] = useState("#3b82f6");

  const presetColors = [
    "#ef4444", "#f59e0b", "#10b981", "#3b82f6",
    "#8b5cf6", "#ec4899", "#64748b"
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-start">
          <div
            className="size-4 rounded mr-2"
            style={{ backgroundColor: color }}
          />
          {color}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Color</Label>
            <Input
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="#000000"
            />
          </div>
          <div className="grid grid-cols-7 gap-2">
            {presetColors.map((presetColor) => (
              <button
                key={presetColor}
                className="size-8 rounded border"
                style={{ backgroundColor: presetColor }}
                onClick={() => setColor(presetColor)}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### Example 5: Settings Panel

```typescript
function SettingsPopover() {
  const [settings, setSettings] = useState({
    notifications: true,
    autoSave: false,
    theme: "light"
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">Settings</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications">Notifications</Label>
            <Switch
              id="notifications"
              checked={settings.notifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, notifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="autoSave">Auto-save</Label>
            <Switch
              id="autoSave"
              checked={settings.autoSave}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, autoSave: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Theme</Label>
            <Select
              value={settings.theme}
              onValueChange={(theme) =>
                setSettings({ ...settings, theme })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### Example 6: Quick Actions

```typescript
<Popover>
  <PopoverTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="size-4" />
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-48 p-0">
    <div className="flex flex-col">
      <Button variant="ghost" className="justify-start">
        <Edit className="mr-2 size-4" />
        Edit
      </Button>
      <Button variant="ghost" className="justify-start">
        <Copy className="mr-2 size-4" />
        Duplicate
      </Button>
      <Button variant="ghost" className="justify-start">
        <Download className="mr-2 size-4" />
        Download
      </Button>
      <Separator />
      <Button variant="ghost" className="justify-start text-destructive">
        <Trash2 className="mr-2 size-4" />
        Delete
      </Button>
    </div>
  </PopoverContent>
</Popover>
```

### Example 7: Filter Panel

```typescript
function FilterPopover() {
  const [filters, setFilters] = useState({
    status: [],
    priority: [],
    assignee: ""
  });

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 size-4" />
          Filters
          {Object.values(filters).some(v => v.length > 0 || v !== "") && (
            <Badge className="ml-2" variant="secondary">
              {Object.values(filters).filter(v => v.length > 0 || v !== "").length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium">Filters</h4>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="flex flex-col gap-2">
              <Checkbox id="high" label="High" />
              <Checkbox id="medium" label="Medium" />
              <Checkbox id="low" label="Low" />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              Reset
            </Button>
            <Button className="flex-1">
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### Example 8: Emoji Picker

```typescript
function EmojiPickerPopover() {
  const [selected, setSelected] = useState("😊");

  const emojis = ["😊", "😂", "❤️", "👍", "🎉", "🔥", "✨", "👀"];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          {selected}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-2">
          <Label>Choose emoji</Label>
          <div className="grid grid-cols-4 gap-2">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                className={cn(
                  "size-12 rounded border text-2xl hover:bg-accent",
                  selected === emoji && "bg-accent"
                )}
                onClick={() => setSelected(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

---

**Related Components:**
- [Tooltip](../feedback/tooltip.md) - Simple hover text
- [Dialog](./dialog.md) - Modal dialogs
- [Dropdown Menu](../navigation/dropdown-menu.md) - Navigation menus
- [Select](../inputs/select.md) - Selection dropdowns

**Design Tokens:**
- [Colors](../../tokens/colors.md)
- [Spacing](../../tokens/spacing.md)
- [Typography](../../tokens/typography.md)
- [Effects](../../tokens/effects.md)
