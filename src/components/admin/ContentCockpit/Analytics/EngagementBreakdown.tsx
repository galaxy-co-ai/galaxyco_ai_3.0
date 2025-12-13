"use client";

import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TrafficSourceData {
  direct?: number;
  organic?: number;
  social?: number;
  email?: number;
  referral?: number;
  other?: number;
}

interface EngagementBreakdownProps {
  trafficSources?: TrafficSourceData;
  avgScrollDepth?: number;
  avgTimeOnPage?: number;
  bounceRate?: number;
  isLoading?: boolean;
  className?: string;
}

const TRAFFIC_COLORS: Record<string, string> = {
  direct: "#6366f1", // Indigo
  organic: "#10b981", // Emerald
  social: "#f59e0b", // Amber
  email: "#8b5cf6", // Violet
  referral: "#ec4899", // Pink
  other: "#9ca3af", // Gray
};

const TRAFFIC_LABELS: Record<string, string> = {
  direct: "Direct",
  organic: "Organic Search",
  social: "Social Media",
  email: "Email",
  referral: "Referral",
  other: "Other",
};

function ScrollDepthBar({ depth }: { depth: number }) {
  const segments = [25, 50, 75, 100];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Average Scroll Depth</span>
        <span className="font-semibold text-gray-900">{depth}%</span>
      </div>
      <div className="flex items-center gap-1 h-3">
        {segments.map((threshold) => {
          const isReached = depth >= threshold;
          return (
            <div
              key={threshold}
              className={cn(
                "flex-1 h-full rounded transition-colors",
                isReached ? "bg-indigo-500" : "bg-gray-200"
              )}
              title={`${threshold}%`}
              role="progressbar"
              aria-valuenow={depth >= threshold ? threshold : 0}
              aria-valuemin={0}
              aria-valuemax={threshold}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function TimeDistribution({ avgTime }: { avgTime: number }) {
  // Show distribution based on average time
  // This is a simplified visualization
  const getTimeLabel = (seconds: number): string => {
    if (seconds < 30) return "Quick scan (<30s)";
    if (seconds < 60) return "Brief read (30s-1m)";
    if (seconds < 180) return "Engaged read (1-3m)";
    return "Deep read (3m+)";
  };

  const getTimeColor = (seconds: number): string => {
    if (seconds < 30) return "bg-red-500";
    if (seconds < 60) return "bg-amber-500";
    if (seconds < 180) return "bg-blue-500";
    return "bg-emerald-500";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Reading Pattern</span>
        <span className="font-semibold text-gray-900">
          {avgTime < 60
            ? `${avgTime}s`
            : `${Math.floor(avgTime / 60)}m ${avgTime % 60}s`}
        </span>
      </div>
      <div className="h-3 bg-gray-200 rounded overflow-hidden">
        <div
          className={cn(
            "h-full rounded transition-all",
            getTimeColor(avgTime)
          )}
          style={{ width: `${Math.min((avgTime / 300) * 100, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{getTimeLabel(avgTime)}</p>
    </div>
  );
}

function BounceRateIndicator({ rate }: { rate: number }) {
  const getColor = (r: number): string => {
    if (r < 30) return "text-emerald-600";
    if (r < 50) return "text-blue-600";
    if (r < 70) return "text-amber-600";
    return "text-red-600";
  };

  const getLabel = (r: number): string => {
    if (r < 30) return "Excellent";
    if (r < 50) return "Good";
    if (r < 70) return "Average";
    return "Needs Attention";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Bounce Rate</span>
        <span className={cn("font-semibold", getColor(rate))}>{rate}%</span>
      </div>
      <div className="h-3 bg-gray-200 rounded overflow-hidden">
        <div
          className={cn(
            "h-full rounded transition-all",
            rate < 30
              ? "bg-emerald-500"
              : rate < 50
              ? "bg-blue-500"
              : rate < 70
              ? "bg-amber-500"
              : "bg-red-500"
          )}
          style={{ width: `${rate}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{getLabel(rate)}</p>
    </div>
  );
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number }[];
}) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  return (
    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200">
      <p className="text-xs text-gray-500">
        {TRAFFIC_LABELS[item.name] || item.name}
      </p>
      <p className="text-sm font-semibold text-gray-900">
        {item.value.toLocaleString()} visits
      </p>
    </div>
  );
}

export function EngagementBreakdown({
  trafficSources = {},
  avgScrollDepth = 0,
  avgTimeOnPage = 0,
  bounceRate = 0,
  isLoading = false,
  className,
}: EngagementBreakdownProps) {
  // Format traffic data for pie chart
  const trafficData = useMemo(() => {
    return Object.entries(trafficSources)
      .filter(([_, value]) => value && value > 0)
      .map(([key, value]) => ({
        name: key,
        value: value || 0,
        color: TRAFFIC_COLORS[key] || TRAFFIC_COLORS.other,
      }));
  }, [trafficSources]);

  const totalTraffic = trafficData.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-xl bg-white p-6",
          "shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200",
          className
        )}
      >
        <Skeleton className="h-6 w-48 mb-6" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-[200px]" />
          <div className="space-y-6">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </div>
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
      aria-label="Engagement breakdown"
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Engagement Breakdown
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Traffic Sources Pie Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">
            Traffic Sources
          </h4>
          {trafficData.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">
              No traffic data available
            </div>
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trafficData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {trafficData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {/* Legend */}
          {trafficData.length > 0 && (
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {trafficData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs text-gray-600">
                    {TRAFFIC_LABELS[item.name]}:{" "}
                    {totalTraffic > 0
                      ? Math.round((item.value / totalTraffic) * 100)
                      : 0}
                    %
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Engagement Metrics */}
        <div className="space-y-6">
          <ScrollDepthBar depth={avgScrollDepth} />
          <TimeDistribution avgTime={avgTimeOnPage} />
          <BounceRateIndicator rate={bounceRate} />
        </div>
      </div>
    </div>
  );
}

