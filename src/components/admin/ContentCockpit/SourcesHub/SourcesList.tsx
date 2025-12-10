"use client";

import { useState } from "react";
import { Grid, List, Search, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeptuneButton } from "@/components/ui/neptune-button";
import { SourceCard } from "./SourceCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ContentSource, ContentSourceType, ContentSourceStatus } from "@/db/schema";

interface SourcesListProps {
  sources: (ContentSource & {
    addedByUser?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    } | null;
  })[];
  isLoading?: boolean;
  onEdit?: (source: ContentSource) => void;
  onDelete?: (sourceId: string) => void;
  onStatusChange?: (sourceId: string, status: ContentSourceStatus) => void;
  onSearch?: (query: string) => void;
  onFilterChange?: (filters: SourceFilters) => void;
  filters?: SourceFilters;
}

export interface SourceFilters {
  status?: ContentSourceStatus | null;
  type?: ContentSourceType | null;
  search?: string;
}

const typeOptions: { value: ContentSourceType; label: string }[] = [
  { value: "news", label: "News" },
  { value: "research", label: "Research" },
  { value: "competitor", label: "Competitor" },
  { value: "inspiration", label: "Inspiration" },
  { value: "industry", label: "Industry" },
  { value: "other", label: "Other" },
];

const statusOptions: { value: ContentSourceStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "suggested", label: "Suggested" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

export function SourcesList({
  sources,
  isLoading = false,
  onEdit,
  onDelete,
  onStatusChange,
  onSearch,
  onFilterChange,
  filters = {},
}: SourcesListProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchValue, setSearchValue] = useState(filters.search || "");
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [filters.status, filters.type].filter(Boolean).length;

  const handleSearch = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  const handleClearFilters = () => {
    setSearchValue("");
    onFilterChange?.({});
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder="Search sources..."
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className={cn(
              "w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500",
              "text-sm placeholder:text-gray-400"
            )}
            aria-label="Search sources"
          />
          {searchValue && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters and View Toggle */}
        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <DropdownMenu open={showFilters} onOpenChange={setShowFilters}>
            <DropdownMenuTrigger asChild>
              <NeptuneButton variant="ghost" className="gap-2">
                <Filter className="h-4 w-4" aria-hidden="true" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-medium">
                    {activeFilterCount}
                  </span>
                )}
              </NeptuneButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                Status
              </div>
              {statusOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.status === option.value}
                  onCheckedChange={(checked) => {
                    onFilterChange?.({
                      ...filters,
                      status: checked ? option.value : null,
                    });
                  }}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                Type
              </div>
              {typeOptions.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option.value}
                  checked={filters.type === option.value}
                  onCheckedChange={(checked) => {
                    onFilterChange?.({
                      ...filters,
                      type: checked ? option.value : null,
                    });
                  }}
                >
                  {option.label}
                </DropdownMenuCheckboxItem>
              ))}
              {activeFilterCount > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <button
                    className="w-full px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 text-left"
                    onClick={() => {
                      handleClearFilters();
                      setShowFilters(false);
                    }}
                  >
                    Clear all filters
                  </button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "grid"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              )}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                viewMode === "list"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              )}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.status || filters.type || searchValue) && (
        <div className="flex flex-wrap gap-2">
          {filters.status && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs">
              Status: {statusOptions.find((o) => o.value === filters.status)?.label}
              <button
                onClick={() => onFilterChange?.({ ...filters, status: null })}
                aria-label="Remove status filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.type && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs">
              Type: {typeOptions.find((o) => o.value === filters.type)?.label}
              <button
                onClick={() => onFilterChange?.({ ...filters, type: null })}
                aria-label="Remove type filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {searchValue && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs">
              Search: &quot;{searchValue}&quot;
              <button onClick={() => handleSearch("")} aria-label="Clear search">
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Sources Grid/List */}
      {isLoading ? (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
          )}
        >
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl bg-gray-100 h-48"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : sources.length === 0 ? (
        <div className="text-center py-12 rounded-xl border border-dashed border-gray-300 bg-gray-50/50">
          <Search className="h-10 w-10 text-gray-400 mx-auto mb-3" aria-hidden="true" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No sources found</h3>
          <p className="text-sm text-gray-500">
            {filters.status || filters.type || searchValue
              ? "Try adjusting your filters or search query"
              : "Add your first source to get started"}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === "grid"
              ? "grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
          )}
        >
          {sources.map((source) => (
            <SourceCard
              key={source.id}
              source={source}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}

      {/* Results Count */}
      {!isLoading && sources.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          Showing {sources.length} source{sources.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

