"use client";

import { AlertBadgeItem } from "./AlertBadgeItem";
import { Bell } from "lucide-react";
import type { AlertBadge } from "@/db/schema";

interface AlertBadgeListProps {
  alerts: AlertBadge[];
  onMarkRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onAction?: (id: string) => void;
  compact?: boolean;
  emptyMessage?: string;
}

/**
 * AlertBadgeList - List view for alert badges
 * 
 * Displays a list of alerts with empty state handling.
 * Can be used in a full page view or within a popover.
 * 
 * @param alerts - Array of alert badges to display
 * @param onMarkRead - Callback when an alert is marked as read
 * @param onDismiss - Callback when an alert is dismissed
 * @param onAction - Callback when action button is clicked
 * @param compact - Whether to use compact styling
 * @param emptyMessage - Custom message when no alerts
 */
export function AlertBadgeList({
  alerts,
  onMarkRead,
  onDismiss,
  onAction,
  compact = false,
  emptyMessage = "No alerts at this time",
}: AlertBadgeListProps) {
  if (alerts.length === 0) {
    return (
      <div 
        className="flex flex-col items-center justify-center py-8 text-center"
        role="status"
        aria-label="No alerts"
      >
        <div className="rounded-full bg-gray-100 p-3 mb-3">
          <Bell className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <p className="text-sm text-gray-500">{emptyMessage}</p>
        <p className="text-xs text-gray-400 mt-1">
          You&apos;re all caught up!
        </p>
      </div>
    );
  }

  return (
    <div 
      className="divide-y divide-gray-100"
      role="list"
      aria-label="Alert notifications"
    >
      {alerts.map((alert) => (
        <AlertBadgeItem
          key={alert.id}
          alert={alert}
          onMarkRead={onMarkRead}
          onDismiss={onDismiss}
          onAction={onAction}
          compact={compact}
        />
      ))}
    </div>
  );
}

