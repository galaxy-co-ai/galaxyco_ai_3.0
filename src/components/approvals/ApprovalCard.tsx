"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Bot,
  Mail,
  FileText,
  Workflow,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

// ============================================================================
// TYPES
// ============================================================================

export type ApprovalType = "campaign" | "content" | "agent" | "workflow";
export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  entityId: string;
  entityName: string | null;
  status: ApprovalStatus;
  title: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  requestedAt: Date | string;
  respondedAt: Date | string | null;
  expiresAt: Date | string | null;
  requestedByFirstName: string | null;
  requestedByLastName: string | null;
  requestedByEmail: string | null;
}

interface ApprovalCardProps {
  approval: ApprovalRequest;
  onApprove?: (id: string, reason?: string) => Promise<void>;
  onReject?: (id: string, reason?: string) => Promise<void>;
  className?: string;
}

// ============================================================================
// HELPERS
// ============================================================================

const typeIcons: Record<ApprovalType, React.ElementType> = {
  campaign: Mail,
  content: FileText,
  agent: Bot,
  workflow: Workflow,
};

const typeColors: Record<ApprovalType, string> = {
  campaign: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  content: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  agent: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  workflow: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

const statusConfig: Record<ApprovalStatus, { icon: React.ElementType; color: string; label: string }> = {
  pending: {
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    label: "Pending",
  },
  approved: {
    icon: CheckCircle2,
    color: "text-emerald-600 dark:text-emerald-400",
    label: "Approved",
  },
  rejected: {
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    label: "Rejected",
  },
  expired: {
    icon: AlertCircle,
    color: "text-gray-500 dark:text-gray-400",
    label: "Expired",
  },
};

function formatRequestedBy(approval: ApprovalRequest): string {
  if (approval.requestedByFirstName && approval.requestedByLastName) {
    return `${approval.requestedByFirstName} ${approval.requestedByLastName}`;
  }
  return approval.requestedByEmail || "Unknown";
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ApprovalCard - Displays a single approval request with approve/reject actions
 *
 * Features:
 * - Type-specific icons and colors
 * - Status indicators
 * - Time remaining display
 * - Approve/Reject buttons with loading states
 * - Glass morphism styling consistent with GalaxyCo design
 */
export function ApprovalCard({
  approval,
  onApprove,
  onReject,
  className,
}: ApprovalCardProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TypeIcon = typeIcons[approval.type];
  const StatusConfig = statusConfig[approval.status];
  const StatusIcon = StatusConfig.icon;

  const isPending = approval.status === "pending";
  const isLoading = isApproving || isRejecting;

  const requestedAt = new Date(approval.requestedAt);
  const expiresAt = approval.expiresAt ? new Date(approval.expiresAt) : null;
  const isExpiringSoon = expiresAt && expiresAt.getTime() - Date.now() < 3600000; // 1 hour

  const handleApprove = async () => {
    if (!onApprove || isLoading) return;
    setError(null);
    setIsApproving(true);
    try {
      await onApprove(approval.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!onReject || isLoading) return;
    setError(null);
    setIsRejecting(true);
    try {
      await onReject(approval.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setIsRejecting(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border bg-card/50 backdrop-blur-sm p-4 shadow-sm transition-all hover:shadow-md",
        "dark:bg-card/30 dark:border-border/50",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Type Icon */}
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              typeColors[approval.type]
            )}
          >
            <TypeIcon className="h-5 w-5" />
          </div>

          {/* Title & Type */}
          <div>
            <h3 className="font-medium text-foreground line-clamp-1">
              {approval.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground capitalize">
                {approval.type}
              </span>
              {approval.entityName && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                    {approval.entityName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className={cn("flex items-center gap-1.5", StatusConfig.color)}>
          <StatusIcon className="h-4 w-4" />
          <span className="text-xs font-medium">{StatusConfig.label}</span>
        </div>
      </div>

      {/* Description */}
      {approval.description && (
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {approval.description}
        </p>
      )}

      {/* Metadata */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Requested by {formatRequestedBy(approval)}</span>
        <span>•</span>
        <span>{formatDistanceToNow(requestedAt, { addSuffix: true })}</span>
        {expiresAt && isPending && (
          <>
            <span>•</span>
            <span className={cn(isExpiringSoon && "text-amber-600 dark:text-amber-400")}>
              Expires {formatDistanceToNow(expiresAt, { addSuffix: true })}
            </span>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      {isPending && (onApprove || onReject) && (
        <div className="mt-4 flex items-center gap-2">
          {onApprove && (
            <button
              onClick={handleApprove}
              disabled={isLoading}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                "bg-emerald-600 text-white hover:bg-emerald-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isApproving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Approve
            </button>
          )}
          {onReject && (
            <button
              onClick={handleReject}
              disabled={isLoading}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                "bg-red-600 text-white hover:bg-red-700",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isRejecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Reject
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ApprovalCard;
