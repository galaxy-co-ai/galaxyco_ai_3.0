# Hover Card

**Version 1.0.0**

A rich preview card that appears on hover. Hover Cards provide additional context or preview information without requiring a click.

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
- **User profiles**: Preview user info on username hover
- **Link previews**: Show page preview before clicking
- **Rich tooltips**: More detailed than standard tooltip
- **Product previews**: Quick product details on hover
- **Reference information**: Definitions, explanations

### When Not to Use
- **Mobile-first UI**: Hover doesn't exist on touch devices
- **Critical information**: Don't hide essential content
- **Simple hints**: Use Tooltip for brief text
- **Interactive content**: Use Popover for clicks/forms

---

## Anatomy

```
┌──────────────────────────┐
│ @username            ┌───────────────────────────┐
│  └─ trigger          │ ┌──┐ John Doe             │
│                      │ │  │ @johndoe             │
│                      │ └──┘                      │
│                      │ Software Engineer at Co   │
│                      │ 🔗 example.com            │
│                      └───────────────────────────┘
│                             ↑
│                      HoverCardContent (portal)
└──────────────────────────┘
```

**Component Parts:**
1. **HoverCard** - Root container (manages state)
2. **HoverCardTrigger** - Element that triggers hover
3. **HoverCardContent** - Card that appears on hover (portal)

---

## Components

### HoverCard (Root)

The root container managing hover state.

```typescript
<HoverCard>
  <HoverCardTrigger>@username</HoverCardTrigger>
  <HoverCardContent>
    {/* card content */}
  </HoverCardContent>
</HoverCard>
```

**Props:**
- `openDelay?: number` - Delay before opening (ms, default: 700)
- `closeDelay?: number` - Delay before closing (ms, default: 300)
- `open?: boolean` - Controlled open state
- `onOpenChange?: (open: boolean) => void` - State change handler

### HoverCardTrigger

The element that triggers the hover card.

```typescript
<HoverCardTrigger asChild>
  <a href="/user/john">@johndoe</a>
</HoverCardTrigger>
```

**Props:**
- `asChild?: boolean` - Merge props with child (Radix Slot)

### HoverCardContent

The card content that appears.

```typescript
<HoverCardContent>
  <div className="space-y-2">
    <h4 className="font-semibold">John Doe</h4>
    <p className="text-sm">Software Engineer</p>
  </div>
</HoverCardContent>
```

**Props:**
- `align?: "start" | "center" | "end"` - Alignment relative to trigger
- `side?: "top" | "right" | "bottom" | "left"` - Preferred side
- `sideOffset?: number` - Distance from trigger (px, default: 4)

**Design tokens:**
- Background: `bg-popover`
- Text: `text-popover-foreground`
- Width: `w-64` (256px default)
- Border: `border`
- Shadow: `shadow-md`
- Border radius: `rounded-md`
- Padding: `p-4`

---

## Variants

### Default
```typescript
<HoverCard>
  <HoverCardTrigger>Hover me</HoverCardTrigger>
  <HoverCardContent>Content</HoverCardContent>
</HoverCard>
```

### Custom Delay
```typescript
<HoverCard openDelay={200} closeDelay={100}>
  {/* Faster response */}
</HoverCard>
```

### Controlled
```typescript
const [open, setOpen] = useState(false);

<HoverCard open={open} onOpenChange={setOpen}>
  {/* Controlled state */}
</HoverCard>
```

---

## States

### Closed (Default)
- Content hidden
- No interaction

### Open (Hovering)
- Content visible
- Smooth fade-in animation

### Exiting
- Brief delay before closing
- Fade-out animation

---

## Usage Guidelines

### ✅ Do's

- **Keep content focused**: One topic per card
  ```typescript
  ✅ User profile with avatar, name, bio
  ❌ Entire user profile with posts, photos, etc.
  ```

- **Provide alternative access**: Don't rely solely on hover
  ```typescript
  ✅ Click username opens full profile, hover shows preview
  ❌ Hover is only way to see user info
  ```

- **Use appropriate delays**: Balance responsiveness and accidental triggers
  ```typescript
  ✅ openDelay={700} // Standard
  ✅ openDelay={300} // Fast for dense UIs
  ❌ openDelay={100} // Too fast, annoying
  ```

- **Desktop-first**: Design for mouse/trackpad users
  ```typescript
  ✅ On mobile, show same info on tap/click
  ```

### ❌ Don'ts

- **Don't use on mobile-first**: Touch has no hover
  ```typescript
  ❌ Hover card as only way to access info on mobile
  ✅ Tooltip or expandable section on mobile
  ```

- **Don't make interactive**: Use Popover for forms/buttons
  ```typescript
  ❌ Form inputs inside hover card
  ✅ Popover with onClick trigger
  ```

- **Don't show critical info**: Users might miss it
  ```typescript
  ❌ Error messages in hover card
  ✅ Inline error messages always visible
  ```

- **Don't nest hover cards**: Confusing UX
  ```typescript
  ❌ Hover card inside another hover card
  ```

---

## Content Standards

### Content
- **Concise**: 2-4 lines of text maximum
- **Scannable**: Use headings, icons, bold
- **Self-contained**: Don't require clicking elsewhere

### Timing
- **Open delay**: 500-700ms (avoid accidental triggers)
- **Close delay**: 200-300ms (allow mouse movement)

---

## Accessibility

### Keyboard Navigation

Hover cards are not keyboard accessible by design (hover-only). For keyboard users:
- Provide alternative access via click or focus
- Or use Tooltip/Popover instead

### Screen Reader Support

**Best practices:**
- Provide `aria-label` on trigger if needed
- Ensure content is accessible via click/tap
- Don't hide critical information in hover cards

---

## Implementation

### Installation

```bash
npm install @radix-ui/react-hover-card
```

### Basic Implementation

```typescript
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export function BasicHoverCard() {
  return (
    <HoverCard>
      <HoverCardTrigger>Hover me</HoverCardTrigger>
      <HoverCardContent>
        <p>Additional information appears here</p>
      </HoverCardContent>
    </HoverCard>
  );
}
```

---

## Examples

### Example 1: User Profile Preview

```typescript
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarDays } from "lucide-react";

export function UserHoverCard() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a href="/user/johndoe" className="hover:underline">
          @johndoe
        </a>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex gap-4">
          <Avatar>
            <AvatarImage src="/avatars/john.jpg" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">John Doe</h4>
            <p className="text-sm text-muted-foreground">
              Software Engineer at GalaxyCo
            </p>
            <div className="flex items-center gap-2 pt-2">
              <CalendarDays className="size-4 opacity-70" />
              <span className="text-xs text-muted-foreground">
                Joined December 2023
              </span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
```

### Example 2: Link Preview

```typescript
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ExternalLink } from "lucide-react";

export function LinkPreview() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a href="https://example.com" className="text-blue-600 hover:underline">
          Learn more
        </a>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="space-y-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            Example.com
            <ExternalLink className="size-3" />
          </h4>
          <p className="text-xs text-muted-foreground">
            Comprehensive guide to building modern web applications with React and TypeScript.
          </p>
          <div className="text-xs text-muted-foreground">
            example.com/guides/react
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
```

### Example 3: Product Preview

```typescript
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Star } from "lucide-react";

export function ProductHoverCard() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a href="/products/laptop" className="hover:underline">
          MacBook Pro 14"
        </a>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-3">
          <img
            src="/products/macbook.jpg"
            alt="MacBook Pro"
            className="w-full h-40 object-cover rounded-md"
          />
          <div>
            <h4 className="font-semibold">MacBook Pro 14"</h4>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-3 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-xs text-muted-foreground ml-1">(128 reviews)</span>
            </div>
            <p className="text-2xl font-bold mt-2">$1,999</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
```

### Example 4: Definition Hover

```typescript
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export function DefinitionHover() {
  return (
    <p className="text-sm">
      The concept of{" "}
      <HoverCard>
        <HoverCardTrigger asChild>
          <span className="underline decoration-dotted cursor-help">
            progressive enhancement
          </span>
        </HoverCardTrigger>
        <HoverCardContent>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Progressive Enhancement</h4>
            <p className="text-xs text-muted-foreground">
              A strategy in web design that emphasizes core webpage content first, then progressively adds more nuanced and technically rigorous layers of presentation and features on top.
            </p>
          </div>
        </HoverCardContent>
      </HoverCard>
      {" "}is essential for accessible web development.
    </p>
  );
}
```

### Example 5: Repository Info Card

```typescript
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Star, GitFork, Eye } from "lucide-react";

export function RepoHoverCard() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a href="https://github.com/example/repo" className="hover:underline">
          example/repo
        </a>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold">example/repo</h4>
            <p className="text-xs text-muted-foreground mt-1">
              A modern web framework for building fast, scalable applications
            </p>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Star className="size-3" />
              <span>12.5k</span>
            </div>
            <div className="flex items-center gap-1">
              <GitFork className="size-3" />
              <span>2.3k</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="size-3" />
              <span>450</span>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              TypeScript
            </span>
            <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
              MIT
            </span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
```

### Example 6: Team Member Card

```typescript
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function TeamMemberCard() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button className="flex items-center gap-2">
          <Avatar className="size-8">
            <AvatarImage src="/team/sarah.jpg" />
            <AvatarFallback>SM</AvatarFallback>
          </Avatar>
          <span>Sarah Miller</span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="/team/sarah.jpg" />
              <AvatarFallback>SM</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="text-sm font-semibold">Sarah Miller</h4>
              <p className="text-xs text-muted-foreground">Product Designer</p>
            </div>
          </div>
          <p className="text-xs">
            Specializes in user research and interaction design. 5 years experience in B2B SaaS.
          </p>
          <div className="flex gap-1">
            <Badge variant="secondary" className="text-xs">UX</Badge>
            <Badge variant="secondary" className="text-xs">Figma</Badge>
            <Badge variant="secondary" className="text-xs">Research</Badge>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
```

### Example 7: Event Preview

```typescript
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Calendar, MapPin, Users } from "lucide-react";

export function EventHoverCard() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <a href="/events/tech-conference" className="hover:underline">
          Tech Conference 2024
        </a>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="space-y-3">
          <h4 className="font-semibold">Tech Conference 2024</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="size-4" />
              <span>March 15-17, 2024</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="size-4" />
              <span>San Francisco, CA</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="size-4" />
              <span>5,000+ attendees</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Join us for 3 days of talks, workshops, and networking with industry leaders.
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
```

### Example 8: Controlled Hover Card

```typescript
"use client";

import { useState } from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export function ControlledHoverCard() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <button onClick={() => setOpen(!open)}>
        Toggle Hover Card
      </button>

      <HoverCard open={open} onOpenChange={setOpen}>
        <HoverCardTrigger>
          Controlled trigger
        </HoverCardTrigger>
        <HoverCardContent>
          <p>This hover card is controlled programmatically.</p>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}
```

---

**Related Components:**
- [Tooltip](./tooltip.md) - Simple text hints
- [Popover](../containers/popover.md) - Click-triggered overlays
- [Card](../containers/card.md) - Static content containers

**Design Tokens:**
- [Colors](../../tokens/colors.md)
- [Spacing](../../tokens/spacing.md)
- [Effects](../../tokens/effects.md)
