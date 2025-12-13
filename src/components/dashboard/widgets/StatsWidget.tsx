"use client";

/**
 * Stats Widget - Display a single statistic with optional trend
 */

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsWidgetProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconBg?: string;
  iconColor?: string;
  className?: string;
}

export default function StatsWidget({
  label,
  value,
  icon: Icon,
  trend,
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
  className,
}: StatsWidgetProps) {
  return (
    <div className={cn("flex items-center gap-4 p-4", className)}>
      <div className={cn("p-3 rounded-xl shrink-0", iconBg)}>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground truncate">{label}</p>
          {trend && (
            <span className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              trend.isPositive ? "text-emerald-600" : "text-red-600"
            )}>
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
