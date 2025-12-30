# Tabs

**Version 1.0.0**

Tabs organize related content into separate views, allowing users to navigate between them without leaving the page. Only one tab's content is visible at a time.

---

## Table of Contents

- [Overview](#overview)
- [Anatomy](#anatomy)
- [Components](#components)
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
- **Related content**: Organize different views of related information
- **Reduce scroll**: Break long pages into logical sections
- **Settings panels**: Group related settings by category
- **Data views**: Switch between table, chart, and list views
- **Multi-step forms**: Show current step in a process

### When Not to Use
- **Sequential steps**: Use [Stepper](#) for linear workflows
- **Unrelated content**: Use separate pages instead
- **Small datasets**: No need to hide content behind tabs
- **Primary navigation**: Use main nav for top-level sections
- **2 tabs only**: Consider toggle or radio buttons

---

## Anatomy

```
┌────────────────────────────────────────────────┐
│  Tab 1  │ Tab 2 │ Tab 3  │  Tab 4              │ ← TabsList
├────────────────────────────────────────────────┤
│                                                │
│  Content for selected tab                     │ ← TabsContent
│                                                │
└────────────────────────────────────────────────┘
```

**Component Parts:**
1. **Tabs** - Root container
2. **TabsList** - Container for tab triggers
3. **TabsTrigger** - Individual tab button
4. **TabsContent** - Content panel for each tab

---

## Components

### Tabs (Root)

Root container that manages tab state.

```typescript
<Tabs defaultValue="tab1">
  {/* TabsList and TabsContent */}
</Tabs>
```

**Props:**
- `defaultValue`: Initial tab (uncontrolled)
- `value`: Current tab (controlled)
- `onValueChange`: Callback when tab changes
- Standard Radix Tabs props

**Design tokens:**
- Layout: `flex flex-col`
- Gap: `gap-2` (0.5rem)

### TabsList

Container for tab triggers, typically styled as a segmented control.

```typescript
<TabsList>
  <TabsTrigger value="tab1">Tab 1</TabsTrigger>
  <TabsTrigger value="tab2">Tab 2</TabsTrigger>
</TabsList>
```

**Design tokens:**
- Background: `bg-muted`
- Text: `text-muted-foreground`
- Height: `h-9` (36px)
- Width: `w-fit` (auto-width)
- Border radius: `rounded-xl`
- Padding: `p-[3px]`
- Layout: `inline-flex`

### TabsTrigger

Individual tab button.

```typescript
<TabsTrigger value="account">Account</TabsTrigger>
```

**Design tokens:**
- Active background: `data-[state=active]:bg-card`
- Active text: `data-[state=active]:text-foreground`
- Inactive text: `text-foreground` (light), `text-muted-foreground` (dark)
- Border radius: `rounded-xl`
- Padding: `px-2 py-1`
- Font: `text-sm font-medium`
- Height: `h-[calc(100%-1px)]`
- Transition: `transition-[color,box-shadow]`
- Focus ring: `focus-visible:ring-[3px] focus-visible:ring-ring/50`
- Disabled: `disabled:opacity-50 disabled:pointer-events-none`

### TabsContent

Content panel associated with each tab.

```typescript
<TabsContent value="account">
  <p>Account settings content</p>
</TabsContent>
```

**Design tokens:**
- Flex: `flex-1`
- Outline: `outline-none`

---

## Options

### Variants

#### Default Tabs
Standard horizontal tab list.

```typescript
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

#### Full Width Tabs
Tabs stretch to fill container.

```typescript
<TabsList className="w-full">
  <TabsTrigger value="tab1" className="flex-1">Tab 1</TabsTrigger>
  <TabsTrigger value="tab2" className="flex-1">Tab 2</TabsTrigger>
</TabsList>
```

#### With Icons
Tabs with icon + text.

```typescript
<TabsTrigger value="account">
  <User className="h-4 w-4" />
  Account
</TabsTrigger>
```

#### Icon Only
Tabs with only icons (requires aria-label).

```typescript
<TabsTrigger value="profile" aria-label="Profile">
  <User className="h-4 w-4" />
</TabsTrigger>
```

### States

#### Active
Currently selected tab.

```typescript
// Automatic via data-[state=active]
<TabsTrigger value="tab1">Tab 1</TabsTrigger>
```

**Design tokens:**
- Background: `bg-card`
- Text: `text-foreground`
- Border: `border-input` (dark mode)
- Visual prominence

#### Inactive
Not currently selected.

```typescript
<TabsTrigger value="tab2">Tab 2</TabsTrigger>
```

**Design tokens:**
- Background: transparent
- Text: `text-muted-foreground`
- Subdued appearance

#### Hover
Mouse over inactive tab.

```typescript
// Subtle hover effect via transitions
```

#### Focused
Keyboard focus indicator.

```typescript
// Automatic via focus-visible
<TabsTrigger value="tab1">Tab 1</TabsTrigger>
```

**Design tokens:**
- Ring: `focus-visible:ring-[3px] focus-visible:ring-ring/50`
- Border: `focus-visible:border-ring`
- Outline: `focus-visible:outline-1`

#### Disabled
Cannot be selected.

```typescript
<TabsTrigger value="tab3" disabled>
  Tab 3
</TabsTrigger>
```

**Design tokens:**
- Opacity: `opacity-50`
- Pointer events: `pointer-events-none`

---

## Behaviors

### Selection
- **Click tab**: Switches to that tab's content
- **Keyboard navigation**: Arrow keys move between tabs
- **Default tab**: Shows on first render
- **Smooth transition**: Content swaps instantly

### Focus Management
- Tabs are focusable as a group
- Arrow keys navigate within tab list
- Tab key moves to content

### Keyboard Navigation
- **Tab**: Focus tab list (or move to content)
- **Arrow Left/Right**: Navigate between tabs
- **Arrow Up/Down**: Navigate between tabs (vertical)
- **Home**: First tab
- **End**: Last tab
- **Space/Enter**: Activate focused tab

### Content Switching
- Previous content unmounts
- New content mounts
- No animation by default (can be added)
- Focus moves to new content

---

## Usage Guidelines

### ✅ Do's

**Use 2-6 tabs for best usability**
```typescript
✅
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
    <TabsTrigger value="reports">Reports</TabsTrigger>
    <TabsTrigger value="settings">Settings</TabsTrigger>
  </TabsList>
  {/* Content */}
</Tabs>
```

**Use clear, concise labels**
```typescript
✅
<TabsTrigger value="account">Account</TabsTrigger>
<TabsTrigger value="password">Password</TabsTrigger>
<TabsTrigger value="notifications">Notifications</TabsTrigger>
```

**Indicate active state clearly**
```typescript
✅
// Default styling provides clear active state
<TabsTrigger value="active">Active Tab</TabsTrigger>
```

**Group related content**
```typescript
✅
<Tabs defaultValue="personal">
  <TabsList>
    <TabsTrigger value="personal">Personal Info</TabsTrigger>
    <TabsTrigger value="security">Security</TabsTrigger>
    <TabsTrigger value="billing">Billing</TabsTrigger>
  </TabsList>
  {/* Related settings in each tab */}
</Tabs>
```

**Provide default selection**
```typescript
✅
<Tabs defaultValue="dashboard">
  {/* Always have one tab selected */}
</Tabs>
```

### ❌ Don'ts

**Don't use for sequential steps**
```typescript
❌
<Tabs defaultValue="step1">
  <TabsList>
    <TabsTrigger value="step1">Step 1</TabsTrigger>
    <TabsTrigger value="step2">Step 2</TabsTrigger>
    <TabsTrigger value="step3">Step 3</TabsTrigger>
  </TabsList>
</Tabs>

✅ Use Stepper component instead
<Stepper currentStep={1}>
  <Step>Step 1</Step>
  <Step>Step 2</Step>
  <Step>Step 3</Step>
</Stepper>
```

**Don't use vague labels**
```typescript
❌
<TabsTrigger value="tab1">Tab 1</TabsTrigger>
<TabsTrigger value="tab2">Tab 2</TabsTrigger>

✅ Be specific
<TabsTrigger value="profile">Profile</TabsTrigger>
<TabsTrigger value="settings">Settings</TabsTrigger>
```

**Don't nest tabs**
```typescript
❌
<Tabs defaultValue="outer1">
  <TabsList>
    <TabsTrigger value="outer1">Outer 1</TabsTrigger>
  </TabsList>
  <TabsContent value="outer1">
    <Tabs defaultValue="inner1">
      <TabsList>
        <TabsTrigger value="inner1">Inner 1</TabsTrigger>
      </TabsList>
    </Tabs>
  </TabsContent>
</Tabs>

✅ Flatten structure or use different navigation
```

**Don't hide critical actions in tabs**
```typescript
❌
<Tabs defaultValue="view">
  <TabsList>
    <TabsTrigger value="view">View</TabsTrigger>
    <TabsTrigger value="delete">Delete Account</TabsTrigger>
  </TabsList>
</Tabs>

✅ Keep important actions visible
<div>
  <Tabs>...</Tabs>
  <Button variant="destructive">Delete Account</Button>
</div>
```

**Don't overflow tabs**
```typescript
❌
<TabsList>
  {/* 12 tabs that wrap or overflow */}
  <TabsTrigger>Tab 1</TabsTrigger>
  {/* ... 10 more tabs ... */}
  <TabsTrigger>Tab 12</TabsTrigger>
</TabsList>

✅ Use dropdown or alternative navigation
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select category" />
  </SelectTrigger>
  <SelectContent>
    {/* 12 options */}
  </SelectContent>
</Select>
```

---

## Content Standards

### Tab Labels

**Structure:**
- Use title case or sentence case
- Keep short (1-2 words)
- Be specific and descriptive
- Avoid articles ("the", "a")

**Examples:**
```typescript
✅ Good:
- "Overview"
- "Activity"
- "Team Members"
- "Billing Details"

❌ Avoid:
- "The Overview Tab"
- "Click here for Activity"
- "Tab 1"
- "Miscellaneous"
```

### Icon Usage

**Guidelines:**
- Use icons to enhance recognition
- Always include text label (except icon-only with aria-label)
- Consistent icon style
- Appropriate size (typically 16px)

**Examples:**
```typescript
✅ Good:
<TabsTrigger value="user">
  <User className="h-4 w-4" />
  Profile
</TabsTrigger>

✅ Icon only with aria-label:
<TabsTrigger value="settings" aria-label="Settings">
  <Settings className="h-4 w-4" />
</TabsTrigger>

❌ Avoid:
<TabsTrigger value="user">
  <User className="h-4 w-4" />
  {/* Missing label */}
</TabsTrigger>
```

### Content Organization

**Structure:**
- Logical grouping
- Consistent content structure across tabs
- Most important tab first
- Related tabs adjacent

---

## Accessibility

### ARIA Attributes

**Automatic ARIA:**
Radix handles these automatically:
- `role="tablist"` on TabsList
- `role="tab"` on TabsTrigger
- `role="tabpanel"` on TabsContent
- `aria-selected` on TabsTrigger
- `aria-controls` linking trigger to content

**Custom labels:**
```typescript
<Tabs defaultValue="account" aria-label="Account settings">
  <TabsList>
    <TabsTrigger value="profile" aria-label="Profile settings">
      Profile
    </TabsTrigger>
  </TabsList>
</Tabs>
```

### Keyboard Support

| Key | Action |
|-----|--------|
| **Tab** | Move focus into/out of tab list |
| **Arrow Right** | Focus next tab (horizontal) |
| **Arrow Left** | Focus previous tab (horizontal) |
| **Arrow Down** | Focus next tab (vertical) |
| **Arrow Up** | Focus previous tab (vertical) |
| **Home** | Focus first tab |
| **End** | Focus last tab |
| **Space / Enter** | Activate focused tab |

### Screen Reader Behavior

- Announces: "Tab, [label], [x] of [y], [selected/not selected]"
- Tab count announced
- Selected state announced
- Content associated with tab announced

### Focus Management

```typescript
{/* Focus moves to tab content after selection */}
<TabsContent value="account" className="focus:outline-none">
  {/* Content can receive focus */}
</TabsContent>
```

### Touch Targets

- Minimum: 44×44px (WCAG AAA)
- Current height: 36px (meets WCAG AA)
- Label area extends touch target
- Adequate spacing between tabs

---

## Implementation

### Component Structure

**File:** `src/components/ui/tabs.tsx`

```typescript
"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "../../lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-xl p-[3px] flex",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-card dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
```

### Dependencies

```json
{
  "@radix-ui/react-tabs": "^1.0.4",
  "lucide-react": "^0.294.0"
}
```

### Design Tokens Used

**Colors:**
- List background: `bg-muted`
- List text: `text-muted-foreground`
- Active background: `bg-card`
- Active text: `text-foreground`
- Inactive text: `text-muted-foreground` (dark)
- Border (active, dark): `border-input`
- Focus ring: `ring-ring/50`

**Spacing:**
- Root gap: `gap-2` (0.5rem)
- List padding: `p-[3px]`
- Trigger padding: `px-2 py-1`
- Trigger gap: `gap-1.5`

**Sizing:**
- List height: `h-9` (36px)
- List width: `w-fit`
- Trigger height: `h-[calc(100%-1px)]`
- Trigger flex: `flex-1`

**Typography:**
- Font size: `text-sm`
- Font weight: `font-medium`
- White space: `whitespace-nowrap`

**Effects:**
- Border radius: `rounded-xl`
- Transition: `transition-[color,box-shadow]`
- Focus ring: `focus-visible:ring-[3px]`
- Disabled opacity: `opacity-50`

---

## Examples

### Basic Tabs

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function BasicTabs() {
  return (
    <Tabs defaultValue="account">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <p>Make changes to your account here.</p>
      </TabsContent>
      <TabsContent value="password">
        <p>Change your password here.</p>
      </TabsContent>
    </Tabs>
  );
}
```

### With Icons

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, Bell } from "lucide-react";

export function TabsWithIcons() {
  return (
    <Tabs defaultValue="profile">
      <TabsList>
        <TabsTrigger value="profile">
          <User className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="security">
          <Lock className="h-4 w-4" />
          Security
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <Bell className="h-4 w-4" />
          Notifications
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile">Profile content</TabsContent>
      <TabsContent value="security">Security content</TabsContent>
      <TabsContent value="notifications">Notifications content</TabsContent>
    </Tabs>
  );
}
```

### Full Width Tabs

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function FullWidthTabs() {
  return (
    <Tabs defaultValue="all">
      <TabsList className="w-full">
        <TabsTrigger value="all" className="flex-1">
          All
        </TabsTrigger>
        <TabsTrigger value="active" className="flex-1">
          Active
        </TabsTrigger>
        <TabsTrigger value="archived" className="flex-1">
          Archived
        </TabsTrigger>
      </TabsList>
      <TabsContent value="all">All items</TabsContent>
      <TabsContent value="active">Active items</TabsContent>
      <TabsContent value="archived">Archived items</TabsContent>
    </Tabs>
  );
}
```

### In a Card

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function TabsInCard() {
  return (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Make changes to your account here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" defaultValue="Pedro Duarte" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="username">Username</Label>
              <Input id="username" defaultValue="@peduarte" />
            </div>
            <Button>Save changes</Button>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="password">
        <Card>
          <CardHeader>
            <CardTitle>Password</CardTitle>
            <CardDescription>
              Change your password here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="current">Current password</Label>
              <Input id="current" type="password" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" />
            </div>
            <Button>Save password</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
```

### Controlled Tabs

```typescript
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ControlledTabs() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview content</TabsContent>
        <TabsContent value="analytics">Analytics content</TabsContent>
        <TabsContent value="reports">Reports content</TabsContent>
      </Tabs>
      <p className="text-sm text-muted-foreground">
        Current tab: <span className="font-medium">{activeTab}</span>
      </p>
    </div>
  );
}
```

### With Disabled Tab

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TabsWithDisabled() {
  return (
    <Tabs defaultValue="available">
      <TabsList>
        <TabsTrigger value="available">Available</TabsTrigger>
        <TabsTrigger value="premium" disabled>
          Premium
        </TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="available">Available features</TabsContent>
      <TabsContent value="premium">Premium features (disabled)</TabsContent>
      <TabsContent value="settings">Settings panel</TabsContent>
    </Tabs>
  );
}
```

### Data Views

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Table as TableIcon, List } from "lucide-react";

const data = [
  { name: "John", value: 100 },
  { name: "Jane", value: 200 },
];

export function DataViewTabs() {
  return (
    <Tabs defaultValue="table">
      <TabsList>
        <TabsTrigger value="table">
          <TableIcon className="h-4 w-4" />
          Table
        </TabsTrigger>
        <TabsTrigger value="chart">
          <BarChart className="h-4 w-4" />
          Chart
        </TabsTrigger>
        <TabsTrigger value="list">
          <List className="h-4 w-4" />
          List
        </TabsTrigger>
      </TabsList>
      <TabsContent value="table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.name}>
                <TableCell>{row.name}</TableCell>
                <TableCell>{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TabsContent>
      <TabsContent value="chart">Chart view (implement chart)</TabsContent>
      <TabsContent value="list">
        <ul>
          {data.map((item) => (
            <li key={item.name}>
              {item.name}: {item.value}
            </li>
          ))}
        </ul>
      </TabsContent>
    </Tabs>
  );
}
```

### Settings Panel

```typescript
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export function SettingsTabsDemo() {
  return (
    <Tabs defaultValue="general" className="w-full max-w-2xl">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="privacy">Privacy</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Display name</Label>
          <Input id="name" placeholder="Your name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" />
        </div>
        <Button>Save changes</Button>
      </TabsContent>
      <TabsContent value="privacy" className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="profile-public">Public profile</Label>
          <Switch id="profile-public" />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-email">Show email</Label>
          <Switch id="show-email" />
        </div>
        <Button>Save changes</Button>
      </TabsContent>
      <TabsContent value="notifications" className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="email-notif">Email notifications</Label>
          <Switch id="email-notif" defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="push-notif">Push notifications</Label>
          <Switch id="push-notif" />
        </div>
        <Button>Save changes</Button>
      </TabsContent>
    </Tabs>
  );
}
```

---

**Last Updated:** 2024-12-30
