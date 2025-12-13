"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import {
  Plus,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NeptuneButton } from "@/components/ui/neptune-button";
import { SourcesList, type SourceFilters } from "./SourcesList";
import { SourcesQueueSidebar, SuggestionsBottomSheet } from "./SourcesQueueSidebar";
import { AddSourceDialog, type SourceFormData } from "./AddSourceDialog";
import { toast } from "sonner";
import type { ContentSource, ContentSourceStatus } from "@/db/schema";

interface SourcesResponse {
  sources: (ContentSource & {
    addedByUser?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    } | null;
  })[];
  total: number;
  stats: {
    active: number;
    suggested: number;
    rejected: number;
    archived: number;
  };
}

interface SuggestionsResponse {
  suggestions: ContentSource[];
  total: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SourcesHubPage() {
  const [filters, setFilters] = useState<SourceFilters>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSuggestionsSheetOpen, setIsSuggestionsSheetOpen] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Build query string for sources
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.type) params.set("type", filters.type);
    if (filters.search) params.set("search", filters.search);
    return params.toString();
  }, [filters]);

  // Fetch sources
  const {
    data: sourcesData,
    error: sourcesError,
    isLoading: isSourcesLoading,
    mutate: mutateSources,
  } = useSWR<SourcesResponse>(
    `/api/admin/content-sources?${buildQueryString()}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Fetch suggestions
  const {
    data: suggestionsData,
    error: suggestionsError,
    isLoading: isSuggestionsLoading,
    mutate: mutateSuggestions,
  } = useSWR<SuggestionsResponse>(
    "/api/admin/content-sources/suggestions",
    fetcher,
    { revalidateOnFocus: false }
  );

  // Handle search with debounce
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const handleSearch = useCallback((query: string) => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: query || undefined }));
    }, 300);
    setSearchTimeout(timeout);
  }, [searchTimeout]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters: SourceFilters) => {
    setFilters(newFilters);
  }, []);

  // Handle add source
  const handleAddSource = async (data: SourceFormData) => {
    const response = await fetch("/api/admin/content-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to add source");
    }

    toast.success("Source added successfully");
    mutateSources();
  };

  // Handle edit source (placeholder - could open edit dialog)
  const handleEditSource = (source: ContentSource) => {
    // For now, just log - could be expanded to open an edit dialog
    toast.info("Edit functionality coming soon");
  };

  // Handle delete source
  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm("Are you sure you want to delete this source?")) return;

    setIsUpdating(sourceId);
    try {
      const response = await fetch(`/api/admin/content-sources/${sourceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete source");
      }

      toast.success("Source deleted");
      mutateSources();
    } catch (error) {
      toast.error("Failed to delete source");
    } finally {
      setIsUpdating(null);
    }
  };

  // Handle status change (archive/restore)
  const handleStatusChange = async (sourceId: string, status: ContentSourceStatus) => {
    setIsUpdating(sourceId);
    try {
      const response = await fetch(`/api/admin/content-sources/${sourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update source");
      }

      toast.success(status === "archived" ? "Source archived" : "Source restored");
      mutateSources();
    } catch (error) {
      toast.error("Failed to update source");
    } finally {
      setIsUpdating(null);
    }
  };

  // Handle approve suggestion
  const handleApproveSuggestion = async (source: ContentSource) => {
    setIsUpdating(source.id);
    try {
      const response = await fetch(`/api/admin/content-sources/${source.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve source");
      }

      toast.success("Source approved and added to your list");
      mutateSources();
      mutateSuggestions();
    } catch (error) {
      toast.error("Failed to approve source");
    } finally {
      setIsUpdating(null);
    }
  };

  // Handle reject suggestion
  const handleRejectSuggestion = async (sourceId: string) => {
    setIsUpdating(sourceId);
    try {
      const response = await fetch(`/api/admin/content-sources/${sourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (!response.ok) {
        throw new Error("Failed to reject source");
      }

      toast.success("Source rejected");
      mutateSuggestions();
    } catch (error) {
      toast.error("Failed to reject source");
    } finally {
      setIsUpdating(null);
    }
  };

  // Handle discover more sources
  const handleDiscoverMore = async () => {
    setIsDiscovering(true);
    try {
      const response = await fetch("/api/admin/ai/sources/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 5 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to discover sources");
      }

      const data = await response.json();

      // Add discovered sources as suggestions
      let addedCount = 0;
      for (const source of data.sources) {
        try {
          await fetch("/api/admin/content-sources", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: source.name,
              url: source.url,
              description: source.description,
              type: source.type,
              status: "suggested",
              tags: source.suggestedTags,
              aiReviewScore: source.relevanceScore,
              aiReviewNotes: source.reason,
            }),
          });
          addedCount++;
        } catch {
          // Skip duplicates or errors
        }
      }

      if (addedCount > 0) {
        toast.success(`Discovered ${addedCount} new source suggestion${addedCount !== 1 ? "s" : ""}`);
        mutateSuggestions();
      } else {
        toast.info("No new sources found - try refining your topics");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to discover sources");
    } finally {
      setIsDiscovering(false);
    }
  };

  const suggestions = suggestionsData?.suggestions || [];
  const sources = sourcesData?.sources || [];
  const stats = sourcesData?.stats || { active: 0, suggested: 0, rejected: 0, archived: 0 };

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-200px)]">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => handleFilterChange({ status: "active" })}
            className={cn(
              "p-3 rounded-lg border text-left transition-all hover:shadow-md",
              filters.status === "active"
                ? "border-emerald-500 bg-emerald-50"
                : "border-gray-200 bg-white hover:border-emerald-300"
            )}
            aria-label="Filter by active sources"
          >
            <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
            <div className="text-xs text-gray-500">Active</div>
          </button>
          <button
            onClick={() => handleFilterChange({ status: "suggested" })}
            className={cn(
              "p-3 rounded-lg border text-left transition-all hover:shadow-md relative",
              filters.status === "suggested"
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-200 bg-white hover:border-indigo-300"
            )}
            aria-label="Filter by suggested sources"
          >
            {stats.suggested > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center">
                {stats.suggested}
              </span>
            )}
            <div className="text-2xl font-bold text-indigo-600">{stats.suggested}</div>
            <div className="text-xs text-gray-500">Suggestions</div>
          </button>
          <button
            onClick={() => handleFilterChange({ status: "rejected" })}
            className={cn(
              "p-3 rounded-lg border text-left transition-all hover:shadow-md",
              filters.status === "rejected"
                ? "border-red-500 bg-red-50"
                : "border-gray-200 bg-white hover:border-red-300"
            )}
            aria-label="Filter by rejected sources"
          >
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-xs text-gray-500">Rejected</div>
          </button>
          <button
            onClick={() => handleFilterChange({ status: "archived" })}
            className={cn(
              "p-3 rounded-lg border text-left transition-all hover:shadow-md",
              filters.status === "archived"
                ? "border-gray-500 bg-gray-50"
                : "border-gray-200 bg-white hover:border-gray-300"
            )}
            aria-label="Filter by archived sources"
          >
            <div className="text-2xl font-bold text-gray-600">{stats.archived}</div>
            <div className="text-xs text-gray-500">Archived</div>
          </button>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <NeptuneButton
            variant="primary"
            onClick={() => setIsAddDialogOpen(true)}
            aria-label="Add new source"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Source
          </NeptuneButton>

          <div className="flex items-center gap-2">
            {/* Mobile suggestions button */}
            <NeptuneButton
              variant="ghost"
              className="lg:hidden relative"
              onClick={() => setIsSuggestionsSheetOpen(true)}
              aria-label="View AI suggestions"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Suggestions
              {suggestions.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center">
                  {suggestions.length}
                </span>
              )}
            </NeptuneButton>

            <NeptuneButton
              variant="ghost"
              onClick={() => {
                mutateSources();
                mutateSuggestions();
              }}
              aria-label="Refresh sources"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </NeptuneButton>
          </div>
        </div>

        {/* Sources List */}
        <SourcesList
          sources={sources}
          isLoading={isSourcesLoading}
          onEdit={handleEditSource}
          onDelete={handleDeleteSource}
          onStatusChange={handleStatusChange}
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          filters={filters}
        />

        {/* Error State */}
        {sourcesError && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 mt-4">
            Failed to load sources. Please try again.
          </div>
        )}
      </div>

      {/* Sidebar - Desktop */}
      <SourcesQueueSidebar
        className="hidden lg:flex w-80 flex-shrink-0"
        suggestions={suggestions}
        isLoading={isSuggestionsLoading}
        onApprove={handleApproveSuggestion}
        onReject={handleRejectSuggestion}
        onDiscoverMore={handleDiscoverMore}
        isDiscovering={isDiscovering}
      />

      {/* Suggestions Bottom Sheet - Mobile */}
      <SuggestionsBottomSheet
        isOpen={isSuggestionsSheetOpen}
        onClose={() => setIsSuggestionsSheetOpen(false)}
        suggestions={suggestions}
        isLoading={isSuggestionsLoading}
        onApprove={handleApproveSuggestion}
        onReject={handleRejectSuggestion}
        onDiscoverMore={handleDiscoverMore}
        isDiscovering={isDiscovering}
      />

      {/* Add Source Dialog */}
      <AddSourceDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSubmit={handleAddSource}
      />
    </div>
  );
}

