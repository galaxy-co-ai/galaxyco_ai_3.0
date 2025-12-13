"use client";

import { useState, useCallback } from "react";
import { Search, Filter, SortAsc, SortDesc, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeptuneButton } from "@/components/ui/neptune-button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TopicIdeaStatus } from "@/db/schema";

// Derive TaskPriority type from the enum values
type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface HitListFilters {
  status?: TopicIdeaStatus;
  priority?: TaskPriority;
  search?: string;
  sortBy?: "priorityScore" | "hitListPosition" | "targetPublishDate" | "createdAt";
  sortOrder?: "asc" | "desc";
}

interface HitListFiltersProps {
  filters: HitListFilters;
  onFilterChange: (filters: HitListFilters) => void;
  onSearch: (query: string) => void;
  stats?: {
    queued: number;
    inProgress: number;
    published: number;
    archived: number;
  };
}

const statusOptions: { value: TopicIdeaStatus; label: string }[] = [
  { value: "saved", label: "Queued" },
  { value: "in_progress", label: "In Progress" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

const priorityOptions: { value: TaskPriority; label: string; color: string }[] = [
  { value: "urgent", label: "Urgent", color: "bg-red-500" },
  { value: "high", label: "High", color: "bg-amber-500" },
  { value: "medium", label: "Medium", color: "bg-blue-500" },
  { value: "low", label: "Low", color: "bg-gray-400" },
];

const sortOptions: { value: HitListFilters["sortBy"]; label: string }[] = [
  { value: "priorityScore", label: "Priority Score" },
  { value: "hitListPosition", label: "Manual Order" },
  { value: "targetPublishDate", label: "Target Date" },
  { value: "createdAt", label: "Date Added" },
];

export function HitListFiltersBar({
  filters,
  onFilterChange,
  onSearch,
  stats,
}: HitListFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || "");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (searchTimeout) clearTimeout(searchTimeout);
      const timeout = setTimeout(() => {
        onSearch(value);
      }, 300);
      setSearchTimeout(timeout);
    },
    [searchTimeout, onSearch]
  );

  const clearSearch = () => {
    setSearchInput("");
    onSearch("");
  };

  const clearFilters = () => {
    setSearchInput("");
    onFilterChange({
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    });
    onSearch("");
  };

  const hasActiveFilters = filters.status || filters.priority || filters.search;

  const toggleSortOrder = () => {
    onFilterChange({
      ...filters,
      sortOrder: filters.sortOrder === "asc" ? "desc" : "asc",
    });
  };

  return (
    <div className="space-y-4">
      {/* Status Filter Tabs */}
      {stats && (
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Filter by status"
        >
          <button
            onClick={() =>
              onFilterChange({ ...filters, status: undefined })
            }
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              !filters.status
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
            role="tab"
            aria-selected={!filters.status}
            aria-label="Show all items"
          >
            All ({stats.queued + stats.inProgress})
          </button>
          <button
            onClick={() =>
              onFilterChange({ ...filters, status: "saved" })
            }
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              filters.status === "saved"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
            role="tab"
            aria-selected={filters.status === "saved"}
            aria-label={`Show ${stats.queued} queued items`}
          >
            Queued ({stats.queued})
          </button>
          <button
            onClick={() =>
              onFilterChange({ ...filters, status: "in_progress" })
            }
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              filters.status === "in_progress"
                ? "bg-amber-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
            role="tab"
            aria-selected={filters.status === "in_progress"}
            aria-label={`Show ${stats.inProgress} in progress items`}
          >
            In Progress ({stats.inProgress})
          </button>
          <button
            onClick={() =>
              onFilterChange({ ...filters, status: "published" })
            }
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              filters.status === "published"
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
            role="tab"
            aria-selected={filters.status === "published"}
            aria-label={`Show ${stats.published} published items`}
          >
            Published ({stats.published})
          </button>
        </div>
      )}

      {/* Search and Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search topics..."
            className={cn(
              "w-full pl-9 pr-9 py-2 rounded-lg border border-gray-200",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
              "text-sm placeholder:text-gray-400"
            )}
            aria-label="Search topics"
          />
          {searchInput && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex gap-2">
          {/* Priority Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <NeptuneButton
                variant={filters.priority ? "primary" : "ghost"}
                size="sm"
                aria-label="Filter by priority"
              >
                <Filter className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">
                  {filters.priority
                    ? priorityOptions.find((p) => p.value === filters.priority)?.label
                    : "Priority"}
                </span>
              </NeptuneButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  onFilterChange({ ...filters, priority: undefined })
                }
              >
                <span className="flex-1">All Priorities</span>
                {!filters.priority && <span className="text-indigo-600">✓</span>}
              </DropdownMenuItem>
              {priorityOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() =>
                    onFilterChange({ ...filters, priority: option.value })
                  }
                >
                  <span
                    className={cn("w-2 h-2 rounded-full mr-2", option.color)}
                  />
                  <span className="flex-1">{option.label}</span>
                  {filters.priority === option.value && (
                    <span className="text-indigo-600">✓</span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <NeptuneButton variant="ghost" size="sm" aria-label="Sort options">
                {filters.sortOrder === "asc" ? (
                  <SortAsc className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <SortDesc className="h-4 w-4" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">
                  {sortOptions.find((s) => s.value === filters.sortBy)?.label ||
                    "Sort"}
                </span>
              </NeptuneButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() =>
                    onFilterChange({ ...filters, sortBy: option.value })
                  }
                >
                  <span className="flex-1">{option.label}</span>
                  {filters.sortBy === option.value && (
                    <span className="text-indigo-600">✓</span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleSortOrder}>
                {filters.sortOrder === "asc" ? (
                  <>
                    <SortAsc className="h-4 w-4 mr-2" />
                    Ascending
                  </>
                ) : (
                  <>
                    <SortDesc className="h-4 w-4 mr-2" />
                    Descending
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <NeptuneButton
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              aria-label="Clear all filters"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Clear</span>
            </NeptuneButton>
          )}
        </div>
      </div>
    </div>
  );
}

