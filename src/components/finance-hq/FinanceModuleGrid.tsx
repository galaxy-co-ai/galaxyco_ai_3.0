"use client";

import * as React from "react";
import { FinanceModuleTile, FinanceModuleTileSkeleton } from "./FinanceModuleTile";
import type { FinanceModule, FinanceFilters, FinanceObject } from "@/types/finance";

interface FinanceModuleGridProps {
  modules?: FinanceModule[];
  isLoading?: boolean;
  filters: FinanceFilters;
  onModuleClick: (item: FinanceObject) => void;
}

/**
 * Renders a responsive grid of module tiles.
 * Supports filtering by source.
 */
export function FinanceModuleGrid({
  modules,
  isLoading,
  filters,
  onModuleClick,
}: FinanceModuleGridProps) {
  // Filter modules by source if filters applied
  const filteredModules = React.useMemo(() => {
    if (!modules) return [];
    if (filters.sources.length === 0) return modules;
    return modules.filter((m) => filters.sources.includes(m.source));
  }, [modules, filters.sources]);

  if (isLoading) {
    return (
      <section
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        role="region"
        aria-label="Finance modules loading"
        aria-busy="true"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <FinanceModuleTileSkeleton key={i} />
        ))}
      </section>
    );
  }

  if (filteredModules.length === 0) {
    return (
      <section
        className="text-center py-12 text-muted-foreground"
        role="region"
        aria-label="Finance modules"
      >
        <p>No modules available for the selected filters.</p>
      </section>
    );
  }

  return (
    <section
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      role="region"
      aria-label="Finance modules"
    >
      {filteredModules.map((module) => (
        <FinanceModuleTile
          key={module.id}
          module={module}
          onClick={onModuleClick}
        />
      ))}
    </section>
  );
}

