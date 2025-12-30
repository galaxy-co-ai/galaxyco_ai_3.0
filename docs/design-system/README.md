# GalaxyCo Design System

**Version 1.0.0** | Last Updated: 2025-12-30

A comprehensive, accessible, and production-ready design system for GalaxyCo AI platform. Built with React, TypeScript, Tailwind CSS, and Radix UI primitives.

---

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Design Principles](#design-principles)
- [Components](#components)
- [Design Tokens](#design-tokens)
- [Accessibility](#accessibility)
- [Contributing](#contributing)
- [Resources](#resources)

---

## Overview

The GalaxyCo Design System provides a unified set of reusable components, patterns, and guidelines to build consistent, accessible, and high-quality user experiences across the platform.

### Goals

- **Consistency**: Unified visual language and interaction patterns
- **Accessibility**: WCAG 2.1 AA compliant components with full keyboard navigation
- **Developer Experience**: Type-safe, well-documented, easy to integrate
- **Performance**: Optimized for production with minimal bundle size
- **Flexibility**: Composable primitives that adapt to complex use cases

### Tech Stack

- **React 19** - UI framework
- **TypeScript 5.7** - Type safety
- **Tailwind CSS 4.0** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon system
- **React Hook Form + Zod** - Form validation

---

## Getting Started

### Installation

All design system components are located in `src/components/ui/` and can be imported directly:

```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
```

### Quick Example

```typescript
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function QuickStart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to GalaxyCo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Enter your name" />
        <Button>Get Started</Button>
      </CardContent>
    </Card>
  );
}
```

### Documentation Structure

Each component follows the **Spectrum 2** documentation standard with 10 sections:

1. **Overview** - When to use, when not to use
2. **Anatomy** - Visual structure and component parts
3. **Components** - API reference for all subcomponents
4. **Variants** - Visual and behavioral variations
5. **States** - Interactive states (hover, focus, disabled, etc.)
6. **Usage Guidelines** - Do's and don'ts with examples
7. **Content Standards** - Copy, tone, and formatting
8. **Accessibility** - Keyboard navigation, ARIA, screen readers
9. **Implementation** - Installation and code patterns
10. **Examples** - 8-12 production-ready code examples

---

## Design Principles

### 1. Accessible by Default

Every component is built with accessibility as a first-class citizen:
- Full keyboard navigation
- Screen reader support with proper ARIA attributes
- Focus management and visible focus indicators
- Color contrast meeting WCAG 2.1 AA standards
- Touch targets minimum 44×44px on mobile

### 2. Mobile-First Responsive

Design for 375px mobile width first, then scale up:
- Bottom navigation on mobile
- Touch-optimized interactions
- Responsive breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- Safe area padding for notched devices

### 3. Composable & Flexible

Components are built as composable primitives:
- Single responsibility principle
- Compound component patterns
- Controlled and uncontrolled modes
- Customizable via props and className overrides

### 4. Type-Safe

Zero tolerance for `any` types:
- Full TypeScript coverage
- Props documentation with JSDoc
- Zod schemas for runtime validation
- Inferred types from Radix UI primitives

### 5. Performance-Optimized

Production-grade performance:
- Code splitting and lazy loading
- Minimal bundle size impact
- No runtime CSS-in-JS overhead
- Optimized re-renders with React best practices

---

## Components

### Actions (1)

| Component | Description | Status |
|-----------|-------------|--------|
| [Button](./components/actions/button.md) | Clickable element for user actions | ✅ Complete |

### Containers (3)

| Component | Description | Status |
|-----------|-------------|--------|
| [Card](./components/containers/card.md) | Container for grouping related content | ✅ Complete |
| [Dialog](./components/containers/dialog.md) | Modal overlay for focused tasks | ✅ Complete |
| [Popover](./components/containers/popover.md) | Floating container for contextual content | ✅ Complete |

### Data Display (2)

| Component | Description | Status |
|-----------|-------------|--------|
| [Badge](./components/data/badge.md) | Small label for status or metadata | ✅ Complete |
| [Table](./components/data/table.md) | Tabular data with sorting and selection | ✅ Complete |

### Feedback (3)

| Component | Description | Status |
|-----------|-------------|--------|
| [Alert Dialog](./components/feedback/alert-dialog.md) | Interrupting confirmation dialogs | ✅ Complete |
| [Toast](./components/feedback/toast.md) | Temporary notifications (Sonner) | ✅ Complete |
| [Tooltip](./components/feedback/tooltip.md) | Contextual hints on hover | ✅ Complete |

### Inputs (7)

| Component | Description | Status |
|-----------|-------------|--------|
| [Checkbox](./components/inputs/checkbox.md) | Binary on/off selection | ✅ Complete |
| [Form](./components/inputs/form.md) | Form wrapper with validation (React Hook Form + Zod) | ✅ Complete |
| [Input](./components/inputs/input.md) | Single-line text input | ✅ Complete |
| [Radio Group](./components/inputs/radio-group.md) | Mutually exclusive selection | ✅ Complete |
| [Select](./components/inputs/select.md) | Dropdown selection menu | ✅ Complete |
| [Switch](./components/inputs/switch.md) | Toggle on/off control | ✅ Complete |
| [Textarea](./components/inputs/textarea.md) | Multi-line text input | ✅ Complete |

### Navigation (3)

| Component | Description | Status |
|-----------|-------------|--------|
| [Context Menu](./components/navigation/context-menu.md) | Right-click contextual actions | ✅ Complete |
| [Dropdown Menu](./components/navigation/dropdown-menu.md) | Click-triggered action menus | ✅ Complete |
| [Tabs](./components/navigation/tabs.md) | Content organization in tabbed views | ✅ Complete |

### Coming in Phase 3

| Component | Description | Status |
|-----------|-------------|--------|
| Accordion | Collapsible content sections | 🔄 Planned |
| Breadcrumbs | Hierarchical navigation trail | 🔄 Planned |
| Command Menu | Command palette / search | 🔄 Planned |
| Hover Card | Rich hover preview card | 🔄 Planned |
| Menubar | Application menu bar | 🔄 Planned |
| Pagination | Page navigation controls | 🔄 Planned |
| Progress | Progress indicator bar | 🔄 Planned |
| Skeleton | Loading placeholder | 🔄 Planned |

---

## Design Tokens

Design tokens provide a single source of truth for design decisions. They are located in `src/design-system/tokens/`.

### Token Categories

- **Colors** - Brand, semantic, and neutral color palettes
- **Typography** - Font families, sizes, weights, and line heights
- **Spacing** - Consistent spacing scale (4px base grid)
- **Effects** - Shadows, borders, blur, and animations
- **Breakpoints** - Responsive design breakpoints
- **Z-Index** - Layering system for overlays

### Using Tokens

Tokens are implemented as Tailwind CSS utilities:

```typescript
// Colors
<div className="bg-primary text-primary-foreground" />
<div className="bg-card border text-card-foreground" />

// Typography
<h1 className="text-4xl font-bold tracking-tight" />
<p className="text-sm text-muted-foreground" />

// Spacing
<div className="p-6 space-y-4" />
<div className="mx-auto max-w-7xl" />

// Effects
<div className="rounded-lg border shadow-md" />
<div className="transition-colors duration-200" />
```

---

## Accessibility

### WCAG 2.1 AA Compliance

All components meet WCAG 2.1 Level AA standards:

- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Focus Indicators**: Visible focus states with `ring-2 ring-ring`
- **Screen Readers**: Proper ARIA attributes and semantic HTML
- **Touch Targets**: Minimum 44×44px for interactive elements

### Keyboard Navigation

Standard keyboard shortcuts across components:

| Key | Action |
|-----|--------|
| `Tab` | Focus next element |
| `Shift + Tab` | Focus previous element |
| `Enter` / `Space` | Activate button or toggle |
| `Esc` | Close dialog, menu, or popover |
| `↑` / `↓` | Navigate menu items, select options |
| `Home` / `End` | First/last item in lists |

### Testing Checklist

Before shipping a feature:

- [ ] Test with keyboard only (no mouse)
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Test on mobile device (touch interactions)
- [ ] Verify color contrast with Chrome DevTools
- [ ] Check focus states are visible
- [ ] Validate ARIA attributes with axe DevTools

---

## Contributing

### Adding New Components

1. **Create component** in `src/components/ui/[component-name].tsx`
   - Follow existing patterns (Radix primitives, forwardRef, variants)
   - Use TypeScript with explicit types (no `any`)
   - Apply design tokens via Tailwind utilities

2. **Write documentation** in `docs/design-system/components/[category]/[component-name].md`
   - Follow Spectrum 2 structure (10 sections)
   - Include 8-12 production-ready examples
   - Document all props with TypeScript types
   - Add accessibility section with keyboard navigation

3. **Update this index** (`docs/design-system/README.md`)
   - Add component to appropriate category table
   - Update component count

### Modifying Existing Components

1. **Check documentation** first to understand design decisions
2. **Maintain backward compatibility** - breaking changes require major version bump
3. **Update documentation** if behavior or API changes
4. **Run health checks**:
   ```bash
   npm run typecheck  # Zero TypeScript errors
   npm run lint       # Zero ESLint errors
   npm run build      # Successful production build
   npm test           # All tests passing
   ```

### Code Standards

- **No `any` types** - Use explicit types or `unknown`
- **Accessibility first** - Keyboard, ARIA, screen readers
- **Mobile-first responsive** - Design for 375px, scale up
- **Composable patterns** - Small, focused components
- **Error boundaries** - Wrap feature areas in error boundaries
- **Conventional commits** - `type(scope): message` format

Example commit:
```bash
git commit -m "feat(button): add loading state with spinner

- Add isLoading prop to Button component
- Show spinner icon when loading
- Disable interactions during loading state

Co-Authored-By: Warp <agent@warp.dev>"
```

---

## Resources

### Internal Documentation

- [Organization Guidelines](../guides/ORGANIZATION_GUIDELINES.md) - Project structure and patterns
- [Agent Instructions](../guides/AGENT_INSTRUCTIONS.md) - AI agent collaboration guidelines
- [AI Context](../status/AI_CONTEXT.md) - Current project status

### External Resources

- [Radix UI Documentation](https://www.radix-ui.com/primitives/docs/overview/introduction) - Primitive components
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS
- [Lucide Icons](https://lucide.dev/icons/) - Icon library
- [React Hook Form](https://react-hook-form.com/) - Form management
- [Zod](https://zod.dev/) - Schema validation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - Accessibility standards

### Design Inspiration

- [Adobe Spectrum](https://spectrum.adobe.com/) - Documentation structure inspiration
- [Radix Themes](https://www.radix-ui.com/themes/docs/overview/getting-started) - Component patterns
- [shadcn/ui](https://ui.shadcn.com/) - Implementation reference
- [Vercel Design](https://vercel.com/design) - Visual aesthetic

---

## Component Statistics

- **Total Components**: 19 documented
- **Documentation Lines**: ~18,500+ lines
- **Examples**: 150+ production-ready code samples
- **Accessibility**: 100% WCAG 2.1 AA compliant
- **TypeScript Coverage**: 100% (zero `any` types in components)

---

## Changelog

### Version 1.0.0 (2025-12-30)

**Phase 2C Complete** - Feedback & Overlay Components
- Added Context Menu component documentation
- Added Dropdown Menu component documentation
- Added Tooltip component documentation
- Added Popover component documentation
- Added Toast component documentation (Sonner integration)
- Added Alert Dialog component documentation

**Phase 2B Complete** - Input Components
- Added Form component documentation (React Hook Form + Zod)
- Added Textarea component documentation
- Added Radio Group component documentation
- Added Switch component documentation
- Added Select component documentation
- Added Checkbox component documentation

**Phase 2A Complete** - Foundation Components
- Added Table component documentation
- Added Tabs component documentation
- Added Input component documentation
- Added Card component documentation
- Added Dialog component documentation
- Added Badge component documentation
- Added Button component documentation

---

**Maintained by**: GalaxyCo AI Engineering Team  
**License**: Proprietary  
**Support**: Internal design system team

For questions or contributions, reach out via internal Slack #design-system channel.
