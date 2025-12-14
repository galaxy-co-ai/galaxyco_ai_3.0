import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Galaxy button family
 *
 * Design goal: a single “family” of buttons (shape + motion + elevation)
 * with variants for intent (primary/surface/destructive/etc.).
 */
const buttonVariants = cva(
  // Base styles shared by all variants
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] hover:-translate-y-px",
  {
    variants: {
      variant: {
        /**
         * Primary action (brand)
         *
         * Decision: Deep Space filled with restrained Electric Cyan accents (Apple-like).
         */
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft hover:shadow-soft-hover border border-accent-cyan/20 hover:border-accent-cyan/30",
        /**
         * Marketing CTA (extra emphasis)
         */
        cta:
          "bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft hover:shadow-soft-hover border border-accent-cyan/35 hover:border-accent-cyan/45",
        /**
         * Surface button (Neptune-style): subtle border + soft elevation
         */
        surface:
          "bg-background hover:bg-background text-foreground/80 hover:text-foreground shadow-soft hover:shadow-soft-hover border border-border",
        /**
         * Destructive action
         */
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft hover:shadow-soft-hover border border-destructive/80",
        /**
         * Outline action (low emphasis)
         */
        outline:
          "border border-border bg-background text-foreground hover:bg-accent/50 hover:border-border/60",
        /**
         * Secondary action
         */
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        /**
         * Ghost action (icon buttons, menus)
         */
        ghost:
          "bg-transparent hover:bg-accent/60 hover:text-accent-foreground border border-transparent shadow-none",
        /**
         * Link action
         */
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        /**
         * Semantic variants (kept for backwards compatibility with NeptuneButton)
         */
        success:
          "bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft hover:shadow-soft-hover border border-emerald-600",
        warning:
          "bg-amber-500 hover:bg-amber-600 text-white shadow-soft hover:shadow-soft-hover border border-amber-500",
      },
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

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
