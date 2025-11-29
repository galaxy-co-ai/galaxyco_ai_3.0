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
 * Follows GalaxyCo card patterns with gradient backgrounds.
 */
export function FinanceKPITile({ kpi }: FinanceKPITileProps) {
  const Icon = getIconByName(kpi.icon);
  const isPositive = kpi.delta !== undefined && kpi.delta >= 0;

  return (
    <Card
      className="p-4 rounded-xl shadow-sm bg-gradient-to-br from-card to-muted/20 border hover:shadow-md transition-shadow"
      role="article"
      aria-label={`${kpi.label}: ${kpi.formattedValue}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-1.5 rounded-lg", kpi.iconBg)}>
          <Icon className={cn("h-4 w-4", kpi.iconColor)} aria-hidden="true" />
        </div>
      </div>
      <div className="text-lg font-semibold text-foreground">
        {kpi.formattedValue}
      </div>
      <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
      {kpi.delta !== undefined && (
        <div
          className={cn(
            "text-[11px] mt-1.5 flex items-center gap-0.5",
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
    <Card className="p-4 rounded-xl shadow-sm border">
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-7 w-7 rounded-lg" />
      </div>
      <Skeleton className="h-5 w-20 mb-1" />
      <Skeleton className="h-3 w-14" />
      <Skeleton className="h-3 w-16 mt-1.5" />
    </Card>
  );
}

