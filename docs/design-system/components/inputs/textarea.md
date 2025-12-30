# Textarea

**Version 1.0.0**

Textareas allow users to enter and edit multi-line text. They are used for longer-form content like comments, descriptions, messages, and notes.

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
- **Long-form text**: Comments, descriptions, messages, notes
- **Multi-line input**: Content that spans multiple lines
- **User-generated content**: Reviews, feedback, posts
- **Form descriptions**: Bio, about sections, additional info
- **Code/structured text**: JSON, code snippets, formatted content

### When Not to Use
- **Single line text**: Use [Input](#) instead
- **Limited characters (< 100)**: Use [Input](#) instead
- **Rich formatting needed**: Use rich text editor
- **Predefined options**: Use [Select](#) or other pickers
- **Single word/short phrase**: Use [Input](#) instead

---

## Anatomy

```
┌─────────────────────────────────────────┐
│  Placeholder text or user content       │
│  that can span multiple lines           │
│  with automatic line breaks             │
│                                         │
│                                         │
└─────────────────────────────────────────┘
```

**Component Parts:**
1. **Container** - Border, background, padding
2. **Text area** - Multi-line editable region
3. **Label** (recommended) - Field description
4. **Helper text** (optional) - Character count, guidance
5. **Resize handle** (optional) - Manual resize control

---

## Options

### Sizes

Textarea auto-sizes based on content with `field-sizing-content`:

```typescript
<Textarea className="min-h-16" />   // Minimum 64px (4 lines)
<Textarea className="min-h-24" />   // Minimum 96px (6 lines)
<Textarea className="min-h-32" />   // Minimum 128px (8 lines)
```

**Design tokens:**
- Min height: `min-h-16` (64px default)
- Padding: `px-3 py-2` (12px horizontal, 8px vertical)

### States

- **Default** - Normal resting state
- **Hover** - Mouse over
- **Focus** - Active editing (`focus-visible:ring-[3px]`)
- **Filled** - Contains user input
- **Error** - Invalid input (`aria-invalid`)
- **Disabled** - Cannot interact (`disabled:opacity-50`)
- **Read-only** - Display only, no editing

### Resize

```typescript
<Textarea />  // No resize (default: resize-none)
<Textarea className="resize-y" />  // Vertical resize
<Textarea className="resize" />    // Both directions
```

---

## Behaviors

### Auto-sizing
- Uses `field-sizing-content` for automatic height adjustment
- Grows as user types
- Respects `min-h-*` constraints
- No maximum height (scrolls if needed)

### Focus
- Shows focus ring: `focus-visible:ring-[3px] focus-visible:ring-ring/50`
- Border changes to ring color: `focus-visible:border-ring`
- Smooth transition

### Keyboard Navigation
- **Tab**: Focus next field
- **Shift + Tab**: Focus previous field
- **Enter**: New line (not form submit)
- **Ctrl/Cmd + A**: Select all text
- Standard text editing shortcuts work

### Text Selection
- Selected text has accent background: `selection:bg-primary`
- Selected text has contrasting foreground

---

## Usage Guidelines

### ✅ Do's

**Always include labels**
```typescript
✅
<div className="space-y-2">
  <Label htmlFor="description">Description</Label>
  <Textarea id="description" placeholder="Describe your project..." />
</div>
```

**Provide helpful placeholders**
```typescript
✅ <Textarea placeholder="Write your comment here..." />
✅ <Textarea placeholder="Tell us about yourself" />
```

**Show character counts for limits**
```typescript
✅
<div className="space-y-2">
  <Label htmlFor="bio">Bio</Label>
  <Textarea id="bio" maxLength={160} />
  <p className="text-sm text-muted-foreground text-right">
    {charCount}/160 characters
  </p>
</div>
```

**Use appropriate minimum heights**
```typescript
✅ <Textarea className="min-h-32" />  // For longer content
✅ <Textarea className="min-h-16" />  // For shorter content
```

### ❌ Don'ts

**Don't use for single-line input**
```typescript
❌ <Textarea />  // For name, email, etc.

✅ <Input />  // Use Input for single-line
```

**Don't make too small**
```typescript
❌ <Textarea className="min-h-8" />  // Too cramped

✅ <Textarea className="min-h-16" />  // At least 4 lines
```

**Don't forget validation feedback**
```typescript
❌ <Textarea aria-invalid="true" />  // No error message

✅
<Textarea aria-invalid="true" aria-describedby="error" />
<p id="error" className="text-sm text-destructive">
  Description is required
</p>
```

---

## Content Standards

### Labels

**Be clear and concise**
```typescript
✅ "Description"
✅ "Comment"
✅ "Message"
❌ "Enter your description here"
❌ "Text area"
```

### Placeholders

**Provide examples**
```typescript
✅ "e.g. I'm a designer passionate about creating..."
✅ "Share your thoughts..."
✅ "Describe the issue you're experiencing"
❌ "Type here"
❌ "Description"
```

### Helper Text

**Be helpful**
```typescript
✅ "Markdown formatting supported"
✅ "Maximum 500 characters"
✅ "This will be visible to other users"
```

---

## Accessibility

### Keyboard Navigation
- **Tab**: Focus next field
- **Shift + Tab**: Focus previous field
- **Enter**: New line (does NOT submit form)
- **Escape**: Blur field (in some contexts)

### ARIA Attributes

**Required labels**
```typescript
<Label htmlFor="comment">Comment</Label>
<Textarea id="comment" />
```

**Required fields**
```typescript
<Label htmlFor="message">
  Message <span aria-label="required">*</span>
</Label>
<Textarea id="message" required aria-required="true" />
```

**Error states**
```typescript
<Textarea
  id="description"
  aria-invalid="true"
  aria-describedby="desc-error"
/>
<p id="desc-error" className="text-sm text-destructive">
  Description must be at least 10 characters
</p>
```

**Character limits**
```typescript
<Textarea
  id="bio"
  maxLength={160}
  aria-describedby="bio-limit"
/>
<p id="bio-limit" className="text-sm text-muted-foreground">
  Maximum 160 characters
</p>
```

### Screen Readers
- Multiline text field role announced
- Label text announced
- Placeholder announced as hint
- Character count announced if present
- Error messages announced with `role="alert"`

### Color Contrast
- Text: 7:1 contrast (AAA)
- Placeholder: 4.5:1 contrast (AA)
- Border: 3:1 minimum
- Focus ring: Clear and visible

### Touch Targets
- Minimum 44×44px touch area
- Full textarea is tappable
- Adequate padding for comfortable typing

---

## Implementation

### Basic Textarea
```typescript
import { Textarea } from '@/components/ui/textarea';

function BasicExample() {
  return <Textarea placeholder="Enter text..." />;
}
```

### With Label
```typescript
import { Label } from '@/components/ui/label';

<div className="space-y-2">
  <Label htmlFor="comment">Comment</Label>
  <Textarea id="comment" placeholder="Share your thoughts..." />
</div>
```

### Controlled Textarea
```typescript
function ControlledExample() {
  const [value, setValue] = useState("");
  
  return (
    <Textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Type here..."
    />
  );
}
```

### With Character Count
```typescript
function CharCountExample() {
  const [value, setValue] = useState("");
  const maxLength = 160;
  
  return (
    <div className="space-y-2">
      <Label htmlFor="bio">Bio</Label>
      <Textarea
        id="bio"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={maxLength}
        placeholder="Tell us about yourself"
      />
      <p className="text-sm text-muted-foreground text-right">
        {value.length}/{maxLength}
      </p>
    </div>
  );
}
```

### With Custom Height
```typescript
<Textarea className="min-h-32" placeholder="Larger textarea" />
```

### Disabled
```typescript
<Textarea disabled placeholder="Cannot edit" />
```

### Read-only
```typescript
<Textarea readOnly value="Read-only content" />
```

### With Resize
```typescript
<Textarea className="resize-y" placeholder="Resizable vertically" />
```

---

## Examples

### Comment Form
```typescript
<form className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="comment">Add a comment</Label>
    <Textarea
      id="comment"
      placeholder="Share your thoughts..."
      className="min-h-24"
    />
  </div>
  <div className="flex justify-end">
    <Button type="submit">Post Comment</Button>
  </div>
</form>
```

### Feedback Form
```typescript
<Card>
  <CardHeader>
    <CardTitle>Send Feedback</CardTitle>
    <CardDescription>
      Help us improve by sharing your thoughts
    </CardDescription>
  </CardHeader>
  <CardContent>
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="feedback">Your feedback</Label>
        <Textarea
          id="feedback"
          placeholder="What can we do better?"
          className="min-h-32"
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Submit Feedback
      </Button>
    </form>
  </CardContent>
</Card>
```

### Description Field
```typescript
<div className="space-y-2">
  <Label htmlFor="description">Project description</Label>
  <Textarea
    id="description"
    placeholder="Describe your project goals, timeline, and requirements..."
    className="min-h-40"
    aria-describedby="desc-help"
  />
  <p id="desc-help" className="text-sm text-muted-foreground">
    Provide as much detail as possible to help others understand your project
  </p>
</div>
```

### Message Composer
```typescript
function MessageComposer() {
  const [message, setMessage] = useState("");
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="min-h-24"
        />
      </div>
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {message.length} characters
        </p>
        <div className="flex gap-2">
          <Button variant="outline">Cancel</Button>
          <Button disabled={!message.trim()}>Send</Button>
        </div>
      </div>
    </div>
  );
}
```

### Notes Field
```typescript
<div className="space-y-2">
  <Label htmlFor="notes">Additional notes</Label>
  <Textarea
    id="notes"
    placeholder="Add any additional information..."
    className="min-h-20"
  />
  <p className="text-sm text-muted-foreground">
    Optional - This information is private and only visible to you
  </p>
</div>
```

---

## Design Tokens Reference

```typescript
// From tokens/colors.ts
input-background-color-default: var(--input-background)
input-border-color-default: var(--border)
input-border-color-focus: var(--ring)

// From tokens/spacing.ts
// Default padding
px-3: 0.75rem    // 12px horizontal
py-2: 0.5rem     // 8px vertical

// Minimum heights
min-h-16: 4rem   // 64px  - 4 lines
min-h-24: 6rem   // 96px  - 6 lines
min-h-32: 8rem   // 128px - 8 lines

// From tokens/effects.ts
radius-md: 0.5rem  // 8px - Border radius
```

---

## Related Components

- [Input](#) - Single-line text input
- [Form](#) - Form wrapper with validation
- [Label](#) - Input labels

---

## Changelog

### Version 1.0.0 (2025-12-30)
- Initial documentation following Spectrum 2 structure
- Auto-sizing with field-sizing-content
- Character count patterns
- Added 5 real-world examples

---

**Last Updated**: 2025-12-30  
**Component Location**: `src/components/ui/textarea.tsx`  
**Primitive Wrapper**: N/A (use base component directly)
