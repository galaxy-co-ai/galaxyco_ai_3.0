# Select

**Version 1.0.0**

Select components (dropdowns) allow users to choose a single option from a list. They save space by hiding options until activated and are essential for forms with predefined choices.

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
- **Forms with predefined options**: Country, state, category selection
- **Limited choices**: 3-15 options work best
- **Space-constrained layouts**: Dropdown saves vertical space
- **Standardized input**: Prevent typos with predefined values
- **Single selection**: User chooses one option from list
- **Settings/preferences**: Configuration dropdowns

### When Not to Use
- **2 options only**: Use [Radio Group](#) instead
- **Many options (15+)**: Use autocomplete or searchable select
- **Multiple selections**: Use [Checkbox Group](#) or multi-select
- **Immediate visibility needed**: Use [Radio Group](#) for 3-5 options
- **Text input preferred**: Use [Input](#) with suggestions
- **Navigation**: Use proper navigation components

---

## Anatomy

```
┌──────────────────────────────────┐
│  Selected Value          ▼       │  ← SelectTrigger with chevron
└──────────────────────────────────┘
         │ (opens dropdown)
         ▼
┌──────────────────────────────────┐
│  Group Label                     │  ← SelectLabel
│  ├─ Option 1                   ✓ │  ← SelectItem (selected)
│  ├─ Option 2                     │
│  ├─ Option 3                     │
│  ─────────────────────────────── │  ← SelectSeparator
│  Another Group                   │
│  ├─ Option 4                     │
│  └─ Option 5                     │
└──────────────────────────────────┘
         ↑ SelectContent
```

**Component Parts:**
1. **Select** (Root) - Container/state provider
2. **SelectTrigger** - Button that opens dropdown
3. **SelectValue** - Displays selected option
4. **SelectContent** - Dropdown panel with options
5. **SelectItem** - Individual option (with checkmark when selected)
6. **SelectGroup** - Groups related options (optional)
7. **SelectLabel** - Group heading (optional)
8. **SelectSeparator** - Divider between groups (optional)
9. **SelectScrollUpButton/SelectScrollDownButton** - Scroll indicators

---

## Options

### Subcomponents

#### Select (Root)
State container for select component.

```typescript
<Select>
  {/* Select subcomponents */}
</Select>
```

**Props:**
- `value`: string - Controlled selected value
- `onValueChange`: function - Called when selection changes
- `defaultValue`: string - Uncontrolled default value
- `open`: boolean - Controlled open state
- `onOpenChange`: function - Called when open state changes
- `disabled`: boolean - Disable entire select
- `required`: boolean - Mark as required field

#### SelectTrigger
Button that opens the dropdown.

```typescript
<SelectTrigger>
  <SelectValue placeholder="Select option..." />
</SelectTrigger>
```

**Props:**
- `size`: "sm" | "default" - Height (default: 36px, sm: 32px)

**Design tokens:**
- Background: `input-background-color-default` (`var(--input-background)`)
- Border: `input-border-color-default` (`var(--border)`)
- Height (default): `component-height-100` (36px / h-9)
- Height (sm): `component-height-75` (32px / h-8)
- Padding: `px-3` (12px)

#### SelectValue
Displays the selected value or placeholder.

```typescript
<SelectValue placeholder="Choose an option" />
```

**Props:**
- `placeholder`: string - Text shown when no selection

#### SelectContent
Dropdown panel containing options.

```typescript
<SelectContent>
  <SelectItem value="option1">Option 1</SelectItem>
</SelectContent>
```

**Props:**
- `position`: "popper" | "item-aligned" - Positioning strategy

**Design tokens:**
- Background: `popover-background-color` (`var(--popover)`)
- Border: `border-color-default` (`var(--border)`)
- Shadow: `shadow-md`
- Max height: Adapts to available space
- Min width: 8rem (128px)

#### SelectItem
Individual selectable option.

```typescript
<SelectItem value="unique-value">
  Display Text
</SelectItem>
```

**Props:**
- `value`: string (required) - Unique identifier
- `disabled`: boolean - Disable this option

**Features:**
- Check icon shows when selected
- Hover/focus states
- Keyboard navigable

#### SelectGroup
Groups related options together.

```typescript
<SelectGroup>
  <SelectLabel>Group Name</SelectLabel>
  <SelectItem value="1">Option 1</SelectItem>
  <SelectItem value="2">Option 2</SelectItem>
</SelectGroup>
```

#### SelectLabel
Heading for option group.

```typescript
<SelectLabel>Category Name</SelectLabel>
```

**Design tokens:**
- Color: `muted-foreground-color-default`
- Font size: `text-xs` (12px)
- Padding: `px-2 py-1.5`

#### SelectSeparator
Visual divider between groups.

```typescript
<SelectSeparator />
```

**Design tokens:**
- Background: `border-color-default`
- Height: 1px

### Sizes

```typescript
<SelectTrigger size="sm">      // 32px height
<SelectTrigger size="default"> // 36px height (default)
```

### States

- **Default** - Normal resting state
- **Hover** - Mouse over trigger
- **Focus** - Keyboard focus on trigger
- **Open** - Dropdown is visible
- **Selected** - Option is chosen
- **Disabled** - Cannot interact
- **Error** - Invalid selection (with `aria-invalid`)

---

## Behaviors

### Opening/Closing
- **Click trigger**: Opens dropdown
- **Click outside**: Closes dropdown
- **Escape key**: Closes dropdown
- **Select option**: Closes dropdown and updates value

### Animation
- **Opening**: Fade in + zoom in (200ms)
- **Closing**: Fade out + zoom out (200ms)
- Smooth transitions

### Keyboard Navigation
- **Space/Enter**: Open dropdown (when focused on trigger)
- **Arrow Up/Down**: Navigate options
- **Home**: First option
- **End**: Last option
- **Type to search**: Jump to matching option
- **Escape**: Close dropdown
- **Tab**: Move to next focusable element (closes dropdown)

### Focus Management
- Focus returns to trigger when closed
- First option highlighted when opened
- Focus trapped in dropdown while open

### Scrolling
- Long lists auto-scroll
- Scroll buttons appear when needed
- Selected item scrolls into view

### Positioning
- Opens below trigger (default)
- Flips above if no space below
- Aligns with trigger width (minimum)

---

## Usage Guidelines

### ✅ Do's

**Use for clear, finite options**
```typescript
✅
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select country" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="us">United States</SelectItem>
    <SelectItem value="uk">United Kingdom</SelectItem>
    <SelectItem value="ca">Canada</SelectItem>
  </SelectContent>
</Select>
```

**Group related options**
```typescript
✅
<SelectContent>
  <SelectGroup>
    <SelectLabel>North America</SelectLabel>
    <SelectItem value="us">United States</SelectItem>
    <SelectItem value="ca">Canada</SelectItem>
  </SelectGroup>
  <SelectSeparator />
  <SelectGroup>
    <SelectLabel>Europe</SelectLabel>
    <SelectItem value="uk">United Kingdom</SelectItem>
    <SelectItem value="de">Germany</SelectItem>
  </SelectGroup>
</SelectContent>
```

**Include clear placeholders**
```typescript
✅ <SelectValue placeholder="Choose a category" />
✅ <SelectValue placeholder="Select status" />
```

**Always include labels**
```typescript
✅
<div className="space-y-2">
  <Label htmlFor="country">Country</Label>
  <Select>
    <SelectTrigger id="country">
      <SelectValue placeholder="Select country" />
    </SelectTrigger>
  </Select>
</div>
```

### ❌ Don'ts

**Don't use for too few options**
```typescript
❌
<Select>  // Only 2 options - use radio instead
  <SelectTrigger>
    <SelectValue placeholder="Choose" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="yes">Yes</SelectItem>
    <SelectItem value="no">No</SelectItem>
  </SelectContent>
</Select>

✅ Use Radio Group for 2-5 visible options
```

**Don't use for too many options**
```typescript
❌
<SelectContent>
  {/* 100+ countries without search */}
  <SelectItem value="...">...</SelectItem>
</SelectContent>

✅ Use searchable/autocomplete select for 15+ options
```

**Don't use vague placeholders**
```typescript
❌ <SelectValue placeholder="Select" />
❌ <SelectValue placeholder="Choose..." />
✅ <SelectValue placeholder="Select category" />
```

**Don't nest selects**
```typescript
❌
<SelectItem>
  <Select>  // Nested select inside option
    {/* ... */}
  </Select>
</SelectItem>
```

**Don't forget disabled state explanation**
```typescript
❌ <Select disabled>...</Select>  // Why is it disabled?

✅
<Select disabled>
  <SelectTrigger aria-describedby="select-disabled-reason">
    <SelectValue />
  </SelectTrigger>
</Select>
<p id="select-disabled-reason" className="text-sm text-muted-foreground">
  Available after completing previous step
</p>
```

---

## Content Standards

### Placeholders

**Be specific and action-oriented**
```typescript
✅ "Select a category"
✅ "Choose your country"
✅ "Pick a status"
❌ "Please select"
❌ "Choose one"
❌ "Select..."
```

**Match the field purpose**
```typescript
✅ "Select payment method" (for payment field)
✅ "Choose priority level" (for priority field)
```

### Option Labels

**Be concise**
```typescript
✅ "United States"
✅ "High Priority"
✅ "Active"
❌ "United States of America (USA)"  // Too long
❌ "High Priority Level"  // Redundant
```

**Use parallel structure**
```typescript
✅ 
<SelectItem value="draft">Draft</SelectItem>
<SelectItem value="review">In Review</SelectItem>
<SelectItem value="published">Published</SelectItem>

❌
<SelectItem value="draft">Draft</SelectItem>
<SelectItem value="review">Under Review</SelectItem>
<SelectItem value="published">It's Published</SelectItem>
```

**Use sentence case**
```typescript
✅ "High priority"
✅ "New user"
❌ "High Priority"  // Title case
❌ "NEW USER"  // All caps
```

### Group Labels

**Be descriptive**
```typescript
✅ <SelectLabel>North America</SelectLabel>
✅ <SelectLabel>Payment Methods</SelectLabel>
❌ <SelectLabel>Group 1</SelectLabel>
```

---

## Accessibility

### Keyboard Navigation

**Full keyboard support:**
- **Tab**: Focus select trigger
- **Space/Enter**: Open dropdown
- **Arrow Down**: Next option (or open if closed)
- **Arrow Up**: Previous option
- **Home**: First option
- **End**: Last option
- **Type character**: Jump to option starting with character
- **Escape**: Close dropdown
- **Tab (when open)**: Close and move to next field

### ARIA Attributes

**Required label association**
```typescript
<Label htmlFor="category-select">Category</Label>
<Select>
  <SelectTrigger id="category-select">
    <SelectValue placeholder="Select category" />
  </SelectTrigger>
</Select>
```

**Error states**
```typescript
<Select>
  <SelectTrigger aria-invalid="true" aria-describedby="error-msg">
    <SelectValue />
  </SelectTrigger>
</Select>
<p id="error-msg" className="text-sm text-destructive">
  Please select a category
</p>
```

**Required fields**
```typescript
<Label htmlFor="country">
  Country <span aria-label="required">*</span>
</Label>
<Select required>
  <SelectTrigger id="country" aria-required="true">
    <SelectValue />
  </SelectTrigger>
</Select>
```

### Screen Readers

- Select role announced automatically
- Placeholder announced as hint
- Option count announced when opened
- Selected value announced
- Group labels announced
- "Collapsed/Expanded" state announced

### Focus Management

- Clear focus ring on trigger: `focus-visible:ring-[3px]`
- Focus visible on all options
- Focus trapped in dropdown while open
- Focus returns to trigger when closed

### Color Contrast

- Trigger text: 7:1 contrast (AAA)
- Placeholder: 4.5:1 contrast (AA)
- Option text: 4.5:1 minimum
- Selected indicator visible
- Focus states meet contrast requirements

### Touch Targets

- Trigger: 44×44px minimum on mobile (36px default + touch area)
- Options: 44px height minimum
- Adequate spacing between options

---

## Implementation

### Basic Select
```typescript
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function BasicExample() {
  return (
    <Select>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select option" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

### With Label
```typescript
import { Label } from '@/components/ui/label';

<div className="space-y-2">
  <Label htmlFor="category">Category</Label>
  <Select>
    <SelectTrigger id="category">
      <SelectValue placeholder="Select category" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="web">Web Development</SelectItem>
      <SelectItem value="mobile">Mobile Development</SelectItem>
      <SelectItem value="design">Design</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Controlled Select
```typescript
function ControlledExample() {
  const [value, setValue] = useState("");
  
  return (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger>
        <SelectValue placeholder="Choose..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="1">Option 1</SelectItem>
        <SelectItem value="2">Option 2</SelectItem>
      </SelectContent>
    </Select>
  );
}
```

### With Groups
```typescript
import {
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from '@/components/ui/select';

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select country" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>North America</SelectLabel>
      <SelectItem value="us">United States</SelectItem>
      <SelectItem value="ca">Canada</SelectItem>
      <SelectItem value="mx">Mexico</SelectItem>
    </SelectGroup>
    <SelectSeparator />
    <SelectGroup>
      <SelectLabel>Europe</SelectLabel>
      <SelectItem value="uk">United Kingdom</SelectItem>
      <SelectItem value="de">Germany</SelectItem>
      <SelectItem value="fr">France</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

### Small Size
```typescript
<SelectTrigger size="sm">
  <SelectValue placeholder="Compact select" />
</SelectTrigger>
```

### With Icons
```typescript
import { Globe, User, Settings } from 'lucide-react';

<SelectContent>
  <SelectItem value="profile">
    <User className="w-4 h-4 mr-2 inline" />
    Profile
  </SelectItem>
  <SelectItem value="settings">
    <Settings className="w-4 h-4 mr-2 inline" />
    Settings
  </SelectItem>
</SelectContent>
```

### Disabled Option
```typescript
<SelectContent>
  <SelectItem value="available">Available</SelectItem>
  <SelectItem value="disabled" disabled>
    Coming Soon
  </SelectItem>
</SelectContent>
```

---

## Examples

### Form Field
```typescript
<form className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="priority">Priority</Label>
    <Select>
      <SelectTrigger id="priority">
        <SelectValue placeholder="Select priority" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="low">Low</SelectItem>
        <SelectItem value="medium">Medium</SelectItem>
        <SelectItem value="high">High</SelectItem>
      </SelectContent>
    </Select>
  </div>
</form>
```

### Status Selection
```typescript
<Select defaultValue="active">
  <SelectTrigger className="w-[180px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="active">
      <Badge variant="soft" tone="success" className="mr-2">Active</Badge>
    </SelectItem>
    <SelectItem value="pending">
      <Badge variant="soft" tone="warning" className="mr-2">Pending</Badge>
    </SelectItem>
    <SelectItem value="inactive">
      <Badge variant="soft" tone="neutral" className="mr-2">Inactive</Badge>
    </SelectItem>
  </SelectContent>
</Select>
```

### Settings Dropdown
```typescript
<Card>
  <CardHeader>
    <CardTitle>Preferences</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="language">Language</Label>
      <Select defaultValue="en">
        <SelectTrigger id="language">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="es">Español</SelectItem>
          <SelectItem value="fr">Français</SelectItem>
          <SelectItem value="de">Deutsch</SelectItem>
        </SelectContent>
      </Select>
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="timezone">Timezone</Label>
      <Select>
        <SelectTrigger id="timezone">
          <SelectValue placeholder="Select timezone" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>North America</SelectLabel>
            <SelectItem value="est">Eastern Time</SelectItem>
            <SelectItem value="cst">Central Time</SelectItem>
            <SelectItem value="mst">Mountain Time</SelectItem>
            <SelectItem value="pst">Pacific Time</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  </CardContent>
</Card>
```

### Filter Dropdown
```typescript
<div className="flex items-center gap-2">
  <span className="text-sm text-muted-foreground">Show:</span>
  <Select defaultValue="all">
    <SelectTrigger className="w-[150px]">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Items</SelectItem>
      <SelectItem value="active">Active Only</SelectItem>
      <SelectItem value="archived">Archived Only</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### Payment Method Select
```typescript
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select payment method" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="card">
      <CreditCard className="w-4 h-4 mr-2 inline" />
      Credit Card
    </SelectItem>
    <SelectItem value="paypal">
      <Wallet className="w-4 h-4 mr-2 inline" />
      PayPal
    </SelectItem>
    <SelectItem value="bank">
      <Building className="w-4 h-4 mr-2 inline" />
      Bank Transfer
    </SelectItem>
  </SelectContent>
</Select>
```

### Multi-Field Form
```typescript
<form className="space-y-4">
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="category">Category</Label>
      <Select>
        <SelectTrigger id="category">
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="bug">Bug</SelectItem>
          <SelectItem value="feature">Feature</SelectItem>
          <SelectItem value="improvement">Improvement</SelectItem>
        </SelectContent>
      </Select>
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="priority">Priority</Label>
      <Select>
        <SelectTrigger id="priority">
          <SelectValue placeholder="Select priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="medium">Medium</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="urgent">Urgent</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</form>
```

---

## Design Tokens Reference

```typescript
// From tokens/colors.ts
input-background-color-default: var(--input-background)
input-border-color-default: var(--border)
input-border-color-focus: var(--ring)
popover-background-color: var(--popover)

// From tokens/spacing.ts
component-height-75: 2rem          // 32px - Small
component-height-100: 2.25rem      // 36px - Default

// From tokens/effects.ts
shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1)
radius-md: 0.5rem                  // 8px - Border radius
```

---

## Related Components

- [Input](#) - Text input
- [Checkbox](#) - Multiple selection
- [Radio Group](#) - Single selection (visible options)
- [Combobox](#) - Searchable select
- [Form](#) - Form wrapper

---

## Changelog

### Version 1.0.0 (2025-12-30)
- Initial documentation following Spectrum 2 structure
- Documented all 9 select subcomponents
- Added comprehensive usage guidelines
- Added accessibility documentation with ARIA
- Added design token references
- Added 6 real-world examples

---

**Last Updated**: 2025-12-30  
**Component Location**: `src/components/ui/select.tsx`  
**Primitive Wrapper**: N/A (use base component directly)
