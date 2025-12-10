"use client";

import { useState } from "react";
import {
  ExternalLink,
  MoreVertical,
  Pencil,
  Trash2,
  Archive,
  CheckCircle,
  XCircle,
  AlertTriangle,
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
import type { ContentSource, ContentSourceType, ContentSourceStatus } from "@/db/schema";

interface SourceCardProps {
  source: ContentSource & {
    addedByUser?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    } | null;
  };
  onEdit?: (source: ContentSource) => void;
  onDelete?: (sourceId: string) => void;
  onStatusChange?: (sourceId: string, status: ContentSourceStatus) => void;
  isLoading?: boolean;
}

const typeConfig: Record<ContentSourceType, { label: string; className: string }> = {
  news: { label: "News", className: "bg-blue-100 text-blue-700 border-blue-200" },
  research: { label: "Research", className: "bg-purple-100 text-purple-700 border-purple-200" },
  competitor: { label: "Competitor", className: "bg-red-100 text-red-700 border-red-200" },
  inspiration: { label: "Inspiration", className: "bg-amber-100 text-amber-700 border-amber-200" },
  industry: { label: "Industry", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  other: { label: "Other", className: "bg-gray-100 text-gray-700 border-gray-200" },
};

const statusConfig: Record<ContentSourceStatus, { label: string; icon: typeof CheckCircle }> = {
  active: { label: "Active", icon: CheckCircle },
  suggested: { label: "Suggested", icon: AlertTriangle },
  rejected: { label: "Rejected", icon: XCircle },
  archived: { label: "Archived", icon: Archive },
};

function getScoreColor(score: number | null): string {
  if (score === null) return "text-gray-400";
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function getScoreBgColor(score: number | null): string {
  if (score === null) return "bg-gray-100";
  if (score >= 80) return "bg-emerald-50";
  if (score >= 60) return "bg-amber-50";
  return "bg-red-50";
}

export function SourceCard({
  source,
  onEdit,
  onDelete,
  onStatusChange,
  isLoading = false,
}: SourceCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const type = typeConfig[source.type] || typeConfig.other;
  const status = statusConfig[source.status] || statusConfig.active;
  const StatusIcon = status.icon;

  const getDomainFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  const addedByName = source.addedByUser
    ? `${source.addedByUser.firstName || ""} ${source.addedByUser.lastName || ""}`.trim() ||
      source.addedByUser.email
    : null;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl bg-white p-4",
        "shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200",
        "hover:-translate-y-px hover:shadow-lg active:shadow-sm",
        "transition-all duration-200 ease-out",
        isLoading && "opacity-60 pointer-events-none"
      )}
    >
      {/* Header with Type Badge and Menu */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
              type.className
            )}
          >
            {type.label}
          </span>
          {source.status !== "active" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
              <StatusIcon className="h-3 w-3" aria-hidden="true" />
              {status.label}
            </span>
          )}
        </div>

        <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
          <DropdownMenuTrigger asChild>
            <NeptuneButton
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Source options"
            >
              <MoreVertical className="h-4 w-4" />
            </NeptuneButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onEdit && (
              <DropdownMenuItem
                onClick={() => {
                  setShowMenu(false);
                  onEdit(source);
                }}
              >
                <Pencil className="h-4 w-4 mr-2" aria-hidden="true" />
                Edit Source
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                <ExternalLink className="h-4 w-4 mr-2" aria-hidden="true" />
                Visit Website
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {onStatusChange && source.status !== "archived" && (
              <DropdownMenuItem
                onClick={() => {
                  setShowMenu(false);
                  onStatusChange(source.id, "archived");
                }}
              >
                <Archive className="h-4 w-4 mr-2" aria-hidden="true" />
                Archive
              </DropdownMenuItem>
            )}
            {onStatusChange && source.status === "archived" && (
              <DropdownMenuItem
                onClick={() => {
                  setShowMenu(false);
                  onStatusChange(source.id, "active");
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                Restore
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={() => {
                  setShowMenu(false);
                  onDelete(source.id);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Source Name and URL */}
      <div className="mb-3">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
          {source.name}
        </h3>
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
          aria-label={`Visit ${source.name}`}
        >
          <span className="truncate">{getDomainFromUrl(source.url)}</span>
          <ExternalLink className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
        </a>
      </div>

      {/* Description */}
      {source.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {source.description}
        </p>
      )}

      {/* Tags */}
      {source.tags && source.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {source.tags.slice(0, 4).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
            >
              {tag}
            </span>
          ))}
          {source.tags.length > 4 && (
            <span className="text-xs text-gray-500">
              +{source.tags.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Footer with AI Score and Metadata */}
      <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
        {/* AI Score */}
        <div className="flex items-center gap-2">
          {source.aiReviewScore !== null && (
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium",
                getScoreBgColor(source.aiReviewScore)
              )}
              title={source.aiReviewNotes || "AI Review Score"}
            >
              <span className={getScoreColor(source.aiReviewScore)}>
                {source.aiReviewScore}
              </span>
              <span className="text-gray-500 text-xs">/ 100</span>
            </div>
          )}
        </div>

        {/* Added by */}
        {addedByName && (
          <span className="text-xs text-gray-500 truncate max-w-[120px]" title={addedByName}>
            Added by {addedByName}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Compact version of SourceCard for suggestion queue
 */
interface SuggestionCardProps {
  source: ContentSource;
  onApprove?: (source: ContentSource) => void;
  onReject?: (sourceId: string) => void;
  isLoading?: boolean;
}

export function SuggestionCard({
  source,
  onApprove,
  onReject,
  isLoading = false,
}: SuggestionCardProps) {
  const type = typeConfig[source.type] || typeConfig.other;

  const getDomainFromUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-lg bg-white p-3 border border-gray-200",
        "hover:border-gray-300 transition-colors",
        isLoading && "opacity-60 pointer-events-none"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm line-clamp-1">
            {source.name}
          </h4>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-indigo-600 truncate block"
            aria-label={`Visit ${source.name}`}
          >
            {getDomainFromUrl(source.url)}
          </a>
        </div>
        <span
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border flex-shrink-0",
            type.className
          )}
        >
          {type.label}
        </span>
      </div>

      {/* AI Score Bar */}
      {source.aiReviewScore !== null && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">AI Score</span>
            <span className={cn("font-medium", getScoreColor(source.aiReviewScore))}>
              {source.aiReviewScore}%
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                source.aiReviewScore >= 80
                  ? "bg-emerald-500"
                  : source.aiReviewScore >= 60
                    ? "bg-amber-500"
                    : "bg-red-500"
              )}
              style={{ width: `${source.aiReviewScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Reason/Notes */}
      {source.aiReviewNotes && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {source.aiReviewNotes}
        </p>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-auto">
        {onApprove && (
          <NeptuneButton
            variant="success"
            size="sm"
            className="flex-1"
            onClick={() => onApprove(source)}
            disabled={isLoading}
            aria-label={`Approve ${source.name}`}
          >
            <CheckCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Approve
          </NeptuneButton>
        )}
        {onReject && (
          <NeptuneButton
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => onReject(source.id)}
            disabled={isLoading}
            aria-label={`Reject ${source.name}`}
          >
            <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Reject
          </NeptuneButton>
        )}
      </div>
    </div>
  );
}

