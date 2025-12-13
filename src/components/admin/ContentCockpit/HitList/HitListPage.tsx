"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Plus,
  Sparkles,
  RefreshCw,
  GripVertical,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NeptuneButton } from "@/components/ui/neptune-button";
import { HitListItem } from "./HitListItem";
import { HitListFiltersBar, type HitListFilters } from "./HitListFilters";
import { AddToHitListDialog } from "./AddToHitListDialog";
import { toast } from "sonner";
import type { TopicIdea, TopicIdeaStatus } from "@/db/schema";

interface HitListResponse {
  items: (TopicIdea & {
    assignedUser?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string;
    } | null;
  })[];
  total: number;
  stats: {
    queued: number;
    inProgress: number;
    published: number;
    archived: number;
    total: number;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function HitListPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<HitListFilters>({
    sortBy: "priorityScore",
    sortOrder: "desc",
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Build query string
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    params.set("hitListOnly", "true");
    if (filters.status) params.set("status", filters.status);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.search) params.set("search", filters.search);
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
    return params.toString();
  }, [filters]);

  // Fetch hit list items
  const {
    data: hitListData,
    error: hitListError,
    isLoading: isHitListLoading,
    mutate: mutateHitList,
  } = useSWR<HitListResponse>(
    `/api/admin/hit-list?${buildQueryString()}`,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Handle search with debounce
  const handleSearch = useCallback((query: string) => {
    setFilters((prev) => ({ ...prev, search: query || undefined }));
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((newFilters: HitListFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // Handle AI prioritization
  const handlePrioritize = async () => {
    setIsPrioritizing(true);
    try {
      const response = await fetch("/api/admin/ai/hit-list/prioritize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to prioritize");
      }

      const data = await response.json();
      toast.success(`Prioritized ${data.updatedCount} items`);
      mutateHitList();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to prioritize items"
      );
    } finally {
      setIsPrioritizing(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (itemId: string, status: TopicIdeaStatus) => {
    setIsUpdating(itemId);
    try {
      const response = await fetch(`/api/admin/hit-list/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update item");
      }

      toast.success(
        status === "archived" ? "Item archived" : "Status updated"
      );
      mutateHitList();
    } catch (error) {
      toast.error("Failed to update item");
    } finally {
      setIsUpdating(null);
    }
  };

  // Handle delete (remove from hit list)
  const handleDelete = async (itemId: string) => {
    if (!confirm("Remove this item from the hit list?")) return;

    setIsUpdating(itemId);
    try {
      const response = await fetch(`/api/admin/hit-list/${itemId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove item");
      }

      toast.success("Item removed from hit list");
      mutateHitList();
    } catch (error) {
      toast.error("Failed to remove item");
    } finally {
      setIsUpdating(null);
    }
  };

  // Handle start writing - navigate to Article Studio
  const handleStartWriting = (item: TopicIdea) => {
    router.push(`/admin/content/article-studio?topicId=${item.id}`);
  };

  // Handle edit - for now, just show toast
  const handleEdit = (item: TopicIdea) => {
    toast.info("Edit functionality coming soon");
  };

  // Drag and drop handlers for manual reordering
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setIsDragging(true);
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", itemId);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain");

    if (sourceId === targetId || !hitListData?.items) {
      setIsDragging(false);
      setDraggedItem(null);
      return;
    }

    // Get current order
    const items = [...hitListData.items];
    const sourceIndex = items.findIndex((i) => i.id === sourceId);
    const targetIndex = items.findIndex((i) => i.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      setIsDragging(false);
      setDraggedItem(null);
      return;
    }

    // Reorder locally first for immediate feedback
    const [removed] = items.splice(sourceIndex, 1);
    items.splice(targetIndex, 0, removed);

    // Update the order in the backend
    const newOrder = items.map((item) => item.id);

    try {
      const response = await fetch("/api/admin/hit-list/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemIds: newOrder }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder");
      }

      mutateHitList();
      toast.success("List reordered");
    } catch (error) {
      toast.error("Failed to reorder list");
    }

    setIsDragging(false);
    setDraggedItem(null);
  };

  const items = hitListData?.items || [];
  const stats = hitListData?.stats || {
    queued: 0,
    inProgress: 0,
    published: 0,
    archived: 0,
    total: 0,
  };

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <NeptuneButton
          variant="primary"
          onClick={() => setIsAddDialogOpen(true)}
          aria-label="Add topic to hit list"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Topic
        </NeptuneButton>

        <div className="flex items-center gap-2">
          <NeptuneButton
            variant="default"
            onClick={handlePrioritize}
            disabled={isPrioritizing || items.length === 0}
            aria-label="Run AI prioritization"
          >
            {isPrioritizing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            )}
            {isPrioritizing ? "Prioritizing..." : "AI Prioritize"}
          </NeptuneButton>

          <NeptuneButton
            variant="ghost"
            onClick={() => mutateHitList()}
            aria-label="Refresh list"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </NeptuneButton>
        </div>
      </div>

      {/* Filters */}
      <HitListFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        stats={stats}
      />

      {/* Priority Score Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-4 py-2">
        <span className="font-medium">Score Guide:</span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-emerald-500" />
          80+ High Priority
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-blue-500" />
          60-79 Medium-High
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-500" />
          40-59 Medium
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-gray-400" />
          &lt;40 Low
        </span>
      </div>

      {/* Hit List Items */}
      {isHitListLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : hitListError ? (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          Failed to load hit list. Please try again.
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-gray-300 bg-gray-50/50">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
            <GripVertical className="h-6 w-6 text-indigo-600" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Your Hit List is Empty
          </h3>
          <p className="text-sm text-gray-600 text-center max-w-md mb-4">
            Add topics to your hit list to prioritize your content creation.
            AI will help score and rank them based on impact.
          </p>
          <NeptuneButton
            variant="primary"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Your First Topic
          </NeptuneButton>
        </div>
      ) : (
        <div
          className="space-y-3"
          role="list"
          aria-label="Hit list items"
        >
          {items.map((item) => (
            <div
              key={item.id}
              draggable={filters.sortBy === "hitListPosition"}
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, item.id)}
              className={cn(
                "transition-opacity",
                isDragging && draggedItem !== item.id && "opacity-50"
              )}
            >
              <HitListItem
                item={item}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                onStartWriting={handleStartWriting}
                isDragging={draggedItem === item.id}
                isLoading={isUpdating === item.id}
                dragHandleProps={
                  filters.sortBy === "hitListPosition"
                    ? {
                        className: "cursor-grab active:cursor-grabbing",
                      }
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      )}

      {/* Drag hint when in manual order mode */}
      {filters.sortBy === "hitListPosition" && items.length > 1 && (
        <p className="text-xs text-gray-500 text-center">
          <GripVertical className="inline h-3 w-3 mr-1" />
          Drag items to reorder manually
        </p>
      )}

      {/* Add Dialog */}
      <AddToHitListDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={() => mutateHitList()}
      />
    </div>
  );
}

