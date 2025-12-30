# Progress

**Version 1.0.0**

A visual indicator showing the completion status of a task or process. Progress bars provide users with feedback about ongoing operations.

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
- **File uploads/downloads**: Show transfer progress
- **Multi-step processes**: Indicate completion percentage
- **Loading states**: Determinate loading (known duration)
- **Form completion**: Show how much is left to fill
- **Installation progress**: Software/updates installing

### When Not to Use
- **Unknown duration**: Use Skeleton or indeterminate spinner
- **Instant operations**: No progress needed for < 2 seconds
- **Binary states**: Use Switch or Checkbox instead
- **Multiple simultaneous tasks**: Consider individual indicators

---

## Anatomy

```
┌────────────────────────────────────────┐
│ ██████████░░░░░░░░░░░░░░░░░░░░  45%   │
│ └──────────┘                           │
│   Indicator                            │
│                                        │
│ ──────────────────────────────────────  │
│              Track (Root)              │
└────────────────────────────────────────┘
```

**Component Parts:**
1. **Progress (Root)** - Track container (`ProgressPrimitive.Root`)
2. **Progress Indicator** - Filled portion showing completion

---

## Components

### Progress

The complete progress bar with track and indicator.

```typescript
<Progress value={45} />
```

**Props:**
- `value?: number` - Completion percentage (0-100)
- `max?: number` - Maximum value (default: 100)
- `className?: string` - Custom track styles
- `indicatorClassName?: string` - Custom indicator styles

**Design tokens:**
- Track background: `bg-primary/20`
- Track height: `h-2` (8px)
- Track border radius: `rounded-full`
- Indicator background: `bg-primary`
- Indicator transition: `transition-all`

**ARIA (automatic):**
- `role="progressbar"`
- `aria-valuemin="0"`
- `aria-valuemax="100"`
- `aria-valuenow={value}`

---

## Variants

### Default Progress
```typescript
<Progress value={60} />
```

### Custom Height
```typescript
<Progress value={60} className="h-4" />
```

### Custom Colors
```typescript
<Progress 
  value={60} 
  className="bg-secondary/20"
  indicatorClassName="bg-secondary"
/>
```

### Indeterminate (Unknown Progress)
```typescript
<Progress value={null} className="animate-pulse" />
```

---

## States

### Default
- 0-100% completion shown visually

### Empty (0%)
- Indicator invisible
- Track visible

### Full (100%)
- Indicator fills entire track

### Indeterminate
- No value prop (or null)
- Can add pulse animation

---

## Usage Guidelines

### ✅ Do's

- **Show percentage label**: Help users understand progress
  ```typescript
  ✅ <div>
        <div className="flex justify-between mb-2">
          <span>Uploading</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} />
      </div>
  ```

- **Use for known duration**: When you can calculate percentage
  ```typescript
  ✅ File upload: 450 MB / 1 GB = 45%
  ```

- **Keep smooth**: Update in reasonable increments
  ```typescript
  ✅ Update every 100-500ms
  ❌ Update every 10ms (too jumpy)
  ```

- **Show completion state**: Indicate when done
  ```typescript
  ✅ progress === 100 && <CheckCircle className="text-green-500" />
  ```

### ❌ Don'ts

- **Don't use for unknown duration**: Use Skeleton instead
  ```typescript
  ❌ <Progress value={50} /> // but you don't know actual progress
  ✅ <Skeleton className="h-2 w-full" />
  ```

- **Don't fake progress**: Never lie about actual progress
  ```typescript
  ❌ Incrementing fake progress bar when nothing is happening
  ```

- **Don't use for instant operations**: < 2 seconds don't need progress
  ```typescript
  ❌ Progress bar for 500ms operation
  ```

- **Don't omit labels**: Users need context
  ```typescript
  ❌ <Progress value={45} /> (what's loading?)
  ✅ <span>Processing images (45%)</span>
       <Progress value={45} />
  ```

---

## Content Standards

### Labels
- **Descriptive**: "Uploading file" not "Loading"
- **With percentage**: Show numeric progress when possible
- **Status updates**: "Processing step 3 of 5"

### Accessibility Labels
- Use `aria-label` when no visible label
- Update `aria-valuenow` with current value
- Include `aria-valuetext` for context: "45% complete"

---

## Accessibility

### Screen Reader Support

**ARIA attributes (automatic):**
- `role="progressbar"` on root
- `aria-valuemin="0"`
- `aria-valuemax="100"`
- `aria-valuenow={value}`

**Additional attributes (manual):**
```typescript
<Progress 
  value={45} 
  aria-label="File upload progress"
  aria-valuetext="45% complete"
/>
```

### Best Practices

1. **Visible label**: Always provide context
2. **Live updates**: Screen readers announce progress changes
3. **Completion notification**: Alert when done
4. **Color contrast**: Indicator meets 3:1 contrast ratio

---

## Implementation

### Installation

```bash
npm install @radix-ui/react-progress
```

### Basic Implementation

```typescript
import { Progress } from "@/components/ui/progress";

export function BasicProgress() {
  return <Progress value={60} />;
}
```

---

## Examples

### Example 1: Simple Progress with Label

```typescript
import { Progress } from "@/components/ui/progress";

export function LabeledProgress() {
  const progress = 65;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Uploading file...</span>
        <span className="text-muted-foreground">{progress}%</span>
      </div>
      <Progress value={progress} />
    </div>
  );
}
```

### Example 2: File Upload Progress

```typescript
"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Upload } from "lucide-react";

export function FileUploadProgress() {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const handleUpload = () => {
    setUploading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setUploading(false), 1000);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleUpload}
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        <Upload className="size-4" />
        Upload File
      </button>

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>document.pdf</span>
            <span className="text-muted-foreground">
              {progress === 100 ? (
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="size-4" />
                  Complete
                </span>
              ) : (
                `${progress}%`
              )}
            </span>
          </div>
          <Progress value={progress} />
        </div>
      )}
    </div>
  );
}
```

### Example 3: Multi-Step Form Progress

```typescript
import { Progress } from "@/components/ui/progress";

export function FormProgress({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Step {currentStep} of {totalSteps}</span>
        <span className="text-muted-foreground">{Math.round(progress)}%</span>
      </div>
      <Progress value={progress} />
      <p className="text-xs text-muted-foreground">
        {currentStep === totalSteps ? "Review and submit" : "Complete all steps to continue"}
      </p>
    </div>
  );
}
```

### Example 4: Download Progress with Size

```typescript
"use client";

import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Download } from "lucide-react";

export function DownloadProgress() {
  const [progress, setProgress] = useState(0);
  const totalSize = 125; // MB
  const downloaded = (progress / 100) * totalSize;

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 5));
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Download className="size-4 text-muted-foreground" />
        <span className="text-sm">software-installer.dmg</span>
      </div>
      <Progress value={progress} />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{downloaded.toFixed(1)} MB / {totalSize} MB</span>
        <span>{progress}%</span>
      </div>
    </div>
  );
}
```

### Example 5: Circular Progress (Custom)

```typescript
import { Progress } from "@/components/ui/progress";

export function CircularProgress({ value }: { value: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="size-24 -rotate-90">
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-primary/20"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-300"
        />
      </svg>
      <span className="absolute text-lg font-semibold">{value}%</span>
    </div>
  );
}
```

### Example 6: Progress with Status Colors

```typescript
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function ColoredProgress({ value }: { value: number }) {
  const getColor = (value: number) => {
    if (value < 33) return "bg-red-500";
    if (value < 66) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getLabel = (value: number) => {
    if (value < 33) return "Low";
    if (value < 66) return "Medium";
    return "High";
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Completion</span>
        <span className={cn(
          "font-medium",
          value < 33 && "text-red-600",
          value >= 33 && value < 66 && "text-yellow-600",
          value >= 66 && "text-green-600"
        )}>
          {getLabel(value)} ({value}%)
        </span>
      </div>
      <Progress 
        value={value}
        indicatorClassName={getColor(value)}
      />
    </div>
  );
}
```

### Example 7: Indeterminate Progress

```typescript
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

export function IndeterminateProgress() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="size-4 animate-spin" />
        <span>Processing...</span>
      </div>
      <div className="h-2 w-full bg-primary/20 rounded-full overflow-hidden">
        <div className="h-full w-1/3 bg-primary animate-pulse" />
      </div>
      <p className="text-xs text-muted-foreground">
        This may take a few moments
      </p>
    </div>
  );
}
```

### Example 8: Multiple Progress Bars

```typescript
import { Progress } from "@/components/ui/progress";

const tasks = [
  { name: "Downloading files", progress: 100 },
  { name: "Installing dependencies", progress: 75 },
  { name: "Configuring settings", progress: 30 },
  { name: "Running tests", progress: 0 },
];

export function MultipleProgress() {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Installation Progress</h3>
      {tasks.map((task, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className={task.progress === 100 ? "text-muted-foreground" : ""}>
              {task.name}
            </span>
            <span className="text-muted-foreground">
              {task.progress === 100 ? "✓" : `${task.progress}%`}
            </span>
          </div>
          <Progress value={task.progress} />
        </div>
      ))}
    </div>
  );
}
```

---

**Related Components:**
- [Skeleton](./skeleton.md) - Loading placeholders for unknown duration
- [Toast](./toast.md) - Completion notifications
- [Spinner](./spinner.md) - Indeterminate loading indicator

**Design Tokens:**
- [Colors](../../tokens/colors.md)
- [Spacing](../../tokens/spacing.md)
- [Animation](../../tokens/effects.md)
