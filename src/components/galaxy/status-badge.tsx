import * as React from "react";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps extends Omit<BadgeProps, "variant"> {
  status: "active" | "draft" | "paused" | "hot" | "warm" | "cold" | "success" | "warning" | "error" | "info";
  showDot?: boolean;
}

const statusConfig = {
  active: { variant: "active" as const, label: "Active" },
  draft: { variant: "draft" as const, label: "Draft" },
  paused: { variant: "paused" as const, label: "Paused" },
  hot: { variant: "hot" as const, label: "Hot" },
  warm: { variant: "warm" as const, label: "Warm" },
  cold: { variant: "cold" as const, label: "Cold" },
  success: { variant: "success" as const, label: "Success" },
  warning: { variant: "warning" as const, label: "Warning" },
  error: { variant: "error" as const, label: "Error" },
  info: { variant: "info" as const, label: "Info" },
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
      variant={config.variant}
      dot={showDot}
      className={cn(className)}
      role="status"
      aria-label={config.label}
      {...props}
    >
      {children || config.label}
    </Badge>
  );
}

