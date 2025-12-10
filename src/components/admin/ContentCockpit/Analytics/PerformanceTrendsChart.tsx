"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { NeptuneButton } from "@/components/ui/neptune-button";

export type MetricType = "views" | "engagement" | "shares" | "time";

interface TrendDataPoint {
  period: string;
  value: number;
  views: number;
  uniqueVisitors: number;
  avgScrollDepth: number;
  avgTimeOnPage: number;
  avgBounceRate: number;
  socialShares: number;
}

interface PerformanceTrendsChartProps {
  data: TrendDataPoint[];
  metric: MetricType;
  onMetricChange: (metric: MetricType) => void;
  isLoading?: boolean;
  className?: string;
}

const metricConfig: Record<
  MetricType,
  { label: string; color: string; formatter: (value: number) => string }
> = {
  views: {
    label: "Page Views",
    color: "#6366f1", // Indigo
    formatter: (v) => v.toLocaleString(),
  },
  engagement: {
    label: "Engagement",
    color: "#10b981", // Emerald
    formatter: (v) => `${v}%`,
  },
  shares: {
    label: "Shares",
    color: "#f59e0b", // Amber
    formatter: (v) => v.toLocaleString(),
  },
  time: {
    label: "Read Time",
    color: "#8b5cf6", // Violet
    formatter: (v) => (v < 60 ? `${v}s` : `${Math.floor(v / 60)}m`),
  },
};

function CustomTooltip({
  active,
  payload,
  label,
  metric,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  metric: MetricType;
}) {
  if (!active || !payload?.length) return null;

  const config = metricConfig[metric];
  const value = payload[0]?.value || 0;

  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm font-semibold" style={{ color: config.color }}>
        {config.label}: {config.formatter(value)}
      </p>
    </div>
  );
}

export function PerformanceTrendsChart({
  data,
  metric,
  onMetricChange,
  isLoading = false,
  className,
}: PerformanceTrendsChartProps) {
  const config = metricConfig[metric];

  // Format data for the chart
  const chartData = useMemo(() => {
    return data.map((point) => ({
      ...point,
      displayPeriod: point.period.split("-").slice(1).join("/"), // Format: MM/DD or WW
      chartValue:
        metric === "views"
          ? point.views
          : metric === "engagement"
          ? point.avgScrollDepth
          : metric === "shares"
          ? point.socialShares
          : point.avgTimeOnPage,
    }));
  }, [data, metric]);

  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-xl bg-white p-6",
          "shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200",
          className
        )}
      >
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl bg-white p-6",
        "shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200",
        className
      )}
      role="region"
      aria-label="Performance trends chart"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Performance Trends
        </h3>
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Select metric to display"
        >
          {(Object.keys(metricConfig) as MetricType[]).map((m) => (
            <NeptuneButton
              key={m}
              variant={metric === m ? "primary" : "ghost"}
              size="sm"
              onClick={() => onMetricChange(m)}
              role="tab"
              aria-selected={metric === m}
              aria-label={`Show ${metricConfig[m].label}`}
            >
              {metricConfig[m].label}
            </NeptuneButton>
          ))}
        </div>
      </div>

      <div className="h-[300px]" aria-hidden="true">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No data available for the selected period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient
                  id={`gradient-${metric}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.2} />
                  <stop
                    offset="95%"
                    stopColor={config.color}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="displayPeriod"
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => config.formatter(value)}
              />
              <Tooltip content={<CustomTooltip metric={metric} />} />
              <Area
                type="monotone"
                dataKey="chartValue"
                stroke={config.color}
                strokeWidth={2}
                fill={`url(#gradient-${metric})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Screen reader description */}
      <p className="sr-only">
        Chart showing {config.label} trend over time with {chartData.length}{" "}
        data points.
      </p>
    </div>
  );
}

