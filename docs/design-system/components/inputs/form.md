# Form

**Version 1.0.0**

Forms collect user input through a structured set of fields. Our form components integrate with React Hook Form and Zod for type-safe validation and state management.

---

## Table of Contents

- [Overview](#overview)
- [Anatomy](#anatomy)
- [Components](#components)
- [Integration](#integration)
- [Validation](#validation)
- [Usage Guidelines](#usage-guidelines)
- [Content Standards](#content-standards)
- [Accessibility](#accessibility)
- [Implementation](#implementation)
- [Examples](#examples)

---

## Overview

### When to Use
- **Data collection**: Gather user information systematically
- **User input**: Any scenario requiring structured input
- **Settings**: Configuration and preference panels
- **Multi-step processes**: Wizards and onboarding flows
- **Search and filters**: Advanced filtering interfaces

### When Not to Use
- **Single input**: Use standalone input components
- **Immediate actions**: Use buttons for direct actions
- **Display only**: Forms require user input
- **Navigation**: Use navigation components instead

---

## Anatomy

```
┌────────────────────────────────────────────┐
│  Form Title                                │
│  Optional description of form purpose      │
│                                            │
│  Field Label *                             │ ← FormLabel
│  ┌──────────────────────────────────────┐ │
│  │ Input field                          │ │ ← FormControl
│  └──────────────────────────────────────┘ │
│  Helper text for this field              │ ← FormDescription
│  ⚠ Error message                         │ ← FormMessage
│                                            │
│  Another Field Label                       │
│  ┌──────────────────────────────────────┐ │
│  │ Input field                          │ │
│  └──────────────────────────────────────┘ │
│                                            │
│  [ Cancel ]  [ Submit ]                    │
└────────────────────────────────────────────┘
```

**Component Parts:**
1. **Form** - Root container (FormProvider wrapper)
2. **FormField** - Controller wrapper for each field
3. **FormItem** - Container for label, control, and messages
4. **FormLabel** - Accessible label
5. **FormControl** - Wraps the input component
6. **FormDescription** - Helper text
7. **FormMessage** - Error/validation message

---

## Components

### Form (Root)

React Hook Form's FormProvider wrapper.

```typescript
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    {/* Form fields */}
  </form>
</Form>
```

**Props:**
- All React Hook Form's `useForm` return values
- Provides context to all child components

### FormField

Controller wrapper that connects input to React Hook Form.

```typescript
<FormField
  control={form.control}
  name="username"
  render={({ field }) => (
    <FormItem>
      {/* Form components */}
    </FormItem>
  )}
/>
```

**Props:**
- `control`: Form control object
- `name`: Field name (typed)
- `render`: Render function with field props

### FormItem

Container for label, control, description, and message.

```typescript
<FormItem>
  <FormLabel>Username</FormLabel>
  <FormControl>
    <Input {...field} />
  </FormControl>
  <FormDescription>Your public display name.</FormDescription>
  <FormMessage />
</FormItem>
```

**Design tokens:**
- Layout: `grid`
- Gap: `gap-2` (0.5rem)

### FormLabel

Accessible label with error state styling.

```typescript
<FormLabel>Email address</FormLabel>
```

**Design tokens:**
- Error color: `data-[error=true]:text-destructive`
- Automatically linked to input via `htmlFor`

### FormControl

Slot wrapper for input components.

```typescript
<FormControl>
  <Input {...field} />
</FormControl>
```

**Features:**
- Passes ARIA attributes
- Sets `aria-invalid` on error
- Links to description and error messages

### FormDescription

Helper text for additional context.

```typescript
<FormDescription>
  We'll never share your email with anyone else.
</FormDescription>
```

**Design tokens:**
- Color: `text-muted-foreground`
- Size: `text-sm`

### FormMessage

Error message display.

```typescript
<FormMessage />
```

**Features:**
- Automatically shows field error
- Can show custom messages
- Hides when no error

**Design tokens:**
- Color: `text-destructive`
- Size: `text-sm`

---

## Integration

### React Hook Form Setup

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

function MyForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
    },
  });

  function onSubmit(values: FormValues) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Fields */}
      </form>
    </Form>
  );
}
```

### Field Connection Pattern

```typescript
<FormField
  control={form.control}
  name="username"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Username</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormDescription>Your public display name.</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Validation

### Zod Schema Examples

**Basic fields:**
```typescript
const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  age: z.number().min(18, "Must be 18 or older"),
});
```

**Optional fields:**
```typescript
const schema = z.object({
  bio: z.string().optional(),
  website: z.string().url().optional(),
});
```

**Complex validations:**
```typescript
const schema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

**Custom validators:**
```typescript
const schema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .refine(
      async (val) => {
        const available = await checkUsernameAvailability(val);
        return available;
      },
      { message: "Username is already taken" }
    ),
});
```

---

## Usage Guidelines

### ✅ Do's

**Always provide labels**
```typescript
✅
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input type="email" {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Use helper text for clarity**
```typescript
✅
<FormItem>
  <FormLabel>Password</FormLabel>
  <FormControl>
    <Input type="password" {...field} />
  </FormControl>
  <FormDescription>
    Must be at least 8 characters with uppercase, lowercase, and numbers.
  </FormDescription>
  <FormMessage />
</FormItem>
```

**Group related fields**
```typescript
✅
<div className="space-y-4">
  <div className="space-y-2">
    <h3 className="text-lg font-medium">Personal Information</h3>
    <FormField name="firstName" />
    <FormField name="lastName" />
  </div>
  <div className="space-y-2">
    <h3 className="text-lg font-medium">Contact Details</h3>
    <FormField name="email" />
    <FormField name="phone" />
  </div>
</div>
```

**Show field requirements clearly**
```typescript
✅
<FormLabel>
  Email <span className="text-destructive">*</span>
</FormLabel>
<FormDescription>
  Required. We'll send confirmation to this address.
</FormDescription>
```

**Provide immediate feedback**
```typescript
✅
// Validation runs on blur and submit
const form = useForm({
  mode: "onBlur",
  resolver: zodResolver(schema),
});
```

### ❌ Don'ts

**Don't omit labels**
```typescript
❌
<FormControl>
  <Input placeholder="Enter email" {...field} />
</FormControl>

✅
<FormLabel>Email</FormLabel>
<FormControl>
  <Input placeholder="you@example.com" {...field} />
</FormControl>
```

**Don't use vague error messages**
```typescript
❌
z.string().min(2, "Invalid input")

✅
z.string().min(2, "Username must be at least 2 characters")
```

**Don't validate on every keystroke**
```typescript
❌
const form = useForm({
  mode: "onChange", // Too aggressive
});

✅
const form = useForm({
  mode: "onBlur", // Better UX
});
```

**Don't hide required field indicators**
```typescript
❌
<FormLabel>Email</FormLabel>
{/* No indication it's required */}

✅
<FormLabel>Email *</FormLabel>
<FormDescription>Required field</FormDescription>
```

**Don't nest forms**
```typescript
❌
<form>
  <FormField name="outer" />
  <form>
    <FormField name="inner" />
  </form>
</form>

✅
<form>
  <FormField name="outer" />
  <FormField name="inner" />
</form>
```

---

## Content Standards

### Labels

**Structure:**
- Start with capital letter
- Use sentence case
- Be specific and clear
- Keep concise (2-5 words)

**Examples:**
```typescript
✅ Good:
- "Email address"
- "Password"
- "Date of birth"
- "Subscribe to newsletter"

❌ Avoid:
- "email" (not capitalized)
- "The Email Address Field" (too verbose)
- "Input" (not descriptive)
```

### Helper Text

**Structure:**
- Use sentence case
- End with period
- Explain format or requirements
- Keep under 15 words

**Examples:**
```typescript
✅ Good:
"We'll send a verification link to this address."
"Must include uppercase, lowercase, and numbers."
"Your timezone affects notification delivery."

❌ Avoid:
"Email" (duplicates label)
"This is where you enter your email address..." (too long)
```

### Error Messages

**Structure:**
- Be specific about the problem
- Explain how to fix it
- Use sentence case
- Avoid technical jargon

**Examples:**
```typescript
✅ Good:
"Username must be at least 3 characters"
"Please enter a valid email address"
"Password must contain at least one number"

❌ Avoid:
"Invalid input" (too vague)
"Error: regex validation failed" (too technical)
"WRONG!" (not helpful)
```

### Button Labels

**Structure:**
- Use action verbs
- Be specific about outcome
- Keep short (1-3 words)

**Examples:**
```typescript
✅ Good:
- "Save changes"
- "Create account"
- "Continue"
- "Cancel"

❌ Avoid:
- "Submit" (vague)
- "OK" (unclear)
- "Click here to save your changes" (too long)
```

---

## Accessibility

### ARIA Attributes

Form components automatically provide:
- `aria-describedby`: Links to description and error
- `aria-invalid`: Set when field has error
- `aria-labelledby`: Links label to input
- `id` attributes: Unique IDs for associations

**Automatically handled:**
```typescript
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormDescription>Your email address.</FormDescription>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Results in:**
```html
<label for="email-form-item">Email</label>
<input
  id="email-form-item"
  aria-describedby="email-form-item-description email-form-item-message"
  aria-invalid="false"
/>
<p id="email-form-item-description">Your email address.</p>
<p id="email-form-item-message"></p>
```

### Keyboard Support

- **Tab**: Move between fields
- **Shift + Tab**: Move backwards
- **Enter**: Submit form (when focused on input)
- **Space**: Toggle checkboxes/switches
- Component-specific keys work as expected

### Screen Reader Support

- Label associations announced
- Required fields announced
- Error messages announced
- Helper text read with field
- Field type announced

### Focus Management

```typescript
// Set focus on first error
const onSubmit = async (data: FormValues) => {
  try {
    await submitForm(data);
  } catch (error) {
    // Focus first field with error
    const firstError = Object.keys(form.formState.errors)[0];
    form.setFocus(firstError as any);
  }
};
```

---

## Implementation

### Component Structure

**File:** `src/components/ui/form.tsx`

```typescript
"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";

import { cn } from "../../lib/utils";
import { Label } from "./label";

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </FormItemContext.Provider>
  );
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useFormField();

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      {body}
    </p>
  );
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
```

### Dependencies

```json
{
  "react-hook-form": "^7.48.2",
  "@hookform/resolvers": "^3.3.2",
  "zod": "^3.22.4",
  "@radix-ui/react-label": "^2.0.2",
  "@radix-ui/react-slot": "^1.0.2"
}
```

### Design Tokens Used

**Colors:**
- Label error: `text-destructive`
- Description: `text-muted-foreground`
- Message: `text-destructive`

**Spacing:**
- Item gap: `gap-2` (0.5rem)

**Typography:**
- Description size: `text-sm`
- Message size: `text-sm`

---

## Examples

### Basic Form

```typescript
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
});

export function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### Multi-Field Form

```typescript
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  username: z.string().min(2).max(50),
  email: z.string().email(),
  bio: z.string().max(160).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AccountForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      bio: "",
    },
  });

  function onSubmit(values: FormValues) {
    console.log(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormDescription>
                We'll never share your email.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Input placeholder="Tell us about yourself" {...field} />
              </FormControl>
              <FormDescription>
                Optional. Max 160 characters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Update account</Button>
      </form>
    </Form>
  );
}
```

### With Select

```typescript
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  role: z.string({
    required_error: "Please select a role.",
  }),
});

export function SelectForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    console.log(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="guest">Guest</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose your account role.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### With Checkbox

```typescript
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  marketing: z.boolean().default(false),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions.",
  }),
});

export function CheckboxForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      marketing: false,
      terms: false,
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    console.log(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="marketing"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Marketing emails</FormLabel>
                <FormDescription>
                  Receive emails about new products and features.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Accept terms and conditions <span className="text-destructive">*</span>
                </FormLabel>
                <FormDescription>
                  You agree to our Terms of Service and Privacy Policy.
                </FormDescription>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### With Radio Group

```typescript
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  type: z.enum(["all", "mentions", "none"], {
    required_error: "You need to select a notification type.",
  }),
});

export function RadioGroupForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    console.log(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Notify me about...</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="all" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      All new messages
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="mentions" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Direct messages and mentions
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="none" />
                    </FormControl>
                    <FormLabel className="font-normal">Nothing</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### With Textarea

```typescript
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  bio: z
    .string()
    .min(10, {
      message: "Bio must be at least 10 characters.",
    })
    .max(160, {
      message: "Bio must not be longer than 160 characters.",
    }),
});

export function TextareaForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    console.log(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell us a little bit about yourself"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                You can write up to 160 characters.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### Complete Settings Form

```typescript
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const settingsSchema = z.object({
  displayName: z.string().min(2).max(50),
  email: z.string().email(),
  bio: z.string().max(160).optional(),
  language: z.string(),
  theme: z.enum(["light", "dark", "system"]),
  emailNotifications: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function SettingsForm() {
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      displayName: "",
      email: "",
      bio: "",
      language: "en",
      theme: "system",
      emailNotifications: true,
      marketingEmails: false,
    },
  });

  function onSubmit(data: SettingsFormValues) {
    console.log(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              This is how others will see you on the site.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is your public display name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Your email address for account notifications.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Brief description for your profile. Max 160 characters.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Customize your experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a language" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Your preferred language for the interface.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="theme"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Theme</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a theme" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose your preferred color theme.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Manage how you receive notifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="emailNotifications"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Email notifications
                    </FormLabel>
                    <FormDescription>
                      Receive emails about your account activity.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="marketingEmails"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Marketing emails
                    </FormLabel>
                    <FormDescription>
                      Receive emails about new products and features.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </Form>
  );
}
```

---

**Last Updated:** 2024-12-30
