"use client";

/**
 * Widget Grid - Container for dashboard widgets
 * Supports responsive grid layout
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface WidgetGridProps {
  children: ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

export default function WidgetGrid({ 
  children, 
  className,
  columns = 3,
}: WidgetGridProps) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn(
      "grid gap-4",
      gridCols[columns],
      className
    )}>
      {children}
    </div>
  );
}

// Re-export widget components for convenience
export { default as WidgetCard } from './WidgetCard';
export { default as StatsWidget } from './StatsWidget';
export { default as QuickActionsWidget } from './QuickActionsWidget';
