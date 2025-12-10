"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  Clock,
  MousePointerClick,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NeptuneButton } from "@/components/ui/neptune-button";
import { Skeleton } from "@/components/ui/skeleton";

type SortField = "views" | "timeOnPage" | "scrollDepth" | "publishedAt";
type SortOrder = "asc" | "desc";

interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  publishedAt: string | Date | null;
  metrics: {
    totalViews: number;
    avgTimeOnPage: number;
    avgScrollDepth: number;
    engagementScore: number;
  };
}

interface TopPerformersTableProps {
  articles: ArticleRow[];
  isLoading?: boolean;
  sortField?: SortField;
  sortOrder?: SortOrder;
  onSort?: (field: SortField) => void;
  className?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

function formatDate(date: string | Date | null): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function SortableHeader({
  label,
  field,
  currentField,
  currentOrder,
  onSort,
}: {
  label: string;
  field: SortField;
  currentField?: SortField;
  currentOrder?: SortOrder;
  onSort?: (field: SortField) => void;
}) {
  const isActive = currentField === field;

  return (
    <button
      onClick={() => onSort?.(field)}
      className={cn(
        "flex items-center gap-1 text-xs font-medium uppercase tracking-wider",
        isActive ? "text-indigo-600" : "text-gray-500 hover:text-gray-700"
      )}
      aria-label={`Sort by ${label}`}
    >
      {label}
      {isActive ? (
        currentOrder === "asc" ? (
          <ArrowUp className="h-3 w-3" aria-hidden="true" />
        ) : (
          <ArrowDown className="h-3 w-3" aria-hidden="true" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-50" aria-hidden="true" />
      )}
    </button>
  );
}

function TableRowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-3">
        <Skeleton className="h-5 w-48" />
      </td>
      <td className="px-4 py-3 text-right">
        <Skeleton className="h-5 w-16 ml-auto" />
      </td>
      <td className="px-4 py-3 text-right">
        <Skeleton className="h-5 w-16 ml-auto" />
      </td>
      <td className="px-4 py-3 text-right">
        <Skeleton className="h-5 w-12 ml-auto" />
      </td>
      <td className="px-4 py-3 text-right">
        <Skeleton className="h-5 w-16 ml-auto" />
      </td>
      <td className="px-4 py-3">
        <Skeleton className="h-8 w-8 ml-auto" />
      </td>
    </tr>
  );
}

export function TopPerformersTable({
  articles,
  isLoading = false,
  sortField = "views",
  sortOrder = "desc",
  onSort,
  className,
}: TopPerformersTableProps) {
  const handleExportCSV = () => {
    const headers = ["Title", "Views", "Avg Time", "Scroll Depth", "Published"];
    const rows = articles.map((article) => [
      `"${article.title.replace(/"/g, '""')}"`,
      article.metrics.totalViews,
      article.metrics.avgTimeOnPage,
      `${article.metrics.avgScrollDepth}%`,
      formatDate(article.publishedAt),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `article-analytics-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={cn(
        "rounded-xl bg-white overflow-hidden",
        "shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-gray-200",
        className
      )}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
        <NeptuneButton
          variant="ghost"
          size="sm"
          onClick={handleExportCSV}
          disabled={isLoading || articles.length === 0}
          aria-label="Export to CSV"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export
        </NeptuneButton>
      </div>

      <div className="overflow-x-auto">
        <table
          className="w-full"
          role="table"
          aria-label="Top performing articles"
        >
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left">
                <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Article
                </span>
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <SortableHeader
                  label="Views"
                  field="views"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={onSort}
                />
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <SortableHeader
                  label="Avg Time"
                  field="timeOnPage"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={onSort}
                />
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <SortableHeader
                  label="Scroll"
                  field="scrollDepth"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={onSort}
                />
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <SortableHeader
                  label="Published"
                  field="publishedAt"
                  currentField={sortField}
                  currentOrder={sortOrder}
                  onSort={onSort}
                />
              </th>
              <th scope="col" className="px-4 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRowSkeleton key={i} />
              ))
            ) : articles.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No articles to display
                </td>
              </tr>
            ) : (
              articles.map((article, index) => (
                <tr
                  key={article.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                        {index + 1}
                      </span>
                      <Link
                        href={`/admin/content/analytics/${article.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1"
                      >
                        {article.title}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-900">
                      <Eye className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                      {formatNumber(article.metrics.totalViews)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-900">
                      <Clock className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                      {formatTime(article.metrics.avgTimeOnPage)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-900">
                      <MousePointerClick
                        className="h-3.5 w-3.5 text-gray-400"
                        aria-hidden="true"
                      />
                      {article.metrics.avgScrollDepth}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500">
                    {formatDate(article.publishedAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/blog/${article.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <NeptuneButton
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label={`View ${article.title} on blog`}
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </NeptuneButton>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

