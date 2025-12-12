import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center whitespace-nowrap border font-medium overflow-hidden [&>svg]:pointer-events-none [&>svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-colors",
  {
    variants: {
      /**
       * Visual style
       */
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        /**
         * Soft status chips (used for header stats + pills)
         */
        soft: "",
      },
      /**
       * Color tone (used with `variant="soft"`)
       */
      tone: {
        neutral: "",
        success: "",
        info: "",
        warning: "",
        danger: "",
        violet: "",
        indigo: "",
        pink: "",
        orange: "",
        teal: "",
        lime: "",
      },
      /**
       * Size / shape
       */
      size: {
        sm: "rounded-md px-2 py-0.5 text-xs gap-1 [&>svg]:size-3",
        md: "rounded-md px-2.5 py-1 text-sm gap-1.5 [&>svg]:size-3.5",
        pill: "rounded-full px-3 py-1.5 text-sm gap-1.5 [&>svg]:size-3.5",
      },
    },
    compoundVariants: [
      // Neutral
      {
        variant: "soft",
        tone: "neutral",
        className:
          "bg-muted/70 text-foreground/70 border-border/60 hover:bg-muted",
      },
      // Success (emerald)
      {
        variant: "soft",
        tone: "success",
        className:
          "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800 dark:hover:bg-emerald-900/30",
      },
      // Info (blue)
      {
        variant: "soft",
        tone: "info",
        className:
          "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/30",
      },
      // Warning (amber)
      {
        variant: "soft",
        tone: "warning",
        className:
          "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-900/30",
      },
      // Danger (red)
      {
        variant: "soft",
        tone: "danger",
        className:
          "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900/30",
      },
      // Violet (brand accent)
      {
        variant: "soft",
        tone: "violet",
        className:
          "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800 dark:hover:bg-violet-900/30",
      },
      // Indigo
      {
        variant: "soft",
        tone: "indigo",
        className:
          "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800 dark:hover:bg-indigo-900/30",
      },
      // Pink
      {
        variant: "soft",
        tone: "pink",
        className:
          "bg-pink-50 text-pink-700 border-pink-200 hover:bg-pink-100 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800 dark:hover:bg-pink-900/30",
      },
      // Orange
      {
        variant: "soft",
        tone: "orange",
        className:
          "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800 dark:hover:bg-orange-900/30",
      },
      // Teal
      {
        variant: "soft",
        tone: "teal",
        className:
          "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800 dark:hover:bg-teal-900/30",
      },
      // Lime
      {
        variant: "soft",
        tone: "lime",
        className:
          "bg-lime-50 text-lime-800 border-lime-200 hover:bg-lime-100 dark:bg-lime-900/20 dark:text-lime-300 dark:border-lime-800 dark:hover:bg-lime-900/30",
      },
    ],
    defaultVariants: {
      variant: "default",
      tone: "neutral",
      size: "sm",
    },
  }
);

export type BadgeProps = React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean };

function Badge({
  className,
  variant,
  tone,
  size,
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, tone, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
