"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type PillTab<T extends string = string> = {
  value: T;
  label: string;
  Icon?: LucideIcon;
  /**
   * Tailwind class applied when the tab is active (e.g. "bg-emerald-100 text-emerald-700").
   */
  activeClassName: string;
  /**
   * Tailwind class applied to the badge when inactive (e.g. "bg-emerald-500").
   */
  badgeClassName?: string;
  badge?: number;
  ariaLabel?: string;
};

export interface PillTabsProps<T extends string = string> {
  value: T;
  onValueChange: (value: T) => void;
  tabs: Array<PillTab<T>>;
  className?: string;
  listClassName?: string;
}

/**
 * PillTabs
 *
 * Standard rounded segmented navigation.
 * Used across dashboards (My Agents, Conversations, CRM, Marketing, Creator, etc.).
 */
export function PillTabs<T extends string>({
  value,
  onValueChange,
  tabs,
  className,
  listClassName,
}: PillTabsProps<T>) {
  return (
    <div className={cn("flex justify-center", className)}>
      <div
        className={cn(
          "bg-background/80 backdrop-blur-lg rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1 inline-flex gap-1",
          listClassName
        )}
        role="tablist"
        aria-label="Section tabs"
      >
        {tabs.map((tab) => {
          const isActive = value === tab.value;
          const Icon = tab.Icon;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onValueChange(tab.value)}
              className={cn(
                "relative h-8 px-3.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2",
                isActive
                  ? `${tab.activeClassName} shadow-sm`
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
              )}
              aria-label={tab.ariaLabel ?? `Switch to ${tab.label}`}
              aria-selected={isActive}
              role="tab"
            >
              {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={cn(
                    "text-xs px-1.5 py-0.5 h-4 min-w-[16px] rounded-full flex items-center justify-center",
                    isActive
                      ? "bg-white/90 text-gray-700"
                      : `${tab.badgeClassName ?? "bg-gray-500"} text-white`
                  )}
                  aria-label={`${tab.badge} ${tab.label}`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
