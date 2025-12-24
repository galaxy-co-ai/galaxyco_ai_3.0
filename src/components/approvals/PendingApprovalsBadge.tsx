"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import useSWR from "swr";

// ============================================================================
// TYPES
// ============================================================================

interface PendingApprovalsBadgeProps {
  /** Optional className for the container */
  className?: string;
  /** Whether to show the icon */
  showIcon?: boolean;
  /** Whether to show as compact (just the number) */
  compact?: boolean;
  /** Callback when badge is clicked */
  onClick?: () => void;
  /** Polling interval in milliseconds (default: 30000) */
  refreshInterval?: number;
}

interface ApprovalsResponse {
  approvals: Array<{ id: string }>;
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
 * PendingApprovalsBadge - Shows count of pending approvals
 *
 * Features:
 * - Real-time count via SWR polling
 * - Animated appearance when count > 0
 * - Compact mode for sidebar integration
 * - Glass morphism styling
 */
export function PendingApprovalsBadge({
  className,
  showIcon = true,
  compact = false,
  onClick,
  refreshInterval = 30000,
}: PendingApprovalsBadgeProps) {
  const [mounted, setMounted] = useState(false);

  // Fetch pending approvals count
  const { data, error, isLoading } = useSWR<ApprovalsResponse>(
    "/api/approvals?status=pending&limit=100",
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything during SSR or while loading initially
  if (!mounted || isLoading) {
    return null;
  }

  // Don't show badge if there's an error or no pending approvals
  if (error || !data || data.count === 0) {
    return null;
  }

  const count = data.count;

  // Compact mode - just the number in a small badge
  if (compact) {
    return (
      <span
        onClick={onClick}
        className={cn(
          "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1",
          "text-[10px] font-semibold text-white",
          "bg-amber-500 rounded-full",
          "animate-in fade-in zoom-in duration-200",
          onClick && "cursor-pointer hover:bg-amber-600 transition-colors",
          className
        )}
      >
        {count > 99 ? "99+" : count}
      </span>
    );
  }

  // Full mode - icon with badge
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-1.5 px-2.5 py-1.5",
        "text-sm font-medium text-foreground",
        "bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg",
        "hover:bg-accent transition-colors",
        "animate-in fade-in zoom-in duration-200",
        className
      )}
    >
      {showIcon && <Bell className="h-4 w-4" />}
      <span>Approvals</span>
      <span
        className={cn(
          "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5",
          "text-xs font-semibold text-white",
          "bg-amber-500 rounded-full"
        )}
      >
        {count > 99 ? "99+" : count}
      </span>
    </button>
  );
}

export default PendingApprovalsBadge;
