# Card

**Version 1.0.0**

Cards are flexible containers that group related content and actions. They provide a clear visual hierarchy and are commonly used for displaying content collections, summaries, and detailed information.

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
- **Content grouping**: Organize related information together
- **Product/feature displays**: Show items in grids or lists
- **Dashboard widgets**: Display stats, charts, or summaries
- **Forms**: Group related form fields
- **Media previews**: Combine image, title, and metadata
- **Action panels**: Present options with descriptions

### When Not to Use
- **Page sections**: Use semantic HTML sections instead
- **Single items of text**: Use regular text elements
- **Navigation links**: Use navigation components instead
- **Complex layouts**: Consider custom layouts
- **Alerts/notifications**: Use [Alert](#) or [Toast](#) components

---

## Anatomy

```
┌─────────────────────────────────────────┐
│  Card Header                      [⋮]   │  ← Title, description, optional action
│  ├─ Title                               │
│  └─ Description                         │
├─────────────────────────────────────────┤
│                                         │
│  Card Content                           │  ← Main content area
│  (Any content: text, form, media, etc.)│
│                                         │
├─────────────────────────────────────────┤
│  Card Footer                            │  ← Actions or metadata
│  [Cancel]           [Primary Action]    │
└─────────────────────────────────────────┘
```

**Component Parts:**
1. **Card** - Container with border, background, rounded corners
2. **CardHeader** - Title/description area with optional action
3. **CardTitle** - Main heading (required in header)
4. **CardDescription** - Supporting text (optional)
5. **CardAction** - Action button/menu in header (optional)
6. **CardContent** - Main content area
7. **CardFooter** - Bottom actions or metadata (optional)

---

## Options

### Subcomponents

#### Card (Container)
Base container that wraps all card content.

```typescript
<Card>
  {/* Card content */}
</Card>
```

**Design tokens:**
- Background: `card-background-color-default` (`var(--card)`)
- Border: `card-border-color-default` (`var(--border)`)
- Foreground: `card-foreground-color-default` (`var(--card-foreground)`)
- Border radius: `radius-xl` (16px)
- Gap: `stack-gap-300` (24px internal spacing)

#### CardHeader
Header area containing title, description, and optional action.

```typescript
<CardHeader>
  <CardTitle>Card Title</CardTitle>
  <CardDescription>Optional description</CardDescription>
  <CardAction>{/* Optional action */}</CardAction>
</CardHeader>
```

**Design tokens:**
- Padding: `card-padding-200` (24px top/sides)
- Gap: `stack-gap-100` (8px between title and description)

#### CardTitle
Primary heading for the card.

```typescript
<CardTitle>Project Dashboard</CardTitle>
```

**Typography:**
- Semantic: `<h4>` heading element
- Line height: Tight (`leading-none`)
- Inherits font size from context

#### CardDescription
Supporting text below title.

```typescript
<CardDescription>
  View your project metrics and recent activity
</CardDescription>
```

**Design tokens:**
- Color: `muted-foreground-color-default` (`var(--muted-foreground)`)

#### CardAction
Action element in header (button, menu, etc.).

```typescript
<CardAction>
  <Button size="icon" variant="ghost">
    <MoreVertical className="w-4 h-4" />
  </Button>
</CardAction>
```

**Layout:**
- Positioned top-right of header
- Aligns with title/description grid

#### CardContent
Main content area for any content.

```typescript
<CardContent>
  <p>Main content goes here</p>
</CardContent>
```

**Design tokens:**
- Padding: `card-padding-200` (24px sides)
- Bottom padding if last child: 24px

#### CardFooter
Bottom area for actions or metadata.

```typescript
<CardFooter>
  <Button variant="outline">Cancel</Button>
  <Button>Save</Button>
</CardFooter>
```

**Design tokens:**
- Padding: `card-padding-200` (24px sides/bottom)
- Flexbox layout for actions

### Variants

#### Default Card
Standard card with soft elevation.

```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

#### Interactive Card
Clickable card with hover effects.

```typescript
<Card className="cursor-pointer hover:shadow-soft-hover transition-shadow">
  <CardHeader>
    <CardTitle>Clickable Card</CardTitle>
  </CardHeader>
</Card>
```

#### Glass Card (from Design System)
Card with glass morphism effect.

```typescript
import { GlassCard } from '@/design-system/primitives/glass';

<GlassCard intensity="medium">
  <CardHeader>
    <CardTitle>Glass Card</CardTitle>
  </CardHeader>
</GlassCard>
```

### States

- **Default** - Normal resting state
- **Hover** - Enhanced shadow (if interactive)
- **Focus** - Focus ring (if interactive/clickable)
- **Disabled** - Reduced opacity (rare for cards)

---

## Behaviors

### Hover (Interactive Cards)
- Enhanced shadow: `hover:shadow-soft-hover`
- Subtle lift effect: `hover:-translate-y-0.5`
- Smooth transition: `transition-all duration-200`

### Click/Focus (Interactive Cards)
- Focus ring for keyboard navigation
- Active state feedback

### Responsive Layout
- Full width on mobile: `w-full`
- Grid/flex layouts on larger screens
- Stack cards vertically on small screens

### Content Overflow
- Content scrolls if needed
- Consider max-height for long content
- Use proper truncation for titles/descriptions

---

## Usage Guidelines

### ✅ Do's

**Use cards to group related content**
```typescript
✅
<Card>
  <CardHeader>
    <CardTitle>Project Alpha</CardTitle>
    <CardDescription>Website redesign project</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Status: In Progress</p>
    <p>Due: Dec 31, 2025</p>
  </CardContent>
</Card>
```

**Include clear titles**
```typescript
✅
<CardHeader>
  <CardTitle>Settings</CardTitle>
  <CardDescription>Manage your account preferences</CardDescription>
</CardHeader>
```

**Use CardFooter for actions**
```typescript
✅
<CardFooter className="flex justify-between">
  <Button variant="outline">Cancel</Button>
  <Button>Save Changes</Button>
</CardFooter>
```

**Make interactive cards clearly clickable**
```typescript
✅
<Card 
  className="cursor-pointer hover:shadow-soft-hover transition-shadow"
  onClick={handleClick}
  role="button"
  tabIndex={0}
>
  {/* Card content */}
</Card>
```

### ❌ Don'ts

**Don't nest cards deeply**
```typescript
❌
<Card>
  <Card>
    <Card>{/* Too nested */}</Card>
  </Card>
</Card>

✅ Use sections or separate cards instead
```

**Don't make cards too wide**
```typescript
❌ <Card className="w-full max-w-none" />  // Too wide, hard to read

✅ <Card className="max-w-2xl" />  // Readable width
```

**Don't overload with actions**
```typescript
❌
<CardFooter>
  <Button>Action 1</Button>
  <Button>Action 2</Button>
  <Button>Action 3</Button>
  <Button>Action 4</Button>  // Too many
</CardFooter>

✅
<CardFooter>
  <Button variant="outline">Cancel</Button>
  <Button>Primary Action</Button>
</CardFooter>
```

**Don't use cards for single text items**
```typescript
❌ <Card><CardContent><p>Single line</p></CardContent></Card>

✅ Use regular text elements or list items
```

---

## Content Standards

### Titles

**Be concise and descriptive**
```typescript
✅ "Monthly Revenue"
✅ "User Settings"
✅ "Recent Activity"
❌ "This is the Monthly Revenue Dashboard Card"
❌ "Card"
```

**Use sentence case**
```typescript
✅ "Account settings"
❌ "Account Settings"  // Title case
❌ "ACCOUNT SETTINGS"  // All caps
```

### Descriptions

**Provide context, not repetition**
```typescript
✅ "View and export your financial data"
✅ "Last updated 5 minutes ago"
❌ "This is the Monthly Revenue card"  // Repeats title
```

**Keep it brief**
```typescript
✅ "Manage your team members and permissions"
❌ "This card allows you to manage all aspects of your team including adding new members, removing existing members, and adjusting their permission levels"
```

### Actions

**Use clear, action-oriented labels**
```typescript
✅ "View details"
✅ "Edit project"
✅ "Delete"
❌ "Click here"
❌ "Go"
```

---

## Accessibility

### Semantic HTML
- Card uses `<div>` with `data-slot="card"`
- CardTitle uses `<h4>` heading element
- CardDescription uses `<p>` element
- Proper heading hierarchy maintained

### Interactive Cards

**Keyboard navigation**
```typescript
<Card 
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  role="button"
  tabIndex={0}
  aria-label="View project details"
>
  {/* Card content */}
</Card>
```

**Focus states**
- Add focus ring: `focus-visible:ring-2 focus-visible:ring-ring`
- Clear focus indicator required

### Screen Readers
- Use proper heading hierarchy (h1-h6)
- Associate actions with card content
- Use `aria-label` for icon-only actions
- Provide context for complex cards

### Color Contrast
- Card text: 4.5:1 minimum contrast
- Title text: 7:1 contrast (AAA)
- Border: 3:1 contrast against background
- Interactive elements meet contrast requirements

### Touch Targets
- Action buttons: minimum 44×44px
- Interactive cards: full card area tappable
- Adequate spacing between cards

---

## Implementation

### Basic Card
```typescript
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

function BasicCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description text</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Main card content goes here.</p>
      </CardContent>
    </Card>
  );
}
```

### Card with Action
```typescript
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';

<Card>
  <CardHeader>
    <CardTitle>Project Dashboard</CardTitle>
    <CardDescription>Overview of your projects</CardDescription>
    <CardAction>
      <Button size="icon" variant="ghost">
        <MoreVertical className="w-4 h-4" />
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Card with Footer
```typescript
<Card>
  <CardHeader>
    <CardTitle>Delete Project</CardTitle>
    <CardDescription>
      This action cannot be undone
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p>Are you sure you want to delete this project?</p>
  </CardContent>
  <CardFooter className="flex justify-end gap-2">
    <Button variant="outline">Cancel</Button>
    <Button variant="destructive">Delete</Button>
  </CardFooter>
</Card>
```

### Interactive Card
```typescript
<Card 
  className="cursor-pointer hover:shadow-soft-hover transition-all hover:-translate-y-0.5"
  onClick={() => console.log('Card clicked')}
>
  <CardHeader>
    <CardTitle>Clickable Card</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Click anywhere on this card</p>
  </CardContent>
</Card>
```

### Glass Card
```typescript
import { GlassCard } from '@/design-system/primitives/glass';

<GlassCard intensity="medium">
  <CardHeader>
    <CardTitle>Glass Morphism Card</CardTitle>
    <CardDescription>With backdrop blur effect</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content with glass effect</p>
  </CardContent>
</GlassCard>
```

### Card Grid
```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>
    <CardHeader>
      <CardTitle>Card 1</CardTitle>
    </CardHeader>
    <CardContent>Content 1</CardContent>
  </Card>
  
  <Card>
    <CardHeader>
      <CardTitle>Card 2</CardTitle>
    </CardHeader>
    <CardContent>Content 2</CardContent>
  </Card>
  
  <Card>
    <CardHeader>
      <CardTitle>Card 3</CardTitle>
    </CardHeader>
    <CardContent>Content 3</CardContent>
  </Card>
</div>
```

---

## Examples

### Dashboard Stat Card
```typescript
<Card>
  <CardHeader>
    <CardTitle>Total Revenue</CardTitle>
    <CardDescription>Last 30 days</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold">$45,231</div>
    <p className="text-sm text-muted-foreground mt-2">
      +20.1% from last month
    </p>
  </CardContent>
</Card>
```

### Project Card
```typescript
<Card>
  <CardHeader>
    <CardTitle>Website Redesign</CardTitle>
    <CardDescription>Client: Acme Corporation</CardDescription>
    <CardAction>
      <Button size="icon" variant="ghost">
        <MoreVertical className="w-4 h-4" />
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Status</span>
        <Badge variant="soft" tone="info">In Progress</Badge>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Due Date</span>
        <span>Dec 31, 2025</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Progress</span>
        <span>65%</span>
      </div>
    </div>
  </CardContent>
  <CardFooter>
    <Button variant="outline" className="w-full">
      View Details
    </Button>
  </CardFooter>
</Card>
```

### Form Card
```typescript
<Card>
  <CardHeader>
    <CardTitle>Update Profile</CardTitle>
    <CardDescription>
      Make changes to your profile information
    </CardDescription>
  </CardHeader>
  <CardContent>
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="John Doe" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="john@example.com" />
      </div>
    </form>
  </CardContent>
  <CardFooter className="flex justify-end gap-2">
    <Button variant="outline">Cancel</Button>
    <Button>Save Changes</Button>
  </CardFooter>
</Card>
```

### Feature Card (Marketing)
```typescript
<Card className="text-center">
  <CardHeader>
    <div className="mx-auto mb-4 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
      <Zap className="w-6 h-6 text-primary" />
    </div>
    <CardTitle>Lightning Fast</CardTitle>
    <CardDescription>
      Built for speed and performance
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">
      Our infrastructure ensures your applications run at peak performance
      with 99.9% uptime.
    </p>
  </CardContent>
  <CardFooter className="justify-center">
    <Button variant="link">Learn more →</Button>
  </CardFooter>
</Card>
```

### Media Card
```typescript
<Card className="overflow-hidden">
  <div className="aspect-video bg-muted">
    <img 
      src="/project-thumbnail.jpg" 
      alt="Project thumbnail"
      className="w-full h-full object-cover"
    />
  </div>
  <CardHeader>
    <CardTitle>Project Showcase</CardTitle>
    <CardDescription>Web application design</CardDescription>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">
      A modern web application built with Next.js and TypeScript.
    </p>
  </CardContent>
  <CardFooter className="gap-2">
    <Button variant="outline" className="flex-1">
      <Eye className="w-4 h-4 mr-2" />
      Preview
    </Button>
    <Button className="flex-1">
      <ExternalLink className="w-4 h-4 mr-2" />
      Open
    </Button>
  </CardFooter>
</Card>
```

### Notification Card
```typescript
<Card>
  <CardHeader>
    <div className="flex items-start gap-4">
      <Avatar>
        <AvatarImage src="/user-avatar.jpg" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <CardTitle className="text-base">John Doe</CardTitle>
        <CardDescription>Mentioned you in a comment</CardDescription>
      </div>
      <span className="text-xs text-muted-foreground">2m ago</span>
    </div>
  </CardHeader>
  <CardContent>
    <p className="text-sm">
      "Could you review the latest design updates when you get a chance?"
    </p>
  </CardContent>
  <CardFooter className="gap-2">
    <Button variant="outline" size="sm">Dismiss</Button>
    <Button size="sm">Reply</Button>
  </CardFooter>
</Card>
```

### Settings Card
```typescript
<Card>
  <CardHeader>
    <CardTitle>Email Notifications</CardTitle>
    <CardDescription>
      Choose what emails you want to receive
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">Marketing emails</p>
        <p className="text-sm text-muted-foreground">
          Receive emails about new products and features
        </p>
      </div>
      <Switch />
    </div>
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium">Security alerts</p>
        <p className="text-sm text-muted-foreground">
          Get notified about account security
        </p>
      </div>
      <Switch defaultChecked />
    </div>
  </CardContent>
</Card>
```

---

## Design Tokens Reference

```typescript
// From tokens/colors.ts
card-background-color-default: var(--card)
card-border-color-default: var(--border)
card-foreground-color-default: var(--card-foreground)

// From tokens/spacing.ts
card-padding-100: 1rem            // 16px
card-padding-200: 1.5rem          // 24px - Default
card-padding-300: 2rem            // 32px

stack-gap-100: 0.5rem             // 8px - Title to description
stack-gap-300: 1.5rem             // 24px - Between sections

// From tokens/effects.ts
shadow-soft: 0 2px 8px rgba(0, 0, 0, 0.08)
shadow-soft-hover: 0 4px 16px rgba(0, 0, 0, 0.12)
shadow-elevation-1: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)

radius-xl: 1rem                   // 16px - Card border radius
```

---

## Related Components

- [Dialog](#) - Modal dialogs (card-like containers)
- [Badge](#) - Status indicators for cards
- [Button](#) - Actions in card footers
- [GlassCard](#) - Glass morphism variant

---

## Changelog

### Version 1.0.0 (2025-12-30)
- Initial documentation following Spectrum 2 structure
- Documented all 7 card subcomponents
- Added comprehensive usage guidelines
- Added accessibility documentation
- Added design token references
- Added 8 real-world examples

---

**Last Updated**: 2025-12-30  
**Component Location**: `src/components/ui/card.tsx`  
**Primitive Wrapper**: `src/design-system/primitives/glass.tsx` (GlassCard variant)
