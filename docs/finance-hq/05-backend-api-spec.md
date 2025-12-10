# Finance HQ — Backend API Specification (GalaxyCo Tailored)

> **Document Purpose:** Defines all backend API routes, request/response structures, authentication, caching, and error handling for Finance HQ. All routes follow GalaxyCo's existing API patterns.

---

## 1. Architectural Overview

Finance HQ backend uses:
- **Next.js App Router** API routes in `/src/app/api/finance/`
- **Server-side services** for QuickBooks, Stripe, Shopify in `/src/lib/finance/`
- **Data normalization layer** to merge provider data
- **Redis caching** via existing `/lib/cache.ts`
- **OAuth token management** via existing `/lib/encryption.ts` and `/db/schema.ts`

### Key Principle
Frontend NEVER calls external APIs directly. All requests go through internal `/api/finance/*` endpoints.

---

## 2. API Route Structure

All finance routes follow existing GalaxyCo pattern:

```
/src/app/api/finance/
├── overview/
│   └── route.ts           # GET - KPIs and summary data
├── modules/
│   └── route.ts           # GET - Module definitions and data
├── invoices/
│   ├── route.ts           # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts       # GET (single), PATCH (update)
│       └── remind/
│           └── route.ts   # POST - Send reminder
├── expenses/
│   └── route.ts           # GET - Expense list
├── revenue/
│   └── route.ts           # GET - Unified revenue data
├── cashflow/
│   └── route.ts           # GET - Cash flow data
├── timeline/
│   └── route.ts           # GET - Financial events timeline
├── activity/
│   └── route.ts           # GET - Recent transactions
└── integrations/
    └── route.ts           # GET - Finance integration status
```

---

## 3. Standard Route Pattern

Every route MUST follow this pattern (from existing `/api/dashboard/route.ts`):

```typescript
import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { getCacheOrFetch } from '@/lib/cache';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { z } from 'zod';

// Zod schema for validation
const querySchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
});

export async function GET(request: Request) {
  try {
    // 1. Auth check
    const { workspaceId, userId } = await getCurrentWorkspace();

    // 2. Rate limiting
    const rateLimitResult = await rateLimit(`api:finance:overview:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', reset: rateLimitResult.reset },
        { status: 429 }
      );
    }

    // 3. Parse and validate query params
    const { searchParams } = new URL(request.url);
    const validationResult = querySchema.safeParse({
      start: searchParams.get('start'),
      end: searchParams.get('end'),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // 4. Fetch with caching
    const data = await getCacheOrFetch(
      `finance:overview:${workspaceId}:${validationResult.data.start}:${validationResult.data.end}`,
      async () => {
        // Actual data fetching logic
        return await fetchFinanceOverview(workspaceId, validationResult.data);
      },
      { ttl: 180 } // 3 minutes
    );

    // 5. Return response
    return NextResponse.json(data);
  } catch (error) {
    return createErrorResponse(error, 'Finance overview error');
  }
}
```

---

## 4. API Endpoints Detail

### 4.1 `GET /api/finance/overview`

Returns top-level KPIs (revenue, expenses, profit, cash flow, outstanding invoices).

**Query Parameters:**
| Param | Type | Required | Default |
|-------|------|----------|---------|
| `start` | ISO datetime | No | 30 days ago |
| `end` | ISO datetime | No | Now |

**Response:**
```typescript
interface FinanceOverviewResponse {
  kpis: KPI[];
  summary: {
    revenue: number;
    expenses: number;
    profit: number;
    cashflow: number;
    outstandingInvoices: number;
  };
  bySource: {
    quickbooks?: { revenue: number; expenses: number };
    stripe?: { revenue: number; fees: number };
    shopify?: { revenue: number; orders: number };
  };
}

interface KPI {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  delta?: number;
  deltaLabel?: string;
  icon: string;
  iconColor: string;
  iconBg: string;
}
```

**Cache TTL:** 180 seconds (3 minutes)

---

### 4.2 `GET /api/finance/modules`

Returns dynamic module definitions based on connected integrations.

**Response:**
```typescript
interface FinanceModulesResponse {
  modules: FinanceModule[];
}

interface FinanceModule {
  id: string;
  title: string;
  source: 'quickbooks' | 'stripe' | 'shopify';
  type: 'chart' | 'list' | 'metric';
  icon: string;
  data: ChartData | ListData | MetricData;
  lastUpdated: string;
}

// Chart data (line, bar, donut)
interface ChartData {
  type: 'line' | 'bar' | 'donut';
  dataPoints: Array<{ label: string; value: number }>;
}

// List data (invoices, orders, etc.)
interface ListData {
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    amount?: number;
    status?: string;
  }>;
  total: number;
}

// Single metric
interface MetricData {
  value: number;
  formattedValue: string;
  trend?: number;
}
```

**Cache TTL:** 300 seconds (5 minutes)

---

### 4.3 `GET /api/finance/invoices`

Returns invoice list from QuickBooks.

**Query Parameters:**
| Param | Type | Required | Default |
|-------|------|----------|---------|
| `start` | ISO datetime | No | 30 days ago |
| `end` | ISO datetime | No | Now |
| `status` | `paid \| unpaid \| overdue \| all` | No | `all` |
| `limit` | number | No | 50 |
| `cursor` | string | No | - |

**Response:**
```typescript
interface InvoicesResponse {
  invoices: Invoice[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
    total: number;
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'paid' | 'unpaid' | 'overdue' | 'draft';
  customer: {
    id: string;
    name: string;
    email?: string;
  };
  dueDate: string;
  balance: number;
  total: number;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  createdAt: string;
  updatedAt: string;
  source: 'quickbooks';
  externalId: string; // QuickBooks ID
}
```

---

### 4.4 `POST /api/finance/invoices`

Creates a new invoice in QuickBooks.

**Request Body:**
```typescript
interface CreateInvoiceRequest {
  customerId: string;
  dueDate: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  notes?: string;
}
```

**Response:** Created `Invoice` object

---

### 4.5 `POST /api/finance/invoices/[id]/remind`

Sends a payment reminder for an invoice.

**Request Body:**
```typescript
interface SendReminderRequest {
  message?: string; // Custom message (optional)
}
```

**Response:**
```typescript
interface SendReminderResponse {
  success: boolean;
  sentTo: string; // Email address
  sentAt: string;
}
```

---

### 4.6 `GET /api/finance/revenue`

Returns unified revenue from all sources.

**Response:**
```typescript
interface RevenueResponse {
  total: number;
  formattedTotal: string;
  bySource: {
    quickbooks?: number;
    stripe?: number;
    shopify?: number;
  };
  trend: Array<{
    date: string;
    value: number;
    quickbooks?: number;
    stripe?: number;
    shopify?: number;
  }>;
  period: {
    start: string;
    end: string;
  };
}
```

---

### 4.7 `GET /api/finance/cashflow`

Returns cash flow data.

**Response:**
```typescript
interface CashFlowResponse {
  net: number;
  inflow: number;
  outflow: number;
  trend: Array<{
    date: string;
    inflow: number;
    outflow: number;
    net: number;
  }>;
  payouts: Array<{
    id: string;
    source: 'stripe' | 'shopify';
    amount: number;
    status: string;
    arrivalDate: string;
  }>;
}
```

---

### 4.8 `GET /api/finance/timeline`

Returns unified financial events for timeline.

**Response:**
```typescript
interface TimelineResponse {
  events: FinanceEvent[];
}

interface FinanceEvent {
  id: string;
  type: 'invoice_created' | 'invoice_paid' | 'payout' | 'order' | 'expense' | 'refund';
  source: 'quickbooks' | 'stripe' | 'shopify';
  label: string;
  description?: string;
  amount?: number;
  date: string;
  metadata?: Record<string, unknown>;
}
```

---

### 4.9 `GET /api/finance/activity`

Returns unified transaction activity table.

**Response:**
```typescript
interface ActivityResponse {
  transactions: FinanceTransaction[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
    total: number;
  };
}

interface FinanceTransaction {
  id: string;
  date: string;
  source: 'quickbooks' | 'stripe' | 'shopify';
  type: 'income' | 'expense' | 'transfer' | 'fee' | 'refund';
  description: string;
  amount: number;
  currency: string;
  status?: string;
  externalId: string;
  metadata?: Record<string, unknown>;
}
```

---

### 4.10 `GET /api/finance/integrations`

Returns connection status of finance integrations.

**Response:**
```typescript
interface FinanceIntegrationsResponse {
  connected: Array<'quickbooks' | 'stripe' | 'shopify'>;
  expired: Array<'quickbooks' | 'stripe' | 'shopify'>;
  available: Array<'quickbooks' | 'stripe' | 'shopify'>;
  details: {
    quickbooks?: IntegrationDetail;
    stripe?: IntegrationDetail;
    shopify?: IntegrationDetail;
  };
}

interface IntegrationDetail {
  status: 'connected' | 'expired' | 'disconnected';
  connectedAt?: string;
  lastSyncAt?: string;
  accountName?: string;
  error?: string;
}
```

---

## 5. Service Layer

Create services in `/src/lib/finance/`:

```
/src/lib/finance/
├── index.ts                 # Barrel export
├── quickbooks.ts           # QuickBooks API service
├── stripe.ts               # Stripe API service
├── shopify.ts              # Shopify API service
├── normalization.ts        # Data normalization utilities
└── types.ts                # Shared types
```

### Service Pattern
```typescript
// /src/lib/finance/quickbooks.ts
import { db } from '@/lib/db';
import { integrations, oauthTokens } from '@/db/schema';
import { decryptApiKey } from '@/lib/encryption';
import { logger } from '@/lib/logger';

export class QuickBooksService {
  private workspaceId: string;
  private accessToken: string | null = null;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  async initialize(): Promise<boolean> {
    // Fetch and decrypt OAuth token from database
    const integration = await db.query.integrations.findFirst({
      where: and(
        eq(integrations.workspaceId, this.workspaceId),
        eq(integrations.provider, 'quickbooks'),
        eq(integrations.status, 'active')
      ),
      with: { tokens: true }
    });

    if (!integration?.tokens) {
      return false;
    }

    this.accessToken = decryptApiKey(integration.tokens.accessToken);
    return true;
  }

  async getInvoices(options: GetInvoicesOptions): Promise<Invoice[]> {
    if (!this.accessToken) throw new Error('Not initialized');
    
    const response = await fetch(
      `https://quickbooks.api.intuit.com/v3/company/${companyId}/query`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json',
        },
        // ...
      }
    );
    
    // Normalize to internal format
    return this.normalizeInvoices(response);
  }

  // ... more methods
}
```

---

## 6. Error Handling

Use existing pattern from `/lib/api-error-handler.ts`:

### Standard Error Responses

| Status | Type | Description |
|--------|------|-------------|
| 400 | `validation_error` | Invalid request parameters |
| 401 | `unauthorized` | Not authenticated |
| 403 | `forbidden` | Not authorized for workspace |
| 404 | `not_found` | Resource not found |
| 429 | `rate_limit` | Too many requests |
| 500 | `internal_error` | Server error |
| 502 | `provider_error` | External API failed |
| 503 | `provider_unavailable` | External API down |

### Finance-Specific Errors

```typescript
// Integration errors
{ error: 'integration_not_connected', provider: 'quickbooks' }
{ error: 'integration_expired', provider: 'stripe' }
{ error: 'integration_error', provider: 'shopify', message: 'API rate limited' }

// Partial data
{
  warning: 'partial_data',
  message: 'QuickBooks data unavailable',
  availableSources: ['stripe', 'shopify']
}
```

---

## 7. Caching Strategy

| Endpoint | Cache TTL | Key Pattern |
|----------|-----------|-------------|
| `/finance/overview` | 180s | `finance:overview:{workspaceId}:{dateRange}` |
| `/finance/modules` | 300s | `finance:modules:{workspaceId}:{dateRange}` |
| `/finance/invoices` | 120s | `finance:invoices:{workspaceId}:{status}:{dateRange}` |
| `/finance/revenue` | 300s | `finance:revenue:{workspaceId}:{dateRange}` |
| `/finance/cashflow` | 300s | `finance:cashflow:{workspaceId}:{dateRange}` |
| `/finance/timeline` | 180s | `finance:timeline:{workspaceId}:{dateRange}` |
| `/finance/activity` | 120s | `finance:activity:{workspaceId}:{dateRange}` |
| `/finance/integrations` | 60s | `finance:integrations:{workspaceId}` |

### Cache Invalidation Triggers
- Integration connected/disconnected
- Invoice created/updated
- Manual refresh requested
- Background sync completed

---

## 8. Security Requirements

### Authentication
- All routes require authentication via `getCurrentWorkspace()`
- Multi-tenant security with `workspaceId` filtering on all queries

### Token Storage
- OAuth tokens encrypted with AES-256-GCM using existing `/lib/encryption.ts`
- Tokens stored in `oauthTokens` table linked to `integrations`
- No tokens exposed in API responses

### Rate Limiting
- Per-user limits using existing `rateLimit()` from `/lib/rate-limit.ts`
- Default: 100 requests per hour per endpoint

---

## End of Backend API Specification












































