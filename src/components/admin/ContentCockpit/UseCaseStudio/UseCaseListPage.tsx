"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  Plus,
  Search,
  RefreshCw,
  Route,
  Loader2,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NeptuneButton } from "@/components/ui/neptune-button";
import { UseCaseCard } from "./UseCaseCard";
import { toast } from "sonner";
import type { UseCase, UseCaseFormData } from "./types";

interface UseCaseListResponse {
  useCases: UseCase[];
  total: number;
  stats: {
    draft: number;
    complete: number;
    published: number;
    archived: number;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type StatusFilter = "all" | "draft" | "complete" | "published" | "archived";

export function UseCaseListPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Build query URL
  const buildQueryUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    if (searchQuery) {
      params.set("search", searchQuery);
    }
    const queryString = params.toString();
    return `/api/admin/use-cases${queryString ? `?${queryString}` : ""}`;
  }, [statusFilter, searchQuery]);

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<UseCaseListResponse>(buildQueryUrl(), fetcher, {
    revalidateOnFocus: false,
  });

  const useCases = data?.useCases || [];
  const stats = data?.stats || { draft: 0, complete: 0, published: 0, archived: 0 };
  const totalCount = (stats.draft || 0) + (stats.complete || 0) + (stats.published || 0) + (stats.archived || 0);

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/use-cases/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      toast.success("Use case deleted");
      mutate();
    } catch {
      toast.error("Failed to delete use case");
    }
  };

  // Handle duplicate
  const handleDuplicate = async (id: string) => {
    try {
      // First get the use case
      const getResponse = await fetch(`/api/admin/use-cases/${id}`);
      if (!getResponse.ok) {
        throw new Error("Failed to fetch");
      }

      const { useCase } = await getResponse.json();

      // Create a copy
      const copyData: Partial<UseCaseFormData> = {
        name: `${useCase.name} (Copy)`,
        description: useCase.description,
        category: useCase.category,
        personas: useCase.personas,
        platformTools: useCase.platformTools,
        journeyStages: useCase.journeyStages,
        messaging: useCase.messaging,
        onboardingQuestions: useCase.onboardingQuestions,
      };

      const createResponse = await fetch("/api/admin/use-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(copyData),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create copy");
      }

      toast.success("Use case duplicated");
      mutate();
    } catch {
      toast.error("Failed to duplicate use case");
    }
  };

  // Handle search with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filterTabs: { value: StatusFilter; label: string; count?: number }[] = [
    { value: "all", label: "All", count: totalCount },
    { value: "draft", label: "Draft", count: stats.draft },
    { value: "complete", label: "Complete", count: stats.complete },
    { value: "published", label: "Published", count: stats.published },
    { value: "archived", label: "Archived", count: stats.archived },
  ];

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link href="/admin/content/use-cases/new">
          <NeptuneButton variant="primary" aria-label="Create new use case">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Use Case
          </NeptuneButton>
        </Link>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search use cases..."
              value={searchQuery}
              onChange={handleSearchChange}
              className={cn(
                "w-64 pl-9 pr-4 py-2 rounded-lg border border-gray-300 bg-white text-sm",
                "placeholder:text-gray-400",
                "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              )}
              aria-label="Search use cases"
            />
          </div>

          <NeptuneButton
            variant="ghost"
            onClick={() => mutate()}
            aria-label="Refresh list"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </NeptuneButton>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg w-fit">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              statusFilter === tab.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            )}
            aria-pressed={statusFilter === tab.value}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  "ml-1.5 px-1.5 py-0.5 rounded-full text-xs",
                  statusFilter === tab.value
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-200 text-gray-600"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          Failed to load use cases. Please try again.
        </div>
      ) : useCases.length === 0 ? (
        <EmptyState hasSearch={!!searchQuery} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {useCases.map((useCase) => (
            <UseCaseCard
              key={useCase.id}
              useCase={useCase}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-gray-300 bg-gray-50/50">
      <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
        {hasSearch ? (
          <Filter className="h-7 w-7 text-indigo-600" aria-hidden="true" />
        ) : (
          <Route className="h-7 w-7 text-indigo-600" aria-hidden="true" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {hasSearch ? "No matching use cases" : "No use cases yet"}
      </h3>
      <p className="text-sm text-gray-600 text-center max-w-md mb-4">
        {hasSearch
          ? "Try adjusting your search or filter criteria."
          : "Create your first use case to define user personas, journeys, and generate AI-powered onboarding roadmaps."}
      </p>
      {!hasSearch && (
        <Link href="/admin/content/use-cases/new">
          <NeptuneButton variant="primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create Your First Use Case
          </NeptuneButton>
        </Link>
      )}
    </div>
  );
}

