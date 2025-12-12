"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const chipVariants = cva(
  // Built on Button, but chips should not "lift" like primary actions.
  "h-8 px-3 rounded-full font-normal shadow-none hover:translate-y-0 active:scale-100",
  {
    variants: {
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
      selected: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      // Default (not selected)
      {
        selected: false,
        className:
          "bg-background text-foreground/80 hover:text-foreground hover:bg-accent/40",
      },

      // Selected tones
      {
        selected: true,
        tone: "success",
        className:
          "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-emerald-900/55",
      },
      {
        selected: true,
        tone: "info",
        className:
          "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/55",
      },
      {
        selected: true,
        tone: "warning",
        className:
          "bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700 dark:hover:bg-amber-900/55",
      },
      {
        selected: true,
        tone: "danger",
        className:
          "bg-red-100 text-red-900 border-red-300 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700 dark:hover:bg-red-900/55",
      },
      {
        selected: true,
        tone: "violet",
        className:
          "bg-violet-100 text-violet-900 border-violet-300 hover:bg-violet-200 dark:bg-violet-900/40 dark:text-violet-200 dark:border-violet-700 dark:hover:bg-violet-900/55",
      },
      {
        selected: true,
        tone: "indigo",
        className:
          "bg-indigo-100 text-indigo-900 border-indigo-300 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700 dark:hover:bg-indigo-900/55",
      },
      {
        selected: true,
        tone: "pink",
        className:
          "bg-pink-100 text-pink-900 border-pink-300 hover:bg-pink-200 dark:bg-pink-900/40 dark:text-pink-200 dark:border-pink-700 dark:hover:bg-pink-900/55",
      },
      {
        selected: true,
        tone: "orange",
        className:
          "bg-orange-100 text-orange-900 border-orange-300 hover:bg-orange-200 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700 dark:hover:bg-orange-900/55",
      },
      {
        selected: true,
        tone: "teal",
        className:
          "bg-teal-100 text-teal-900 border-teal-300 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-200 dark:border-teal-700 dark:hover:bg-teal-900/55",
      },
      {
        selected: true,
        tone: "lime",
        className:
          "bg-lime-100 text-lime-900 border-lime-300 hover:bg-lime-200 dark:bg-lime-900/40 dark:text-lime-200 dark:border-lime-700 dark:hover:bg-lime-900/55",
      },
    ],
    defaultVariants: {
      tone: "neutral",
      selected: false,
    },
  }
);

export type ChipProps = Omit<ButtonProps, "variant" | "size"> &
  VariantProps<typeof chipVariants> & {
    selected?: boolean;
  };

/**
 * Chip
 *
 * A small, rounded filter pill.
 */
export function Chip({
  className,
  tone,
  selected = false,
  ...props
}: ChipProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(chipVariants({ tone, selected }), className)}
      aria-pressed={selected}
      {...props}
    />
  );
}
