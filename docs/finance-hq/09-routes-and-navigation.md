# Finance HQ — Routes & Navigation Specification (GalaxyCo Tailored)

> **Document Purpose:** Defines routing structure, sidebar integration, page structure, and navigation behavior for Finance HQ within GalaxyCo's existing app router architecture.

---

## 1. Route Structure

Finance HQ uses a single route within the existing `(app)` route group:

```
src/app/(app)/
├── dashboard/
├── activity/
├── studio/
├── library/
├── crm/
├── marketing/
├── lunar-labs/
├── assistant/
├── integrations/
├── settings/
├── finance/             ← NEW
│   └── page.tsx         ← Finance HQ main page
└── layout.tsx           ← Existing app layout (uses AppLayout)
```

### Route Details
| Route | Purpose | Component |
|-------|---------|-----------|
| `/finance` | Finance HQ dashboard | `FinanceHQDashboard` |

### Why No Sub-Routes?
In v1, Finance HQ is a single-page application with:
- Detail drawers (not separate pages)
- Module drilling via drawer, not navigation
- URL stays at `/finance` for simpler implementation

Future versions may add sub-routes like `/finance/invoices`, `/finance/revenue`, etc.

---

## 2. File Structure

### Page File

Create `/src/app/(app)/finance/page.tsx`:

```typescript
import { Metadata } from 'next';
import { FinanceHQDashboard } from '@/components/finance-hq/FinanceHQDashboard';

export const metadata: Metadata = {
  title: 'Finance HQ | GalaxyCo',
  description: 'Your unified financial command center',
};

export default function FinancePage() {
  return <FinanceHQDashboard />;
}
```

### Why Server Component?
The page itself is a Server Component that renders the client component `FinanceHQDashboard`. This follows GalaxyCo's pattern where:
- Page files handle metadata and initial loading
- Heavy interactive components are client components
- Server components can fetch initial data

### Optional: Server-Side Data Fetching

```typescript
import { Metadata } from 'next';
import { FinanceHQDashboard } from '@/components/finance-hq/FinanceHQDashboard';
import { getCurrentWorkspace } from '@/lib/auth';
import { getFinanceOverview } from '@/lib/finance';

export const metadata: Metadata = {
  title: 'Finance HQ | GalaxyCo',
  description: 'Your unified financial command center',
};

export default async function FinancePage() {
  // Optional: Pre-fetch overview for faster initial render
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const initialData = await getFinanceOverview(workspaceId);
    return <FinanceHQDashboard initialData={initialData} />;
  } catch {
    // Fallback to client-side fetching
    return <FinanceHQDashboard />;
  }
}
```

---

## 3. Sidebar Integration

Update the sidebar to include Finance HQ.

### Modify `/src/components/galaxy/sidebar.tsx`

```typescript
import {
  LayoutDashboard,
  Activity,
  Workflow,
  BookOpen,
  Users,
  Megaphone,
  FlaskConical,
  Sparkles,
  Plug,
  Settings,
  Wallet,  // NEW: Finance icon
} from 'lucide-react';

// Main navigation items
const mainNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", id: "dashboard" },
  { icon: Activity, label: "Activity", href: "/activity", id: "activity" },
  { icon: Workflow, label: "Studio", href: "/studio", id: "studio" },
  { icon: BookOpen, label: "Library", href: "/library", id: "library" },
  { icon: Users, label: "CRM", href: "/crm", id: "crm" },
  { icon: Megaphone, label: "Marketing", href: "/marketing", id: "marketing" },
  { icon: Wallet, label: "Finance HQ", href: "/finance", id: "finance" },  // NEW
  { icon: FlaskConical, label: "Lunar Labs", href: "/lunar-labs", id: "lunar-labs" },
];
```

### Sidebar Icon Styling
Use the `Wallet` icon from Lucide React. Alternative icons:
- `DollarSign` - More financial
- `Banknote` - Currency focused
- `PiggyBank` - Savings focused
- `BarChart3` - Analytics focused

Recommendation: `Wallet` for clean, recognizable appearance.

### Active State
The existing sidebar handles active state via `usePathname()`:

```typescript
const pathname = usePathname();

// Check if current path matches
const isActive = (href: string) => {
  return pathname === href || pathname?.startsWith(`${href}/`);
};
```

This automatically works for `/finance`.

---

## 4. Page Entry Behavior

When user navigates to `/finance`:

### 1. Authentication Check
- `(app)/layout.tsx` already wraps with Clerk authentication
- If not authenticated → redirect to sign-in

### 2. Workspace Resolution
- `getCurrentWorkspace()` resolves workspace from session
- If no workspace → redirect to workspace selection

### 3. Integration Status Check
- Fetch `/api/finance/integrations`
- Determine which providers are connected

### 4. Conditional Rendering

```typescript
function FinanceHQDashboard() {
  const { data: integrations, isLoading: integrationsLoading } = useFinanceIntegrations();

  // Show loading skeleton while checking integrations
  if (integrationsLoading) {
    return <FinanceHQSkeleton />;
  }

  // No integrations connected
  if (!integrations?.connected?.length) {
    return <FinanceEmptyState />;
  }

  // Has integrations - show dashboard
  return <FinanceHQContent />;
}
```

---

## 5. Empty State Component

When no finance integrations are connected:

```typescript
function FinanceEmptyState() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto px-6 py-24 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-6">
        <Wallet className="h-8 w-8 text-blue-600" />
      </div>
      
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        Connect Your Financial Accounts
      </h1>
      
      <p className="text-gray-500 mb-8">
        Connect QuickBooks, Stripe, or Shopify to see all your finances in one place.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <IntegrationButton 
          provider="quickbooks"
          label="Connect QuickBooks"
          icon={<QuickBooksIcon />}
        />
        <IntegrationButton 
          provider="stripe"
          label="Connect Stripe"
          icon={<StripeIcon />}
        />
        <IntegrationButton 
          provider="shopify"
          label="Connect Shopify"
          icon={<ShopifyIcon />}
        />
      </div>
      
      <p className="text-sm text-gray-400 mt-8">
        Already have integrations? Check your{' '}
        <Link href="/integrations" className="text-blue-600 hover:underline">
          Integrations settings
        </Link>
      </p>
    </div>
  );
}
```

---

## 6. Reconnect Banners

When an integration token expires:

```typescript
function ReconnectBanner({ provider }: { provider: string }) {
  const { connect, isConnecting } = useOAuth();

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-amber-600" />
        <div>
          <p className="text-sm font-medium text-amber-800">
            {provider} connection expired
          </p>
          <p className="text-xs text-amber-600">
            Reconnect to continue syncing your financial data
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => connect(provider as OAuthProvider)}
        disabled={isConnecting}
      >
        {isConnecting ? <Spinner className="h-4 w-4" /> : 'Reconnect'}
      </Button>
    </div>
  );
}
```

---

## 7. Detail Drawer Navigation

In v1, detail views use drawers, not routes.

### Why Drawers?
- Faster navigation (no route change)
- Maintains dashboard context
- Simpler state management
- Follows existing GalaxyCo patterns (CRM uses drawers)

### Drawer Behavior
| Action | Result |
|--------|--------|
| Click invoice | Drawer opens with invoice details |
| Click payout | Drawer opens with payout details |
| Press Escape | Drawer closes |
| Click outside | Drawer closes |
| Browser back | Does NOT close drawer (no URL change) |

### Future: Route-Based Details
v2 could add routes like:
- `/finance/invoices/[id]`
- `/finance/transactions/[id]`

With shallow routing to maintain drawer UX:
```typescript
router.push(`/finance/invoices/${id}`, { shallow: true });
```

---

## 8. Page Transitions

### Enter Animation
When navigating to `/finance`:

```typescript
// Using Framer Motion (already in project)
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>
  {/* Page content */}
</motion.div>
```

### Content Stagger
Stagger the appearance of page sections:

```typescript
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

<motion.div variants={container} initial="hidden" animate="show">
  <motion.div variants={item}><KPIGrid /></motion.div>
  <motion.div variants={item}><ModuleGrid /></motion.div>
  <motion.div variants={item}><Timeline /></motion.div>
  <motion.div variants={item}><ActivityTable /></motion.div>
</motion.div>
```

---

## 9. Loading States

### Full Page Skeleton

```typescript
function FinanceHQSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* KPI skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </div>

      {/* Module grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>

      {/* Timeline skeleton */}
      <Skeleton className="h-24 rounded-2xl" />

      {/* Activity table skeleton */}
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
```

---

## 10. URL Query Parameters

While main navigation doesn't use sub-routes, query params can preserve state:

| Param | Purpose | Example |
|-------|---------|---------|
| `?start=` | Date range start | `?start=2025-01-01` |
| `?end=` | Date range end | `?end=2025-01-31` |
| `?source=` | Filter by source | `?source=stripe` |

### Implementation (Optional)

```typescript
import { useSearchParams, useRouter } from 'next/navigation';

function useFinanceURLState() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const dateRange = {
    start: searchParams.get('start') 
      ? new Date(searchParams.get('start')!) 
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: searchParams.get('end') 
      ? new Date(searchParams.get('end')!) 
      : new Date(),
  };

  const setDateRange = (range: DateRange) => {
    const params = new URLSearchParams(searchParams);
    params.set('start', range.start.toISOString());
    params.set('end', range.end.toISOString());
    router.push(`/finance?${params.toString()}`);
  };

  return { dateRange, setDateRange };
}
```

---

## 11. Breadcrumbs (Optional)

If sub-routes are added later:

```typescript
// Not needed for v1 (single page)
// Include for future reference

function FinanceBreadcrumbs() {
  const pathname = usePathname();
  
  const breadcrumbs = [
    { label: 'Finance HQ', href: '/finance' },
    // Dynamic based on route
  ];

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
      {breadcrumbs.map((crumb, i) => (
        <React.Fragment key={crumb.href}>
          {i > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
          <Link 
            href={crumb.href}
            className={i === breadcrumbs.length - 1 
              ? 'text-gray-900 font-medium' 
              : 'text-gray-500 hover:text-gray-700'
            }
          >
            {crumb.label}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}
```

---

## End of Routes & Navigation Specification











































