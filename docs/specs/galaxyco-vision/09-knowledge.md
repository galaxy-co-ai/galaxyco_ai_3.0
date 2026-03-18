# 09 — Knowledge (Company Brain)

> The company brain. Everything the business knows — documents, SOPs, client details, institutional knowledge — organized, maintained, and surfaced by a Knowledge Agent. Neptune draws from it. Agents learn from it. It gets smarter every day the business operates.

---

## Vision

Every small business has institutional knowledge scattered across Google Docs, email threads, someone's head, and a Notion page nobody updates. When a team member leaves, knowledge walks out the door. When a new hire starts, they spend weeks asking "where is that thing?"

GalaxyCo's Knowledge module is the company brain — a living, agent-maintained knowledge base that every other department draws from. The Knowledge Agent doesn't just store documents — it actively curates, connects, and maintains the business's institutional memory.

---

## Two Views

### Knowledge View (Traditional)

Document browser with folders, search, wiki-style pages, and a rich text editor. For users who want to manually create documents, organize their knowledge base, or browse what's there. Think Notion-lite — clean, fast, and structured.

### Agent-First View

Neptune as knowledge curator. What's new, what's stale, what's missing, and how healthy the company brain is.

**Top: Knowledge health bar** — Total documents, freshness score (% up-to-date), gaps detected, recently added. Collapsed by default, expandable to full knowledge dashboard with category breakdown, freshness heatmap, and usage stats.

**Main: Decision cards:**

- **Stale content** — "Your client onboarding SOP hasn't been updated since you added the new service line 6 weeks ago. Want Riley to draft updates based on how your team's actually been handling it?"
- **Knowledge gaps** — "You've closed 5 deals this quarter but there's no pricing playbook documented. Want me to create one from your deal history?"
- **Conflicts detected** — "Your marketing guide says your hourly rate is $150 but your most recent 3 invoices charged $175. Which is current?"
- **New additions** — "Riley captured 3 new knowledge items this week from your Neptune conversations and agent operations."
- **Cross-reference opportunities** — "Your proposal template references services you discontinued last month. Want Riley to update it?"
- **Usage insights** — "Your Sales Agent accessed the pricing playbook 12 times this week. It's your most-referenced document."

---

## Knowledge Document Types

The Knowledge Agent works with structured document categories, each with different maintenance patterns:

| Category | Examples | Freshness Expectation | Agent Maintenance |
|----------|---------|----------------------|------------------|
| **SOPs (Standard Operating Procedures)** | Client onboarding process, content approval workflow, invoice handling steps | Refreshed when operational patterns change | Agent monitors actual operations vs. documented process. Flags drift. |
| **Playbooks** | Sales objection handling, pricing strategy, competitor positioning, negotiation tactics | Refreshed quarterly or when strategy shifts | Agent generates from operational data (close rates, winning tactics). |
| **Client Profiles** | Per-client: history, preferences, billing terms, communication style, key contacts | Continuously updated from agent interactions | Auto-enriched every time any agent interacts with the client. |
| **Templates** | Invoice templates, proposal templates, email templates, contract templates | Updated when branding or terms change | Agent detects when templates reference outdated information. |
| **Brand & Voice** | Brand voice profile, style guide, messaging pillars, tone rules | Updated as voice model evolves | Content Agent writes, Knowledge Agent stores. Updated from approval/edit patterns. |
| **Reference** | Industry benchmarks, regulatory notes, tool documentation, vendor contacts | Varies — some stable, some volatile | Agent flags items older than their expected refresh cycle. |
| **Meeting Notes & Decisions** | Captured from Neptune conversations, strategy discussions, team meetings | Archival — rarely updated, but searchable | Auto-captured with user consent. Tagged with decision outcomes. |
| **Internal Policies** | HR policies, security procedures, data handling rules (multi-user workspaces) | Updated when policies change | Agent flags if policies reference old structures or roles. |

---

## Knowledge Capture System

### How Knowledge Gets In

| Source | Capture Method | Agent Behavior |
|--------|---------------|---------------|
| **Document upload** | User uploads PDF, Word, Google Doc, spreadsheet, image | Agent OCRs if needed → extracts key information → categorizes → generates tags → creates embeddings → indexes for RAG |
| **Neptune conversations** | User tells Neptune something valuable about their business | Neptune recognizes institutional knowledge → asks: "Mind if I save that?" → Knowledge Agent files it with source attribution and context |
| **Agent operations** | Patterns emerge from agent work across departments | Agent detects recurring patterns → synthesizes into documented knowledge. Example: Sales Agent closes 10 deals → Knowledge Agent generates a "What's working in sales" playbook. |
| **Integration sync** | Connected Google Drive, Notion, Dropbox, Confluence | Agent monitors connected sources for changes → indexes new/updated documents → flags deletions → maintains sync state |
| **Manual creation** | User writes directly in Knowledge View's editor | Standard document creation flow with agent-assisted tagging and categorization |
| **Email/communication capture** | User forwards important emails or Neptune detects key information in communications | Agent extracts actionable knowledge, files appropriately. Never stores raw emails — extracts the knowledge, discards the noise. |

### Capture Decision Logic

Not everything should become a knowledge document. The Knowledge Agent applies judgment:

| Signal | Capture? | Reasoning |
|--------|----------|-----------|
| User explains a one-time workaround | No | Ephemeral. Not reusable. |
| User describes how they always handle enterprise clients | Yes — SOP | Recurring process that other agents need to follow |
| Sales Agent discovers a winning email subject line | Yes — Playbook update | Performance data that improves future operations |
| User uploads a contract with a specific client | Yes — Client Profile | Client-specific terms that Finance Agent needs |
| User vents about a bad day | No | Not knowledge. Neptune handles emotionally, doesn't archive. |
| Neptune conversation reveals the user's pricing strategy | Yes — Playbook | Critical business logic that Sales and Finance Agents need |
| Agent detects the user always edits social posts to remove emojis | Yes — Brand Voice update | Voice preference that Content Agent should learn permanently |

**Consent model:** The Knowledge Agent always asks before capturing from conversations. "That's useful context about your enterprise pricing. Mind if I add it to your knowledge base?" User can decline — the Knowledge Agent respects the boundary.

---

## Knowledge Retrieval (RAG)

### How Knowledge Gets Out

Every department draws from the company brain via contextual RAG:

| Consumer | What They Need | How RAG Serves It |
|----------|---------------|------------------|
| **Neptune** | Full context for any conversation | Semantic search across all knowledge. If user asks about pricing, Neptune retrieves the pricing playbook, recent deal history, and client-specific terms. |
| **Sales Agents** | Deal-specific context | Before outreach: retrieves client profile, past interactions, pricing playbook, objection handling relevant to this lead type. |
| **Content Agents** | Brand voice and topic expertise | Before drafting: retrieves brand voice profile, past content performance on similar topics, subject matter expertise documents. |
| **Finance Agents** | Billing context | Before invoicing: retrieves client payment terms, billing arrangement notes, template preferences. |
| **Campaign Agents** | Audience and positioning context | Before campaign design: retrieves brand positioning, target audience profiles, past campaign performance data. |

### Retrieval Architecture

```
Agent or Neptune needs context
    → Query formulated (semantic + keyword + entity-linked)
        → Vector search (Upstash Vector) returns top-K candidates
            → Knowledge Agent re-ranks by:
                1. Relevance to query
                2. Freshness (newer preferred for volatile categories)
                3. Usage frequency (heavily-used docs weighted higher)
                4. Source authority (user-created > agent-generated for conflicts)
                5. Entity relationship (client-specific docs prioritized when working on that client)
            → Top results delivered to requesting agent with citation metadata
```

### Context Window Management

Knowledge retrieval is token-aware:

| Agent Context Budget | RAG Allocation |
|---------------------|---------------|
| Large (Neptune in conversation) | Up to 8K tokens of retrieved knowledge |
| Medium (Sales Agent drafting email) | Up to 3K tokens — client profile + relevant playbook |
| Small (Finance Agent generating invoice) | Up to 1K tokens — client billing terms only |

The Knowledge Agent manages this budget — never dumps the entire knowledge base. It retrieves precisely what's needed for the task at hand.

---

## Freshness Monitoring

### How Freshness Works

Every knowledge document has a freshness score (0-100) computed from:

| Factor | Weight | Logic |
|--------|--------|-------|
| **Age since last update** | 30% | Decays based on category expectation (SOPs decay faster than reference docs) |
| **Operational drift** | 40% | If actual operations (observed through agent work) diverge from documented process, freshness drops sharply |
| **Cross-reference validity** | 20% | If other documents reference this one and their data disagrees, freshness drops |
| **Usage without complaint** | 10% | If agents use this document frequently and no corrections follow, freshness holds |

### Agent Freshness Actions

| Freshness Score | Agent Action |
|----------------|-------------|
| **80-100 (Fresh)** | No action. Document is current. |
| **60-79 (Aging)** | Agent adds to periodic review queue. No alert unless drift detected. |
| **40-59 (Stale)** | Surfaces as decision card: "This document might be outdated. Want Riley to review and update?" |
| **0-39 (Critical)** | Prominent alert: "This SOP doesn't match how your team actually operates. Agents are using outdated instructions. Immediate update recommended." |

### Operational Drift Detection

The most powerful freshness signal. Examples:

- SOP says "respond to leads within 24 hours" but Sales Agent's actual average is 4 hours → SOP is stale (the process improved but documentation didn't)
- Pricing playbook says $150/hour but last 5 invoices used $175/hour → conflict detected
- Client profile says "prefers email" but Sales Agent's last 3 successful interactions were phone calls → profile outdated

The Knowledge Agent monitors actual agent behavior and compares it to documented knowledge. Drift above a threshold triggers a freshness alert.

---

## Knowledge Conflict Resolution

When two documents disagree:

| Conflict Type | Agent Action |
|--------------|-------------|
| **Price discrepancy** (playbook vs. recent invoices) | Surfaces both with context: "Your playbook says $150/hr but your last 3 invoices charged $175. Which is current?" User resolves. Agent updates the losing document. |
| **Process discrepancy** (SOP vs. actual operations) | Agent drafts an updated SOP reflecting actual operations. Surfaces for approval: "Your intake SOP is out of date. Here's an updated version based on how you've actually been handling it." |
| **Contradictory instructions** (two documents give different guidance) | Surfaces conflict: "Your proposal template says Net 30 but your billing policy says Net 15. Which should agents follow?" |
| **Stale external sync** (Notion doc changed but Knowledge copy didn't update) | Auto-syncs if integration is bidirectional. If one-way, flags: "The source document in Notion was updated. Want to pull the changes?" |

**Resolution principle:** The Knowledge Agent never silently resolves conflicts. It always surfaces to the user. The agent's job is to detect and present — the user's job is to decide which version is correct.

---

## Module Evolution (Trust Arc)

### Phase 1: Basic Library
- User uploads documents, Knowledge Agent indexes and categorizes
- Neptune conversations occasionally capture knowledge (with consent)
- Simple search and retrieval
- Minimal freshness monitoring (age-based only)

### Phase 2: Active Curation
- Agent operations generate knowledge automatically (playbooks from patterns, client profiles from interactions)
- Freshness monitoring active — operational drift detection online
- Cross-department knowledge sharing functional (agents retrieving context for their work)
- Decision cards surfacing stale content and gaps

### Phase 3: Company Brain
- Full operational drift detection across all departments
- Conflict resolution actively surfacing and resolving inconsistencies
- Knowledge-driven agent improvements (agents measurably better because of richer context)
- Neptune cites sources: "According to your pricing playbook, updated last week..."
- Integration sync keeping external knowledge sources current

### Phase 4: Institutional Memory
- Knowledge base is comprehensive — every business process documented, every client profiled
- New team members onboarded through curated knowledge paths
- Knowledge Agent proactively generates missing documentation without being asked
- The business could survive the user being absent for a month because the company brain holds everything

---

## Neptune as Knowledge Curator

| Situation | Neptune Does |
|-----------|-------------|
| User asks a question | Checks Knowledge base first: "According to your pricing playbook, your standard rate is $175/hr. Last updated 2 weeks ago." |
| Knowledge gap detected | "You've closed 5 deals this quarter but there's no documented pricing strategy. Want me to build one from your deal history?" |
| SOP outdated | "Your intake process changed 2 months ago but the SOP still describes the old flow. Here's Riley's draft update." |
| Valuable conversation capture | "That's useful context about how you handle enterprise clients. Mind if I save it to your knowledge base?" |
| New team member joins | "Morgan joined the workspace. I've put together a knowledge path for their role — want to review before I share?" |
| Knowledge usage insight | "Your pricing playbook is your most-accessed document — referenced 34 times this month by your Sales Agent. It's earning its keep." |
| Conflict detected | "Your proposal template says Net 30 but your billing policy says Net 15. Which should agents follow?" |

---

## Data Model

| Field | Purpose |
|-------|---------|
| `id` | Unique document identifier |
| `workspaceId` | Multi-tenant isolation |
| `title` | Document title |
| `content` | Rich text / markdown body |
| `category` | Enum: sop, playbook, client_profile, template, brand_voice, reference, meeting_notes, policy |
| `tags` | Array of agent-generated + user-added tags |
| `source` | Enum: upload, conversation_capture, agent_generated, integration_sync, manual |
| `sourceMetadata` | JSON: conversation ID, agent ID, integration name, upload filename — varies by source |
| `freshnessScore` | Computed 0-100 |
| `lastFreshnessCheck` | When agent last evaluated freshness |
| `operationalDriftScore` | How much actual operations diverge from this document |
| `relatedEntities` | Array of {entityType, entityId} — contacts, deals, agents, campaigns |
| `conflictsWith` | Array of document IDs this document contradicts |
| `accessScope` | workspace, department-specific, or restricted |
| `usageCount` | How many times agents have retrieved this document for context |
| `lastUsedAt` | Last retrieval timestamp |
| `lastUpdatedByAgentId` | Which agent last modified (null if user-edited) |
| `embeddingVersion` | Track embedding model version for re-indexing |
| `createdAt` / `updatedAt` | Timestamps |

### Existing Infrastructure Evolution

| Current System | What It Becomes |
|---------------|----------------|
| `src/lib/ai/rag.ts` | Core retrieval engine — enhanced with re-ranking, freshness-aware scoring, entity-linked retrieval |
| `src/lib/ai/rag-enhanced.ts` | Merged into main RAG engine with Knowledge Agent curation layer |
| Upstash Vector | Primary vector store — unchanged, but embedding pipeline adds category and entity metadata |
| `src/lib/ai/cache.ts` + `smart-cache.ts` | Consolidated into single knowledge cache with freshness-aware invalidation |

---

## Open Questions

1. **Knowledge permissions:** In multi-user workspaces, should certain documents be restricted by role? Recommendation: open by default, with optional restriction for sensitive documents (HR, legal, financial). The agent respects access scope when retrieving for non-owner users.

2. **External knowledge sources:** Should the Knowledge Agent actively pull in industry-relevant knowledge (regulatory changes, best practices, market benchmarks)? Or is that the Research Agent's domain from the Intelligence Layer? Recommendation: Research Agent gathers, Knowledge Agent stores if the user approves.

3. **Knowledge versioning:** Should documents have full version history? Useful for audit trails and understanding how processes evolved. Recommendation: yes, lightweight versioning — store diffs, not full copies. Accessible but not prominent.

4. **Knowledge export:** Users leaving GalaxyCo should be able to export their entire knowledge base. Format: structured markdown + attachments. This is a data portability requirement.

5. **RAG quality measurement:** How do we measure whether the Knowledge Agent is retrieving the right context? Track agent performance correlation with knowledge retrieval quality. If an agent performs better after accessing a specific document, that document is validated.

---

*This spec depends on: `00-philosophy.md` (modules as departments), `01-intelligence-layer.md` (dossier data feeds knowledge base), `04-neptune.md` (knowledge curator behavior), `05-agents.md` (agent knowledge consumption, context budgets)*
*This spec informs: all department specs (every agent draws from the company brain), `08-marketing.md` (brand voice storage), `11-insights.md` (knowledge health metrics)*
