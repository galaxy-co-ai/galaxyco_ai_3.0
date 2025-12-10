"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Neptune Button Variants
 * 
 * Standardized button component following the Neptune design pattern
 * from ConversationsDashboard.tsx
 * 
 * Base style: White background with subtle shadow, lift on hover, press effect
 * 
 * @see src/components/conversations/ConversationsDashboard.tsx line ~199
 */
const neptuneButtonVariants = cva(
  // Base styles shared by all variants
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 active:scale-[0.98] hover:-translate-y-px",
  {
    variants: {
      /**
       * Visual variants:
       * - default: White background with gray text (Neptune standard)
       * - primary: Indigo for primary actions
       * - success: Emerald for positive actions
       * - warning: Amber for cautionary actions
       * - danger: Red for destructive actions
       * - ghost: Transparent with hover background
       */
      variant: {
        default:
          "bg-white hover:bg-white text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-lg active:shadow-sm border border-gray-200",
        primary:
          "bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-lg active:shadow-sm border border-indigo-600",
        success:
          "bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-lg active:shadow-sm border border-emerald-600",
        warning:
          "bg-amber-500 hover:bg-amber-600 text-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-lg active:shadow-sm border border-amber-500",
        danger:
          "bg-red-600 hover:bg-red-700 text-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-lg active:shadow-sm border border-red-600",
        ghost:
          "bg-transparent hover:bg-gray-100 text-gray-700 hover:shadow-sm active:shadow-none border border-transparent",
      },
      /**
       * Size variants matching the standard button component
       */
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-lg px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface NeptuneButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof neptuneButtonVariants> {
  /**
   * If true, the button will render as a Slot (for composition with links, etc.)
   */
  asChild?: boolean;
}

/**
 * Neptune Button Component
 * 
 * A standardized button following the Neptune design system.
 * Features: white background, subtle shadow, lift on hover, press scale effect.
 * 
 * @example
 * ```tsx
 * // Default Neptune style
 * <NeptuneButton>
 *   <Sparkles className="h-4 w-4" />
 *   Ask Neptune
 * </NeptuneButton>
 * 
 * // Primary action
 * <NeptuneButton variant="primary">
 *   Save Changes
 * </NeptuneButton>
 * 
 * // As a link
 * <NeptuneButton asChild>
 *   <Link href="/dashboard">Go to Dashboard</Link>
 * </NeptuneButton>
 * ```
 */
const NeptuneButton = React.forwardRef<HTMLButtonElement, NeptuneButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        data-slot="neptune-button"
        className={cn(neptuneButtonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

NeptuneButton.displayName = "NeptuneButton";

export { NeptuneButton, neptuneButtonVariants };

