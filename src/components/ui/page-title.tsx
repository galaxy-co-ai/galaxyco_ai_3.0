"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PageTitleProps {
  title: string;
  icon: LucideIcon;
  description?: string;
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  gradientFrom?: string;
  gradientTo?: string;
  as?: "h1" | "h2" | "h3";
}

function sanitizeId(raw: string) {
  // React useId() contains characters like ':' which are valid in HTML ids,
  // but we sanitize to keep ids short + predictable.
  return raw.replace(/[^a-zA-Z0-9_-]/g, "");
}

/**
 * PageTitle
 *
 * Standardized header title: gradient icon + Space Grotesk branded title.
 * Eliminates repeated <svg><defs> blocks across dashboards.
 */
export function PageTitle({
  title,
  icon: Icon,
  description,
  className,
  iconClassName,
  titleClassName,
  descriptionClassName,
  gradientFrom = "#8b5cf6",
  gradientTo = "#3b82f6",
  as = "h1",
}: PageTitleProps) {
  const reactId = React.useId();
  const gradientId = React.useMemo(
    () => `icon-gradient-${sanitizeId(reactId)}`,
    [reactId]
  );

  const TitleTag = as;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Icon
        className={cn("w-6 h-6 md:w-7 md:h-7 drop-shadow-sm", iconClassName)}
        stroke={`url(#${gradientId})`}
        strokeWidth={2}
        aria-hidden="true"
      />
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientFrom} />
            <stop offset="100%" stopColor={gradientTo} />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex flex-col">
        <TitleTag
          className={cn(
            "branded-page-title-compact md:branded-page-title text-xl md:text-2xl uppercase drop-shadow-sm",
            titleClassName
          )}
        >
          {title}
        </TitleTag>
        {description && (
          <p className={cn("text-sm text-muted-foreground mt-0.5", descriptionClassName)}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
