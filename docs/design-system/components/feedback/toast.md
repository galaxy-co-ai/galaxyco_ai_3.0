# Toast

**Version 1.0.0**

A non-blocking notification component that provides brief, temporary feedback to users. Toasts appear at the edge of the screen and automatically dismiss after a set duration.

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
- **Success confirmations**: Action completed successfully
- **Error notifications**: Something went wrong
- **Info messages**: Neutral information updates
- **Warning alerts**: Caution or attention needed
- **Loading states**: Operation in progress
- **Undo actions**: Allow reverting recent changes
- **System updates**: Background process completions

### When Not to Use
- **Critical decisions**: Use Alert Dialog for confirmations
- **Detailed information**: Use Dialog or Sheet
- **Persistent notices**: Use Banner or Alert
- **Form errors**: Use inline validation messages
- **Lengthy content**: Keep messages brief (2-3 lines max)
- **Multiple simultaneous messages**: Queue or limit toasts

---

## Anatomy

```
┌──────────────────────────────────────────┐
│  Screen                                  │
│                                          │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ ✓  Success message         × │     │ ← Toast (success variant)
│  └────────────────────────────────┘     │   with icon, message, and close button
│                                          │
│  ┌────────────────────────────────┐     │
│  │ ⓘ  Info message with a      × │     │ ← Toast (info variant)
│  │    longer description          │     │   multi-line support
│  └────────────────────────────────┘     │
│                                          │
│  ┌────────────────────────────────┐     │
│  │ ⚠  Warning  [Undo] [Dismiss] │     │ ← Toast with action buttons
│  └────────────────────────────────┘     │
│                                          │
└──────────────────────────────────────────┘
         ↑ Default position: bottom-right
```

**Component Parts:**
1. **Container** - Toast notification wrapper
2. **Icon** - Visual indicator (success, error, warning, info)
3. **Message** - Primary notification text
4. **Description** - Optional secondary text (below message)
5. **Action Button** - Optional call-to-action
6. **Close Button** - Manual dismiss (×)

---

## Components

### Toaster

The provider component that renders all toasts. Must be placed in your app root.

```typescript
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

**Props:**
- `position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"` - Toast position (default: bottom-right)
- `expand?: boolean` - Expand toasts on hover (default: false)
- `richColors?: boolean` - Use semantic colors (default: false)
- `closeButton?: boolean` - Show close button (default: false)
- `duration?: number` - Auto-dismiss duration in ms (default: 4000)
- `visibleToasts?: number` - Max visible toasts (default: 3)
- `toastOptions?: ToastOptions` - Default options for all toasts

**Design tokens (automatic via CSS variables):**
- Background: `var(--popover)`
- Text: `var(--popover-foreground)`
- Border: `var(--border)`

### toast() API

The primary function for displaying toast notifications.

```typescript
import { toast } from "sonner";

// Basic usage
toast("Message");

// With description
toast("Title", {
  description: "Additional details here"
});

// Return value (for updates/dismissal)
const toastId = toast("Loading...");
```

**Options:**
- `description?: string` - Secondary text
- `duration?: number` - Time before auto-dismiss (ms)
- `action?: { label: string; onClick: () => void }` - Action button
- `cancel?: { label: string; onClick: () => void }` - Cancel button
- `onDismiss?: () => void` - Callback when dismissed
- `onAutoClose?: () => void` - Callback on auto-close
- `closeButton?: boolean` - Show close button
- `id?: string | number` - Custom ID for updates

### Toast Variants

#### toast.success()

Success confirmation message.

```typescript
toast.success("Changes saved");
toast.success("Project created", {
  description: "Your project is now live"
});
```

**Design tokens:**
- Icon: Checkmark (✓)
- Color: Success/green semantic

#### toast.error()

Error notification message.

```typescript
toast.error("Failed to save");
toast.error("Connection lost", {
  description: "Please check your internet connection"
});
```

**Design tokens:**
- Icon: X or alert icon
- Color: Destructive/red semantic

#### toast.warning()

Warning or caution message.

```typescript
toast.warning("Low storage space");
toast.warning("Unsaved changes", {
  description: "Your changes will be lost"
});
```

**Design tokens:**
- Icon: Warning triangle (⚠)
- Color: Warning/yellow semantic

#### toast.info()

Informational message.

```typescript
toast.info("New features available");
toast.info("Maintenance scheduled", {
  description: "System will be down Sunday 2-4 AM"
});
```

**Design tokens:**
- Icon: Info circle (ⓘ)
- Color: Info/blue semantic

#### toast.loading()

Loading state indicator.

```typescript
const loadingToast = toast.loading("Uploading...");

// Update when complete
toast.success("Upload complete", {
  id: loadingToast
});
```

**Design tokens:**
- Icon: Spinner animation
- Duration: Infinite (must manually dismiss)

#### toast.promise()

Automatically handles promise states.

```typescript
toast.promise(
  fetchData(),
  {
    loading: "Loading data...",
    success: (data) => `Loaded ${data.count} items`,
    error: "Failed to load data"
  }
);
```

**Behavior:**
- Shows loading toast immediately
- Updates to success/error based on promise result
- Auto-dismisses on completion

#### toast.custom()

Fully custom toast content.

```typescript
toast.custom(
  (toastId) => (
    <div className="flex items-center gap-2 bg-background border rounded-lg p-4">
      <Avatar src="/user.jpg" />
      <div>
        <p className="font-medium">New message</p>
        <p className="text-sm text-muted-foreground">John: Hey there!</p>
      </div>
      <Button size="sm" onClick={() => toast.dismiss(toastId)}>
        Reply
      </Button>
    </div>
  )
);
```

---

## Variants

### Semantic Variants

```typescript
// Success (green)
toast.success("Operation successful");

// Error (red)
toast.error("Operation failed");

// Warning (yellow)
toast.warning("Proceed with caution");

// Info (blue)
toast.info("For your information");

// Default (neutral)
toast("Notification");
```

### With Actions

```typescript
// Single action
toast("File deleted", {
  action: {
    label: "Undo",
    onClick: () => restoreFile()
  }
});

// Action + Cancel
toast("Confirm delete", {
  action: {
    label: "Delete",
    onClick: () => deleteItem()
  },
  cancel: {
    label: "Cancel",
    onClick: () => console.log("Cancelled")
  }
});
```

### Duration Variants

```typescript
// Short (2 seconds)
toast("Quick message", { duration: 2000 });

// Default (4 seconds)
toast("Standard message");

// Long (10 seconds)
toast("Important message", { duration: 10000 });

// Persistent (must manually dismiss)
toast("Stay visible", { duration: Infinity });
```

---

## States

### Dismissal States

```typescript
// Auto-dismiss (default after 4s)
toast("Will dismiss automatically");

// Manual dismiss
const toastId = toast("Manual dismiss");
toast.dismiss(toastId);

// Dismiss all
toast.dismiss();
```

### Update States

```typescript
// Create toast
const toastId = toast("Processing...");

// Update content
toast.success("Complete!", {
  id: toastId
});

// Or with toast.promise
toast.promise(
  saveData(),
  {
    loading: "Saving...",
    success: "Saved!",
    error: "Failed to save"
  }
);
```

### Stacking Behavior

```typescript
// Multiple toasts stack
toast("First");
toast("Second");
toast("Third");

// Limit visible toasts (in Toaster)
<Toaster visibleToasts={3} />
```

---

## Usage Guidelines

### ✅ Do's

- **Use for non-blocking feedback**: Don't interrupt user flow
  ```typescript
  ✅ toast.success("Settings saved");
  ❌ // Don't use alert dialog for this
  ```

- **Keep messages brief**: 1-2 lines maximum
  ```typescript
  ✅ toast("File uploaded successfully");
  ❌ toast("Your file has been successfully uploaded to the server and is now available for download. You can find it in your dashboard.");
  ```

- **Choose appropriate variants**: Match severity
  ```typescript
  ✅ toast.error("Failed to connect");
  ❌ toast.success("Failed to connect"); // Wrong variant
  ```

- **Provide actionable messages**: Include context
  ```typescript
  ✅ toast.error("Failed to save. Check your connection.");
  ❌ toast.error("Error 500");
  ```

- **Use actions for reversible operations**:
  ```typescript
  ✅ toast("Message deleted", {
    action: { label: "Undo", onClick: restore }
  });
  ```

- **Position consistently**: Use same position app-wide
  ```typescript
  ✅ <Toaster position="bottom-right" />
  ```

### ❌ Don'ts

- **Don't use for critical confirmations**: Use Alert Dialog
  ```typescript
  ❌ toast("Delete account?");
  ✅ // Use AlertDialog for destructive actions
  ```

- **Don't stack too many toasts**: Limit visible count
  ```typescript
  ❌ <Toaster visibleToasts={10} /> // Too many
  ✅ <Toaster visibleToasts={3} />
  ```

- **Don't use for form validation**: Use inline errors
  ```typescript
  ❌ toast.error("Email is required");
  ✅ // Show error below input field
  ```

- **Don't show multiple identical toasts**: Deduplicate
  ```typescript
  ❌ 
  toast("Saved");
  toast("Saved"); // Duplicate
  
  ✅
  const toastId = "save-toast";
  toast.success("Saved", { id: toastId });
  ```

- **Don't use for lengthy content**: Keep it short
  ```typescript
  ❌ toast("Lorem ipsum dolor sit amet, consectetur adipiscing elit...");
  ✅ toast("Action complete", { description: "View details in settings" });
  ```

- **Don't autoplay media**: Respect user preferences
  ```typescript
  ❌ toast.custom(<video autoPlay />);
  ```

- **Don't block interactions**: Toasts should be non-modal
  ```typescript
  ✅ // Toasts overlay content but don't block it
  ```

---

## Content Standards

### Message Text

**Structure:**
- **Primary message**: 2-6 words, action-oriented
- **Description**: Optional, 1-2 sentences max
- Sentence case
- No ending punctuation (unless multi-sentence)

**Examples:**
```typescript
✅ toast.success("Settings saved");
✅ toast.error("Connection failed");
✅ toast.info("Update available");

✅ toast.success("Project created", {
  description: "You can now add team members"
});

❌ toast("SUCCESS!"); // All caps
❌ toast("The settings have been saved."); // Too formal
❌ toast.success("Settings saved successfully!"); // Redundant
```

### Action Labels

**Guidelines:**
- Use verbs: "Undo", "View", "Retry"
- Keep short: 1-2 words
- Clear outcome
- Title case for single words, sentence case for phrases

**Examples:**
```typescript
✅ action: { label: "Undo", onClick: undo }
✅ action: { label: "View details", onClick: view }
✅ action: { label: "Retry", onClick: retry }

❌ action: { label: "Click here to undo", onClick: undo }
❌ action: { label: "OK", onClick: dismiss }
```

### Descriptions

**Guidelines:**
- Provide additional context
- Explain next steps or consequences
- Keep under 20 words
- Use sentence case

**Examples:**
```typescript
✅ description: "Your changes are now live"
✅ description: "This may take a few minutes"
✅ description: "Check your email for confirmation"

❌ description: "Lorem ipsum dolor sit amet, consectetur..." // Too long
```

---

## Accessibility

### Screen Reader Support

**Automatic announcements:**
- Success toasts: Announced as "Success: [message]"
- Error toasts: Announced with alert role
- Info toasts: Announced politely
- Loading toasts: Announced status

**ARIA attributes (automatic):**
- `role="status"` for info/success toasts
- `role="alert"` for error/warning toasts
- `aria-live="polite"` or `aria-live="assertive"`
- `aria-atomic="true"` for full message reading

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Esc` | Dismiss focused toast |
| `Tab` | Navigate to action button |
| `Enter` | Activate action button |
| `Space` | Activate action button |

**Focus management:**
- Toast container receives focus when action buttons present
- Focus returns to trigger after dismiss
- Keyboard users can interact with actions

### Visual Considerations

**Color contrast:**
- Text: 4.5:1 minimum contrast ratio (AA)
- Icons: Meet contrast requirements
- Don't rely on color alone (use icons + text)

**Motion sensitivity:**
- Respect `prefers-reduced-motion`
- Entrance: Slide + fade (can be reduced)
- Exit: Fade (smooth)

**Timing:**
- Default 4s provides adequate reading time
- Longer messages auto-extend duration
- Hover to pause auto-dismiss

### Redundancy

**Don't rely solely on toasts:**
```typescript
// Bad - Only show toast
toast.success("Settings saved");

// Good - Toast + update UI
toast.success("Settings saved");
setSaveIndicator(true);
updateTimestamp();
```

---

## Implementation

### Installation

```bash
npm install sonner
```

### Setup

Add `<Toaster />` to your root layout:

```typescript
// app/layout.tsx (Next.js)
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
```

### Basic Usage

```typescript
import { toast } from "sonner";

function MyComponent() {
  const handleSave = () => {
    // Perform save
    toast.success("Changes saved");
  };

  return <Button onClick={handleSave}>Save</Button>;
}
```

### With Position

```typescript
// Configure globally
<Toaster position="top-center" />

// Or per toast
toast("Message", { position: "top-right" });
```

### With Rich Colors

```typescript
// Enable semantic colors
<Toaster richColors />
```

### With Close Button

```typescript
// All toasts
<Toaster closeButton />

// Individual toast
toast("Message", { closeButton: true });
```

---

## Examples

### Example 1: Success Toast

```typescript
function SaveButton() {
  const handleSave = async () => {
    try {
      await saveChanges();
      toast.success("Changes saved");
    } catch (error) {
      toast.error("Failed to save");
    }
  };

  return <Button onClick={handleSave}>Save</Button>;
}
```

### Example 2: Error with Retry

```typescript
function DataFetcher() {
  const fetchData = async () => {
    try {
      const data = await fetch("/api/data");
      toast.success("Data loaded");
    } catch (error) {
      toast.error("Failed to load data", {
        action: {
          label: "Retry",
          onClick: fetchData
        }
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return <div>...</div>;
}
```

### Example 3: Undo Action

```typescript
function DeleteButton({ item }) {
  const handleDelete = () => {
    const deleted = deleteItem(item.id);
    
    toast("Item deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          restoreItem(deleted);
          toast.success("Item restored");
        }
      }
    });
  };

  return (
    <Button variant="destructive" onClick={handleDelete}>
      <Trash2 className="size-4 mr-2" />
      Delete
    </Button>
  );
}
```

### Example 4: Promise Toast

```typescript
function UploadButton() {
  const handleUpload = async (file: File) => {
    toast.promise(
      uploadFile(file),
      {
        loading: "Uploading file...",
        success: (data) => `${data.filename} uploaded successfully`,
        error: "Upload failed. Please try again."
      }
    );
  };

  return (
    <input
      type="file"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
      }}
    />
  );
}
```

### Example 5: Loading State

```typescript
function ProcessButton() {
  const handleProcess = async () => {
    const toastId = toast.loading("Processing...");

    try {
      await processData();
      toast.success("Processing complete", { id: toastId });
    } catch (error) {
      toast.error("Processing failed", { id: toastId });
    }
  };

  return <Button onClick={handleProcess}>Process</Button>;
}
```

### Example 6: Custom Duration

```typescript
function ImportantNotice() {
  return (
    <Button
      onClick={() => {
        toast.warning("System maintenance in 5 minutes", {
          duration: 10000, // 10 seconds
          description: "Save your work before maintenance begins"
        });
      }}
    >
      Show Notice
    </Button>
  );
}
```

### Example 7: Info with Action

```typescript
function UpdateNotification() {
  useEffect(() => {
    if (hasUpdate) {
      toast.info("New version available", {
        description: "Version 2.0.0 includes new features",
        action: {
          label: "Update now",
          onClick: () => {
            window.location.href = "/update";
          }
        },
        duration: 8000
      });
    }
  }, [hasUpdate]);

  return <div>...</div>;
}
```

### Example 8: Custom Toast

```typescript
function CustomNotification() {
  return (
    <Button
      onClick={() => {
        toast.custom(
          (toastId) => (
            <Card className="max-w-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="size-5" />
                  New message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <Avatar>
                    <AvatarImage src="/avatar.jpg" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">John Doe</p>
                    <p className="text-sm text-muted-foreground">
                      Hey, are you available for a call?
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="gap-2">
                <Button size="sm" onClick={() => toast.dismiss(toastId)}>
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toast.dismiss(toastId)}
                >
                  Dismiss
                </Button>
              </CardFooter>
            </Card>
          ),
          { duration: 10000 }
        );
      }}
    >
      Show Custom Toast
    </Button>
  );
}
```

### Example 9: Form Submission

```typescript
function ContactForm() {
  const onSubmit = async (data: FormData) => {
    const toastId = toast.loading("Sending message...");

    try {
      await sendMessage(data);
      toast.success("Message sent", {
        id: toastId,
        description: "We'll get back to you within 24 hours"
      });
      form.reset();
    } catch (error) {
      toast.error("Failed to send message", {
        id: toastId,
        description: "Please try again or contact support",
        action: {
          label: "Contact support",
          onClick: () => window.location.href = "/support"
        }
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
      <Button type="submit">Send</Button>
    </form>
  );
}
```

### Example 10: Batch Operations

```typescript
function BulkDelete({ items }: { items: Item[] }) {
  const handleBulkDelete = async () => {
    const toastId = toast.loading(`Deleting ${items.length} items...`);

    try {
      await Promise.all(items.map(item => deleteItem(item.id)));
      
      toast.success(`${items.length} items deleted`, {
        id: toastId,
        action: {
          label: "Undo",
          onClick: async () => {
            const restoreToast = toast.loading("Restoring items...");
            await restoreItems(items);
            toast.success("Items restored", { id: restoreToast });
          }
        }
      });
    } catch (error) {
      toast.error("Failed to delete items", {
        id: toastId,
        description: "Some items could not be deleted"
      });
    }
  };

  return (
    <Button variant="destructive" onClick={handleBulkDelete}>
      Delete selected ({items.length})
    </Button>
  );
}
```

### Example 11: Network Status

```typescript
function NetworkMonitor() {
  useEffect(() => {
    const handleOnline = () => {
      toast.success("Back online", {
        description: "Your connection has been restored"
      });
    };

    const handleOffline = () => {
      toast.error("No internet connection", {
        description: "Changes will sync when online",
        duration: Infinity // Stay visible
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return null;
}
```

### Example 12: Configuration Options

```typescript
// Global configuration
<Toaster
  position="top-right"
  richColors
  closeButton
  duration={5000}
  visibleToasts={5}
  expand={false}
  toastOptions={{
    style: {
      background: "var(--popover)",
      color: "var(--popover-foreground)",
      border: "1px solid var(--border)"
    },
    className: "custom-toast"
  }}
/>
```

---

## API Reference

### toast() Methods

```typescript
// Basic
toast(message: string, options?: ToastOptions)

// Variants
toast.success(message: string, options?: ToastOptions)
toast.error(message: string, options?: ToastOptions)
toast.info(message: string, options?: ToastOptions)
toast.warning(message: string, options?: ToastOptions)
toast.loading(message: string, options?: ToastOptions)

// Special
toast.promise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  },
  options?: ToastOptions
)

toast.custom(
  jsx: (toastId: string | number) => React.ReactNode,
  options?: ToastOptions
)

// Control
toast.dismiss(toastId?: string | number) // Dismiss specific or all
```

### ToastOptions

```typescript
interface ToastOptions {
  description?: string;
  duration?: number;
  position?: Position;
  closeButton?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick: () => void;
  };
  id?: string | number;
  onDismiss?: () => void;
  onAutoClose?: () => void;
  style?: React.CSSProperties;
  className?: string;
}
```

---

**Related Components:**
- [Alert Dialog](./alert-dialog.md) - Critical confirmations
- [Dialog](../containers/dialog.md) - Modal dialogs
- [Banner](./banner.md) - Persistent notifications
- [Alert](./alert.md) - Inline alerts

**Design Tokens:**
- [Colors](../../tokens/colors.md)
- [Spacing](../../tokens/spacing.md)
- [Typography](../../tokens/typography.md)
- [Effects](../../tokens/effects.md)
