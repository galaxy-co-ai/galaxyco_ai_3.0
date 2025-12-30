# Button

**Version 1.0.0**

Buttons allow users to perform an action or navigate to another page. They have multiple styles for various needs and are ideal for calling attention to where a user needs to do something in order to move forward in a flow.

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
- **Primary actions**: Use for the most important action on a page (e.g., "Save", "Submit", "Continue")
- **Navigation**: Use to navigate users to another page or section
- **Form submission**: Use to submit forms or trigger actions
- **Call-to-actions**: Use to drive user engagement (e.g., "Get Started", "Learn More")

### When Not to Use
- **Navigation within content**: Use [Link](#) instead
- **Opening menus**: Use [Action Button](#) instead
- **Multiple simultaneous actions**: Use [Button Group](#) instead

---

## Anatomy

```
┌─────────────────────────────┐
│  [Icon]  Label Text         │  ← Button container
└─────────────────────────────┘
     │         │
     │         └─ Label (required unless icon-only)
     └─ Icon (optional)
```

**Component Parts:**
1. **Container** - Background, border, padding, rounded corners
2. **Label** - Text describing the action
3. **Icon** (optional) - Visual reinforcement of action

---

## Options

### Variants

#### Default (Primary)
Most common button style. Use for primary actions.

```typescript
<Button variant="default">Save Changes</Button>
```

**Design tokens:**
- Background: `button-background-color-default` (`var(--primary)`)
- Foreground: `button-foreground-color-default` (`var(--primary-foreground)`)
- Border: `button-border-color-default` (`var(--accent-cyan-border)`)

#### CTA (Call-to-Action)
Extra emphasis for marketing CTAs.

```typescript
<Button variant="cta">Get Started</Button>
```

#### Surface
Subtle with soft elevation. Use for secondary actions.

```typescript
<Button variant="surface">Cancel</Button>
```

#### Destructive
For dangerous actions like delete.

```typescript
<Button variant="destructive">Delete Account</Button>
```

#### Outline
Low emphasis with border only.

```typescript
<Button variant="outline">Learn More</Button>
```

#### Ghost
No background, hover state only.

```typescript
<Button variant="ghost">View Details</Button>
```

### Sizes

```typescript
<Button size="sm">Small</Button>      // h-8, 32px
<Button size="default">Default</Button> // h-9, 36px
<Button size="lg">Large</Button>      // h-10, 40px
<Button size="icon">🔍</Button>       // 36×36px square
```

**Design tokens:**
- Small: `component-height-75` (32px)
- Default: `component-height-100` (36px)  
- Large: `component-height-200` (40px)

### Icon Support

```typescript
// Icon + Label
<Button>
  <Share className="w-4 h-4" />
  Share
</Button>

// Icon only (label becomes tooltip)
<Button size="icon" aria-label="Share">
  <Share className="w-4 h-4" />
</Button>
```

### States

- **Default** - Normal resting state
- **Hover** - Mouse over (`hover:-translate-y-px`, `hover:shadow-soft-hover`)
- **Active** - Click/press (`active:scale-[0.98]`)
- **Focus** - Keyboard focus (`focus-visible:ring-2`)
- **Disabled** - Cannot interact (`disabled:opacity-40`)

---

## Behaviors

### Hover
- Translates up 1px: `hover:-translate-y-px`
- Enhanced shadow: `hover:shadow-soft-hover`
- Slight color change: `hover:bg-primary/90`
- Transition: `transition-all duration-150`

### Active (Press)
- Scales down slightly: `active:scale-[0.98]`
- Provides tactile feedback

### Focus
- Shows focus ring: `focus-visible:ring-2 focus-visible:ring-ring`
- Offset from button: `focus-visible:ring-offset-2`

### Disabled
- Reduced opacity: `disabled:opacity-40`
- No pointer events: `disabled:pointer-events-none`
- No hover/active states

### Text Overflow
When text is too long, button automatically wraps to maintain readability. Consider shorter labels to avoid wrapping.

### Minimum Width
Buttons maintain a minimum width to ensure clickability and visual balance.

---

## Usage Guidelines

### ✅ Do's

**Use clear, action-oriented labels**
```typescript
✅ <Button>Save Changes</Button>
✅ <Button>Create Project</Button>
✅ <Button>Send Message</Button>
```

**Use appropriate variants for hierarchy**
```typescript
✅ <Button variant="default">Submit</Button>  // Primary
✅ <Button variant="outline">Cancel</Button>  // Secondary
```

**Use icons when they add clarity**
```typescript
✅ <Button><Share /> Share</Button>
✅ <Button><Download /> Download Report</Button>
```

**Ensure sufficient color contrast**
```typescript
✅ Default button has 4.5:1 contrast minimum
```

### ❌ Don'ts

**Don't use vague labels**
```typescript
❌ <Button>OK</Button>
❌ <Button>Click Here</Button>
❌ <Button>Submit</Button> // Too generic
```

**Don't override button colors**
```typescript
❌ <Button className="bg-yellow-500">Click</Button>
// Use semantic variants instead
```

**Don't use too many primary buttons**
```typescript
❌ // Multiple primary buttons compete
<Button variant="default">Action 1</Button>
<Button variant="default">Action 2</Button>
<Button variant="default">Action 3</Button>

✅ // Clear hierarchy
<Button variant="default">Primary Action</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Tertiary</Button>
```

**Don't use decorative icons**
```typescript
❌ <Button><Sparkles /> Save</Button> // Icon doesn't add meaning
✅ <Button><Save /> Save</Button>     // Icon reinforces action
```

---

## Content Standards

### Be Concise
Button text should be 1-2 words, maximum 4 words, fewer than 20 characters.

```typescript
✅ "Save"
✅ "Get Started"
✅ "Create Project"
❌ "Click here to save your changes"
```

### Use Verbs
Labels should describe actions, not states.

```typescript
✅ "Close"
✅ "Agree"
✅ "Connect"
❌ "Done"
❌ "Yes"
❌ "OK"
```

### Use Sentence Case
Always use sentence case, never title case or all caps.

```typescript
✅ "Get started"
❌ "Get Started"  // Title case
❌ "GET STARTED"  // All caps
```

### Be Specific
Clearly state what will happen when clicked.

```typescript
✅ "Sign up"      // Clear action
❌ "Submit"       // Too vague
✅ "Delete account"  // Specific and clear
❌ "Remove"       // What gets removed?
```

---

## Accessibility

### Keyboard Navigation
- **Tab**: Focus next button
- **Shift + Tab**: Focus previous button
- **Enter or Space**: Activate button
- **Escape**: Cancel (if in dialog/modal)

### ARIA Attributes
```typescript
// Icon-only buttons MUST have aria-label
<Button size="icon" aria-label="Close dialog">
  <X />
</Button>

// Disabled state
<Button disabled aria-disabled="true">
  Save
</Button>

// Loading state
<Button aria-busy="true" disabled>
  <Loader className="animate-spin" />
  Saving...
</Button>
```

### Focus Management
- All buttons are keyboard focusable by default
- Focus ring clearly visible: `ring-2 ring-ring ring-offset-2`
- Focus never trapped unless in modal/dialog
- Tab order follows visual order

### Screen Readers
- Button role automatically provided by `<button>` element
- Label text announced by screen readers
- Icon-only buttons use `aria-label` for context
- Disabled state announced automatically

### Color Contrast
- Default button: 7:1 contrast ratio (AAA)
- Secondary button: 4.5:1 contrast ratio (AA)
- All variants meet WCAG 2.1 AA minimum (4.5:1 text, 3:1 UI)
- Hover/focus states maintain contrast

### Touch Targets
- Minimum 44×44px on mobile
- Default button height: 36px (desktop), 40px (mobile)
- Large button: 40px minimum

---

## Implementation

### Basic Usage
```typescript
import { Button } from '@/components/ui/button';

function MyComponent() {
  return (
    <Button onClick={() => console.log('Clicked!')}>
      Click me
    </Button>
  );
}
```

### With Galaxy Primitive
```typescript
import { GalaxyButton } from '@/design-system/primitives';

function MyComponent() {
  return (
    <GalaxyButton>
      Click me
    </GalaxyButton>
  );
}
```

### All Variants
```typescript
<Button variant="default">Default</Button>
<Button variant="cta">Call to Action</Button>
<Button variant="surface">Surface</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
```

### All Sizes
```typescript
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Plus /></Button>
```

### With Icons
```typescript
import { Share, Download, Trash } from 'lucide-react';

<Button>
  <Share className="w-4 h-4" />
  Share
</Button>

<Button variant="destructive">
  <Trash className="w-4 h-4" />
  Delete
</Button>
```

### Icon Only
```typescript
<Button size="icon" aria-label="Share">
  <Share className="w-4 h-4" />
</Button>
```

### Disabled State
```typescript
<Button disabled>
  Cannot Click
</Button>
```

### Loading State
```typescript
<Button disabled>
  <Loader2 className="w-4 h-4 animate-spin" />
  Loading...
</Button>
```

### As Link
```typescript
<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>
```

---

## Examples

### Form Actions
```typescript
<div className="flex justify-end gap-2">
  <Button variant="outline">Cancel</Button>
  <Button type="submit">Save Changes</Button>
</div>
```

### Dialog Actions
```typescript
<DialogFooter>
  <Button variant="outline" onClick={onClose}>
    Cancel
  </Button>
  <Button variant="destructive" onClick={onDelete}>
    <Trash className="w-4 h-4" />
    Delete
  </Button>
</DialogFooter>
```

### Card Actions
```typescript
<Card>
  <CardHeader>
    <CardTitle>Project Name</CardTitle>
  </CardHeader>
  <CardFooter className="flex justify-between">
    <Button variant="ghost">View Details</Button>
    <Button>Open Project</Button>
  </CardFooter>
</Card>
```

### Button Group
```typescript
<div className="flex gap-2">
  <Button variant="default">Save</Button>
  <Button variant="outline">Save and Close</Button>
  <Button variant="ghost" size="icon">
    <MoreHorizontal />
  </Button>
</div>
```

---

## Design Tokens Reference

```typescript
// From tokens/colors.ts
button-background-color-default: var(--primary)
button-background-color-hover: var(--primary)/90
button-foreground-color-default: var(--primary-foreground)
button-border-color-default: var(--accent-cyan-border)

// From tokens/spacing.ts
button-edge-to-text-75: 0.75rem    // 12px - Small
button-edge-to-text-100: 1rem      // 16px - Default
button-edge-to-text-200: 1.5rem    // 24px - Large

component-height-75: 2rem          // 32px
component-height-100: 2.25rem      // 36px
component-height-200: 2.5rem       // 40px

// From tokens/effects.ts
shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.08)
shadow-soft-hover: 0 4px 16px rgba(0, 0, 0, 0.12)

// From tokens/motion.ts
duration-normal: 200ms
easing-smooth: cubic-bezier(0.4, 0.0, 0.2, 1)
```

---

## Related Components

- [Action Button](#) - Icon-only buttons with dropdown
- [Button Group](#) - Multiple buttons grouped together
- [Link](#) - Text links for navigation

---

## Changelog

### Version 1.0.0 (2025-12-30)
- Initial documentation following Spectrum 2 structure
- Added comprehensive usage guidelines
- Added accessibility documentation
- Added design token references

---

**Last Updated**: 2025-12-30  
**Component Location**: `src/components/ui/button.tsx`  
**Primitive Wrapper**: `src/design-system/primitives/index.ts`
