"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR, { mutate } from "swr";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AlertBadgeList } from "./AlertBadgeList";
import { NeptuneButton } from "@/components/ui/neptune-button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import type { AlertBadge } from "@/db/schema";

// Fetcher for SWR
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch alerts");
  }
  return res.json();
};

interface AlertBadgePopoverProps {
  className?: string;
}

/**
 * AlertBadgePopover - Bell icon button with alert dropdown
 * 
 * Displays a bell icon with unread count badge. Clicking opens
 * a popover showing recent alerts with mark as read and dismiss actions.
 * 
 * Features:
 * - Unread count badge on bell icon
 * - SWR for data fetching with auto-revalidation
 * - Mark all as read action
 * - Individual alert actions (mark read, dismiss, action)
 * - Accessible with ARIA labels and keyboard navigation
 */
export function AlertBadgePopover({ className }: AlertBadgePopoverProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch unread alerts
  const { data, error, isLoading: isFetching } = useSWR<{ alerts: AlertBadge[]; unreadCount: number }>(
    "/api/admin/alert-badges?status=unread&limit=10",
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  // Memoize alerts array to prevent useCallback deps from changing on every render
  const alerts = useMemo(() => data?.alerts ?? [], [data?.alerts]);
  const unreadCount = data?.unreadCount ?? 0;

  /**
   * Mark a single alert as read
   */
  const handleMarkRead = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/alert-badges/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "read" }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark alert as read");
      }

      // Revalidate the alerts list
      await mutate("/api/admin/alert-badges?status=unread&limit=10");
    } catch (err) {
      logger.error("Failed to mark alert as read", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Dismiss a single alert
   */
  const handleDismiss = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/alert-badges/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      });

      if (!response.ok) {
        throw new Error("Failed to dismiss alert");
      }

      // Revalidate the alerts list
      await mutate("/api/admin/alert-badges?status=unread&limit=10");
    } catch (err) {
      logger.error("Failed to dismiss alert", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Handle action click - navigate to action URL and mark as actioned
   */
  const handleAction = useCallback(async (id: string) => {
    const alert = alerts.find((a) => a.id === id);
    if (!alert?.actionUrl) return;

    try {
      setIsLoading(true);
      // Mark as actioned
      await fetch(`/api/admin/alert-badges/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "actioned" }),
      });

      // Navigate to action URL
      window.location.href = alert.actionUrl;
    } catch (err) {
      logger.error("Failed to process action", err);
    } finally {
      setIsLoading(false);
    }
  }, [alerts]);

  /**
   * Mark all alerts as read
   */
  const handleMarkAllRead = useCallback(async () => {
    if (alerts.length === 0) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/alert-badges/bulk-dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alertIds: alerts.map((a) => a.id),
          action: "read",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to mark all as read");
      }

      // Revalidate the alerts list
      await mutate("/api/admin/alert-badges?status=unread&limit=10");
    } catch (err) {
      logger.error("Failed to mark all alerts as read", err);
    } finally {
      setIsLoading(false);
    }
  }, [alerts]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <NeptuneButton
          size="icon"
          className={cn("relative", className)}
          aria-label={`Alerts ${unreadCount > 0 ? `(${unreadCount} unread)` : ""}`}
          aria-haspopup="true"
          aria-expanded={open}
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          
          {/* Unread count badge */}
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white"
              aria-hidden="true"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </NeptuneButton>
      </PopoverTrigger>

      <PopoverContent
        className="w-80 p-0"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-medium text-sm text-gray-900">
            Alerts
            {unreadCount > 0 && (
              <span className="ml-2 text-xs text-gray-500">
                ({unreadCount} unread)
              </span>
            )}
          </h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAllRead}
              disabled={isLoading}
            >
              Mark all read
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {isFetching && alerts.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-sm text-red-500">Failed to load alerts</p>
            </div>
          ) : (
            <AlertBadgeList
              alerts={alerts}
              onMarkRead={handleMarkRead}
              onDismiss={handleDismiss}
              onAction={handleAction}
              compact
            />
          )}
        </div>

        {/* Footer */}
        {alerts.length > 0 && (
          <div className="border-t px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center text-xs text-gray-500 hover:text-gray-700"
              onClick={() => {
                setOpen(false);
                window.location.href = "/admin/content";
              }}
            >
              View all in Content Cockpit
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

