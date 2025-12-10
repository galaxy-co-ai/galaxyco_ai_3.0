Audit this component for WCAG 2.1 AA compliance and provide specific fixes:

## Semantic HTML
- [ ] Uses appropriate semantic elements (`<button>`, `<nav>`, `<main>`, `<article>`, `<section>`)
- [ ] No `<div>` buttons (use actual `<button>` elements)
- [ ] Heading hierarchy is logical (h1 → h2 → h3, no skipping)
- [ ] Form fields have associated `<label>` elements

## ARIA Labels & Roles
- [ ] All interactive elements have accessible names
- [ ] Icon-only buttons have `aria-label`
- [ ] Complex widgets have appropriate `role` attributes
- [ ] Form fields have `aria-describedby` for error messages
- [ ] Loading states announce to screen readers (`aria-live="polite"`)

## Keyboard Navigation
- [ ] All interactive elements are reachable with Tab
- [ ] Tab order is logical (follows visual order)
- [ ] Enter/Space keys work on buttons
- [ ] Escape key closes modals/dropdowns
- [ ] Arrow keys navigate within lists/menus
- [ ] Focus is trapped in modals when open
- [ ] Focus returns to trigger element when closing

## Focus Indicators
- [ ] All focusable elements have visible focus ring
- [ ] Focus ring has sufficient contrast (3:1 minimum)
- [ ] Custom focus styles don't hide the indicator
- [ ] Use `ring-2 ring-primary/40` class for consistency

## Color Contrast
- [ ] Normal text: 4.5:1 contrast ratio minimum
- [ ] Large text (18px+): 3:1 contrast ratio minimum
- [ ] UI components: 3:1 contrast ratio minimum
- [ ] Check against both light and dark modes

## Form Accessibility
- [ ] Labels are programmatically associated with inputs
- [ ] Required fields are marked (`aria-required="true"`)
- [ ] Error messages use `aria-invalid` and `aria-describedby`
- [ ] Success messages are announced to screen readers

## Common Issues to Fix

### ❌ Icon-only button without label
```tsx
<button onClick={handleDelete}>
  <Trash2 className="h-4 w-4" />
</button>
```

### ✅ Fixed with aria-label
```tsx
<button 
  onClick={handleDelete}
  aria-label="Delete item"
  className="focus:ring-2 focus:ring-primary/40"
>
  <Trash2 className="h-4 w-4" />
</button>
```

### ❌ Div acting as button
```tsx
<div onClick={handleClick} className="cursor-pointer">
  Click me
</div>
```

### ✅ Use actual button
```tsx
<button onClick={handleClick} className="focus:ring-2 focus:ring-primary/40">
  Click me
</button>
```

### ❌ Form field without label
```tsx
<input type="email" placeholder="Email" />
```

### ✅ Proper label association
```tsx
<label htmlFor="email" className="sr-only">Email address</label>
<input 
  id="email"
  type="email" 
  placeholder="Email"
  aria-required="true"
/>
```

### ❌ Modal without focus trap
```tsx
<Dialog open={isOpen}>
  <DialogContent>...</DialogContent>
</Dialog>
```

### ✅ With focus management
```tsx
<Dialog 
  open={isOpen} 
  onOpenChange={setIsOpen}
  modal={true}
>
  <DialogContent 
    onOpenAutoFocus={(e) => {
      // Focus first input
      e.preventDefault();
      inputRef.current?.focus();
    }}
    onCloseAutoFocus={(e) => {
      // Return focus to trigger
      e.preventDefault();
      triggerRef.current?.focus();
    }}
  >
    ...
  </DialogContent>
</Dialog>
```

## Testing Checklist
- [ ] Navigate entire component using only keyboard
- [ ] Test with screen reader (NVDA/JAWS on Windows, VoiceOver on Mac)
- [ ] Verify all interactive elements are announced correctly
- [ ] Check color contrast with browser DevTools
- [ ] Test with browser zoom at 200%
- [ ] Verify focus is visible and logical

## Tools
- Chrome DevTools Lighthouse (Accessibility audit)
- axe DevTools browser extension
- WAVE browser extension
- Color contrast analyzer

Provide a complete list of issues found with specific code fixes for each one.

