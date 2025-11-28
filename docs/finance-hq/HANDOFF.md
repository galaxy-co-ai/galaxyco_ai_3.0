# 🚀 Finance HQ Build — Agent Handoff Document

> **CRITICAL:** Read this entire document before writing any code. This project requires extreme care to avoid damaging a production-quality codebase.

---

## ⚠️ MANDATORY FIRST STEPS

Before doing ANYTHING else:

1. **Verify codebase state:**
   ```bash
   git status          # Must show "nothing to commit, working tree clean"
   npm run build       # Must pass without errors
   npm run lint        # Must pass without errors
   ```

2. **If any of the above fail, STOP and fix them first.**

3. **Read the specification documents** in `docs/finance-hq/` (numbered 01-10)

---

## 📋 Project Summary

You are building **Finance HQ** — a new top-level page in GalaxyCo that serves as a unified financial command center.

### What Finance HQ Does
- Connects to QuickBooks, Stripe, and Shopify
- Merges financial data into a single dashboard
- Shows KPIs, modules, timeline, and activity
- Enables actions (create invoices, send reminders)
- Extends Neptune AI with finance-specific context

### What You're Building
- 1 new page route (`/finance`)
- 10 new API routes
- ~20 new React components
- 5 new backend services
- Neptune AI extensions

---

## 🛡️ CRITICAL RULES — DO NOT VIOLATE

### Rule 1: No Breaking Changes — PROTECT EXISTING CODE
**This is a production-quality codebase. Your job is to ADD Finance HQ, not change anything else.**

❌ **DO NOT MODIFY these directories/files:**
- `/src/components/ui/*` — Base UI components (use as-is)
- `/src/components/galaxy/*` — App shell components (except sidebar.tsx for nav item)
- `/src/components/crm/*` — CRM feature
- `/src/components/dashboard/*` — Dashboard feature
- `/src/components/studio/*` — Studio feature
- `/src/components/marketing/*` — Marketing feature
- `/src/components/lunar-labs/*` — Lunar Labs feature
- `/src/components/shared/*` — Shared components (use as-is)
- `/src/app/(app)/dashboard/*` — Dashboard page
- `/src/app/(app)/crm/*` — CRM pages
- `/src/app/(app)/studio/*` — Studio pages
- Any existing API routes outside `/api/finance/`
- `globals.css`, `tailwind.config.ts` — Design system
- Existing types in `/src/types/`

✅ **YOU MAY ONLY:**
- CREATE new files in `/src/components/finance-hq/`
- CREATE new files in `/src/app/(app)/finance/`
- CREATE new files in `/src/app/api/finance/`
- CREATE new files in `/src/lib/finance/`
- CREATE `/src/types/finance.ts`
- CREATE `/src/hooks/useFinanceData.ts`
- ADD values to `integrationProviderEnum` in `/src/db/schema.ts`
- ADD provider configs to `/src/lib/oauth.ts`
- ADD nav item to `/src/components/galaxy/sidebar.tsx` (do not change anything else)
- ADD functions/sections to `/src/lib/ai/*.ts` (do not modify existing functions)

### Rule 2: Follow Existing Patterns
- Use `getCurrentWorkspace()` for all API routes (from `/lib/auth`)
- Use `getCacheOrFetch()` for caching (from `/lib/cache`)
- Use `createErrorResponse()` for errors (from `/lib/api-error-handler`)
- Use `logger` for logging (from `/lib/logger`)
- Use Zod for validation (already in project)

### Rule 3: TypeScript Strict Mode
- No `any` types without justification in comments
- Use `unknown` when type is uncertain
- Define all types in `/src/types/finance.ts`

### Rule 4: Accessibility Required
- All interactive elements need `aria-label` or `aria-labelledby`
- All controls must be keyboard accessible (Tab, Enter, Escape)
- Focus indicators must be visible

### Rule 5: Error Handling Mandatory
- Every async function needs try-catch
- Never show technical errors to users
- Use toast for user-facing feedback

### Rule 6: Test After Each Phase
- Run `npm run build` after each phase
- Run `npm run lint` after each phase
- If either fails, fix before proceeding

---

## 📁 Specification Documents

All detailed specifications are in `docs/finance-hq/`:

| Document | What It Covers |
|----------|---------------|
| `01-product-spec.md` | Product goals, scope, user stories |
| `02-ux-wireframe.md` | Page layout, interaction flows |
| `03-ui-style-guide.md` | Visual design, colors, typography |
| `04-component-architecture.md` | Component props, state, behavior |
| `05-backend-api-spec.md` | API routes, requests, responses |
| `06-integration-mapping.md` | OAuth, encryption, provider APIs |
| `07-neptune-assistant-spec.md` | AI context, tools, prompts |
| `08-state-management.md` | SWR hooks, Context patterns |
| `09-routes-and-navigation.md` | Page route, sidebar integration |
| `10-master-build-instructions.md` | Build order, checklists |
| `EXECUTION_PLAN.md` | Phased implementation plan |

**Read these before coding.** They are tailored specifically for this GalaxyCo codebase.

---

## 🏗️ Build Order (8 Phases in 3 Sessions)

This build is divided into **3 sessions** with clear stopping points.

---

## 🔷 SESSION 1: Backend Foundation (Phases 1-4)

### Phase 1: Foundation (Types & Structure)
**Create:**
- `/src/types/finance.ts` — All TypeScript types

**Verify:** `npm run build` passes

### Phase 2: Database Schema
**Modify:**
- `/src/db/schema.ts` — Extend `integrationProviderEnum`

**Run:** `npx drizzle-kit push`

**Verify:** Migration applied, build passes

### Phase 3: Backend Services
**Create:**
- `/src/lib/finance/index.ts`
- `/src/lib/finance/types.ts`
- `/src/lib/finance/quickbooks.ts`
- `/src/lib/finance/stripe.ts`
- `/src/lib/finance/shopify.ts`
- `/src/lib/finance/normalization.ts`

**Modify:**
- `/src/lib/oauth.ts` — Add QB/Shopify OAuth config

**Verify:** Build passes

### Phase 4: API Routes
**Create all routes in `/src/app/api/finance/`:**
- `integrations/route.ts`
- `overview/route.ts`
- `modules/route.ts`
- `timeline/route.ts`
- `activity/route.ts`
- `invoices/route.ts`
- `invoices/[id]/route.ts`
- `invoices/[id]/remind/route.ts`
- `revenue/route.ts`
- `cashflow/route.ts`

**Verify:** All routes return valid JSON, build passes

---

## 🛑 SESSION 1 COMPLETE — STOP HERE

**Before ending this session, you MUST:**

1. Run and confirm these pass:
   ```bash
   npm run build
   npm run lint
   ```

2. Test at least one API route works:
   ```bash
   # Start dev server and test
   curl http://localhost:3000/api/finance/integrations
   ```

3. **VERIFY EXISTING FEATURES STILL WORK:**
   - Navigate to `/dashboard` — should load normally
   - Navigate to `/crm` — should load normally
   - Navigate to `/studio` — should load normally
   - If ANY existing page is broken, you must fix it before ending

4. Provide a **Session 1 Summary** to the user with:
   - ✅ List of files created
   - ✅ Confirmation build/lint pass
   - ✅ Confirmation existing pages still work
   - ✅ Any issues encountered
   - ➡️ Instructions to start Session 2

**DO NOT proceed to Phase 5. A new conversation session is required.**

---

## 🔷 SESSION 2: Frontend Components (Phases 5-6)

> **Prerequisites:** Session 1 must be complete. Verify with `npm run build`.

### Phase 5: UI Components
**Create all components in `/src/components/finance-hq/`:**
- `FinanceFilterContext.tsx`
- `FinanceHeader.tsx`
- `FinanceDatePicker.tsx`
- `FinanceFilterChips.tsx`
- `FinanceEmptyState.tsx`
- `FinanceKPITile.tsx`
- `FinanceKPIGrid.tsx`
- `FinanceModuleTile.tsx`
- `FinanceModuleGrid.tsx`
- `FinanceTimeline.tsx`
- `FinanceActivityTable.tsx`
- `FinanceDetailDrawer.tsx`
- `charts/RevenueChart.tsx`
- `charts/ExpenseChart.tsx`
- `charts/CashFlowChart.tsx`
- `FinanceHQDashboard.tsx`
- `index.ts`

**Create hook:**
- `/src/hooks/useFinanceData.ts`

**Verify:** Components render, build passes

### Phase 6: Page & Navigation
**Create:**
- `/src/app/(app)/finance/page.tsx`

**Modify:**
- `/src/components/galaxy/sidebar.tsx` — Add Finance HQ nav item

**Verify:** Navigate to `/finance`, page loads

---

## 🛑 SESSION 2 COMPLETE — STOP HERE

**Before ending this session, you MUST:**

1. Run and confirm these pass:
   ```bash
   npm run build
   npm run lint
   ```

2. Verify the Finance HQ page loads:
   - Start dev server (`npm run dev`)
   - Navigate to `http://localhost:3000/finance`
   - Confirm page renders (even if showing empty state)

3. **VERIFY EXISTING FEATURES STILL WORK:**
   - Navigate to `/dashboard` — should load normally, UI unchanged
   - Navigate to `/crm` — should load normally, UI unchanged
   - Navigate to `/studio` — should load normally, UI unchanged
   - Check sidebar — all existing nav items should still work
   - If ANY existing page is broken or looks different, you must fix it before ending

4. Provide a **Session 2 Summary** to the user with:
   - ✅ List of components created
   - ✅ Confirmation page loads at /finance
   - ✅ Confirmation ALL existing pages still work and look the same
   - ✅ Screenshot or description of Finance HQ current state
   - ➡️ Instructions to start Session 3

**DO NOT proceed to Phase 7. A new conversation session is required.**

---

## 🔷 SESSION 3: AI Integration & Polish (Phases 7-8)

> **Prerequisites:** Sessions 1 & 2 must be complete. Page must load at /finance.

### Phase 7: Neptune Extension
**Modify:**
- `/src/lib/ai/context.ts` — Add finance context
- `/src/lib/ai/system-prompt.ts` — Add finance section
- `/src/lib/ai/tools.ts` — Add finance tools

**Verify:** Open Neptune on `/finance`, ask about finances

### Phase 8: Polish & Test
- Visual polish
- Accessibility audit
- Performance check
- Final build verification

---

## ✅ SESSION 3 COMPLETE — BUILD FINISHED

**Before ending this session, you MUST:**

1. Run final verification:
   ```bash
   npm run build
   npm run lint
   ```

2. **VERIFY ALL EXISTING FEATURES STILL WORK:**
   - Navigate to `/dashboard` — should load normally, UI unchanged
   - Navigate to `/crm` — should load normally, UI unchanged  
   - Navigate to `/studio` — should load normally, UI unchanged
   - Navigate to `/marketing` — should load normally, UI unchanged
   - Navigate to `/integrations` — should load normally, UI unchanged
   - Open Neptune on a NON-finance page — should work as before
   - If ANY existing feature is broken or behaves differently, FIX IT

3. Complete the **Definition of Done** checklist (see below)

4. Provide a **Final Summary** to the user with:
   - ✅ All Finance HQ features working
   - ✅ ALL existing features verified working and unchanged
   - ✅ Definition of Done checklist completed
   - ✅ Any known limitations or future improvements

---

## 📐 Key Existing Patterns to Follow

### API Route Pattern
```typescript
// Follow this pattern for ALL finance routes
import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { getCacheOrFetch } from '@/lib/cache';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    
    const rateLimitResult = await rateLimit(`api:finance:endpoint:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }
    
    // Validate, fetch, cache, return
    const data = await getCacheOrFetch(`cache:key:${workspaceId}`, fetchFn, { ttl: 180 });
    return NextResponse.json(data);
  } catch (error) {
    return createErrorResponse(error, 'Finance endpoint error');
  }
}
```

### Component Pattern
```typescript
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface FinanceComponentProps {
  data?: DataType;
  isLoading?: boolean;
  className?: string;
}

export function FinanceComponent({ data, isLoading, className }: FinanceComponentProps) {
  if (isLoading) {
    return <FinanceComponentSkeleton />;
  }

  return (
    <Card className={cn("p-6 rounded-2xl shadow-sm", className)}>
      {/* Content */}
    </Card>
  );
}

function FinanceComponentSkeleton() {
  return (
    <Card className="p-6 rounded-2xl shadow-sm">
      <Skeleton className="h-8 w-32 mb-4" />
      <Skeleton className="h-4 w-full" />
    </Card>
  );
}
```

### SWR Data Hook Pattern
```typescript
"use client";

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useFinanceData(dateRange: DateRange) {
  return useSWR(
    `/api/finance/endpoint?start=${dateRange.start.toISOString()}&end=${dateRange.end.toISOString()}`,
    fetcher,
    {
      refreshInterval: 180000,
      revalidateOnFocus: true,
    }
  );
}
```

---

## 🎨 Design System Reference

Use these values for Finance HQ styling:

| Element | Value |
|---------|-------|
| Card radius | `rounded-2xl` (16px) |
| Card shadow | `shadow-sm` → `shadow-md` on hover |
| Section spacing | `space-y-6` |
| Card padding | `p-4` or `p-6` |
| Grid gaps | `gap-4` or `gap-6` |
| KPI number size | `text-3xl font-bold` |
| Page title | `text-2xl font-semibold` |
| Font | Geist Sans (already configured) |
| Positive amount | `text-green-600` |
| Negative amount | `text-red-600` |

### Provider Colors
| Provider | Badge Class |
|----------|-------------|
| QuickBooks | `bg-emerald-50 text-emerald-700` |
| Stripe | `bg-indigo-50 text-indigo-700` |
| Shopify | `bg-lime-50 text-lime-700` |

---

## 🔧 Environment Variables Needed

Add to `.env.local`:
```bash
# QuickBooks OAuth
QUICKBOOKS_CLIENT_ID=
QUICKBOOKS_CLIENT_SECRET=

# Shopify OAuth  
SHOPIFY_CLIENT_ID=
SHOPIFY_CLIENT_SECRET=

# Stripe (optional - API keys stored per workspace)
STRIPE_WEBHOOK_SECRET=
```

Note: Finance HQ can work without these keys by showing appropriate empty states.

---

## 🚨 Common Pitfalls to Avoid

1. **Don't modify ANY existing components** — Create new ones in `/components/finance-hq/`
2. **Don't change `/components/ui/*`** — Use them as-is, never edit
3. **Don't change `/components/galaxy/*`** — Only add nav item to sidebar
4. **Don't change existing API routes** — Only create new ones in `/api/finance/`
5. **Don't change existing pages** — Only create `/app/(app)/finance/`
6. **Don't change `globals.css` or `tailwind.config.ts`** — Use existing design tokens
7. **Don't use Zustand** — Use SWR + Context (see spec 08)
8. **Don't forget `"use client"`** — Add to all interactive components
9. **Don't skip TypeScript types** — Define everything in `/types/finance.ts`
10. **Don't forget error handling** — Every async needs try-catch
11. **Don't skip accessibility** — ARIA labels, keyboard nav required
12. **Don't "improve" or "refactor" existing code** — You're only here to ADD Finance HQ

---

## ✅ Definition of Done

Finance HQ is complete when:

- [ ] `/finance` page loads without errors
- [ ] Empty state shows when no integrations
- [ ] KPIs display with correct styling
- [ ] Module grid renders dynamically
- [ ] Timeline is horizontally scrollable
- [ ] Activity table shows transactions
- [ ] Detail drawer opens/closes
- [ ] Date picker filters data
- [ ] Source filters work
- [ ] Neptune responds with finance context
- [ ] Sidebar shows Finance HQ
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Keyboard navigation works

---

## 🆘 If Something Goes Wrong

### Build Fails
1. Check error message carefully
2. Likely a type error or import issue
3. Fix the specific error
4. Re-run build

### Lint Fails
1. Run `npm run lint -- --fix` for auto-fixable issues
2. Manually fix remaining issues
3. Re-run lint

### Page Doesn't Load
1. Check browser console for errors
2. Check terminal for server errors
3. Verify route file exists at correct path
4. Check for syntax errors in component

### Existing Features Break
1. **STOP immediately**
2. `git diff` to see what changed
3. Revert problematic changes
4. Identify root cause before proceeding

---

## 📞 Final Notes

This build should be:
- **Careful** — Take your time, verify each phase
- **Incremental** — Don't rush, test frequently
- **Clean** — Follow existing patterns exactly
- **Quality** — This is a premium product

The specification documents in `docs/finance-hq/` contain everything you need. When in doubt, check the specs.

Good luck! 🎉

---

## Quick Start Command

To begin, first verify the codebase:

```bash
cd c:\Users\Owner\workspace\galaxyco-ai-3.0
git status
npm run build
npm run lint
```

If all pass, start with Phase 1: Create `/src/types/finance.ts`

---

*Document created for agent handoff. All specifications are in `docs/finance-hq/`.*

