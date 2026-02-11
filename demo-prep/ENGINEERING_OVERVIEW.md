# GalaxyCo.ai - Engineering Overview

> A candid technical overview for engineering discussion. Last updated: January 2026.

---

## TL;DR

**What we're building:** AI-native business OS where an AI assistant (Neptune) orchestrates across CRM, Finance, Marketing, and Knowledge modules via natural language.

**Tech stack:** Next.js 16 + TypeScript + PostgreSQL (Neon) + OpenAI/Anthropic + Vercel

**Current state:** Core platform functional, 37+ AI tools working, multi-tenant foundation solid. UI polish and test coverage need work.

**Where we need help:** Frontend polish, design system hygiene, scaling architecture review.

---

## Tech Stack at a Glance

### Core
| Layer | Technology | Why |
|-------|------------|-----|
| Framework | Next.js 16 (App Router) | Server Components, streaming, colocation |
| Language | TypeScript (strict mode) | Zero errors policy, self-documenting |
| Database | PostgreSQL via Neon | Serverless, branching, scale-to-zero |
| ORM | Drizzle | Type inference, SQL-like, edge-ready |
| Auth | Clerk | Pre-built UI, SSO/SAML, webhooks |

### AI
| Component | Technology | Why |
|-----------|------------|-----|
| Primary LLM | OpenAI GPT-4o | Tool calling reliability |
| Fallback LLM | Anthropic Claude | Reasoning tasks, redundancy |
| Embeddings | OpenAI text-embedding-3-small | RAG search |
| Vector DB | Upstash Vector | Serverless, simple API |

### Infrastructure
| Service | Technology | Why |
|---------|------------|-----|
| Hosting | Vercel | Edge functions, preview deploys |
| Background Jobs | Trigger.dev | Serverless cron, queues |
| Real-time | Pusher | WebSocket without infra |
| Cache | Upstash Redis | Serverless Redis |
| Monitoring | Sentry | Error tracking, traces |
| Storage | Vercel Blob | File uploads |

### Frontend
| Layer | Technology |
|-------|------------|
| Styling | Tailwind CSS 4.0 + custom "Nebula" theme |
| Components | Radix UI primitives + shadcn/ui patterns |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Data Fetching | SWR |

---

## Architecture (The Real Version)

```
┌─────────────────────────────────────────────────────────────────┐
│                         NEPTUNE (AI Hub)                         │
│                                                                   │
│   User says: "Add Sarah from TechFlow and schedule a meeting"   │
│                              │                                    │
│                              ▼                                    │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│   │   Context   │  │    Tool     │  │   Model     │             │
│   │   Builder   │──▶│ Orchestrator│──▶│   Router    │             │
│   └─────────────┘  └─────────────┘  └─────────────┘             │
│          │                │                │                      │
│          ▼                ▼                ▼                      │
│   Workspace state   37+ tools by    GPT-4 primary               │
│   User preferences  domain (CRM,    Claude fallback             │
│   Recent activity   Finance, etc)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
     ┌───────────┐     ┌───────────┐     ┌───────────┐
     │    CRM    │     │  Finance  │     │ Knowledge │
     │           │     │           │     │           │
     │ Contacts  │     │ Invoices  │     │ Documents │
     │ Deals     │     │ Expenses  │     │ RAG Search│
     │ Pipeline  │     │ Reports   │     │ Embeddings│
     └─────┬─────┘     └─────┬─────┘     └─────┬─────┘
           │                 │                 │
           └─────────────────┼─────────────────┘
                             ▼
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │    (Neon)       │
                    │                 │
                    │  50+ tables     │
                    │  All scoped by  │
                    │  workspace_id   │
                    └─────────────────┘
```

### Key Design Decisions

1. **Multi-tenant from day one** — Every table has `workspace_id`. Every query scoped. Not bolted on.

2. **AI as orchestration, not feature** — Neptune chains tools together. Modules expose capabilities, AI composes them.

3. **Tool-based AI** — Each capability is a structured tool with Zod schema. Reliable, auditable, extensible.

---

## What Works Well ✅

### Neptune AI Assistant
- **37+ working tools** across CRM, Finance, Marketing, Calendar, Knowledge
- **Multi-step orchestration** — "Create contact and schedule meeting" works
- **Session memory** — Remembers context within conversations
- **Proactive suggestions** — Detects patterns, suggests actions
- **Sub-3-second responses** — Streaming works smoothly

### Core Platform
- **Multi-tenancy** — Rock solid. Every query scoped. Zero leaks.
- **Type safety** — Zero TypeScript errors. Strict mode enforced.
- **API layer** — 260+ endpoints, RESTful, consistent patterns
- **Real-time** — Pusher integration for live updates
- **Background jobs** — Trigger.dev handles async work (campaigns, etc.)

### Database
- **50+ tables** with proper indexes
- **Drizzle ORM** — Type-safe, migrations work
- **Neon serverless** — Scales to zero, branching for previews

### Auth & Security
- **Clerk** handles auth, SSO, user management
- **Row-level isolation** — No cross-tenant data access possible
- **Secrets management** — Env vars, no hardcoded keys

---

## What Needs Work 🔧

### Test Coverage (Critical Gap)
| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Lines | ~52% | 80% | -28% |
| Functions | ~27% | 70% | -43% |
| E2E | 85% pass | 100% | -15% |

**Reality:** Core business logic tested. UI components largely untested. Neptune AI system has minimal coverage.

### UI/UX Polish
- **Dashboard chat interface** — Functional but looks MVP-grade
- **Design system** — Tokens exist but underutilized
- **No `components.json`** — shadcn CLI not configured
- **Inconsistent patterns** — Some components custom, some shadcn

### Technical Debt
| Area | Issue | Impact |
|------|-------|--------|
| Caching | 4 separate implementations | Maintenance burden |
| Context builders | Multiple similar functions | Confusion |
| API surface | 260+ endpoints | Review needed |
| Component size | Some files 1000+ lines | Hard to maintain |

### Known Issues
- Campaign send requires 10DLC approval (SMS blocked, voice works)
- Cold starts on serverless DB (1-2s on first request)
- No component documentation/Storybook

---

## Codebase Stats

```
Source Files:     800+
Components:       380+
API Routes:       260+
AI Tools:         37
Database Tables:  50+
Test Files:       27
Lines of Code:    ~150k (estimated)
```

### File Structure
```
src/
├── app/                 # Next.js App Router
│   ├── (app)/          # Authenticated routes (dashboard, CRM, etc.)
│   ├── (marketing)/    # Public routes
│   └── api/            # API routes by domain
├── components/
│   ├── ui/             # 50+ shadcn-style primitives
│   ├── neptune/        # AI assistant components
│   ├── crm/            # CRM dashboard components
│   └── ...             # Domain-specific components
├── lib/
│   ├── ai/             # Neptune core, tools, prompts
│   │   └── tools/      # 37 tools organized by domain
│   ├── neptune/        # Page context, quick actions
│   └── ...             # Utilities, services
└── db/
    └── schema.ts       # Drizzle schema (source of truth)
```

---

## Where We Need Help

### 1. Frontend Polish (High Priority)
**Problem:** Core functionality works, but UI doesn't inspire confidence.

**Specific asks:**
- Replace dashboard chat with polished component (shadcn blocks candidate identified)
- Improve empty states, loading states, error states
- Audit mobile responsiveness
- Consistent spacing/typography

**Effort estimate:** 2-3 weeks focused work

### 2. Design System Hygiene (Medium Priority)
**Problem:** Have tokens, not using them consistently.

**Specific asks:**
- Add `components.json` for shadcn CLI
- Consolidate color tokens (CSS vars vs Tailwind vs TS)
- Document component patterns
- Consider Storybook for component catalog

**Effort estimate:** 1-2 weeks

### 3. Test Coverage (Medium Priority)
**Problem:** 52% coverage, target is 80%.

**Specific asks:**
- Component tests for major dashboards
- Neptune AI system tests
- E2E flows for critical paths

**Effort estimate:** 40-60 hours focused testing

### 4. Architecture Review (Lower Priority but Valuable)
**What we'd value feedback on:**
- Caching strategy consolidation
- API versioning approach
- Background job patterns
- Real-time architecture at scale

---

## Running the Project

```bash
# Clone and install
git clone https://github.com/galaxy-co-ai/galaxyco_ai_3.0.git
cd galaxyco_ai_3.0
npm install

# Configure environment
cp .env.example .env.local
# Add required API keys (see .env.example)

# Database
npm run db:push    # Push schema to Neon

# Development
npm run dev        # http://localhost:3000

# Quality checks
npm run typecheck  # TypeScript (0 errors required)
npm run lint       # ESLint
npm run test       # Vitest unit/integration
npm run test:e2e   # Playwright E2E
```

---

## Key Files to Review

| Purpose | File |
|---------|------|
| Architecture overview | `ARCHITECTURE.md` |
| AI tools structure | `src/lib/ai/tools/` |
| Database schema | `src/db/schema.ts` |
| Neptune core | `src/lib/ai/neptune-core.ts` |
| Main dashboard | `src/components/dashboard/DashboardV2Client.tsx` |
| Neptune chat | `src/components/conversations/NeptuneAssistPanel.tsx` |
| Design tokens | `src/design-system/tokens/` |
| Test status | `tests/STATUS.md` |

---

## Questions We're Happy to Answer

1. Why Drizzle over Prisma?
2. How does multi-tenancy work in practice?
3. How do you add a new AI tool?
4. What's the Neptune context system?
5. How does real-time work?
6. What's the deployment pipeline?

---

## Bottom Line

**Strengths:** Solid foundation, working AI orchestration, proper multi-tenancy, type safety throughout.

**Weaknesses:** UI needs polish, test coverage gaps, design system underutilized.

**Ask:** Help us level up the frontend and establish patterns that scale.

---

*This document was prepared for engineering discussion. See `ARCHITECTURE.md` for deeper technical details.*
