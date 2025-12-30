# Accordion

**Version 1.0.0**

A vertically stacked set of collapsible sections. Accordions allow users to expand and collapse content panels to reduce scrolling and cognitive load.

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
- **FAQ sections**: Frequently asked questions
- **Settings panels**: Grouped configuration options
- **Product details**: Specifications, reviews, shipping info
- **Documentation**: Expandable sections of help content
- **Progressive disclosure**: Show details on demand

### When Not to Use
- **Primary content**: Don't hide essential information
- **Short content**: If all fits on screen, don't collapse
- **Complex navigation**: Use Tabs or Sidebar instead
- **Tables**: Accordion isn't suitable for tabular data

---

## Anatomy

```
┌────────────────────────────────────────┐
│ Section 1 Title                   ▼   │ ← AccordionTrigger (expanded)
├────────────────────────────────────────┤
│ This is the expanded content for       │ ← AccordionContent
│ section 1. It can contain any JSX.    │
├────────────────────────────────────────┤
│ Section 2 Title                   ▶   │ ← AccordionTrigger (collapsed)
├────────────────────────────────────────┤
│ Section 3 Title                   ▶   │ ← AccordionTrigger (collapsed)
└────────────────────────────────────────┘
       ↑
   AccordionItem (with border-b)
```

**Component Parts:**
1. **Accordion** - Root container (manages state)
2. **AccordionItem** - Individual collapsible section
3. **AccordionTrigger** - Clickable header with chevron icon
4. **AccordionContent** - Collapsible content panel

---

## Components

### Accordion (Root)

The root container managing accordion state.

```typescript
<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    {/* trigger and content */}
  </AccordionItem>
</Accordion>
```

**Props:**
- `type: "single" | "multiple"` - Single or multiple items open
- `collapsible?: boolean` - Allow closing all items (for type="single")
- `defaultValue?: string | string[]` - Initially open items
- `value?: string | string[]` - Controlled state
- `onValueChange?: (value) => void` - State change handler

### AccordionItem

Individual section container.

```typescript
<AccordionItem value="item-1">
  <AccordionTrigger>Title</AccordionTrigger>
  <AccordionContent>Content</AccordionContent>
</AccordionItem>
```

**Props:**
- `value: string` - Unique identifier (required)
- `disabled?: boolean` - Disable interaction

**Design tokens:**
- Border: `border-b` on all items
- Last item: `last:border-b-0` (no border)

### AccordionTrigger

Clickable header that toggles content.

```typescript
<AccordionTrigger>
  What is your return policy?
</AccordionTrigger>
```

**Features:**
- Automatic chevron icon (rotates when open)
- Full-width clickable area
- Hover underline effect
- Keyboard accessible

**Design tokens:**
- Padding: `py-4` (16px vertical)
- Font: `text-sm font-medium`
- Icon: ChevronDown, rotates 180° when open
- Hover: `hover:underline`
- Focus: Visible focus ring

### AccordionContent

The collapsible content panel.

```typescript
<AccordionContent>
  <p>We offer a 30-day return policy on all items...</p>
</AccordionContent>
```

**Features:**
- Smooth slide animation
- Automatic height calculation
- Overflow handling

**Design tokens:**
- Padding: `pt-0 pb-4` (16px bottom)
- Font: `text-sm`
- Animation: `accordion-down` (open), `accordion-up` (close)

---

## Variants

### Single (One at a time)
```typescript
<Accordion type="single" collapsible>
  {/* Only one item can be open */}
</Accordion>
```

### Multiple (Multiple open)
```typescript
<Accordion type="multiple">
  {/* Multiple items can be open simultaneously */}
</Accordion>
```

### Controlled
```typescript
const [value, setValue] = useState("item-1");

<Accordion type="single" value={value} onValueChange={setValue}>
  {/* Controlled state */}
</Accordion>
```

---

## States

### Closed
- Trigger shows right-pointing chevron
- Content hidden

### Open
- Trigger shows down-pointing chevron (rotated 180°)
- Content visible with slide animation

### Hover
- Trigger text underlined

### Focus
- Visible focus ring on trigger

### Disabled
- Item grayed out and non-interactive

---

## Usage Guidelines

### ✅ Do's

- **Use descriptive titles**: Clear, scannable headings
  ```typescript
  ✅ <AccordionTrigger>What is your return policy?</AccordionTrigger>
  ❌ <AccordionTrigger>Returns</AccordionTrigger>
  ```

- **Keep titles concise**: 1-2 lines maximum
  ```typescript
  ✅ "How do I reset my password?"
  ❌ "How do I reset my password if I've forgotten it and can't access my email?"
  ```

- **Group related content**: Logical organization
  ```typescript
  ✅ Shipping > Domestic, International
      Returns > Policy, Process
  ```

- **Use for optional information**: Not primary content
  ```typescript
  ✅ Product specs, FAQs, advanced settings
  ❌ Critical instructions, primary features
  ```

### ❌ Don'ts

- **Don't hide critical content**: Users might miss it
  ```typescript
  ❌ Pricing information in collapsed accordion
  ✅ Pricing visible, shipping details in accordion
  ```

- **Don't nest deeply**: 1-2 levels maximum
  ```typescript
  ❌ Accordion > Accordion > Accordion (too nested)
  ✅ Accordion > Content or Accordion > Tabs
  ```

- **Don't use for navigation**: Use Tabs or Sidebar
  ```typescript
  ❌ Accordion for main site navigation
  ✅ Tabs or Navigation Menu
  ```

- **Don't overuse**: If content is short, show it all
  ```typescript
  ❌ 3 accordions each with 1 sentence
  ✅ Show all 3 sentences without accordion
  ```

---

## Content Standards

### Titles
- **Question format for FAQs**: "How do I...?"
- **Noun phrases for specs**: "Technical Specifications"
- **Sentence case**: "Shipping information" not "Shipping Information"
- **Action verbs for processes**: "Set up your account"

### Content
- **Concise**: Keep content focused
- **Scannable**: Use lists, paragraphs, bold
- **Complete**: Don't require scrolling within accordion

---

## Accessibility

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Focus next accordion trigger |
| `Shift + Tab` | Focus previous trigger |
| `Enter` / `Space` | Toggle focused item |
| `Home` | Focus first trigger |
| `End` | Focus last trigger |

### Screen Reader Support

**ARIA attributes (automatic):**
- `role="button"` on triggers
- `aria-expanded="true|false"` on triggers
- `aria-controls="content-id"` links trigger to content
- `aria-labelledby="trigger-id"` on content

**Announcement example:**
```
"What is your return policy?, button, collapsed. Press Enter to expand."
[User presses Enter]
"What is your return policy?, expanded. We offer a 30-day return policy..."
```

### Best Practices

1. **Keyboard accessible**: All interactions via keyboard
2. **Focus visible**: Clear focus indicators
3. **Semantic HTML**: Proper heading levels in triggers
4. **Screen reader friendly**: ARIA attributes automatic

---

## Implementation

### Installation

```bash
npm install @radix-ui/react-accordion
npm install lucide-react
```

### Basic Implementation

```typescript
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function BasicAccordion() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>Section 1</AccordionTrigger>
        <AccordionContent>
          Content for section 1
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Section 2</AccordionTrigger>
        <AccordionContent>
          Content for section 2
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

---

## Examples

### Example 1: FAQ Accordion

```typescript
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is your return policy?",
    answer: "We offer a 30-day return policy on all items. Items must be in original condition with tags attached."
  },
  {
    question: "How long does shipping take?",
    answer: "Standard shipping takes 5-7 business days. Express shipping is available for 2-3 business days."
  },
  {
    question: "Do you ship internationally?",
    answer: "Yes, we ship to over 100 countries worldwide. International shipping rates vary by destination."
  },
];

export function FAQAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
```

### Example 2: Multiple Items Open

```typescript
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function MultipleAccordion() {
  return (
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="shipping">
        <AccordionTrigger>Shipping Information</AccordionTrigger>
        <AccordionContent>
          <p>Free shipping on orders over $50.</p>
          <p>Express shipping available for $15.</p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="returns">
        <AccordionTrigger>Return Policy</AccordionTrigger>
        <AccordionContent>
          <p>30-day return policy.</p>
          <p>Items must be unused and in original packaging.</p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="warranty">
        <AccordionTrigger>Warranty</AccordionTrigger>
        <AccordionContent>
          <p>1-year manufacturer warranty included.</p>
          <p>Extended warranty available for purchase.</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

### Example 3: Product Details Accordion

```typescript
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function ProductAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="specs">
        <AccordionTrigger>Technical Specifications</AccordionTrigger>
        <AccordionContent>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="font-medium">Dimensions:</dt>
              <dd className="text-muted-foreground">10" x 8" x 2"</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">Weight:</dt>
              <dd className="text-muted-foreground">1.5 lbs</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium">Material:</dt>
              <dd className="text-muted-foreground">Aluminum</dd>
            </div>
          </dl>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="shipping">
        <AccordionTrigger>Shipping & Returns</AccordionTrigger>
        <AccordionContent>
          <ul className="list-disc list-inside space-y-1">
            <li>Free standard shipping (5-7 days)</li>
            <li>Express shipping available ($15)</li>
            <li>30-day return policy</li>
            <li>Free return shipping</li>
          </ul>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="care">
        <AccordionTrigger>Care Instructions</AccordionTrigger>
        <AccordionContent>
          <p>Clean with a damp cloth. Do not use harsh chemicals. Store in a cool, dry place.</p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

### Example 4: Settings Accordion

```typescript
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function SettingsAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="notifications">
        <AccordionTrigger>Notification Settings</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">Email notifications</Label>
              <Switch id="email-notifications" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications">Push notifications</Label>
              <Switch id="push-notifications" />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="privacy">
        <AccordionTrigger>Privacy Settings</AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="profile-visible">Public profile</Label>
              <Switch id="profile-visible" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="activity-visible">Show activity</Label>
              <Switch id="activity-visible" />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

### Example 5: Controlled Accordion

```typescript
"use client";

import { useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function ControlledAccordion() {
  const [value, setValue] = useState<string>("item-1");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button onClick={() => setValue("item-1")}>Open Section 1</button>
        <button onClick={() => setValue("item-2")}>Open Section 2</button>
        <button onClick={() => setValue("")}>Close All</button>
      </div>

      <Accordion type="single" value={value} onValueChange={setValue} collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>Section 1</AccordionTrigger>
          <AccordionContent>Content for section 1</AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Section 2</AccordionTrigger>
          <AccordionContent>Content for section 2</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
```

### Example 6: Nested Content

```typescript
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function NestedAccordion() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="features">
        <AccordionTrigger>Product Features</AccordionTrigger>
        <AccordionContent>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="specs">Specs</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <p>This product features cutting-edge technology...</p>
            </TabsContent>
            <TabsContent value="specs">
              <p>Technical specifications and details...</p>
            </TabsContent>
          </Tabs>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

### Example 7: Default Open Item

```typescript
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function DefaultOpenAccordion() {
  return (
    <Accordion type="single" defaultValue="item-1" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>First Section (Open by Default)</AccordionTrigger>
        <AccordionContent>
          This section is open when the page loads.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Second Section</AccordionTrigger>
        <AccordionContent>
          This section starts closed.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

### Example 8: Disabled Item

```typescript
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function DisabledAccordion() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>Available Section</AccordionTrigger>
        <AccordionContent>This section can be opened.</AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="item-2" disabled>
        <AccordionTrigger>Disabled Section</AccordionTrigger>
        <AccordionContent>This content is not accessible.</AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="item-3">
        <AccordionTrigger>Another Available Section</AccordionTrigger>
        <AccordionContent>This section can also be opened.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
```

---

**Related Components:**
- [Tabs](../navigation/tabs.md) - Alternative for switching content
- [Dialog](./dialog.md) - Modal overlays for focused content
- [Card](./card.md) - Container for grouped content

**Design Tokens:**
- [Colors](../../tokens/colors.md)
- [Typography](../../tokens/typography.md)
- [Spacing](../../tokens/spacing.md)
- [Animation](../../tokens/effects.md)
