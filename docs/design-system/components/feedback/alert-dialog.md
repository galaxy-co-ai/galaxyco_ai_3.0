# Alert Dialog

**Version 1.0.0**

A modal dialog that interrupts the user with critical information or requires an immediate response. Alert dialogs demand attention and should be used sparingly for important confirmations or warnings.

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
- **Destructive actions**: Confirm deletion, data loss, or irreversible changes
- **Critical warnings**: Alert users to important consequences
- **Required decisions**: Force explicit choice before proceeding
- **Error confirmations**: Acknowledge critical errors
- **Security confirmations**: Verify sensitive operations
- **Exit confirmations**: Prevent accidental data loss

### When Not to Use
- **Non-blocking messages**: Use Toast for notifications
- **Optional information**: Use regular Dialog
- **Form collection**: Use Dialog or Sheet for forms
- **Frequent interruptions**: Avoid dialog fatigue
- **Simple confirmations**: Consider inline confirmations
- **Navigation warnings**: Use browser native prompts

---

## Anatomy

```
┌────────────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← Overlay
│ ▓▓                                      ▓▓ │
│ ▓▓  ┌────────────────────────────────┐ ▓▓ │
│ ▓▓  │ Alert Dialog Title             │ ▓▓ │ ← AlertDialogHeader
│ ▓▓  │                                │ ▓▓ │
│ ▓▓  │ This is the description text   │ ▓▓ │ ← AlertDialogDescription
│ ▓▓  │ explaining the action that     │ ▓▓ │
│ ▓▓  │ will occur.                    │ ▓▓ │
│ ▓▓  │                                │ ▓▓ │
│ ▓▓  │        [ Cancel ] [ Confirm ]  │ ▓▓ │ ← AlertDialogFooter
│ ▓▓  └────────────────────────────────┘ ▓▓ │   (Cancel & Action buttons)
│ ▓▓                ↑                    ▓▓ │
│ ▓▓          AlertDialogContent        ▓▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└────────────────────────────────────────────┘
```

**Component Parts:**
1. **AlertDialog** - Root container (manages open state)
2. **AlertDialogTrigger** - Button that opens the dialog
3. **AlertDialogPortal** - Renders content in a portal
4. **AlertDialogOverlay** - Dark backdrop (blocks interaction)
5. **AlertDialogContent** - Main dialog container
6. **AlertDialogHeader** - Container for title and description
7. **AlertDialogTitle** - Dialog heading
8. **AlertDialogDescription** - Explanation text
9. **AlertDialogFooter** - Container for action buttons
10. **AlertDialogAction** - Primary action button
11. **AlertDialogCancel** - Cancel/dismiss button

---

## Components

### AlertDialog (Root)

The root container that manages dialog state.

```typescript
<AlertDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  defaultOpen={false}
>
  {/* Dialog components */}
</AlertDialog>
```

**Props:**
- `open?: boolean` - Controlled open state
- `onOpenChange?: (open: boolean) => void` - Open state change handler
- `defaultOpen?: boolean` - Uncontrolled default open state
- All standard div attributes

### AlertDialogTrigger

Button that opens the alert dialog.

```typescript
<AlertDialogTrigger asChild>
  <Button variant="destructive">Delete</Button>
</AlertDialogTrigger>
```

**Props:**
- `asChild?: boolean` - Merge props with child element
- All button attributes

**Usage:**
- Use `asChild` to render your own button component
- Without `asChild`, renders a basic button

### AlertDialogPortal

Renders dialog content in a portal (outside normal DOM hierarchy).

```typescript
<AlertDialogPortal>
  {/* AlertDialogOverlay and AlertDialogContent */}
</AlertDialogPortal>
```

**Props:**
- `container?: HTMLElement` - Target container (default: document.body)
- `forceMount?: boolean` - Force mount for animation libraries

**Note:** Usually not used directly; AlertDialogContent includes it automatically.

### AlertDialogOverlay

Semi-transparent backdrop that blocks interaction with page content.

```typescript
<AlertDialogOverlay />
```

**Design tokens:**
- Background: `bg-black/50` (50% opacity black)
- Z-index: `z-50`
- Position: `fixed inset-0`
- Animation: Fade in/out

**Note:** Usually not used directly; AlertDialogContent includes it automatically.

### AlertDialogContent

Main dialog container with content.

```typescript
<AlertDialogContent className="sm:max-w-[425px]">
  <AlertDialogHeader>
    {/* Title and description */}
  </AlertDialogHeader>
  <AlertDialogFooter>
    {/* Action buttons */}
  </AlertDialogFooter>
</AlertDialogContent>
```

**Design tokens:**
- Background: `bg-background`
- Border: `border`
- Border radius: `rounded-lg` (12px)
- Shadow: `shadow-lg`
- Padding: `p-6` (1.5rem)
- Gap: `gap-4` (1rem)
- Max width (mobile): `max-w-[calc(100%-2rem)]`
- Max width (desktop): `sm:max-w-lg` (32rem)
- Z-index: `z-50`
- Position: `fixed top-[50%] left-[50%]` with centering transform

**Animations:**
- **Open**: `fade-in-0 zoom-in-95` (200ms)
- **Close**: `fade-out-0 zoom-out-95` (200ms)

### AlertDialogHeader

Container for title and description.

```typescript
<AlertDialogHeader>
  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
  <AlertDialogDescription>
    This action cannot be undone.
  </AlertDialogDescription>
</AlertDialogHeader>
```

**Design tokens:**
- Layout: `flex flex-col`
- Gap: `gap-2` (0.5rem)
- Text align (mobile): `text-center`
- Text align (desktop): `sm:text-left`

### AlertDialogTitle

Dialog heading (required for accessibility).

```typescript
<AlertDialogTitle>Delete account</AlertDialogTitle>
```

**Design tokens:**
- Font size: `text-lg` (1.125rem)
- Font weight: `font-semibold` (600)

**Accessibility:**
- Automatically linked via `aria-labelledby`
- Required for screen readers

### AlertDialogDescription

Explanation of the action's consequences (required for accessibility).

```typescript
<AlertDialogDescription>
  This will permanently delete your account and all associated data.
  This action cannot be undone.
</AlertDialogDescription>
```

**Design tokens:**
- Font size: `text-sm` (0.875rem)
- Color: `text-muted-foreground`

**Accessibility:**
- Automatically linked via `aria-describedby`
- Required for screen readers

### AlertDialogFooter

Container for action buttons.

```typescript
<AlertDialogFooter>
  <AlertDialogCancel>Cancel</AlertDialogCancel>
  <AlertDialogAction>Continue</AlertDialogAction>
</AlertDialogFooter>
```

**Design tokens:**
- Layout (mobile): `flex flex-col-reverse`
- Layout (desktop): `sm:flex-row sm:justify-end`
- Gap: `gap-2` (0.5rem)

**Button order:**
- Mobile: Action on top, Cancel below (reverse order for thumb reach)
- Desktop: Cancel left, Action right (standard convention)

### AlertDialogAction

Primary action button (auto-styled with button variant).

```typescript
<AlertDialogAction>Confirm</AlertDialogAction>

// With destructive styling
<AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }))}>
  Delete
</AlertDialogAction>
```

**Design tokens:**
- Inherits from Button component (default variant)
- Common overrides: `variant="destructive"` for dangerous actions

**Behavior:**
- Automatically closes dialog when clicked
- Use `onClick` for async operations

### AlertDialogCancel

Cancel/dismiss button (auto-styled with outline variant).

```typescript
<AlertDialogCancel>Cancel</AlertDialogCancel>
```

**Design tokens:**
- Inherits from Button component (outline variant)
- Default styling: `buttonVariants({ variant: "outline" })`

**Behavior:**
- Automatically closes dialog when clicked
- Also triggered by Escape key or overlay click

---

## Variants

### Confirmation Dialog (Default)

```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button>Proceed</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action will update your settings.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Destructive Dialog

```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete account</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete your account and all data.
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        className={cn(buttonVariants({ variant: "destructive" }))}
      >
        Delete account
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Warning Dialog

```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="outline">
      <AlertTriangle className="size-4 mr-2" />
      Show warning
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle className="flex items-center gap-2">
        <AlertTriangle className="size-5 text-warning" />
        Warning
      </AlertDialogTitle>
      <AlertDialogDescription>
        You have unsaved changes. Leaving this page will discard them.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Stay on page</AlertDialogCancel>
      <AlertDialogAction>Leave page</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## States

### Open States

```typescript
// Uncontrolled
<AlertDialog defaultOpen={false}>

// Controlled
const [open, setOpen] = useState(false);
<AlertDialog open={open} onOpenChange={setOpen}>
```

### Loading State (Async Actions)

```typescript
function DeleteAccountDialog() {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAccount();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete account</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            {isDeleting && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Disabled Buttons

```typescript
<AlertDialogFooter>
  <AlertDialogCancel disabled>Cancel</AlertDialogCancel>
  <AlertDialogAction disabled>Confirm</AlertDialogAction>
</AlertDialogFooter>
```

---

## Usage Guidelines

### ✅ Do's

- **Use for critical actions**: Reserve for important, irreversible decisions
  ```typescript
  // Good - Destructive action
  <AlertDialogTitle>Delete project</AlertDialogTitle>
  <AlertDialogDescription>
    This will permanently delete the project and all files.
  </AlertDialogDescription>
  ```

- **Provide clear consequences**: Explain what will happen
  ```typescript
  <AlertDialogDescription>
    You will lose access to all team resources. This cannot be undone.
  </AlertDialogDescription>
  ```

- **Use action-oriented button labels**: Be specific
  ```typescript
  ✅ <AlertDialogAction>Delete account</AlertDialogAction>
  ✅ <AlertDialogAction>Continue without saving</AlertDialogAction>
  ❌ <AlertDialogAction>OK</AlertDialogAction>
  ❌ <AlertDialogAction>Yes</AlertDialogAction>
  ```

- **Make cancel button safe and obvious**: Default to cancel
  ```typescript
  <AlertDialogFooter>
    <AlertDialogCancel>Cancel</AlertDialogCancel>
    <AlertDialogAction>Confirm</AlertDialogAction>
  </AlertDialogFooter>
  ```

- **Use destructive variant for dangerous actions**:
  ```typescript
  <AlertDialogAction
    className={cn(buttonVariants({ variant: "destructive" }))}
  >
    Delete
  </AlertDialogAction>
  ```

- **Keep content concise**: 1-3 sentences maximum
  ```typescript
  <AlertDialogDescription>
    This will permanently delete your account. This action cannot be undone.
  </AlertDialogDescription>
  ```

### ❌ Don'ts

- **Don't use for routine actions**: Avoid dialog fatigue
  ```typescript
  // Bad - Not critical enough
  <AlertDialogTitle>Submit form?</AlertDialogTitle>
  
  // Good - Just submit the form
  ```

- **Don't stack alert dialogs**: One at a time
  ```typescript
  // Bad - Dialog triggering another dialog
  <AlertDialogAction onClick={() => setShowAnotherDialog(true)}>
  ```

- **Don't omit consequences**: Users need context
  ```typescript
  // Bad - Unclear consequences
  <AlertDialogDescription>
    Are you sure?
  </AlertDialogDescription>
  
  // Good - Clear consequences
  <AlertDialogDescription>
    This will permanently delete 50 files and cannot be undone.
  </AlertDialogDescription>
  ```

- **Don't use generic button labels**:
  ```typescript
  // Bad
  <AlertDialogAction>OK</AlertDialogAction>
  <AlertDialogCancel>No</AlertDialogCancel>
  
  // Good
  <AlertDialogAction>Delete project</AlertDialogAction>
  <AlertDialogCancel>Keep project</AlertDialogCancel>
  ```

- **Don't block for non-critical info**: Use Toast or Dialog
  ```typescript
  // Bad - Notification doesn't need alert dialog
  <AlertDialogTitle>Success!</AlertDialogTitle>
  
  // Good - Use Toast for success messages
  toast.success("Changes saved");
  ```

- **Don't require reading long text**: Keep it scannable
  ```typescript
  // Bad - Too much text
  <AlertDialogDescription>
    {/* 10 paragraphs of legal text */}
  </AlertDialogDescription>
  
  // Good - Link to details
  <AlertDialogDescription>
    This will delete your account. <Link>Learn more</Link>
  </AlertDialogDescription>
  ```

---

## Content Standards

### Titles

**Structure:**
- Clear, direct statements or questions
- 2-6 words maximum
- Sentence case
- No punctuation (unless question)

**Examples:**
```typescript
✅ "Delete account"
✅ "Unsaved changes"
✅ "Are you sure?"
✅ "Confirm logout"

❌ "Alert!"
❌ "Are you absolutely sure you want to delete this?"
❌ "DELETE ACCOUNT"
```

### Descriptions

**Guidelines:**
- State the consequences clearly
- 1-3 sentences maximum
- Explain why action matters
- Mention if irreversible

**Examples:**
```typescript
✅ "This will permanently delete your account and all data. 
    This action cannot be undone."

✅ "You have unsaved changes. Leaving will discard them."

✅ "Revoking access will prevent this user from viewing any 
    team resources."

❌ "Are you sure?" // Too vague

❌ "This will delete your account, remove all your data, 
    cancel your subscription, notify your team members, 
    and generate a final invoice." // Too long
```

### Button Labels

**Action buttons:**
- Verb + noun: "Delete account", "Save changes"
- Match the action: If deleting, say "Delete"
- Be specific: Not "OK" or "Yes"

**Cancel buttons:**
- Usually just "Cancel"
- Can be specific: "Keep project", "Stay on page"

**Examples:**
```typescript
// Destructive
✅ <AlertDialogAction>Delete project</AlertDialogAction>
✅ <AlertDialogCancel>Cancel</AlertDialogCancel>

// Confirmation
✅ <AlertDialogAction>Continue</AlertDialogAction>
✅ <AlertDialogCancel>Go back</AlertDialogCancel>

// Warning
✅ <AlertDialogAction>Leave page</AlertDialogAction>
✅ <AlertDialogCancel>Stay on page</AlertDialogCancel>

// Bad examples
❌ <AlertDialogAction>OK</AlertDialogAction>
❌ <AlertDialogAction>Yes</AlertDialogAction>
❌ <AlertDialogAction>Submit</AlertDialogAction>
```

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Navigate between buttons |
| `Enter` | Activate focused button |
| `Space` | Activate focused button |
| `Esc` | Close dialog (triggers cancel) |

### Screen Reader Support

**ARIA attributes (automatic):**
- `role="alertdialog"` on content
- `aria-labelledby` links to title
- `aria-describedby` links to description
- `aria-modal="true"` indicates modal behavior
- Title and description are required

**Implementation:**
```typescript
// Title and description are required
<AlertDialogContent>
  <AlertDialogHeader>
    <AlertDialogTitle>Title</AlertDialogTitle> {/* Required */}
    <AlertDialogDescription>
      Description
    </AlertDialogDescription> {/* Required */}
  </AlertDialogHeader>
</AlertDialogContent>
```

### Focus Management

- **Initial focus**: First action button (cancel)
- **Focus trap**: Cannot tab outside dialog
- **Return focus**: Returns to trigger on close
- **Focus visible**: Clear focus rings

```typescript
// Focus order: Cancel → Action → Cancel (loops)
<AlertDialogFooter>
  <AlertDialogCancel>Cancel</AlertDialogCancel> {/* Focused first */}
  <AlertDialogAction>Confirm</AlertDialogAction>
</AlertDialogFooter>
```

### Visual Requirements

**Contrast:**
- Title: 7:1 minimum (AAA)
- Description: 4.5:1 minimum (AA)
- Buttons: Meet button contrast requirements

**Overlay:**
- Backdrop: `bg-black/50` provides sufficient contrast
- Content visible against backdrop

### Modal Behavior

- **Inert background**: Cannot interact with page
- **Escape to close**: Keyboard users can dismiss
- **Click outside**: Mouse users can dismiss (triggers cancel)
- **No auto-open**: Avoid unexpected interruptions

---

## Implementation

### Installation

```bash
npm install @radix-ui/react-alert-dialog
```

### Basic Implementation

```typescript
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function BasicAlertDialog() {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Open dialog</Button>
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
          <AlertDialogAction>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Controlled State

```typescript
import { useState } from "react";

export function ControlledAlertDialog() {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    // Perform action
    console.log("Confirmed");
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button onClick={() => setOpen(true)}>Open</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm action</AlertDialogTitle>
          <AlertDialogDescription>
            Do you want to proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### With Async Actions

```typescript
export function AsyncAlertDialog() {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteResource();
      toast.success("Deleted successfully");
    } catch (error) {
      toast.error("Failed to delete");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete resource</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the resource.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isLoading}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

---

## Examples

### Example 1: Delete Confirmation

```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm">
      <Trash2 className="size-4 mr-2" />
      Delete
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete project</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete "Project Alpha" and all associated
        files. This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        className={cn(buttonVariants({ variant: "destructive" }))}
      >
        Delete project
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Example 2: Unsaved Changes Warning

```typescript
function EditorWithWarning() {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const router = useRouter();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost">
          <ArrowLeft className="size-4 mr-2" />
          Back
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. Leaving this page will discard them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continue editing</AlertDialogCancel>
          <AlertDialogAction onClick={() => router.back()}>
            Discard changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Example 3: Revoke Access

```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="outline" size="sm">
      <UserMinus className="size-4 mr-2" />
      Revoke access
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Revoke team access</AlertDialogTitle>
      <AlertDialogDescription>
        This will remove Alex from the team and revoke access to all
        projects and resources. They will need to be re-invited to regain access.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        className={cn(buttonVariants({ variant: "destructive" }))}
      >
        Revoke access
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Example 4: Logout Confirmation

```typescript
function LogoutDialog() {
  const { logout } = useAuth();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost">
          <LogOut className="size-4 mr-2" />
          Logout
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Logout</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to logout? Any unsaved changes will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={logout}>
            Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Example 5: Subscription Cancellation

```typescript
function CancelSubscriptionDialog() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await cancelSubscription();
      toast.success("Subscription cancelled");
    } catch (error) {
      toast.error("Failed to cancel subscription");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Cancel subscription</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel subscription</AlertDialogTitle>
          <AlertDialogDescription>
            Your subscription will end on January 31, 2026. You'll lose
            access to premium features and your data will be archived after
            30 days.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>
            Keep subscription
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleCancel();
            }}
            disabled={isProcessing}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            {isProcessing && (
              <Loader2 className="mr-2 size-4 animate-spin" />
            )}
            {isProcessing ? "Cancelling..." : "Cancel subscription"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Example 6: Clear All Data

```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">
      <Trash2 className="size-4 mr-2" />
      Clear all data
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle className="flex items-center gap-2">
        <AlertTriangle className="size-5 text-destructive" />
        Clear all data
      </AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete all your data, including:
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>All projects and files</li>
          <li>Team members and permissions</li>
          <li>Settings and preferences</li>
        </ul>
        This action cannot be undone and data cannot be recovered.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        className={cn(buttonVariants({ variant: "destructive" }))}
      >
        Clear all data
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Example 7: Multi-Step Confirmation

```typescript
function MultiStepDeleteDialog() {
  const [step, setStep] = useState<"confirm" | "verify">("confirm");
  const [confirmText, setConfirmText] = useState("");
  const PROJECT_NAME = "Project Alpha";

  return (
    <AlertDialog onOpenChange={() => setStep("confirm")}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete project</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        {step === "confirm" ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete project</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{PROJECT_NAME}" and all files.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  setStep("verify");
                }}
                className={cn(buttonVariants({ variant: "destructive" }))}
              >
                Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Verify deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Type "{PROJECT_NAME}" to confirm deletion.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={PROJECT_NAME}
              className="my-4"
            />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={confirmText !== PROJECT_NAME}
                className={cn(buttonVariants({ variant: "destructive" }))}
              >
                Delete project
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### Example 8: With Custom Icon

```typescript
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button>Submit</Button>
  </AlertDialogTrigger>
  <AlertDialogContent className="sm:max-w-md">
    <AlertDialogHeader>
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-warning/10 p-3">
          <AlertCircle className="size-6 text-warning" />
        </div>
        <div className="flex-1">
          <AlertDialogTitle>Review before submitting</AlertDialogTitle>
          <AlertDialogDescription>
            Please review your information. Once submitted, you cannot edit it.
          </AlertDialogDescription>
        </div>
      </div>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Review</AlertDialogCancel>
      <AlertDialogAction>Submit</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

**Related Components:**
- [Dialog](../containers/dialog.md) - Non-blocking modal
- [Toast](./toast.md) - Non-blocking notification
- [Button](../actions/button.md) - Action triggers
- [Sheet](../containers/sheet.md) - Side panel

**Design Tokens:**
- [Colors](../../tokens/colors.md)
- [Spacing](../../tokens/spacing.md)
- [Typography](../../tokens/typography.md)
- [Effects](../../tokens/effects.md)
