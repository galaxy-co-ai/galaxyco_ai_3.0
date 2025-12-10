import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        success: "bg-[var(--status-success)] text-white hover:bg-[var(--status-success)]/90",
        warning: "bg-[var(--status-warning)] text-white hover:bg-[var(--status-warning)]/90",
        error: "bg-[var(--status-error)] text-white hover:bg-[var(--status-error)]/90",
        info: "bg-[var(--status-info)] text-white hover:bg-[var(--status-info)]/90",
        outline: "border border-border bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        // Lead status variants
        hot: "bg-[var(--lead-hot)] text-white hover:bg-[var(--lead-hot)]/90",
        warm: "bg-[var(--lead-warm)] text-white hover:bg-[var(--lead-warm)]/90",
        cold: "bg-[var(--lead-cold)] text-white hover:bg-[var(--lead-cold)]/90",
        // Campaign status variants
        active: "bg-[var(--campaign-active)] text-white hover:bg-[var(--campaign-active)]/90",
        draft: "bg-[var(--campaign-draft)] text-white hover:bg-[var(--campaign-draft)]/90",
        paused: "bg-[var(--campaign-paused)] text-white hover:bg-[var(--campaign-paused)]/90",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  dotColor?: string;
}

function Badge({ className, variant, size, dot, dotColor, children, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      role="status"
      aria-label={typeof children === "string" ? children : undefined}
      {...props}
    >
      {dot && (
        <span
          className="size-1.5 rounded-full"
          style={{ backgroundColor: dotColor || "currentColor" }}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

export { Badge, badgeVariants };

