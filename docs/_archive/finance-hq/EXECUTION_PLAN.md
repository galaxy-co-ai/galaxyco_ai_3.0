# Finance HQ — Execution Plan

> **Document Purpose:** Detailed phased implementation plan with time estimates, dependencies, and milestones. This document guides the actual build process.

---

## Executive Summary

**Total Estimated Effort:** 3 conversation sessions (~3-4 hours total)  
**Risk Level:** Medium (with mitigations)  
**Dependencies:** None (all external APIs optional for v1)

---

## ⚠️ IMPORTANT: Session Structure

This build is divided into **3 separate conversation sessions**:

| Session | Phases | Focus | Est. Time |
|---------|--------|-------|-----------|
| **Session 1** | 1, 2, 3, 4 | Backend Foundation | 60-90 min |
| **Session 2** | 5, 6 | Frontend Components | 60-90 min |
| **Session 3** | 7, 8 | AI & Polish | 45-60 min |

**Each session MUST end with a summary and handoff instructions.**

---

## Phase Overview

| Phase | Name | Est. Time | Risk | Session |
|-------|------|-----------|------|---------|
| 1 | Foundation | 15-20 min | Low | 1 |
| 2 | Database Schema | 10-15 min | Medium | 1 |
| 3 | Backend Services | 30-45 min | Medium | 1 |
| 4 | API Routes | 30-45 min | Medium | 1 |
| 5 | UI Components | 45-60 min | Low | 2 |
| 6 | Page Integration | 20-30 min | Low | 2 |
| 7 | Neptune Extension | 30-40 min | Low | 3 |
| 8 | Polish & Testing | 20-30 min | Low | 3 |

---

## Phase 1: Foundation (30-45 min)

### Objective
Set up types, directory structure, and verify codebase state.

### Tasks

#### 1.1 Verify Codebase Health
```bash
git status              # Should be clean
npm run build           # Should pass
npm run lint            # Should pass
npm run dev             # Should start without errors
```

#### 1.2 Create Finance Types
**Create:** `/src/types/finance.ts`

```typescript
// Core types for Finance HQ
export type FinanceProvider = 'quickbooks' | 'stripe' | 'shopify';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface FinanceFilters {
  sources: FinanceProvider[];
}

export interface KPI {
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

export interface FinanceModule {
  id: string;
  title: string;
  source: FinanceProvider;
  type: 'chart' | 'list' | 'metric';
  icon: string;
  data: ChartData | ListData | MetricData;
  lastUpdated: string;
}

export interface ChartData {
  type: 'line' | 'bar' | 'donut';
  dataPoints: Array<{ label: string; value: number }>;
}

export interface ListData {
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    amount?: number;
    status?: string;
  }>;
  total: number;
}

export interface MetricData {
  value: number;
  formattedValue: string;
  trend?: number;
}

export interface FinanceEvent {
  id: string;
  type: 'invoice_created' | 'invoice_paid' | 'payout' | 'order' | 'expense' | 'refund';
  source: FinanceProvider;
  label: string;
  description?: string;
  amount?: number;
  date: string;
  metadata?: Record<string, unknown>;
}

export interface FinanceTransaction {
  id: string;
  date: string;
  source: FinanceProvider;
  type: 'income' | 'expense' | 'transfer' | 'fee' | 'refund';
  description: string;
  amount: number;
  currency: string;
  status?: string;
  externalId: string;
  metadata?: Record<string, unknown>;
}

export interface Invoice {
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
  externalId: string;
}

// API Response types
export interface FinanceOverviewResponse {
  kpis: KPI[];
  summary: {
    revenue: number;
    expenses: number;
    profit: number;
    cashflow: number;
    outstandingInvoices: number;
  };
  bySource: Partial<Record<FinanceProvider, Record<string, number>>>;
}

export interface FinanceModulesResponse {
  modules: FinanceModule[];
}

export interface TimelineResponse {
  events: FinanceEvent[];
}

export interface ActivityResponse {
  transactions: FinanceTransaction[];
  pagination: {
    hasMore: boolean;
    nextCursor?: string;
    total: number;
  };
}

export interface FinanceIntegrationsResponse {
  connected: FinanceProvider[];
  expired: FinanceProvider[];
  available: FinanceProvider[];
  details: Partial<Record<FinanceProvider, IntegrationDetail>>;
}

export interface IntegrationDetail {
  status: 'connected' | 'expired' | 'disconnected';
  connectedAt?: string;
  lastSyncAt?: string;
  accountName?: string;
  error?: string;
}

// UI State types
export type FinanceObjectType = 'module' | 'event' | 'transaction' | 'invoice';

export interface FinanceObject {
  type: FinanceObjectType;
  id: string;
  data: Record<string, unknown>;
}
```

#### 1.3 Create Directory Structure
```bash
mkdir -p src/components/finance-hq/charts
mkdir -p src/lib/finance
mkdir -p src/app/api/finance
mkdir -p src/app/\(app\)/finance
```

### Success Criteria
- [ ] Types file compiles without errors
- [ ] Directories exist
- [ ] Build still passes

---

## Phase 2: Database Schema (15-20 min)

### Objective
Extend provider enum to support finance integrations.

### Tasks

#### 2.1 Modify Schema
**Edit:** `/src/db/schema.ts`

Find:
```typescript
export const integrationProviderEnum = pgEnum('integration_provider', [
  'google',
  'microsoft',
  'slack',
  'salesforce',
  'hubspot',
]);
```

Replace with:
```typescript
export const integrationProviderEnum = pgEnum('integration_provider', [
  'google',
  'microsoft',
  'slack',
  'salesforce',
  'hubspot',
  'quickbooks',
  'stripe',
  'shopify',
]);
```

#### 2.2 Apply Migration
```bash
npx drizzle-kit push
```

#### 2.3 Verify
```bash
npx drizzle-kit studio
# Check that integration_provider enum includes new values
```

### Success Criteria
- [ ] Migration applied without errors
- [ ] Enum has 8 values in database
- [ ] Build still passes

### Rollback
```sql
-- If needed, revert enum (careful with existing data)
ALTER TYPE integration_provider DROP VALUE 'quickbooks';
ALTER TYPE integration_provider DROP VALUE 'stripe';
ALTER TYPE integration_provider DROP VALUE 'shopify';
```

---

## Phase 3: Backend Services (60-90 min)

### Objective
Create service layer for QuickBooks, Stripe, Shopify.

### Tasks

#### 3.1 Create Service Types
**Create:** `/src/lib/finance/types.ts`
- Internal types for service layer
- Normalization helper types

#### 3.2 Create QuickBooks Service
**Create:** `/src/lib/finance/quickbooks.ts`
- OAuth token retrieval
- Invoice fetching
- Expense fetching
- P&L report fetching

#### 3.3 Create Stripe Service
**Create:** `/src/lib/finance/stripe.ts`
- API key retrieval
- Charge fetching
- Payout fetching
- Balance fetching

#### 3.4 Create Shopify Service
**Create:** `/src/lib/finance/shopify.ts`
- OAuth token retrieval
- Order fetching
- Payout fetching

#### 3.5 Create Normalization Utilities
**Create:** `/src/lib/finance/normalization.ts`
- `normalizeQBInvoice()`
- `normalizeStripeCharge()`
- `normalizeShopifyOrder()`
- `mergeTransactions()`

#### 3.6 Create Barrel Export
**Create:** `/src/lib/finance/index.ts`
- Export all services and utilities

#### 3.7 Extend OAuth Configuration
**Edit:** `/src/lib/oauth.ts`
- Add QuickBooks OAuth config
- Add Shopify OAuth config

### Success Criteria
- [ ] All service files compile
- [ ] Normalization functions have unit tests
- [ ] OAuth config includes new providers
- [ ] Build passes

---

## Phase 4: API Routes (60-90 min)

### Objective
Create all Finance HQ API endpoints.

### Tasks

Create routes in this order:

#### 4.1 Integration Status Route
**Create:** `/src/app/api/finance/integrations/route.ts`
- Check which finance integrations are connected
- Return status for each provider

#### 4.2 Overview Route
**Create:** `/src/app/api/finance/overview/route.ts`
- Aggregate KPIs from all connected sources
- Return summary data

#### 4.3 Modules Route
**Create:** `/src/app/api/finance/modules/route.ts`
- Return module definitions based on connected integrations
- Include chart/list data for each module

#### 4.4 Timeline Route
**Create:** `/src/app/api/finance/timeline/route.ts`
- Merge events from all sources
- Sort chronologically

#### 4.5 Activity Route
**Create:** `/src/app/api/finance/activity/route.ts`
- Unified transaction table data
- Pagination support

#### 4.6 Invoice Routes
**Create:** `/src/app/api/finance/invoices/route.ts` (GET, POST)
**Create:** `/src/app/api/finance/invoices/[id]/route.ts` (GET, PATCH)
**Create:** `/src/app/api/finance/invoices/[id]/remind/route.ts` (POST)

#### 4.7 Other Routes
**Create:** `/src/app/api/finance/revenue/route.ts`
**Create:** `/src/app/api/finance/cashflow/route.ts`

### Success Criteria
- [ ] All routes return valid JSON
- [ ] Authentication works (401 for unauthenticated)
- [ ] Rate limiting works
- [ ] Caching works
- [ ] Build passes

---

## 🛑 END OF SESSION 1 — MANDATORY STOP

**You have completed Session 1 (Backend Foundation).**

### Before Ending This Session:

1. **Run verification:**
   ```bash
   npm run build   # Must pass
   npm run lint    # Must pass
   ```

2. **Test an API endpoint:**
   ```bash
   npm run dev &
   curl http://localhost:3000/api/finance/integrations
   ```

3. **Provide Session 1 Summary** with:
   - List of all files created
   - Build/lint status
   - Any issues or notes

4. **Tell the user:**
   > "Session 1 is complete. Backend foundation is ready. Start a new conversation for Session 2 (Frontend Components) with the prompt in docs/finance-hq/SESSION_PROMPTS.md"

**DO NOT PROCEED TO PHASE 5.** A new conversation is required.

---

## 🔷 SESSION 2: Frontend Components

> **Start of Session 2** — Verify Session 1 is complete first!

---

## Phase 5: UI Components (45-60 min)

### Objective
Build all Finance HQ React components.

### Tasks

#### 5.1 Filter Context
**Create:** `/src/components/finance-hq/FinanceFilterContext.tsx`

#### 5.2 Data Hooks
**Create:** `/src/hooks/useFinanceData.ts`

#### 5.3 Core Layout Components
**Create in order:**
1. `FinanceHeader.tsx`
2. `FinanceDatePicker.tsx`
3. `FinanceFilterChips.tsx`
4. `FinanceEmptyState.tsx`

#### 5.4 KPI Components
**Create:**
1. `FinanceKPITile.tsx`
2. `FinanceKPIGrid.tsx`

#### 5.5 Module Components
**Create:**
1. `FinanceModuleTile.tsx`
2. `FinanceModuleGrid.tsx`

#### 5.6 Chart Components
**Create:**
1. `/charts/RevenueChart.tsx`
2. `/charts/ExpenseChart.tsx`
3. `/charts/CashFlowChart.tsx`

#### 5.7 Timeline & Activity
**Create:**
1. `FinanceTimeline.tsx`
2. `FinanceActivityTable.tsx`

#### 5.8 Detail Drawer
**Create:** `FinanceDetailDrawer.tsx`

#### 5.9 Main Dashboard
**Create:** `FinanceHQDashboard.tsx`

#### 5.10 Barrel Export
**Create:** `/src/components/finance-hq/index.ts`

### Success Criteria
- [ ] All components render without errors
- [ ] Skeleton states work
- [ ] Responsive on mobile
- [ ] Accessibility requirements met
- [ ] Build passes

---

## Phase 6: Page Integration (30-45 min)

### Objective
Create the page route and add to sidebar.

### Tasks

#### 6.1 Create Page File
**Create:** `/src/app/(app)/finance/page.tsx`

```typescript
import { Metadata } from 'next';
import { FinanceHQDashboard } from '@/components/finance-hq';

export const metadata: Metadata = {
  title: 'Finance HQ | GalaxyCo',
  description: 'Your unified financial command center',
};

export default function FinancePage() {
  return <FinanceHQDashboard />;
}
```

#### 6.2 Add to Sidebar
**Edit:** `/src/components/galaxy/sidebar.tsx`
- Import `Wallet` icon
- Add Finance HQ nav item

#### 6.3 Test Navigation
- Start dev server
- Click Finance HQ in sidebar
- Verify page loads

### Success Criteria
- [ ] Page accessible at `/finance`
- [ ] Sidebar shows Finance HQ
- [ ] Active state works
- [ ] Page renders correctly

---

## 🛑 END OF SESSION 2 — MANDATORY STOP

**You have completed Session 2 (Frontend Components).**

### Before Ending This Session:

1. **Run verification:**
   ```bash
   npm run build   # Must pass
   npm run lint    # Must pass
   ```

2. **Verify page loads:**
   - Start dev server: `npm run dev`
   - Navigate to: `http://localhost:3000/finance`
   - Confirm the page renders

3. **Provide Session 2 Summary** with:
   - List of all components created
   - Screenshot or description of page state
   - Any issues or notes

4. **Tell the user:**
   > "Session 2 is complete. Frontend is ready. Start a new conversation for Session 3 (AI & Polish) with the prompt in docs/finance-hq/SESSION_PROMPTS.md"

**DO NOT PROCEED TO PHASE 7.** A new conversation is required.

---

## 🔷 SESSION 3: AI Integration & Polish

> **Start of Session 3** — Verify Sessions 1 & 2 are complete first!

---

## Phase 7: Neptune Extension (30-40 min)

### Objective
Extend Neptune to be context-aware on Finance HQ.

### Tasks

#### 7.1 Add Finance Context Gathering
**Edit:** `/src/lib/ai/context.ts`
- Add `FinanceContext` type
- Add `gatherFinanceContext()` function
- Include in `gatherAIContext()`

#### 7.2 Extend System Prompt
**Edit:** `/src/lib/ai/system-prompt.ts`
- Add `generateFinancePromptSection()`
- Include finance capabilities when context includes finance

#### 7.3 Add Finance Tools
**Edit:** `/src/lib/ai/tools.ts`
- Add `get_finance_summary` tool
- Add `get_overdue_invoices` tool
- Add `send_invoice_reminder` tool
- Add `generate_cash_flow_forecast` tool
- Add `compare_financial_periods` tool
- Add tool execution handlers

#### 7.4 Test Neptune
- Open `/finance`
- Open Neptune panel
- Ask "How are my finances?"
- Verify context-aware response

### Success Criteria
- [ ] Neptune responds with finance context
- [ ] Finance tools execute correctly
- [ ] Suggestions are finance-relevant
- [ ] No errors in console

---

## Phase 8: Polish & Testing (60-90 min)

### Objective
Final polish, testing, and documentation.

### Tasks

#### 8.1 Visual Polish
- Verify all styling matches design system
- Test responsive layouts
- Check animations/transitions

#### 8.2 Accessibility Audit
- Tab through entire page
- Verify ARIA labels
- Test with screen reader
- Check color contrast

#### 8.3 Write Tests
- Unit tests for normalization
- API endpoint tests
- Component tests (critical paths)

#### 8.4 Performance Check
- Lighthouse audit
- Check bundle size
- Verify caching works

#### 8.5 Documentation
- Update README if needed
- Add inline comments for complex logic

#### 8.6 Final Build Verification
```bash
npm run build
npm run lint
npm test
```

### Success Criteria
- [ ] Build passes
- [ ] Lint passes
- [ ] Tests pass
- [ ] No console errors
- [ ] Performance acceptable (< 2s load)
- [ ] Accessibility score >= 90

---

## Milestone Summary

| Milestone | Description | Completed |
|-----------|-------------|-----------|
| M1 | Types & structure ready | [ ] |
| M2 | Database schema updated | [ ] |
| M3 | Backend services working | [ ] |
| M4 | API routes functional | [ ] |
| M5 | UI components rendered | [ ] |
| M6 | Page accessible & navigable | [ ] |
| M7 | Neptune finance-aware | [ ] |
| M8 | Production ready | [ ] |

---

## Contingency Plans

### If External APIs Unavailable
- Use mock data for development
- Services return empty arrays gracefully
- UI shows "No data available" states

### If OAuth Flow Fails
- Defer OAuth to later phase
- Use API keys where possible (Stripe)
- Document manual setup steps

### If Performance Issues
- Add more aggressive caching
- Implement pagination earlier
- Defer non-critical modules

---

## End of Execution Plan

