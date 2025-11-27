"use client";

import * as React from "react";
import { cn } from "../../lib/utils";

interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  className,
  "aria-label": ariaLabel,
}: SwitchProps) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;

  const handleToggle = () => {
    if (disabled) return;
    
    if (!isControlled) {
      setInternalChecked(!internalChecked);
    }
    onCheckedChange?.(!isChecked);
  };

  // Using a div with role="switch" to avoid global button styles
  // that enforce min-height: 44px and min-width: 44px
  return (
    <div
      role="switch"
      aria-checked={isChecked}
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : 0}
      onClick={handleToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleToggle();
        }
      }}
      className={cn(
        "relative inline-flex cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
        isChecked ? "bg-indigo-600" : "bg-gray-300",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
      style={{
        height: '18px',
        width: '44px',
        flexShrink: 0,
      }}
    >
      <span
        className="pointer-events-none inline-block rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out absolute top-1/2"
        style={{
          height: '14px',
          width: '14px',
          transform: `translateY(-50%) translateX(${isChecked ? '28px' : '2px'})`,
        }}
      />
    </div>
  );
}

export { Switch };
