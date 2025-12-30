# Dialog

**Version 1.0.0**

Dialogs are modal windows that appear on top of the main content, requiring user interaction before returning to the main flow. They focus user attention on important tasks or information.

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
- **Confirmation dialogs**: Confirm destructive or important actions
- **Forms**: Collect input without leaving context
- **Alerts**: Show critical information requiring acknowledgment
- **Details**: Display additional information or settings
- **Multi-step flows**: Guide users through processes
- **Selections**: Choose from options in focused context

### When Not to Use
- **Non-critical info**: Use [Popover](#) or [Tooltip](#) instead
- **Complex workflows**: Use full pages instead
- **Passive notifications**: Use [Toast](#) or [Alert](#) instead
- **Navigation**: Use proper navigation patterns
- **Always-visible content**: Use regular page content

---

## Anatomy

```
╔══════════════════════════════════════════╗
║  Dialog Title                       [×]  ║  ← Header with title and close button
║  Optional description text               ║
╟──────────────────────────────────────────╢
║                                          ║
║  Dialog Content                          ║  ← Main content area
║  (Form fields, text, media, etc.)        ║
║                                          ║
╟──────────────────────────────────────────╢
║                    [Cancel]  [Confirm]   ║  ← Footer with actions
╚══════════════════════════════════════════╝
        ← Backdrop/overlay behind dialog
```

**Component Parts:**
1. **Dialog** (Root) - Container/context provider
2. **DialogTrigger** - Button/element that opens dialog
3. **DialogOverlay** - Dark backdrop behind dialog
4. **DialogContent** - Main dialog container
5. **DialogHeader** - Title and description area
6. **DialogTitle** - Main heading (required for accessibility)
7. **DialogDescription** - Supporting text (optional but recommended)
8. **DialogFooter** - Action buttons area
9. **DialogClose** - Close button (X icon)

---

## Options

### Subcomponents

#### Dialog (Root)
Context provider and state manager. Wraps all dialog parts.

```typescript
<Dialog>
  {/* Dialog subcomponents */}
</Dialog>
```

**Props:**
- `open`: boolean - Controlled open state
- `onOpenChange`: function - Called when open state changes
- `defaultOpen`: boolean - Uncontrolled default state
- `modal`: boolean - Whether dialog is modal (default: true)

#### DialogTrigger
Element that triggers dialog opening.

```typescript
<DialogTrigger asChild>
  <Button>Open Dialog</Button>
</DialogTrigger>
```

**Design tokens:**
- Inherits from trigger element (typically Button)

#### DialogContent
Main dialog window with animations and close button.

```typescript
<DialogContent>
  {/* Dialog content */}
</DialogContent>
```

**Design tokens:**
- Background: `dialog-background-color-default` (`var(--card)`)
- Border: `dialog-border-color-default` (`var(--border)`)
- Border radius: `radius-lg` (14px)
- Shadow: `shadow-elevation-5`
- Max width: `max-w-lg` (32rem/512px default)
- Padding: `dialog-padding-200` (24px)

#### DialogHeader
Header area for title and description.

```typescript
<DialogHeader>
  <DialogTitle>Dialog Title</DialogTitle>
  <DialogDescription>Optional description</DialogDescription>
</DialogHeader>
```

**Layout:**
- Flex column with 8px gap
- Text center on mobile, left on desktop

#### DialogTitle
Primary heading for dialog (required for accessibility).

```typescript
<DialogTitle>Confirm Deletion</DialogTitle>
```

**Typography:**
- Semantic: `<h2>` heading element
- Font size: `text-lg` (18px)
- Font weight: `font-semibold`
- Line height: `leading-none`

#### DialogDescription
Supporting text below title.

```typescript
<DialogDescription>
  This action cannot be undone.
</DialogDescription>
```

**Design tokens:**
- Color: `muted-foreground-color-default` (`var(--muted-foreground)`)
- Font size: `text-sm` (14px)

#### DialogFooter
Bottom area for action buttons.

```typescript
<DialogFooter>
  <Button variant="outline">Cancel</Button>
  <Button>Confirm</Button>
</DialogFooter>
```

**Layout:**
- Flex layout
- Column-reverse on mobile, row on desktop
- Right-aligned actions
- 8px gap between buttons

#### DialogClose
Built-in close button (X icon in top-right).

```typescript
{/* Automatically included in DialogContent */}
{/* Or use manually: */}
<DialogClose asChild>
  <Button variant="outline">Close</Button>
</DialogClose>
```

#### DialogOverlay
Dark backdrop behind dialog.

```typescript
{/* Automatically included in DialogContent */}
```

**Design tokens:**
- Background: `dialog-overlay-color` (`rgba(0, 0, 0, 0.5)`)
- Backdrop blur: Optional glass effect

### Variants

#### Default Dialog
Standard modal dialog with solid background.

```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
  </DialogContent>
</Dialog>
```

#### Glass Dialog (from Design System)
Dialog with glass morphism effect.

```typescript
import { GlassDialog } from '@/design-system/primitives/glass';

<GlassDialog intensity="medium">
  <DialogTrigger asChild>
    <Button>Open Glass Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    {/* Content */}
  </DialogContent>
</GlassDialog>
```

#### Alert Dialog
Simplified confirmation dialog (destructive actions).

```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### States

- **Closed** - Hidden, not in DOM
- **Opening** - Fade in + zoom in animation
- **Open** - Fully visible
- **Closing** - Fade out + zoom out animation

---

## Behaviors

### Opening Animation
- Overlay: Fade in (`fade-in-0`)
- Content: Zoom in + fade in (`zoom-in-95`, `fade-in-0`)
- Duration: 200ms
- Easing: Smooth cubic-bezier

### Closing Animation
- Overlay: Fade out (`fade-out-0`)
- Content: Zoom out + fade out (`zoom-out-95`, `fade-out-0`)
- Duration: 200ms

### Focus Trap
- Focus moves to dialog when opened
- Focus trapped within dialog
- Tab cycles through interactive elements
- Returns focus to trigger on close

### Backdrop Click
- Clicking overlay closes dialog (default)
- Can be disabled with `modal={false}`

### Escape Key
- Press Escape to close dialog
- Standard keyboard behavior

### Scroll Lock
- Body scroll locked when dialog open
- Prevents background scrolling
- Restored on close

### Responsive Behavior
- Mobile: Full width minus 2rem margin
- Desktop: Fixed max-width (lg: 512px)
- Always centered in viewport
- Mobile actions stack vertically

---

## Usage Guidelines

### ✅ Do's

**Use for important actions that need confirmation**
```typescript
✅
<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">Delete Account</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete Account?</DialogTitle>
      <DialogDescription>
        This will permanently delete your account and all data.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Always include DialogTitle for accessibility**
```typescript
✅
<DialogHeader>
  <DialogTitle>Settings</DialogTitle>
</DialogHeader>
```

**Use DialogDescription for context**
```typescript
✅
<DialogHeader>
  <DialogTitle>Save Changes?</DialogTitle>
  <DialogDescription>
    Your changes will be saved to your profile.
  </DialogDescription>
</DialogHeader>
```

**Provide clear action buttons**
```typescript
✅
<DialogFooter>
  <Button variant="outline">Cancel</Button>
  <Button>Save Changes</Button>
</DialogFooter>
```

### ❌ Don'ts

**Don't nest dialogs**
```typescript
❌ 
<Dialog>
  <Dialog>
    {/* Nested dialog - confusing */}
  </Dialog>
</Dialog>

✅ Close first dialog, then open second
```

**Don't omit DialogTitle**
```typescript
❌
<DialogContent>
  <p>Content without title</p>  // Fails accessibility
</DialogContent>

✅
<DialogContent>
  <DialogHeader>
    <DialogTitle>Title</DialogTitle>
  </DialogHeader>
  <p>Content</p>
</DialogContent>
```

**Don't make dialogs too complex**
```typescript
❌ 
<DialogContent>
  {/* Multiple forms, tabs, complex navigation */}
</DialogContent>

✅ Use full page instead for complex workflows
```

**Don't use for non-critical info**
```typescript
❌ <Dialog><DialogContent>FYI: New feature!</DialogContent></Dialog>

✅ <Toast>FYI: New feature!</Toast>
```

**Don't hide the close button**
```typescript
❌ {/* Hiding X button without alternative */}

✅ Always provide a way to close (X button or Cancel button)
```

---

## Content Standards

### Titles

**Be clear and concise**
```typescript
✅ "Delete Project?"
✅ "Save Changes?"
✅ "Export Data"
❌ "Are you absolutely sure you want to proceed with deleting this project?"
```

**Use sentence case**
```typescript
✅ "Create new project"
❌ "Create New Project"  // Title case
```

**Make questions obvious**
```typescript
✅ "Delete account?"
✅ "Discard changes?"
❌ "Account deletion"  // Not a question
```

### Descriptions

**Explain consequences**
```typescript
✅ "This will permanently delete all your data. This action cannot be undone."
✅ "Your changes will be lost if you don't save them."
❌ "Are you sure?"  // Not descriptive
```

**Keep it brief but informative**
```typescript
✅ "This will remove the item from your library."
❌ "This action will initiate the process of removing the selected item from your personal library collection and cannot be reversed once completed."  // Too wordy
```

### Action Buttons

**Use action-oriented labels**
```typescript
✅ "Delete Project"
✅ "Save Changes"
✅ "Continue"
❌ "OK"
❌ "Yes"
❌ "Proceed"
```

**Be specific about the action**
```typescript
✅ "Delete 3 items"
✅ "Export as PDF"
❌ "Submit"
❌ "Confirm"
```

---

## Accessibility

### Keyboard Navigation
- **Tab**: Focus next element within dialog
- **Shift + Tab**: Focus previous element
- **Escape**: Close dialog
- **Enter**: Activate focused button
- Focus automatically moves to dialog on open
- Focus returns to trigger on close

### ARIA Attributes

**DialogTitle is required**
```typescript
<DialogContent aria-describedby="dialog-description">
  <DialogHeader>
    <DialogTitle id="dialog-title">Delete Account</DialogTitle>
    <DialogDescription id="dialog-description">
      This action cannot be undone.
    </DialogDescription>
  </DialogHeader>
</DialogContent>
```

**Modal behavior**
- `role="dialog"` automatically applied
- `aria-modal="true"` when modal
- `aria-labelledby` points to DialogTitle
- `aria-describedby` points to DialogDescription

### Focus Management
- Focus trap: Focus stays within dialog
- Initial focus: First focusable element or close button
- Return focus: Returns to trigger element on close
- Visible focus indicators on all interactive elements

### Screen Readers
- Dialog role announced when opened
- Title announced automatically
- Description associated via `aria-describedby`
- Close button has "Close" screen reader text
- All actions clearly labeled

### Color Contrast
- Title text: 7:1 contrast (AAA)
- Description text: 4.5:1 contrast (AA)
- Border: 3:1 contrast against background
- Buttons meet contrast requirements

### Touch Targets
- Close button: 44×44px minimum
- Action buttons: 44px height minimum
- Adequate spacing between elements

---

## Implementation

### Basic Dialog
```typescript
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

function BasicDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dialog Title</DialogTitle>
          <DialogDescription>
            Dialog description text goes here.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
```

### Confirmation Dialog
```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone. This will permanently delete your account.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive">Delete Account</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Form Dialog
```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button>Edit Profile</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit Profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile here.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="John Doe" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="john@example.com" />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Save Changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Controlled Dialog
```typescript
function ControlledDialog() {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Controlled Dialog</DialogTitle>
        </DialogHeader>
        <Button onClick={() => setOpen(false)}>
          Close Programmatically
        </Button>
      </DialogContent>
    </Dialog>
  );
}
```

### Glass Dialog
```typescript
import { GlassDialog } from '@/design-system/primitives/glass';

<GlassDialog intensity="medium">
  <DialogTrigger asChild>
    <Button>Open Glass Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Glass Morphism</DialogTitle>
      <DialogDescription>
        Dialog with backdrop blur effect
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</GlassDialog>
```

---

## Examples

### Delete Confirmation
```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button variant="destructive">
      <Trash className="w-4 h-4 mr-2" />
      Delete Project
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Delete Project?</DialogTitle>
      <DialogDescription>
        This will permanently delete "Website Redesign" and all associated files.
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive">
        Delete Project
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Settings Dialog
```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">
      <Settings className="w-4 h-4 mr-2" />
      Settings
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Settings</DialogTitle>
      <DialogDescription>
        Manage your account settings and preferences.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-6 py-4">
      <div className="space-y-4">
        <h3 className="font-medium">Notifications</h3>
        <div className="flex items-center justify-between">
          <Label htmlFor="email-notif">Email notifications</Label>
          <Switch id="email-notif" />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="push-notif">Push notifications</Label>
          <Switch id="push-notif" />
        </div>
      </div>
    </div>
    <DialogFooter>
      <Button>Save Preferences</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Create Item Dialog
```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button>
      <Plus className="w-4 h-4 mr-2" />
      New Project
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create New Project</DialogTitle>
      <DialogDescription>
        Enter project details to get started.
      </DialogDescription>
    </DialogHeader>
    <form className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="project-name">Project name</Label>
        <Input 
          id="project-name" 
          placeholder="Website Redesign"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input 
          id="description" 
          placeholder="A brief description"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="web">Web</SelectItem>
            <SelectItem value="mobile">Mobile</SelectItem>
            <SelectItem value="design">Design</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </form>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button type="submit">Create Project</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Share Dialog
```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">
      <Share className="w-4 h-4 mr-2" />
      Share
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Share Project</DialogTitle>
      <DialogDescription>
        Anyone with the link can view this project.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <div className="flex gap-2">
        <Input value="https://app.example.com/project/123" readOnly />
        <Button variant="outline">
          <Copy className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-2">
        <Label>Share via</Label>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Mail className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Twitter className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>
```

### Export Dialog
```typescript
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">
      <Download className="w-4 h-4 mr-2" />
      Export
    </Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Export Data</DialogTitle>
      <DialogDescription>
        Choose format and options for your export.
      </DialogDescription>
    </DialogHeader>
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Format</Label>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline">PDF</Button>
          <Button variant="outline">CSV</Button>
          <Button variant="outline">JSON</Button>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Date range</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Export</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Multi-step Dialog
```typescript
function MultiStepDialog() {
  const [step, setStep] = useState(1);
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Setup Wizard</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Setup - Step {step} of 3</DialogTitle>
          <DialogDescription>
            {step === 1 && "Basic information"}
            {step === 2 && "Preferences"}
            {step === 3 && "Confirmation"}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {step === 1 && (
            <div className="space-y-4">
              <Input placeholder="Name" />
              <Input placeholder="Email" type="email" />
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              {/* Preferences content */}
            </div>
          )}
          {step === 3 && (
            <div>
              <p>Review and confirm your settings.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>
              Next
            </Button>
          ) : (
            <Button>Finish</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Design Tokens Reference

```typescript
// From tokens/colors.ts
dialog-background-color-default: var(--card)
dialog-overlay-color: rgba(0, 0, 0, 0.5)
dialog-border-color-default: var(--border)

// From tokens/spacing.ts
dialog-padding-100: 1.5rem          // 24px
dialog-padding-200: 2rem            // 32px

// From tokens/effects.ts
shadow-elevation-5: 0 25px 50px rgba(0, 0, 0, 0.15), 0 12px 25px rgba(0, 0, 0, 0.08)
radius-lg: 0.875rem                 // 14px - Dialog border radius

// From tokens/motion.ts
duration-normal: 200ms              // Animation duration
easing-smooth: cubic-bezier(0.4, 0.0, 0.2, 1)
```

---

## Related Components

- [Sheet](#) - Slide-in panel (side drawer)
- [Popover](#) - Non-modal floating content
- [Alert](#) - Inline alerts
- [Toast](#) - Temporary notifications
- [GlassDialog](#) - Glass morphism variant

---

## Changelog

### Version 1.0.0 (2025-12-30)
- Initial documentation following Spectrum 2 structure
- Documented all 9 dialog subcomponents
- Added comprehensive usage guidelines
- Added accessibility documentation with ARIA details
- Added design token references
- Added 7 real-world examples including multi-step

---

**Last Updated**: 2025-12-30  
**Component Location**: `src/components/ui/dialog.tsx`  
**Primitive Wrapper**: `src/design-system/primitives/glass.tsx` (GlassDialog variant)
