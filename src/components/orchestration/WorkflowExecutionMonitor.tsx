"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Bot,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import type {
  WorkflowExecution,
  StepResult,
  ExecutionStatus,
  StepStatus,
} from "@/lib/orchestration/types";

// ============================================================================
// TYPES
// ============================================================================

interface WorkflowExecutionMonitorProps {
  executionId: string;
  onClose?: () => void;
  onRetry?: (stepId: string) => void;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
}

interface StepInfo {
  id: string;
  name: string;
  agentId?: string;
  agentName?: string;
  status: StepStatus;
  result?: StepResult;
}

// ============================================================================
// STATUS CONFIG - Light Theme
// ============================================================================

const executionStatusConfig: Record<
  ExecutionStatus,
  { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }
> = {
  running: {
    label: "Running",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
  },
  completed: {
    label: "Completed",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  failed: {
    label: "Failed",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: <XCircle className="h-4 w-4" />,
  },
  paused: {
    label: "Paused",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    icon: <Pause className="h-4 w-4" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    icon: <XCircle className="h-4 w-4" />,
  },
};

const stepStatusConfig: Record<
  StepStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "text-gray-500",
    icon: <Clock className="h-3 w-3" />,
  },
  running: {
    label: "Running",
    color: "text-blue-600",
    icon: <Loader2 className="h-3 w-3 animate-spin" />,
  },
  completed: {
    label: "Completed",
    color: "text-green-600",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  failed: {
    label: "Failed",
    color: "text-red-600",
    icon: <XCircle className="h-3 w-3" />,
  },
  skipped: {
    label: "Skipped",
    color: "text-yellow-600",
    icon: <AlertTriangle className="h-3 w-3" />,
  },
};

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ============================================================================
// WORKFLOW EXECUTION MONITOR COMPONENT
// ============================================================================

export default function WorkflowExecutionMonitor({
  executionId,
  onClose,
  onRetry,
  onPause,
  onResume,
  onCancel,
}: WorkflowExecutionMonitorProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch execution data
  const {
    data,
    error,
    mutate,
    isLoading,
  } = useSWR<{
    execution: WorkflowExecution & {
      workflow: { name: string; steps: Array<{ id: string; name: string; agentId: string }> };
      agents: Array<{ id: string; name: string }>;
    };
  }>(`/api/orchestration/workflows/executions/${executionId}`, fetcher, {
    refreshInterval: 3000,
    revalidateOnFocus: true,
  });

  const execution = data?.execution;
  const workflow = execution?.workflow;
  const agentsById = Object.fromEntries(
    (data?.execution?.agents || []).map((a) => [a.id, a])
  );

  // Stop polling when execution is complete
  useEffect(() => {
    if (
      execution?.status === "completed" ||
      execution?.status === "failed" ||
      execution?.status === "cancelled"
    ) {
      mutate();
    }
  }, [execution?.status, mutate]);

  // Get step info with status
  const getSteps = useCallback((): StepInfo[] => {
    if (!workflow?.steps) return [];

    return workflow.steps.map((step) => {
      const result = execution?.stepResults?.[step.id];
      let status: StepStatus = "pending";

      if (result) {
        status = result.status;
      } else if (execution?.currentStepId === step.id) {
        status = "running";
      }

      return {
        id: step.id,
        name: step.name,
        agentId: step.agentId,
        agentName: agentsById[step.agentId]?.name,
        status,
        result,
      };
    });
  }, [workflow, execution, agentsById]);

  const steps = getSteps();

  // Toggle step expansion
  const toggleStep = useCallback((stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }, []);

  // Handle pause
  const handlePause = useCallback(async () => {
    if (!onPause) return;
    setIsActionLoading(true);
    try {
      await onPause();
      mutate();
      toast.success("Workflow paused");
    } catch {
      toast.error("Failed to pause workflow");
    } finally {
      setIsActionLoading(false);
    }
  }, [onPause, mutate]);

  // Handle resume
  const handleResume = useCallback(async () => {
    if (!onResume) return;
    setIsActionLoading(true);
    try {
      await onResume();
      mutate();
      toast.success("Workflow resumed");
    } catch {
      toast.error("Failed to resume workflow");
    } finally {
      setIsActionLoading(false);
    }
  }, [onResume, mutate]);

  // Handle cancel
  const handleCancel = useCallback(async () => {
    if (!onCancel) return;
    setIsActionLoading(true);
    try {
      await onCancel();
      mutate();
      toast.success("Workflow cancelled");
    } catch {
      toast.error("Failed to cancel workflow");
    } finally {
      setIsActionLoading(false);
    }
  }, [onCancel, mutate]);

  // Handle retry step
  const handleRetryStep = useCallback(
    async (stepId: string) => {
      if (!onRetry) return;
      setIsActionLoading(true);
      try {
        await onRetry(stepId);
        mutate();
        toast.success("Retrying step");
      } catch {
        toast.error("Failed to retry step");
      } finally {
        setIsActionLoading(false);
      }
    },
    [onRetry, mutate]
  );

  // Loading state
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Card>
    );
  }

  // Error state
  if (error || !execution) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-medium mb-2">Execution Not Found</h3>
          <p className="text-muted-foreground text-sm">
            Unable to load execution details
          </p>
          {onClose && (
            <Button
              variant="outline"
              onClick={onClose}
              className="mt-4"
            >
              Close
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const statusInfo = executionStatusConfig[execution.status];
  const progress =
    execution.totalSteps > 0
      ? Math.round((execution.completedSteps / execution.totalSteps) * 100)
      : 0;

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">
                {workflow?.name || "Workflow Execution"}
              </h3>
              <Badge className={cn(statusInfo.bgColor, statusInfo.color, "border", statusInfo.borderColor)}>
                <span className="mr-1">{statusInfo.icon}</span>
                {statusInfo.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Started{" "}
              {formatDistanceToNow(new Date(execution.startedAt), {
                addSuffix: true,
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {execution.status === "running" && onPause && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePause}
                disabled={isActionLoading}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                aria-label="Pause workflow"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            )}
            {execution.status === "paused" && onResume && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResume}
                disabled={isActionLoading}
                className="border-green-300 text-green-700 hover:bg-green-50"
                aria-label="Resume workflow"
              >
                <Play className="h-4 w-4 mr-1" />
                Resume
              </Button>
            )}
            {(execution.status === "running" || execution.status === "paused") &&
              onCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isActionLoading}
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  aria-label="Cancel workflow"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => mutate()}
              aria-label="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span>
              {execution.completedSteps}/{execution.totalSteps} steps
            </span>
          </div>
          <Progress
            value={progress}
            className="h-2"
            aria-label="Workflow progress"
          />
        </div>

        {/* Duration */}
        {execution.durationMs && (
          <p className="text-xs text-muted-foreground mt-2">
            Duration: {Math.round(execution.durationMs / 1000)}s
          </p>
        )}
      </div>

      {/* Steps */}
      <div className="p-4">
        <h4 className="font-medium mb-3">Steps</h4>
        <div className="space-y-2">
          {steps.map((step, index) => {
            const stepStatus = stepStatusConfig[step.status];
            const isExpanded = expandedSteps.has(step.id);
            const canRetry =
              step.status === "failed" &&
              onRetry &&
              (execution.status === "failed" || execution.status === "paused");

            return (
              <div key={step.id}>
                <div
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    step.status === "running"
                      ? "border-blue-200 bg-blue-50/50"
                      : step.status === "completed"
                      ? "border-green-200 bg-green-50/50"
                      : step.status === "failed"
                      ? "border-red-200 bg-red-50/50"
                      : "border bg-gray-50/50"
                  )}
                >
                  {/* Step number */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium shrink-0",
                      step.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : step.status === "running"
                        ? "bg-blue-100 text-blue-700"
                        : step.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : step.status === "running" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : step.status === "failed" ? (
                      <XCircle className="h-3 w-3" />
                    ) : (
                      index + 1
                    )}
                  </div>

                  {/* Step info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {step.name}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn("text-xs shrink-0", stepStatus.color)}
                      >
                        {stepStatus.icon}
                        <span className="ml-1">{stepStatus.label}</span>
                      </Badge>
                    </div>
                    {step.agentName && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Bot className="h-3 w-3" />
                        {step.agentName}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {canRetry && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetryStep(step.id)}
                        disabled={isActionLoading}
                        className="h-7 w-7 p-0 text-yellow-600 hover:bg-yellow-50"
                        aria-label="Retry step"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                    {step.result && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStep(step.id)}
                        className="h-7 w-7 p-0"
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Step details (expanded) */}
                {isExpanded && step.result && (
                  <div className="ml-9 mt-2 p-3 rounded-lg bg-gray-50 border">
                    {step.result.startedAt && (
                      <p className="text-xs text-muted-foreground">
                        Started:{" "}
                        {format(new Date(step.result.startedAt), "HH:mm:ss")}
                      </p>
                    )}
                    {step.result.completedAt && (
                      <p className="text-xs text-muted-foreground">
                        Completed:{" "}
                        {format(new Date(step.result.completedAt), "HH:mm:ss")}
                      </p>
                    )}
                    {step.result.durationMs !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        Duration: {step.result.durationMs}ms
                      </p>
                    )}
                    {step.result.error && (
                      <div className="mt-2 p-2 rounded bg-red-50 border border-red-200">
                        <p className="text-xs text-red-700 font-medium">
                          Error:
                        </p>
                        <p className="text-xs text-red-600 mt-1">
                          {step.result.error}
                        </p>
                      </div>
                    )}
                    {step.result.output !== null && step.result.output !== undefined ? (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground font-medium mb-1">
                          Output:
                        </p>
                        <pre className="text-xs bg-white p-2 rounded overflow-x-auto border">
                          {typeof step.result.output === "string"
                            ? step.result.output
                            : JSON.stringify(step.result.output, null, 2)}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Arrow to next step */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {execution.error && (
        <div className="p-4 border-t bg-red-50">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">
                Execution Error
              </p>
              <p className="text-sm text-red-600 mt-1">
                {execution.error.message}
              </p>
              {execution.error.step && (
                <p className="text-xs text-red-500 mt-1">
                  Failed at step: {execution.error.step}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
