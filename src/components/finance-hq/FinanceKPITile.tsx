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
import { Badge } from "@/components/ui/badge";
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

/**
 * Get badge color classes based on icon background color
 */
function getBadgeClasses(iconBg: string): string {
  if (iconBg.includes("emerald")) {
    return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
  }
  if (iconBg.includes("rose") || iconBg.includes("red")) {
    return "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800";
  }
  if (iconBg.includes("blue")) {
    return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
  }
  if (iconBg.includes("amber") || iconBg.includes("yellow")) {
    return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
  }
  if (iconBg.includes("indigo") || iconBg.includes("purple")) {
    return "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800";
  }
  return "bg-muted text-muted-foreground border-border";
}

interface FinanceKPITileProps {
  kpi: KPI;
}

/**
 * Individual KPI card with label badge in top-right, icon + value inline.
 */
export function FinanceKPITile({ kpi }: FinanceKPITileProps) {
  const Icon = getIconByName(kpi.icon);
  const isPositive = kpi.delta !== undefined && kpi.delta >= 0;
  const badgeClasses = getBadgeClasses(kpi.iconBg);

  return (
    <Card
      className="p-3 pt-5 rounded-xl shadow-sm bg-gradient-to-br from-card to-muted/20 border hover:shadow-md transition-shadow !gap-0 relative overflow-visible"
      role="article"
      aria-label={`${kpi.label}: ${kpi.formattedValue}`}
    >
      {/* Label badge - centered, straddling top border */}
      <Badge
        variant="outline"
        className={cn(
          "absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] h-5 px-2 font-medium border shadow-sm",
          badgeClasses
        )}
      >
        {kpi.label}
      </Badge>

      {/* Icon + Value inline */}
      <div className="flex items-center gap-2.5">
        <div className={cn("p-1.5 rounded-lg shrink-0", kpi.iconBg)}>
          <Icon className={cn("h-4 w-4", kpi.iconColor)} aria-hidden="true" />
        </div>
        <div className="text-xl font-semibold text-foreground leading-tight">
          {kpi.formattedValue}
        </div>
      </div>

      {/* Delta - below value */}
      {kpi.delta !== undefined && (
        <div
          className={cn(
            "text-[11px] mt-1.5 flex items-center gap-0.5 pl-[34px]",
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
    <Card className="p-3 pt-5 rounded-xl shadow-sm border !gap-0 relative overflow-visible">
      <Skeleton className="absolute -top-2.5 left-1/2 -translate-x-1/2 h-5 w-16 rounded-full" />
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-3 w-28 mt-1.5 ml-[34px]" />
    </Card>
  );
}

