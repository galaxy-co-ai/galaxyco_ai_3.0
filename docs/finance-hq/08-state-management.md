# Finance HQ — State Management Specification (GalaxyCo Tailored)

> **Document Purpose:** Defines client-side state management for Finance HQ using GalaxyCo's existing patterns: **SWR for data fetching** and **React Context for UI state**. NOT Zustand.

---

## 1. State Management Approach

GalaxyCo uses:
- **SWR** for server state (data fetching, caching, revalidation)
- **React Context** for shared UI state (when needed)
- **Component state** (`useState`) for local UI state

Finance HQ follows these same patterns.

### Why NOT Zustand?
The original spec mentioned Zustand, but GalaxyCo doesn't use it. Adding Zustand would:
- Introduce unnecessary dependency
- Create inconsistency with existing patterns
- Add learning curve for future contributors

**SWR + Context is sufficient** for Finance HQ's needs.

---

## 2. State Categories

| Category | Tool | Scope | Examples |
|----------|------|-------|----------|
| **Server State** | SWR | Global (cached) | KPIs, modules, transactions |
| **Filter State** | React Context | Page-wide | Date range, source filters |
| **UI State** | useState | Component | Drawer open, selected item |

---

## 3. SWR Data Fetching Pattern

### Base Fetcher
```typescript
// Already exists in GalaxyCo
const fetcher = (url: string) => fetch(url).then((r) => r.json());
```

### Finance Data Hooks

Create `/src/hooks/useFinanceData.ts`:

```typescript
'use client';

import useSWR from 'swr';
import type { 
  FinanceOverview, 
  FinanceModulesResponse,
  TimelineResponse,
  ActivityResponse,
  FinanceIntegrationsResponse 
} from '@/types/finance';

const fetcher = (url: string) => fetch(url).then(r => {
  if (!r.ok) throw new Error('Failed to fetch');
  return r.json();
});

// Build query string from date range
function buildQuery(dateRange: DateRange): string {
  return `start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`;
}

// Hook for finance overview/KPIs
export function useFinanceOverview(dateRange: DateRange) {
  return useSWR<FinanceOverview>(
    `/api/finance/overview?${buildQuery(dateRange)}`,
    fetcher,
    {
      refreshInterval: 180000, // 3 minutes
      revalidateOnFocus: true,
      dedupingInterval: 60000, // 1 minute dedup
    }
  );
}

// Hook for finance modules
export function useFinanceModules(dateRange: DateRange) {
  return useSWR<FinanceModulesResponse>(
    `/api/finance/modules?${buildQuery(dateRange)}`,
    fetcher,
    {
      refreshInterval: 300000, // 5 minutes
      revalidateOnFocus: true,
    }
  );
}

// Hook for timeline
export function useFinanceTimeline(dateRange: DateRange) {
  return useSWR<TimelineResponse>(
    `/api/finance/timeline?${buildQuery(dateRange)}`,
    fetcher,
    {
      refreshInterval: 180000,
    }
  );
}

// Hook for activity table
export function useFinanceActivity(dateRange: DateRange, cursor?: string) {
  const params = new URLSearchParams(buildQuery(dateRange));
  if (cursor) params.set('cursor', cursor);
  
  return useSWR<ActivityResponse>(
    `/api/finance/activity?${params.toString()}`,
    fetcher,
    {
      refreshInterval: 120000, // 2 minutes
    }
  );
}

// Hook for integration status
export function useFinanceIntegrations() {
  return useSWR<FinanceIntegrationsResponse>(
    '/api/finance/integrations',
    fetcher,
    {
      refreshInterval: 60000, // 1 minute
      revalidateOnFocus: true,
    }
  );
}

// Combined hook for initial page load
export function useFinanceData(dateRange: DateRange) {
  const overview = useFinanceOverview(dateRange);
  const modules = useFinanceModules(dateRange);
  const timeline = useFinanceTimeline(dateRange);
  const activity = useFinanceActivity(dateRange);
  const integrations = useFinanceIntegrations();

  return {
    overview,
    modules,
    timeline,
    activity,
    integrations,
    isLoading: overview.isLoading || modules.isLoading,
    hasError: overview.error || modules.error,
  };
}
```

---

## 4. Filter State with React Context

For page-wide filter state (date range, source filters), use React Context:

### Finance Filter Context

Create `/src/components/finance-hq/FinanceFilterContext.tsx`:

```typescript
'use client';

import * as React from 'react';

// Types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface FinanceFilters {
  sources: Array<'quickbooks' | 'stripe' | 'shopify'>;
}

interface FinanceFilterContextValue {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  filters: FinanceFilters;
  setFilters: (filters: FinanceFilters) => void;
  resetFilters: () => void;
}

// Default values
const DEFAULT_DATE_RANGE: DateRange = {
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  end: new Date(),
};

const DEFAULT_FILTERS: FinanceFilters = {
  sources: [], // Empty = all sources
};

// Context
const FinanceFilterContext = React.createContext<FinanceFilterContextValue | null>(null);

// Provider
export function FinanceFilterProvider({ children }: { children: React.ReactNode }) {
  const [dateRange, setDateRange] = React.useState<DateRange>(DEFAULT_DATE_RANGE);
  const [filters, setFilters] = React.useState<FinanceFilters>(DEFAULT_FILTERS);

  const resetFilters = React.useCallback(() => {
    setDateRange(DEFAULT_DATE_RANGE);
    setFilters(DEFAULT_FILTERS);
  }, []);

  const value = React.useMemo(
    () => ({
      dateRange,
      setDateRange,
      filters,
      setFilters,
      resetFilters,
    }),
    [dateRange, filters, resetFilters]
  );

  return (
    <FinanceFilterContext.Provider value={value}>
      {children}
    </FinanceFilterContext.Provider>
  );
}

// Hook
export function useFinanceFilters() {
  const context = React.useContext(FinanceFilterContext);
  if (!context) {
    throw new Error('useFinanceFilters must be used within FinanceFilterProvider');
  }
  return context;
}
```

### Usage in Page

```typescript
// In FinanceHQDashboard.tsx
import { FinanceFilterProvider, useFinanceFilters } from './FinanceFilterContext';

function FinanceHQContent() {
  const { dateRange, filters } = useFinanceFilters();
  const { overview, modules, timeline, activity, integrations } = useFinanceData(dateRange);
  
  // Filter modules by source
  const filteredModules = React.useMemo(() => {
    if (!modules.data?.modules) return [];
    if (filters.sources.length === 0) return modules.data.modules;
    return modules.data.modules.filter(m => filters.sources.includes(m.source));
  }, [modules.data, filters.sources]);

  // ... rest of component
}

export function FinanceHQDashboard() {
  return (
    <FinanceFilterProvider>
      <FinanceHQContent />
    </FinanceFilterProvider>
  );
}
```

---

## 5. UI State (Component-Level)

Local UI state stays in components using `useState`:

```typescript
function FinanceHQContent() {
  // UI state - local to component
  const [selectedItem, setSelectedItem] = React.useState<FinanceObject | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  // Handlers
  const handleItemClick = (item: FinanceObject) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    // Optional: delay clearing selection for animation
    setTimeout(() => setSelectedItem(null), 300);
  };

  // ...
}
```

---

## 6. State Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Finance HQ Page                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │           FinanceFilterProvider (Context)            │    │
│  │                                                      │    │
│  │  dateRange ────────────┐                            │    │
│  │  filters ─────────────┐│                            │    │
│  │                       ││                            │    │
│  │  ┌────────────────────┴┴───────────────────────┐   │    │
│  │  │         SWR Hooks (Server State)             │   │    │
│  │  │                                              │   │    │
│  │  │  useFinanceOverview(dateRange) ──► KPIs     │   │    │
│  │  │  useFinanceModules(dateRange) ──► Modules   │   │    │
│  │  │  useFinanceTimeline(dateRange) ──► Events   │   │    │
│  │  │  useFinanceActivity(dateRange) ──► Table    │   │    │
│  │  │  useFinanceIntegrations() ──► Status        │   │    │
│  │  └──────────────────────────────────────────────┘   │    │
│  │                                                      │    │
│  │  ┌────────────────────────────────────────────┐     │    │
│  │  │      Component State (useState)             │     │    │
│  │  │                                             │     │    │
│  │  │  selectedItem ──► Detail Drawer content    │     │    │
│  │  │  isDrawerOpen ──► Drawer visibility        │     │    │
│  │  └────────────────────────────────────────────┘     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Cache Invalidation

### When to Invalidate

| Event | Action |
|-------|--------|
| Date range changes | SWR auto-refetches (key changes) |
| Filter changes | No refetch needed (client-side filter) |
| Invoice created | `mutate('/api/finance/invoices')` |
| Reminder sent | `mutate('/api/finance/invoices')` |
| Integration connected | `mutate('/api/finance/integrations')` + all data |
| Manual refresh | `mutate()` all finance keys |

### Manual Refresh Implementation

```typescript
import { mutate } from 'swr';

function useFinanceRefresh(dateRange: DateRange) {
  const refresh = React.useCallback(async () => {
    const query = `start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`;
    
    // Invalidate all finance data
    await Promise.all([
      mutate(`/api/finance/overview?${query}`),
      mutate(`/api/finance/modules?${query}`),
      mutate(`/api/finance/timeline?${query}`),
      mutate(`/api/finance/activity?${query}`),
      mutate('/api/finance/integrations'),
    ]);
  }, [dateRange]);

  return refresh;
}
```

---

## 8. Loading States

SWR provides loading states automatically:

```typescript
const { data, error, isLoading, isValidating } = useFinanceOverview(dateRange);

// isLoading: true on first load (no cache)
// isValidating: true while revalidating (has cache)
// data: undefined initially, then cached data
// error: error object if request failed
```

### Component Loading Pattern

```typescript
function FinanceKPIGrid({ dateRange }: { dateRange: DateRange }) {
  const { data, error, isLoading } = useFinanceOverview(dateRange);

  if (isLoading) {
    return <FinanceKPIGridSkeleton />;
  }

  if (error) {
    return <FinanceKPIGridError onRetry={() => mutate(`/api/finance/overview?...`)} />;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {data?.kpis.map((kpi) => (
        <FinanceKPITile key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}
```

---

## 9. Error States

### Error Boundary Pattern

```typescript
// Use existing ErrorBoundary from /components/shared/ErrorBoundary.tsx
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

function FinanceHQDashboard() {
  return (
    <ErrorBoundary>
      <FinanceFilterProvider>
        <FinanceHQContent />
      </FinanceFilterProvider>
    </ErrorBoundary>
  );
}
```

### Partial Error Handling

```typescript
// When one integration fails but others work
function FinanceModuleGrid() {
  const { data, error } = useFinanceModules(dateRange);

  // Check for partial data warning
  if (data?.warning === 'partial_data') {
    return (
      <>
        <PartialDataBanner 
          failedSources={data.failedSources}
          availableSources={data.availableSources}
        />
        <ModuleGrid modules={data.modules} />
      </>
    );
  }

  // ... normal rendering
}
```

---

## 10. Optimistic Updates

For actions like sending reminders:

```typescript
async function sendInvoiceReminder(invoiceId: string) {
  // Optimistically update UI
  mutate(
    '/api/finance/invoices',
    (current) => ({
      ...current,
      invoices: current.invoices.map(inv =>
        inv.id === invoiceId
          ? { ...inv, reminderSentAt: new Date().toISOString() }
          : inv
      ),
    }),
    false // Don't revalidate yet
  );

  try {
    await fetch(`/api/finance/invoices/${invoiceId}/remind`, { method: 'POST' });
    // Revalidate to confirm
    mutate('/api/finance/invoices');
    toast.success('Reminder sent successfully');
  } catch (error) {
    // Revert on error
    mutate('/api/finance/invoices');
    toast.error('Failed to send reminder');
  }
}
```

---

## 11. Neptune Context Integration

Pass finance state to Neptune for context-aware assistance:

```typescript
function FinanceHQContent() {
  const { dateRange, filters } = useFinanceFilters();
  const { integrations } = useFinanceIntegrations();
  const [selectedItem, setSelectedItem] = React.useState(null);
  const [selectedModule, setSelectedModule] = React.useState(null);

  // Update Neptune context
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__neptuneFinanceContext = {
        mode: selectedItem ? 'detail' : selectedModule ? 'module' : 'overview',
        selectedModule,
        selectedItem,
        dateRange: {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        },
        connectedIntegrations: integrations?.data?.connected || [],
      };
    }
  }, [selectedItem, selectedModule, dateRange, integrations]);

  // ...
}
```

---

## 12. Performance Considerations

### Memoization

```typescript
// Memoize filtered data
const filteredModules = React.useMemo(() => {
  if (!modules.data?.modules) return [];
  if (filters.sources.length === 0) return modules.data.modules;
  return modules.data.modules.filter(m => filters.sources.includes(m.source));
}, [modules.data, filters.sources]);

// Memoize expensive calculations
const totalRevenue = React.useMemo(() => {
  return filteredModules.reduce((sum, m) => sum + (m.data?.revenue || 0), 0);
}, [filteredModules]);
```

### Deduplication

SWR deduplicates requests automatically. With `dedupingInterval: 60000`, identical requests within 1 minute share the same promise.

---

## End of State Management Specification































































