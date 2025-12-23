# Finance HQ — Master Build Instructions (GalaxyCo Tailored)

> **Document Purpose:** The orchestration document that links all other specs and provides an unambiguous, end-to-end blueprint for building Finance HQ safely within the existing GalaxyCo codebase.

---

## 1. Document Index

All Finance HQ specification documents:

| # | Document | Purpose |
|---|----------|---------|
| 1 | `01-product-spec.md` | Product vision, goals, scope, success criteria |
| 2 | `02-ux-wireframe.md` | Layout, regions, interaction flows |
| 3 | `03-ui-style-guide.md` | Visual design aligned with GalaxyCo design system |
| 4 | `04-component-architecture.md` | Component definitions and props |
| 5 | `05-backend-api-spec.md` | API routes, requests, responses |
| 6 | `06-integration-mapping.md` | OAuth, encryption, provider APIs |
| 7 | `07-neptune-assistant-spec.md` | AI assistant finance extensions |
| 8 | `08-state-management.md` | SWR + Context patterns |
| 9 | `09-routes-and-navigation.md` | Routing and sidebar integration |
| 10 | `10-master-build-instructions.md` | This document |

---

## 2. Pre-Build Checklist

Before writing any code, verify:

### Environment
- [ ] Node.js 18+ installed
- [ ] PostgreSQL running (or Neon/Supabase connected)
- [ ] Redis running (or Upstash connected)
- [ ] `.env.local` has all required variables

### Codebase State
- [ ] `git status` shows clean working tree
- [ ] `npm run build` passes without errors
- [ ] `npm run lint` passes without errors
- [ ] Dev server runs successfully (`npm run dev`)

### New Environment Variables Required
```bash
# Add to .env.local
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=
SHOPIFY_CLIENT_ID=
SHOPIFY_CLIENT_SECRET=
STRIPE_WEBHOOK_SECRET=  # Optional for v1
```

---

## 3. Build Order (8 Phases)

Execute in this exact order. Each phase should be completed and tested before proceeding.

### Phase 1: Database Schema Extension
**Risk Level:** Medium (schema migration)  
**Files to modify:**
- `/src/db/schema.ts`

**Tasks:**
1. Extend `integrationProviderEnum` to include `'quickbooks'`, `'stripe'`, `'shopify'`
2. Run `npx drizzle-kit push` to apply migration
3. Verify migration in database

**Verification:**
```bash
# Check schema update applied
npx drizzle-kit studio
# Verify enum has new values
```

---

### Phase 2: Types & Interfaces
**Risk Level:** Low (additive only)  
**Files to create:**
- `/src/types/finance.ts`

**Tasks:**
1. Define all Finance HQ types from specs
2. Export types for use in components and API routes

**Key Types:**
```typescript
// /src/types/finance.ts
export interface DateRange { start: Date; end: Date; }
export interface FinanceFilters { sources: FinanceProvider[]; }
export type FinanceProvider = 'quickbooks' | 'stripe' | 'shopify';
export interface KPI { /* from 04-component-architecture.md */ }
export interface FinanceModule { /* ... */ }
export interface FinanceTransaction { /* ... */ }
export interface FinanceEvent { /* ... */ }
export interface Invoice { /* ... */ }
// ... etc
```

---

### Phase 3: Backend Services
**Risk Level:** Medium (external API calls)  
**Files to create:**
- `/src/lib/finance/index.ts`
- `/src/lib/finance/types.ts`
- `/src/lib/finance/quickbooks.ts`
- `/src/lib/finance/stripe.ts`
- `/src/lib/finance/shopify.ts`
- `/src/lib/finance/normalization.ts`

**Files to modify:**
- `/src/lib/oauth.ts` (extend for QB/Shopify)

**Tasks:**
1. Create service classes for each provider
2. Implement OAuth extension for QuickBooks and Shopify
3. Implement data normalization functions
4. Add token refresh logic

**Verification:**
- Unit tests for normalization functions
- Manual OAuth flow test (if keys available)

---

### Phase 4: API Routes
**Risk Level:** Medium (new endpoints)  
**Files to create:**
- `/src/app/api/finance/overview/route.ts`
- `/src/app/api/finance/modules/route.ts`
- `/src/app/api/finance/invoices/route.ts`
- `/src/app/api/finance/invoices/[id]/route.ts`
- `/src/app/api/finance/invoices/[id]/remind/route.ts`
- `/src/app/api/finance/revenue/route.ts`
- `/src/app/api/finance/cashflow/route.ts`
- `/src/app/api/finance/timeline/route.ts`
- `/src/app/api/finance/activity/route.ts`
- `/src/app/api/finance/integrations/route.ts`

**Tasks:**
1. Create all routes following `05-backend-api-spec.md`
2. Follow existing patterns from `/api/dashboard/route.ts`
3. Include authentication, rate limiting, caching
4. Include Zod validation for all inputs

**Verification:**
```bash
# Test each endpoint manually
curl http://localhost:3000/api/finance/integrations
```

---

### Phase 5: Data Hooks
**Risk Level:** Low (client-side only)  
**Files to create:**
- `/src/hooks/useFinanceData.ts`

**Tasks:**
1. Create SWR hooks for each API endpoint
2. Follow patterns from `08-state-management.md`

**Verification:**
- Import hooks in test component
- Verify data fetching works

---

### Phase 6: UI Components
**Risk Level:** Low (isolated, additive)  
**Files to create:**
- `/src/components/finance-hq/index.ts`
- `/src/components/finance-hq/FinanceHQDashboard.tsx`
- `/src/components/finance-hq/FinanceFilterContext.tsx`
- `/src/components/finance-hq/FinanceKPIGrid.tsx`
- `/src/components/finance-hq/FinanceKPITile.tsx`
- `/src/components/finance-hq/FinanceModuleGrid.tsx`
- `/src/components/finance-hq/FinanceModuleTile.tsx`
- `/src/components/finance-hq/FinanceTimeline.tsx`
- `/src/components/finance-hq/FinanceActivityTable.tsx`
- `/src/components/finance-hq/FinanceDetailDrawer.tsx`
- `/src/components/finance-hq/FinanceDatePicker.tsx`
- `/src/components/finance-hq/FinanceFilterChips.tsx`
- `/src/components/finance-hq/FinanceEmptyState.tsx`
- `/src/components/finance-hq/FinanceHeader.tsx`
- `/src/components/finance-hq/charts/RevenueChart.tsx`
- `/src/components/finance-hq/charts/ExpenseChart.tsx`
- `/src/components/finance-hq/charts/CashFlowChart.tsx`

**Tasks:**
1. Build each component following `04-component-architecture.md`
2. Style according to `03-ui-style-guide.md`
3. Include skeleton loading states
4. Include ARIA labels and keyboard navigation

**Verification:**
- Visual inspection in browser
- Accessibility audit (keyboard navigation, screen reader)

---

### Phase 7: Page Route & Sidebar
**Risk Level:** Low (additive)  
**Files to create:**
- `/src/app/(app)/finance/page.tsx`

**Files to modify:**
- `/src/components/galaxy/sidebar.tsx` (add Finance HQ nav item)

**Tasks:**
1. Create page file with metadata
2. Add Finance HQ to sidebar navigation
3. Test navigation from sidebar

**Verification:**
- Click "Finance HQ" in sidebar → page loads
- URL shows `/finance`
- Page renders correctly

---

### Phase 8: Neptune Integration
**Risk Level:** Low (extensions to existing)  
**Files to modify:**
- `/src/lib/ai/context.ts` (add finance context gathering)
- `/src/lib/ai/system-prompt.ts` (add finance section)
- `/src/lib/ai/tools.ts` (add finance tools)

**Tasks:**
1. Add finance context gathering
2. Extend system prompt with finance capabilities
3. Add finance-specific AI tools
4. Test Neptune on Finance HQ page

**Verification:**
- Open Neptune on `/finance`
- Ask "How are my finances?"
- Verify context-aware response

---

## 4. Required Behaviors Checklist

### Data
- [ ] Multi-source aggregation works (QB + Stripe + Shopify)
- [ ] Date range filtering works
- [ ] Source filtering works
- [ ] Empty states display correctly
- [ ] Error states display correctly
- [ ] Loading skeletons appear

### UI
- [ ] KPI cards display with correct styling
- [ ] Module tiles are clickable
- [ ] Detail drawer opens/closes smoothly
- [ ] Timeline is horizontally scrollable
- [ ] Activity table sorts by date
- [ ] Reconnect banners appear for expired integrations

### Actions
- [ ] Date range picker updates data
- [ ] Filter chips filter modules
- [ ] Invoice reminder sends successfully
- [ ] Drawer actions work

### Neptune
- [ ] Context-aware suggestions appear
- [ ] Finance queries return accurate data
- [ ] Tool calls execute correctly

---

## 5. Testing Requirements

### Unit Tests
Create in `/tests/lib/finance/`:
- `normalization.test.ts` - Data normalization functions
- `services.test.ts` - Service class methods (mocked)

### API Tests
Create in `/tests/api/finance/`:
- `overview.test.ts` - Overview endpoint
- `invoices.test.ts` - Invoice CRUD

### Component Tests
Create in `/tests/components/finance-hq/`:
- `FinanceKPITile.test.tsx` - KPI card rendering
- `FinanceModuleTile.test.tsx` - Module card rendering

### E2E Tests (Optional)
- Navigate to `/finance`
- Verify data loads
- Click module → drawer opens
- Change date range → data updates

---

## 6. Visual Quality Checklist

- [ ] Cards have 16-20px border radius
- [ ] Shadows are soft (shadow-sm → shadow-md on hover)
- [ ] Typography uses Geist font
- [ ] Colors match design system
- [ ] Spacing follows 8px grid
- [ ] Charts use consistent color palette
- [ ] Icons are Lucide, 20-24px, 2px stroke
- [ ] Animations are subtle (200-300ms)
- [ ] Mobile responsive (320px and up)

---

## 7. Accessibility Checklist

- [ ] All interactive elements have `aria-label`
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Focus indicators visible
- [ ] Color contrast >= 4.5:1
- [ ] Screen reader announces updates
- [ ] Detail drawer traps focus
- [ ] Drawer closes on Escape

---

## 8. Deliverables

When Finance HQ is complete, you should have:

### New Files Created
```
src/
├── app/(app)/finance/
│   └── page.tsx
├── app/api/finance/
│   ├── overview/route.ts
│   ├── modules/route.ts
│   ├── invoices/route.ts
│   ├── invoices/[id]/route.ts
│   ├── invoices/[id]/remind/route.ts
│   ├── revenue/route.ts
│   ├── cashflow/route.ts
│   ├── timeline/route.ts
│   ├── activity/route.ts
│   └── integrations/route.ts
├── components/finance-hq/
│   ├── index.ts
│   ├── FinanceHQDashboard.tsx
│   ├── FinanceFilterContext.tsx
│   ├── FinanceKPIGrid.tsx
│   ├── FinanceKPITile.tsx
│   ├── FinanceModuleGrid.tsx
│   ├── FinanceModuleTile.tsx
│   ├── FinanceTimeline.tsx
│   ├── FinanceActivityTable.tsx
│   ├── FinanceDetailDrawer.tsx
│   ├── FinanceDatePicker.tsx
│   ├── FinanceFilterChips.tsx
│   ├── FinanceEmptyState.tsx
│   ├── FinanceHeader.tsx
│   └── charts/
│       ├── RevenueChart.tsx
│       ├── ExpenseChart.tsx
│       └── CashFlowChart.tsx
├── hooks/
│   └── useFinanceData.ts
├── lib/finance/
│   ├── index.ts
│   ├── types.ts
│   ├── quickbooks.ts
│   ├── stripe.ts
│   ├── shopify.ts
│   └── normalization.ts
└── types/
    └── finance.ts
```

### Modified Files
```
src/
├── components/galaxy/sidebar.tsx  (add Finance HQ nav)
├── db/schema.ts                   (add provider enums)
├── lib/oauth.ts                   (add QB/Shopify config)
├── lib/ai/context.ts              (add finance context)
├── lib/ai/system-prompt.ts        (add finance section)
└── lib/ai/tools.ts                (add finance tools)
```

---

## 9. Risk Mitigation

### Rollback Plan
If issues arise, Finance HQ can be disabled by:
1. Removing sidebar nav item
2. Adding redirect from `/finance` to `/dashboard`
3. All other changes are additive and non-breaking

### Feature Flag (Optional)
Wrap Finance HQ in feature flag:
```typescript
// In sidebar.tsx
const showFinanceHQ = process.env.NEXT_PUBLIC_FEATURE_FINANCE_HQ === 'true';

// Conditionally include nav item
{ showFinanceHQ && { icon: Wallet, label: "Finance HQ", href: "/finance" } }
```

---

## 10. Post-Build Verification

1. **Build passes:** `npm run build`
2. **Lint passes:** `npm run lint`
3. **Tests pass:** `npm test`
4. **Manual verification:**
   - Navigate to `/finance`
   - Empty state shows if no integrations
   - Data loads if integrations exist
   - All interactions work
   - Neptune responds to finance queries
5. **Performance check:**
   - Page loads under 2 seconds
   - No console errors
   - No network errors

---

## End of Master Build Instructions






























































