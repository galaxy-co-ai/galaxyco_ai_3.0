# 11 — Insights (Analytics)

> The meta-view. Neptune narrates the story of your business — connecting dots across departments that no single module can see alone. Charts exist for depth, but the default experience is Neptune telling you what matters and what to do about it.

---

## Vision

Analytics dashboards are where data goes to be ignored. Small business owners don't have time to interpret 15 charts. They need someone to tell them: "Revenue is up but your lead pipeline is thinning — here's what that means and what I'd do."

GalaxyCo's Insights module is Neptune-narrated analytics. The default experience isn't charts — it's Neptune connecting dots across CRM, Finance, Marketing, and Agent performance to tell the user the story of their business. Charts and data are available for depth, but the narrative is the product.

---

## Two Views

### Insights View (Traditional)

Dashboard with charts, graphs, and tables. Revenue trends, pipeline metrics, marketing performance, agent costs. Filterable by date range, department, agent. Exportable for reports or investor decks.

Organized by department tabs + a cross-department overview. Standard chart types: line charts for trends, bar charts for comparisons, tables for detailed data. Nothing novel here — this is the deep-dive view for when users say "show me the numbers."

### Agent-First View (Neptune-Narrated)

Neptune delivers insight as narrative — plain language, with data supporting the story rather than leading it.

**Top: Business health pulse** — A single-sentence status with color coding.
- **Green:** "Your business is growing. Revenue up 12%, pipeline strong, team efficient."
- **Amber:** "Revenue steady but pipeline is thinning. One area needs attention."
- **Red:** "Cash flow issue developing. Action needed this week."

**Main: Narrative cards** — Neptune's analysis, organized by priority:

| Priority | Card Type | Example |
|----------|-----------|---------|
| **Act Now** (red) | Critical issue requiring immediate attention | "Close rate dropped 15% this month. The issue isn't lead quality — it's follow-up speed. Your agents are 2 days slower. I've already tightened Alex's cadence." |
| **Watch** (amber) | Emerging trend that could become a problem | "Marketing spend is up 30% but lead volume only grew 10%. ROI is declining. Worth reviewing the Google Ads targeting." |
| **Opportunity** (blue) | Actionable insight the user can capitalize on | "Referral leads close 3x faster than cold outreach. You've only asked for 2 referrals this quarter. Want me to build a referral campaign?" |
| **Celebrate** (green) | Win worth acknowledging | "Best revenue month in 3 months. Finance Agent collected $18K, two overdue invoices resolved. Nice trajectory." |
| **Inform** (neutral) | Context without urgency | "Your Content Agent's posts are performing 15% better this month. The carousel format shift is working." |

Each card has a **"See the data"** expandable that reveals supporting charts/numbers inline. The user never has to switch views to validate Neptune's claims.

### Why Narrative-First

The target market is agency owners and e-commerce founders — operators, not analysts. They want to know:
1. Is my business healthy?
2. What needs my attention?
3. What should I do next?

Charts answer none of these questions directly. Neptune does.

---

## Insight Generation Engine

Neptune doesn't manually write insights. The Insight Generation Engine is a structured system that detects patterns, evaluates significance, and produces narrative:

### Detection Layer

| Detection Type | How It Works | Example Output |
|---------------|-------------|---------------|
| **Trend detection** | Compare current period to previous period and same period last year. Flag changes exceeding significance thresholds. | "Revenue up 12% MoM" or "Lead volume down 15% — first decline in 4 months" |
| **Anomaly detection** | Statistical deviation from rolling baseline. Flags metrics that move more than 2σ from their expected range. | "Your usual Tuesday lead spike didn't happen — 60% below typical Tuesday volume" |
| **Cross-department correlation** | Monitor paired metrics across departments. When one moves, check if the related metric moved correspondingly — or didn't. | "Marketing spend up 30% but leads only up 10% — spend isn't converting proportionally" |
| **Threshold breach** | Configurable alerts when metrics cross defined boundaries. | "Cash reserves below $5K threshold", "Close rate below 20% target" |
| **Pattern recognition** | Identify recurring patterns over time (seasonal, weekly cycles, client behavior). | "Q1 cash flow always tightens due to client payment cycles — same pattern as last year" |
| **Agent performance shift** | Track agent KPIs over rolling windows. Detect improvement or degradation. | "Sales Agent follow-up speed degraded from 4 hours to 26 hours over the past 2 weeks" |

### Significance Scoring

Not every detected signal becomes an insight card. The engine scores each signal:

| Factor | Weight | Logic |
|--------|--------|-------|
| **Magnitude** | 30% | How big is the change? A 2% revenue dip is noise. A 15% drop is significant. |
| **Trend direction** | 20% | Is this a new direction (reversal) or continuation? Reversals score higher. |
| **Business impact** | 25% | Does this affect revenue, cash flow, or growth directly? Financial signals score higher than vanity metrics. |
| **Actionability** | 15% | Can the user or an agent do something about this? Unactionable insights get deprioritized. |
| **Novelty** | 10% | Has the user seen this insight before? Repeated signals get suppressed unless worsening. |

Signals scoring above threshold become insight cards. Those below are logged but not surfaced.

### Narrative Generation

Each insight card is structured:

1. **Headline** — One sentence stating what happened ("Close rate dropped 15% this month")
2. **Diagnosis** — Why it happened, connecting cross-department signals ("The issue isn't lead quality — it's follow-up speed")
3. **Action taken or recommended** — What Neptune/agents already did, or what the user should do ("I've already tightened Alex's cadence" or "Want me to adjust the campaign targeting?")
4. **Supporting data** — Hidden by default, expandable. The charts/numbers that back the narrative.

---

## Cross-Department Intelligence

Insights is the only module that sees across all departments simultaneously. These compound insights are Neptune's highest-value output:

| Signal A (Department) | + Signal B (Department) | = Compound Insight |
|----------------------|------------------------|-------------------|
| Revenue up 12% (Finance) | Lead volume down 15% (CRM) | "You're closing better but the top of funnel is thinning. Growth will stall in 6-8 weeks if lead volume doesn't recover." |
| Marketing spend up (Finance) | Close rate flat (CRM) | "You're spending more to acquire the same quality leads. The targeting needs adjustment, not the budget." |
| Agent costs rising (Agents) | Revenue rising faster (Finance) | "Your agents are getting more expensive but they're generating more than enough to justify it. ROI: 4.2x." |
| Overdue invoices increasing (Finance) | Client satisfaction stable (CRM) | "Overdue invoices are up but it's not a relationship issue — it's seasonality. Your clients' cash cycles slow down in Q1." |
| Content engagement up (Marketing) | Lead attribution flat (CRM) | "Your content is getting attention but not converting. The posts are engaging but the CTAs aren't driving action." |
| Workflow execution time increasing (Orchestration) | No errors (Orchestration) | "Your automations are slowing down — likely volume growth. The system is healthy but may need capacity attention." |
| Knowledge freshness declining (Knowledge) | Agent errors increasing (Agents) | "Your knowledge base is getting stale and agents are making more mistakes. The two may be connected — agents drawing from outdated information." |

---

## Metrics Taxonomy

### Core Business Metrics (Cross-Department)

| Metric | Source | Calculation |
|--------|--------|-------------|
| **Revenue** (monthly, trending) | Finance | Sum of paid invoices in period |
| **MRR** (Monthly Recurring Revenue) | Finance | Sum of active recurring invoice values |
| **Cash Flow** (actual + projected) | Finance | Cash in - cash out, projected from receivables/payables |
| **Net Profit** | Finance | Revenue - expenses (including agent costs) |
| **Customer Count** (active) | CRM | Unique clients with activity in last 90 days |
| **Agent ROI** | Agents + Finance | (Revenue attributed to agent work) / (Agent operational cost) |

### CRM Metrics

| Metric | Calculation |
|--------|-------------|
| Pipeline value | Sum of deal values by stage (optionally probability-weighted) |
| Lead volume | New leads per period, by source |
| Close rate | Closed Won / (Closed Won + Closed Lost) per period |
| Average deal size | Sum of closed deal values / count of closed deals |
| Sales cycle length | Average days from lead creation to close |
| Follow-up speed | Average time between lead action and agent response |
| Response rate | % of outreach that receives a reply |
| Lead source ROI | Revenue per lead source / cost per lead source |

### Finance Metrics

| Metric | Calculation |
|--------|-------------|
| Outstanding receivables | Total unpaid invoice value, aged (0-30, 31-60, 61-90, 90+) |
| Collection rate | Paid invoices / total invoices in period |
| Days Sales Outstanding (DSO) | Average days from invoice to payment |
| Expense ratio | Total expenses / total revenue |
| Top expense categories | Ranked by total spend per category |
| Client profitability | Revenue from client - cost of servicing client (agent time, support) |

### Marketing Metrics

| Metric | Calculation |
|--------|-------------|
| Content output | Pieces published per period, by type and platform |
| Engagement rate | (Likes + comments + shares) / impressions, per platform |
| Campaign ROAS | Revenue attributed to campaign / campaign spend |
| Cost per lead (CPL) | Campaign spend / leads generated |
| Audience growth | Net follower/subscriber change per platform |
| Content calendar adherence | Published / planned, per period |
| Top performing content | Ranked by engagement, clicks, or conversions |

### Agent Metrics

| Metric | Calculation |
|--------|-------------|
| Total agent cost | Sum of all agent operational costs (LLM tokens, API calls, execution) |
| Cost per agent | Individual agent operational cost |
| Tasks completed | Actions completed per agent per period |
| Cost per outcome | Agent cost / outcomes produced (cost per lead, cost per invoice, cost per post) |
| Trust score trend | Rolling trust score per agent over time |
| Uptime | % of scheduled operating time the agent was active |
| Error rate | Failed actions / total actions per agent |

### Workflow Metrics

| Metric | Calculation |
|--------|-------------|
| Workflow success rate | Completed / total executions per workflow |
| Average execution time | Mean duration from trigger to completion |
| Time saved | Estimated manual hours replaced by automation |
| Human gate response time | Average time user takes to respond to decision cards in workflows |

---

## Report Generation

### Report Types

| Report | Audience | Content | Format |
|--------|----------|---------|--------|
| **Weekly Summary** | User | Neptune's narrative of the week: key metrics, wins, issues, recommendations | In-app card + optional email digest |
| **Monthly Business Review** | User / investors | Revenue, expenses, growth trends, agent performance, strategic outlook | Exportable PDF, one-page or detailed |
| **Quarterly Review** | User / accountant | Financial summary, tax prep data, expense breakdown, cash flow analysis | Exportable PDF + CSV data |
| **Client Report** (agencies) | User's clients | Campaign performance, content delivered, leads generated, ROI | Branded PDF with agency logo |
| **Agent Performance Report** | User | Per-agent metrics, cost analysis, ROI, trust scores, recommendations | In-app view + exportable |

### Generation Logic

Reports are generated by Neptune on schedule or on demand:

- **Weekly summary:** Auto-generated every Monday morning, appears as a Home feed card
- **Monthly/Quarterly:** Neptune surfaces at period end: "Want me to generate your March business review?"
- **Client reports:** Agency users can request for specific clients: "Generate a report for Meridian Co. covering last month"
- **On-demand:** User asks "How did we do last quarter?" — Neptune generates a report in real-time

---

## Module Evolution (Trust Arc)

### Phase 1: Basic Metrics
- Simple dashboards: revenue, leads, deals
- Neptune provides basic weekly summaries
- Limited cross-department correlation (not enough data)
- Insights View is sparse — few charts, little history

### Phase 2: Pattern Recognition
- Enough data for trend detection and basic anomaly detection
- Neptune starts connecting cross-department signals
- Narrative cards become substantive — real diagnosis, not just numbers
- Weekly summaries include actionable recommendations

### Phase 3: Strategic Intelligence
- Full cross-department correlation active
- Predictive signals ("At this rate, you'll have a cash gap in 6 weeks")
- Client profitability analysis online
- Report generation available
- Neptune proactively surfaces strategic opportunities

### Phase 4: Business Oracle
- Long-term pattern recognition (seasonal, annual cycles)
- Benchmark comparisons against industry and GalaxyCo aggregate (if opted in)
- Neptune drafts strategic plans based on data: "Based on your Q1 performance, here's a Q2 plan"
- Insights module is the strategic heartbeat of the business

---

## Neptune as Analyst

| Situation | Neptune Does |
|-----------|-------------|
| Weekly check-in | "Here's your week: $14K revenue, 5 new leads, 3 deals advanced, 2 posts published. One thing to watch: your ad spend is outpacing returns." |
| Anomaly detected | "Something's off — your usual Tuesday lead spike didn't happen. Checking if it's the Google campaign or seasonal." |
| Trend identified | "For 3 months straight, your case studies outperform every other content type. Maya's shifting the calendar to match." |
| Quarterly review | "Q1 wrap: revenue grew 18%, agents handled 340 tasks, cost efficiency improved 12%. Here's a one-page summary." |
| User question | "Why did revenue drop in March?" → Neptune pulls data, correlates across departments, delivers narrative with supporting data. |
| Proactive strategy | "Referral leads close 3x faster at 1/5 the cost. You're not using referrals strategically. Want to build a program?" |
| Agent ROI justification | "Your agents cost $380 this month. They touched $14K in closed revenue, published 12 pieces of content, and sent 47 invoices. That's a 37:1 return." |

---

## Time Ranges & Comparison

- **Default view:** Last 30 days with month-over-month comparison
- **Available:** 7d, 30d, 90d, YTD, custom range
- **Comparison modes:** Previous period, same period last year, custom baseline
- **Neptune adapts:** Phase 1-2 users see short-term trends and first-value metrics. Phase 3+ users get longer-term strategic analysis and predictions.

---

## Data Pipeline

```
Department events (deal closed, invoice paid, content published, agent action, etc.)
    → Event stream (real-time)
        → Metrics aggregation (hourly, daily, weekly, monthly buckets)
            → Insight Generation Engine (detection, scoring, narrative)
                → Insight cards (agent-first view)
                → Chart data (insights view)
                → Report data (on-demand generation)
```

All metrics are computed from the same event stream. No separate data collection per module — the pipeline is unified.

---

## Mobile

- Neptune-narrated view is mobile-native — narrative cards are perfect for vertical scroll
- Business health pulse is the primary glance surface
- Charts simplified to sparklines and trend indicators
- "Ask Neptune" prominent — conversational analytics on mobile
- Reports viewable but not generated on mobile (generation triggers on desktop, PDF viewable anywhere)

---

## Open Questions

1. **Benchmark data:** Can Neptune compare the user's metrics against industry benchmarks? Requires aggregate data across GalaxyCo users. Privacy consideration: opt-in only, anonymized, minimum cohort size. Recommendation: Phase 4 feature.

2. **Predictive accuracy disclosure:** When Neptune makes predictions ("Cash gap in 6 weeks"), should confidence levels be shown? Recommendation: not by default. Neptune states predictions as directional, not precise. "See the data" expandable shows the underlying projection with confidence bands.

3. **Real-time vs. batch analytics:** Narrative cards update daily. Should any metrics be truly real-time? Recommendation: business health pulse updates hourly. Everything else is daily batch. Real-time is expensive and adds little value for the target market.

4. **Data retention:** How far back does analytics data go? Recommendation: full resolution for 12 months, aggregated monthly beyond that. Raw events retained per data policy.

---

*This spec depends on: `04-neptune.md` (analyst behavior), `05-agents.md` (agent performance data), `06-crm.md` through `10-orchestration.md` (all department metrics feed into Insights)*
*This spec informs: `13-settings-admin.md` (analytics configuration, report scheduling)*
