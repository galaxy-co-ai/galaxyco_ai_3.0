# Finance HQ — Product Specification (GalaxyCo Tailored)

> **Document Purpose:** Defines the product vision, goals, scope, and success criteria for Finance HQ. This document is tailored specifically for the GalaxyCo.ai 3.0 codebase and architecture.

---

## 1. Product Overview

**Finance HQ** is a unified financial command center inside GalaxyCo.ai. It consolidates data and actions from multiple external financial integrations (QuickBooks, Stripe, Shopify) into a single Apple-inspired, clean, and intuitive dashboard.

Users no longer need to switch between platforms to manage finances. Finance HQ provides:
- Real-time financial overview with unified KPIs
- Visualization of revenue, expenses, and cash flow
- Reconciliation-aware merged data from multiple providers
- Direct accounting actions (create invoices, send reminders)
- AI-powered insights through the existing Neptune assistant

### Integration with Existing GalaxyCo Features
- **Neptune Assistant:** Finance HQ extends the existing `FloatingAIAssistant` with finance-specific context modes
- **Integrations Page:** Finance providers appear alongside existing Google/Microsoft integrations
- **Sidebar Navigation:** Finance HQ joins Dashboard, Activity, Studio, CRM, etc.
- **Multi-tenant Security:** All data scoped by `workspaceId` following existing patterns

---

## 2. Goals & Key Outcomes

### Primary Goals
1. Give users a single place to view and manage all financial activity
2. Provide seamless multi-integration financial data without switching contexts
3. Enable users to take action (create invoices, review payouts, analyze expenses)
4. Present complex financial data in a clean, Apple-style interface matching GalaxyCo design system
5. Extend Neptune to simplify accounting: summarization, forecasting, anomaly detection

### Key Outcomes
- Users interact with finances directly inside GalaxyCo instead of visiting external sites
- Unified financial metrics across integrated providers
- Reduction in time spent reconciling or switching apps
- Aesthetic and usability improvements matching GalaxyCo's premium feel

---

## 3. Target Users

- Small business owners managing finances across multiple platforms
- E-commerce operators using Shopify + Stripe
- Service-based businesses using QuickBooks for accounting
- Freelancers and agencies handling invoices, payouts, and expenses
- Existing GalaxyCo users who want financial visibility alongside CRM/marketing

---

## 4. Supported Integrations (Phase 1)

| Provider | Type | Auth Method | Primary Use |
|----------|------|-------------|-------------|
| **QuickBooks Online** | Accounting | OAuth 2.0 | Invoices, expenses, P&L, cash flow |
| **Stripe** | Payments | API Key (encrypted) | Charges, payouts, subscriptions |
| **Shopify** | E-commerce | OAuth 2.0 | Orders, revenue, payouts |

> **Note:** These will be added to the existing `integrationProviderEnum` in `src/db/schema.ts`:
> Current: `['google', 'microsoft', 'slack', 'salesforce', 'hubspot']`
> After: `['google', 'microsoft', 'slack', 'salesforce', 'hubspot', 'quickbooks', 'stripe', 'shopify']`

---

## 5. Core Features (v1 Scope)

### 5.1 Dashboard Overview (Primary Page)
- **KPI Row:** Revenue, Expenses, Profit/Loss, Cash Flow, Outstanding Invoices
- **Module Grid:** Multi-integration tiles displayed based on connected providers
- **Financial Timeline:** Horizontal scroll of financial events
- **Recent Activity Table:** Unified ledger-like transaction list
- **Design:** Apple-inspired visual design using GalaxyCo's existing Tailwind config

### 5.2 Invoices Module (QuickBooks)
- List of invoices (synced from QuickBooks)
- Status breakdown (paid/unpaid/overdue)
- Quick actions: create invoice, send reminder

### 5.3 Expenses Module (QuickBooks)
- Categorized expenses from QuickBooks
- Vendor activity breakdown
- Major expense types visualization (donut chart)

### 5.4 Revenue Module (Unified)
Combines data from:
- Stripe gross & net revenue
- Shopify orders
- QuickBooks income accounts

### 5.5 Cash Flow Module
- Cash inflows/outflows
- Stripe & Shopify payouts
- QuickBooks cash flow report data

### 5.6 Financial Timeline
- Date-scrollable timeline of events (invoices, payouts, orders, expenses)
- Color-coded by source provider
- Click to open detail drawer

### 5.7 Neptune Finance Mode
Extends existing `FloatingAIAssistant` with:
- Overview mode: Summarize whole dashboard
- Module mode: Assist with specific module (invoices, revenue, etc.)
- Detail mode: Explain specific invoice/transaction
- Forecast mode: Cash flow projections

### 5.8 Multi-Integration Awareness
- Modules render dynamically based on connected integrations
- Graceful degradation when providers are disconnected/expired
- Reconnect banners following existing integration patterns

---

## 6. Explicitly Out of Scope (v1)

- Payroll integration (Gusto, ADP)
- Tax forecasting
- Inventory cost modeling
- Full double-entry ledger visualization
- Budget planning tools
- Receipt scanning + auto-categorization
- Additional providers (Square, PayPal, Xero)

---

## 7. Functional Requirements

### 7.1 Data Syncing (Using existing caching patterns)
| Provider | Refresh Interval | Cache TTL | Method |
|----------|------------------|-----------|--------|
| QuickBooks | 5-15 minutes | 300s | Background job + on-demand |
| Stripe | 3 minutes | 180s | API + webhook fallback |
| Shopify | 10 minutes | 600s | API + webhooks |

> Uses existing `getCacheOrFetch()` from `/lib/cache.ts` with Redis

### 7.2 UI Responsiveness
- Desktop-first design (matching existing GalaxyCo pattern)
- Mobile breakpoints using existing Tailwind config (sm/md/lg/xl)
- Support for collapsible modules

### 7.3 Error Handling (Using existing patterns)
- Token expiry detection → reconnect prompts
- Soft fallbacks when a provider fails
- Partial dashboard rendering if only some integrations connected
- Uses `createErrorResponse()` from `/lib/api-error-handler.ts`

### 7.4 Security Requirements (Using existing patterns)
- OAuth 2.0 tokens stored using existing `oauthTokens` table
- Encryption using existing AES-256-GCM from `/lib/encryption.ts`
- No sensitive financial data stored client-side
- All API routes server-side only with `getCurrentWorkspace()` auth

---

## 8. User Stories

### Viewing & Insights
- "As a user, I want to see all my financial metrics in one place."
- "As a user, I want to view my invoices without opening QuickBooks."
- "As a user, I want clear charts about revenue and expenses."

### Taking Action
- "As a user, I want to create or send an invoice directly from Finance HQ."
- "As a user, I want to review payouts and transactions easily."

### AI Support (Neptune)
- "As a user, I want Neptune to explain cash flow anomalies."
- "As a user, I want AI summaries of monthly revenue and expenses."
- "As a user, I want forecasts for upcoming cash flow or invoice payments."

---

## 9. Success Criteria

| Metric | Target |
|--------|--------|
| User can complete financial workflows in-app | 80-100% |
| Page load time (with cache) | < 1.5 seconds |
| Data accuracy vs provider records | 100% match |
| Neptune generates valid financial summaries | Verified |
| UI perceived as clean/intuitive/premium | User feedback |

---

## 10. GalaxyCo-Specific Considerations

### Must Preserve
- Existing design system from `DESIGN-SYSTEM.md`
- Multi-tenant security with `workspaceId` on all queries
- Existing authentication flow via Clerk
- Existing Neptune/FloatingAIAssistant behavior for non-finance pages
- Existing integration management in `/integrations` page

### Must Follow
- TypeScript strict mode with no `any` types
- Zod validation for all external inputs
- Error handling patterns from `api-error-handler.ts`
- Logging patterns from `logger.ts`
- Caching patterns from `cache.ts`

---

## End of Product Specification





