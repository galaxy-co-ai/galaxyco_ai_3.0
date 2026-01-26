# GalaxyCo.ai Architecture

> This document explains the system design, key decisions, and trade-offs in the GalaxyCo.ai platform.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Core Design Principles](#core-design-principles)
3. [Architecture Diagram](#architecture-diagram)
4. [Module Boundaries](#module-boundaries)
5. [Data Flow](#data-flow)
6. [Key Technical Decisions](#key-technical-decisions)
7. [Database Design](#database-design)
8. [AI Architecture](#ai-architecture)
9. [Security Model](#security-model)
10. [Trade-offs & Technical Debt](#trade-offs--technical-debt)

---

## System Overview

GalaxyCo.ai is an **AI-native business operating system** built on a hub-and-spoke architecture. The central hub is **Neptune**, an AI assistant that orchestrates across all business modules (CRM, Finance, Marketing, Knowledge, Communications).

### What Problem We Solve

Businesses use 6-10 disconnected tools (Salesforce, QuickBooks, HubSpot, Notion, Slack). Data is siloed, workflows are manual, and scaling requires hiring ops people just to copy data between systems.

**Our thesis:** Instead of integrating tools, unify them under a single AI-native platform where the software adapts to the user through natural language.

---

## Core Design Principles

### 1. Multi-tenant from Day One
Every table has `workspace_id`. Every query is scoped. No exceptions. This isn't bolted on - it's foundational.

**Why:** Retrofitting multi-tenancy is one of the most expensive architectural changes. We paid this cost upfront.

### 2. AI as Orchestration Layer, Not Feature
Neptune isn't a chatbot bolted onto a CRM. The entire platform is designed around AI orchestration. Modules expose tools, Neptune chains them.

**Why:** AI-first architecture enables capabilities that aren't possible with traditional CRUD + chatbot approaches.

### 3. Type Safety as Documentation
TypeScript strict mode with zero errors. Types are the source of truth for data shapes, API contracts, and business logic.

**Why:** Self-documenting code. Refactoring confidence. Compile-time bug prevention.

### 4. Progressive Disclosure
Features surface as users need them. New users see simplicity. Power users see depth. The UI adapts.

**Why:** Complex software doesn't have to feel complex.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Next.js   │  │   React 19  │  │  Tailwind   │  │  Radix UI   │        │
│  │  App Router │  │ Components  │  │   + Nebula  │  │ Primitives  │        │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘  └─────────────┘        │
│         │                │                                                   │
│         ▼                ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐        │
│  │                    SWR + Real-time (Pusher)                      │        │
│  │                 Client State & Data Fetching                     │        │
│  └─────────────────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                       │
│                        Next.js API Routes (REST)                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │
│  │Assistant│ │   CRM   │ │ Finance │ │Knowledge│ │Marketing│ │  Admin  │  │
│  │ /chat   │ │/contacts│ │/invoices│ │ /search │ │/campaign│ │ /agents │  │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘  │
│       │          │          │          │          │          │            │
│       ▼          ▼          ▼          ▼          ▼          ▼            │
│  ┌─────────────────────────────────────────────────────────────────┐      │
│  │                    Authentication (Clerk)                        │      │
│  │              Middleware: Auth + Tenant Scoping                   │      │
│  └─────────────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BUSINESS LOGIC LAYER                              │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                         NEPTUNE (AI Hub)                               │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │ │
│  │  │   Context   │  │    Tool     │  │   Memory    │  │   Model     │  │ │
│  │  │   Builder   │  │ Orchestrator│  │   Manager   │  │   Router    │  │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │ │
│  │                              │                                        │ │
│  │                              ▼                                        │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │                    37+ Executable Tools                          │ │ │
│  │  │  CRM Tools │ Finance Tools │ Content Tools │ Calendar Tools │...│ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │     CRM     │  │   Finance   │  │  Marketing  │  │  Knowledge  │       │
│  │   Service   │  │   Service   │  │   Service   │  │   Service   │       │
│  │             │  │             │  │             │  │             │       │
│  │ - Contacts  │  │ - Invoices  │  │ - Campaigns │  │ - Documents │       │
│  │ - Deals     │  │ - Expenses  │  │ - Templates │  │ - RAG Search│       │
│  │ - Scoring   │  │ - Reports   │  │ - Analytics │  │ - Embeddings│       │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│         │                │                │                │               │
└─────────┼────────────────┼────────────────┼────────────────┼───────────────┘
          │                │                │                │
          ▼                ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DATA LAYER                                       │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                      Drizzle ORM (Type-safe)                     │       │
│  │                    All queries scoped by tenant_id               │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│         │                │                │                │               │
│         ▼                ▼                ▼                ▼               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  PostgreSQL │  │   Upstash   │  │   Upstash   │  │   Vercel    │       │
│  │   (Neon)    │  │   Vector    │  │    Redis    │  │    Blob     │       │
│  │             │  │             │  │             │  │             │       │
│  │ Primary DB  │  │ Embeddings  │  │   Cache +   │  │    File     │       │
│  │ 50+ tables  │  │ RAG Search  │  │ Rate Limit  │  │   Storage   │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL SERVICES                                   │
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   OpenAI    │  │  Anthropic  │  │   Stripe    │  │  SignalWire │       │
│  │   GPT-4     │  │   Claude    │  │  Payments   │  │  SMS/Voice  │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │  QuickBooks │  │   Shopify   │  │   Google    │  │  Microsoft  │       │
│  │ Accounting  │  │  Commerce   │  │  Calendar   │  │   Outlook   │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Boundaries

### Ownership Rules

Each module owns its data and exposes capabilities through:
1. **API endpoints** - For direct UI access
2. **Neptune tools** - For AI orchestration
3. **Service functions** - For cross-module calls

```
Module: CRM
├── Owns: contacts, organizations, deals, activities
├── Exposes: /api/crm/*, CRM tools for Neptune
└── Depends on: Auth (Clerk), Database (Drizzle)

Module: Finance
├── Owns: invoices, expenses, payments
├── Exposes: /api/finance/*, Finance tools for Neptune
└── Depends on: CRM (contact linking), Stripe, QuickBooks

Module: Knowledge
├── Owns: documents, embeddings, search index
├── Exposes: /api/knowledge/*, RAG tools for Neptune
└── Depends on: Upstash Vector, Document processors

Module: Neptune (AI Hub)
├── Owns: conversations, context, tool execution
├── Exposes: /api/assistant/*
└── Depends on: ALL modules (orchestration layer)
```

### Cross-Module Communication

Modules communicate through:
1. **Database foreign keys** - For data relationships
2. **Service function calls** - For synchronous operations
3. **Pusher events** - For real-time updates
4. **Trigger.dev jobs** - For async/background work

**What we avoid:**
- Direct database access across module boundaries
- Circular dependencies between modules
- Shared mutable state

---

## Data Flow

### Example: "Add Sarah from TechFlow as a contact and schedule a meeting"

```
1. USER INPUT
   │
   ▼
2. NEPTUNE RECEIVES
   ├── Parse intent: [create_contact, schedule_meeting]
   ├── Build context: workspace, user, recent activity
   └── Select tools: contact_create, calendar_create
   │
   ▼
3. TOOL EXECUTION (Sequential)
   │
   ├── Tool: contact_create
   │   ├── Validate: email format, required fields
   │   ├── Check: duplicate contact?
   │   ├── Execute: INSERT into contacts
   │   ├── Side effect: Activity logged
   │   └── Return: { contact_id, success }
   │
   ├── Tool: calendar_create
   │   ├── Context: Use contact_id from previous tool
   │   ├── Validate: Time slot available
   │   ├── Execute: Create calendar event
   │   ├── Side effect: Google Calendar sync (if connected)
   │   └── Return: { event_id, success }
   │
   ▼
4. RESPONSE GENERATION
   ├── Aggregate tool results
   ├── Generate natural language response
   └── Stream to client
   │
   ▼
5. REAL-TIME UPDATE
   ├── Pusher: Notify dashboard of new contact
   ├── Pusher: Update activity feed
   └── Client: SWR revalidation triggers
```

### Request Lifecycle

```
Request → Middleware (Auth + Tenant) → API Route → Service → Database
                                                         ↓
Response ← Serialization ← Business Logic ← Query Result ←
```

Every database query includes `WHERE workspace_id = ?` automatically through Drizzle query builders.

---

## Key Technical Decisions

### Decision 1: Next.js App Router (not Pages)

**Chose:** Next.js 16 with App Router
**Over:** Pages Router, separate frontend/backend

**Why:**
- Server Components reduce client bundle size
- Streaming for Neptune responses
- Colocation of API routes with pages
- Built-in layouts and loading states

**Trade-off:** Steeper learning curve, some library compatibility issues

---

### Decision 2: Drizzle ORM (not Prisma)

**Chose:** Drizzle ORM
**Over:** Prisma, raw SQL, TypeORM

**Why:**
- Type inference from schema (no code generation)
- SQL-like syntax (team knows SQL)
- Lighter weight than Prisma
- Better edge runtime support

**Trade-off:** Smaller ecosystem, fewer tutorials

---

### Decision 3: Multi-model AI (not single provider)

**Chose:** OpenAI + Anthropic + Google
**Over:** OpenAI only

**Why:**
- Provider redundancy (outages happen)
- Model selection based on task (Claude for reasoning, GPT-4 for tools)
- Cost optimization (route simple tasks to cheaper models)
- Future flexibility

**Trade-off:** More complex prompt management, provider abstraction layer needed

---

### Decision 4: Clerk for Auth (not Auth.js/NextAuth)

**Chose:** Clerk
**Over:** NextAuth, Auth0, custom auth

**Why:**
- Pre-built UI components
- SSO/SAML for enterprise without custom code
- User management dashboard
- Webhook support for user events

**Trade-off:** Vendor dependency, monthly cost at scale

---

### Decision 5: Serverless Postgres (not traditional)

**Chose:** Neon (serverless Postgres)
**Over:** Traditional Postgres, PlanetScale, Supabase

**Why:**
- Scale to zero (cost efficiency in early stage)
- Branching for preview deployments
- Compatible with standard Postgres
- Autoscaling without ops burden

**Trade-off:** Cold start latency, connection pooling complexity

---

### Decision 6: Tool-based AI (not prompt-only)

**Chose:** Structured tool execution
**Over:** Prompt engineering with text parsing

**Why:**
- Reliable execution (tools have schemas)
- Composable (chain tools together)
- Auditable (log what was executed)
- Extensible (add tools without changing core)

**Implementation:**
```typescript
// Each tool is a single file with:
{
  name: "contact_create",
  description: "Create a new contact in the CRM",
  parameters: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    // ...
  }),
  execute: async (params, context) => {
    // Implementation
  }
}
```

**Trade-off:** More upfront work per capability, but dramatically more reliable

---

## Database Design

### Multi-tenancy Model

```
┌─────────────────────────────────────────────────────────┐
│                      workspaces                          │
│  id | name | owner_id | settings | created_at           │
└─────────────────────────────────────────────────────────┘
         │
         │ Every table references workspace_id
         ▼
┌─────────────────────────────────────────────────────────┐
│  contacts    │ workspace_id | first_name | email | ...  │
│  deals       │ workspace_id | name | value | stage | ...│
│  invoices    │ workspace_id | amount | status | ...     │
│  documents   │ workspace_id | title | content | ...     │
│  ...         │ workspace_id | ...                       │
└─────────────────────────────────────────────────────────┘
```

### Why Not Schema-per-tenant?

We use shared tables with `workspace_id` (pool model) instead of separate schemas because:
1. Simpler migrations (one schema to update)
2. Easier cross-tenant analytics (for us, not exposed to users)
3. No connection pool explosion
4. Works with serverless (Neon)

**Security:** Row-level filtering in application layer. Every query builder includes workspace scope.

### Key Indexes

```sql
-- Every table has these indexes
CREATE INDEX idx_{table}_workspace ON {table}(workspace_id);
CREATE INDEX idx_{table}_workspace_created ON {table}(workspace_id, created_at DESC);

-- Example: contacts
CREATE INDEX idx_contacts_workspace_email ON contacts(workspace_id, email);
CREATE INDEX idx_contacts_workspace_status ON contacts(workspace_id, lead_status);
```

---

## AI Architecture

### Neptune's Brain

```
┌─────────────────────────────────────────────────────────────────┐
│                        NEPTUNE CORE                              │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Context    │    │    Model     │    │    Tool      │      │
│  │   Builder    │───▶│   Router     │───▶│  Executor    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Workspace   │    │   OpenAI     │    │   37+ Tools  │      │
│  │  CRM State   │    │   Anthropic  │    │   Organized  │      │
│  │  User Prefs  │    │   Google     │    │   by Domain  │      │
│  │  History     │    │   (fallback) │    │              │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tool Organization

```
src/lib/ai/tools/
├── crm/
│   ├── index.ts          # Exports all CRM tools
│   ├── definitions.ts    # Tool schemas (Zod)
│   └── implementations.ts # Tool logic
├── finance/
│   ├── index.ts
│   ├── definitions.ts
│   └── implementations.ts
├── content/
├── calendar/
├── knowledge/
└── orchestration/
```

### Adding a New Tool

1. Create definition with Zod schema
2. Implement execute function
3. Export from domain index
4. Tool is automatically available to Neptune

No core changes required. This is the "single-file tool addition" mentioned in capabilities.

---

## Security Model

### Authentication Flow

```
User → Clerk → JWT → Middleware → Verify → Extract workspace_id → Scope all queries
```

### Authorization Layers

```
Layer 1: Authentication (Clerk)
         └── Is this a valid user?

Layer 2: Workspace Membership
         └── Does this user belong to this workspace?

Layer 3: Role-Based Access
         └── Owner > Admin > Member > Viewer

Layer 4: Resource Ownership
         └── Can this user access this specific record?
```

### Data Isolation

```typescript
// Every database query is scoped
const contacts = await db.query.contacts.findMany({
  where: eq(contacts.workspaceId, ctx.workspaceId), // Always present
  // ...
});
```

### Secrets Management

- API keys encrypted at rest
- Environment variables for service credentials
- No secrets in code (checked by pre-commit)
- Clerk handles auth tokens

---

## Trade-offs & Technical Debt

### Acknowledged Technical Debt

| Area | Debt | Why It Exists | Plan |
|------|------|---------------|------|
| Caching | 4 separate implementations | Evolved organically | Consolidate Q1 |
| Context builders | Multiple similar functions | Different features needed variations | Unify Q1 |
| API surface | 260+ endpoints | Feature growth | Consolidate Q2 |
| Test coverage | 63% | Speed prioritized | Improve ongoing |

### Intentional Trade-offs

| Decision | Trade-off | Why We Accept It |
|----------|-----------|------------------|
| Serverless DB | Cold starts | Cost efficiency worth latency |
| Clerk auth | Vendor lock-in | Time to market, enterprise features |
| Tool-based AI | Upfront work | Reliability and auditability |
| TypeScript strict | Slower development | Fewer runtime bugs |

### What We Won't Compromise

1. **Multi-tenant isolation** - Every query scoped, no exceptions
2. **Type safety** - Zero TypeScript errors policy
3. **Tool reliability** - AI tools must be deterministic and auditable

---

## Appendix: File Structure

```
galaxyco-ai-3.0/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (app)/              # Authenticated routes
│   │   │   ├── dashboard/
│   │   │   ├── crm/
│   │   │   ├── finance/
│   │   │   └── ...
│   │   ├── (marketing)/        # Public routes
│   │   └── api/                # API routes
│   │       ├── assistant/      # Neptune endpoints
│   │       ├── crm/
│   │       ├── finance/
│   │       └── ...
│   ├── components/             # React components
│   │   ├── ui/                 # Primitives (Radix-based)
│   │   ├── dashboard/
│   │   ├── crm/
│   │   └── ...
│   ├── lib/                    # Business logic
│   │   ├── ai/                 # Neptune, tools, prompts
│   │   ├── db.ts               # Database connection
│   │   └── ...
│   └── db/
│       └── schema.ts           # Drizzle schema (source of truth)
├── drizzle/                    # Migrations
├── tests/                      # Test suites
└── docs/                       # Documentation
```

---

## Questions This Document Should Answer

1. **Why is the codebase structured this way?** → Module boundaries and ownership
2. **How does data flow through the system?** → Request lifecycle diagram
3. **Why these technologies over alternatives?** → Key decisions section
4. **How is multi-tenancy enforced?** → Database design + security model
5. **How do I add a new AI capability?** → Tool organization section
6. **What technical debt exists?** → Acknowledged openly with plans

---

*Last updated: January 2026*
*Maintainer: [Your Name]*
