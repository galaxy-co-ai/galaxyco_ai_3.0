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
      className="p-4 md:p-6 rounded-2xl shadow-sm bg-gradient-to-br from-card to-muted/30 border hover:shadow-md transition-shadow"
      role="article"
      aria-label={`${kpi.label}: ${kpi.formattedValue}`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("p-2 rounded-xl", kpi.iconBg)}>
          <Icon className={cn("h-5 w-5", kpi.iconColor)} aria-hidden="true" />
        </div>
      </div>
      <div className="text-2xl md:text-3xl font-bold text-foreground">
        {kpi.formattedValue}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{kpi.label}</div>
      {kpi.delta !== undefined && (
        <div
          className={cn(
            "text-xs mt-2 flex items-center gap-1",
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
    <Card className="p-4 md:p-6 rounded-2xl shadow-sm border">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-3 w-20 mt-2" />
    </Card>
  );
}

