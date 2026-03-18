# 12 — Integrations (Connected Apps)

> The bridges. How GalaxyCo connects to the tools the user already uses. Neptune suggests connections when they'd unlock value. Agents use them silently. Every integration has defined sync behavior, error recovery, and a clear role in the agent ecosystem.

---

## Vision

Integrations are plumbing, not a feature. The user shouldn't be managing a list of connected apps as a separate activity. Integrations exist to make agents more capable. Neptune suggests them when they'd unlock value. Agents use them silently.

The user never thinks "I should go connect my Stripe account." Instead, Neptune says "If you connect Stripe, Riley can track payments automatically instead of you marking them manually." The integration happens in context, in service of the work.

---

## Discovery Model

### First Session: Subtle Offer

During the first session (after onboarding conversation, not during), Neptune subtly mentions what integrations would enhance the experience:

> "By the way — if you want to connect your Google account or Stripe later, your agents can pull data directly instead of you entering it manually. No rush."

Not a checklist. Not a setup wizard. A mention that plants the seed.

### Contextual Prompts: Sonar Toast

When a user or an agent's workflow hits a wall that an integration would solve, a **subtle sonar-style toast** appears in the lower-right corner:

| Trigger | Toast Message | Agent Avatar |
|---------|--------------|-------------|
| Finance Agent can't auto-track a payment | "Connect Stripe to auto-track payments" | Riley |
| Content Agent can't publish directly | "Connect Instagram to publish directly" | Maya |
| User manually enters a contact that exists elsewhere | "Connect Google to sync contacts" | Neptune |
| Campaign Agent can't create ads | "Connect Google Ads to run campaigns" | Maya |
| Knowledge Agent can't sync external docs | "Connect Google Drive to sync documents" | Riley |
| Sales Agent can't schedule a meeting | "Connect Google Calendar for scheduling" | Alex |

**Toast behavior:**
- **Lower-right corner** — out of the way, peripheral
- **Sonar animation** — subtle pulse, not aggressive. Agent's avatar with a soft glow.
- **Dismissable** — one tap to dismiss. Doesn't come back for that specific integration for 7 days.
- **Actionable** — tap to start the OAuth flow in a modal, not a page navigation. One click to connect.
- **Smart suppression** — if the user has dismissed an integration toast 3 times, Neptune stops suggesting it. Only resurfaces if the user explicitly asks about integrations.

### Never Aggressive

- No "Connect 5 apps to unlock your full potential" screens
- No integration score or completion percentage
- No blocking features behind integrations — everything works without them, just with more manual input
- Neptune mentions integrations at most once per session unless the user asks
- No integration upsell in onboarding flow — keep the conversation pure

---

## Integration Catalog

### Priority 1 (Launch)

| Integration | Sync Direction | Department | What It Enables | Agent Impact |
|-------------|---------------|-----------|----------------|-------------|
| **Google (OAuth)** | Bidirectional | All | Contacts sync, Calendar for meetings, Gmail for email sending | Sales Agent sends email via Gmail domain (deliverability). Calendar integration for meeting scheduling. Contacts sync eliminates manual entry. |
| **Stripe** | Bidirectional | Finance | Payment processing, auto-tracking, subscription billing, payment links | Finance Agent gets full automation: invoice → payment link → payment received → receipt → reconciliation. Zero manual steps for connected clients. |
| **Instagram** | Write + read metrics | Marketing | Direct publishing, engagement tracking, audience metrics | Content Agent publishes directly. Engagement data feeds Content Strategy Engine and Insights. |
| **Twitter/X** | Write + read metrics | Marketing | Direct publishing, engagement tracking | Same as Instagram. API tier limits managed by Campaign Agent (see rate limiting). |
| **LinkedIn** | Write + read metrics | Marketing | Company page posts, engagement tracking | Same pattern. Higher value for agency target market. |
| **Google Ads** | Bidirectional | Marketing | Campaign creation, management, spend tracking, performance data | Campaign Agent creates and optimizes campaigns via API. Full programmatic ad management. |

### Priority 2 (Fast Follow)

| Integration | Sync Direction | Department | What It Enables | Agent Impact |
|-------------|---------------|-----------|----------------|-------------|
| **Meta Ads** | Bidirectional | Marketing | Facebook/Instagram ad campaigns | Campaign Agent manages Meta campaigns alongside Google Ads. Cross-platform optimization. |
| **Facebook** | Write + read | Marketing | Page posts, engagement tracking | Content Agent publishing. Separate from Meta Ads (organic vs. paid). |
| **Shopify** | Read + webhooks | CRM + Finance | Product catalog, order tracking, customer sync | E-commerce users: Sales Agent gets customer data, Finance Agent tracks orders and revenue automatically. |
| **QuickBooks** | Bidirectional | Finance | Two-way book sync, accountant collaboration | Finance Agent keeps both GalaxyCo and QuickBooks in sync. Accountant sees the same data. |
| **Xero** | Bidirectional | Finance | Same as QuickBooks, for Xero users | Alternative accounting platform support. |
| **Plaid** | Read-only | Finance | Bank account connection, expense auto-import, real cash balances | Finance Agent gets real transaction data. Cash flow projections use actual balances. Expense categorization becomes proactive. |
| **Google Drive** | Bidirectional | Knowledge | Document sync, auto-indexing | Knowledge Agent monitors connected folders. New/updated documents auto-indexed. Changes sync back. |
| **Notion** | Read + selective write | Knowledge | Knowledge base import/sync | Knowledge Agent imports Notion pages. Useful for migration — user's existing knowledge base flows in. |
| **Slack** | Write (notifications) | All | Notifications, Neptune messages, team coordination | Neptune can send updates to Slack channels. Multi-user workspaces get team coordination. |
| **Dropbox** | Bidirectional | Knowledge | Document sync, auto-indexing | Same as Google Drive for Dropbox users. |

### Priority 3 (Growth)

| Integration | Sync Direction | Department | What It Enables |
|-------------|---------------|-----------|----------------|
| **HubSpot** | Read (import) | CRM | Contact and deal import for users migrating from HubSpot |
| **Salesforce** | Read (import) | CRM | Contact and deal import for users migrating from Salesforce |
| **Zapier / Make** | Bidirectional (webhooks) | Orchestration | Bridge to any app GalaxyCo doesn't natively integrate with |
| **TikTok** | Write + read | Marketing | Content publishing (captions/scheduling), ad campaigns |
| **Amazon Seller Central** | Read | CRM + Finance | Product and order data for Amazon sellers |
| **Calendly** | Bidirectional | CRM | Meeting scheduling for Sales Agents |
| **Mailchimp / ConvertKit** | Bidirectional | Marketing | Email campaign sending, list management, newsletter delivery |

---

## Integration Architecture

### Connection Flow

```
User triggers connection (sonar toast, settings page, or Neptune suggestion)
    → Modal opens with OAuth consent screen (no page navigation)
        → User authorizes
            → Token received, encrypted, stored in workspace config
                → Initial sync runs:
                    1. Pull existing data (contacts, documents, etc.)
                    2. Register webhooks for real-time updates (where supported)
                    3. Agent receives notification: "Instagram connected — I can publish directly now"
                → Neptune confirms: "Instagram connected. Maya can publish directly now."
```

### Sync Patterns

Each integration follows one of these sync patterns:

| Pattern | How It Works | Used By |
|---------|-------------|---------|
| **Webhook-driven** | External service pushes events to GalaxyCo endpoint in real-time | Stripe (payment events), Shopify (order events), Clerk (user events) |
| **Polling** | GalaxyCo periodically checks for changes (every 5-60 min depending on integration) | Social media metrics, Google Drive file changes, email platforms |
| **On-demand** | Agent calls API when it needs to take an action | Publishing to social platforms, creating ad campaigns, sending emails |
| **Batch sync** | Periodic full or incremental sync on schedule | Contact sync (Google, HubSpot), accounting sync (QuickBooks, Xero) |

### Sync Frequency by Integration

| Integration | Inbound Sync | Outbound Sync |
|-------------|-------------|---------------|
| Stripe | Real-time (webhooks) | On-demand (agent creates payment links, invoices) |
| Google Contacts | Every 15 minutes (incremental) | On-demand (agent creates/updates contacts) |
| Google Calendar | Every 5 minutes (polling) | On-demand (agent creates events) |
| Instagram | Metrics: every 30 minutes. Content: on-demand publish. | On-demand (publish) |
| Google Ads | Performance data: hourly. Campaign changes: on-demand. | On-demand (campaign creation/optimization) |
| QuickBooks | Every 30 minutes (incremental sync) | On-demand (invoice sync, expense sync) |
| Plaid | Daily (transaction import) | N/A (read-only) |
| Google Drive | Every 15 minutes (file change detection) | On-demand (file updates) |

### Error Recovery

| Error Type | Detection | Agent Response | User Impact |
|-----------|-----------|---------------|-------------|
| **Token expired** | API returns 401 | Agent pauses integration-dependent work. Sonar toast: "Your Google connection expired. Quick reconnect?" | One-click reconnect in toast modal. Queued work resumes automatically. |
| **Rate limited** | API returns 429 | Agent queues the action, retries with exponential backoff. Adjusts future request pacing. | None unless sustained. If chronic: "Instagram is rate-limiting your posts. Maya is spacing them out." |
| **API error** (5xx) | API returns 500/502/503 | Retry 3 times with backoff. If persistent, queue for later. | None unless affecting workflows. Neptune surfaces if blocking critical work. |
| **Permission revoked** | API returns 403 | Agent stops using that integration. Sonar toast: "Your Stripe permissions changed. Reconnect to restore payment tracking." | Reconnect with updated permissions. |
| **Data conflict** | Local data differs from remote | Agent follows sync direction rules. Bidirectional: most-recent-wins. Conflicts logged. | Rarely surfaced. Only if critical data affected (e.g., contact info mismatch). |
| **Webhook delivery failure** | No events received for >2x expected interval | Agent switches to polling fallback. Logs webhook health. | None. Automatic failover. |

### Rate Limit Management

Social platforms have aggressive rate limits. The agent system manages these proactively:

| Platform | Key Limits | Agent Strategy |
|----------|-----------|---------------|
| Instagram | 25 posts/day (API), 200 API calls/hour | Content Agent batches posts, spaces by minimum 1 hour. Never approaches daily limit. |
| Twitter/X | Depends on API tier (Basic: 500 tweets/month) | Agent tracks monthly usage. Warns at 80% capacity. Prioritizes high-value posts. |
| LinkedIn | 100 posts/day (company page) | Rarely an issue. Agent monitors. |
| Google Ads | 15,000 operations/day | Campaign Agent batches optimization calls. Prioritizes high-impact changes. |
| Meta Ads | Varies by spend level | Agent monitors rate limit headers, backs off proactively. |

---

## Data Model

### Integration Configuration

| Field | Purpose |
|-------|---------|
| `id` | Integration instance identifier |
| `workspaceId` | Multi-tenant isolation |
| `provider` | Enum: google, stripe, instagram, twitter, linkedin, google_ads, meta_ads, shopify, quickbooks, xero, plaid, google_drive, notion, slack, etc. |
| `status` | active, expired, error, disconnected |
| `accessToken` | Encrypted OAuth access token |
| `refreshToken` | Encrypted OAuth refresh token |
| `tokenExpiresAt` | Token expiration timestamp |
| `scopes` | Array of granted OAuth scopes |
| `syncConfig` | JSON: sync direction, frequency, filters, last sync time |
| `webhookEndpoint` | Registered webhook URL (if applicable) |
| `webhookSecret` | Encrypted webhook verification secret |
| `rateLimitState` | JSON: current usage, limit, reset time |
| `errorState` | JSON: last error type, count, last retry, backoff level |
| `connectedAt` | When the integration was first connected |
| `lastSyncAt` | Most recent successful sync |
| `lastErrorAt` | Most recent error (null if healthy) |
| `metadata` | Provider-specific config (account ID, page ID, etc.) |

### Sync Log

| Field | Purpose |
|-------|---------|
| `id` | Sync event identifier |
| `integrationId` | Which integration |
| `direction` | inbound, outbound |
| `action` | sync, publish, import, export, webhook_received |
| `status` | success, partial, failed, rate_limited |
| `recordsAffected` | Count of records created/updated/deleted |
| `errorDetail` | Error message if failed |
| `duration` | How long the sync took |
| `timestamp` | When it happened |

---

## Module Evolution (Trust Arc)

### Phase 1: Zero Integrations is Fine
- Platform works fully without any integrations
- Agents do their jobs with manual data input
- Neptune plants seeds about what integrations would unlock

### Phase 2: First Connections
- User connects 1-3 integrations (typically Stripe, Google, one social platform)
- Agents noticeably improve — auto-tracking, direct publishing, contact sync
- Sonar toasts appear contextually as agents hit walls

### Phase 3: Connected Business
- 5-8 integrations active
- Most agent workflows are fully automated end-to-end
- Integration health monitoring active in Settings
- Neptune suggests new connections based on business growth

### Phase 4: Fully Wired
- All relevant integrations connected
- Agents operate with full external data access
- New integrations suggested only when the user adopts new tools
- Integration management is invisible — everything just works

---

## Settings Page Presence

Integrations have a dedicated section in Settings (see `13-settings-admin.md`):

- Connected apps with status indicators (green dot = active, amber = expiring, red = error)
- Last sync time per integration
- Which agents use each integration (auto-detected from usage)
- Connect / disconnect / reconnect controls
- Sync log accessible for debugging
- Rate limit status for social platforms

This is the management interface. Most users interact with integrations through Neptune and sonar toasts, not through Settings.

---

## Open Questions

1. **Integration marketplace (future):** Third-party developers building integrations for GalaxyCo. Requires a plugin architecture, review process, and security model. Not MVP but the architecture should accommodate it (standardized integration interface, not provider-specific spaghetti).

2. **Migration tools:** Users leaving HubSpot/Salesforce want a one-click migration, not manual CSV import. How deep should CRM migration go? Recommendation: import contacts + deals + notes. Don't try to replicate automations or custom fields — let Neptune rebuild those through conversation.

3. **Offline-first for mobile:** When mobile connectivity is poor, should agents queue integration actions locally? Recommendation: yes for outbound actions (queue and send when connected). Inbound sync waits for connectivity.

4. **Existing integration code:** The codebase has integration infrastructure for Google OAuth, Stripe, Pusher, Liveblocks, SignalWire, and Resend. The spec evolves these where applicable and deprecates what doesn't fit the vision (SignalWire and Resend may be replaced by agent-managed communication through connected email/SMS providers).

---

*This spec depends on: `05-agents.md` (agents consume integrations, activity toasts), `06-crm.md` through `09-knowledge.md` (department-specific integration needs), `10-orchestration.md` (workflow triggers from external events)*
*This spec informs: `13-settings-admin.md` (integration management UI)*
