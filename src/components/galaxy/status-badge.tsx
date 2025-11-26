import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef } from "react";
type BadgeProps = ComponentPropsWithoutRef<typeof Badge>;

export interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: "active" | "draft" | "paused" | "hot" | "warm" | "cold" | "success" | "warning" | "error" | "info";
  showDot?: boolean;
}

const statusConfig = {
  active: { 
    className: "bg-green-100 text-green-700 border-green-200", 
    label: "Active" 
  },
  draft: { 
    className: "bg-gray-100 text-gray-700 border-gray-200", 
    label: "Draft" 
  },
  paused: { 
    className: "bg-yellow-100 text-yellow-700 border-yellow-200", 
    label: "Paused" 
  },
  hot: { 
    className: "bg-red-100 text-red-700 border-red-200", 
    label: "Hot" 
  },
  warm: { 
    className: "bg-orange-100 text-orange-700 border-orange-200", 
    label: "Warm" 
  },
  cold: { 
    className: "bg-blue-100 text-blue-700 border-blue-200", 
    label: "Cold" 
  },
  success: { 
    className: "bg-green-100 text-green-700 border-green-200", 
    label: "Success" 
  },
  warning: { 
    className: "bg-yellow-100 text-yellow-700 border-yellow-200", 
    label: "Warning" 
  },
  error: { 
    className: "bg-red-100 text-red-700 border-red-200", 
    label: "Error" 
  },
  info: { 
    className: "bg-blue-100 text-blue-700 border-blue-200", 
    label: "Info" 
  },
};

export function StatusBadge({
  status,
  showDot = false,
  children,
  className,
  ...props
}: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
      role="status"
      aria-label={config.label}
      {...props}
    >
      {showDot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1" aria-hidden="true" />
      )}
      {children || config.label}
    </Badge>
  );
}
