# Radio Group

**Version 1.0.0**

Radio groups allow users to select a single option from a set of mutually exclusive choices. Only one radio button can be selected at a time within a group.

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
- **Single selection**: Choose exactly one option from multiple choices
- **Mutually exclusive options**: Only one can be true at a time
- **Visible alternatives**: Show all available options upfront
- **Required selection**: User must choose one option
- **Preference settings**: Choose one preference from multiple

### When Not to Use
- **Multiple selections**: Use [Checkbox](#) instead
- **On/off toggle**: Use [Switch](#) for binary states
- **Large option sets**: Use [Select](#) for 5+ options
- **Optional selection**: Consider making the first option "None"
- **Immediate action**: Consider [Button](#) group instead

---

## Anatomy

```
┌──────────┐
│  ◉       │  ← Radio (selected)
└──────────┘

┌──────────┐
│  ○       │  ← Radio (unselected)
└──────────┘

With Label:
┌──────────┬──────────────────────┐
│  ◉       │  Option Label        │
└──────────┴──────────────────────┘

Radio Group:
┌────────────────────────────────────┐
│ Group Label                        │
│                                    │
│  ◉  Option 1                       │
│  ○  Option 2                       │
│  ○  Option 3                       │
└────────────────────────────────────┘
```

**Component Parts:**
1. **RadioGroup** - Container for radio items
2. **RadioGroupItem** - Individual radio button
3. **Label** (required) - Descriptive text for each option
4. **Group label** (optional) - Overall group description

---

## Options

### States

#### Unselected (Default)
Empty circle, not selected.

```typescript
<RadioGroupItem value="option" />
```

**Design tokens:**
- Background: `input-background-color-default`
- Border: `border-color-default` (`var(--input)`)
- Size: `size-4` (16×16px)
- Border width: `border` (1px)

#### Selected
Circle with filled center dot.

```typescript
<RadioGroupItem value="option" checked />
```

**Design tokens:**
- Background: Same as unselected
- Border: `border-color-default`
- Indicator: `text-primary` (`var(--primary)`)
- Indicator size: `size-2` (8px)

#### Hover
Visual feedback on mouse over.

```typescript
// Automatic via CSS
```

**Design tokens:**
- Subtle background shift
- Border emphasis

#### Focused
Keyboard focus indicator.

```typescript
// Automatic via CSS
<RadioGroupItem value="option" /> // When focused
```

**Design tokens:**
- Ring: `focus-visible:ring-[3px] focus-visible:ring-ring/50`
- Border: `focus-visible:border-ring`

#### Disabled
Cannot interact, reduced opacity.

```typescript
<RadioGroupItem value="option" disabled />
```

**Design tokens:**
- Opacity: `opacity-50` (50%)
- Cursor: `cursor-not-allowed`

#### Error
Invalid state with red border.

```typescript
<RadioGroupItem value="option" aria-invalid="true" />
```

**Design tokens:**
- Border: `aria-invalid:border-destructive`
- Ring: `aria-invalid:ring-destructive/20`

### Orientation

#### Vertical (Default)
Options stacked vertically.

```typescript
<RadioGroup defaultValue="option1">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="option1" />
    <Label htmlFor="option1">Option 1</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option2" id="option2" />
    <Label htmlFor="option2">Option 2</Label>
  </div>
</RadioGroup>
```

**Design tokens:**
- Gap: `gap-3` (0.75rem / 12px)
- Layout: `grid` display

#### Horizontal
Options arranged horizontally.

```typescript
<RadioGroup defaultValue="option1" className="flex space-x-4">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="option1" />
    <Label htmlFor="option1">Option 1</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option2" id="option2" />
    <Label htmlFor="option2">Option 2</Label>
  </div>
</RadioGroup>
```

**Design tokens:**
- Gap: `space-x-4` (1rem / 16px)
- Layout: `flex` display

---

## Behaviors

### Selection
- **Click radio**: Selects that option, deselects others
- **Click label**: Same as clicking radio
- **Arrow keys**: Navigate and select (when focused)
- **Space key**: Selects focused option

### Deselection
- **Cannot deselect**: Once selected, must choose another option
- **No "none" state**: Always has one selected (unless using defaultValue)

### Focus
- Shows focus ring: `focus-visible:ring-[3px] focus-visible:ring-ring/50`
- Clear visual indicator
- Smooth transition

### Keyboard Navigation
- **Tab**: Focus the radio group (or next group)
- **Arrow Up/Left**: Select previous option
- **Arrow Down/Right**: Select next option
- **Space**: Select focused option
- **Tab (from group)**: Move to next focusable element

### Mouse Interaction
- Hover: Subtle visual feedback
- Active: Pressed state during click
- Click anywhere on label to select

---

## Usage Guidelines

### ✅ Do's

**Always include labels**
```typescript
✅
<RadioGroup defaultValue="email">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="email" id="email" />
    <Label htmlFor="email">Email</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="sms" id="sms" />
    <Label htmlFor="sms">SMS</Label>
  </div>
</RadioGroup>
```

**Use for mutually exclusive choices**
```typescript
✅
<RadioGroup defaultValue="light">
  <Label className="font-medium mb-2">Theme Preference</Label>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="light" id="light" />
    <Label htmlFor="light">Light</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="dark" id="dark" />
    <Label htmlFor="dark">Dark</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="system" id="system" />
    <Label htmlFor="system">System</Label>
  </div>
</RadioGroup>
```

**Provide clear, distinct labels**
```typescript
✅
<RadioGroup defaultValue="standard">
  <Label className="font-medium mb-2">Delivery Method</Label>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="standard" id="standard" />
    <Label htmlFor="standard">Standard (5-7 days)</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="express" id="express" />
    <Label htmlFor="express">Express (2-3 days)</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="overnight" id="overnight" />
    <Label htmlFor="overnight">Overnight (Next day)</Label>
  </div>
</RadioGroup>
```

**Set a default value when appropriate**
```typescript
✅
<RadioGroup defaultValue="markdown">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="markdown" id="markdown" />
    <Label htmlFor="markdown">Markdown</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="html" id="html" />
    <Label htmlFor="html">HTML</Label>
  </div>
</RadioGroup>
```

**Use descriptive helper text for complex options**
```typescript
✅
<RadioGroup defaultValue="basic">
  <div className="space-y-3">
    <div className="space-y-1">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="basic" id="basic" />
        <Label htmlFor="basic">Basic Plan</Label>
      </div>
      <p className="text-sm text-muted-foreground pl-6">
        Essential features for individuals
      </p>
    </div>
    <div className="space-y-1">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="pro" id="pro" />
        <Label htmlFor="pro">Pro Plan</Label>
      </div>
      <p className="text-sm text-muted-foreground pl-6">
        Advanced features for professionals
      </p>
    </div>
  </div>
</RadioGroup>
```

### ❌ Don'ts

**Don't use for multiple selections**
```typescript
❌
<RadioGroup>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="email" id="email" />
    <Label htmlFor="email">Email notifications</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="sms" id="sms" />
    <Label htmlFor="sms">SMS notifications</Label>
  </div>
</RadioGroup>

✅ Use Checkbox instead
<div className="space-y-2">
  <div className="flex items-center space-x-2">
    <Checkbox id="email" />
    <Label htmlFor="email">Email notifications</Label>
  </div>
  <div className="flex items-center space-x-2">
    <Checkbox id="sms" />
    <Label htmlFor="sms">SMS notifications</Label>
  </div>
</div>
```

**Don't use vague labels**
```typescript
❌
<RadioGroup defaultValue="option1">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option1" id="option1" />
    <Label htmlFor="option1">Option 1</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option2" id="option2" />
    <Label htmlFor="option2">Option 2</Label>
  </div>
</RadioGroup>

✅ Be specific
<RadioGroup defaultValue="monthly">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="monthly" id="monthly" />
    <Label htmlFor="monthly">Monthly billing</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="annual" id="annual" />
    <Label htmlFor="annual">Annual billing</Label>
  </div>
</RadioGroup>
```

**Don't mix radio buttons and checkboxes**
```typescript
❌
<div className="space-y-2">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="a" id="a" />
    <Label htmlFor="a">Option A</Label>
  </div>
  <div className="flex items-center space-x-2">
    <Checkbox id="b" />
    <Label htmlFor="b">Option B</Label>
  </div>
</div>
```

**Don't use for long option lists**
```typescript
❌
<RadioGroup defaultValue="us">
  {/* 200+ country options */}
</RadioGroup>

✅ Use Select instead
<Select defaultValue="us">
  <SelectTrigger>
    <SelectValue placeholder="Select country" />
  </SelectTrigger>
  <SelectContent>
    {/* 200+ country options */}
  </SelectContent>
</Select>
```

**Don't omit the radio group container**
```typescript
❌
<div>
  <RadioGroupItem value="a" id="a" />
  <RadioGroupItem value="b" id="b" />
</div>

✅ Always use RadioGroup wrapper
<RadioGroup defaultValue="a">
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="a" id="a" />
    <Label htmlFor="a">Option A</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="b" id="b" />
    <Label htmlFor="b">Option B</Label>
  </div>
</RadioGroup>
```

---

## Content Standards

### Labels

**Structure:**
- Start with capital letter
- Use sentence case for multi-word labels
- Keep concise (2-5 words ideal)
- Be specific and descriptive

**Examples:**
```typescript
✅ Good:
- "Email"
- "Phone number"
- "Prefer not to say"
- "Send me updates"

❌ Avoid:
- "email" (not capitalized)
- "This is the email option" (too verbose)
- "Click here" (not descriptive)
- "Option 1" (not specific)
```

### Helper Text

**Structure:**
- Use sentence case
- End with period
- Provide clarification, not duplication
- Keep under 15 words

**Examples:**
```typescript
✅ Good:
"Your data will be processed according to our privacy policy."
"We'll send updates weekly via this method."
"This cannot be changed later."

❌ Avoid:
"Email notifications" (duplicates label)
"This option allows you to receive email notifications which will be sent to your registered email address on file." (too long)
```

### Group Labels

**Structure:**
- Clearly describe the choice being made
- Use a question or noun phrase
- Place above options
- Consider making it a `<legend>` for forms

**Examples:**
```typescript
✅ Good:
"How would you like to be contacted?"
"Payment method"
"Notification frequency"

❌ Avoid:
"Options" (too vague)
"Select one:" (obvious from radio behavior)
```

---

## Accessibility

### ARIA Attributes

**Required:**
```typescript
<RadioGroup 
  defaultValue="option1"
  aria-label="Preference selection" // If no visible label
>
  <RadioGroupItem 
    value="option1" 
    id="option1"
    aria-describedby="option1-description" // Optional, for helper text
  />
</RadioGroup>
```

**Error States:**
```typescript
<RadioGroup 
  defaultValue="option1"
  aria-invalid="true"
  aria-errormessage="selection-error"
>
  <RadioGroupItem value="option1" id="option1" aria-invalid="true" />
</RadioGroup>
<p id="selection-error" className="text-sm text-destructive">
  Please select an option to continue.
</p>
```

### Keyboard Support

| Key | Action |
|-----|--------|
| **Tab** | Move focus into/out of radio group |
| **Space** | Select focused radio |
| **Arrow Down/Right** | Focus and select next radio |
| **Arrow Up/Left** | Focus and select previous radio |

### Screen Reader Behavior

- Announces: "Radio button, [label], [selected/not selected], [x] of [y]"
- Group label read first (if provided)
- Disabled state announced
- Error state announced

### Focus Indicators

```typescript
// Default focus styles
focus-visible:ring-[3px] focus-visible:ring-ring/50
focus-visible:border-ring

// High contrast mode
@media (prefers-contrast: high) {
  // Enhanced border visibility
}
```

### Touch Targets

- Minimum: 44×44px (WCAG AAA)
- Achieved through label clickable area
- Radio itself: 16×16px (visible size)
- Spacing ensures targets don't overlap

---

## Implementation

### Component Structure

**File:** `src/components/ui/radio-group.tsx`

```typescript
"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { CircleIcon } from "lucide-react";

import { cn } from "../../lib/utils";

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleIcon className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
```

### Dependencies

```json
{
  "@radix-ui/react-radio-group": "^1.1.3",
  "lucide-react": "^0.294.0"
}
```

### Design Tokens Used

**Colors:**
- `--input` - Unselected border
- `--primary` - Selected indicator
- `--ring` - Focus ring
- `--destructive` - Error state

**Spacing:**
- `gap-3` (0.75rem) - Vertical spacing between items
- `space-x-2` (0.5rem) - Label spacing
- `space-x-4` (1rem) - Horizontal layout spacing

**Sizing:**
- `size-4` (16×16px) - Radio button size
- `size-2` (8×8px) - Selected indicator size

**Effects:**
- `shadow-xs` - Subtle depth
- `focus-visible:ring-[3px]` - Focus ring width
- `transition-[color,box-shadow]` - Smooth state changes

---

## Examples

### Basic Radio Group

```typescript
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function BasicRadioGroup() {
  return (
    <RadioGroup defaultValue="comfortable">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="default" id="r1" />
        <Label htmlFor="r1">Default</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="comfortable" id="r2" />
        <Label htmlFor="r2">Comfortable</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="compact" id="r3" />
        <Label htmlFor="r3">Compact</Label>
      </div>
    </RadioGroup>
  );
}
```

### With Group Label

```typescript
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function LabeledRadioGroup() {
  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Choose a notification method</Label>
      <RadioGroup defaultValue="email">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="email" id="email" />
          <Label htmlFor="email">Email</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="sms" id="sms" />
          <Label htmlFor="sms">SMS</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="push" id="push" />
          <Label htmlFor="push">Push notification</Label>
        </div>
      </RadioGroup>
    </div>
  );
}
```

### With Helper Text

```typescript
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function RadioGroupWithHelperText() {
  return (
    <RadioGroup defaultValue="card">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="card" id="card" />
          <Label htmlFor="card">Credit card</Label>
        </div>
        <p className="text-sm text-muted-foreground pl-6">
          Pay with Visa, Mastercard, or American Express.
        </p>
      </div>
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="paypal" id="paypal" />
          <Label htmlFor="paypal">PayPal</Label>
        </div>
        <p className="text-sm text-muted-foreground pl-6">
          Secure payment through your PayPal account.
        </p>
      </div>
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="bank" id="bank" />
          <Label htmlFor="bank">Bank transfer</Label>
        </div>
        <p className="text-sm text-muted-foreground pl-6">
          Direct transfer from your bank account.
        </p>
      </div>
    </RadioGroup>
  );
}
```

### Horizontal Layout

```typescript
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function HorizontalRadioGroup() {
  return (
    <RadioGroup defaultValue="yes" className="flex space-x-4">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="yes" id="yes" />
        <Label htmlFor="yes">Yes</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="no" id="no" />
        <Label htmlFor="no">No</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="maybe" id="maybe" />
        <Label htmlFor="maybe">Maybe</Label>
      </div>
    </RadioGroup>
  );
}
```

### With Disabled Options

```typescript
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function RadioGroupWithDisabled() {
  return (
    <RadioGroup defaultValue="option1">
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option1" id="option1" />
        <Label htmlFor="option1">Available option</Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option2" id="option2" disabled />
        <Label htmlFor="option2" className="opacity-50">
          Unavailable option
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <RadioGroupItem value="option3" id="option3" />
        <Label htmlFor="option3">Another available option</Label>
      </div>
    </RadioGroup>
  );
}
```

### With Error State

```typescript
"use client";

import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function RadioGroupWithValidation() {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (!value) {
      setError(true);
    } else {
      setError(false);
      // Process form
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className={error ? "text-destructive" : ""}>
          Select your preferred contact method *
        </Label>
        <RadioGroup
          value={value}
          onValueChange={(v) => {
            setValue(v);
            setError(false);
          }}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem 
              value="email" 
              id="email" 
              aria-invalid={error}
              aria-describedby={error ? "contact-error" : undefined}
            />
            <Label htmlFor="email">Email</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem 
              value="phone" 
              id="phone" 
              aria-invalid={error}
              aria-describedby={error ? "contact-error" : undefined}
            />
            <Label htmlFor="phone">Phone</Label>
          </div>
        </RadioGroup>
        {error && (
          <p id="contact-error" className="text-sm text-destructive">
            Please select a contact method.
          </p>
        )}
      </div>
      <Button onClick={handleSubmit}>Submit</Button>
    </div>
  );
}
```

### Controlled Radio Group

```typescript
"use client";

import { useState } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export function ControlledRadioGroup() {
  const [theme, setTheme] = useState("system");

  return (
    <div className="space-y-4">
      <RadioGroup value={theme} onValueChange={setTheme}>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="light" id="light" />
          <Label htmlFor="light">Light</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="dark" id="dark" />
          <Label htmlFor="dark">Dark</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="system" id="system" />
          <Label htmlFor="system">System</Label>
        </div>
      </RadioGroup>
      <p className="text-sm text-muted-foreground">
        Current theme: <span className="font-medium">{theme}</span>
      </p>
    </div>
  );
}
```

### In a Card

```typescript
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function RadioGroupInCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Choose how you want to receive notifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup defaultValue="all">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="all" />
            <Label htmlFor="all">All notifications</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="important" id="important" />
            <Label htmlFor="important">Important only</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="none" />
            <Label htmlFor="none">None</Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
```

### With React Hook Form

```typescript
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  contactMethod: z.enum(["email", "phone", "mail"], {
    required_error: "Please select a contact method.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function RadioGroupWithForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const selectedValue = watch("contactMethod");

  const onSubmit = (data: FormValues) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label className={errors.contactMethod ? "text-destructive" : ""}>
          Preferred contact method *
        </Label>
        <RadioGroup
          value={selectedValue}
          onValueChange={(value) => setValue("contactMethod", value as any)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem 
              value="email" 
              id="email-form"
              aria-invalid={!!errors.contactMethod}
              aria-describedby={errors.contactMethod ? "contact-error" : undefined}
            />
            <Label htmlFor="email-form">Email</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem 
              value="phone" 
              id="phone-form"
              aria-invalid={!!errors.contactMethod}
              aria-describedby={errors.contactMethod ? "contact-error" : undefined}
            />
            <Label htmlFor="phone-form">Phone</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem 
              value="mail" 
              id="mail-form"
              aria-invalid={!!errors.contactMethod}
              aria-describedby={errors.contactMethod ? "contact-error" : undefined}
            />
            <Label htmlFor="mail-form">Mail</Label>
          </div>
        </RadioGroup>
        {errors.contactMethod && (
          <p id="contact-error" className="text-sm text-destructive">
            {errors.contactMethod.message}
          </p>
        )}
      </div>
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

---

**Last Updated:** 2024-12-30
