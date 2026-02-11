'use client';

import * as React from 'react';
import { Card } from './card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    direction?: 'up' | 'down' | 'neutral';
  };
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  accentColor?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  loading = false,
  className,
  onClick,
  accentColor,
}: StatCardProps) {
  const getTrendIcon = () => {
    if (!trend) return null;
    const direction = trend.direction || (trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'neutral');

    switch (direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3" />;
      case 'down':
        return <TrendingDown className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '';
    const direction = trend.direction || (trend.value > 0 ? 'up' : trend.value < 0 ? 'down' : 'neutral');

    switch (direction) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card className={cn('p-4 animate-pulse', className)}>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-3 w-20 bg-muted rounded" />
            <div className="h-8 w-24 bg-muted rounded" />
            {subtitle && <div className="h-3 w-16 bg-muted rounded" />}
          </div>
          {Icon && (
            <div className="h-10 w-10 bg-muted rounded-lg" />
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'p-4 transition-all',
        onClick && 'cursor-pointer hover:shadow-md hover:border-primary/20',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-sm text-muted-foreground truncate">{title}</p>
          <p
            className="text-2xl font-bold tracking-tight"
            style={accentColor ? { color: accentColor } : undefined}
          >
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
          {trend && (
            <div className={cn('flex items-center gap-1 text-xs', getTrendColor())}>
              {getTrendIcon()}
              <span className="font-medium">
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </span>
              {trend.label && (
                <span className="text-muted-foreground">{trend.label}</span>
              )}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={cn(
              'p-2.5 rounded-lg shrink-0',
              accentColor ? 'bg-opacity-10' : 'bg-primary/10'
            )}
            style={accentColor ? { backgroundColor: `${accentColor}20` } : undefined}
          >
            <Icon
              className="h-5 w-5"
              style={accentColor ? { color: accentColor } : undefined}
            />
          </div>
        )}
      </div>
    </Card>
  );
}

// Skeleton version for loading states
export function StatCardSkeleton({ className }: { className?: string }) {
  return <StatCard title="" value="" loading className={className} />;
}
