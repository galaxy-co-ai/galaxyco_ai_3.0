import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 hover:-translate-y-px active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-white text-gray-700 border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:bg-white hover:shadow-lg active:shadow-sm",
        primary:
          "bg-primary text-primary-foreground border border-primary/20 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:bg-primary/90 hover:shadow-lg active:shadow-sm",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive/20 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:bg-destructive/90 hover:shadow-lg active:shadow-sm",
        outline:
          "border border-gray-200 bg-background text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:bg-accent/50 hover:border-gray-300 hover:shadow-lg active:shadow-sm",
        secondary:
          "bg-secondary text-secondary-foreground border border-secondary/20 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:bg-secondary/80 hover:shadow-lg active:shadow-sm",
        ghost: "hover:bg-accent/60 hover:text-accent-foreground hover:shadow-sm",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80 hover:translate-y-0 active:scale-100",
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

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        aria-label={props["aria-label"] || (typeof props.children === "string" ? props.children : undefined)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

