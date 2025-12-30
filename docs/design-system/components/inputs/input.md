# Input

**Version 1.0.0**

Text inputs allow users to enter and edit text. They are used in forms and dialogs to collect user information.

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
- **Form fields**: Collect user information (name, email, address, etc.)
- **Search**: Allow users to enter search queries
- **Settings**: Configure text-based preferences
- **Filters**: Enter filter criteria for data lists
- **Comments/messages**: Capture user-generated content

### When Not to Use
- **Multi-line text**: Use [Textarea](#) instead
- **Predefined options**: Use [Select](#) or [Radio Group](#) instead
- **Numeric input**: Use specialized number input with steppers
- **Dates**: Use [Date Picker](#) instead
- **Rich text**: Use a rich text editor component

---

## Anatomy

```
┌─────────────────────────────────────────────┐
│  Label Text                           (i)   │  ← Label (optional but recommended)
│  ┌───────────────────────────────────────┐ │
│  │  Placeholder text              [Icon] │ │  ← Input field
│  └───────────────────────────────────────┘ │
│  Helper text or validation message         │  ← Helper/Error text
└─────────────────────────────────────────────┘
```

**Component Parts:**
1. **Container** - Border, background, padding
2. **Input field** - Text entry area
3. **Label** (optional) - Describes the input purpose
4. **Placeholder** (optional) - Example or hint text
5. **Helper text** (optional) - Additional guidance
6. **Icon** (optional) - Visual indicator or action
7. **Error message** (optional) - Validation feedback

---

## Options

### Types

#### Text (Default)
Standard single-line text input.

```typescript
<Input type="text" placeholder="Enter your name" />
```

**Design tokens:**
- Background: `input-background-color-default` (`var(--input-background)`)
- Border: `input-border-color-default` (`var(--border)`)
- Foreground: `input-foreground-color-default` (`var(--foreground)`)

#### Email
Email input with built-in validation.

```typescript
<Input type="email" placeholder="you@example.com" />
```

#### Password
Password input with obscured characters.

```typescript
<Input type="password" placeholder="Enter password" />
```

#### Search
Search input, often with clear button.

```typescript
<Input type="search" placeholder="Search..." />
```

#### Number
Numeric input (use carefully, standard text often better).

```typescript
<Input type="number" placeholder="Age" />
```

#### URL
URL input with validation.

```typescript
<Input type="url" placeholder="https://example.com" />
```

#### Tel
Telephone number input.

```typescript
<Input type="tel" placeholder="(555) 123-4567" />
```

### Sizes

```typescript
<Input className="h-8" />   // Small (32px)
<Input className="h-9" />   // Default (36px) - standard
<Input className="h-10" />  // Large (40px)
<Input className="h-12" />  // Extra Large (48px)
```

**Design tokens:**
- Small: `component-height-75` (32px)
- Default: `component-height-100` (36px)
- Large: `component-height-200` (40px)
- XL: `component-height-300` (48px)

### States

- **Default** - Normal resting state
- **Hover** - Mouse over (subtle border change)
- **Focus** - Active editing (`focus-visible:ring-2`, `focus-visible:border-ring`)
- **Filled** - Contains user input
- **Error** - Invalid input (`aria-invalid`, red border + ring)
- **Disabled** - Cannot interact (`disabled:opacity-50`, `disabled:cursor-not-allowed`)
- **Read-only** - Display only, no editing

---

## Behaviors

### Focus
- Shows focus ring: `focus-visible:ring-[3px] focus-visible:ring-ring/50`
- Border changes to ring color: `focus-visible:border-ring`
- Smooth transition: `transition-[color,box-shadow]`

### Validation (Error State)
- When `aria-invalid="true"` is set:
  - Border: `aria-invalid:border-destructive`
  - Ring: `aria-invalid:ring-destructive/20` (light) / `dark:aria-invalid:ring-destructive/40` (dark)
- Display error message below input
- Error message should be associated with `aria-describedby`

### Disabled
- Reduced opacity: `disabled:opacity-50`
- No pointer events: `disabled:pointer-events-none`
- Cannot be focused or edited
- Cursor changes to not-allowed: `disabled:cursor-not-allowed`

### Placeholder
- Shows when input is empty
- Muted color: `placeholder:text-muted-foreground`
- Disappears when user starts typing
- Should not be used as label replacement

### Text Selection
- Selected text has accent background: `selection:bg-primary`
- Selected text has contrasting foreground: `selection:text-primary-foreground`

### Auto-fill Behavior
- Browser auto-fill supported
- Styles preserved with auto-filled values

---

## Usage Guidelines

### ✅ Do's

**Always include a label**
```typescript
✅ 
<div>
  <Label htmlFor="email">Email address</Label>
  <Input id="email" type="email" />
</div>
```

**Use appropriate input types**
```typescript
✅ <Input type="email" />  // For emails
✅ <Input type="tel" />    // For phone numbers
✅ <Input type="url" />    // For URLs
```

**Provide helpful placeholder text**
```typescript
✅ <Input placeholder="e.g. john@example.com" />
✅ <Input placeholder="MM/DD/YYYY" />
```

**Show clear error messages**
```typescript
✅
<Input aria-invalid="true" aria-describedby="email-error" />
<p id="email-error" className="text-sm text-destructive">
  Please enter a valid email address
</p>
```

**Use helper text for additional guidance**
```typescript
✅
<Input type="password" aria-describedby="password-help" />
<p id="password-help" className="text-sm text-muted-foreground">
  Must be at least 8 characters
</p>
```

### ❌ Don'ts

**Don't use placeholder as label replacement**
```typescript
❌ <Input placeholder="Email" />  // No visible label

✅ 
<Label htmlFor="email">Email</Label>
<Input id="email" placeholder="you@example.com" />
```

**Don't use vague error messages**
```typescript
❌ "Invalid input"
❌ "Error"
✅ "Email must include an @ symbol"
✅ "Password must be at least 8 characters"
```

**Don't make inputs too narrow**
```typescript
❌ <Input className="w-20" />  // Too narrow for typical content

✅ <Input className="w-full" />  // Full width on mobile
✅ <Input className="w-full md:w-80" />  // Responsive width
```

**Don't disable inputs without explanation**
```typescript
❌ <Input disabled />  // Why is it disabled?

✅
<Input disabled aria-describedby="input-disabled-reason" />
<p id="input-disabled-reason" className="text-sm text-muted-foreground">
  This field is auto-generated and cannot be edited
</p>
```

---

## Content Standards

### Labels

**Be concise and descriptive**
```typescript
✅ "Email address"
✅ "Full name"
✅ "Company"
❌ "Enter your email address here"
❌ "Input"
```

**Use sentence case**
```typescript
✅ "Phone number"
❌ "Phone Number"  // Title case
❌ "PHONE NUMBER"  // All caps
```

**Don't use colons**
```typescript
✅ "Email address"
❌ "Email address:"
```

### Placeholders

**Provide examples, not instructions**
```typescript
✅ "john@example.com"
✅ "(555) 123-4567"
❌ "Enter your email"  // Use label for instructions
❌ "Email"  // Don't repeat label
```

**Use realistic examples**
```typescript
✅ "e.g. Acme Corporation"
❌ "Your company name"
❌ "XXX Corporation"
```

### Helper Text

**Keep it brief and helpful**
```typescript
✅ "We'll never share your email with anyone else"
✅ "Must be at least 8 characters"
❌ "This is the field where you enter your email address which we will use to contact you"
```

### Error Messages

**Be specific and actionable**
```typescript
✅ "Email must include an @ symbol"
✅ "Password must contain at least one number"
✅ "This field is required"
❌ "Invalid"
❌ "Error"
❌ "Wrong input"
```

---

## Accessibility

### Keyboard Navigation
- **Tab**: Focus next input
- **Shift + Tab**: Focus previous input
- **Escape**: Clear input (in some contexts)
- **Enter**: Submit form (if in form)

### ARIA Attributes

**Required fields**
```typescript
<Label htmlFor="email">
  Email address <span aria-label="required">*</span>
</Label>
<Input id="email" required aria-required="true" />
```

**Error states**
```typescript
<Input 
  id="email"
  aria-invalid="true" 
  aria-describedby="email-error"
/>
<p id="email-error" role="alert">
  Please enter a valid email address
</p>
```

**Helper text**
```typescript
<Input 
  id="password"
  type="password"
  aria-describedby="password-help"
/>
<p id="password-help">
  Must be at least 8 characters
</p>
```

**Disabled state**
```typescript
<Input disabled aria-disabled="true" />
```

### Labels
- Every input MUST have an associated label
- Use `<Label htmlFor="input-id">` with matching `id` on input
- For icon-only inputs (like search), use `aria-label`
- Never rely solely on placeholder text for labeling

### Focus Management
- All inputs are keyboard focusable by default
- Focus ring clearly visible: `ring-[3px] ring-ring/50`
- Focus never trapped unless in modal/dialog
- Tab order follows visual order

### Screen Readers
- Input role automatically provided by `<input>` element
- Label text announced when input receives focus
- Type attribute announces input purpose (e.g., "email field")
- Error messages announced when `role="alert"` is used
- Helper text announced via `aria-describedby`

### Color Contrast
- Input text: 7:1 contrast ratio (AAA)
- Placeholder text: 4.5:1 contrast ratio (AA)
- Error text: 4.5:1 contrast ratio minimum
- Border has 3:1 contrast against background

### Touch Targets
- Minimum 44×44px on mobile
- Default input height: 36px (desktop), should be 40px+ on mobile
- Consider using `h-10` or `h-12` for mobile-first designs

---

## Implementation

### Basic Usage
```typescript
import { Input } from '@/components/ui/input';

function MyForm() {
  return (
    <Input 
      type="text" 
      placeholder="Enter text..." 
    />
  );
}
```

### With Label
```typescript
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function MyForm() {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email address</Label>
      <Input 
        id="email"
        type="email" 
        placeholder="you@example.com" 
      />
    </div>
  );
}
```

### With Error State
```typescript
<div className="space-y-2">
  <Label htmlFor="email">Email address</Label>
  <Input 
    id="email"
    type="email"
    aria-invalid="true"
    aria-describedby="email-error"
  />
  <p id="email-error" className="text-sm text-destructive">
    Please enter a valid email address
  </p>
</div>
```

### With Helper Text
```typescript
<div className="space-y-2">
  <Label htmlFor="password">Password</Label>
  <Input 
    id="password"
    type="password"
    aria-describedby="password-help"
  />
  <p id="password-help" className="text-sm text-muted-foreground">
    Must be at least 8 characters
  </p>
</div>
```

### Disabled State
```typescript
<Input disabled placeholder="Cannot edit" />
```

### Read-only State
```typescript
<Input readOnly value="Read-only value" />
```

### With Icon (Custom)
```typescript
import { Search } from 'lucide-react';

<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
  <Input className="pl-10" placeholder="Search..." />
</div>
```

### Different Sizes
```typescript
<Input className="h-8" placeholder="Small" />
<Input className="h-9" placeholder="Default" />
<Input className="h-10" placeholder="Large" />
<Input className="h-12" placeholder="Extra Large" />
```

### Full-width Responsive
```typescript
<Input className="w-full md:w-96" placeholder="Responsive width" />
```

---

## Examples

### Login Form
```typescript
<form className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="login-email">Email</Label>
    <Input 
      id="login-email"
      type="email" 
      placeholder="you@example.com"
      required
    />
  </div>
  
  <div className="space-y-2">
    <Label htmlFor="login-password">Password</Label>
    <Input 
      id="login-password"
      type="password"
      required
    />
  </div>
  
  <Button type="submit" className="w-full">
    Sign in
  </Button>
</form>
```

### Search Bar
```typescript
import { Search } from 'lucide-react';

<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
  <Input 
    type="search"
    placeholder="Search..."
    className="pl-10"
    aria-label="Search"
  />
</div>
```

### Form with Validation
```typescript
function FormExample() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  
  const isValid = email.includes('@');
  
  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email address</Label>
      <Input 
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-invalid={!isValid && email !== ''}
        aria-describedby={error ? "email-error" : undefined}
      />
      {!isValid && email !== '' && (
        <p id="email-error" className="text-sm text-destructive">
          Please enter a valid email address
        </p>
      )}
    </div>
  );
}
```

### Settings Form
```typescript
<div className="space-y-6">
  <div className="space-y-2">
    <Label htmlFor="username">Username</Label>
    <Input 
      id="username"
      placeholder="johndoe"
      aria-describedby="username-help"
    />
    <p id="username-help" className="text-sm text-muted-foreground">
      This is your public display name
    </p>
  </div>
  
  <div className="space-y-2">
    <Label htmlFor="bio">Bio</Label>
    <Input 
      id="bio"
      placeholder="Tell us about yourself"
      aria-describedby="bio-help"
    />
    <p id="bio-help" className="text-sm text-muted-foreground">
      Max 160 characters
    </p>
  </div>
</div>
```

### Payment Form
```typescript
<div className="grid gap-4">
  <div className="space-y-2">
    <Label htmlFor="card-name">Name on card</Label>
    <Input 
      id="card-name"
      placeholder="John Doe"
      required
    />
  </div>
  
  <div className="space-y-2">
    <Label htmlFor="card-number">Card number</Label>
    <Input 
      id="card-number"
      type="text"
      placeholder="1234 5678 9012 3456"
      maxLength={19}
      required
    />
  </div>
  
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="card-expiry">Expiry</Label>
      <Input 
        id="card-expiry"
        placeholder="MM/YY"
        maxLength={5}
        required
      />
    </div>
    
    <div className="space-y-2">
      <Label htmlFor="card-cvc">CVC</Label>
      <Input 
        id="card-cvc"
        type="text"
        placeholder="123"
        maxLength={3}
        required
      />
    </div>
  </div>
</div>
```

---

## Design Tokens Reference

```typescript
// From tokens/colors.ts
input-background-color-default: var(--input-background)
input-border-color-default: var(--border)
input-border-color-focus: var(--ring)
input-foreground-color-default: var(--foreground)

// From tokens/spacing.ts
input-edge-to-text-75: 0.5rem      // 8px - Compact
input-edge-to-text-100: 0.75rem    // 12px - Default
input-edge-to-text-200: 1rem       // 16px - Comfortable

component-height-75: 2rem          // 32px - Small
component-height-100: 2.25rem      // 36px - Default
component-height-200: 2.5rem       // 40px - Large
component-height-300: 3rem         // 48px - Extra Large

// From tokens/effects.ts
shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.08)
radius-md: 0.5rem                  // 8px - Default border radius
```

---

## Related Components

- [Textarea](#) - Multi-line text input
- [Select](#) - Choose from predefined options
- [Label](#) - Input labels
- [Form](#) - Form wrapper with validation

---

## Changelog

### Version 1.0.0 (2025-12-30)
- Initial documentation following Spectrum 2 structure
- Added comprehensive usage guidelines
- Added accessibility documentation
- Added design token references
- Added validation examples

---

**Last Updated**: 2025-12-30  
**Component Location**: `src/components/ui/input.tsx`  
**Primitive Wrapper**: N/A (use base component directly)
