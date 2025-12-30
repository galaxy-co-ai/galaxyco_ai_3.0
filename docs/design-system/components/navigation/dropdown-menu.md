# Dropdown Menu

**Version 1.0.0**

A menu component that displays a list of actions or options when triggered. Dropdown menus support keyboard navigation, nested submenus, checkboxes, radio groups, and keyboard shortcuts.

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
- **Action menus**: List of actions for an item
- **Navigation menus**: Dropdown navigation
- **Settings menus**: User account, preferences
- **Context-specific actions**: Per-item actions
- **Option selection**: Checkboxes and radio buttons
- **Nested navigation**: Multi-level menu structures

### When Not to Use
- **Form inputs**: Use Select component
- **Simple tooltips**: Use Tooltip
- **Complex forms**: Use Dialog or Sheet
- **Single action**: Use Button directly
- **Critical confirmations**: Use Alert Dialog

---

## Anatomy

```
┌─────────────────────────┐
│  [Trigger Button]    ▼  │ ← DropdownMenuTrigger
└─────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Menu Label                 │ ← DropdownMenuLabel
│  ───────────────────────    │ ← DropdownMenuSeparator
│  ✓ Checkbox Item            │ ← DropdownMenuCheckboxItem
│  ○ Radio Item (selected)    │ ← DropdownMenuRadioItem
│  ───────────────────────    │
│  Action Item          ⌘K    │ ← DropdownMenuItem with Shortcut
│  Destructive Action         │ ← DropdownMenuItem (destructive)
│  Submenu Item            ▶  │ ← DropdownMenuSubTrigger
│     └─────────────────────┐ │
│       │  Sub Item 1       │ │ ← DropdownMenuSubContent
│       │  Sub Item 2       │ │
│       └───────────────────┘ │
└─────────────────────────────┘
         ↑
   DropdownMenuContent
```

**Component Parts:**
1. **DropdownMenu** - Root container (manages state)
2. **DropdownMenuTrigger** - Button that opens menu
3. **DropdownMenuContent** - Menu container (portal)
4. **DropdownMenuItem** - Clickable menu item
5. **DropdownMenuCheckboxItem** - Checkbox menu item
6. **DropdownMenuRadioGroup** - Radio button group
7. **DropdownMenuRadioItem** - Radio menu item
8. **DropdownMenuLabel** - Section heading
9. **DropdownMenuSeparator** - Visual divider
10. **DropdownMenuShortcut** - Keyboard shortcut display
11. **DropdownMenuSub** - Submenu container
12. **DropdownMenuSubTrigger** - Submenu trigger
13. **DropdownMenuSubContent** - Submenu content
14. **DropdownMenuGroup** - Group items together
15. **DropdownMenuPortal** - Portal for rendering

---

## Components

### DropdownMenu (Root)

The root container that manages menu state.

```typescript
<DropdownMenu
  open={isOpen}
  onOpenChange={setIsOpen}
  modal={false}
>
  {/* Menu components */}
</DropdownMenu>
```

**Props:**
- `open?: boolean` - Controlled open state
- `onOpenChange?: (open: boolean) => void` - Open state change handler
- `defaultOpen?: boolean` - Uncontrolled default open state
- `modal?: boolean` - Whether menu is modal (default: true)

### DropdownMenuTrigger

The button that activates the dropdown menu.

```typescript
<DropdownMenuTrigger asChild>
  <Button variant="outline">
    Open menu
  </Button>
</DropdownMenuTrigger>
```

**Props:**
- `asChild?: boolean` - Merge props with child element
- All button attributes

### DropdownMenuContent

The menu container with all items.

```typescript
<DropdownMenuContent
  align="start"
  sideOffset={4}
>
  {/* Menu items */}
</DropdownMenuContent>
```

**Props:**
- `side?: "top" | "right" | "bottom" | "left"` - Preferred side
- `align?: "start" | "center" | "end"` - Alignment
- `sideOffset?: number` - Distance from trigger (default: 4px)
- `alignOffset?: number` - Alignment offset

**Design tokens:**
- Background: `bg-popover`
- Text: `text-popover-foreground`
- Border: `border`
- Border radius: `rounded-md` (8px)
- Shadow: `shadow-md`
- Padding: `p-1` (0.25rem)
- Min width: `min-w-[8rem]`
- Z-index: `z-50`

### DropdownMenuItem

A clickable menu item.

```typescript
<DropdownMenuItem onSelect={() => handleAction()}>
  <Edit className="mr-2 size-4" />
  Edit
  <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
</DropdownMenuItem>

// Destructive variant
<DropdownMenuItem variant="destructive">
  <Trash2 className="mr-2 size-4" />
  Delete
</DropdownMenuItem>
```

**Props:**
- `variant?: "default" | "destructive"` - Visual variant
- `inset?: boolean` - Add left padding for alignment
- `disabled?: boolean` - Disable interaction
- `onSelect?: (event: Event) => void` - Selection handler

**Design tokens:**
- Padding: `px-2 py-1.5`
- Border radius: `rounded-sm` (4px)
- Text size: `text-sm`
- Gap: `gap-2`
- Focus: `focus:bg-accent focus:text-accent-foreground`
- Destructive: `text-destructive`

### DropdownMenuCheckboxItem

A menu item with checkbox state.

```typescript
<DropdownMenuCheckboxItem
  checked={isChecked}
  onCheckedChange={setIsChecked}
>
  Show status bar
</DropdownMenuCheckboxItem>
```

**Props:**
- `checked?: boolean` - Checked state
- `onCheckedChange?: (checked: boolean) => void` - Check handler
- `disabled?: boolean` - Disable interaction

**Design tokens:**
- Check indicator: `absolute left-2 size-3.5`
- Padding left: `pl-8` (to accommodate checkbox)

### DropdownMenuRadioGroup

Container for radio items (single selection).

```typescript
<DropdownMenuRadioGroup value={value} onValueChange={setValue}>
  <DropdownMenuRadioItem value="option1">
    Option 1
  </DropdownMenuRadioItem>
  <DropdownMenuRadioItem value="option2">
    Option 2
  </DropdownMenuRadioItem>
</DropdownMenuRadioGroup>
```

**Props:**
- `value?: string` - Selected value
- `onValueChange?: (value: string) => void` - Selection handler

### DropdownMenuRadioItem

A menu item with radio button state.

```typescript
<DropdownMenuRadioItem value="option1">
  Option 1
</DropdownMenuRadioItem>
```

**Props:**
- `value: string` - Unique identifier (required)
- `disabled?: boolean` - Disable interaction

**Design tokens:**
- Radio indicator: `absolute left-2 size-2 fill-current`
- Padding left: `pl-8`

### DropdownMenuLabel

A non-interactive heading for menu sections.

```typescript
<DropdownMenuLabel>
  My Account
</DropdownMenuLabel>
```

**Props:**
- `inset?: boolean` - Add left padding for alignment

**Design tokens:**
- Padding: `px-2 py-1.5`
- Text size: `text-sm`
- Font weight: `font-medium`

### DropdownMenuSeparator

Visual divider between menu sections.

```typescript
<DropdownMenuSeparator />
```

**Design tokens:**
- Background: `bg-border`
- Height: `h-px` (1px)
- Margin: `my-1 -mx-1`

### DropdownMenuShortcut

Display keyboard shortcut hint.

```typescript
<DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
```

**Design tokens:**
- Color: `text-muted-foreground`
- Size: `text-xs`
- Margin: `ml-auto`
- Letter spacing: `tracking-widest`

### DropdownMenuSub

Container for nested submenu.

```typescript
<DropdownMenuSub>
  <DropdownMenuSubTrigger>More options</DropdownMenuSubTrigger>
  <DropdownMenuSubContent>
    {/* Submenu items */}
  </DropdownMenuSubContent>
</DropdownMenuSub>
```

### DropdownMenuSubTrigger

Trigger for opening a submenu.

```typescript
<DropdownMenuSubTrigger>
  <Share className="mr-2 size-4" />
  Share
</DropdownMenuSubTrigger>
```

**Props:**
- `inset?: boolean` - Add left padding for alignment

**Features:**
- Automatic chevron icon (►) on right
- Opens submenu on hover or click

### DropdownMenuSubContent

Content container for submenu items.

```typescript
<DropdownMenuSubContent>
  <DropdownMenuItem>Email</DropdownMenuItem>
  <DropdownMenuItem>Message</DropdownMenuItem>
</DropdownMenuSubContent>
```

**Design tokens:**
- Same as DropdownMenuContent
- Appears to the right of parent menu

### DropdownMenuGroup

Logical grouping of menu items (no visual effect).

```typescript
<DropdownMenuGroup>
  <DropdownMenuItem>Profile</DropdownMenuItem>
  <DropdownMenuItem>Settings</DropdownMenuItem>
</DropdownMenuGroup>
```

---

## Variants

### Item Variants

```typescript
// Default item
<DropdownMenuItem>
  Action
</DropdownMenuItem>

// Destructive item
<DropdownMenuItem variant="destructive">
  Delete
</DropdownMenuItem>

// With icon
<DropdownMenuItem>
  <Icon className="mr-2 size-4" />
  Action with icon
</DropdownMenuItem>

// With shortcut
<DropdownMenuItem>
  Action
  <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
</DropdownMenuItem>

// Inset (aligned with items that have icons)
<DropdownMenuItem inset>
  No icon but aligned
</DropdownMenuItem>
```

### Selection Types

```typescript
// Checkboxes (multi-select)
<DropdownMenuCheckboxItem checked={show} onCheckedChange={setShow}>
  Show toolbar
</DropdownMenuCheckboxItem>

// Radio buttons (single select)
<DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
  <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
  <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
</DropdownMenuRadioGroup>
```

---

## States

### Open/Closed States

```typescript
// Uncontrolled
<DropdownMenu>

// Controlled
const [open, setOpen] = useState(false);
<DropdownMenu open={open} onOpenChange={setOpen}>
```

### Disabled States

```typescript
// Disabled trigger
<DropdownMenuTrigger disabled>
  <Button disabled>Menu</Button>
</DropdownMenuTrigger>

// Disabled item
<DropdownMenuItem disabled>
  Disabled action
</DropdownMenuItem>
```

### Checked States

```typescript
// Checkbox
<DropdownMenuCheckboxItem checked={true}>
  Checked
</DropdownMenuCheckboxItem>

// Radio
<DropdownMenuRadioItem value="selected">
  Selected
</DropdownMenuRadioItem>
```

---

## Usage Guidelines

### ✅ Do's

- **Group related actions**: Use labels and separators
  ```typescript
  ✅
  <DropdownMenuContent>
    <DropdownMenuLabel>Account</DropdownMenuLabel>
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Settings</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Logout</DropdownMenuItem>
  </DropdownMenuContent>
  ```

- **Use icons for clarity**: Visual indicators help
  ```typescript
  ✅
  <DropdownMenuItem>
    <Edit className="mr-2 size-4" />
    Edit
  </DropdownMenuItem>
  ```

- **Show keyboard shortcuts**: Educate power users
  ```typescript
  ✅
  <DropdownMenuItem>
    Save
    <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
  </DropdownMenuItem>
  ```

- **Place destructive actions at bottom**: Separated with divider
  ```typescript
  ✅
  <DropdownMenuContent>
    <DropdownMenuItem>Edit</DropdownMenuItem>
    <DropdownMenuItem>Duplicate</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
  ```

- **Limit menu depth**: Maximum 2 levels of nesting
  ```typescript
  ✅ Menu → Submenu
  ❌ Menu → Submenu → Sub-submenu
  ```

- **Keep items scannable**: 5-7 items per group maximum
  ```typescript
  ✅ // 5 items, easy to scan
  ❌ // 20 items, overwhelming
  ```

### ❌ Don'ts

- **Don't mix selection types**: Checkboxes OR radios, not both
  ```typescript
  ❌
  <DropdownMenuContent>
    <DropdownMenuCheckboxItem>Checkbox</DropdownMenuCheckboxItem>
    <DropdownMenuRadioItem>Radio</DropdownMenuRadioItem> {/* Confusing */}
  </DropdownMenuContent>
  ```

- **Don't omit labels for grouped items**: Context needed
  ```typescript
  ❌
  <DropdownMenuContent>
    <DropdownMenuItem>Item 1</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Item 2</DropdownMenuItem> {/* What's the difference? */}
  </DropdownMenuContent>
  
  ✅
  <DropdownMenuLabel>Edit</DropdownMenuLabel>
  <DropdownMenuItem>Item 1</DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuLabel>View</DropdownMenuLabel>
  <DropdownMenuItem>Item 2</DropdownMenuItem>
  ```

- **Don't nest too deeply**: Keep it simple
  ```typescript
  ❌ // 3+ levels of nesting
  ```

- **Don't make menus too long**: Use submenus or split
  ```typescript
  ❌ // 30 items in one menu
  ✅ // Use submenus or categorize
  ```

- **Don't use for forms**: Use Dialog with form
  ```typescript
  ❌ // Complex form in dropdown menu
  ✅ // Use Dialog for multi-field forms
  ```

---

## Content Standards

### Menu Item Labels

**Guidelines:**
- Action verbs: "Edit", "Delete", "Share"
- Sentence case
- 1-3 words maximum
- Clear and specific

**Examples:**
```typescript
✅ "Edit profile"
✅ "Save as..."
✅ "Export to PDF"
❌ "Click here to edit your profile"
❌ "EDIT PROFILE"
```

### Menu Section Labels

**Guidelines:**
- Nouns or categories
- Sentence case
- 1-2 words

**Examples:**
```typescript
✅ <DropdownMenuLabel>Account</DropdownMenuLabel>
✅ <DropdownMenuLabel>Preferences</DropdownMenuLabel>
❌ <DropdownMenuLabel>Account Settings and Preferences</DropdownMenuLabel>
```

### Keyboard Shortcuts

**Format:**
- macOS: ⌘ (Command), ⌥ (Option), ⌃ (Control), ⇧ (Shift)
- Windows/Linux: Ctrl, Alt, Shift
- Use symbols when possible

**Examples:**
```typescript
✅ <DropdownMenuShortcut>⌘K</DropdownMenuShortcut>
✅ <DropdownMenuShortcut>Ctrl+S</DropdownMenuShortcut>
❌ <DropdownMenuShortcut>Command-K</DropdownMenuShortcut>
```

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Space` / `Enter` | Open menu (on trigger) |
| `↓` | Focus next item |
| `↑` | Focus previous item |
| `→` | Open submenu |
| `←` | Close submenu |
| `Home` | Focus first item |
| `End` | Focus last item |
| `Esc` | Close menu |
| `Tab` | Close menu and move focus |
| `A-Z` | Jump to item starting with letter |
| `Space` | Toggle checkbox/radio item |

### Screen Reader Support

**ARIA attributes (automatic):**
- `role="menu"` on content
- `role="menuitem"` on items
- `role="menuitemcheckbox"` on checkbox items
- `role="menuitemradio"` on radio items
- `aria-haspopup="menu"` on trigger
- `aria-expanded` reflects open state
- `aria-checked` on checkbox/radio items
- `aria-disabled` on disabled items

### Focus Management

- **Initial focus**: First menu item when opened
- **Focus trap**: Cannot tab out, must Esc or select
- **Return focus**: Focus returns to trigger on close
- **Visual focus**: Clear focus indicator

### Touch Accessibility

**Mobile considerations:**
- Adequate touch targets (44px minimum)
- No hover-only interactions
- Tap to open, tap outside to close
- Submenus open on tap, not hover

---

## Implementation

### Installation

```bash
npm install @radix-ui/react-dropdown-menu
npm install lucide-react
```

### Basic Implementation

```typescript
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function BasicDropdownMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Open menu</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### With Groups and Separators

```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">Options</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuItem>Profile</DropdownMenuItem>
      <DropdownMenuItem>Billing</DropdownMenuItem>
      <DropdownMenuItem>Settings</DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Logout</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### With Checkboxes

```typescript
function CheckboxMenu() {
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [showPanel, setShowPanel] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">View</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Panels</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={showStatusBar}
          onCheckedChange={setShowStatusBar}
        >
          Status bar
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={showPanel}
          onCheckedChange={setShowPanel}
        >
          Activity bar
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## Examples

### Example 1: User Account Menu

```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" className="relative size-8 rounded-full">
      <Avatar>
        <AvatarImage src="/user.jpg" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel className="font-normal">
      <div className="flex flex-col space-y-1">
        <p className="text-sm font-medium">John Doe</p>
        <p className="text-xs text-muted-foreground">
          john@example.com
        </p>
      </div>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuItem>
        <User className="mr-2 size-4" />
        Profile
        <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <CreditCard className="mr-2 size-4" />
        Billing
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Settings className="mr-2 size-4" />
        Settings
        <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
      </DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      <LogOut className="mr-2 size-4" />
      Logout
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Example 2: Table Row Actions

```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="size-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem>
      <Eye className="mr-2 size-4" />
      View
    </DropdownMenuItem>
    <DropdownMenuItem>
      <Edit className="mr-2 size-4" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuItem>
      <Copy className="mr-2 size-4" />
      Duplicate
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">
      <Trash2 className="mr-2 size-4" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Example 3: Radio Group (Theme Selector)

```typescript
function ThemeMenu() {
  const [theme, setTheme] = useState("light");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Sun className="mr-2 size-4" />
          Theme
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <Sun className="mr-2 size-4" />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="mr-2 size-4" />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor className="mr-2 size-4" />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Example 4: With Submenus

```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">More</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>
      <Mail className="mr-2 size-4" />
      Email
    </DropdownMenuItem>
    <DropdownMenuItem>
      <MessageSquare className="mr-2 size-4" />
      Message
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Share2 className="mr-2 size-4" />
        Share
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem>
          <Twitter className="mr-2 size-4" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Facebook className="mr-2 size-4" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Linkedin className="mr-2 size-4" />
          LinkedIn
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Download className="mr-2 size-4" />
        Export
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem>PDF</DropdownMenuItem>
        <DropdownMenuItem>CSV</DropdownMenuItem>
        <DropdownMenuItem>JSON</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  </DropdownMenuContent>
</DropdownMenu>
```

### Example 5: Editor Toolbar Menu

```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="sm">
      <Type className="mr-2 size-4" />
      Format
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuGroup>
      <DropdownMenuItem>
        <Bold className="mr-2 size-4" />
        Bold
        <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Italic className="mr-2 size-4" />
        Italic
        <DropdownMenuShortcut>⌘I</DropdownMenuShortcut>
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Underline className="mr-2 size-4" />
        Underline
        <DropdownMenuShortcut>⌘U</DropdownMenuShortcut>
      </DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuItem>
        <AlignLeft className="mr-2 size-4" />
        Align left
      </DropdownMenuItem>
      <DropdownMenuItem>
        <AlignCenter className="mr-2 size-4" />
        Align center
      </DropdownMenuItem>
      <DropdownMenuItem>
        <AlignRight className="mr-2 size-4" />
        Align right
      </DropdownMenuItem>
    </DropdownMenuGroup>
  </DropdownMenuContent>
</DropdownMenu>
```

### Example 6: Filter Menu

```typescript
function FilterMenu() {
  const [filters, setFilters] = useState({
    active: true,
    pending: false,
    archived: false,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 size-4" />
          Filter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={filters.active}
          onCheckedChange={(checked) =>
            setFilters({ ...filters, active: checked })
          }
        >
          Active
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={filters.pending}
          onCheckedChange={(checked) =>
            setFilters({ ...filters, pending: checked })
          }
        >
          Pending
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={filters.archived}
          onCheckedChange={(checked) =>
            setFilters({ ...filters, archived: checked })
          }
        >
          Archived
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Example 7: Context Menu Style (Data Table)

```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreHorizontal className="size-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-48">
    <DropdownMenuLabel>Actions</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(row.id)}>
      <Copy className="mr-2 size-4" />
      Copy ID
    </DropdownMenuItem>
    <DropdownMenuItem>
      <ExternalLink className="mr-2 size-4" />
      View details
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      <Archive className="mr-2 size-4" />
      Archive
    </DropdownMenuItem>
    <DropdownMenuItem variant="destructive">
      <Trash2 className="mr-2 size-4" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### Example 8: Language Selector

```typescript
function LanguageMenu() {
  const [language, setLanguage] = useState("en");

  const languages = [
    { value: "en", label: "English", flag: "🇺🇸" },
    { value: "es", label: "Español", flag: "🇪🇸" },
    { value: "fr", label: "Français", flag: "🇫🇷" },
    { value: "de", label: "Deutsch", flag: "🇩🇪" },
    { value: "zh", label: "中文", flag: "🇨🇳" },
  ];

  const selected = languages.find((lang) => lang.value === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <Globe className="mr-2 size-4" />
          {selected?.flag} {selected?.label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={language} onValueChange={setLanguage}>
          {languages.map((lang) => (
            <DropdownMenuRadioItem key={lang.value} value={lang.value}>
              {lang.flag} {lang.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

**Related Components:**
- [Context Menu](./context-menu.md) - Right-click menus
- [Select](../inputs/select.md) - Form dropdown
- [Popover](../containers/popover.md) - Interactive popovers
- [Button](../actions/button.md) - Menu triggers

**Design Tokens:**
- [Colors](../../tokens/colors.md)
- [Spacing](../../tokens/spacing.md)
- [Typography](../../tokens/typography.md)
- [Effects](../../tokens/effects.md)
