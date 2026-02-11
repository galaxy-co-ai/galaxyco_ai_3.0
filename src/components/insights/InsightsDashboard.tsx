'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  InsightsByTierChart,
  InsightsBySurfaceChart,
  ConfidenceDistributionChart,
  InsightsTrendChart,
} from './charts';
import { useInsightStats } from '@/lib/hooks/use-insight-stats';
import {
  Lightbulb,
  AlertTriangle,
  Target,
  TrendingUp,
  X,
  Sparkles,
  BarChart3,
  Zap,
  Brain,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProactiveInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'suggestion' | 'achievement';
  category: 'sales' | 'marketing' | 'operations' | 'finance' | 'content';
  title: string;
  description: string;
  priority: number;
  suggestedActions: Array<{
    action: string;
    toolName?: string;
    args?: Record<string, unknown>;
  }>;
  autoExecutable: boolean;
  createdAt: string;
}

interface InsightsDashboardProps {
  maxInsights?: number;
  showFilters?: boolean;
  compact?: boolean;
}

const INSIGHT_TYPE_CONFIG = {
  opportunity: {
    icon: Target,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 dark:bg-teal-950/30',
    borderColor: 'border-teal-200 dark:border-teal-800',
    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  suggestion: {
    icon: Lightbulb,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  achievement: {
    icon: Sparkles,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200 dark:border-purple-800',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
};

const CATEGORY_LABELS = {
  sales: 'Sales',
  marketing: 'Marketing',
  operations: 'Operations',
  finance: 'Finance',
  content: 'Content',
};

interface ActiveFilters {
  type: string | null;
  category: string | null;
}

export function InsightsDashboard({
  maxInsights = 10,
  showFilters = true,
  compact = false,
}: InsightsDashboardProps) {
  const [insights, setInsights] = useState<ProactiveInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState<Record<string, boolean>>({});
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    type: null,
    category: null,
  });
  const [activeTab, setActiveTab] = useState('all');

  const { stats, isLoading: statsLoading } = useInsightStats();

  useEffect(() => {
    fetchInsights();
  }, []);

  async function fetchInsights() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('limit', maxInsights.toString());

      const response = await fetch(`/api/insights?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setInsights(data.insights || []);
      }
    } catch (error) {
      console.error('Failed to fetch insights', error);
    } finally {
      setLoading(false);
    }
  }

  async function dismissInsight(insightId: string) {
    try {
      setDismissing((prev) => ({ ...prev, [insightId]: true }));

      const response = await fetch(`/api/insights/${insightId}/dismiss`, {
        method: 'POST',
      });

      if (response.ok) {
        setInsights((prev) => prev.filter((i) => i.id !== insightId));
      }
    } catch (error) {
      console.error('Failed to dismiss insight', error);
    } finally {
      setDismissing((prev) => ({ ...prev, [insightId]: false }));
    }
  }

  // Filter insights based on active filters and tab
  const filteredInsights = useMemo(() => {
    return insights.filter((insight) => {
      // Tab filter
      if (activeTab !== 'all' && insight.type !== activeTab) {
        return false;
      }

      // Chart-based filters
      if (activeFilters.type && insight.type !== activeFilters.type) {
        return false;
      }
      if (activeFilters.category && insight.category !== activeFilters.category) {
        return false;
      }

      return true;
    });
  }, [insights, activeTab, activeFilters]);

  const handleTypeClick = (type: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      type: prev.type === type ? null : type,
    }));
  };

  const handleCategoryClick = (category: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      category: prev.category === category ? null : category,
    }));
  };

  const clearFilters = () => {
    setActiveFilters({ type: null, category: null });
    setActiveTab('all');
  };

  const hasActiveFilters = activeFilters.type || activeFilters.category || activeTab !== 'all';

  // Render loading skeleton for the entire dashboard
  if (loading && statsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* KPI Stat Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Insights"
          value={stats?.total ?? 0}
          icon={Brain}
          loading={statsLoading}
          accentColor="var(--chart-1)"
        />
        <StatCard
          title="High Priority"
          value={stats?.highConfidenceCount ?? 0}
          subtitle={`of ${stats?.total ?? 0} total`}
          icon={Zap}
          loading={statsLoading}
          accentColor="var(--chart-3)"
        />
        <StatCard
          title="Opportunities"
          value={stats?.byType.opportunity ?? 0}
          icon={Target}
          loading={statsLoading}
          accentColor="var(--chart-4)"
        />
        <StatCard
          title="Avg Priority"
          value={stats?.averagePriority ? `${stats.averagePriority}/10` : '—'}
          icon={BarChart3}
          loading={statsLoading}
          accentColor="var(--chart-2)"
        />
        <StatCard
          title="This Week"
          value={stats?.weekOverWeek.thisWeek ?? 0}
          trend={
            stats?.weekOverWeek.lastWeek !== undefined
              ? {
                  value: stats.weekOverWeek.changePercent,
                  label: 'vs last week',
                }
              : undefined
          }
          icon={Activity}
          loading={statsLoading}
          accentColor="var(--chart-5)"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Insights by Tier - Donut Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Insights by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <InsightsByTierChart
              data={stats?.byType ?? { opportunity: 0, warning: 0, suggestion: 0, achievement: 0 }}
              onSegmentClick={handleTypeClick}
              activeSegment={activeFilters.type}
              loading={statsLoading}
            />
          </CardContent>
        </Card>

        {/* Insights by Decision Surface - Horizontal Bar */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <InsightsBySurfaceChart
              data={
                stats?.byCategory ?? {
                  sales: 0,
                  marketing: 0,
                  operations: 0,
                  finance: 0,
                  content: 0,
                }
              }
              onBarClick={handleCategoryClick}
              activeBar={activeFilters.category}
              loading={statsLoading}
            />
          </CardContent>
        </Card>

        {/* Confidence Distribution - Histogram */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ConfidenceDistributionChart
              data={stats?.confidenceDistribution ?? []}
              loading={statsLoading}
            />
          </CardContent>
        </Card>

        {/* Trend Over Time - Area Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Trend Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <InsightsTrendChart data={stats?.trendData ?? []} loading={statsLoading} />
          </CardContent>
        </Card>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {activeTab !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Type: {activeTab}
              <button onClick={() => setActiveTab('all')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {activeFilters.type && (
            <Badge variant="secondary" className="gap-1">
              Type: {activeFilters.type}
              <button
                onClick={() => setActiveFilters((p) => ({ ...p, type: null }))}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {activeFilters.category && (
            <Badge variant="secondary" className="gap-1">
              Category: {CATEGORY_LABELS[activeFilters.category as keyof typeof CATEGORY_LABELS]}
              <button
                onClick={() => setActiveFilters((p) => ({ ...p, category: null }))}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
            Clear all
          </Button>
        </div>
      )}

      {/* Tabbed Insights List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">
            All
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
              {insights.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="opportunity">
            Opportunities
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs hidden sm:inline-flex">
              {insights.filter((i) => i.type === 'opportunity').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="warning">
            Warnings
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs hidden sm:inline-flex">
              {insights.filter((i) => i.type === 'warning').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="suggestion">
            Suggestions
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs hidden sm:inline-flex">
              {insights.filter((i) => i.type === 'suggestion').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="achievement">
            Achievements
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs hidden sm:inline-flex">
              {insights.filter((i) => i.type === 'achievement').length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <InsightsListSkeleton />
          ) : filteredInsights.length === 0 ? (
            <Card className="p-8 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-1">No Insights Found</h3>
              <p className="text-sm text-muted-foreground">
                {hasActiveFilters
                  ? 'No insights match your current filters. Try adjusting or clearing them.'
                  : "Keep working and we'll surface intelligent insights for you soon!"}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4">
                  Clear Filters
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredInsights.map((insight) => {
                const config = INSIGHT_TYPE_CONFIG[insight.type];
                const Icon = config.icon;

                return (
                  <Card
                    key={insight.id}
                    className={cn(
                      'relative overflow-hidden transition-all hover:shadow-md',
                      config.borderColor,
                      'border-l-4'
                    )}
                  >
                    <div className={cn('absolute inset-0 opacity-5', config.bgColor)} />

                    <div className="relative p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={cn('p-2 rounded-lg', config.bgColor)}>
                            <Icon className={cn('h-5 w-5', config.color)} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <h4 className="font-medium text-sm leading-tight">{insight.title}</h4>
                              <Badge variant="secondary" className={cn('text-xs', config.badge)}>
                                {insight.type}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {CATEGORY_LABELS[insight.category]}
                              </Badge>
                              {insight.priority >= 8 && (
                                <Badge variant="destructive" className="text-xs">
                                  High Priority
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {insight.description}
                            </p>

                            {/* Suggested Actions */}
                            {insight.suggestedActions && insight.suggestedActions.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border/50">
                                <p className="text-xs text-muted-foreground mb-2">
                                  Suggested actions:
                                </p>
                                <div className="space-y-1.5">
                                  {insight.suggestedActions.map((action, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-xs">
                                      <span className="text-muted-foreground">→</span>
                                      <span>{action.action}</span>
                                      {action.toolName && (
                                        <Badge variant="outline" className="text-xs px-1.5 py-0">
                                          {action.toolName}
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {!compact && (
                              <div className="mt-3 text-xs text-muted-foreground">
                                {new Date(insight.createdAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dismiss Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 shrink-0"
                          onClick={() => dismissInsight(insight.id)}
                          disabled={dismissing[insight.id]}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Skeleton Components
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="space-y-2">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-8 w-16 bg-muted rounded" />
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            </CardHeader>
            <CardContent>
              <div className="h-[250px] bg-muted/30 rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>

      <InsightsListSkeleton />
    </div>
  );
}

function InsightsListSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-4 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 bg-muted rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-muted rounded" />
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-2/3 bg-muted rounded" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
