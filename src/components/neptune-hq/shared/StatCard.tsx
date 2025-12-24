"use client";

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number; // percentage change
    direction: 'up' | 'down' | 'flat';
  };
  color?: 'green' | 'red' | 'blue' | 'amber' | 'neutral';
  icon?: LucideIcon;
  className?: string;
}

const colorStyles = {
  green: {
    bg: 'bg-green-50 dark:bg-green-950/20',
    text: 'text-green-700 dark:text-green-400',
    icon: 'text-green-600 dark:text-green-500',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/20',
    text: 'text-red-700 dark:text-red-400',
    icon: 'text-red-600 dark:text-red-500',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/20',
    text: 'text-blue-700 dark:text-blue-400',
    icon: 'text-blue-600 dark:text-blue-500',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    text: 'text-amber-700 dark:text-amber-400',
    icon: 'text-amber-600 dark:text-amber-500',
  },
  neutral: {
    bg: 'bg-muted',
    text: 'text-foreground',
    icon: 'text-muted-foreground',
  },
};

export function StatCard({
  title,
  value,
  trend,
  color = 'neutral',
  icon: Icon,
  className,
}: StatCardProps) {
  const styles = colorStyles[color];
  
  const TrendIcon = trend?.direction === 'up' 
    ? TrendingUp 
    : trend?.direction === 'down' 
    ? TrendingDown 
    : Minus;

  return (
    <Card className={cn('overflow-hidden shadow-sm', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="mt-1.5 text-2xl font-semibold">{value}</p>
            {trend && (
              <div className="mt-1.5 flex items-center gap-1">
                <TrendIcon className={cn('h-3 w-3', styles.icon)} />
                <span className={cn('text-xs font-medium', styles.text)}>
                  {trend.value > 0 ? '+' : ''}{trend.value}%
                </span>
                <span className="text-[10px] text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn('rounded-lg p-2', styles.bg)}>
              <Icon className={cn('h-4 w-4', styles.icon)} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
