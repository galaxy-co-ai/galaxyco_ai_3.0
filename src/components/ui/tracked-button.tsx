"use client";

import * as React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { trackClick } from "@/lib/analytics";

interface TrackedButtonProps extends ButtonProps {
  /** Unique identifier for analytics tracking */
  trackId: string;
  /** Optional metadata to include with the click event */
  trackMetadata?: Record<string, unknown>;
  /** Children to render inside the button */
  children: React.ReactNode;
}

/**
 * Button component with automatic click tracking
 * 
 * @example
 * ```tsx
 * <TrackedButton 
 *   trackId="cta_create_contact" 
 *   trackMetadata={{ section: 'crm' }}
 *   onClick={handleCreate}
 * >
 *   Create Contact
 * </TrackedButton>
 * ```
 */
export const TrackedButton = React.forwardRef<HTMLButtonElement, TrackedButtonProps>(
  ({ trackId, trackMetadata, onClick, children, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      trackClick(trackId, trackMetadata);
      onClick?.(e);
    };

    return (
      <Button ref={ref} onClick={handleClick} {...props}>
        {children}
      </Button>
    );
  }
);

TrackedButton.displayName = "TrackedButton";

