"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { FinanceKPIGrid } from "./FinanceKPIGrid";
import { FinanceModuleGrid } from "./FinanceModuleGrid";
import { FinanceTimeline } from "./FinanceTimeline";
import { FinanceActivityTable } from "./FinanceActivityTable";
import { FinanceDetailDrawer } from "./FinanceDetailDrawer";
import { FinanceDatePicker } from "./FinanceDatePicker";
import { FinanceFilterChips } from "./FinanceFilterChips";
import { FinanceActionButtons, type FinanceAction } from "./FinanceActionButtons";
import { DocumentCreatorDialog, type DocumentType } from "./document-creator";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
  Plug,
  TrendingUp,
  FlaskConical,
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
  KPI,
  FinanceModule,
  FinanceEvent,
  FinanceTransaction,
} from "@/types/finance";

// ============================================================================
// DEMO MODE DATA - Sample data for previewing Finance HQ without integrations
// ============================================================================

const DEMO_KPIS: KPI[] = [
  {
    id: "revenue",
    label: "Revenue",
    value: 127450,
    formattedValue: "$127,450",
    delta: 12.5,
    deltaLabel: "vs last month",
    icon: "TrendingUp",
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-100",
  },
  {
    id: "expenses",
    label: "Expenses",
    value: 42800,
    formattedValue: "$42,800",
    delta: -8.3,
    deltaLabel: "vs last month",
    icon: "TrendingDown",
    iconColor: "text-rose-600",
    iconBg: "bg-rose-100",
  },
  {
    id: "profit",
    label: "Net Profit",
    value: 84650,
    formattedValue: "$84,650",
    delta: 18.2,
    deltaLabel: "vs last month",
    icon: "DollarSign",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
  },
  {
    id: "outstanding",
    label: "Outstanding",
    value: 23400,
    formattedValue: "$23,400",
    delta: -5.1,
    deltaLabel: "3 invoices",
    icon: "Clock",
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
  },
];

const DEMO_MODULES: FinanceModule[] = [
  // Top row: Lists
  {
    id: "projects",
    title: "Recent Projects",
    source: "quickbooks",
    type: "list",
    icon: "FolderKanban",
    data: {
      items: [
        { id: "proj-001", title: "Project #2401", subtitle: "Kitchen Remodel", amount: 45000, status: "active" },
        { id: "proj-002", title: "Project #2398", subtitle: "Bathroom Addition", amount: 28500, status: "active" },
        { id: "proj-003", title: "Project #2395", subtitle: "Deck Construction", amount: 18200, status: "completed" },
        { id: "proj-004", title: "Project #2392", subtitle: "Home Office", amount: 12800, status: "active" },
      ],
      total: 12,
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "invoices",
    title: "Recent Invoices",
    source: "quickbooks",
    type: "list",
    icon: "FileText",
    data: {
      items: [
        { id: "inv-001", title: "Acme Corp", subtitle: "Due Dec 5", amount: 12500, status: "unpaid" },
        { id: "inv-002", title: "TechStart Inc", subtitle: "Due Dec 10", amount: 8400, status: "unpaid" },
        { id: "inv-003", title: "Global Solutions", subtitle: "Paid Nov 28", amount: 15000, status: "paid" },
        { id: "inv-004", title: "Startup Labs", subtitle: "Overdue", amount: 2500, status: "overdue" },
      ],
      total: 24,
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "expenses",
    title: "Recent Expenses",
    source: "quickbooks",
    type: "list",
    icon: "Receipt",
    data: {
      items: [
        { id: "exp-001", title: "Lumber Supply Co", subtitle: "Materials", amount: 3240, status: "paid" },
        { id: "exp-002", title: "Home Depot", subtitle: "Tools", amount: 890, status: "paid" },
        { id: "exp-003", title: "Payroll - Week 47", subtitle: "Labor", amount: 8500, status: "pending" },
        { id: "exp-004", title: "Insurance Premium", subtitle: "Monthly", amount: 450, status: "paid" },
      ],
      total: 156,
    },
    lastUpdated: new Date().toISOString(),
  },
  // Bottom row: Trend charts with curved lines
  {
    id: "revenue-trend",
    title: "Revenue Trend",
    source: "stripe",
    type: "chart",
    icon: "TrendingUp",
    data: {
      type: "line",
      dataPoints: [
        { label: "Aug", value: 82000 },
        { label: "Sep", value: 95000 },
        { label: "Oct", value: 88000 },
        { label: "Nov", value: 102000 },
        { label: "Dec", value: 98000 },
        { label: "Jan", value: 115000 },
        { label: "Feb", value: 127450 },
      ],
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "expense-trend",
    title: "Expense Trend",
    source: "quickbooks",
    type: "chart",
    icon: "TrendingDown",
    data: {
      type: "line",
      dataPoints: [
        { label: "Aug", value: 48000 },
        { label: "Sep", value: 52000 },
        { label: "Oct", value: 45000 },
        { label: "Nov", value: 49000 },
        { label: "Dec", value: 44000 },
        { label: "Jan", value: 46000 },
        { label: "Feb", value: 42800 },
      ],
    },
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "profit-trend",
    title: "Net Profit Trend",
    source: "stripe",
    type: "chart",
    icon: "DollarSign",
    data: {
      type: "line",
      dataPoints: [
        { label: "Aug", value: 34000 },
        { label: "Sep", value: 43000 },
        { label: "Oct", value: 43000 },
        { label: "Nov", value: 53000 },
        { label: "Dec", value: 54000 },
        { label: "Jan", value: 69000 },
        { label: "Feb", value: 84650 },
      ],
    },
    lastUpdated: new Date().toISOString(),
  },
];

const DEMO_TIMELINE: FinanceEvent[] = [
  {
    id: "evt-1",
    type: "invoice_paid",
    source: "quickbooks",
    label: "Invoice Paid",
    description: "Global Solutions - $15,000",
    amount: 15000,
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "evt-2",
    type: "order",
    source: "shopify",
    label: "New Order",
    description: "Order #1247 - Sarah M.",
    amount: 249,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "evt-3",
    type: "payout",
    source: "stripe",
    label: "Payout Processed",
    description: "Bank transfer complete",
    amount: 12500,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "evt-4",
    type: "invoice_created",
    source: "quickbooks",
    label: "Invoice Created",
    description: "TechStart Inc - $8,400",
    amount: 8400,
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "evt-5",
    type: "expense",
    source: "quickbooks",
    label: "Expense Recorded",
    description: "Software subscriptions",
    amount: -850,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "evt-6",
    type: "order",
    source: "shopify",
    label: "New Order",
    description: "Order #1246 - John D.",
    amount: 189,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "evt-7",
    type: "refund",
    source: "stripe",
    label: "Refund Issued",
    description: "Customer refund",
    amount: -75,
    date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEMO_TRANSACTIONS: FinanceTransaction[] = [
  {
    id: "txn-1",
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    source: "stripe",
    type: "income",
    description: "Payment from Acme Corp",
    amount: 12500,
    currency: "USD",
    status: "completed",
    externalId: "ch_abc123",
  },
  {
    id: "txn-2",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    source: "shopify",
    type: "income",
    description: "Order #1247",
    amount: 249,
    currency: "USD",
    status: "completed",
    externalId: "ord_xyz456",
  },
  {
    id: "txn-3",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    source: "stripe",
    type: "fee",
    description: "Stripe processing fee",
    amount: -36.25,
    currency: "USD",
    status: "completed",
    externalId: "fee_def789",
  },
  {
    id: "txn-4",
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    source: "quickbooks",
    type: "expense",
    description: "Office supplies",
    amount: -245.50,
    currency: "USD",
    status: "completed",
    externalId: "exp_ghi012",
  },
  {
    id: "txn-5",
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    source: "shopify",
    type: "income",
    description: "Order #1246",
    amount: 189,
    currency: "USD",
    status: "completed",
    externalId: "ord_jkl345",
  },
  {
    id: "txn-6",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    source: "stripe",
    type: "refund",
    description: "Customer refund - Order #1240",
    amount: -75,
    currency: "USD",
    status: "completed",
    externalId: "re_mno678",
  },
];

const DEMO_INTEGRATIONS: FinanceIntegrationsResponse = {
  connected: ["quickbooks", "stripe", "shopify"],
  expired: [],
  available: [],
  details: {
    quickbooks: {
      status: "connected",
      connectedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastSyncAt: new Date().toISOString(),
      accountName: "Demo Company LLC",
    },
    stripe: {
      status: "connected",
      connectedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      lastSyncAt: new Date().toISOString(),
      accountName: "demo_acct_123",
    },
    shopify: {
      status: "connected",
      connectedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      lastSyncAt: new Date().toISOString(),
      accountName: "demo-store.myshopify.com",
    },
  },
};

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
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild>
          <a href="/connected-apps" aria-label="Go to connected apps page to connect finance tools">
            <Plug className="h-4 w-4 mr-2" aria-hidden="true" />
            Connect Integrations
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/finance?demo=true" aria-label="Preview Finance HQ with demo data">
            <FlaskConical className="h-4 w-4 mr-2" aria-hidden="true" />
            Preview Demo
          </a>
        </Button>
      </div>
    </div>
  );
}

/**
 * Demo mode banner
 */
function DemoModeBanner() {
  return (
    <div
      className="flex items-center justify-between p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 mb-6"
      role="status"
    >
      <div className="flex items-center gap-3">
        <FlaskConical className="h-5 w-5 text-violet-600 dark:text-violet-400" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-violet-800 dark:text-violet-200">
            Demo Mode Active
          </p>
          <p className="text-xs text-violet-600 dark:text-violet-400">
            Viewing sample data. Connect real integrations to see your actual finances.
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="border-violet-300 text-violet-700 hover:bg-violet-100 dark:border-violet-700 dark:text-violet-300 dark:hover:bg-violet-900/30"
        asChild
      >
        <a href="/finance">
          Exit Demo
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
        <a href={`/connected-apps?reconnect=${provider}`}>
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
  onAction,
}: {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  filters: FinanceFilters;
  onFiltersChange: (filters: FinanceFilters) => void;
  integrations?: FinanceIntegrationsResponse;
  onAction?: (action: FinanceAction) => void;
}) {
  return (
    <header className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Left: Title */}
        <div className="sm:flex-1">
          <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
            Finance HQ
          </h1>
          <p className="text-sm text-muted-foreground">
            Your unified financial command center
          </p>
        </div>
        {/* Center: Date Picker */}
        <div className="flex items-center justify-center gap-2">
          <FinanceDatePicker value={dateRange} onChange={onDateRangeChange} />
          <Button variant="outline" size="sm" className="h-8" aria-label="Ask Neptune AI">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
        {/* Right: Spacer for balance */}
        <div className="hidden sm:block sm:flex-1" />
      </div>
      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <FinanceFilterChips
          filters={filters}
          onChange={onFiltersChange}
          integrations={integrations}
        />
        <FinanceActionButtons onAction={onAction} />
      </div>
    </header>
  );
}

interface FinanceHQDashboardProps {
  initialData?: FinanceOverviewResponse;
}

/**
 * Main Finance HQ Dashboard component.
 * Orchestrates data fetching and renders all financial sections.
 * Supports demo mode via ?demo=true URL parameter.
 */
export function FinanceHQDashboard({ initialData }: FinanceHQDashboardProps) {
  // Check for demo mode
  const searchParams = useSearchParams();
  const isDemoMode = searchParams.get("demo") === "true";

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

  // Data fetching with SWR (skip in demo mode)
  const {
    data: overview,
    isLoading: overviewLoading,
  } = useSWR<FinanceOverviewResponse>(
    isDemoMode ? null : `/api/finance/overview?${dateQuery}`,
    fetcher,
    { fallbackData: initialData }
  );

  const { data: modules, isLoading: modulesLoading } =
    useSWR<FinanceModulesResponse>(
      isDemoMode ? null : `/api/finance/modules?${dateQuery}`,
      fetcher
    );

  const { data: timeline, isLoading: timelineLoading } =
    useSWR<TimelineResponse>(
      isDemoMode ? null : `/api/finance/timeline?${dateQuery}`,
      fetcher
    );

  const { data: activity, isLoading: activityLoading } =
    useSWR<ActivityResponse>(
      isDemoMode ? null : `/api/finance/activity?${dateQuery}`,
      fetcher
    );

  const { data: integrations, isLoading: integrationsLoading } =
    useSWR<FinanceIntegrationsResponse>(
      isDemoMode ? null : "/api/finance/integrations",
      fetcher
    );

  // Use demo data when in demo mode
  const displayOverview = isDemoMode ? { kpis: DEMO_KPIS, summary: { revenue: 127450, expenses: 42800, profit: 84650, cashflow: 84650, outstandingInvoices: 23400 }, bySource: {} } : overview;
  const displayModules = isDemoMode ? { modules: DEMO_MODULES } : modules;
  const displayTimeline = isDemoMode ? { events: DEMO_TIMELINE } : timeline;
  const displayActivity = isDemoMode ? { transactions: DEMO_TRANSACTIONS, pagination: { hasMore: false, total: DEMO_TRANSACTIONS.length } } : activity;
  const displayIntegrations = isDemoMode ? DEMO_INTEGRATIONS : integrations;

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

  // Document creator state
  const [isDocCreatorOpen, setIsDocCreatorOpen] = React.useState(false);
  const [docCreatorType, setDocCreatorType] = React.useState<DocumentType>("estimate");

  const handleAction = (action: FinanceAction) => {
    // Map action to document type and open creator
    const actionToDocType: Record<string, DocumentType> = {
      create_estimate: "estimate",
      create_change_order: "change_order",
      create_invoice: "invoice",
      create_receipt: "receipt",
      create_expense: "expense",
      record_payment: "payment",
    };

    const docType = actionToDocType[action];
    if (docType) {
      setDocCreatorType(docType);
      setIsDocCreatorOpen(true);
      return;
    }

    // Handle report actions
    switch (action) {
      case "report_pnl":
      case "report_cashflow":
      case "report_balance":
        // Would generate/navigate to report view
        break;
      case "export_csv":
      case "export_pdf":
        // Would trigger export
        break;
    }
  };

  // Check for no integrations (but not in demo mode)
  const hasIntegrations =
    displayIntegrations?.connected && displayIntegrations.connected.length > 0;
  const showEmptyState = !isDemoMode && !integrationsLoading && !hasIntegrations;

  if (showEmptyState) {
    return <FinanceEmptyState />;
  }

  // In demo mode, never show loading states
  const isOverviewLoading = isDemoMode ? false : overviewLoading;
  const isModulesLoading = isDemoMode ? false : modulesLoading;
  const isTimelineLoading = isDemoMode ? false : timelineLoading;
  const isActivityLoading = isDemoMode ? false : activityLoading;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Demo Mode Banner */}
      {isDemoMode && <DemoModeBanner />}

      {/* Header */}
      <FinanceHeader
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        filters={filters}
        onFiltersChange={setFilters}
        integrations={displayIntegrations}
        onAction={handleAction}
      />

      {/* Reconnect Banners */}
      {displayIntegrations?.expired?.map((provider) => (
        <ReconnectBanner key={provider} provider={provider} />
      ))}

      {/* KPI Row */}
      <FinanceKPIGrid kpis={displayOverview?.kpis} isLoading={isOverviewLoading} />

      {/* Module Grid */}
      <FinanceModuleGrid
        modules={displayModules?.modules}
        isLoading={isModulesLoading}
        filters={filters}
        onModuleClick={handleItemClick}
      />

      {/* Timeline */}
      <FinanceTimeline
        events={displayTimeline?.events}
        isLoading={isTimelineLoading}
        onEventClick={handleItemClick}
      />

      {/* Activity Table */}
      <FinanceActivityTable
        transactions={displayActivity?.transactions}
        isLoading={isActivityLoading}
        onRowClick={handleItemClick}
      />

      {/* Detail Drawer */}
      <FinanceDetailDrawer
        item={selectedItem}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
      />

      {/* Document Creator Dialog */}
      <DocumentCreatorDialog
        open={isDocCreatorOpen}
        onOpenChange={setIsDocCreatorOpen}
        documentType={docCreatorType}
        onSave={async (document, asDraft) => {
          // TODO: Save document to Library and sync with external software
          console.log("Saving document:", { document, asDraft });
          // After saving, could refresh relevant data
        }}
      />
    </main>
  );
}

