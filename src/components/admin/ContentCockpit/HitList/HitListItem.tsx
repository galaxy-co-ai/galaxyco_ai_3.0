"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GripVertical,
  MoreVertical,
  Pencil,
  Trash2,
  Archive,
  Play,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  User,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NeptuneButton } from "@/components/ui/neptune-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PriorityScoreBreakdown } from "./PriorityScoreBreakdown";
import type {
  TopicIdea,
  TopicIdeaStatus,
  HitListDifficulty,
} from "@/db/schema";

// Derive TaskPriority type from the enum values
type TaskPriority = "low" | "medium" | "high" | "urgent";

interface HitListItemProps {
  item: TopicIdea & {
    assignedUser?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    } | null;
  };
  onEdit?: (item: TopicIdea) => void;
  onDelete?: (itemId: string) => void;
  onStatusChange?: (itemId: string, status: TopicIdeaStatus) => void;
  onStartWriting?: (item: TopicIdea) => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isLoading?: boolean;
}

const priorityConfig: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  low: {
    label: "Low",
    className: "bg-gray-100 text-gray-600 border-gray-200",
  },
  medium: {
    label: "Medium",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  high: {
    label: "High",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  urgent: {
    label: "Urgent",
    className: "bg-red-100 text-red-700 border-red-200",
  },
};

const difficultyConfig: Record<
  HitListDifficulty,
  { label: string; className: string }
> = {
  easy: {
    label: "Easy",
    className: "bg-emerald-100 text-emerald-700",
  },
  medium: {
    label: "Medium",
    className: "bg-blue-100 text-blue-700",
  },
  hard: {
    label: "Hard",
    className: "bg-amber-100 text-amber-700",
  },
};

const statusConfig: Record<TopicIdeaStatus, { label: string; className: string }> = {
  saved: {
    label: "Queued",
    className: "bg-indigo-100 text-indigo-700",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-amber-100 text-amber-700",
  },
  published: {
    label: "Published",
    className: "bg-emerald-100 text-emerald-700",
  },
  archived: {
    label: "Archived",
    className: "bg-gray-100 text-gray-500",
  },
};

function getScoreColor(score: number | null): string {
  if (score === null) return "text-gray-400";
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-blue-600";
  if (score >= 40) return "text-amber-600";
  return "text-gray-500";
}

function getScoreBgColor(score: number | null): string {
  if (score === null) return "bg-gray-100";
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-gray-400";
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "No date";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(minutes: number | null | undefined): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function HitListItem({
  item,
  onEdit,
  onDelete,
  onStatusChange,
  onStartWriting,
  isDragging = false,
  dragHandleProps,
  isLoading = false,
}: HitListItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const priority = priorityConfig[item.priority || "medium"];
  const difficulty = item.difficultyLevel
    ? difficultyConfig[item.difficultyLevel]
    : null;
  const status = statusConfig[item.status];

  const assignedUserName = item.assignedUser
    ? `${item.assignedUser.firstName || ""} ${item.assignedUser.lastName || ""}`.trim() ||
      item.assignedUser.email
    : null;

  // Calculate wizard progress percentage - prefer stored percentage, fallback to step count
  const progressPercentage =
    item.wizardProgress?.percentage ??
    (item.wizardProgress?.completedSteps &&
    item.wizardProgress.completedSteps.length > 0
      ? Math.round(
          (item.wizardProgress.completedSteps.length / 8) * 100 // 8 wizard stages
        )
      : 0);

  // Check if writing has started (for "Resume Writing" vs "Start Writing")
  const hasProgress = progressPercentage > 0;
  
  // Check if this item has a published article
  const hasPublishedArticle = item.status === "published" && item.resultingPostId;
  
  // Get current step label for display
  const currentStepLabel = item.wizardProgress?.currentStep
    ? item.wizardProgress.currentStep
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
    : null;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl bg-white",
        "shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200",
        "hover:-translate-y-px hover:shadow-lg active:shadow-sm",
        "transition-all duration-200 ease-out",
        isDragging && "shadow-xl ring-2 ring-indigo-500 opacity-90",
        isLoading && "opacity-60 pointer-events-none"
      )}
      role="listitem"
      aria-label={`Topic: ${item.title}`}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Drag Handle */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="flex-shrink-0 mt-1 cursor-grab active:cursor-grabbing touch-none"
            aria-label="Drag to reorder"
          >
            <GripVertical
              className="h-5 w-5 text-gray-400 hover:text-gray-600"
              aria-hidden="true"
            />
          </div>
        )}

        {/* Priority Score Badge */}
        <div
          className="flex-shrink-0 w-12 text-center cursor-pointer"
          onClick={() => setShowBreakdown(!showBreakdown)}
          role="button"
          aria-expanded={showBreakdown}
          aria-label="Toggle priority score breakdown"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setShowBreakdown(!showBreakdown)}
        >
          <div
            className={cn(
              "inline-flex items-center justify-center w-12 h-12 rounded-lg font-bold text-lg",
              item.priorityScore !== null
                ? `${getScoreBgColor(item.priorityScore)} text-white`
                : "bg-gray-100 text-gray-400"
            )}
          >
            {item.priorityScore ?? "—"}
          </div>
          <div className="text-xs text-gray-500 mt-1">Score</div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Status */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 line-clamp-2 pr-2">
                {item.title}
              </h3>
              {item.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {item.description}
                </p>
              )}
            </div>

            {/* Actions Menu - Desktop */}
            <div className="flex-shrink-0 hidden sm:block">
              <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
                <DropdownMenuTrigger asChild>
                  <NeptuneButton
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Item options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </NeptuneButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onStartWriting && item.status !== "published" && (
                    <DropdownMenuItem
                      onClick={() => {
                        setShowMenu(false);
                        onStartWriting(item);
                      }}
                    >
                      {hasProgress ? (
                        <>
                          <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
                          Resume Writing
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" aria-hidden="true" />
                          Start Writing
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  {hasPublishedArticle && (
                    <DropdownMenuItem asChild>
                      <Link href={`/admin/content/${item.resultingPostId}`}>
                        <ExternalLink className="h-4 w-4 mr-2" aria-hidden="true" />
                        View Published Article
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem
                      onClick={() => {
                        setShowMenu(false);
                        onEdit(item);
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-2" aria-hidden="true" />
                      Edit Topic
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  {onStatusChange && item.status !== "archived" && (
                    <DropdownMenuItem
                      onClick={() => {
                        setShowMenu(false);
                        onStatusChange(item.id, "archived");
                      }}
                    >
                      <Archive className="h-4 w-4 mr-2" aria-hidden="true" />
                      Archive
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      onClick={() => {
                        setShowMenu(false);
                        onDelete(item.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                      Remove from List
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                status.className
              )}
            >
              {status.label}
            </span>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
                priority.className
              )}
            >
              {priority.label}
            </span>
            {difficulty && (
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                  difficulty.className
                )}
              >
                {difficulty.label}
              </span>
            )}
            {item.category && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                {item.category}
              </span>
            )}
          </div>

          {/* Progress Bar (if writing started) */}
          {progressPercentage > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">
                  {currentStepLabel || "Writing Progress"}
                </span>
                <span className={cn(
                  "font-medium",
                  progressPercentage === 100 ? "text-emerald-600" : "text-indigo-600"
                )}>
                  {progressPercentage}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    progressPercentage === 100 ? "bg-emerald-500" : "bg-indigo-500"
                  )}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Published Article Link */}
          {hasPublishedArticle && (
            <div className="mb-3">
              <Link
                href={`/admin/content/${item.resultingPostId}`}
                className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                View Published Article
              </Link>
            </div>
          )}

          {/* Meta Info Row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {item.targetPublishDate && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                Target: {formatDate(item.targetPublishDate)}
              </span>
            )}
            {item.estimatedTimeMinutes && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Est: {formatTime(item.estimatedTimeMinutes)}
              </span>
            )}
            {assignedUserName && (
              <span className="inline-flex items-center gap-1">
                <User className="h-3.5 w-3.5" aria-hidden="true" />
                {assignedUserName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Actions */}
      <div className="flex sm:hidden items-center justify-between px-4 pb-3 gap-2">
        {onStartWriting && item.status !== "published" && (
          <NeptuneButton
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={() => onStartWriting(item)}
            aria-label={hasProgress ? `Resume writing ${item.title}` : `Start writing ${item.title}`}
          >
            {hasProgress ? (
              <>
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Resume Writing
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" aria-hidden="true" />
                Start Writing
              </>
            )}
          </NeptuneButton>
        )}
        {hasPublishedArticle && (
          <NeptuneButton
            variant="default"
            size="sm"
            className="flex-1"
            asChild
          >
            <Link href={`/admin/content/${item.resultingPostId}`}>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              View Article
            </Link>
          </NeptuneButton>
        )}
        <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
          <DropdownMenuTrigger asChild>
            <NeptuneButton
              variant="ghost"
              size="sm"
              aria-label="Item options"
            >
              <MoreVertical className="h-4 w-4" />
            </NeptuneButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onEdit && (
              <DropdownMenuItem
                onClick={() => {
                  setShowMenu(false);
                  onEdit(item);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" aria-hidden="true" />
                Edit Topic
              </DropdownMenuItem>
            )}
            {onStatusChange && item.status !== "archived" && (
              <DropdownMenuItem
                onClick={() => {
                  setShowMenu(false);
                  onStatusChange(item.id, "archived");
                }}
              >
                <Archive className="h-4 w-4 mr-2" aria-hidden="true" />
                Archive
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={() => {
                  setShowMenu(false);
                  onDelete(item.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                Remove from List
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Priority Score Breakdown (Expandable) */}
      {showBreakdown && item.priorityScoreBreakdown && (
        <div className="border-t border-gray-100">
          <div className="px-4 py-3">
            <button
              onClick={() => setShowBreakdown(false)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-3"
              aria-label="Hide score breakdown"
            >
              <ChevronUp className="h-3.5 w-3.5" />
              Hide Breakdown
            </button>
            <PriorityScoreBreakdown breakdown={item.priorityScoreBreakdown} />
          </div>
        </div>
      )}

      {/* Expand button when breakdown is hidden */}
      {!showBreakdown && item.priorityScoreBreakdown && (
        <button
          onClick={() => setShowBreakdown(true)}
          className="flex items-center justify-center gap-1 py-2 text-xs text-gray-500 hover:text-gray-700 border-t border-gray-100"
          aria-label="Show score breakdown"
        >
          <ChevronDown className="h-3.5 w-3.5" />
          View Score Breakdown
        </button>
      )}
    </div>
  );
}

