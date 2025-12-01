"use client";

import * as React from "react";
import { FinanceKPITile, FinanceKPITileSkeleton } from "./FinanceKPITile";
import type { KPI } from "@/types/finance";

interface FinanceKPIGridProps {
  kpis?: KPI[];
  isLoading?: boolean;
}

/**
 * Renders a responsive grid of KPI cards.
 * Displays 2 columns on mobile, 3 on tablet, and 5 on desktop.
 */
export function FinanceKPIGrid({ kpis, isLoading }: FinanceKPIGridProps) {
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-2 md:grid-cols-4 gap-3"
        role="region"
        aria-label="Key performance indicators loading"
        aria-busy="true"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <FinanceKPITileSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!kpis || kpis.length === 0) {
    return null;
  }

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-4 gap-3"
      role="region"
      aria-label="Key performance indicators"
    >
      {kpis.map((kpi) => (
        <FinanceKPITile key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}

