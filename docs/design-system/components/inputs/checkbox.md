# Checkbox

**Version 1.0.0**

Checkboxes allow users to select one or more options from a set. They are used for multiple selections, agreeing to terms, or toggling individual settings.

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
- **Multiple selections**: Choose multiple options from a list
- **Agree to terms**: Accept terms and conditions, privacy policies
- **Toggle settings**: Enable/disable individual features
- **Select all**: Batch selection with indeterminate state
- **Independent options**: Each selection is independent
- **On/off states**: Binary choices that don't require immediate action

### When Not to Use
- **Single selection only**: Use [Radio Group](#) instead
- **Immediate action required**: Use [Switch](#) for instant effect
- **Navigation**: Use proper navigation components
- **Buttons disguised as checkboxes**: Use actual [Button](#) components

---

## Anatomy

```
┌─────────┐
│  ☑      │  ← Checkbox (checked)
└─────────┘

┌─────────┐
│  ☐      │  ← Checkbox (unchecked)
└─────────┘

┌─────────┐
│  ▪      │  ← Checkbox (indeterminate)
└─────────┘

With Label:
┌─────────┬─────────────────────┐
│  ☑      │  Option Label       │
└─────────┴─────────────────────┘
```

**Component Parts:**
1. **Checkbox** - Interactive box with check icon
2. **Label** (recommended) - Descriptive text
3. **Helper text** (optional) - Additional context

---

## Options

### States

#### Unchecked (Default)
Empty box, not selected.

```typescript
<Checkbox />
```

#### Checked
Box with checkmark, selected.

```typescript
<Checkbox checked />
```

#### Indeterminate
Partially checked state (for "select all" scenarios).

```typescript
<Checkbox checked="indeterminate" />
```

**Design tokens:**
- Unchecked background: `input-background-color-default`
- Unchecked border: `border-color-default`
- Checked background: `accent-background-color-default` (`var(--primary)`)
- Checked foreground: `accent-foreground-color-default`

#### Disabled
Cannot interact, reduced opacity.

```typescript
<Checkbox disabled />
<Checkbox checked disabled />
```

**Design tokens:**
- Opacity: `opacity-50` (50%)

#### Error
Invalid state with red border.

```typescript
<Checkbox aria-invalid="true" />
```

**Design tokens:**
- Border: `destructive-border-color-default`
- Ring: `destructive-ring-color`

### Sizes

Checkbox has a fixed size for touch accessibility:
- Size: 16×16px (4rem)
- Touch target: 44×44px minimum (ensured by label area)

---

## Behaviors

### Checking/Unchecking
- **Click checkbox**: Toggles checked state
- **Click label**: Toggles checked state
- **Space key**: Toggles checked state (when focused)

### Focus
- Shows focus ring: `focus-visible:ring-[3px] focus-visible:ring-ring/50`
- Clear visual indicator
- Smooth transition

### Keyboard Navigation
- **Tab**: Focus next checkbox
- **Shift + Tab**: Focus previous checkbox
- **Space**: Toggle checked state

### Mouse Interaction
- Hover: Subtle visual feedback
- Active: Pressed state during click
- Click anywhere on label to toggle

---

## Usage Guidelines

### ✅ Do's

**Always include labels**
```typescript
✅
<div className="flex items-center space-x-2">
  <Checkbox id="terms" />
  <Label htmlFor="terms">I agree to the terms and conditions</Label>
</div>
```

**Use for multiple selections**
```typescript
✅
<div className="space-y-2">
  <div className="flex items-center space-x-2">
    <Checkbox id="email" />
    <Label htmlFor="email">Email notifications</Label>
  </div>
  <div className="flex items-center space-x-2">
    <Checkbox id="sms" />
    <Label htmlFor="sms">SMS notifications</Label>
  </div>
  <div className="flex items-center space-x-2">
    <Checkbox id="push" />
    <Label htmlFor="push">Push notifications</Label>
  </div>
</div>
```

**Use indeterminate for select-all patterns**
```typescript
✅
<Checkbox
  checked={allSelected ? true : someSelected ? "indeterminate" : false}
  onCheckedChange={handleSelectAll}
/>
```

**Show validation errors clearly**
```typescript
✅
<div className="space-y-2">
  <div className="flex items-center space-x-2">
    <Checkbox id="consent" aria-invalid="true" aria-describedby="consent-error" />
    <Label htmlFor="consent">I consent to data processing</Label>
  </div>
  <p id="consent-error" className="text-sm text-destructive">
    You must consent to continue
  </p>
</div>
```

### ❌ Don'ts

**Don't use for single selection**
```typescript
❌
<div className="space-y-2">
  <div className="flex items-center space-x-2">
    <Checkbox />
    <Label>Option A</Label>
  </div>
  <div className="flex items-center space-x-2">
    <Checkbox />
    <Label>Option B</Label>
  </div>
</div>

✅ Use Radio Group for single selection
```

**Don't use without labels**
```typescript
❌ <Checkbox />  // No label - not accessible

✅
<div className="flex items-center space-x-2">
  <Checkbox id="option" />
  <Label htmlFor="option">Option name</Label>
</div>
```

**Don't use for immediate actions**
```typescript
❌
<Checkbox onChange={() => deleteAccount()} />
<Label>Delete my account</Label>

✅ Use Button with confirmation dialog for destructive actions
```

**Don't nest checkboxes**
```typescript
❌
<Checkbox>
  <Checkbox />  // Nested - confusing
</Checkbox>
```

---

## Content Standards

### Labels

**Be clear and concise**
```typescript
✅ "I agree to the terms and conditions"
✅ "Email notifications"
✅ "Remember me"
❌ "Check this box to agree to the terms"  // Too wordy
❌ "Box"  // Not descriptive
```

**Use positive language**
```typescript
✅ "Enable notifications"
✅ "Show advanced options"
❌ "Don't disable notifications"  // Double negative
```

**Use sentence case**
```typescript
✅ "Send me weekly updates"
❌ "Send Me Weekly Updates"  // Title case
```

---

## Accessibility

### Keyboard Navigation
- **Tab**: Focus next checkbox
- **Shift + Tab**: Focus previous checkbox
- **Space**: Toggle checked state
- **Enter**: Submit form (if in form)

### ARIA Attributes

**Required label association**
```typescript
<Checkbox id="newsletter" />
<Label htmlFor="newsletter">Subscribe to newsletter</Label>
```

**Required checkboxes**
```typescript
<Checkbox id="terms" required aria-required="true" />
<Label htmlFor="terms">
  I agree to terms <span aria-label="required">*</span>
</Label>
```

**Error states**
```typescript
<Checkbox
  id="consent"
  aria-invalid="true"
  aria-describedby="consent-error"
/>
<Label htmlFor="consent">I consent</Label>
<p id="consent-error" className="text-sm text-destructive">
  Consent is required
</p>
```

**Indeterminate state**
```typescript
<Checkbox
  checked="indeterminate"
  aria-checked="mixed"
  aria-label="Select all items"
/>
```

### Screen Readers
- Checkbox role announced automatically
- Checked/unchecked state announced
- Indeterminate state announced as "partially checked" or "mixed"
- Label text announced
- Error messages announced with `role="alert"`

### Focus Management
- Clear focus ring: `focus-visible:ring-[3px]`
- Focus visible on checkbox only (not label)
- Focus order follows visual order

### Color Contrast
- Unchecked border: 3:1 minimum
- Checked background: 3:1 minimum
- Check icon: 4.5:1 contrast
- Focus ring: Clear and visible

### Touch Targets
- Checkbox: 16×16px visual
- Touch area: 44×44px minimum (via label)
- Label is clickable for larger touch area

---

## Implementation

### Basic Checkbox
```typescript
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

function BasicExample() {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id="basic" />
      <Label htmlFor="basic">Checkbox label</Label>
    </div>
  );
}
```

### Controlled Checkbox
```typescript
function ControlledExample() {
  const [checked, setChecked] = useState(false);
  
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id="controlled"
        checked={checked}
        onCheckedChange={setChecked}
      />
      <Label htmlFor="controlled">Controlled checkbox</Label>
    </div>
  );
}
```

### Disabled Checkbox
```typescript
<div className="flex items-center space-x-2">
  <Checkbox id="disabled" disabled />
  <Label htmlFor="disabled">Disabled option</Label>
</div>

<div className="flex items-center space-x-2">
  <Checkbox id="disabled-checked" disabled checked />
  <Label htmlFor="disabled-checked">Disabled (checked)</Label>
</div>
```

### With Helper Text
```typescript
<div className="space-y-2">
  <div className="flex items-center space-x-2">
    <Checkbox id="marketing" />
    <Label htmlFor="marketing">Marketing emails</Label>
  </div>
  <p className="text-sm text-muted-foreground ml-6">
    Receive occasional updates about new features
  </p>
</div>
```

### Indeterminate State
```typescript
function IndeterminateExample() {
  const [items, setItems] = useState([
    { id: 1, checked: false },
    { id: 2, checked: true },
    { id: 3, checked: false },
  ]);
  
  const allChecked = items.every(item => item.checked);
  const someChecked = items.some(item => item.checked);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={allChecked ? true : someChecked ? "indeterminate" : false}
          onCheckedChange={(checked) => {
            setItems(items.map(item => ({ ...item, checked: !!checked })));
          }}
        />
        <Label>Select all</Label>
      </div>
      {items.map(item => (
        <div key={item.id} className="flex items-center space-x-2 ml-6">
          <Checkbox
            checked={item.checked}
            onCheckedChange={(checked) => {
              setItems(items.map(i =>
                i.id === item.id ? { ...i, checked: !!checked } : i
              ));
            }}
          />
          <Label>Item {item.id}</Label>
        </div>
      ))}
    </div>
  );
}
```

---

## Examples

### Terms and Conditions
```typescript
<div className="flex items-center space-x-2">
  <Checkbox id="terms" required />
  <Label htmlFor="terms">
    I agree to the{" "}
    <a href="/terms" className="underline">
      terms and conditions
    </a>
  </Label>
</div>
```

### Newsletter Subscription
```typescript
<div className="space-y-4">
  <div className="flex items-center space-x-2">
    <Checkbox id="newsletter" defaultChecked />
    <Label htmlFor="newsletter">Subscribe to newsletter</Label>
  </div>
  <p className="text-sm text-muted-foreground ml-6">
    Get weekly updates about new features and products
  </p>
</div>
```

### Notification Settings
```typescript
<Card>
  <CardHeader>
    <CardTitle>Notifications</CardTitle>
    <CardDescription>
      Choose how you want to be notified
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center space-x-2">
      <Checkbox id="email-notif" defaultChecked />
      <Label htmlFor="email-notif">Email notifications</Label>
    </div>
    <div className="flex items-center space-x-2">
      <Checkbox id="push-notif" />
      <Label htmlFor="push-notif">Push notifications</Label>
    </div>
    <div className="flex items-center space-x-2">
      <Checkbox id="sms-notif" />
      <Label htmlFor="sms-notif">SMS notifications</Label>
    </div>
  </CardContent>
</Card>
```

### Table Row Selection
```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead className="w-12">
        <Checkbox
          checked={allRowsSelected}
          onCheckedChange={handleSelectAll}
        />
      </TableHead>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {rows.map((row) => (
      <TableRow key={row.id}>
        <TableCell>
          <Checkbox
            checked={row.selected}
            onCheckedChange={() => handleRowSelect(row.id)}
          />
        </TableCell>
        <TableCell>{row.name}</TableCell>
        <TableCell>{row.status}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### Feature Toggles
```typescript
<div className="space-y-4">
  <h3 className="font-medium">Features</h3>
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="feature-1">Advanced analytics</Label>
        <p className="text-sm text-muted-foreground">
          View detailed analytics and reports
        </p>
      </div>
      <Checkbox id="feature-1" />
    </div>
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="feature-2">Email integration</Label>
        <p className="text-sm text-muted-foreground">
          Connect your email account
        </p>
      </div>
      <Checkbox id="feature-2" />
    </div>
  </div>
</div>
```

### Filter Options
```typescript
<div className="space-y-3">
  <h4 className="text-sm font-medium">Filter by status</h4>
  <div className="space-y-2">
    <div className="flex items-center space-x-2">
      <Checkbox id="active" defaultChecked />
      <Label htmlFor="active">Active</Label>
    </div>
    <div className="flex items-center space-x-2">
      <Checkbox id="pending" defaultChecked />
      <Label htmlFor="pending">Pending</Label>
    </div>
    <div className="flex items-center space-x-2">
      <Checkbox id="archived" />
      <Label htmlFor="archived">Archived</Label>
    </div>
  </div>
</div>
```

---

## Design Tokens Reference

```typescript
// From tokens/colors.ts
input-background-color-default: var(--input-background)
border-color-default: var(--border)
accent-background-color-default: var(--primary)
accent-foreground-color-default: var(--primary-foreground)
destructive-border-color: var(--destructive)

// From tokens/effects.ts
shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05)
radius-sm: 0.25rem    // 4px - Checkbox border radius

// From tokens/opacity.ts
opacity-50: 0.5       // Disabled state
```

---

## Related Components

- [Switch](#) - Toggle with immediate effect
- [Radio Group](#) - Single selection
- [Select](#) - Dropdown selection
- [Form](#) - Form wrapper

---

## Changelog

### Version 1.0.0 (2025-12-30)
- Initial documentation following Spectrum 2 structure
- Added comprehensive usage guidelines
- Added accessibility documentation with ARIA
- Added design token references
- Added 6 real-world examples with indeterminate state

---

**Last Updated**: 2025-12-30  
**Component Location**: `src/components/ui/checkbox.tsx`  
**Primitive Wrapper**: N/A (use base component directly)
