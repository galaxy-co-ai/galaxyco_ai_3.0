import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface StatusBadgeProps extends React.ComponentProps<"span"> {
  status: "active" | "draft" | "paused" | "hot" | "warm" | "cold" | "success" | "warning" | "error" | "info";
  showDot?: boolean;
}

const statusConfig = {
  active: { className: "bg-green-100 text-green-800 border-green-200", label: "Active" },
  draft: { className: "bg-gray-100 text-gray-800 border-gray-200", label: "Draft" },
  paused: { className: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Paused" },
  hot: { className: "bg-red-100 text-red-800 border-red-200", label: "Hot" },
  warm: { className: "bg-orange-100 text-orange-800 border-orange-200", label: "Warm" },
  cold: { className: "bg-blue-100 text-blue-800 border-blue-200", label: "Cold" },
  success: { className: "bg-green-100 text-green-800 border-green-200", label: "Success" },
  warning: { className: "bg-yellow-100 text-yellow-800 border-yellow-200", label: "Warning" },
  error: { className: "bg-red-100 text-red-800 border-red-200", label: "Error" },
  info: { className: "bg-blue-100 text-blue-800 border-blue-200", label: "Info" },
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
      {showDot && <span className="w-2 h-2 rounded-full bg-current mr-1" />}
      {children || config.label}
    </Badge>
  );
}

