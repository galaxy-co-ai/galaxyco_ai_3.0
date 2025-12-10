"use client";

import { formatDistanceToNow } from "date-fns";
import { 
  TrendingUp, 
  Lightbulb, 
  AlertTriangle, 
  Trophy, 
  Sparkles,
  ExternalLink,
  Check,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { AlertBadge, AlertBadgeType } from "@/db/schema";

/**
 * Get icon for alert badge type
 */
function getAlertIcon(type: AlertBadgeType) {
  switch (type) {
    case "trend":
      return TrendingUp;
    case "opportunity":
      return Lightbulb;
    case "warning":
      return AlertTriangle;
    case "milestone":
      return Trophy;
    case "suggestion":
      return Sparkles;
    default:
      return Lightbulb;
  }
}

/**
 * Get color classes for alert badge type
 */
function getAlertColors(type: AlertBadgeType) {
  switch (type) {
    case "trend":
      return {
        bg: "bg-blue-50",
        text: "text-blue-600",
        border: "border-blue-200",
        icon: "text-blue-500",
      };
    case "opportunity":
      return {
        bg: "bg-emerald-50",
        text: "text-emerald-600",
        border: "border-emerald-200",
        icon: "text-emerald-500",
      };
    case "warning":
      return {
        bg: "bg-amber-50",
        text: "text-amber-600",
        border: "border-amber-200",
        icon: "text-amber-500",
      };
    case "milestone":
      return {
        bg: "bg-purple-50",
        text: "text-purple-600",
        border: "border-purple-200",
        icon: "text-purple-500",
      };
    case "suggestion":
      return {
        bg: "bg-indigo-50",
        text: "text-indigo-600",
        border: "border-indigo-200",
        icon: "text-indigo-500",
      };
    default:
      return {
        bg: "bg-gray-50",
        text: "text-gray-600",
        border: "border-gray-200",
        icon: "text-gray-500",
      };
  }
}

interface AlertBadgeItemProps {
  alert: AlertBadge;
  onMarkRead?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onAction?: (id: string) => void;
  compact?: boolean;
}

/**
 * AlertBadgeItem - Single alert display component
 * 
 * Displays a single alert badge with icon, title, message,
 * and action buttons for marking read, dismissing, or taking action.
 * 
 * @param alert - The alert badge data
 * @param onMarkRead - Callback when alert is marked as read
 * @param onDismiss - Callback when alert is dismissed
 * @param onAction - Callback when action button is clicked
 * @param compact - Whether to use compact styling (for dropdown)
 */
export function AlertBadgeItem({
  alert,
  onMarkRead,
  onDismiss,
  onAction,
  compact = false,
}: AlertBadgeItemProps) {
  const Icon = getAlertIcon(alert.type);
  const colors = getAlertColors(alert.type);
  const isUnread = alert.status === "unread";
  
  return (
    <div
      className={cn(
        "flex gap-3 p-3 rounded-lg transition-colors",
        isUnread ? "bg-white" : "bg-gray-50/50",
        compact ? "p-2" : "p-3"
      )}
      role="listitem"
      aria-label={`${alert.type} alert: ${alert.title}`}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 p-2 rounded-lg",
          colors.bg,
          colors.border,
          "border"
        )}
        aria-hidden="true"
      >
        <Icon className={cn("h-4 w-4", colors.icon)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-sm font-medium truncate",
                isUnread ? "text-gray-900" : "text-gray-600"
              )}
            >
              {alert.title}
            </p>
            <p
              className={cn(
                "text-xs mt-0.5",
                isUnread ? "text-gray-600" : "text-gray-500",
                compact ? "line-clamp-2" : "line-clamp-3"
              )}
            >
              {alert.message}
            </p>
          </div>

          {/* Unread indicator */}
          {isUnread && (
            <div
              className="flex-shrink-0 w-2 h-2 rounded-full bg-indigo-500 mt-1.5"
              aria-label="Unread"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-400">
            {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Action button */}
            {alert.actionUrl && alert.actionLabel && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs gap-1"
                onClick={() => onAction?.(alert.id)}
                aria-label={alert.actionLabel}
              >
                <ExternalLink className="h-3 w-3" />
                <span className="hidden sm:inline">{alert.actionLabel}</span>
              </Button>
            )}

            {/* Mark as read (only if unread) */}
            {isUnread && onMarkRead && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onMarkRead(alert.id)}
                aria-label="Mark as read"
              >
                <Check className="h-3 w-3 text-gray-500" />
              </Button>
            )}

            {/* Dismiss */}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => onDismiss(alert.id)}
                aria-label="Dismiss alert"
              >
                <X className="h-3 w-3 text-gray-400" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

