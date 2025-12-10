"use client";

import { cn } from "@/lib/utils";
import {
  Eye,
  Clock,
  MousePointerClick,
  TrendingUp,
  TrendingDown,
  Minus,
  Share2,
  FileText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function StatCard({ label, value, change, icon, isLoading }: StatCardProps) {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) {
      return <Minus className="h-3 w-3 text-gray-400" aria-hidden="true" />;
    }
    return change > 0 ? (
      <TrendingUp className="h-3 w-3 text-emerald-500" aria-hidden="true" />
    ) : (
      <TrendingDown className="h-3 w-3 text-red-500" aria-hidden="true" />
    );
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return "text-gray-500";
    return change > 0 ? "text-emerald-600" : "text-red-600";
  };

  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-xl bg-white p-4",
          "shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200"
        )}
      >
        <div className="flex items-start justify-between">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-8 w-24 mt-3" />
        <Skeleton className="h-4 w-20 mt-1" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl bg-white p-4",
        "shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200",
        "hover:-translate-y-px hover:shadow-lg",
        "transition-all duration-200"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          {icon}
        </div>
        {change !== undefined && (
          <div
            className={cn("flex items-center gap-1 text-xs", getTrendColor())}
          >
            {getTrendIcon()}
            <span>{change > 0 ? "+" : ""}{change.toFixed(1)}%</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-3">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}

interface StatsOverviewCardsProps {
  stats?: {
    totalViews: number;
    avgTimeOnPage: number;
    avgScrollDepth: number;
    avgBounceRate: number;
    totalShares: number;
    totalPublished: number;
  };
  trends?: {
    viewsChange: number;
    timeChange: number;
  };
  isLoading?: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

export function StatsOverviewCards({
  stats,
  trends,
  isLoading = false,
}: StatsOverviewCardsProps) {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      role="region"
      aria-label="Analytics overview statistics"
    >
      <StatCard
        label="Total Views"
        value={formatNumber(stats?.totalViews || 0)}
        change={trends?.viewsChange}
        icon={<Eye className="h-5 w-5" aria-hidden="true" />}
        isLoading={isLoading}
      />
      <StatCard
        label="Avg. Read Time"
        value={formatTime(stats?.avgTimeOnPage || 0)}
        change={trends?.timeChange}
        icon={<Clock className="h-5 w-5" aria-hidden="true" />}
        isLoading={isLoading}
      />
      <StatCard
        label="Scroll Depth"
        value={`${stats?.avgScrollDepth || 0}%`}
        icon={<MousePointerClick className="h-5 w-5" aria-hidden="true" />}
        isLoading={isLoading}
      />
      <StatCard
        label="Bounce Rate"
        value={`${stats?.avgBounceRate || 0}%`}
        icon={
          <TrendingDown
            className={cn(
              "h-5 w-5",
              (stats?.avgBounceRate || 0) > 50 ? "text-amber-200" : ""
            )}
            aria-hidden="true"
          />
        }
        isLoading={isLoading}
      />
      <StatCard
        label="Social Shares"
        value={formatNumber(stats?.totalShares || 0)}
        icon={<Share2 className="h-5 w-5" aria-hidden="true" />}
        isLoading={isLoading}
      />
      <StatCard
        label="Published Articles"
        value={stats?.totalPublished || 0}
        icon={<FileText className="h-5 w-5" aria-hidden="true" />}
        isLoading={isLoading}
      />
    </div>
  );
}

