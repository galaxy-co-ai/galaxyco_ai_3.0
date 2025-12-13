"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { RefreshCw, Loader2 } from "lucide-react";
import { NeptuneButton } from "@/components/ui/neptune-button";
import { DateRangeSelector, type DateRangePreset } from "./DateRangeSelector";
import { StatsOverviewCards } from "./StatsOverviewCards";
import { PerformanceTrendsChart, type MetricType } from "./PerformanceTrendsChart";
import { TopPerformersTable } from "./TopPerformersTable";
import { EngagementBreakdown } from "./EngagementBreakdown";
import { toast } from "sonner";

interface OverviewResponse {
  period: string;
  periodLabel: string;
  stats: {
    totalViews: number;
    totalUniqueVisitors: number;
    avgTimeOnPage: number;
    avgScrollDepth: number;
    avgBounceRate: number;
    totalShares: number;
    totalArticles: number;
    totalPublished: number;
    recentlyPublished: number;
  };
  trends: {
    viewsChange: number;
    timeChange: number;
  };
  topPerformers: {
    id: string;
    title: string;
    slug: string;
    featuredImage: string | null;
    publishedAt: string | null;
    totalViews: number;
    avgTimeOnPage: number;
    avgScrollDepth: number;
  }[];
}

interface TrendsResponse {
  metric: MetricType;
  metricLabel: string;
  period: string;
  days: number;
  summary: {
    total: number;
    average: number;
    trendDirection: number;
    trendLabel: string;
  };
  data: {
    period: string;
    value: number;
    views: number;
    uniqueVisitors: number;
    avgScrollDepth: number;
    avgTimeOnPage: number;
    avgBounceRate: number;
    socialShares: number;
    articleCount: number;
    newPublished: number;
  }[];
}

interface ArticlesResponse {
  articles: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    featuredImage: string | null;
    publishedAt: string | null;
    readingTimeMinutes: number | null;
    author: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
    } | null;
    metrics: {
      totalViews: number;
      uniqueVisitors: number;
      avgTimeOnPage: number;
      avgScrollDepth: number;
      bounceRate: number;
      socialShares: number;
      engagementScore: number;
    };
  }[];
  total: number;
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

// Map date range to days for trends
const periodToDays: Record<DateRangePreset, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: 365,
};

type SortField = "views" | "timeOnPage" | "scrollDepth" | "publishedAt";
type SortOrder = "asc" | "desc";

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRangePreset>("30d");
  const [trendMetric, setTrendMetric] = useState<MetricType>("views");
  const [sortField, setSortField] = useState<SortField>("views");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // Build API URLs with query params
  const overviewUrl = `/api/admin/analytics/overview?period=${dateRange}`;
  const trendsUrl = `/api/admin/analytics/trends?metric=${trendMetric}&days=${periodToDays[dateRange]}`;
  const articlesUrl = `/api/admin/analytics/articles?sortBy=${sortField}&sortOrder=${sortOrder}&limit=10`;

  // Fetch data with SWR
  const {
    data: overviewData,
    error: overviewError,
    isLoading: overviewLoading,
    mutate: mutateOverview,
  } = useSWR<OverviewResponse>(overviewUrl, fetcher, {
    revalidateOnFocus: false,
  });

  const {
    data: trendsData,
    error: trendsError,
    isLoading: trendsLoading,
    mutate: mutateTrends,
  } = useSWR<TrendsResponse>(trendsUrl, fetcher, {
    revalidateOnFocus: false,
  });

  const {
    data: articlesData,
    error: articlesError,
    isLoading: articlesLoading,
    mutate: mutateArticles,
  } = useSWR<ArticlesResponse>(articlesUrl, fetcher, {
    revalidateOnFocus: false,
  });

  const isLoading = overviewLoading || trendsLoading || articlesLoading;
  const hasError = overviewError || trendsError || articlesError;

  // Handle sort change
  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortOrder((order) => (order === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortOrder("desc");
      return field;
    });
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    try {
      await Promise.all([mutateOverview(), mutateTrends(), mutateArticles()]);
      toast.success("Analytics refreshed");
    } catch {
      toast.error("Failed to refresh analytics");
    }
  };

  // Format table data for TopPerformersTable
  const tableArticles =
    articlesData?.articles.map((article) => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      publishedAt: article.publishedAt,
      metrics: {
        totalViews: article.metrics.totalViews,
        avgTimeOnPage: article.metrics.avgTimeOnPage,
        avgScrollDepth: article.metrics.avgScrollDepth,
        engagementScore: article.metrics.engagementScore,
      },
    })) || [];

  // Calculate aggregate engagement data
  const aggregateTrafficSources = articlesData?.articles.reduce(
    (acc, article) => {
      // Since we don't have per-article traffic sources from list endpoint,
      // we'll show placeholder data. In real implementation, aggregate from overview
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <DateRangeSelector
          value={dateRange}
          onChange={setDateRange}
          showCompare={false}
        />
        <NeptuneButton
          variant="default"
          onClick={handleRefresh}
          disabled={isLoading}
          aria-label="Refresh analytics"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          )}
          Refresh
        </NeptuneButton>
      </div>

      {/* Error State */}
      {hasError && (
        <div
          className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700"
          role="alert"
        >
          <p className="font-medium">Failed to load some analytics data</p>
          <p className="text-sm mt-1">
            Please try refreshing or check your connection.
          </p>
        </div>
      )}

      {/* Stats Overview Cards */}
      <StatsOverviewCards
        stats={overviewData?.stats}
        trends={overviewData?.trends}
        isLoading={overviewLoading}
      />

      {/* Performance Trends Chart */}
      <PerformanceTrendsChart
        data={trendsData?.data || []}
        metric={trendMetric}
        onMetricChange={setTrendMetric}
        isLoading={trendsLoading}
      />

      {/* Two-column layout for Table and Engagement */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Performers Table */}
        <TopPerformersTable
          articles={tableArticles}
          isLoading={articlesLoading}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
        />

        {/* Engagement Breakdown */}
        <EngagementBreakdown
          avgScrollDepth={overviewData?.stats?.avgScrollDepth}
          avgTimeOnPage={overviewData?.stats?.avgTimeOnPage}
          bounceRate={overviewData?.stats?.avgBounceRate}
          isLoading={overviewLoading}
        />
      </div>

      {/* Empty State */}
      {!isLoading &&
        !hasError &&
        overviewData?.stats?.totalViews === 0 &&
        articlesData?.articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-gray-300 bg-gray-50/50">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <svg
                className="h-6 w-6 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Analytics Data Yet
            </h3>
            <p className="text-sm text-gray-600 text-center max-w-md mb-4">
              Analytics will appear here once your published articles start
              receiving traffic. Check back soon!
            </p>
          </div>
        )}
    </div>
  );
}

