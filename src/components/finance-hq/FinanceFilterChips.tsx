"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FinanceFilters, FinanceProvider, FinanceIntegrationsResponse } from "@/types/finance";

/**
 * Source configuration with colors and labels
 */
const sourceConfig: Record<
  FinanceProvider,
  { label: string; activeClass: string; defaultClass: string }
> = {
  quickbooks: {
    label: "QuickBooks",
    activeClass: "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700",
    defaultClass: "hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-900/20",
  },
  stripe: {
    label: "Stripe",
    activeClass: "bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700",
    defaultClass: "hover:bg-indigo-50 hover:border-indigo-200 dark:hover:bg-indigo-900/20",
  },
  shopify: {
    label: "Shopify",
    activeClass: "bg-lime-100 text-lime-800 border-lime-300 hover:bg-lime-200 dark:bg-lime-900/40 dark:text-lime-300 dark:border-lime-700",
    defaultClass: "hover:bg-lime-50 hover:border-lime-200 dark:hover:bg-lime-900/20",
  },
};

interface FinanceFilterChipsProps {
  filters: FinanceFilters;
  onChange: (filters: FinanceFilters) => void;
  integrations?: FinanceIntegrationsResponse;
}

/**
 * Filter chips for toggling data sources.
 * Shows only connected integrations with visual toggle states.
 */
export function FinanceFilterChips({
  filters,
  onChange,
  integrations,
}: FinanceFilterChipsProps) {
  // Get available sources from connected integrations
  const availableSources = React.useMemo(() => {
    if (!integrations?.connected) return [];
    return integrations.connected;
  }, [integrations?.connected]);

  // Toggle a source filter
  const handleToggle = (source: FinanceProvider) => {
    const newSources = filters.sources.includes(source)
      ? filters.sources.filter((s) => s !== source)
      : [...filters.sources, source];
    onChange({ ...filters, sources: newSources });
  };

  // Clear all filters
  const handleClearAll = () => {
    onChange({ ...filters, sources: [] });
  };

  // If no integrations connected, don't show filters
  if (availableSources.length === 0) {
    return null;
  }

  const hasActiveFilters = filters.sources.length > 0;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Filter by data source"
    >
      <span className="text-sm text-muted-foreground mr-1">Filter:</span>

      {availableSources.map((source) => {
        const config = sourceConfig[source];
        const isActive = filters.sources.includes(source);

        return (
          <Button
            key={source}
            variant="outline"
            size="sm"
            className={cn(
              "h-8 px-3 text-sm font-normal transition-colors",
              isActive ? config.activeClass : config.defaultClass
            )}
            onClick={() => handleToggle(source)}
            aria-pressed={isActive}
            aria-label={`${isActive ? "Remove" : "Add"} ${config.label} filter`}
          >
            {isActive && (
              <Check className="h-3 w-3 mr-1.5" aria-hidden="true" />
            )}
            {config.label}
          </Button>
        );
      })}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-sm text-muted-foreground hover:text-foreground"
          onClick={handleClearAll}
          aria-label="Clear all filters"
        >
          Clear
        </Button>
      )}
    </div>
  );
}

















