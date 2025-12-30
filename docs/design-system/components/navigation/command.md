# Command

**Version 1.0.0**

A command palette for quick navigation and actions. Command provides keyboard-first search and command execution, powered by cmdk.

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
- **Power user features**: Keyboard shortcuts and quick actions
- **Global search**: Search across pages, commands, settings
- **Quick navigation**: Jump to any page/feature instantly
- **Command execution**: Run actions without clicking
- **Developer tools**: IDE-like command palette

### When Not to Use
- **Primary navigation**: Use navigation bar instead
- **Discovery**: Commands assume user knows what they want
- **Mobile-first**: Keyboard-focused, not touch-friendly
- **Simple apps**: Overkill for apps with few features

---

## Anatomy

```
┌─────────────────────────────────────────┐
│ 🔍 Search for commands...               │ ← CommandInput
├─────────────────────────────────────────┤
│ Pages                                   │ ← CommandGroup
│   📄 Dashboard                          │ ← CommandItem
│   📊 Analytics                          │
│   ⚙️  Settings                          │
│ ─────────────────────────────────       │ ← CommandSeparator
│ Actions                                 │
│   ➕ Create new project                 │
│   📥 Import data                        │
└─────────────────────────────────────────┘
       ↑
  CommandList (scrollable container)
```

**Component Parts:**
1. **Command** - Root container
2. **CommandInput** - Search input with icon
3. **CommandList** - Scrollable results container
4. **CommandEmpty** - No results state
5. **CommandGroup** - Grouped items with heading
6. **CommandItem** - Individual command/action
7. **CommandSeparator** - Visual divider
8. **CommandShortcut** - Keyboard shortcut display
9. **CommandDialog** - Command in modal dialog

---

## Components

### Command (Root)

The root container.

```typescript
<Command>
  <CommandInput placeholder="Type a command..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Commands">
      <CommandItem>Item 1</CommandItem>
    </CommandGroup>
  </CommandList>
</Command>
```

**Props:**
- Extends cmdk `Command` props
- Built on [cmdk](https://cmdk.paco.me/) library

### CommandDialog

Command palette in a modal dialog.

```typescript
<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Search..." />
  <CommandList>
    {/* items */}
  </CommandList>
</CommandDialog>
```

**Props:**
- `open: boolean` - Dialog open state
- `onOpenChange: (open: boolean) => void` - State handler
- `title?: string` - Dialog title (default: "Command Palette")
- `description?: string` - Dialog description

**Keyboard trigger:**
- Typically opened with `⌘K` (Mac) or `Ctrl+K` (Windows)

### CommandInput

Search input field.

```typescript
<CommandInput placeholder="Type a command or search..." />
```

**Features:**
- Automatic search icon
- Filters items as you type
- Fuzzy matching

### CommandItem

Individual command or action.

```typescript
<CommandItem onSelect={() => navigate("/dashboard")}>
  <LayoutDashboard className="mr-2 size-4" />
  <span>Dashboard</span>
  <CommandShortcut>⌘D</CommandShortcut>
</CommandItem>
```

**Props:**
- `onSelect?: (value: string) => void` - Selection handler
- `disabled?: boolean` - Disable item
- `value?: string` - Custom search value

### CommandGroup

Group related items with heading.

```typescript
<CommandGroup heading="Pages">
  <CommandItem>Dashboard</CommandItem>
  <CommandItem>Settings</CommandItem>
</CommandGroup>
```

### CommandEmpty

Message shown when no results match.

```typescript
<CommandEmpty>No results found.</CommandEmpty>
```

---

## Variants

### Inline Command
Embedded in page

### Dialog Command
Modal overlay (most common)

### With Icons
Icons for visual scanning

### With Shortcuts
Display keyboard shortcuts

---

## States

### Open
- Dialog visible
- Input focused
- Results shown

### Searching
- Filtered results
- Highlight matches

### Empty
- No results message

### Selected
- Highlighted item (keyboard navigation)

---

## Usage Guidelines

### ✅ Do's

- **Keyboard-first**: Open with ⌘K/Ctrl+K
  ```typescript
  ✅ useEffect(() => {
        const down = (e: KeyboardEvent) => {
          if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            setOpen(true);
          }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
      }, []);
  ```

- **Group logically**: Organize by category
  ```typescript
  ✅ Pages, Actions, Settings, Help
  ```

- **Show shortcuts**: Help discoverability
  ```typescript
  ✅ <CommandShortcut>⌘D</CommandShortcut>
  ```

- **Include descriptions**: Help users understand commands
  ```typescript
  ✅ Dashboard → View analytics and overview
  ```

### ❌ Don'ts

- **Don't make it primary navigation**: It's a power user feature
  ```typescript
  ❌ Only way to navigate is command palette
  ✅ Command palette + navigation bar
  ```

- **Don't overcrowd**: Keep items focused
  ```typescript
  ❌ 100+ ungrouped items
  ✅ 20-30 items, well organized
  ```

- **Don't hide critical features**: Discoverable UI first
  ```typescript
  ❌ Only way to create project is command palette
  ✅ Button + command shortcut
  ```

---

## Content Standards

### Command Labels
- Action verbs: "Create project", "Go to settings"
- Concise: 2-4 words
- Lowercase first word (unless proper noun)

### Search Terms
- Include synonyms and abbreviations
- Example: "Settings" also matches "config", "preferences"

### Shortcuts
- Platform-specific: ⌘ (Mac), Ctrl (Windows)
- Common conventions: K for command, / for search

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `⌘K` / `Ctrl+K` | Open command palette |
| `Esc` | Close palette |
| `↓` | Next item |
| `↑` | Previous item |
| `Enter` | Select item |
| Type | Filter results |

**ARIA (automatic):**
- `role="combobox"` on input
- `aria-expanded` on dialog
- `role="option"` on items

---

## Implementation

### Installation

```bash
npm install cmdk
npm install lucide-react
```

### Basic Implementation

```typescript
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function BasicCommand() {
  return (
    <Command>
      <CommandInput placeholder="Type a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem>Calendar</CommandItem>
          <CommandItem>Search Emoji</CommandItem>
          <CommandItem>Calculator</CommandItem>
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
```

---

## Examples

### Example 1: Command Dialog with Keyboard Trigger

```typescript
"use client";

import { useState, useEffect } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <p className="text-sm text-muted-foreground">
        Press{" "}
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </p>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>Calendar</CommandItem>
            <CommandItem>Search Emoji</CommandItem>
            <CommandItem>Calculator</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
```

### Example 2: Navigation Command

```typescript
"use client";

import { useRouter } from "next/navigation";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { LayoutDashboard, Settings, Users, FileText } from "lucide-react";

export function NavigationCommand({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const router = useRouter();

  const runCommand = (callback: () => void) => {
    setOpen(false);
    callback();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search pages..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Pages">
          <CommandItem onSelect={() => runCommand(() => router.push("/dashboard"))}>
            <LayoutDashboard className="mr-2 size-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/users"))}>
            <Users className="mr-2 size-4" />
            <span>Users</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/documents"))}>
            <FileText className="mr-2 size-4" />
            <span>Documents</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push("/settings"))}>
            <Settings className="mr-2 size-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

### Example 3: With Shortcuts

```typescript
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from "@/components/ui/command";

export function ShortcutCommand({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem>
            <span>Create new project</span>
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Open file</span>
            <CommandShortcut>⌘O</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Save</span>
            <CommandShortcut>⌘S</CommandShortcut>
          </CommandItem>
          <CommandItem>
            <span>Search</span>
            <CommandShortcut>⌘F</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

### Example 4: Multi-Group Command

```typescript
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";

export function MultiGroupCommand({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Pages">
          <CommandItem>Dashboard</CommandItem>
          <CommandItem>Analytics</CommandItem>
          <CommandItem>Reports</CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Actions">
          <CommandItem>Create project</CommandItem>
          <CommandItem>Import data</CommandItem>
          <CommandItem>Export report</CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Settings">
          <CommandItem>Profile</CommandItem>
          <CommandItem>Preferences</CommandItem>
          <CommandItem>Billing</CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

### Example 5: Search with Descriptions

```typescript
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

export function DescriptiveCommand({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search documentation..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Documentation">
          <CommandItem>
            <div className="flex flex-col">
              <span>Getting Started</span>
              <span className="text-xs text-muted-foreground">Quick start guide and installation</span>
            </div>
          </CommandItem>
          <CommandItem>
            <div className="flex flex-col">
              <span>Components</span>
              <span className="text-xs text-muted-foreground">Browse all available components</span>
            </div>
          </CommandItem>
          <CommandItem>
            <div className="flex flex-col">
              <span>API Reference</span>
              <span className="text-xs text-muted-foreground">Complete API documentation</span>
            </div>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

### Example 6: Action Command with Callbacks

```typescript
"use client";

import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";

export function ActionCommand({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const handleAction = (action: string, callback: () => void) => {
    setOpen(false);
    callback();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="What do you want to do?" />
      <CommandList>
        <CommandEmpty>No actions found.</CommandEmpty>
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => handleAction("create", () => toast.success("Creating new project..."))}>
            Create new project
          </CommandItem>
          <CommandItem onSelect={() => handleAction("import", () => toast.success("Importing data..."))}>
            Import data
          </CommandItem>
          <CommandItem onSelect={() => handleAction("export", () => toast.success("Exporting report..."))}>
            Export report
          </CommandItem>
          <CommandItem onSelect={() => handleAction("share", () => toast.success("Opening share dialog..."))}>
            Share project
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

### Example 7: Recent Items Command

```typescript
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Clock } from "lucide-react";

const recentItems = [
  { id: 1, name: "Project Alpha", type: "Project" },
  { id: 2, name: "Q4 Report", type: "Document" },
  { id: 3, name: "Team Meeting Notes", type: "Document" },
];

export function RecentCommand({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search recent items..." />
      <CommandList>
        <CommandEmpty>No recent items.</CommandEmpty>
        <CommandGroup heading="Recent">
          {recentItems.map((item) => (
            <CommandItem key={item.id}>
              <Clock className="mr-2 size-4" />
              <div className="flex flex-col">
                <span>{item.name}</span>
                <span className="text-xs text-muted-foreground">{item.type}</span>
              </div>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

### Example 8: Theme Switcher Command

```typescript
"use client";

import { useTheme } from "next-themes";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Moon, Sun, Monitor } from "lucide-react";

export function ThemeCommand({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const { setTheme } = useTheme();

  const handleTheme = (theme: string) => {
    setTheme(theme);
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Change theme..." />
      <CommandList>
        <CommandEmpty>No theme found.</CommandEmpty>
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => handleTheme("light")}>
            <Sun className="mr-2 size-4" />
            <span>Light</span>
          </CommandItem>
          <CommandItem onSelect={() => handleTheme("dark")}>
            <Moon className="mr-2 size-4" />
            <span>Dark</span>
          </CommandItem>
          <CommandItem onSelect={() => handleTheme("system")}>
            <Monitor className="mr-2 size-4" />
            <span>System</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
```

---

**Related Components:**
- [Dialog](../containers/dialog.md) - Modal container
- [Input](../inputs/input.md) - Search input field
- [Menubar](./menubar.md) - Desktop application menus

**Design Tokens:**
- [Colors](../../tokens/colors.md)
- [Typography](../../tokens/typography.md)
- [Spacing](../../tokens/spacing.md)

**External Links:**
- [cmdk Documentation](https://cmdk.paco.me/) - Underlying library
