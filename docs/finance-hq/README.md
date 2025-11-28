# Finance HQ Documentation

This folder contains complete specifications for building the Finance HQ feature in GalaxyCo.

## Quick Start

**For a new agent/conversation:**
1. Read `HANDOFF.md` first (critical rules & context)
2. Copy the prompt from `SESSION_PROMPTS.md` for the session you're starting

## Document Structure

### Specification Documents (Read in Order)

| # | Document | Purpose |
|---|----------|---------|
| 1 | `01-product-spec.md` | Product vision, goals, scope, and success criteria |
| 2 | `02-ux-wireframe.md` | Page layout, component regions, interaction flows |
| 3 | `03-ui-style-guide.md` | Visual design aligned with GalaxyCo design system |
| 4 | `04-component-architecture.md` | Component definitions, props, state, behavior |
| 5 | `05-backend-api-spec.md` | API routes, requests, responses, caching |
| 6 | `06-integration-mapping.md` | OAuth, encryption, provider API mapping |
| 7 | `07-neptune-assistant-spec.md` | AI assistant finance-specific extensions |
| 8 | `08-state-management.md` | SWR hooks, Context patterns (not Zustand) |
| 9 | `09-routes-and-navigation.md` | Page routes, sidebar integration |
| 10 | `10-master-build-instructions.md` | Build order, checklists, deliverables |

### Planning Documents

| Document | Purpose |
|----------|---------|
| `HANDOFF.md` | **🚀 Start here** — Agent handoff with critical rules |
| `SESSION_PROMPTS.md` | **📋 Copy-paste prompts** for each session |
| `EXECUTION_PLAN.md` | Detailed phased implementation plan |
| `README.md` | This file |

## Key Information

### What is Finance HQ?
A unified financial command center that:
- Connects QuickBooks, Stripe, and Shopify
- Merges financial data into a single dashboard
- Shows KPIs, modules, timeline, and activity
- Enables direct actions (create invoices, send reminders)
- Extends Neptune AI with finance-specific context

### Technology Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** SWR + React Context
- **Database:** PostgreSQL via Drizzle ORM
- **Cache:** Redis
- **AI:** OpenAI via existing Neptune infrastructure

### Critical Rules
1. **No breaking changes** to existing code
2. **Follow existing patterns** exactly
3. **TypeScript strict mode** — no `any` types
4. **Accessibility required** — ARIA, keyboard nav
5. **Error handling mandatory** — try-catch everything
6. **Test after each phase** — build + lint must pass

## File Overview

```
docs/finance-hq/
├── README.md                       # This file
├── HANDOFF.md                      # 🚀 Start here for new agents
├── SESSION_PROMPTS.md              # 📋 Copy-paste prompts for each session
├── EXECUTION_PLAN.md               # Phased implementation plan
├── 01-product-spec.md              # Product specification
├── 02-ux-wireframe.md              # UX wireframes
├── 03-ui-style-guide.md            # UI style guide
├── 04-component-architecture.md    # Component architecture
├── 05-backend-api-spec.md          # Backend API specification
├── 06-integration-mapping.md       # Integration mapping
├── 07-neptune-assistant-spec.md    # Neptune assistant specification
├── 08-state-management.md          # State management
├── 09-routes-and-navigation.md     # Routes and navigation
└── 10-master-build-instructions.md # Master build instructions
```

## Build Sessions Summary

The build is divided into **3 conversation sessions**:

### Session 1: Backend Foundation (Phases 1-4)
- Types and structure
- Database schema extension
- QuickBooks, Stripe, Shopify services
- 10 API routes

### Session 2: Frontend Components (Phases 5-6)
- ~20 React components
- Page route and sidebar

### Session 3: AI & Polish (Phases 7-8)
- Neptune AI extensions
- Testing and refinement

**Estimated total effort:** 3-4 hours across 3 conversations

---

*Created: 2025-11-28*  
*Version: 1.0*

