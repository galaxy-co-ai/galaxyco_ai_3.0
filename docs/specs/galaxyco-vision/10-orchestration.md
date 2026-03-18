# 10 — Orchestration (Galaxy Studio)

> The workflow engine. Cross-department automations, agent-to-agent handoffs, scheduled operations, and the invisible plumbing that makes the company feel like one organism. Neptune designs the workflows. Trigger.dev runs them. The user sees the results.

---

## Vision

Every department spec describes cross-department handoffs: deal closes → invoice generates → client onboards. These aren't manual connections and they aren't magic — they're orchestrated workflows that Galaxy Studio manages.

Galaxy Studio is the workflow layer that connects agents across departments. The user doesn't build these workflows in a visual editor (that's the old model). Neptune designs them based on how the business operates. The user can see them, adjust them, and create new ones — but the default is Neptune handling it.

---

## Two Views

### Studio View (Traditional)

A clean, focused workflow editor. Not Zapier with 50 connector blocks — a node-based view showing trigger → steps → agents → outcomes. Each workflow is a readable diagram.

For the 10% of users who want to see and edit the wiring. Most users never open this view — they interact with workflows through Neptune and through the results that appear in their department views.

### Agent-First View

Workflow health and optimization surface.

**Top: Workflow health bar** — Active workflows, executions today, success rate, time saved estimate. Collapsed by default.

**Main: Decision cards:**

- **Workflow suggestions** — "I noticed you manually forward every new lead to your personal email. Want me to automate that?"
- **Optimization opportunities** — "Your lead intake workflow has a 2-day gap between form submission and first contact. I can tighten that to same-day."
- **Failures needing attention** — "The deal-to-invoice workflow failed for Chen — invoice template is missing the new service line item. Want me to fix the template?"
- **Performance highlights** — "Your 5 workflows saved an estimated 12 hours this week. The content publishing pipeline ran 23 times without intervention."
- **New department connections** — "Now that you have a Finance Agent, I can auto-generate invoices when deals close. Want to set that up?"

---

## Workflow Types

### Pre-Built Core Workflows

Neptune provisions these automatically when the relevant departments exist:

| Workflow | Trigger | Steps | Departments |
|----------|---------|-------|------------|
| **Deal-to-Invoice** | Deal marked Closed Won in CRM | 1. Pull deal data (value, client, line items) → 2. Generate invoice from template → 3. Surface for approval (or auto-send) → 4. Create client profile in Knowledge (if new client) | CRM → Finance → Knowledge |
| **Lead Intake** | New lead enters CRM (form, import, agent-sourced) | 1. Score against ICP → 2. Enrich from Intelligence Layer dossier → 3. Assign to Sales Agent → 4. Start outreach cadence | Intelligence → CRM |
| **Overdue Escalation** | Invoice overdue > configurable threshold | 1. Send reminder (day 3) → 2. Send firmer reminder (day 7) → 3. Escalate to Neptune (day 14) → 4. Surface decision card to user | Finance → Neptune |
| **Content Publishing** | Content Agent completes draft | 1. Queue for approval → 2. On approve: publish to connected platforms → 3. Start engagement tracking → 4. Feed performance data back to Content Strategy Engine | Marketing → Insights |
| **Campaign Launch** | Campaign Agent completes campaign brief | 1. Surface brief for approval → 2. On approve: create campaign on ad platform → 3. Start monitoring loop → 4. Feed performance to Insights | Marketing → Insights |
| **Client Onboarding** | New client (deal closed + first interaction) | 1. Create client profile in Knowledge → 2. Set up recurring invoice if retainer → 3. Notify relevant agents of new client context → 4. Add to Neptune's briefing | CRM → Knowledge → Finance |
| **End-of-Month Close** | Monthly schedule (last business day) | 1. Finance Agent reconciles outstanding items → 2. Generate financial summary → 3. Expense categorization review → 4. Surface uncategorized items → 5. Push report to Insights | Finance → Insights |
| **Content Calendar Cycle** | Weekly schedule (configurable day) | 1. Content Strategy Engine generates next week's plan → 2. Content Agent drafts all planned pieces → 3. Queue for approval → 4. Schedule approved content | Marketing |

### User-Created Workflows

For power users (Phase 3+), Galaxy Studio offers workflow creation through Neptune conversation:

- "When a lead fills out the contact form, I want the sales agent to respond within 5 minutes and CC me if the deal is over $5,000"
- "Every Friday, have the content agent draft next week's social posts and queue them for my Monday review"
- "When a client's invoice is overdue for the third time, flag them in CRM as a payment risk"

Neptune translates natural language into structured workflows. The user can review the resulting workflow diagram if they want, but they don't have to.

---

## Workflow Anatomy

Every workflow has the same structural components:

### Trigger

What starts the workflow:

| Trigger Type | Examples |
|-------------|---------|
| **Event trigger** | Deal closes, lead enters, invoice overdue, content approved, payment received |
| **Schedule trigger** | Daily at 9am, weekly on Monday, monthly on last business day, every 4 hours |
| **Threshold trigger** | Pipeline value exceeds $X, overdue amount exceeds $X, engagement drops below X% |
| **Manual trigger** | User or Neptune explicitly starts a workflow run |
| **Cascade trigger** | Another workflow completes (workflow chaining) |

### Steps

Ordered sequence of actions. Each step is one of:

| Step Type | What It Does | Examples |
|-----------|-------------|---------|
| **Agent action** | Delegates a task to a specific agent via Paperclip | "Sales Agent: qualify this lead", "Finance Agent: generate invoice", "Content Agent: draft blog post" |
| **Data operation** | Reads, writes, or transforms data | "Pull deal data from CRM", "Update client profile in Knowledge", "Calculate ICP score" |
| **Decision gate** | Branches based on a condition | "If deal > $5K: require manual approval. Else: auto-proceed." |
| **Human gate** | Pauses for user input | "Surface decision card and wait for user response" |
| **Wait** | Pauses for a duration | "Wait 3 days before sending follow-up" |
| **Notification** | Surfaces information without blocking | "Send toast notification", "Add to Neptune's next briefing" |
| **External action** | Calls an external API | "Publish to Instagram", "Create campaign in Google Ads", "Send email via connected provider" |

### Conditions (Decision Gates)

Workflows can branch based on:

| Condition Type | Examples |
|---------------|---------|
| **Value comparison** | Deal value > $5,000, ICP score > 80, days overdue > 14 |
| **Status check** | Client is new vs. returning, payment history is good vs. poor, autonomy mode is on vs. off |
| **Time-based** | Business hours only, weekday only, within first 30 days of signup |
| **Agent confidence** | Agent confidence on this action > 80% (low confidence → surface for review) |

Conditions are expressed through Neptune conversation, not a visual logic builder. Neptune translates "if the deal is big, I want to see it" into `deal.value > threshold → human_gate`.

### Error Handling

Each step has defined error behavior:

| Error Scenario | Default Behavior | Configurable |
|---------------|-----------------|-------------|
| Step fails (API error, timeout) | Retry 3 times with exponential backoff | Retry count, backoff strategy |
| Step fails after retries | Neptune diagnoses → surfaces to user if needed | Fallback action, notification preference |
| Human gate timeout (user doesn't respond) | Wait indefinitely (decision cards don't expire by default) | Auto-proceed after X days, escalate to different user |
| External service unavailable | Queue for retry when service recovers | Skip step, use fallback |
| Agent error (bad output) | Neptune reviews, corrects if possible, surfaces if not | Confidence threshold for auto-correction |

---

## Workflow Discovery & Suggestion

Neptune doesn't just build workflows when asked — it actively identifies automation opportunities:

### Detection Logic

| Pattern Detected | Neptune Suggests |
|-----------------|-----------------|
| User performs same manual action 3+ times | "You've manually forwarded the last 5 leads to your email. Want me to automate that?" |
| Time gap between dependent actions | "There's a 2-day gap between deal close and invoice generation. I can make that instant." |
| New department comes online | "Now that you have a Content Agent, I can pipe demand signals from the Intelligence Layer into your content calendar." |
| Workflow step consistently modified | "You always edit the invoice before sending. Want me to adjust the template so it matches what you usually change?" |
| Cross-department data not flowing | "Your Sales Agent doesn't know about overdue invoices from Finance. Want to connect that so Alex knows which clients are slow payers?" |

### Suggestion Frequency

- Phase 1: Neptune suggests 1-2 core workflows during onboarding
- Phase 2: Neptune suggests new workflows as departments come online (1-2 per week max)
- Phase 3: Optimization suggestions for existing workflows (weekly)
- Phase 4: Minimal — the system is mature, Neptune only suggests when something changes

Never more than 2 workflow suggestions per session. Not nagging.

---

## Execution Layer

### Architecture

```
Galaxy Studio (UI) ←→ Neptune (intelligence) ←→ Workflow Engine ←→ Trigger.dev (execution)
                                                       ↓
                                                 Paperclip (agent tasks)
```

| Layer | Responsibility |
|-------|---------------|
| **Galaxy Studio** | Workflow design, visualization, monitoring, user interaction |
| **Neptune** | Suggestion, natural-language creation, optimization, error diagnosis |
| **Workflow Engine** | Workflow state management, step sequencing, condition evaluation, error handling |
| **Trigger.dev** | Reliable background execution, retries, scheduling, queuing, job persistence |
| **Paperclip** | Individual agent task execution within workflow steps |

### Execution Monitoring

Every workflow execution is tracked:

| Metric | What It Measures |
|--------|-----------------|
| **Execution count** | How many times this workflow has run (daily, weekly, monthly) |
| **Success rate** | % of runs that complete without error |
| **Average duration** | Time from trigger to completion |
| **Step failure rate** | Which steps fail most often (identifies weak points) |
| **Human gate dwell time** | How long users take to respond to decision cards (identifies bottlenecks) |
| **Time saved estimate** | Estimated manual time this automation replaces (rough calculation from step count × average manual time) |

---

## Module Evolution (Trust Arc)

### Phase 1: Core Plumbing
- Neptune provisions 2-3 core workflows (deal-to-invoice, lead intake)
- Workflows run silently — user sees results in department views
- User may not even know Galaxy Studio exists yet

### Phase 2: Visible Automation
- More workflows come online as departments expand
- User starts noticing the automation ("Wait, that invoice was automatic?")
- Neptune introduces Galaxy Studio: "Want to see how your automations are running?"
- Workflow health monitoring active

### Phase 3: User-Designed Workflows
- User creates custom workflows through Neptune conversation
- Visual editor available for users who want to see/edit
- Optimization suggestions from Neptune based on execution data
- Workflow chaining (output of one triggers another)

### Phase 4: Intelligent Orchestration
- Neptune proactively redesigns workflows based on operational data
- Predictive triggers ("Start the Q4 campaign workflow — based on last year's timing, it should begin next week")
- Complex conditional logic across multiple departments
- The business runs as one organism — workflows are the nervous system

---

## Data Model

| Field | Purpose |
|-------|---------|
| `id` | Workflow identifier |
| `workspaceId` | Multi-tenant isolation |
| `name` | Human-readable workflow name |
| `description` | What this workflow does (Neptune-generated, user-editable) |
| `trigger` | JSON: trigger type, configuration, conditions |
| `steps` | Ordered array of step definitions (type, agent, action, conditions, error handling) |
| `status` | active, paused, draft, archived |
| `createdBy` | neptune_auto, neptune_suggested, user_created |
| `templateId` | If created from a template, link to the template |
| `executionCount` | Total runs |
| `lastExecutedAt` | Most recent run |
| `successRate` | Computed from execution history |
| `estimatedTimeSaved` | Cumulative time saved estimate |
| `createdAt` / `updatedAt` | Timestamps |

### Execution Log

| Field | Purpose |
|-------|---------|
| `id` | Execution identifier |
| `workflowId` | Which workflow ran |
| `triggerEvent` | What triggered this run (event data, schedule time, manual) |
| `status` | running, completed, failed, waiting_human, cancelled |
| `steps` | Array of step results: {stepId, status, startedAt, completedAt, agentId, output, error} |
| `duration` | Total execution time |
| `humanGateResponses` | Array of user decisions during this run |

### Existing Infrastructure

| Current System | Evolution |
|---------------|-----------|
| `src/db/workflow-schema.ts` | Extend with new trigger types, step types, and execution logging |
| `src/trigger/` | Existing Trigger.dev jobs become the execution backbone — Galaxy Studio wraps them with a user-facing management layer |
| `src/trigger/queues.ts` | Queue definitions extended for workflow-specific queuing and priority |
| `src/trigger/jobs.ts` | Each workflow step type maps to a Trigger.dev job definition |

---

## Open Questions

1. **Workflow complexity ceiling:** Neptune should enforce simplicity — if a user describes a workflow with more than 7-8 steps, Neptune suggests splitting it. Complex workflows are harder to debug and maintain.

2. **Workflow versioning:** When Neptune optimizes a workflow, should the old version be preserved? Recommendation: yes, lightweight versioning. User can revert if the optimization doesn't work out.

3. **Cross-workspace workflows (future):** Agencies managing multiple client workspaces may need workflows that span workspaces. Not MVP. Multi-tenant isolation must be maintained.

4. **Third-party webhook triggers:** Can external services trigger GalaxyCo workflows via webhook? ("When Shopify receives an order, trigger the order fulfillment workflow.") Recommendation: yes, but as a Phase 3+ integration feature.

5. **Workflow marketplace (future):** Should users be able to share workflow templates? Community-driven automation library. Not MVP but valuable for growth.

---

*This spec depends on: `05-agents.md` (Paperclip agent execution), `06-crm.md` through `09-knowledge.md` (cross-department handoffs defined in each department spec)*
*This spec informs: `11-insights.md` (workflow performance metrics), `13-settings-admin.md` (workflow management)*
