# Breadcrumb

**Version 1.0.0**

A navigation component that shows the user's location within the site hierarchy. Breadcrumbs provide a trail of links from the root to the current page.

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
- **Deep navigation hierarchies**: 3+ levels of navigation
- **Multi-step processes**: Showing progress through a workflow
- **Location awareness**: Help users understand where they are
- **Quick navigation**: Jump back to parent pages
- **E-commerce categories**: Product → Category → Subcategory

### When Not to Use
- **Shallow navigation**: 1-2 levels (use Back button instead)
- **Linear processes**: Use Progress or Stepper instead
- **Primary navigation**: Use Tabs or Navigation Menu
- **Mobile-first**: Consider hiding or collapsing on small screens

---

## Anatomy

```
┌──────────────────────────────────────────────────┐
│ Home / Products / Electronics / Laptops          │ ← Breadcrumb (nav)
│   │      │           │              │            │
│   │      │           │              └─ BreadcrumbPage (current)
│   │      │           └─ BreadcrumbLink + Separator
│   │      └─ BreadcrumbLink + Separator
│   └─ BreadcrumbLink + Separator
└──────────────────────────────────────────────────┘

With ellipsis for long paths:
┌──────────────────────────────────────────────────┐
│ Home / ... / Category / Subcategory / Page       │
│   │      │       │           │           │       │
│   │      └─ BreadcrumbEllipsis                   │
│   └─ BreadcrumbLink + Separator                  │
└──────────────────────────────────────────────────┘
```

**Component Parts:**
1. **Breadcrumb** - Nav container (`<nav>` with aria-label)
2. **BreadcrumbList** - Ordered list (`<ol>`)
3. **BreadcrumbItem** - List item (`<li>`)
4. **BreadcrumbLink** - Clickable link (`<a>` or custom with `asChild`)
5. **BreadcrumbPage** - Current page (non-clickable span with `aria-current="page"`)
6. **BreadcrumbSeparator** - Visual divider (default: `>`)
7. **BreadcrumbEllipsis** - Collapsed items indicator (`...`)

---

## Components

### Breadcrumb (Root)

The root navigation container.

```typescript
<Breadcrumb>
  <BreadcrumbList>
    {/* breadcrumb items */}
  </BreadcrumbList>
</Breadcrumb>
```

**Props:**
- Extends `React.ComponentProps<"nav">`
- Automatically includes `aria-label="breadcrumb"`

### BreadcrumbList

The ordered list container for breadcrumb items.

```typescript
<BreadcrumbList>
  <BreadcrumbItem>...</BreadcrumbItem>
  <BreadcrumbItem>...</BreadcrumbItem>
</BreadcrumbList>
```

**Design tokens:**
- Text: `text-muted-foreground`
- Font size: `text-sm` (14px)
- Gap: `gap-1.5` (6px) on mobile, `sm:gap-2.5` (10px) on desktop
- Wrap: `flex-wrap` (multi-line on narrow viewports)

### BreadcrumbItem

Individual breadcrumb item wrapper.

```typescript
<BreadcrumbItem>
  <BreadcrumbLink href="/">Home</BreadcrumbLink>
</BreadcrumbItem>
```

**Layout:**
- Display: `inline-flex items-center`
- Gap: `gap-1.5` (spacing between link and separator)

### BreadcrumbLink

Clickable link to a parent page.

```typescript
<BreadcrumbLink href="/products">
  Products
</BreadcrumbLink>

// With custom component (Next.js Link, Wouter, etc.)
<BreadcrumbLink asChild>
  <Link to="/products">Products</Link>
</BreadcrumbLink>
```

**Props:**
- `asChild?: boolean` - Use child component as link (Radix Slot pattern)
- `href?: string` - Link destination (when not using asChild)

**Design tokens:**
- Text: `text-muted-foreground` (inherits from BreadcrumbList)
- Hover: `hover:text-foreground`
- Transition: `transition-colors`

### BreadcrumbPage

The current page indicator (non-clickable).

```typescript
<BreadcrumbPage>Current Page</BreadcrumbPage>
```

**Props:**
- Automatically includes `aria-current="page"`
- `role="link"` and `aria-disabled="true"` for semantics

**Design tokens:**
- Text: `text-foreground` (slightly darker than links)
- Font weight: `font-normal`

### BreadcrumbSeparator

Visual separator between items.

```typescript
// Default separator (ChevronRight)
<BreadcrumbSeparator />

// Custom separator
<BreadcrumbSeparator>
  <Slash className="size-4" />
</BreadcrumbSeparator>
```

**Accessibility:**
- `role="presentation"`
- `aria-hidden="true"` (screen readers ignore)

**Design tokens:**
- Icon size: `size-3.5` (14px)

### BreadcrumbEllipsis

Collapsed items indicator for long paths.

```typescript
<BreadcrumbEllipsis />
```

**Features:**
- Shows `MoreHorizontal` icon (three dots)
- Includes `sr-only` text "More" for screen readers
- `role="presentation"` and `aria-hidden="true"`

---

## Variants

### Standard Breadcrumb
```typescript
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/products">Products</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Laptops</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### With Ellipsis
```typescript
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbLink href="/">Home</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbEllipsis />
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbLink href="/electronics">Electronics</BreadcrumbLink>
    </BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem>
      <BreadcrumbPage>Laptops</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### Custom Separator
```typescript
<BreadcrumbSeparator>
  <Slash className="size-4" />
</BreadcrumbSeparator>
```

---

## States

### Default
- Links in muted color (`text-muted-foreground`)
- Current page in foreground color (`text-foreground`)

### Hover
- Links transition to foreground color on hover

### Disabled
- Current page is non-interactive (BreadcrumbPage)
- No hover state on current page

---

## Usage Guidelines

### ✅ Do's

- **Show full path from root**: Start with home or root level
  ```typescript
  ✅ Home / Products / Electronics / Laptops
  ❌ Electronics / Laptops (missing context)
  ```

- **Keep labels concise**: 1-3 words per item
  ```typescript
  ✅ Home / Products / Laptops
  ❌ Home / All Products / Laptop Computers and Accessories
  ```

- **Use ellipsis for long paths**: Collapse middle items when > 4 levels
  ```typescript
  ✅ Home / ... / Category / Subcategory / Page
  ❌ Home / L1 / L2 / L3 / L4 / L5 / L6 / Page (too long)
  ```

- **Make all items clickable except current**: Current page is non-interactive
  ```typescript
  ✅ <BreadcrumbLink href="/">Home</BreadcrumbLink>
  ✅ <BreadcrumbPage>Current</BreadcrumbPage>
  ```

- **Responsive design**: Consider hiding on mobile or showing only last 2 items
  ```typescript
  ✅ Desktop: Home / Products / Electronics / Laptops
  ✅ Mobile: Electronics / Laptops
  ```

### ❌ Don'ts

- **Don't use for shallow hierarchies**: Not needed for 1-2 levels
  ```typescript
  ❌ Home / Contact (use Back button instead)
  ```

- **Don't include the current page as a link**: It should be non-interactive
  ```typescript
  ❌ <BreadcrumbLink href="/current">Current Page</BreadcrumbLink>
  ✅ <BreadcrumbPage>Current Page</BreadcrumbPage>
  ```

- **Don't use for linear processes**: Use Progress or Stepper
  ```typescript
  ❌ Breadcrumb for: Step 1 / Step 2 / Step 3
  ✅ Progress component for multi-step flows
  ```

- **Don't repeat page title**: Breadcrumb + page heading should be complementary
  ```typescript
  ❌ Breadcrumb: Home / Products / Laptops
      Heading: Laptops (redundant)
  ✅ Breadcrumb: Home / Products / Laptops
      Heading: Gaming Laptops Under $1000
  ```

---

## Content Standards

### Labels
- **Concise**: 1-3 words
- **Sentence case**: "Contact us" not "Contact Us"
- **Descriptive**: Clear what the link leads to
- **Match page titles**: Use same or abbreviated page name

### Separators
- **Default**: ChevronRight (`>`)
- **Alternatives**: Slash (`/`), Dot (`·`), Arrow (`→`)
- **Consistency**: Use same separator throughout app

### Examples
- ✅ Home / Products / Laptops
- ✅ Dashboard / Settings / Profile
- ✅ Docs / Components / Button
- ❌ Home Page / All Products / Laptop Computers

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Focus next breadcrumb link |
| `Shift + Tab` | Focus previous breadcrumb link |
| `Enter` | Navigate to focused link |

**Note:** Current page (BreadcrumbPage) is not focusable as it's not interactive.

### Screen Reader Support

**ARIA attributes (automatic):**
- `<nav aria-label="breadcrumb">` on root
- `aria-current="page"` on current page
- `aria-hidden="true"` on separators (presentational only)
- `role="presentation"` on separators and ellipsis
- `sr-only` "More" text on ellipsis

**Announcement example:**
```
"Navigation breadcrumb, list, Home link, Products link, Current page Laptops"
```

### Best Practices

1. **Semantic HTML**: Use `<nav>` with `<ol>` (ordered list represents hierarchy)
2. **Skip link**: Consider "Skip to main content" link for long breadcrumbs
3. **Focus visible**: Links have visible focus indicators
4. **Color contrast**: Text meets 4.5:1 contrast ratio

---

## Implementation

### Installation

```bash
npm install @radix-ui/react-slot
npm install lucide-react
```

### Basic Implementation

```typescript
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function BasicBreadcrumb() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/products">Products</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Laptops</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

---

## Examples

### Example 1: E-commerce Breadcrumb

```typescript
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export function EcommerceBreadcrumb() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/shop">Shop</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/shop/electronics">
            Electronics
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/shop/electronics/laptops">
            Laptops
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Gaming Laptops</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

### Example 2: With Custom Router (Next.js Link)

```typescript
import Link from "next/link";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export function NextBreadcrumb() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/docs">Docs</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/docs/components">Components</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

### Example 3: With Ellipsis (Long Path)

```typescript
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis } from "@/components/ui/breadcrumb";

export function LongPathBreadcrumb() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbEllipsis />
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/shop/electronics/laptops">
            Laptops
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/shop/electronics/laptops/gaming">
            Gaming
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>High Performance</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

### Example 4: With Dropdown (Collapsed Items)

```typescript
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export function DropdownBreadcrumb() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1">
              <span>Shop</span>
              <ChevronDown className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <a href="/shop/electronics">Electronics</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/shop/clothing">Clothing</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/shop/home">Home & Garden</a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/shop/electronics">
            Electronics
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Laptops</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

### Example 5: Custom Separator (Slash)

```typescript
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Slash } from "lucide-react";

export function CustomSeparatorBreadcrumb() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <Slash />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink href="/docs">Documentation</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <Slash />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Getting Started</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

### Example 6: Dynamic Breadcrumb from URL

```typescript
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

export function DynamicBreadcrumb() {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {paths.map((path, index) => {
          const href = `/${paths.slice(0, index + 1).join("/")}`;
          const isLast = index === paths.length - 1;
          const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");

          return (
            <div key={path} className="flex items-center gap-1.5">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

### Example 7: Responsive Breadcrumb (Mobile Adaptive)

```typescript
"use client";

import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useMediaQuery } from "@/hooks/use-media-query";

export function ResponsiveBreadcrumb() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (isMobile) {
    // Show only last 2 items on mobile
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/shop/electronics">
              Electronics
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Laptops</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Show full breadcrumb on desktop
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/shop">Shop</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/shop/electronics">
            Electronics
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Laptops</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

### Example 8: Documentation Breadcrumb

```typescript
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Home, FileText, Layout } from "lucide-react";

export function DocsBreadcrumb() {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" className="flex items-center gap-1.5">
            <Home className="size-4" />
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/docs" className="flex items-center gap-1.5">
            <FileText className="size-4" />
            Documentation
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="/docs/components" className="flex items-center gap-1.5">
            <Layout className="size-4" />
            Components
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
```

---

**Related Components:**
- [Tabs](./tabs.md) - Content organization
- [Dropdown Menu](./dropdown-menu.md) - Collapsed breadcrumb items
- [Button](../actions/button.md) - Back button alternative

**Design Tokens:**
- [Colors](../../tokens/colors.md)
- [Typography](../../tokens/typography.md)
- [Spacing](../../tokens/spacing.md)
