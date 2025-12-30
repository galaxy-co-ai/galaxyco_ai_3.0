# Context Menu

**Version 1.0.0**

A right-click menu that displays contextual actions for an element or region. Context menus provide quick access to relevant operations without cluttering the interface.

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
- **Right-click actions**: Contextual operations for items
- **Table/grid actions**: Per-row or per-cell operations
- **Canvas/editor actions**: Context-specific commands
- **File/folder actions**: OS-style context menus
- **Text selection**: Copy, paste, format actions
- **Image actions**: Download, copy, edit operations

### When Not to Use
- **Primary actions**: Use buttons for main actions
- **Form inputs**: Use Select component
- **Mobile-first UI**: Touch devices don't have right-click
- **Always-visible actions**: Use visible buttons
- **Critical confirmations**: Use Alert Dialog

---

## Anatomy

```
┌──────────────────────────────┐
│  [Right-clickable Area]      │ ← ContextMenuTrigger
│                              │
│  (Right-click)               │
│         │                    │
│         ▼                    │
│  ┌────────────────────────┐ │
│  │ Menu Label             │ │ ← ContextMenuLabel
│  │ ─────────────────      │ │ ← ContextMenuSeparator
│  │ ✓ Checkbox Item        │ │ ← ContextMenuCheckboxItem
│  │ ○ Radio Item           │ │ ← ContextMenuRadioItem
│  │ ─────────────────      │ │
│  │ Action Item      ⌘K    │ │ ← ContextMenuItem with Shortcut
│  │ Destructive Action     │ │ ← ContextMenuItem (destructive)
│  │ Submenu Item        ▶  │ │ ← ContextMenuSubTrigger
│  └────────────────────────┘ │
│           ↑                  │
│    ContextMenuContent        │
└──────────────────────────────┘
```

**Component Parts:**
1. **ContextMenu** - Root container (manages state)
2. **ContextMenuTrigger** - Area that activates menu on right-click
3. **ContextMenuContent** - Menu container (portal)
4. **ContextMenuItem** - Clickable menu item
5. **ContextMenuCheckboxItem** - Checkbox menu item
6. **ContextMenuRadioGroup** - Radio button group
7. **ContextMenuRadioItem** - Radio menu item
8. **ContextMenuLabel** - Section heading
9. **ContextMenuSeparator** - Visual divider
10. **ContextMenuShortcut** - Keyboard shortcut display
11. **ContextMenuSub** - Submenu container
12. **ContextMenuSubTrigger** - Submenu trigger
13. **ContextMenuSubContent** - Submenu content
14. **ContextMenuGroup** - Group items together
15. **ContextMenuPortal** - Portal for rendering

---

## Components

### ContextMenu (Root)

The root container that manages menu state.

```typescript
<ContextMenu>
  <ContextMenuTrigger>
    {/* Right-clickable content */}
  </ContextMenuTrigger>
  <ContextMenuContent>
    {/* Menu items */}
  </ContextMenuContent>
</ContextMenu>
```

**Props:**
- `onOpenChange?: (open: boolean) => void` - Open state change handler
- `modal?: boolean` - Whether menu is modal (default: true)

### ContextMenuTrigger

The area that activates the menu on right-click.

```typescript
<ContextMenuTrigger>
  <div className="w-32 h-32 border rounded-md flex items-center justify-center">
    Right-click me
  </div>
</ContextMenuTrigger>
```

**Usage:**
- Wraps any content that should have a context menu
- Activates on right-click (desktop) or long-press (mobile)

### ContextMenuContent

The menu container with all items.

```typescript
<ContextMenuContent>
  {/* Menu items */}
</ContextMenuContent>
```

**Design tokens:**
- Background: `bg-popover`
- Text: `text-popover-foreground`
- Border: `border`
- Border radius: `rounded-md` (8px)
- Shadow: `shadow-md`
- Padding: `p-1` (0.25rem)
- Min width: `min-w-[8rem]`
- Z-index: `z-50`

### ContextMenuItem

A clickable menu item (same API as DropdownMenuItem).

```typescript
<ContextMenuItem onSelect={() => handleAction()}>
  <Copy className="mr-2 size-4" />
  Copy
  <ContextMenuShortcut>⌘C</ContextMenuShortcut>
</ContextMenuItem>

// Destructive variant
<ContextMenuItem variant="destructive">
  <Trash2 className="mr-2 size-4" />
  Delete
</ContextMenuItem>
```

**Props:**
- `variant?: "default" | "destructive"` - Visual variant
- `inset?: boolean` - Add left padding for alignment
- `disabled?: boolean` - Disable interaction
- `onSelect?: (event: Event) => void` - Selection handler

### ContextMenuCheckboxItem

A menu item with checkbox state.

```typescript
<ContextMenuCheckboxItem
  checked={isChecked}
  onCheckedChange={setIsChecked}
>
  Show grid
</ContextMenuCheckboxItem>
```

**Props:**
- `checked?: boolean` - Checked state
- `onCheckedChange?: (checked: boolean) => void` - Check handler

### ContextMenuRadioGroup & ContextMenuRadioItem

Radio button selection in menu.

```typescript
<ContextMenuRadioGroup value={value} onValueChange={setValue}>
  <ContextMenuRadioItem value="option1">
    Option 1
  </ContextMenuRadioItem>
  <ContextMenuRadioItem value="option2">
    Option 2
  </ContextMenuRadioItem>
</ContextMenuRadioGroup>
```

### Other Components

All other components (Label, Separator, Shortcut, Sub, SubTrigger, SubContent, Group, Portal) work identically to their DropdownMenu counterparts.

---

## Variants

Same variants as Dropdown Menu:
- Default items
- Destructive items
- Items with icons
- Items with shortcuts
- Checkbox items
- Radio items
- Submenus

---

## States

Same states as Dropdown Menu:
- Open/closed
- Disabled
- Checked (for checkbox/radio items)

---

## Usage Guidelines

### ✅ Do's

- **Use for secondary actions**: Not primary UI
  ```typescript
  ✅ Right-click file → Copy, Delete, Rename
  ❌ Right-click only way to delete (make button too)
  ```

- **Provide keyboard alternatives**: Don't rely only on right-click
  ```typescript
  ✅ Show keyboard shortcuts in context menu
  ✅ Provide button alternative for important actions
  ```

- **Match OS conventions**: Follow platform patterns
  ```typescript
  ✅ Copy, Paste, Cut at top (OS standard)
  ✅ Delete at bottom, separated
  ```

- **Use for dense interfaces**: Tables, grids, canvases
  ```typescript
  ✅ <ContextMenu>
        <ContextMenuTrigger>
          <TableRow>...</TableRow>
        </ContextMenuTrigger>
      </ContextMenu>
  ```

- **Show relevant actions only**: Context-specific
  ```typescript
  ✅ Image context menu: Download, Copy, Edit
  ✅ Text context menu: Copy, Select All, Search
  ❌ Every possible action in every context menu
  ```

### ❌ Don'ts

- **Don't hide critical actions**: Primary actions need visibility
  ```typescript
  ❌ Only way to save is right-click context menu
  ✅ Prominent Save button + context menu for other actions
  ```

- **Don't use on mobile-primary UI**: Touch doesn't have right-click
  ```typescript
  // Provide alternative on mobile
  const isMobile = useMediaQuery("(max-width: 768px)");
  {isMobile ? <DropdownMenu /> : <ContextMenu />}
  ```

- **Don't override browser context menu unnecessarily**: Users expect browser menu on text
  ```typescript
  ❌ Context menu on all text selections
  ✅ Context menu on specific elements (cards, rows, etc.)
  ```

- **Don't nest deeply**: Keep simple
  ```typescript
  ✅ Menu → Submenu
  ❌ Menu → Submenu → Sub-submenu
  ```

---

## Content Standards

Same content standards as Dropdown Menu:
- Action verbs: "Copy", "Delete", "Export"
- Sentence case
- 1-3 words per item
- Group related actions
- Keyboard shortcuts when available

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Right-click` | Open menu (mouse) |
| `Shift + F10` | Open menu (keyboard) |
| `↓` | Focus next item |
| `↑` | Focus previous item |
| `→` | Open submenu |
| `←` | Close submenu |
| `Home` | Focus first item |
| `End` | Focus last item |
| `Esc` | Close menu |
| `Enter` | Select item |
| `Space` | Toggle checkbox/radio |

**Important:**
- Provide keyboard shortcut to activate context menu (`Shift + F10`)
- Don't rely solely on right-click
- Support `onContextMenu` event properly

### Screen Reader Support

**ARIA attributes (automatic):**
- `role="menu"` on content
- `role="menuitem"` on items
- `role="menuitemcheckbox"` on checkbox items
- `role="menuitemradio"` on radio items
- `aria-haspopup="menu"` on trigger
- `aria-checked` on checkbox/radio items

### Mobile Considerations

**Touch support:**
- Long-press activates context menu
- Provide visible button alternative
- Consider using Dropdown Menu on mobile

```typescript
// Adaptive approach
const isMobile = useMediaQuery("(max-width: 768px)");

{isMobile ? (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="icon">
        <MoreVertical className="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      {/* Same items */}
    </DropdownMenuContent>
  </DropdownMenu>
) : (
  <ContextMenu>
    <ContextMenuTrigger>{/* Content */}</ContextMenuTrigger>
    <ContextMenuContent>
      {/* Items */}
    </ContextMenuContent>
  </ContextMenu>
)}
```

---

## Implementation

### Installation

```bash
npm install @radix-ui/react-context-menu
npm install lucide-react
```

### Basic Implementation

```typescript
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

export function BasicContextMenu() {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="w-64 h-32 border rounded-md flex items-center justify-center">
          Right-click here
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Copy</ContextMenuItem>
        <ContextMenuItem>Paste</ContextMenuItem>
        <ContextMenuItem>Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
```

### With Icons and Shortcuts

```typescript
<ContextMenu>
  <ContextMenuTrigger>
    <Card>
      {/* Card content */}
    </Card>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>
      <Copy className="mr-2 size-4" />
      Copy
      <ContextMenuShortcut>⌘C</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>
      <Edit className="mr-2 size-4" />
      Edit
      <ContextMenuShortcut>⌘E</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">
      <Trash2 className="mr-2 size-4" />
      Delete
      <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

---

## Examples

### Example 1: File Context Menu

```typescript
<ContextMenu>
  <ContextMenuTrigger>
    <div className="flex items-center gap-2 p-2 rounded hover:bg-accent">
      <FileIcon className="size-4" />
      <span>document.pdf</span>
    </div>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>
      <Eye className="mr-2 size-4" />
      Open
    </ContextMenuItem>
    <ContextMenuItem>
      <Download className="mr-2 size-4" />
      Download
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem>
      <Copy className="mr-2 size-4" />
      Copy
      <ContextMenuShortcut>⌘C</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>
      <Edit className="mr-2 size-4" />
      Rename
      <ContextMenuShortcut>F2</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuSub>
      <ContextMenuSubTrigger>
        <Share2 className="mr-2 size-4" />
        Share
      </ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Email</ContextMenuItem>
        <ContextMenuItem>Copy link</ContextMenuItem>
        <ContextMenuItem>Get share link</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">
      <Trash2 className="mr-2 size-4" />
      Delete
      <ContextMenuShortcut>⌘⌫</ContextMenuShortcut>
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

### Example 2: Table Row Context Menu

```typescript
<ContextMenu>
  <ContextMenuTrigger asChild>
    <TableRow className="cursor-context-menu">
      <TableCell>John Doe</TableCell>
      <TableCell>john@example.com</TableCell>
      <TableCell>Admin</TableCell>
    </TableRow>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuLabel>Actions</ContextMenuLabel>
    <ContextMenuSeparator />
    <ContextMenuItem>
      <Eye className="mr-2 size-4" />
      View profile
    </ContextMenuItem>
    <ContextMenuItem>
      <Mail className="mr-2 size-4" />
      Send email
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem>
      <Edit className="mr-2 size-4" />
      Edit user
    </ContextMenuItem>
    <ContextMenuItem>
      <Copy className="mr-2 size-4" />
      Copy email
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem variant="destructive">
      <Trash2 className="mr-2 size-4" />
      Remove user
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

### Example 3: Image Context Menu

```typescript
<ContextMenu>
  <ContextMenuTrigger>
    <img
      src="/image.jpg"
      alt="Image"
      className="w-64 h-64 object-cover rounded-md"
    />
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>
      <Eye className="mr-2 size-4" />
      View full size
    </ContextMenuItem>
    <ContextMenuItem>
      <Download className="mr-2 size-4" />
      Download
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem>
      <Copy className="mr-2 size-4" />
      Copy image
    </ContextMenuItem>
    <ContextMenuItem>
      <Link className="mr-2 size-4" />
      Copy image URL
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem>
      <Crop className="mr-2 size-4" />
      Edit image
    </ContextMenuItem>
    <ContextMenuItem variant="destructive">
      <Trash2 className="mr-2 size-4" />
      Delete image
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

### Example 4: Canvas/Editor Context Menu

```typescript
<ContextMenu>
  <ContextMenuTrigger>
    <div className="w-full h-[400px] border rounded-md bg-muted/10">
      {/* Canvas content */}
    </div>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>
      <Undo className="mr-2 size-4" />
      Undo
      <ContextMenuShortcut>⌘Z</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>
      <Redo className="mr-2 size-4" />
      Redo
      <ContextMenuShortcut>⇧⌘Z</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem>
      <Copy className="mr-2 size-4" />
      Copy
      <ContextMenuShortcut>⌘C</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>
      <Scissors className="mr-2 size-4" />
      Cut
      <ContextMenuShortcut>⌘X</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>
      <Clipboard className="mr-2 size-4" />
      Paste
      <ContextMenuShortcut>⌘V</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuSub>
      <ContextMenuSubTrigger>
        <Layers className="mr-2 size-4" />
        Arrange
      </ContextMenuSubTrigger>
      <ContextMenuSubContent>
        <ContextMenuItem>Bring to front</ContextMenuItem>
        <ContextMenuItem>Send to back</ContextMenuItem>
        <ContextMenuItem>Bring forward</ContextMenuItem>
        <ContextMenuItem>Send backward</ContextMenuItem>
      </ContextMenuSubContent>
    </ContextMenuSub>
  </ContextMenuContent>
</ContextMenu>
```

### Example 5: With Checkboxes (View Options)

```typescript
function ViewOptionsContextMenu() {
  const [showGrid, setShowGrid] = useState(true);
  const [showRulers, setShowRulers] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div className="w-full h-96 border rounded-md">
          {/* Content */}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel>View options</ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuCheckboxItem
          checked={showGrid}
          onCheckedChange={setShowGrid}
        >
          Show grid
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem
          checked={showRulers}
          onCheckedChange={setShowRulers}
        >
          Show rulers
        </ContextMenuCheckboxItem>
        <ContextMenuCheckboxItem
          checked={snapToGrid}
          onCheckedChange={setSnapToGrid}
        >
          Snap to grid
        </ContextMenuCheckboxItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
```

### Example 6: Text Selection Context Menu

```typescript
<ContextMenu>
  <ContextMenuTrigger>
    <div className="p-4 border rounded-md select-text">
      <p>
        This is some text that can be selected. Right-click for
        context menu with text-specific actions.
      </p>
    </div>
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>
      <Copy className="mr-2 size-4" />
      Copy
      <ContextMenuShortcut>⌘C</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>
      <Scissors className="mr-2 size-4" />
      Cut
      <ContextMenuShortcut>⌘X</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem>
      <Clipboard className="mr-2 size-4" />
      Paste
      <ContextMenuShortcut>⌘V</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem>
      <Type className="mr-2 size-4" />
      Select all
      <ContextMenuShortcut>⌘A</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuSeparator />
    <ContextMenuItem>
      <Search className="mr-2 size-4" />
      Search Google
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>
```

### Example 7: Card Grid Context Menu

```typescript
{projects.map((project) => (
  <ContextMenu key={project.id}>
    <ContextMenuTrigger>
      <Card className="cursor-context-menu">
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
          <CardDescription>{project.description}</CardDescription>
        </CardHeader>
      </Card>
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuItem onClick={() => openProject(project.id)}>
        <FolderOpen className="mr-2 size-4" />
        Open
      </ContextMenuItem>
      <ContextMenuItem>
        <Eye className="mr-2 size-4" />
        View details
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem>
        <Edit className="mr-2 size-4" />
        Edit
      </ContextMenuItem>
      <ContextMenuItem>
        <Copy className="mr-2 size-4" />
        Duplicate
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem>
        <Archive className="mr-2 size-4" />
        Archive
      </ContextMenuItem>
      <ContextMenuItem variant="destructive">
        <Trash2 className="mr-2 size-4" />
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
))}
```

### Example 8: Adaptive Mobile/Desktop

```typescript
function AdaptiveActionMenu({ children }: { children: React.ReactNode }) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    return (
      <div className="relative">
        {children}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2"
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>Edit</ContextMenuItem>
        <ContextMenuItem variant="destructive">
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
```

---

**Related Components:**
- [Dropdown Menu](./dropdown-menu.md) - Click-triggered menus
- [Popover](../containers/popover.md) - Interactive popovers
- [Button](../actions/button.md) - Alternative to context menu
- [Alert Dialog](../feedback/alert-dialog.md) - Confirmations

**Design Tokens:**
- [Colors](../../tokens/colors.md)
- [Spacing](../../tokens/spacing.md)
- [Typography](../../tokens/typography.md)
- [Effects](../../tokens/effects.md)
