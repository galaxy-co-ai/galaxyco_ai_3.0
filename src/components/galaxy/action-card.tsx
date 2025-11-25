import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export interface ActionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  metadata?: string;
  icon?: React.ReactNode;
}

export function ActionCard({
  title,
  description,
  action,
  metadata,
  icon,
  className,
  ...props
}: ActionCardProps) {
  return (
    <Card
      className={cn(
        "hover:shadow-md transition-all cursor-pointer group",
        className
      )}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          action?.onClick();
        }
      }}
      onClick={action?.onClick}
      aria-label={`${title}: ${description}`}
      {...props}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <div className="flex items-start gap-3">
              {icon && (
                <div className="mt-0.5 text-muted-foreground" aria-hidden="true">
                  {icon}
                </div>
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
                {metadata && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {metadata}
                  </p>
                )}
              </div>
            </div>
          </div>
          {action && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={action.label}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

