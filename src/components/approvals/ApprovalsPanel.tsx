"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Inbox, RefreshCw } from "lucide-react";
import useSWR from "swr";
import { ApprovalCard, type ApprovalRequest, type ApprovalStatus, type ApprovalType } from "./ApprovalCard";

// ============================================================================
// TYPES
// ============================================================================

interface ApprovalsPanelProps {
  /** Optional className for the container */
  className?: string;
  /** Filter by status (default: pending) */
  status?: ApprovalStatus | "all";
  /** Filter by type */
  type?: ApprovalType;
  /** Maximum number of items to show */
  limit?: number;
  /** Title for the panel */
  title?: string;
  /** Show refresh button */
  showRefresh?: boolean;
}

interface ApprovalsResponse {
  approvals: ApprovalRequest[];
  count: number;
}

// ============================================================================
// FETCHER
// ============================================================================

const fetcher = async (url: string): Promise<ApprovalsResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch approvals");
  }
  return response.json();
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ApprovalsPanel - Displays a list of approval requests
 *
 * Features:
 * - Filterable by status and type
 * - Approve/Reject actions with optimistic updates
 * - Loading and empty states
 * - Auto-refresh via SWR
 * - Glass morphism styling
 */
export function ApprovalsPanel({
  className,
  status = "pending",
  type,
  limit = 50,
  title = "Pending Approvals",
  showRefresh = true,
}: ApprovalsPanelProps) {
  // Build URL with query params
  const url = new URL("/api/approvals", window.location.origin);
  url.searchParams.set("status", status);
  url.searchParams.set("limit", String(limit));
  if (type) {
    url.searchParams.set("type", type);
  }

  const { data, error, isLoading, mutate } = useSWR<ApprovalsResponse>(
    url.toString(),
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  // Handle approve action
  const handleApprove = useCallback(
    async (id: string, reason?: string) => {
      // Optimistic update - remove from list
      if (data) {
        mutate(
          {
            ...data,
            approvals: data.approvals.filter((a) => a.id !== id),
            count: data.count - 1,
          },
          false
        );
      }

      const response = await fetch(`/api/approvals/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        // Revert on error
        mutate();
        const error = await response.json();
        throw new Error(error.error || "Failed to approve");
      }

      // Revalidate to ensure consistency
      mutate();
    },
    [data, mutate]
  );

  // Handle reject action
  const handleReject = useCallback(
    async (id: string, reason?: string) => {
      // Optimistic update - remove from list
      if (data) {
        mutate(
          {
            ...data,
            approvals: data.approvals.filter((a) => a.id !== id),
            count: data.count - 1,
          },
          false
        );
      }

      const response = await fetch(`/api/approvals/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        // Revert on error
        mutate();
        const error = await response.json();
        throw new Error(error.error || "Failed to reject");
      }

      // Revalidate to ensure consistency
      mutate();
    },
    [data, mutate]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          {showRefresh && (
            <button
              onClick={() => mutate()}
              className="flex items-center gap-1.5 px-2 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          )}
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-red-600 dark:text-red-400">
            Failed to load approvals
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  const approvals = data?.approvals || [];

  // Empty state
  if (approvals.length === 0) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          {showRefresh && (
            <button
              onClick={() => mutate()}
              className="flex items-center gap-1.5 px-2 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          )}
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">
            No pending approvals
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            All caught up! Check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {title}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({approvals.length})
          </span>
        </h2>
        {showRefresh && (
          <button
            onClick={() => mutate()}
            className="flex items-center gap-1.5 px-2 py-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        )}
      </div>

      {/* Approvals List */}
      <div className="flex flex-col gap-3">
        {approvals.map((approval) => (
          <ApprovalCard
            key={approval.id}
            approval={approval}
            onApprove={status === "pending" ? handleApprove : undefined}
            onReject={status === "pending" ? handleReject : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export default ApprovalsPanel;
