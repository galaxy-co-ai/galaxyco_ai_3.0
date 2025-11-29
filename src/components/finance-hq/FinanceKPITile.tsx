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
 * Individual KPI card display with value, label, and trend indicator.
 * Compact horizontal layout with icon inline with value.
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
      {/* Icon + Value on same row */}
      <div className="flex items-center gap-2.5">
        <div className={cn("p-1.5 rounded-lg shrink-0", kpi.iconBg)}>
          <Icon className={cn("h-4 w-4", kpi.iconColor)} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="text-lg font-semibold text-foreground leading-tight">
            {kpi.formattedValue}
          </div>
          <div className="text-[11px] text-muted-foreground">{kpi.label}</div>
        </div>
      </div>
      {/* Delta row */}
      {kpi.delta !== undefined && (
        <div
          className={cn(
            "text-[11px] mt-2 flex items-center gap-0.5 pl-[38px]",
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
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
        <div className="min-w-0">
          <Skeleton className="h-5 w-20 mb-1" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
      <Skeleton className="h-3 w-24 mt-2 ml-[38px]" />
    </Card>
  );
}

