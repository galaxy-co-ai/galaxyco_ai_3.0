"use client";

import { FileText, Eye, ListOrdered, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsBarProps {
  /** Number of published articles */
  publishedCount: number;
  /** Number of items in the hit list queue */
  queueCount: number;
  /** Total views this month */
  viewsThisMonth: number;
  /** Number of active alerts */
  alertsCount: number;
  /** Loading state */
  isLoading?: boolean;
}

interface StatItemProps {
  icon: React.ElementType;
  value: number | string;
  label: string;
  colorClass: string;
  bgClass: string;
  isLoading?: boolean;
}

function StatItem({
  icon: Icon,
  value,
  label,
  colorClass,
  bgClass,
  isLoading,
}: StatItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-lg border",
        "transition-all duration-150 hover:shadow-sm",
        bgClass
      )}
      role="status"
      aria-label={`${label}: ${value}`}
    >
      <Icon className={cn("h-4 w-4", colorClass)} aria-hidden="true" />
      <div className="flex items-baseline gap-1.5">
        {isLoading ? (
          <div className="h-5 w-8 animate-pulse rounded bg-gray-200" />
        ) : (
          <span className={cn("text-sm font-semibold", colorClass)}>
            {typeof value === "number"
              ? value.toLocaleString()
              : value}
          </span>
        )}
        <span className="text-xs text-gray-500">{label}</span>
      </div>
    </div>
  );
}

/**
 * StatsBar Component
 *
 * Displays quick stats for the Content Cockpit dashboard.
 * Shows published articles, queue items, monthly views, and active alerts.
 *
 * @example
 * ```tsx
 * <StatsBar
 *   publishedCount={42}
 *   queueCount={8}
 *   viewsThisMonth={1250}
 *   alertsCount={3}
 * />
 * ```
 */
export function StatsBar({
  publishedCount,
  queueCount,
  viewsThisMonth,
  alertsCount,
  isLoading = false,
}: StatsBarProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-3"
      role="region"
      aria-label="Content statistics"
    >
      <StatItem
        icon={FileText}
        value={publishedCount}
        label="Published"
        colorClass="text-emerald-600"
        bgClass="bg-emerald-50 border-emerald-200"
        isLoading={isLoading}
      />
      <StatItem
        icon={ListOrdered}
        value={queueCount}
        label="In Queue"
        colorClass="text-indigo-600"
        bgClass="bg-indigo-50 border-indigo-200"
        isLoading={isLoading}
      />
      <StatItem
        icon={Eye}
        value={viewsThisMonth}
        label="Views This Month"
        colorClass="text-blue-600"
        bgClass="bg-blue-50 border-blue-200"
        isLoading={isLoading}
      />
      <StatItem
        icon={Bell}
        value={alertsCount}
        label="Alerts"
        colorClass="text-amber-600"
        bgClass="bg-amber-50 border-amber-200"
        isLoading={isLoading}
      />
    </div>
  );
}

