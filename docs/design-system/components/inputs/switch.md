# Switch

**Version 1.0.0**

Switches are toggle controls that allow users to instantly change between two states (on/off). They provide immediate feedback and are used for settings that take effect immediately.

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
- **Immediate effect**: Changes apply instantly without needing to save
- **Binary states**: On/off, enabled/disabled, true/false
- **System settings**: WiFi, Bluetooth, notifications
- **Feature toggles**: Dark mode, auto-play, sound effects
- **User preferences**: Save login, remember me, show email

### When Not to Use
- **Requires confirmation**: Use [Checkbox](#) with submit button
- **Multiple selections**: Use [Checkbox](#) group
- **Single choice from many**: Use [Radio Group](#) instead
- **Large data operations**: Confirm with a dialog first
- **Non-reversible actions**: Use button with confirmation

---

## Anatomy

```
OFF State:
┌──────────────────────┐
│  ○                   │  ← Track (gray)
└──────────────────────┘    ○ = Thumb (left position)

ON State:
┌──────────────────────┐
│                   ● │  ← Track (primary color)
└──────────────────────┘    ● = Thumb (right position)

With Label:
┌────────────────────────────────────┐
│  Enable notifications  │ OFF │     │
└────────────────────────────────────┘
```

**Component Parts:**
1. **Track** - Background rail (44px × 18px)
2. **Thumb** - Circular indicator (14px × 14px)
3. **Label** (recommended) - Descriptive text
4. **Helper text** (optional) - Additional context

---

## Options

### States

#### Off (Default)
Switch is disabled, gray background, thumb on left.

```typescript
<Switch />
// or
<Switch checked={false} />
```

**Design tokens:**
- Track background: `bg-gray-300` (off state)
- Thumb: `bg-white`
- Thumb position: 2px from left
- Size: 44px × 18px track, 14px × 14px thumb

#### On
Switch is enabled, primary color, thumb on right.

```typescript
<Switch checked={true} />
```

**Design tokens:**
- Track background: `bg-indigo-600` (on state, should use `var(--primary)`)
- Thumb: `bg-white`
- Thumb position: 28px from left
- Shadow: `shadow-sm` on thumb

#### Hover
Subtle visual feedback (optional enhancement).

```typescript
// Automatic via CSS
```

**Design tokens:**
- Can add subtle brightness change to track
- Cursor: `cursor-pointer`

#### Focused
Keyboard focus indicator.

```typescript
// Automatic via CSS
<Switch /> // When focused
```

**Design tokens:**
- Ring: `focus-visible:ring-2 focus-visible:ring-indigo-500` (should use `var(--ring)`)
- Ring offset: `focus-visible:ring-offset-2`

#### Disabled
Cannot interact, reduced opacity.

```typescript
<Switch disabled />
<Switch checked disabled />
```

**Design tokens:**
- Opacity: `opacity-50` (50%)
- Cursor: `cursor-not-allowed`

### Sizes

Switch has a fixed size for consistency:
- **Track**: 44px × 18px (width × height)
- **Thumb**: 14px × 14px
- **Touch target**: 44px × 44px minimum (achieved through padding)

---

## Behaviors

### Toggling
- **Click track**: Toggles state
- **Click thumb**: Toggles state
- **Space key**: Toggles state (when focused)
- **Enter key**: Toggles state (when focused)

### State Change
- **Immediate effect**: Change applies as soon as toggled
- **Visual feedback**: Thumb animates smoothly (200ms)
- **No confirmation**: Assumes action is reversible

### Focus
- Shows focus ring: `focus-visible:ring-2 focus-visible:ring-ring`
- Clear visual indicator
- Smooth transition

### Keyboard Navigation
- **Tab**: Focus next switch
- **Shift + Tab**: Focus previous switch
- **Space / Enter**: Toggle switch state

### Animation
- Thumb transition: 200ms ease-in-out
- Background color transition: 200ms ease-in-out
- Transform: `translateX()` for thumb position

---

## Usage Guidelines

### ✅ Do's

**Always include labels**
```typescript
✅
<div className="flex items-center space-x-2">
  <Switch id="airplane-mode" />
  <Label htmlFor="airplane-mode">Airplane mode</Label>
</div>
```

**Use for immediate effects**
```typescript
✅
<div className="flex items-center justify-between">
  <div>
    <Label htmlFor="dark-mode">Dark mode</Label>
    <p className="text-sm text-muted-foreground">
      Changes theme immediately
    </p>
  </div>
  <Switch id="dark-mode" />
</div>
```

**Group related switches vertically**
```typescript
✅
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <Label htmlFor="wifi">WiFi</Label>
    <Switch id="wifi" />
  </div>
  <div className="flex items-center justify-between">
    <Label htmlFor="bluetooth">Bluetooth</Label>
    <Switch id="bluetooth" />
  </div>
  <div className="flex items-center justify-between">
    <Label htmlFor="location">Location</Label>
    <Switch id="location" />
  </div>
</div>
```

**Use clear, action-oriented labels**
```typescript
✅
<Switch id="notifications" />
<Label htmlFor="notifications">Send notifications</Label>

<Switch id="sound" />
<Label htmlFor="sound">Enable sound effects</Label>
```

**Provide helper text for complex settings**
```typescript
✅
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <Label htmlFor="auto-save">Auto-save</Label>
    <Switch id="auto-save" />
  </div>
  <p className="text-sm text-muted-foreground">
    Automatically save your work every 5 minutes.
  </p>
</div>
```

### ❌ Don'ts

**Don't use for actions requiring confirmation**
```typescript
❌
<Switch id="delete-account" />
<Label htmlFor="delete-account">Delete my account</Label>

✅ Use a button with confirmation instead
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete Account</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**Don't use without labels**
```typescript
❌
<Switch id="mystery-setting" />

✅ Always label
<div className="flex items-center space-x-2">
  <Switch id="notifications" />
  <Label htmlFor="notifications">Notifications</Label>
</div>
```

**Don't use for forms requiring submit**
```typescript
❌
<form>
  <Switch id="subscribe" />
  <Label htmlFor="subscribe">Subscribe to newsletter</Label>
  <Button type="submit">Save</Button>
</form>

✅ Use Checkbox instead
<form>
  <div className="flex items-center space-x-2">
    <Checkbox id="subscribe" />
    <Label htmlFor="subscribe">Subscribe to newsletter</Label>
  </div>
  <Button type="submit">Save Preferences</Button>
</form>
```

**Don't use vague labels**
```typescript
❌
<Switch id="setting1" />
<Label htmlFor="setting1">Setting 1</Label>

✅ Be specific
<Switch id="email-notifications" />
<Label htmlFor="email-notifications">Email notifications</Label>
```

**Don't disable without explanation**
```typescript
❌
<Switch id="premium-feature" disabled />
<Label htmlFor="premium-feature">Premium feature</Label>

✅ Explain why it's disabled
<div className="space-y-2">
  <div className="flex items-center justify-between opacity-50">
    <Label htmlFor="premium-feature">Premium feature</Label>
    <Switch id="premium-feature" disabled />
  </div>
  <p className="text-sm text-muted-foreground">
    Upgrade to Pro to enable this feature.
  </p>
</div>
```

---

## Content Standards

### Labels

**Structure:**
- Start with capital letter or verb
- Use sentence case
- Keep concise (2-5 words)
- Be specific and clear

**Examples:**
```typescript
✅ Good:
- "Dark mode"
- "Enable notifications"
- "Auto-save drafts"
- "Show read receipts"

❌ Avoid:
- "dark mode" (not capitalized)
- "This enables dark mode" (too verbose)
- "Toggle" (not specific)
- "On/Off" (redundant with switch visual)
```

### Helper Text

**Structure:**
- Use sentence case
- End with period
- Explain the impact or behavior
- Keep under 15 words

**Examples:**
```typescript
✅ Good:
"Automatically save your changes every 5 minutes."
"Receive notifications for mentions and replies."
"Uses less battery but reduces location accuracy."

❌ Avoid:
"Dark mode" (duplicates label)
"This setting allows you to enable or disable the dark mode feature which changes the color scheme." (too long)
```

### State Clarity

**Structure:**
- Label should be clear without "on/off"
- Don't include state in label
- Visual switch state is self-explanatory

**Examples:**
```typescript
✅ Good:
"Notifications" (state shown by switch)
"Auto-play videos"

❌ Avoid:
"Notifications: On"
"Enable/Disable notifications"
```

---

## Accessibility

### ARIA Attributes

**Required:**
```typescript
<Switch
  role="switch"
  aria-checked={isChecked}
  aria-label="Notifications" // If no visible label
  tabIndex={0}
/>
```

**With Label:**
```typescript
<Switch
  id="notifications"
  aria-labelledby="notifications-label"
/>
<Label id="notifications-label" htmlFor="notifications">
  Notifications
</Label>
```

**With Helper Text:**
```typescript
<Switch
  id="auto-save"
  aria-describedby="auto-save-description"
/>
<Label htmlFor="auto-save">Auto-save</Label>
<p id="auto-save-description" className="text-sm text-muted-foreground">
  Automatically save your work every 5 minutes.
</p>
```

### Keyboard Support

| Key | Action |
|-----|--------|
| **Tab** | Move focus to/from switch |
| **Space** | Toggle switch state |
| **Enter** | Toggle switch state |

### Screen Reader Behavior

- Announces: "Switch, [label], [on/off]"
- State change announced immediately
- Disabled state announced
- Helper text read with label

### Focus Indicators

```typescript
// Default focus styles
focus-visible:ring-2 focus-visible:ring-ring
focus-visible:ring-offset-2

// High contrast mode
@media (prefers-contrast: high) {
  // Enhanced border visibility
}
```

### Touch Targets

- Track: 44×18px (width meets minimum)
- Touch area: Should extend to 44×44px through padding
- Thumb: 14×14px (visual size)
- Label extends touch target

---

## Implementation

### Component Structure

**File:** `src/components/ui/switch.tsx`

```typescript
"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: SwitchProps) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;

  const handleToggle = () => {
    if (disabled) return;
    
    if (!isControlled) {
      setInternalChecked(!internalChecked);
    }
    onCheckedChange?.(!isChecked);
  };

  // Using a div with role="switch" to avoid global button styles
  // that enforce min-height: 44px and min-width: 44px
  return (
    <div
      role="switch"
      aria-checked={isChecked}
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : 0}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleToggle();
        }
      }}
      className={cn(
        "relative inline-flex cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        isChecked ? "bg-indigo-600" : "bg-gray-300",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      style={{
        height: '18px',
        width: '44px',
        flexShrink: 0,
      }}
    >
      <span
        className="pointer-events-none inline-block rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out absolute top-1/2"
        style={{
          height: '14px',
          width: '14px',
          transform: `translateY(-50%) translateX(${isChecked ? '28px' : '2px'})`,
        }}
      />
    </div>
  );
}

export { Switch };
```

### Design Tokens Used

**Colors:**
- Track off: `bg-gray-300` (should use design token)
- Track on: `bg-indigo-600` (should use `var(--primary)`)
- Thumb: `bg-white`
- Focus ring: `ring-indigo-500` (should use `var(--ring)`)

**Sizing:**
- Track: 44px × 18px
- Thumb: 14px × 14px
- Thumb positions: 2px (off), 28px (on)

**Effects:**
- Transition: `duration-200 ease-in-out`
- Shadow: `shadow-sm` on thumb
- Focus ring: `ring-2` with `ring-offset-2`
- Border radius: `rounded-full`

**States:**
- Disabled opacity: `opacity-50`
- Cursor disabled: `cursor-not-allowed`
- Cursor default: `cursor-pointer`

---

## Examples

### Basic Switch

```typescript
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function BasicSwitch() {
  return (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane mode</Label>
    </div>
  );
}
```

### With Helper Text

```typescript
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function SwitchWithHelperText() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="marketing">Marketing emails</Label>
        <Switch id="marketing" />
      </div>
      <p className="text-sm text-muted-foreground">
        Receive emails about new products and features.
      </p>
    </div>
  );
}
```

### Settings List

```typescript
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function SettingsList() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="notifications">Notifications</Label>
          <p className="text-sm text-muted-foreground">
            Receive push notifications
          </p>
        </div>
        <Switch id="notifications" defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="sound">Sound</Label>
          <p className="text-sm text-muted-foreground">
            Play sound for notifications
          </p>
        </div>
        <Switch id="sound" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="vibrate">Vibrate</Label>
          <p className="text-sm text-muted-foreground">
            Vibrate on notifications
          </p>
        </div>
        <Switch id="vibrate" defaultChecked />
      </div>
    </div>
  );
}
```

### Controlled Switch

```typescript
"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function ControlledSwitch() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="dark-mode">Dark mode</Label>
        <Switch
          id="dark-mode"
          checked={darkMode}
          onCheckedChange={setDarkMode}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Current mode: <span className="font-medium">{darkMode ? "Dark" : "Light"}</span>
      </p>
    </div>
  );
}
```

### With Disabled State

```typescript
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function SwitchDisabled() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="available">Available feature</Label>
        <Switch id="available" />
      </div>
      <div className="flex items-center justify-between opacity-50">
        <div>
          <Label htmlFor="premium">Premium feature</Label>
          <p className="text-sm text-muted-foreground">
            Requires Pro subscription
          </p>
        </div>
        <Switch id="premium" disabled />
      </div>
    </div>
  );
}
```

### In a Card

```typescript
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SwitchInCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>
          Manage your privacy and data preferences.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="profile-public">Public profile</Label>
          <Switch id="profile-public" />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-email">Show email</Label>
          <Switch id="show-email" />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="show-activity">Show activity</Label>
          <Switch id="show-activity" defaultChecked />
        </div>
      </CardContent>
    </Card>
  );
}
```

### Form Integration

```typescript
"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function SwitchForm() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Settings:", settings);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="email-notif">Email notifications</Label>
          <Switch
            id="email-notif"
            checked={settings.emailNotifications}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, emailNotifications: checked })
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="sms-notif">SMS notifications</Label>
          <Switch
            id="sms-notif"
            checked={settings.smsNotifications}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, smsNotifications: checked })
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="push-notif">Push notifications</Label>
          <Switch
            id="push-notif"
            checked={settings.pushNotifications}
            onCheckedChange={(checked) =>
              setSettings({ ...settings, pushNotifications: checked })
            }
          />
        </div>
      </div>
      <Button type="submit">Save Preferences</Button>
    </form>
  );
}
```

### With Loading State

```typescript
"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function SwitchWithLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setEnabled(checked);
    setIsLoading(false);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Label htmlFor="feature-toggle">Feature toggle</Label>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
      </div>
      <Switch
        id="feature-toggle"
        checked={enabled}
        onCheckedChange={handleToggle}
        disabled={isLoading}
      />
    </div>
  );
}
```

### Conditional Content

```typescript
"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function SwitchWithConditional() {
  const [customUrl, setCustomUrl] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="custom-url">Use custom URL</Label>
        <Switch
          id="custom-url"
          checked={customUrl}
          onCheckedChange={setCustomUrl}
        />
      </div>
      {customUrl && (
        <div className="space-y-2">
          <Label htmlFor="url-input">Custom URL</Label>
          <Input
            id="url-input"
            type="url"
            placeholder="https://example.com"
          />
        </div>
      )}
    </div>
  );
}
```

### Accessible Example

```typescript
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function AccessibleSwitch() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="reduce-motion" id="reduce-motion-label">
            Reduce motion
          </Label>
          <p id="reduce-motion-desc" className="text-sm text-muted-foreground">
            Minimize animations throughout the app.
          </p>
        </div>
        <Switch
          id="reduce-motion"
          aria-labelledby="reduce-motion-label"
          aria-describedby="reduce-motion-desc"
        />
      </div>
    </div>
  );
}
```

---

**Last Updated:** 2024-12-30
