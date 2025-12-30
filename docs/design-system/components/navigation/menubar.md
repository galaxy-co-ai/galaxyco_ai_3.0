# Menubar

**Version 1.0.0**

A horizontal menu bar with dropdown menus, similar to desktop application menus. Menubar provides organized access to application commands and settings.

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
- **Desktop applications**: Traditional File/Edit/View menus
- **Complex tools**: Professional software with many commands
- **Editor interfaces**: Text/image/video editors
- **Dashboard navigation**: Admin/settings interfaces
- **Grouped actions**: Organized by category

### When Not to Use
- **Mobile-first**: Horizontal menubar doesn't fit mobile
- **Simple apps**: Few commands don't need menubar
- **Content websites**: Use navigation bar instead
- **Single-level navigation**: Use Tabs instead

---

## Anatomy

```
┌─────────────────────────────────────────────────┐
│ File  Edit  View  Help                          │ ← Menubar (root)
│   │     │
│   └─ MenubarTrigger
│
│ (Click "File")
│   ↓
│ ┌──────────────────┐
│ │ New        ⌘N    │ ← MenubarItem + MenubarShortcut
│ │ Open...    ⌘O    │
│ │ ─────────────    │ ← MenubarSeparator
│ │ Save       ⌘S    │
│ │ ✓ Auto Save      │ ← MenubarCheckboxItem
│ │ ─────────────    │
│ │ Exit       ⌘Q    │
│ └──────────────────┘
│        ↑
│   MenubarContent
└─────────────────────────────────────────────────┘
```

**Component Parts (15 subcomponents):**
1. **Menubar** - Root horizontal container
2. **MenubarMenu** - Individual menu (File, Edit, etc.)
3. **MenubarTrigger** - Menu label button
4. **MenubarContent** - Dropdown content
5. **MenubarItem** - Menu action item
6. **MenubarCheckboxItem** - Togglable item
7. **MenubarRadioGroup** - Radio button group
8. **MenubarRadioItem** - Radio item
9. **MenubarLabel** - Section heading
10. **MenubarSeparator** - Visual divider
11. **MenubarShortcut** - Keyboard shortcut display
12. **MenubarSub** - Submenu container
13. **MenubarSubTrigger** - Submenu trigger
14. **MenubarSubContent** - Submenu content
15. **MenubarGroup** + MenubarPortal - Grouping and portal

---

## Components

### Menubar (Root)

The horizontal container for all menus.

```typescript
<Menubar>
  <MenubarMenu>
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>{/* items */}</MenubarContent>
  </MenubarMenu>
</Menubar>
```

**Design tokens:**
- Background: `bg-background`
- Height: `h-9` (36px)
- Border: `border rounded-md`
- Shadow: `shadow-xs`
- Padding: `p-1`
- Gap: `gap-1` between menus

### MenubarTrigger

Menu label that opens dropdown.

```typescript
<MenubarTrigger>File</MenubarTrigger>
```

**Design tokens:**
- Padding: `px-2 py-1`
- Font: `text-sm font-medium`
- Border radius: `rounded-sm`
- Hover: `focus:bg-accent`
- Open state: `data-[state=open]:bg-accent`

### MenubarItem

Individual menu action.

```typescript
<MenubarItem onSelect={() => handleNew()}>
  <File className="mr-2 size-4" />
  New
  <MenubarShortcut>⌘N</MenubarShortcut>
</MenubarItem>

// Destructive variant
<MenubarItem variant="destructive">
  <Trash2 className="mr-2 size-4" />
  Delete
</MenubarItem>
```

**Props:**
- `variant?: "default" | "destructive"`
- `inset?: boolean` - Add left padding for alignment
- `disabled?: boolean`
- `onSelect?: (event: Event) => void`

All other subcomponents (Checkbox, Radio, Separator, Shortcut, Sub, etc.) work identically to Dropdown Menu.

---

## Variants

### Standard Menubar
File/Edit/View style desktop menus

### With Icons
Icons next to menu items

### With Shortcuts
Keyboard shortcuts displayed

### With Checkboxes/Radio
Toggle and selection items

---

## States

- Open/Closed per menu
- Hover on triggers
- Focus states
- Disabled items

---

## Usage Guidelines

### ✅ Do's

- **Group logically**: File/Edit/View/Help pattern
  ```typescript
  ✅ File, Edit, View, Insert, Format, Help
  ```

- **Show keyboard shortcuts**: Help discoverability
  ```typescript
  ✅ <MenubarShortcut>⌘N</MenubarShortcut>
  ```

- **Use separators**: Group related items
  ```typescript
  ✅ New, Open, Recent
      ─────────────
      Save, Save As
      ─────────────
      Print, Export
  ```

- **Desktop-first**: Best for desktop applications
  ```typescript
  ✅ Complex editors, dashboards, tools
  ```

### ❌ Don'ts

- **Don't use on mobile**: Doesn't fit mobile screens
  ```typescript
  ❌ Menubar on 375px screen
  ✅ Mobile navigation or hamburger menu
  ```

- **Don't hide critical actions**: Menubar is secondary
  ```typescript
  ❌ Only way to save is via menubar
  ✅ Save button + menubar shortcut
  ```

- **Don't overload menus**: Keep focused
  ```typescript
  ❌ 30 items in File menu
  ✅ 5-10 items per menu
  ```

---

## Content Standards

### Menu Labels
- Single words: "File", "Edit", "View"
- Sentence case
- Clear categories

### Items
- Action verbs: "New", "Save", "Export"
- 1-2 words
- Consistent with desktop conventions

### Shortcuts
- Platform-specific: ⌘ (Mac), Ctrl (Windows)
- Standard conventions: ⌘N for New, ⌘S for Save

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Focus menubar |
| `→` | Next menu |
| `←` | Previous menu |
| `↓` | Open menu / next item |
| `↑` | Previous item |
| `Enter` | Select item |
| `Esc` | Close menu |

**ARIA (automatic):**
- `role="menubar"` on root
- `role="menu"` on content
- `role="menuitem"` on items
- `aria-expanded` on triggers

---

## Implementation

### Installation

```bash
npm install @radix-ui/react-menubar
npm install lucide-react
```

### Basic Implementation

```typescript
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";

export function BasicMenubar() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>New</MenubarItem>
          <MenubarItem>Open</MenubarItem>
          <MenubarItem>Save</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
```

---

## Examples

### Example 1: Text Editor Menubar

```typescript
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "@/components/ui/menubar";

export function EditorMenubar() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>New<MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
          <MenubarItem>Open<MenubarShortcut>⌘O</MenubarShortcut></MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Save<MenubarShortcut>⌘S</MenubarShortcut></MenubarItem>
          <MenubarItem>Save As<MenubarShortcut>⇧⌘S</MenubarShortcut></MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Export</MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>Edit</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>Undo<MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
          <MenubarItem>Redo<MenubarShortcut>⇧⌘Z</MenubarShortcut></MenubarItem>
          <MenubarSeparator />
          <MenubarItem>Cut<MenubarShortcut>⌘X</MenubarShortcut></MenubarItem>
          <MenubarItem>Copy<MenubarShortcut>⌘C</MenubarShortcut></MenubarItem>
          <MenubarItem>Paste<MenubarShortcut>⌘V</MenubarShortcut></MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarCheckboxItem>Show Toolbar</MenubarCheckboxItem>
          <MenubarCheckboxItem checked>Show Sidebar</MenubarCheckboxItem>
          <MenubarSeparator />
          <MenubarItem>Zoom In<MenubarShortcut>⌘+</MenubarShortcut></MenubarItem>
          <MenubarItem>Zoom Out<MenubarShortcut>⌘-</MenubarShortcut></MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
```

### Example 2: With Icons

```typescript
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import { FileText, FolderOpen, Save, Download } from "lucide-react";

export function IconMenubar() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>
            <FileText className="mr-2 size-4" />
            New
          </MenubarItem>
          <MenubarItem>
            <FolderOpen className="mr-2 size-4" />
            Open
          </MenubarItem>
          <MenubarItem>
            <Save className="mr-2 size-4" />
            Save
          </MenubarItem>
          <MenubarItem>
            <Download className="mr-2 size-4" />
            Export
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
```

### Example 3: With Submenus

```typescript
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger } from "@/components/ui/menubar";

export function SubmenuMenubar() {
  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>File</MenubarTrigger>
        <MenubarContent>
          <MenubarItem>New</MenubarItem>
          <MenubarSub>
            <MenubarSubTrigger>Open Recent</MenubarSubTrigger>
            <MenubarSubContent>
              <MenubarItem>document1.txt</MenubarItem>
              <MenubarItem>document2.txt</MenubarItem>
              <MenubarItem>document3.txt</MenubarItem>
            </MenubarSubContent>
          </MenubarSub>
          <MenubarItem>Save</MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
```

### Example 4: Radio Group

```typescript
import { Menubar, MenubarContent, MenubarMenu, MenubarRadioGroup, MenubarRadioItem, MenubarTrigger } from "@/components/ui/menubar";
import { useState } from "react";

export function RadioMenubar() {
  const [theme, setTheme] = useState("light");

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>View</MenubarTrigger>
        <MenubarContent>
          <MenubarRadioGroup value={theme} onValueChange={setTheme}>
            <MenubarRadioItem value="light">Light Theme</MenubarRadioItem>
            <MenubarRadioItem value="dark">Dark Theme</MenubarRadioItem>
            <MenubarRadioItem value="system">System</MenubarRadioItem>
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}
```

---

**Related Components:**
- [Dropdown Menu](./dropdown-menu.md) - Single dropdown menu
- [Context Menu](./context-menu.md) - Right-click menus
- [Tabs](./tabs.md) - Horizontal navigation

**Design Tokens:**
- [Colors](../../tokens/colors.md)
- [Typography](../../tokens/typography.md)
- [Spacing](../../tokens/spacing.md)
