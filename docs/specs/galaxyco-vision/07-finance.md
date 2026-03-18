# 07 — Finance (Accounting Office)

> The accounting office. Finance Agents handle the full financial lifecycle — invoicing, payment tracking, expense management, cash flow projection, and financial reporting. The module starts with simple invoicing and grows into a CFO-grade financial operation.

---

## Vision

Finance is the department most small business owners hate touching. Invoices pile up, payments go unchased, expenses get categorized at tax time instead of in real-time, and cash flow surprises are the norm.

GalaxyCo's Finance module flips this. A Finance Agent handles the grind — generating invoices, chasing payments, categorizing expenses, and keeping the books clean. The user sees a clear picture of their financial health and makes the decisions that matter: pricing, spending, and growth investment.

---

## Two Views

Same toggle pattern as CRM.

### Finance View (Traditional)

Invoice list, expense tracker, payment history, financial reports. For users who want to manually create invoices, review line items, reconcile payments, or export for their accountant.

### Agent-First View

Neptune's financial briefing. What needs attention, what's healthy, what's trending.

**Top: Financial health bar** — Cash flow status, outstanding receivables, monthly revenue trend, overdue amount. Collapsed by default, expandable to full financial dashboard with charts, breakdowns by client, and trend comparisons.

**Main: Decision cards:**

- **Overdue invoices** — "Meridian Co. is 15 days overdue on $3,200. Riley sent a reminder 3 days ago. Want to escalate personally, or let Riley try again?"
- **Invoice approvals** — Agent drafted an invoice from a closed deal. One-click send or edit.
- **Expense anomalies** — "Your software subscriptions jumped 40% this month. New charge from [vendor] ($49/mo). Intentional?"
- **Cash flow alerts** — "At current pace, you'll have a cash gap in 3 weeks. Two options: chase the three largest outstanding invoices aggressively, or delay the planned marketing spend."
- **Tax prep nudges** — "Q1 ends in 2 weeks. 12 expenses are uncategorized. Want Riley to take a pass, or do you want to handle them?"
- **Reconciliation flags** — "A $2,400 payment came in from Chen but the invoice was for $2,200. Overpayment, or was there an adjustment I missed?"

Default view follows the Trust Arc — Finance View first (money is sensitive), Neptune nudges toward agent-first as the Finance Agent proves accurate.

---

## Financial Document Types

The Finance Agent works across structured document types:

| Type | When Generated | What Agent Produces |
|------|---------------|-------------------|
| **Invoice** | Deal closes in CRM, recurring schedule triggers, or user requests | Line items, quantities, rates, tax calculations, payment terms, due date, client details — all from deal data + workspace templates |
| **Estimate / Quote** | Sales Agent needs pricing for a prospect, or user requests | Same structure as invoice but flagged as non-binding. Can be converted to invoice with one click when deal closes. |
| **Credit note** | Refund, discount, or billing adjustment | References original invoice, shows adjustment amount and reason |
| **Receipt** | Payment received against an invoice | Auto-generated confirmation with payment method, date, amount, remaining balance |
| **Recurring invoice** | Subscription or retainer billing cycle | Clone of template invoice with updated dates, auto-sent on schedule |
| **Expense report** | Period summary of categorized expenses | Grouped by category, with totals, trend vs. prior period, flagged anomalies |
| **Financial summary** | Monthly/quarterly/annual reporting | Revenue, expenses, profit, cash flow, AR/AP aging, top clients by revenue — formatted for user review or accountant export |

### Invoice Template System

Each workspace has configurable invoice templates:

| Template Element | Source |
|-----------------|--------|
| **Company branding** | Logo, colors, address from workspace settings |
| **Line item structure** | Learned from deal data (services, products, hourly rates, project fees) |
| **Payment terms** | Default per workspace (Net 15, Net 30, Due on Receipt), overridable per client |
| **Tax handling** | Tax rate per jurisdiction, configurable per client if needed |
| **Payment instructions** | Connected Stripe link, bank details, or custom instructions |
| **Notes / terms** | Standard footer text, customizable per template |

Neptune builds the initial template during onboarding based on the dossier and conversation. The user can edit templates directly in Finance View or tell Neptune: "Change our default payment terms to Net 15."

---

## Agent Decision Logic

### Expense Categorization Engine

The Finance Agent doesn't just dump expenses into buckets — it maintains a structured categorization model:

**Standard Categories:**

| Category | Examples | Agent Detection Method |
|----------|---------|----------------------|
| **Software & SaaS** | Figma, Slack, Shopify, hosting | Vendor name matching against known SaaS database + transaction description parsing |
| **Advertising & Marketing** | Google Ads, Meta Ads, influencer payments | Cross-referenced with Marketing Agent campaign spend data |
| **Professional Services** | Accountant, lawyer, consultant | Vendor type + transaction pattern (irregular, large amounts) |
| **Office & Operations** | Supplies, equipment, utilities | Vendor category + recurring pattern detection |
| **Travel & Entertainment** | Flights, hotels, meals | Merchant category codes (MCC) from payment processor |
| **Payroll & Contractors** | Salary, freelancer payments | Recurring fixed amounts + payroll platform detection |
| **Agent Operations** | LLM API costs, Paperclip execution costs | Internal tracking — no external categorization needed |
| **Uncategorized** | Anything below confidence threshold | Surfaced to user for manual classification |

**Confidence Scoring:**

| Confidence Level | Agent Action |
|-----------------|-------------|
| **High (>90%)** | Auto-categorizes silently. User sees it in expense list, can correct. |
| **Medium (60-90%)** | Auto-categorizes but flags with a subtle indicator. Appears in periodic review. |
| **Low (<60%)** | Left uncategorized. Surfaces as a decision card: "Riley isn't sure about this $340 charge from [vendor]. What category?" |

**Learning loop:** Every user correction updates the categorization model. If the user consistently recategorizes charges from Vendor X, the agent learns and stops asking.

### Cash Flow Projection Engine

Cash flow projections aren't guesses — they're computed from concrete data:

**Inputs:**

| Data Source | What It Provides |
|------------|-----------------|
| **Outstanding invoices** | Expected inflows — amount, due date, client payment history (average days-to-pay per client) |
| **Recurring revenue** | Predictable monthly inflows from retainers and subscriptions |
| **Scheduled expenses** | Known upcoming costs — subscriptions, rent, payroll, ad spend budgets |
| **Historical patterns** | Seasonal revenue fluctuations, expense timing patterns, client payment behavior |
| **Pipeline deals** | Probability-weighted future revenue from CRM pipeline (deal value × close probability) |

**Output:**

A rolling 30/60/90-day projection showing:
- **Expected cash position** per week
- **Gap alerts** — weeks where projected outflows exceed inflows
- **Confidence bands** — tight bands for known amounts (invoices, subscriptions), wider bands for projected deals and variable expenses

**Trigger logic:**

| Projection Shows | Agent Action |
|-----------------|-------------|
| Cash positive for 90 days | Silent. Financial health bar shows green. |
| Gap within 30 days, resolvable | Neptune surfaces with specific options: "Chase these 3 invoices and the gap closes." |
| Gap within 30 days, structural | Neptune escalates: "This isn't a timing issue — expenses are outpacing revenue. Here are 3 options." |
| Surplus growing | Neptune surfaces opportunity: "You've got cash reserves building. Good time to invest in growth — new agent, bigger ad budget, or save?" |

### Payment Reconciliation Logic

When payments come in, the agent matches them to invoices:

| Scenario | Agent Action |
|----------|-------------|
| Payment matches invoice exactly | Auto-reconcile, mark paid, generate receipt, update cash flow |
| Payment matches within 1% (rounding, fees) | Auto-reconcile with note, flag minor discrepancy in log |
| Partial payment received | Log partial payment, update invoice balance, surface: "Chen paid $1,500 of $2,400. Partial payment — remaining balance $900. Want Riley to follow up on the rest?" |
| Overpayment received | Flag immediately: "Received $2,600 against a $2,400 invoice. Credit the extra to their account, refund, or apply to next invoice?" |
| Unmatched payment | Surface: "$500 received from unknown sender. Can't match to an invoice. Who is this from?" |
| Payment via Stripe (connected) | Fully automated — Stripe webhooks handle matching, status updates, and receipt generation |

---

## Overdue Escalation Model

Finance Agent follows a structured cadence for overdue invoices, with tone calibrated to the client relationship:

| Timing | Action | Tone | Agent Decision Logic |
|--------|--------|------|---------------------|
| Due date | Invoice sent (or re-sent as reminder) | Professional, neutral | Always automatic |
| +3 days | Gentle reminder email | "Just a friendly reminder..." | Auto-send. Agent checks if payment is in transit (Stripe pending) before sending. |
| +7 days | Firmer reminder | "Following up on the outstanding invoice..." | Auto-send. Agent includes payment link prominently. |
| +14 days | Escalation to Neptune | Neptune surfaces decision card | Neptune factors in: client value (repeat customer?), amount (material?), history (first offense?) |
| +21 days | User decides | Options presented by Neptune | Personal outreach, payment plan offer, late fee, or write-off |
| +30 days | Final notice (if user chose to continue) | "Final notice before further action" | Only sent if user explicitly approves |

**Client payment history tracking:** The agent maintains a payment reliability score per client. Clients who consistently pay on time get longer grace periods. Chronic late payers get earlier, more proactive follow-ups. This data also flows to CRM — Sales Agents know the client's payment behavior before negotiating the next deal.

**The agent never threatens, sends to collections, or takes legal-sounding action.** Those are human decisions. The agent handles the polite, persistent follow-up. The user handles the judgment calls.

---

## Recurring Billing

### Setup

Recurring invoices are created through Neptune or Finance View:

- "Bill Meridian Co. $2,000 on the 1st of every month for their retainer"
- Or manually: create invoice → mark as recurring → set frequency and duration

### Recurrence Types

| Type | Behavior |
|------|---------|
| **Fixed recurring** | Same amount, same line items, every cycle. Auto-generated and sent. |
| **Variable recurring** | Same client, same schedule, but amount varies (hourly billing, usage-based). Agent drafts from tracked hours/usage, surfaces for approval. |
| **Seasonal** | Active only during certain months (e.g., quarterly retainer). Agent follows the schedule. |

### Agent Behavior

- Auto-generates upcoming invoices 3 days before send date
- For fixed recurring: sends automatically (in autonomy mode) or surfaces for one-click approval
- For variable recurring: always surfaces for review since the amount changes
- Tracks renewal dates and surfaces: "Meridian's annual retainer renews next month. Same terms, or want to renegotiate?"

---

## Module Evolution (Trust Arc)

### Phase 1: Simple Invoicing
- Finance Agent generates invoices from closed deals
- Basic payment tracking (manual or Stripe if connected)
- User approves every invoice before sending
- Financial health bar shows simple totals

### Phase 2: Active Bookkeeping
- Expense categorization active (from connected bank or manual entry)
- Recurring invoices running
- Overdue escalation cadence operating
- Cash flow projection enabled (30-day forward view)
- Agent-first view becomes useful — real decision cards, not just approvals

### Phase 3: Financial Intelligence
- Full cash flow projection (90-day, confidence bands)
- Cross-department financial insights (marketing ROI, agent cost analysis, client profitability)
- Tax prep assistance — quarterly categorization reviews, accountant-ready exports
- Neptune proactively flags financial opportunities and risks
- Reconciliation mostly automated

### Phase 4: CFO-Grade Operations
- Financial planning and budgeting — Neptune drafts quarterly budgets based on historical data
- Predictive alerts — cash flow issues surfaced weeks before they hit
- Client profitability analysis — which clients are actually worth the effort
- Agent operates with high autonomy — invoices send, payments reconcile, expenses categorize, user sees summary

---

## Autonomy Model

Money is the most sensitive domain. The autonomy model is conservative:

- **Default:** Agent drafts invoices and reminders → user one-click approves
- **Autonomy toggle:** Agent sends invoices and routine reminders automatically. Recurring fixed invoices send without approval. Variable/new invoices still surface.
- **Always surfaces regardless of autonomy mode:**
  - Invoices above a configurable dollar threshold
  - First invoice to a new client
  - Write-off decisions
  - Expense anomalies above threshold
  - Cash flow gap alerts
  - Any reconciliation that doesn't match cleanly
  - Credit notes and refunds

---

## Cross-Department Integration

| From | What Finance Receives |
|------|----------------------|
| **CRM** | Closed deal → auto-generate invoice with deal value, client info, line items. Client payment history informs future deal negotiations. |
| **Marketing** | Campaign spend → auto-categorize as marketing expense. Ad platform spend synced from Campaign Agent. |
| **Agents** | Agent operational costs (LLM tokens, API calls, execution costs) → tracked as business expense, broken down by agent |
| **Orchestration** | Workflow triggers (deal close → invoice, overdue → escalation) |

| To | What Finance Sends |
|----|-------------------|
| **Insights** | Revenue data, expense data, cash flow metrics, profitability analysis, agent ROI calculations |
| **Neptune** | Financial health signals → informs Neptune's strategic advice across all modules |
| **CRM** | Client payment reliability scores → Sales Agent knows payment behavior before next deal |
| **Knowledge** | Payment terms, client billing arrangements, financial SOPs stored as company knowledge |

---

## Neptune as CFO Advisor

| Situation | Neptune Does |
|-----------|-------------|
| Healthy cash flow | "Finances are clean. Revenue up 12% MoM. No action needed." |
| Overdue pile-up | "$12K in receivables over 30 days. Two are repeat clients — Riley's sending reminders. The third needs your personal touch." |
| Cash flow warning | "At current pace, you'll be tight in 3 weeks. I see two levers: chase these 3 outstanding invoices or delay the planned marketing spend." |
| Expense spike | "Software costs jumped 40%. New charge from Figma ($49/mo). Intentional?" |
| Tax season | "Q1 closes in 2 weeks. Riley has your expenses 90% categorized. 8 items need your input. Here they are." |
| Growth signal | "Revenue's climbed steadily for 3 months. Cash reserves are building. Good time to invest — new agent, bigger ad budget, or save?" |
| Client profitability | "Morrison accounts for 30% of your revenue but 50% of your support time. Worth revisiting that rate." |
| Agent ROI | "Your agents cost $380 this month and generated $14K in closed revenue. That's 37:1 ROI." |

---

## Data Model Enhancements

| Addition | Purpose |
|----------|---------|
| `generatedByAgentId` | Which agent created this document |
| `documentType` | Structured enum: invoice, estimate, credit_note, receipt, recurring_invoice, expense_report, financial_summary |
| `sourceEntityType` / `sourceEntityId` | Link to originating deal, recurring schedule, or manual creation |
| `templateId` | Which invoice template was used |
| `reminderCadenceStatus` | Where in the overdue escalation sequence (none, day3, day7, day14, escalated, resolved) |
| `lastAgentAction` / `lastAgentActionAt` | Most recent agent touch |
| `attentionFlag` / `attentionReason` | Needs human decision |
| `categoryId` / `categoryConfidence` | Expense category assignment with confidence score |
| `paymentReliabilityScore` | Per-client score based on payment history (feeds to CRM) |
| `reconciliationStatus` | matched, partial, overpayment, unmatched, pending |
| `recurringScheduleId` | Link to recurrence configuration for recurring invoices |
| `cashFlowImpact` | Projected impact on cash flow (positive for revenue, negative for expenses) |

---

## Integrations

### Priority Connections

| Integration | What It Enables | Agent Behavior Change |
|-------------|----------------|----------------------|
| **Stripe** | Payment processing, auto-tracking, recurring billing, payment links in invoices | Full automation: payment → receipt → reconciliation → cash flow update. Zero manual input. |
| **Plaid** (bank connection) | Expense auto-import, cash flow actuals, real balance data | Expense categorization becomes proactive. Cash flow projections use real balances instead of estimates. |
| **QuickBooks / Xero** | Two-way sync for businesses that need traditional books | Agent keeps GalaxyCo books AND syncs to accounting software. Accountant sees the same data. |
| **Receipt scanning** (camera/upload) | Photo → OCR → categorized expense | Mobile expense capture: snap receipt → agent categorizes → done in 5 seconds. |

---

## Mobile

- **Primary surface:** Financial health bar — one-glance cash position
- **Decision cards:** Approve invoices, handle overdue, categorize flagged expenses — all thumb-speed
- **Receipt capture:** Camera → agent categorizes → confirm → done
- **Invoice creation:** Simplified form, agent fills defaults from deal data
- **Cash flow:** Simplified sparkline projection, not full chart

---

## Open Questions

1. **Accounting compliance:** Finance Agents produce financial documents. User approval makes it their document — but should invoices carry a subtle "Prepared by AI" disclaimer? Jurisdiction-dependent. Recommendation: optional setting, off by default.

2. **Multi-currency:** Agencies with international clients need multi-currency invoicing and conversion. Not MVP but the data model must accommodate currency per invoice and per client.

3. **Tax jurisdiction awareness:** Different rules for different states/countries. Recommendation: basic tax line items with configurable rates. Complex tax compliance deferred to connected accounting software (QuickBooks/Xero).

4. **Expense approval workflows:** Multi-user workspaces need expense approval routing. Recommendation: Phase 3+ feature. Single-user workspaces don't need it. When added, Finance Agent routes to workspace owner or designated approver.

5. **Late fees:** Should the agent automatically add late fees to overdue invoices? Recommendation: never automatic. Neptune surfaces the option: "Meridian is 30 days overdue. Want to apply a late fee?" User's call.

---

*This spec depends on: `00-philosophy.md` (modules as departments), `04-neptune.md` (CFO advisor behavior), `05-agents.md` (agent identity, autonomy model, activity toasts), `06-crm.md` (deal → invoice handoff, client payment data)*
*This spec informs: `08-marketing.md` (marketing spend tracking), `11-insights.md` (financial analytics, agent ROI), `13-settings-admin.md` (billing, subscription management)*
