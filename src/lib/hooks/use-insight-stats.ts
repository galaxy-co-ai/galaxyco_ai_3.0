'use client';

import useSWR from 'swr';

export interface InsightStats {
  total: number;
  byType: {
    opportunity: number;
    warning: number;
    suggestion: number;
    achievement: number;
  };
  byCategory: {
    sales: number;
    marketing: number;
    operations: number;
    finance: number;
    content: number;
  };
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
  averagePriority: number;
  highConfidenceCount: number;
  weekOverWeek: {
    thisWeek: number;
    lastWeek: number;
    changePercent: number;
  };
  confidenceDistribution: {
    bucket: string;
    range: string;
    count: number;
  }[];
  trendData: {
    week: string;
    date: string;
    opportunity: number;
    warning: number;
    suggestion: number;
    achievement: number;
    total: number;
  }[];
}

interface InsightStatsResponse {
  success: boolean;
  stats: InsightStats;
}

const fetcher = async (url: string): Promise<InsightStats> => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch insight stats');
  }
  const data: InsightStatsResponse = await res.json();
  if (!data.success) {
    throw new Error('Failed to fetch insight stats');
  }
  return data.stats;
};

export function useInsightStats() {
  const { data, error, isLoading, mutate } = useSWR<InsightStats>(
    '/api/insights/stats',
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 60000, // Refresh every minute
    }
  );

  return {
    stats: data,
    isLoading,
    error,
    refresh: mutate,
  };
}
