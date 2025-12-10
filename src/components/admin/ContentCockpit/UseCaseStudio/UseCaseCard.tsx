"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Users,
  HelpCircle,
  Route,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NeptuneButton } from "@/components/ui/neptune-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CATEGORY_OPTIONS } from "./types";
import type { UseCase } from "./types";

interface UseCaseCardProps {
  useCase: UseCase;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
}

export function UseCaseCard({
  useCase,
  onDelete,
  onDuplicate,
}: UseCaseCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const categoryLabel =
    CATEGORY_OPTIONS.find((c) => c.value === useCase.category)?.label ||
    useCase.category;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this use case?")) return;
    setIsDeleting(true);
    try {
      await onDelete(useCase.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      await onDuplicate(useCase.id);
    } finally {
      setIsDuplicating(false);
    }
  };

  const statusColors = {
    draft: "bg-gray-100 text-gray-700",
    complete: "bg-blue-100 text-blue-700",
    published: "bg-emerald-100 text-emerald-700",
    archived: "bg-amber-100 text-amber-700",
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      className={cn(
        "group relative p-5 rounded-xl border border-gray-200 bg-white",
        "hover:-translate-y-px hover:shadow-lg transition-all duration-150"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <Link
            href={`/admin/content/use-cases/${useCase.id}`}
            className="block"
          >
            <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
              {useCase.name}
            </h3>
          </Link>
          {useCase.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {useCase.description}
            </p>
          )}
        </div>

        {/* Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <NeptuneButton
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </NeptuneButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/admin/content/use-cases/${useCase.id}`}>
                <Edit className="h-4 w-4 mr-2" aria-hidden="true" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDuplicate}
              disabled={isDuplicating}
            >
              {isDuplicating ? (
                <Loader2
                  className="h-4 w-4 mr-2 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
              )}
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-red-600 focus:text-red-600"
            >
              {isDeleting ? (
                <Loader2
                  className="h-4 w-4 mr-2 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
              )}
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <span
          className={cn(
            "px-2 py-0.5 rounded-full text-xs font-medium",
            statusColors[useCase.status]
          )}
        >
          {useCase.status.charAt(0).toUpperCase() + useCase.status.slice(1)}
        </span>
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
          {categoryLabel}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-gray-500">
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4" aria-hidden="true" />
          {useCase.personas?.length || 0} persona
          {(useCase.personas?.length || 0) !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          {useCase.onboardingQuestions?.length || 0} Q
        </span>
        {(useCase.roadmap?.length || 0) > 0 && (
          <span className="flex items-center gap-1.5">
            <Route className="h-4 w-4" aria-hidden="true" />
            {useCase.roadmap.length} steps
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
        <span>Updated {formatDate(useCase.updatedAt)}</span>
        {useCase.createdByUser && (
          <span>
            by{" "}
            {useCase.createdByUser.firstName ||
              useCase.createdByUser.email.split("@")[0]}
          </span>
        )}
      </div>
    </div>
  );
}

