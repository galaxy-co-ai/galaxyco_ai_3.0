"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check,
  X,
  Clock,
  AlertTriangle,
  AlertCircle,
  Shield,
  ShieldAlert,
  ShieldX,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  Filter,
  Bot,
  Users,
  RefreshCw,
  CheckSquare,
  Square,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import type {
  ActionRiskLevel,
  ApprovalStatus,
  PendingAction,
} from "@/lib/orchestration/types";

// ============================================================================
// TYPES
// ============================================================================

interface ApprovalQueueProps {
  teamId?: string;
  onApprovalProcessed?: () => void;
}

interface ApprovalResponse {
  actions: PendingAction[];
  total: number;
  pendingCount: number;
}

// ============================================================================
// RISK LEVEL CONFIG - Light Theme
// ============================================================================

const riskLevelConfig: Record<
  ActionRiskLevel,
  { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }
> = {
  low: {
    label: "Low Risk",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  medium: {
    label: "Medium Risk",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    icon: <Shield className="h-4 w-4" />,
  },
  high: {
    label: "High Risk",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  critical: {
    label: "Critical",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: <ShieldX className="h-4 w-4" />,
  },
};

const statusConfig: Record<
  ApprovalStatus,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  pending: {
    label: "Pending",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
  approved: {
    label: "Approved",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  rejected: {
    label: "Rejected",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  expired: {
    label: "Expired",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
  auto_approved: {
    label: "Auto Approved",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
};

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ============================================================================
// APPROVAL QUEUE COMPONENT
// ============================================================================

export default function ApprovalQueue({
  teamId,
  onApprovalProcessed,
}: ApprovalQueueProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | "all">("pending");
  const [riskFilter, setRiskFilter] = useState<ActionRiskLevel | "all">("all");
  const [reviewNotes, setReviewNotes] = useState("");

  // Build query URL
  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (teamId) params.set("teamId", teamId);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (riskFilter !== "all") params.set("riskLevel", riskFilter);
    return `/api/orchestration/approvals?${params.toString()}`;
  }, [teamId, statusFilter, riskFilter]);

  // Fetch pending actions
  const { data, error, mutate, isLoading } = useSWR<ApprovalResponse>(
    queryUrl,
    fetcher,
    {
      refreshInterval: 10000,
      revalidateOnFocus: true,
    }
  );

  const actions = data?.actions || [];
  const pendingCount = data?.pendingCount || 0;

  // Filter by search query
  const filteredActions = useMemo(() => {
    if (!searchQuery) return actions;
    const query = searchQuery.toLowerCase();
    return actions.filter(
      (action) =>
        action.actionType.toLowerCase().includes(query) ||
        action.description.toLowerCase().includes(query) ||
        action.agentName?.toLowerCase().includes(query) ||
        action.teamName?.toLowerCase().includes(query)
    );
  }, [actions, searchQuery]);

  // Toggle selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Select all / none
  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredActions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredActions.map((a) => a.id)));
    }
  }, [selectedIds.size, filteredActions]);

  // Toggle expansion
  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Process single approval
  const processApproval = useCallback(
    async (actionId: string, approved: boolean) => {
      setIsProcessing(true);
      try {
        const response = await fetch(`/api/orchestration/approvals/${actionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved, reviewNotes }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to process approval");
        }

        toast.success(approved ? "Action approved" : "Action rejected");
        mutate();
        onApprovalProcessed?.();
        setReviewNotes("");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to process approval"
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [reviewNotes, mutate, onApprovalProcessed]
  );

  // Process bulk approval
  const processBulkApproval = useCallback(
    async (approved: boolean) => {
      if (selectedIds.size === 0) {
        toast.error("No actions selected");
        return;
      }

      setIsProcessing(true);
      try {
        const response = await fetch("/api/orchestration/approvals/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            actionIds: Array.from(selectedIds),
            approved,
            reviewNotes,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to process bulk approval");
        }

        const result = await response.json();
        toast.success(result.message);
        setSelectedIds(new Set());
        setReviewNotes("");
        mutate();
        onApprovalProcessed?.();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to process bulk approval"
        );
      } finally {
        setIsProcessing(false);
      }
    },
    [selectedIds, reviewNotes, mutate, onApprovalProcessed]
  );

  // Calculate time until expiration
  const getExpirationText = useCallback((expiresAt?: Date) => {
    if (!expiresAt) return null;
    const expires = new Date(expiresAt);
    const now = new Date();
    if (expires < now) return "Expired";
    return `Expires ${formatDistanceToNow(expires, { addSuffix: true })}`;
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-64" />
          </div>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-medium mb-2">Failed to Load Approvals</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Unable to fetch pending approvals
          </p>
          <Button
            variant="outline"
            onClick={() => mutate()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Approval Queue
            {pendingCount > 0 && (
              <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200">
                {pendingCount} pending
              </Badge>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Review and process pending autonomous actions
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => mutate()}
          aria-label="Refresh approvals"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action, description, or agent..."
              className="pl-10"
              aria-label="Search approvals"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ApprovalStatus | "all")}
              className="px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as ActionRiskLevel | "all")}
            className="px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            aria-label="Filter by risk level"
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </Card>

      {/* Bulk Actions */}
      {statusFilter === "pending" && filteredActions.length > 0 && (
        <Card className="p-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Select All */}
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label={selectedIds.size === filteredActions.length ? "Deselect all" : "Select all"}
            >
              {selectedIds.size === 0 ? (
                <Square className="h-4 w-4" />
              ) : selectedIds.size === filteredActions.length ? (
                <CheckSquare className="h-4 w-4 text-violet-600" />
              ) : (
                <Minus className="h-4 w-4 text-violet-600" />
              )}
              {selectedIds.size === filteredActions.length
                ? "Deselect All"
                : `Select All (${filteredActions.length})`}
            </button>

            {selectedIds.size > 0 && (
              <>
                <div className="hidden sm:block h-4 w-px bg-border" />
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} selected
                </span>
                <div className="flex-1" />

                {/* Review Notes */}
                <Input
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Review notes (optional)"
                  className="w-full sm:w-48 text-sm"
                  aria-label="Review notes"
                />

                {/* Bulk Approve */}
                <Button
                  size="sm"
                  onClick={() => processBulkApproval(true)}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  aria-label="Approve selected"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Approve ({selectedIds.size})
                </Button>

                {/* Bulk Reject */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => processBulkApproval(false)}
                  disabled={isProcessing}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  aria-label="Reject selected"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <X className="h-4 w-4 mr-1" />
                  )}
                  Reject ({selectedIds.size})
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      {/* Actions List */}
      {filteredActions.length === 0 ? (
        <Card className="p-8 text-center">
          <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">
            {statusFilter === "pending"
              ? "No Pending Approvals"
              : "No Matching Actions"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {statusFilter === "pending"
              ? "All actions have been processed"
              : "Try adjusting your filters"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredActions.map((action) => {
            const riskConfig = riskLevelConfig[action.riskLevel];
            const status = statusConfig[action.status];
            const isExpanded = expandedIds.has(action.id);
            const isSelected = selectedIds.has(action.id);
            const isPending = action.status === "pending";
            const expirationText = getExpirationText(action.expiresAt);

            return (
              <Card
                key={action.id}
                className={cn(
                  "overflow-hidden transition-all",
                  isSelected && "ring-1 ring-violet-300"
                )}
              >
                {/* Action Header */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    {/* Selection Checkbox (only for pending) */}
                    {isPending && (
                      <button
                        onClick={() => toggleSelection(action.id)}
                        className="mt-0.5 shrink-0"
                        aria-label={isSelected ? "Deselect action" : "Select action"}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-violet-600" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                        )}
                      </button>
                    )}

                    {/* Risk Level Icon */}
                    <div
                      className={cn(
                        "p-2 rounded-lg shrink-0",
                        riskConfig.bgColor
                      )}
                    >
                      <span className={riskConfig.color}>{riskConfig.icon}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium truncate">
                          {action.actionType}
                        </span>
                        <Badge
                          className={cn(
                            riskConfig.bgColor,
                            riskConfig.color,
                            "border",
                            riskConfig.borderColor,
                            "text-xs"
                          )}
                        >
                          {riskConfig.label}
                        </Badge>
                        <Badge
                          className={cn(
                            status.bgColor,
                            status.color,
                            "border",
                            status.borderColor,
                            "text-xs"
                          )}
                        >
                          {status.label}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {action.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {action.agentName && (
                          <span className="flex items-center gap-1">
                            <Bot className="h-3 w-3" />
                            {action.agentName}
                          </span>
                        )}
                        {action.teamName && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {action.teamName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(action.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                        {expirationText && isPending && (
                          <span
                            className={cn(
                              "flex items-center gap-1",
                              expirationText === "Expired"
                                ? "text-red-600"
                                : "text-yellow-600"
                            )}
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {expirationText}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => processApproval(action.id, true)}
                            disabled={isProcessing}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            aria-label="Approve action"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => processApproval(action.id, false)}
                            disabled={isProcessing}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            aria-label="Reject action"
                          >
                            {isProcessing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <X className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleExpand(action.id)}
                        aria-label={isExpanded ? "Collapse details" : "Expand details"}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t pt-3 mt-2">
                    {/* Risk Reasons */}
                    {action.riskReasons && action.riskReasons.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Risk Factors:
                        </p>
                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-0.5">
                          {action.riskReasons.map((reason, i) => (
                            <li key={i}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Data */}
                    {action.actionData &&
                      Object.keys(action.actionData).length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Action Data:
                          </p>
                          <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto max-h-32 border">
                            {JSON.stringify(action.actionData, null, 2)}
                          </pre>
                        </div>
                      )}

                    {/* Review Info (for processed actions) */}
                    {action.reviewedBy && (
                      <div className="text-xs text-muted-foreground">
                        <p>
                          Reviewed by: {action.reviewerName || action.reviewedBy}
                        </p>
                        {action.reviewedAt && (
                          <p>
                            Reviewed at:{" "}
                            {format(new Date(action.reviewedAt), "PPp")}
                          </p>
                        )}
                        {action.reviewNotes && (
                          <p className="mt-1">Notes: {action.reviewNotes}</p>
                        )}
                      </div>
                    )}

                    {/* Quick Review Notes Input (for pending) */}
                    {isPending && !selectedIds.has(action.id) && (
                      <div className="mt-3 flex items-center gap-2">
                        <Input
                          placeholder="Add review notes..."
                          className="flex-1 h-8 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const value = e.currentTarget.value;
                              setReviewNotes(value);
                              processApproval(action.id, true);
                            }
                          }}
                          aria-label="Review notes for this action"
                        />
                        <span className="text-xs text-muted-foreground">
                          Press Enter to approve with notes
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
