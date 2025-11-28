# Finance HQ — Component Architecture (GalaxyCo Tailored)

> **Document Purpose:** Defines every reusable component required for Finance HQ. All components follow GalaxyCo's existing patterns and use the established component library.

---

## 1. Component Organization

All Finance HQ components will be placed in:
```
src/components/finance-hq/
├── FinanceHQDashboard.tsx      # Main page component
├── FinanceKPIGrid.tsx          # KPI row container
├── FinanceKPITile.tsx          # Individual KPI card
├── FinanceModuleGrid.tsx       # Module grid container
├── FinanceModuleTile.tsx       # Individual module card
├── FinanceTimeline.tsx         # Horizontal timeline
├── FinanceActivityTable.tsx    # Recent transactions table
├── FinanceDetailDrawer.tsx     # Side panel for details
├── FinanceDatePicker.tsx       # Date range selector
├── FinanceFilterChips.tsx      # Source filter buttons
├── charts/
│   ├── RevenueChart.tsx        # Line chart for revenue
│   ├── ExpenseChart.tsx        # Donut chart for expenses
│   └── CashFlowChart.tsx       # Area chart for cash flow
└── index.ts                    # Barrel export
```

---

## 2. Component Categories

### Layout Components
- `FinanceHQDashboard` - Page shell and data orchestration
- `FinanceKPIGrid` - KPI row layout
- `FinanceModuleGrid` - Module tile grid layout

### Data Components
- `FinanceKPITile` - Individual KPI display
- `FinanceModuleTile` - Module card with chart/list
- `RevenueChart`, `ExpenseChart`, `CashFlowChart` - Visualizations

### Interaction Components
- `FinanceTimeline` - Horizontal event scroll
- `FinanceActivityTable` - Transaction table
- `FinanceDetailDrawer` - Detail side panel
- `FinanceDatePicker` - Date range control
- `FinanceFilterChips` - Source filtering

---

## 3. Layout Components

### 3.1 `FinanceHQDashboard`

**Purpose:** Root page component that orchestrates data fetching and renders all sections.

**File:** `src/components/finance-hq/FinanceHQDashboard.tsx`

**Pattern:** Follows `DashboardDashboard` from `/components/dashboard/DashboardDashboard.tsx`

```tsx
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
import { Sparkles, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { 
  FinanceOverview, 
  FinanceModule, 
  FinanceEvent, 
  FinanceTransaction,
  DateRange,
  FinanceFilters,
  FinanceObject
} from "@/types/finance";

interface FinanceHQDashboardProps {
  initialData?: FinanceOverview;
}

export function FinanceHQDashboard({ initialData }: FinanceHQDashboardProps) {
  // State
  const [dateRange, setDateRange] = React.useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });
  const [filters, setFilters] = React.useState<FinanceFilters>({
    sources: [],
  });
  const [selectedItem, setSelectedItem] = React.useState<FinanceObject | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // Data fetching with SWR
  const { data: overview, error: overviewError, isLoading: overviewLoading } = useSWR(
    `/api/finance/overview?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`,
    { fallbackData: initialData }
  );

  const { data: modules, isLoading: modulesLoading } = useSWR(
    `/api/finance/modules?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`
  );

  const { data: timeline, isLoading: timelineLoading } = useSWR(
    `/api/finance/timeline?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`
  );

  const { data: activity, isLoading: activityLoading } = useSWR(
    `/api/finance/activity?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`
  );

  const { data: integrations } = useSWR('/api/finance/integrations');

  // Handlers
  const handleItemClick = (item: FinanceObject) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedItem(null);
  };

  // Check for no integrations
  const hasIntegrations = integrations?.connected?.length > 0;

  if (!hasIntegrations && !overviewLoading) {
    return <FinanceEmptyState />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <FinanceHeader
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        filters={filters}
        onFiltersChange={setFilters}
        integrations={integrations}
      />

      {/* Reconnect Banners */}
      {integrations?.expired?.map((provider: string) => (
        <ReconnectBanner key={provider} provider={provider} />
      ))}

      {/* KPI Row */}
      <FinanceKPIGrid
        kpis={overview?.kpis}
        isLoading={overviewLoading}
      />

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
    </div>
  );
}
```

**Props:**
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `initialData` | `FinanceOverview` | No | Server-side fetched initial data |

**Internal State:**
| State | Type | Purpose |
|-------|------|---------|
| `dateRange` | `DateRange` | Controls data range for all fetches |
| `filters` | `FinanceFilters` | Source filtering |
| `selectedItem` | `FinanceObject \| null` | Item shown in detail drawer |
| `isDrawerOpen` | `boolean` | Drawer visibility |

---

### 3.2 `FinanceKPIGrid`

**Purpose:** Renders the row of KPI cards.

```tsx
interface FinanceKPIGridProps {
  kpis?: KPI[];
  isLoading?: boolean;
}

export function FinanceKPIGrid({ kpis, isLoading }: FinanceKPIGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <FinanceKPITileSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpis?.map((kpi) => (
        <FinanceKPITile key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}
```

---

### 3.3 `FinanceModuleGrid`

**Purpose:** Renders the grid of module tiles.

```tsx
interface FinanceModuleGridProps {
  modules?: FinanceModule[];
  isLoading?: boolean;
  filters: FinanceFilters;
  onModuleClick: (item: FinanceObject) => void;
}

export function FinanceModuleGrid({ 
  modules, 
  isLoading, 
  filters,
  onModuleClick 
}: FinanceModuleGridProps) {
  // Filter modules by source if filters applied
  const filteredModules = React.useMemo(() => {
    if (!modules) return [];
    if (filters.sources.length === 0) return modules;
    return modules.filter(m => filters.sources.includes(m.source));
  }, [modules, filters.sources]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <FinanceModuleTileSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredModules.map((module) => (
        <FinanceModuleTile 
          key={module.id} 
          module={module}
          onClick={onModuleClick}
        />
      ))}
    </div>
  );
}
```

---

## 4. Data Components

### 4.1 `FinanceKPITile`

**Purpose:** Individual KPI card display.

```tsx
interface KPI {
  id: string;
  label: string;
  value: number | string;
  formattedValue: string;
  delta?: number;
  deltaLabel?: string;
  icon: string; // Lucide icon name
  iconColor: string;
  iconBg: string;
}

interface FinanceKPITileProps {
  kpi: KPI;
}

export function FinanceKPITile({ kpi }: FinanceKPITileProps) {
  const Icon = getIconByName(kpi.icon);
  const isPositive = kpi.delta && kpi.delta >= 0;

  return (
    <Card className="p-4 md:p-6 rounded-2xl shadow-sm bg-gradient-to-br from-white to-gray-50/50 border-0 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className={cn("p-2 rounded-xl", kpi.iconBg)}>
          <Icon className={cn("h-5 w-5", kpi.iconColor)} />
        </div>
      </div>
      <div className="text-2xl md:text-3xl font-bold text-gray-900">
        {kpi.formattedValue}
      </div>
      <div className="text-sm text-gray-500 mt-1">{kpi.label}</div>
      {kpi.delta !== undefined && (
        <div className={cn(
          "text-xs mt-2 flex items-center gap-1",
          isPositive ? "text-green-600" : "text-red-600"
        )}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {isPositive ? "+" : ""}{kpi.delta}% {kpi.deltaLabel}
        </div>
      )}
    </Card>
  );
}
```

---

### 4.2 `FinanceModuleTile`

**Purpose:** Individual module card with chart or list preview.

```tsx
interface FinanceModule {
  id: string;
  title: string;
  source: 'quickbooks' | 'stripe' | 'shopify';
  type: 'chart' | 'list' | 'metric';
  icon: string;
  data: any; // Module-specific data
  lastUpdated: string;
}

interface FinanceModuleTileProps {
  module: FinanceModule;
  onClick: (item: FinanceObject) => void;
}

export function FinanceModuleTile({ module, onClick }: FinanceModuleTileProps) {
  const Icon = getIconByName(module.icon);
  const sourceColors = getSourceColors(module.source);

  return (
    <Card 
      className="p-6 rounded-2xl shadow-sm border-0 hover:shadow-md transition-all cursor-pointer group"
      onClick={() => onClick({ type: 'module', id: module.id, data: module })}
      role="button"
      tabIndex={0}
      aria-label={`View ${module.title} details`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", sourceColors.iconBg)}>
            <Icon className={cn("h-5 w-5", sourceColors.iconColor)} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
            <Badge className={cn("text-xs", sourceColors.badgeClass)}>
              {module.source}
            </Badge>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>

      {/* Module Content - varies by type */}
      <div className="h-32">
        {module.type === 'chart' && <ModuleChart data={module.data} />}
        {module.type === 'list' && <ModuleList items={module.data.items} />}
        {module.type === 'metric' && <ModuleMetric value={module.data.value} />}
      </div>

      <div className="text-xs text-gray-400 mt-4">
        Updated {formatRelativeTime(module.lastUpdated)}
      </div>
    </Card>
  );
}
```

---

## 5. Interaction Components

### 5.1 `FinanceTimeline`

**Purpose:** Horizontal scrolling timeline of financial events.

```tsx
interface FinanceEvent {
  id: string;
  type: 'invoice' | 'payout' | 'order' | 'expense' | 'refund';
  source: 'quickbooks' | 'stripe' | 'shopify';
  label: string;
  amount?: number;
  date: string;
}

interface FinanceTimelineProps {
  events?: FinanceEvent[];
  isLoading?: boolean;
  onEventClick: (item: FinanceObject) => void;
}

export function FinanceTimeline({ events, isLoading, onEventClick }: FinanceTimelineProps) {
  if (isLoading) {
    return <FinanceTimelineSkeleton />;
  }

  return (
    <Card className="p-6 rounded-2xl shadow-sm border-0">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Timeline</h3>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-4">
          {events?.map((event) => (
            <TimelineEvent 
              key={event.id} 
              event={event}
              onClick={() => onEventClick({ type: 'event', id: event.id, data: event })}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  );
}
```

---

### 5.2 `FinanceActivityTable`

**Purpose:** Unified transaction table.

```tsx
interface FinanceTransaction {
  id: string;
  date: string;
  source: 'quickbooks' | 'stripe' | 'shopify';
  type: 'income' | 'expense' | 'transfer' | 'fee' | 'refund';
  description: string;
  amount: number;
  status?: string;
}

interface FinanceActivityTableProps {
  transactions?: FinanceTransaction[];
  isLoading?: boolean;
  onRowClick: (item: FinanceObject) => void;
}

export function FinanceActivityTable({ 
  transactions, 
  isLoading, 
  onRowClick 
}: FinanceActivityTableProps) {
  if (isLoading) {
    return <FinanceActivityTableSkeleton />;
  }

  return (
    <Card className="rounded-2xl shadow-sm border-0 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions?.map((tx) => (
              <tr 
                key={tx.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onRowClick({ type: 'transaction', id: tx.id, data: tx })}
                role="button"
                tabIndex={0}
              >
                <td className="px-6 py-4 text-sm text-gray-500">
                  {formatDate(tx.date)}
                </td>
                <td className="px-6 py-4">
                  <SourceBadge source={tx.source} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 capitalize">
                  {tx.type}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                  {tx.description}
                </td>
                <td className="px-6 py-4 text-right">
                  <AmountDisplay amount={tx.amount} type={tx.type} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
```

---

### 5.3 `FinanceDetailDrawer`

**Purpose:** Side panel for viewing item details.

```tsx
interface FinanceDetailDrawerProps {
  item: FinanceObject | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FinanceDetailDrawer({ item, isOpen, onClose }: FinanceDetailDrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[480px] sm:max-w-[480px] p-0">
        {item && (
          <>
            <SheetHeader className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <SheetTitle>{getItemTitle(item)}</SheetTitle>
                <SourceBadge source={item.data.source} />
              </div>
            </SheetHeader>
            
            <ScrollArea className="flex-1 h-[calc(100vh-180px)]">
              <div className="px-6 py-4 space-y-4">
                <DetailContent item={item} />
              </div>
            </ScrollArea>
            
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <DetailActions item={item} onClose={onClose} />
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

---

### 5.4 `FinanceDatePicker` and `FinanceFilterChips`

```tsx
// Date picker using react-day-picker (already in project)
interface FinanceDatePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

// Filter chips for source filtering
interface FinanceFilterChipsProps {
  filters: FinanceFilters;
  onChange: (filters: FinanceFilters) => void;
  integrations?: { connected: string[] };
}
```

---

## 6. Helper Components

### Source Badge
```tsx
function SourceBadge({ source }: { source: string }) {
  const colors = {
    quickbooks: "bg-emerald-50 text-emerald-700 border-emerald-200",
    stripe: "bg-indigo-50 text-indigo-700 border-indigo-200",
    shopify: "bg-lime-50 text-lime-700 border-lime-200",
  };

  return (
    <Badge className={cn("text-xs border", colors[source as keyof typeof colors])}>
      {source}
    </Badge>
  );
}
```

### Amount Display
```tsx
function AmountDisplay({ amount, type }: { amount: number; type: string }) {
  const isNegative = type === 'expense' || type === 'fee' || type === 'refund';
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(amount));

  return (
    <span className={cn(
      "text-sm font-medium font-mono",
      isNegative ? "text-red-600" : "text-green-600"
    )}>
      {isNegative ? "-" : "+"}{formatted}
    </span>
  );
}
```

### Skeleton Components
Each component should have a corresponding skeleton for loading states.

---

## 7. Component Dependencies

All Finance HQ components depend on:
- `/components/ui/*` - Base UI components
- `/lib/utils` - `cn()` utility
- `lucide-react` - Icons
- `swr` - Data fetching
- `react-day-picker` - Date selection

---

## End of Component Architecture

