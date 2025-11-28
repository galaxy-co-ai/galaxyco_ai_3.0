"use client";

import * as React from "react";
import useSWR from "swr";
import { FinanceKPIGrid } from "./FinanceKPIGrid";
import { FinanceModuleGrid } from "./FinanceModuleGrid";
import { FinanceTimeline } from "./FinanceTimeline";
import { FinanceActivityTable } from "./FinanceActivityTable";
import { FinanceDetailDrawer } from "./FinanceDetailDrawer";
import { FinanceDatePicker } from "./FinanceDatePicker";
import { FinanceFilterChips } from "./FinanceFilterChips";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
  Plug,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  FinanceOverviewResponse,
  FinanceModulesResponse,
  TimelineResponse,
  ActivityResponse,
  FinanceIntegrationsResponse,
  DateRange,
  FinanceFilters,
  FinanceObject,
  FinanceProvider,
} from "@/types/finance";

/**
 * SWR fetcher function
 */
const fetcher = (url: string) => fetch(url).then((res) => res.json());

/**
 * Empty state when no integrations are connected
 */
function FinanceEmptyState() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <div className="mx-auto w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mb-6">
        <Plug className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-3">
        Connect Your Finance Tools
      </h2>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        Finance HQ brings all your financial data together in one place. Connect
        QuickBooks, Stripe, or Shopify to get started.
      </p>
      <Button asChild>
        <a href="/integrations" aria-label="Go to integrations page to connect finance tools">
          <Plug className="h-4 w-4 mr-2" aria-hidden="true" />
          Connect Integrations
        </a>
      </Button>
    </div>
  );
}

/**
 * Banner to reconnect expired integrations
 */
function ReconnectBanner({ provider }: { provider: FinanceProvider }) {
  const providerLabels: Record<FinanceProvider, string> = {
    quickbooks: "QuickBooks",
    stripe: "Stripe",
    shopify: "Shopify",
  };

  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
      role="alert"
    >
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Your {providerLabels[provider]} connection has expired. Reconnect to
          keep your data in sync.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
        asChild
      >
        <a href={`/integrations?reconnect=${provider}`}>
          <RefreshCw className="h-3 w-3 mr-2" aria-hidden="true" />
          Reconnect
        </a>
      </Button>
    </div>
  );
}

/**
 * Header section with title, date picker, and filters
 */
function FinanceHeader({
  dateRange,
  onDateRangeChange,
  filters,
  onFiltersChange,
  integrations,
}: {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  filters: FinanceFilters;
  onFiltersChange: (filters: FinanceFilters) => void;
  integrations?: FinanceIntegrationsResponse;
}) {
  return (
    <header className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-primary" aria-hidden="true" />
            Finance HQ
          </h1>
          <p className="text-muted-foreground mt-1">
            Your unified financial command center
          </p>
        </div>
        <div className="flex items-center gap-3">
          <FinanceDatePicker value={dateRange} onChange={onDateRangeChange} />
          <Button variant="outline" size="icon" aria-label="Ask Neptune AI">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <FinanceFilterChips
        filters={filters}
        onChange={onFiltersChange}
        integrations={integrations}
      />
    </header>
  );
}

interface FinanceHQDashboardProps {
  initialData?: FinanceOverviewResponse;
}

/**
 * Main Finance HQ Dashboard component.
 * Orchestrates data fetching and renders all financial sections.
 */
export function FinanceHQDashboard({ initialData }: FinanceHQDashboardProps) {
  // State
  const [dateRange, setDateRange] = React.useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });
  const [filters, setFilters] = React.useState<FinanceFilters>({
    sources: [],
  });
  const [selectedItem, setSelectedItem] = React.useState<FinanceObject | null>(
    null
  );
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // Build query string for date range
  const dateQuery = React.useMemo(
    () =>
      `start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`,
    [dateRange]
  );

  // Data fetching with SWR
  const {
    data: overview,
    error: overviewError,
    isLoading: overviewLoading,
  } = useSWR<FinanceOverviewResponse>(
    `/api/finance/overview?${dateQuery}`,
    fetcher,
    { fallbackData: initialData }
  );

  const { data: modules, isLoading: modulesLoading } =
    useSWR<FinanceModulesResponse>(`/api/finance/modules?${dateQuery}`, fetcher);

  const { data: timeline, isLoading: timelineLoading } =
    useSWR<TimelineResponse>(`/api/finance/timeline?${dateQuery}`, fetcher);

  const { data: activity, isLoading: activityLoading } =
    useSWR<ActivityResponse>(`/api/finance/activity?${dateQuery}`, fetcher);

  const { data: integrations, isLoading: integrationsLoading } =
    useSWR<FinanceIntegrationsResponse>("/api/finance/integrations", fetcher);

  // Handlers
  const handleItemClick = (item: FinanceObject) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    // Delay clearing item to allow close animation
    setTimeout(() => setSelectedItem(null), 300);
  };

  // Check for no integrations
  const hasIntegrations =
    integrations?.connected && integrations.connected.length > 0;
  const showEmptyState = !integrationsLoading && !hasIntegrations;

  if (showEmptyState) {
    return <FinanceEmptyState />;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <FinanceHeader
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        filters={filters}
        onFiltersChange={setFilters}
        integrations={integrations}
      />

      {/* Reconnect Banners */}
      {integrations?.expired?.map((provider) => (
        <ReconnectBanner key={provider} provider={provider} />
      ))}

      {/* KPI Row */}
      <FinanceKPIGrid kpis={overview?.kpis} isLoading={overviewLoading} />

      {/* Module Grid */}
      <FinanceModuleGrid
        modules={modules?.modules}
        isLoading={modulesLoading}
        filters={filters}
        onModuleClick={handleItemClick}
      />

      {/* Timeline */}
      <FinanceTimeline
        events={timeline?.events}
        isLoading={timelineLoading}
        onEventClick={handleItemClick}
      />

      {/* Activity Table */}
      <FinanceActivityTable
        transactions={activity?.transactions}
        isLoading={activityLoading}
        onRowClick={handleItemClick}
      />

      {/* Detail Drawer */}
      <FinanceDetailDrawer
        item={selectedItem}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
      />
    </main>
  );
}

