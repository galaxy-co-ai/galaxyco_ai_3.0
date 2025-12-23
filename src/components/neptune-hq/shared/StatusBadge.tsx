"use client";

import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'success' | 'warning' | 'error' | 'info';
  label?: string;
  className?: string;
}

const statusStyles = {
  active: {
    bg: 'bg-green-100 dark:bg-green-950/20',
    text: 'text-green-700 dark:text-green-400',
    dot: 'bg-green-500',
  },
  inactive: {
    bg: 'bg-gray-100 dark:bg-gray-950/20',
    text: 'text-gray-700 dark:text-gray-400',
    dot: 'bg-gray-500',
  },
  success: {
    bg: 'bg-green-100 dark:bg-green-950/20',
    text: 'text-green-700 dark:text-green-400',
    dot: 'bg-green-500',
  },
  warning: {
    bg: 'bg-amber-100 dark:bg-amber-950/20',
    text: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  error: {
    bg: 'bg-red-100 dark:bg-red-950/20',
    text: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-950/20',
    text: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const styles = statusStyles[status];
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        styles.bg,
        styles.text,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', styles.dot)} />
      {displayLabel}
    </span>
  );
}
