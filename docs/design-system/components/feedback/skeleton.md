# Skeleton

**Version 1.0.0**

A placeholder component that shows a loading state for content. Skeletons provide visual feedback while data is being fetched or processed.

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
- **Unknown load time**: When you can't calculate progress
- **Initial page load**: Show layout while fetching data
- **List/grid loading**: Placeholder for multiple items
- **Image loading**: Placeholder before image loads
- **Perceived performance**: Make app feel faster

### When Not to Use
- **Known progress**: Use Progress component instead
- **Instant loading**: < 300ms doesn't need skeleton
- **Error states**: Show error message, not skeleton
- **Empty states**: Show empty state UI, not loading

---

## Anatomy

```
┌────────────────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░  │ ← Skeleton (animated)
│ ▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░  │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░  │
└────────────────────────────────────┘
```

**Component Parts:**
1. **Skeleton** - Single animated placeholder div

---

## Components

### Skeleton

A simple animated div that mimics content shape.

```typescript
<Skeleton className="h-4 w-full" />
```

**Props:**
- Extends `React.ComponentProps<"div">`
- `className?: string` - Custom size and shape

**Design tokens:**
- Background: `bg-accent`
- Animation: `animate-pulse`
- Border radius: `rounded-md`

**Default size:** No default size — must be specified via className

---

## Variants

### Text Skeleton
```typescript
<Skeleton className="h-4 w-full" />
<Skeleton className="h-4 w-3/4" />
```

### Avatar Skeleton
```typescript
<Skeleton className="size-12 rounded-full" />
```

### Card Skeleton
```typescript
<Skeleton className="h-32 w-full rounded-lg" />
```

### Custom Shape
```typescript
<Skeleton className="h-24 w-24 rounded-xl" />
```

---

## States

### Animating
- Continuous pulse animation
- No user interaction

---

## Usage Guidelines

### ✅ Do's

- **Match content shape**: Skeleton should resemble actual content
  ```typescript
  ✅ <Skeleton className="h-4 w-full" /> // for text line
  ✅ <Skeleton className="size-12 rounded-full" /> // for avatar
  ```

- **Use multiple skeletons**: Show full layout structure
  ```typescript
  ✅ <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
  ```

- **Maintain spacing**: Keep same gaps as real content
  ```typescript
  ✅ <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
  ```

- **Show count**: For lists, show expected number of items
  ```typescript
  ✅ {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
  ```

### ❌ Don'ts

- **Don't use for errors**: Show error state instead
  ```typescript
  ❌ {error && <Skeleton />}
  ✅ {error && <ErrorMessage />}
  ```

- **Don't use for empty states**: Show empty state UI
  ```typescript
  ❌ {items.length === 0 && <Skeleton />}
  ✅ {items.length === 0 && <EmptyState />}
  ```

- **Don't show forever**: Add timeout or error handling
  ```typescript
  ❌ <Skeleton /> // indefinitely
  ✅ {isLoading && <Skeleton />}
      {isError && <ErrorState />}
  ```

- **Don't mismatch size**: Skeleton should match content dimensions
  ```typescript
  ❌ <Skeleton className="h-2 w-10" /> // for a large card
  ✅ <Skeleton className="h-32 w-full" />
  ```

---

## Content Standards

### Sizing
- **Text lines**: `h-4` (16px height)
- **Small text**: `h-3` (12px height)
- **Headings**: `h-6` to `h-8` (24-32px)
- **Avatars**: `size-8` to `size-16` (32-64px)
- **Cards**: Match card height

### Width Variation
- Vary line widths to look natural: `w-full`, `w-3/4`, `w-1/2`

---

## Accessibility

### Screen Reader Support

Skeletons are decorative and should be hidden from screen readers:

```typescript
<Skeleton aria-hidden="true" className="h-4 w-full" />
```

Or wrap in a container with proper ARIA:

```typescript
<div aria-busy="true" aria-live="polite">
  <span className="sr-only">Loading content...</span>
  <Skeleton className="h-4 w-full" />
</div>
```

### Best Practices

1. **Announce loading**: Use `aria-live` regions
2. **Hide decorative**: `aria-hidden="true"` on skeletons
3. **Provide context**: Screen reader text explaining what's loading
4. **Reduced motion**: Respect `prefers-reduced-motion`

---

## Implementation

### Basic Implementation

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export function BasicSkeleton() {
  return <Skeleton className="h-4 w-full" />;
}
```

---

## Examples

### Example 1: Text Skeleton

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export function TextSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
    </div>
  );
}
```

### Example 2: Card Skeleton

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export function CardSkeleton() {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}
```

### Example 3: User Profile Skeleton

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="size-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
```

### Example 4: Table Skeleton

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export function TableSkeleton() {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      {/* Rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}
```

### Example 5: Blog Post List Skeleton

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export function BlogListSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Example 6: Product Grid Skeleton

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
        </div>
      ))}
    </div>
  );
}
```

### Example 7: Comment Thread Skeleton

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export function CommentSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="size-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Example 8: Dashboard Stats Skeleton

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-6 space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}
```

### Example 9: Conditional Loading with Skeleton

```typescript
"use client";

import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers().then((data) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-12 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div key={user.id} className="flex items-center gap-3">
          <img src={user.avatar} alt={user.name} className="size-12 rounded-full" />
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Example 10: Reduced Motion Skeleton

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export function ReducedMotionSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton 
        className="h-4 w-full motion-reduce:animate-none motion-reduce:bg-muted" 
      />
      <Skeleton 
        className="h-4 w-3/4 motion-reduce:animate-none motion-reduce:bg-muted" 
      />
      <Skeleton 
        className="h-4 w-1/2 motion-reduce:animate-none motion-reduce:bg-muted" 
      />
    </div>
  );
}
```

---

**Related Components:**
- [Progress](./progress.md) - Determinate loading indicator
- [Spinner](./spinner.md) - Indeterminate loading spinner
- [Card](../containers/card.md) - Card layouts that skeletons mimic

**Design Tokens:**
- [Colors](../../tokens/colors.md)
- [Animation](../../tokens/effects.md)
- [Spacing](../../tokens/spacing.md)
