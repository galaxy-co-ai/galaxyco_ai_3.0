import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

export interface StatsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  change?: {
    value: string | number;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  description?: string;
}

export function StatsCard({
  title,
  value,
  change,
  icon,
  description,
  className,
  ...props
}: StatsCardProps) {
  return (
    <Card
      className={cn("hover:shadow-md transition-shadow", className)}
      {...props}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{value}</p>
              {change && (
                <span
                  className={cn(
                    "text-sm font-medium",
                    change.isPositive
                      ? "text-[var(--status-success)]"
                      : "text-[var(--status-error)]"
                  )}
                >
                  {change.isPositive ? "+" : ""}
                  {change.value}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {icon && (
            <div className="text-muted-foreground" aria-hidden="true">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

