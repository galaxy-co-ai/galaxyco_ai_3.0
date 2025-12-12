import * as React from "react";

import { Button, buttonVariants, type ButtonProps } from "@/components/ui/button";

/**
 * NeptuneButton
 *
 * Compatibility wrapper: historically the app used a separate NeptuneButton.
 * We now route everything through the canonical `Button` so there is a single
 * source of truth for button styling.
 */

type NeptuneVariant = "default" | "primary" | "success" | "warning" | "danger" | "ghost";

const neptuneToButtonVariant: Record<NeptuneVariant, NonNullable<ButtonProps["variant"]>> = {
  default: "surface",
  primary: "default",
  success: "success",
  warning: "warning",
  danger: "destructive",
  ghost: "ghost",
};

export interface NeptuneButtonProps extends Omit<ButtonProps, "variant"> {
  variant?: NeptuneVariant;
}

const NeptuneButton = React.forwardRef<HTMLButtonElement, NeptuneButtonProps>(
  ({ variant = "default", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        data-slot="neptune-button"
        variant={neptuneToButtonVariant[variant]}
        {...props}
      />
    );
  }
);

NeptuneButton.displayName = "NeptuneButton";

// Note: kept export name for existing imports; variants now come from `Button`.
const neptuneButtonVariants = buttonVariants;

export { NeptuneButton, neptuneButtonVariants };
