"use client";

import * as React from "react";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  PiggyBank,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { KPI } from "@/types/finance";

/**
 * Map icon names to Lucide icon components
 */
const iconMap: Record<string, LucideIcon> = {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  PiggyBank,
};

function getIconByName(name: string): LucideIcon {
  return iconMap[name] || DollarSign;
}

interface FinanceKPITileProps {
  kpi: KPI;
}

/**
 * Individual KPI card display with label, value, and trend indicator.
 * Reading order: Label → Value → Delta (natural information hierarchy)
 */
export function FinanceKPITile({ kpi }: FinanceKPITileProps) {
  const Icon = getIconByName(kpi.icon);
  const isPositive = kpi.delta !== undefined && kpi.delta >= 0;

  return (
    <Card
      className="p-3 rounded-xl shadow-sm bg-gradient-to-br from-card to-muted/20 border hover:shadow-md transition-shadow !gap-0"
      role="article"
      aria-label={`${kpi.label}: ${kpi.formattedValue}`}
    >
      {/* Icon + Label on top row */}
      <div className="flex items-center gap-2 mb-1">
        <div className={cn("p-1.5 rounded-lg shrink-0", kpi.iconBg)}>
          <Icon className={cn("h-4 w-4", kpi.iconColor)} aria-hidden="true" />
        </div>
        <span className="text-xs text-muted-foreground font-medium">{kpi.label}</span>
      </div>
      {/* Value - prominent */}
      <div className="text-xl font-semibold text-foreground leading-tight pl-[34px]">
        {kpi.formattedValue}
      </div>
      {/* Delta - contextualizes the value */}
      {kpi.delta !== undefined && (
        <div
          className={cn(
            "text-[11px] mt-1 flex items-center gap-0.5 pl-[34px]",
            isPositive ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"
          )}
          aria-label={`${isPositive ? "Increased" : "Decreased"} by ${Math.abs(kpi.delta)}%${kpi.deltaLabel ? ` ${kpi.deltaLabel}` : ""}`}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
          ) : (
            <TrendingDown className="h-3 w-3" aria-hidden="true" />
          )}
          <span>
            {isPositive ? "+" : ""}
            {kpi.delta}%{kpi.deltaLabel ? ` ${kpi.deltaLabel}` : ""}
          </span>
        </div>
      )}
    </Card>
  );
}

/**
 * Loading skeleton for FinanceKPITile
 */
export function FinanceKPITileSkeleton() {
  return (
    <Card className="p-3 rounded-xl shadow-sm border !gap-0">
      <div className="flex items-center gap-2 mb-1">
        <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-6 w-24 ml-[34px]" />
      <Skeleton className="h-3 w-28 mt-1 ml-[34px]" />
    </Card>
  );
}

