"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  Settings,
  MoreVertical,
  Trash2,
  Copy,
  Edit,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity,
  Zap,
  Bot,
  Workflow,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type {
  WorkflowStatus,
  WorkflowTriggerType,
} from "@/lib/orchestration/types";

// ============================================================================
// TYPES
// ============================================================================

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  category?: string;
  status: WorkflowStatus;
  triggerType: WorkflowTriggerType;
  stepCount: number;
  totalExecutions: number;
  successfulExecutions: number;
  lastExecutedAt?: Date;
  teamId?: string;
  teamName?: string;
}

interface WorkflowCardProps {
  workflow: Workflow;
  isSelected?: boolean;
  onSelect?: () => void;
  onRun?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onToggleStatus?: () => void;
  isRunning?: boolean;
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const statusConfig: Record<
  WorkflowStatus,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  active: {
    label: "Active",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  paused: {
    label: "Paused",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    icon: <Pause className="h-3 w-3" />,
  },
  draft: {
    label: "Draft",
    color: "text-gray-400",
    bgColor: "bg-gray-500/20",
    icon: <Clock className="h-3 w-3" />,
  },
  archived: {
    label: "Archived",
    color: "text-gray-500",
    bgColor: "bg-gray-600/20",
    icon: <AlertCircle className="h-3 w-3" />,
  },
};

const triggerConfig: Record<
  WorkflowTriggerType,
  { label: string; icon: React.ReactNode }
> = {
  manual: { label: "Manual", icon: <Play className="h-3 w-3" /> },
  event: { label: "Event", icon: <Zap className="h-3 w-3" /> },
  schedule: { label: "Schedule", icon: <Clock className="h-3 w-3" /> },
  agent_request: { label: "Agent", icon: <Bot className="h-3 w-3" /> },
};

// ============================================================================
// WORKFLOW CARD COMPONENT
// ============================================================================

export default function WorkflowCard({
  workflow,
  isSelected = false,
  onSelect,
  onRun,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  isRunning = false,
}: WorkflowCardProps) {
  const status = statusConfig[workflow.status];
  const trigger = triggerConfig[workflow.triggerType];
  const successRate =
    workflow.totalExecutions > 0
      ? Math.round(
          (workflow.successfulExecutions / workflow.totalExecutions) * 100
        )
      : 0;

  return (
    <Card
      className={cn(
        "p-4 transition-all cursor-pointer hover:border-white/20",
        isSelected
          ? "border-violet-500 bg-violet-500/5"
          : "border-white/10 bg-gray-900/50",
        "focus-within:ring-2 focus-within:ring-violet-500"
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onSelect?.()}
      aria-label={`Workflow: ${workflow.name}`}
      aria-selected={isSelected}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Icon and Title */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "p-2 rounded-lg shrink-0",
              workflow.status === "active"
                ? "bg-violet-500/20"
                : "bg-gray-700/50"
            )}
          >
            <Workflow
              className={cn(
                "h-5 w-5",
                workflow.status === "active" ? "text-violet-400" : "text-gray-400"
              )}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-white truncate">{workflow.name}</h3>
              <Badge
                className={cn(
                  "text-xs",
                  status.bgColor,
                  status.color,
                  "border-0"
                )}
              >
                <span className="mr-1">{status.icon}</span>
                {status.label}
              </Badge>
            </div>
            {workflow.description && (
              <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                {workflow.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {/* Trigger type */}
              <Badge
                variant="outline"
                className="text-xs border-gray-600 text-gray-400"
              >
                <span className="mr-1">{trigger.icon}</span>
                {trigger.label}
              </Badge>
              {/* Step count */}
              <span className="text-xs text-gray-500">
                {workflow.stepCount} step{workflow.stepCount !== 1 ? "s" : ""}
              </span>
              {/* Team */}
              {workflow.teamName && (
                <Badge
                  variant="outline"
                  className="text-xs border-blue-500/50 text-blue-400"
                >
                  {workflow.teamName}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {workflow.status === "active" && onRun && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRun();
              }}
              disabled={isRunning}
              className={cn(
                "h-8 w-8 p-0",
                isRunning
                  ? "text-violet-400 animate-pulse"
                  : "text-green-400 hover:bg-green-500/10"
              )}
              aria-label={isRunning ? "Running" : "Run workflow"}
            >
              {isRunning ? (
                <Activity className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
          )}
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="h-8 w-8 p-0 text-gray-400 hover:text-white"
              aria-label="Edit workflow"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="h-8 w-8 p-0 text-gray-400 hover:text-red-400"
              aria-label="Delete workflow"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-gray-500" />
          <span className="text-xs text-gray-400">
            {workflow.totalExecutions} run
            {workflow.totalExecutions !== 1 ? "s" : ""}
          </span>
        </div>
        {workflow.totalExecutions > 0 && (
          <div className="flex items-center gap-1.5">
            <CheckCircle2
              className={cn(
                "h-3.5 w-3.5",
                successRate >= 80
                  ? "text-green-400"
                  : successRate >= 50
                  ? "text-yellow-400"
                  : "text-red-400"
              )}
            />
            <span
              className={cn(
                "text-xs",
                successRate >= 80
                  ? "text-green-400"
                  : successRate >= 50
                  ? "text-yellow-400"
                  : "text-red-400"
              )}
            >
              {successRate}% success
            </span>
          </div>
        )}
        {workflow.lastExecutedAt && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-xs text-gray-400">
              {formatDistanceToNow(workflow.lastExecutedAt, { addSuffix: true })}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}

