"use client";

import * as React from "react";
import {
  ChevronRight,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart,
  List,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  ShoppingCart,
  CreditCard,
  FileText,
  FolderKanban,
  type LucideIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  isChartData,
  isListData,
  isMetricData,
} from "@/types/finance";
import type {
  FinanceModule,
  FinanceObject,
  FinanceProvider,
  ChartData,
  ListData,
  MetricData,
} from "@/types/finance";

/**
 * Map icon names to Lucide icon components
 */
const iconMap: Record<string, LucideIcon> = {
  BarChart3,
  LineChart: LineChartIcon,
  PieChart,
  List,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  ShoppingCart,
  CreditCard,
  FileText,
  FolderKanban,
};

/**
 * Get chart color (hex) based on module ID
 */
function getChartColor(moduleId: string): string {
  const colors: Record<string, string> = {
    "revenue-trend": "#10b981",   // emerald-500
    "expense-trend": "#f43f5e",   // rose-500
    "profit-trend": "#3b82f6",    // blue-500
  };
  return colors[moduleId] || "#6366f1"; // indigo-500 default
}

function getIconByName(name: string): LucideIcon {
  return iconMap[name] || BarChart3;
}

/**
 * Get color classes for each finance source
 */
function getSourceColors(source: FinanceProvider) {
  const colors = {
    quickbooks: {
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
    },
    stripe: {
      iconBg: "bg-indigo-100 dark:bg-indigo-900/30",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      badgeClass: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800",
    },
    shopify: {
      iconBg: "bg-lime-100 dark:bg-lime-900/30",
      iconColor: "text-lime-600 dark:text-lime-400",
      badgeClass: "bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-900/20 dark:text-lime-400 dark:border-lime-800",
    },
  };
  return colors[source];
}

/**
 * Format relative time string
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Professional sparkline chart using Recharts
 */
function SparklineChart({ data, color = "#6366f1" }: { data: ChartData; color?: string }) {
  const chartData = data.dataPoints.map((point) => ({
    name: point.label,
    value: point.value,
  }));

  // Calculate domain with padding
  const values = chartData.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const padding = (maxVal - minVal) * 0.1;

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id={`gradient-${data.dataPoints[0]?.label}-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <YAxis domain={[minVal - padding, maxVal + padding]} hide />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#gradient-${data.dataPoints[0]?.label}-${color.replace('#', '')})`}
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * Mini chart visualization for module preview
 */
function ModuleChart({ data, color }: { data: ChartData; color?: string }) {
  const maxValue = Math.max(...data.dataPoints.map((p) => p.value));

  // Use Recharts sparkline for 'line' type charts
  if (data.type === "line") {
    return <SparklineChart data={data} color={color} />;
  }

  // Default bar chart
  return (
    <div className="flex items-end gap-1 h-full pt-2">
      {data.dataPoints.slice(-12).map((point, i) => (
        <div
          key={i}
          className="flex-1 bg-primary/20 rounded-t transition-all hover:bg-primary/40"
          style={{ height: `${(point.value / maxValue) * 100}%`, minHeight: "4px" }}
          title={`${point.label}: ${point.value}`}
        />
      ))}
    </div>
  );
}

/**
 * List preview for module
 */
function ModuleList({ items }: { items: ListData["items"] }) {
  return (
    <div className="space-y-1.5">
      {items.slice(0, 3).map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between text-xs"
        >
          <span className="truncate text-foreground">{item.title}</span>
          {item.amount !== undefined && (
            <span className="text-muted-foreground font-mono text-[11px]">
              ${item.amount.toLocaleString()}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Large metric display for module
 */
function ModuleMetric({ value, formattedValue, trend }: MetricData) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="text-xl font-semibold text-foreground">{formattedValue}</span>
      {trend !== undefined && (
        <span
          className={cn(
            "text-xs flex items-center gap-0.5",
            trend >= 0 ? "text-green-600" : "text-red-600"
          )}
        >
          <TrendingUp
            className={cn("h-3 w-3", trend < 0 && "rotate-180")}
            aria-hidden="true"
          />
          {trend >= 0 ? "+" : ""}
          {trend}%
        </span>
      )}
    </div>
  );
}

interface FinanceModuleTileProps {
  module: FinanceModule;
  onClick: (item: FinanceObject) => void;
}

/**
 * Individual module card with chart or list preview.
 * Clickable to open detail drawer.
 */
export function FinanceModuleTile({ module, onClick }: FinanceModuleTileProps) {
  const Icon = getIconByName(module.icon);
  const sourceColors = getSourceColors(module.source);

  const handleClick = () => {
    onClick({ type: "module", id: module.id, data: module as unknown as Record<string, unknown> });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      className="p-3 rounded-xl shadow-sm border hover:shadow-md transition-all cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 !gap-0 relative"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View ${module.title} details from ${module.source}`}
    >
      {/* Badge in top-right corner */}
      <Badge
        variant="outline"
        className={cn(
          "absolute top-2 right-2 text-[9px] h-4 px-1.5 border capitalize",
          sourceColors.badgeClass
        )}
      >
        {module.source}
      </Badge>

      {/* Header: icon and title */}
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-1.5 rounded-lg shrink-0", sourceColors.iconBg)}>
          <Icon className={cn("h-3.5 w-3.5", sourceColors.iconColor)} aria-hidden="true" />
        </div>
        <h3 className="text-sm font-medium text-foreground truncate">{module.title}</h3>
      </div>

      {/* Module Content - dynamic height based on content type */}
      <div className={cn(
        module.type === "chart" ? "h-16" : "min-h-0",
        module.type === "metric" && "h-14 flex items-center justify-center"
      )}>
        {module.type === "chart" && isChartData(module.data) && (
          <ModuleChart data={module.data} color={getChartColor(module.id)} />
        )}
        {module.type === "list" && isListData(module.data) && (
          <ModuleList items={module.data.items} />
        )}
        {module.type === "metric" && isMetricData(module.data) && (
          <ModuleMetric {...module.data} />
        )}
      </div>

      {/* Footer with timestamp and chevron */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
        <span className="text-[10px] text-muted-foreground">
          Updated {formatRelativeTime(module.lastUpdated)}
        </span>
        <ChevronRight
          className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0"
          aria-hidden="true"
        />
      </div>
    </Card>
  );
}

/**
 * Loading skeleton for FinanceModuleTile
 */
export function FinanceModuleTileSkeleton() {
  return (
    <Card className="p-3 rounded-xl shadow-sm border !gap-0 relative">
      {/* Badge skeleton */}
      <Skeleton className="absolute top-2 right-2 h-4 w-14 rounded-full" />
      
      {/* Header skeleton */}
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-6 w-6 rounded-lg shrink-0" />
        <Skeleton className="h-4 w-24" />
      </div>
      
      {/* Content skeleton */}
      <div className="h-16 flex items-end gap-1 pt-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${30 + Math.random() * 70}%` }}
          />
        ))}
      </div>
      
      {/* Footer skeleton */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
        <Skeleton className="h-2.5 w-20" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
    </Card>
  );
}

