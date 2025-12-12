# AI Agent Context - GalaxyCo.ai 3.0

**Last Updated:** 2025-12-12T01:38:08.213Z  
**Git Branch:** chore/ui-button-family  
**Git HEAD (at generation):** f59b00a  
**Last Commit Date:** 2025-12-11

---

## 🎯 Quick Summary (100 words)

Production SaaS platform for AI-powered business automation. Built with Next.js (App Router) + React + TypeScript + Tailwind. Data layer uses Drizzle ORM with Neon Postgres. Authentication is handled by Clerk. Key integrations include Upstash (Redis/Vector), Trigger.dev background jobs, Stripe billing, and Sentry monitoring (where configured). Repo contains extensive documentation under `docs/` and a broad API surface under `src/app/api/`.

**Tech Stack:** Next.js 16.0.4, React 19.2.0, TypeScript 5.7.2, Tailwind CSS 4.0.0, Clerk Auth, Drizzle ORM 0.44.7, Neon Postgres, Upstash (Redis/Vector), Trigger.dev, Stripe, Sentry

---

## 📊 Current Health

|| Metric | Status | Details |
||--------|--------|---------|
|| **TypeScript** | ✅ 0 errors | `npm run typecheck` |
|| **ESLint** | 🟡 Not checked by generator | Run `npm run lint` |
|| **Build** | 🟡 Not checked by generator | Run `npm run build` |
|| **Tests** | 🟡 Not checked by generator | Run `npm test` |
|| **Dependencies** | 🟡 Not checked by generator | Run `npm audit` / `npm outdated` |

---

## 🔄 Recent Work (Last 7 Days)

- 2025-12-11: feat(ui): standardize remaining headers
- 2025-12-11: docs(status): update AI context
- 2025-12-11: feat(ui): standardize orchestration headers
- 2025-12-11: docs(status): update AI context
- 2025-12-11: docs(ui): update design system docs
- 2025-12-11: docs(status): update AI context
- 2025-12-11: chore(automation): improve AI_CONTEXT post-commit workflow
- 2025-12-11: feat(ui): standardize headers and pill tabs
- 2025-12-11: chore: minor TypeScript cleanup
- 2025-12-11: docs: update AI_CONTEXT
- 2025-12-11: chore(automation): fix AI_CONTEXT generator stack
- 2025-12-11: chore: update AI context after Phase 4A completion
- 2025-12-11: docs(neptune): complete Phase 4A Day 4 - metrics documentation
- 2025-12-11: feat(observability): Phase 4A Day 3 - Metrics validation test script
- 2025-12-11: feat(observability): Phase 4A Day 2 - Admin Metrics API
- 2025-12-11: feat(observability): Phase 4A Day 1 - Sentry performance tracking
- 2025-12-11: docs: mark Phase 3 Deep Memory System complete
- 2025-12-11: feat(neptune): Phase 3 Deep Memory System (#3)
- 2025-12-11: feat(neptune): Phase 2 RAG Enhancements (#2)
- 2025-12-11: docs: mark Phase 1 Neptune optimization complete
- 2025-12-11: feat(neptune): Phase 1 Performance Optimizations - 2-3x faster response times
- 2025-12-11: chore: hide internal scripts and old files from public view
- 2025-12-11: docs: remove tagline from README
- 2025-12-11: docs: replace verbose README with professional public-facing version
- 2025-12-11: security: hide internal status docs and remove token from remote URL
- 2025-12-11: docs: add changelog and update AI context with final system state
- 2025-12-11: fix(phone-numbers): lazy load SignalWire SDK to avoid lodash dependency error
- 2025-12-11: debug(phone-numbers): add detailed logging to API routes
- 2025-12-10: feat(conversations): add department filtering UI
- 2025-12-10: fix(webhooks): add type assertion for nullable numberType
- 2025-12-10: feat(conversations): add department routing by phone number type
- 2025-12-10: fix(phone-numbers): bypass membership check for Clerk organizations
- 2025-12-10: feat(phone-numbers): support Clerk org IDs in phone number APIs
- 2025-12-10: fix(conversations): replace Twilio with SignalWire references and add debug logging
- 2025-12-10: fix(conversations): make phone number badge visible on all screen sizes
- 2025-12-10: docs: add comprehensive test plan for phone number integration in Conversations
- 2025-12-10: feat(conversations): add workspace phone number display to header
- 2025-12-10: feat(phone-numbers): add edit modal and fix Next.js 15 async params
- 2025-12-10: docs: create comprehensive handoff document for phone number system
- 2025-12-10: feat(phase-4-5): add phone number UI and enterprise multi-number management
- 2025-12-10: docs: add guides README with phone provisioning summary
- 2025-12-10: docs: update AI_CONTEXT.md with phone provisioning system
- 2025-12-10: docs: add comprehensive phone number provisioning documentation
- 2025-12-10: feat(communications): Phase 3 - Webhook routing by phone number
- 2025-12-10: feat(communications): Phase 2 - Auto-provision phone numbers per workspace
- 2025-12-10: feat: add automatic phone number provisioning per workspace
- 2025-12-10: docs: add comprehensive multi-tenant conversations guide
- 2025-12-10: docs: comprehensive completion summary for all three tasks
- 2025-12-10: feat(communications): complete SignalWire integration
- 2025-12-10: docs: add comprehensive session summary for 2025-12-11 work
- 2025-12-10: feat(db): add migration support and RLS policies
- 2025-12-10: docs: auto-update AI_CONTEXT.md with latest changes
- 2025-12-10: docs: add database audit, SignalWire vs Twilio analysis, and supermemory.ai evaluation
- 2025-12-10: docs: mark Content Cockpit as complete in AI_CONTEXT.md
- 2025-12-10: fix(automation): prevent infinite loop in post-commit hook
- 2025-12-10: feat(automation): complete Husky automation setup
- 2025-12-10: feat(automation): add AI context auto-generation system
- 2025-12-10: refactor(hooks): fix exhaustive-deps in AlertBadgePopover
- 2025-12-10: refactor(hooks): fix exhaustive-deps in FloatingAIAssistant
- 2025-12-10: refactor(deps): remove 12 unused dependencies
- 2025-12-10: refactor(phase2): consolidate dashboard-v2 to dashboard
- 2025-12-10: refactor(phase2): archive unused component directories
- 2025-12-10: docs(phase5): complete backend health and optimization audit
- 2025-12-10: docs(phase6): create comprehensive organization guidelines
- 2025-12-10: refactor(phase4): configure ESLint for clean codebase
- 2025-12-10: docs(phase1): organize root markdown files into structured docs directory
- 2025-12-10: refactor: replace live dashboard demos with static HD screenshots
- 2025-12-10: fix(hydration): eliminate React error #418 by using lazy state initializers
- 2025-12-10: fix(dashboard): prevent API 404s on marketing pages with disableLiveData prop
- 2025-12-10: feat(admin): add Heizen demo access to Mission Control whitelist
- 2025-12-10: chore(docs): reorganize documentation and clean up root directory
- 2025-12-09: fix(content-cockpit): fix Server/Client Component serialization error
- 2025-12-09: fix(admin): handle missing tables in admin layout and restore await
- 2025-12-09: fix(content-cockpit): handle missing tables gracefully in production
- 2025-12-09: fix(content-cockpit): add missing await in transaction callback
- 2025-12-09: fix(content-cockpit): fix race condition and null match bugs
- 2025-12-09: feat(content-cockpit): Phase I - Testing and Polish
- 2025-12-09: feat(content-cockpit): Phase H - Neptune AI Integration
- 2025-12-09: feat(content-cockpit): Phase F - Guided Article Flow
- 2025-12-09: feat(content-cockpit): Phase G - Use Case Studio
- 2025-12-09: docs: add Article Analytics API endpoints to README
- 2025-12-09: feat(content-cockpit): Phase E - Article Analytics
- 2025-12-09: docs: update README with Hit List feature and Phase E kickoff
- 2025-12-09: feat(content-cockpit): Phase D - Article Hit List
- 2025-12-09: feat(content-cockpit): Phase C - Sources Hub
- 2025-12-09: docs: add Content Cockpit Phase A & B documentation to README
- 2025-12-09: feat(content-cockpit): Phase B - Dashboard UI redesign
- 2025-12-09: feat(content-cockpit): Phase A - Database schema and alert badges
- 2025-12-09: fix(api): prevent duplicate users with upsert pattern
- 2025-12-09: feat(article-studio): Phase 9 complete - Final Integration and Testing
- 2025-12-09: feat(article-studio): Phase 8 complete - Pre-Publish Review
- 2025-12-09: feat(article-studio): Phase 7 complete - Blog Intelligence
- 2025-12-09: feat(article-studio): Phase 6 complete - Image Generation and Upload
- 2025-12-09: feat(article-studio): Phase 5 complete - Source Verification System
- 2025-12-09: feat(article-studio): Phase 4 complete - AI-assisted writing
- 2025-12-09: feat(article-studio): Phase 3 complete - Layout templates and outline editor
- 2025-12-09: feat(article-studio): Phase 2 complete - topic generator and brainstorm mode
- 2025-12-09: feat(article-studio): Phase 1 complete - database schema and topic bank
- 2025-12-09: feat(auth): add dalton@galaxyco.ai to system admin whitelist
- 2025-12-09: docs: add styled Select dropdown fix to documentation
- 2025-12-09: fix(ui): replace native selects with styled Select component
- 2025-12-09: docs: update README and PROJECT_STATUS with UI polish fixes
- 2025-12-09: fix(ui): marketing title alignment and orchestration button styling
- 2025-12-09: fix(lint): remove try/catch around JSX in team detail page
- 2025-12-09: feat(web): convert orchestration pages to light theme
- 2025-12-09: docs: add marketing channels bug fix to documentation
- 2025-12-09: fix: handle undefined channels data and missing table gracefully
- 2025-12-09: feat: implement five core features - search, channels, config, sharing, docs
- 2025-12-09: feat(sharing): implement document sharing with public links
- 2025-12-09: feat(agents): add configuration modals for agents and teams
- 2025-12-09: feat(marketing): implement marketing channels with CRUD API
- 2025-12-09: feat(search): implement global search API and UI
- 2025-12-09: docs: Mark Agent Orchestration System as COMPLETE
- 2025-12-09: feat(orchestration): Phase 7 - UI Integration and Polish (FINAL PHASE)
- 2025-12-09: feat(orchestration): Phase 7 - UI Integration and Polish (FINAL PHASE)
- 2025-12-09: docs: Add Phase 7 kickoff message for Agent Orchestration System
- 2025-12-09: feat(orchestration): Phase 6 - Autonomous Operations Mode
- 2025-12-09: docs: Add Phase 6 kickoff document for Autonomous Operations Mode
- 2025-12-09: fix(orchestration): Fix agentWorkflows insert types
- 2025-12-09: fix(orchestration): Fix duplicate id property in workflow step mapping
- 2025-12-09: fix(orchestration): Fix teamConfig type to match schema definition
- 2025-12-09: fix(orchestration): Fix department enum type for agentTeams insert
- 2025-12-09: fix(orchestration): Fix TypeScript build error with schema imports
- 2025-12-09: feat(orchestration): Phase 5 - Neptune Integration and Natural Language Orchestration
- 2025-12-09: docs: add Phase 5 kickoff message for next agent conversation
- 2025-12-09: fix(orchestration): fix TypeScript error with unknown type in JSX render
- 2025-12-09: feat(orchestration): Phase 4 - Multi-Agent Workflows with Visual Builder
- 2025-12-09: fix(api): resolve TypeScript errors in orchestration API routes
- 2025-12-09: feat(orchestration): Phase 2 - API Routes for Orchestration Endpoints
- 2025-12-08: feat(orchestration): Phase 1 - Database Schema and Core Infrastructure
- 2025-12-08: docs: add Clerk webhooks configuration to documentation
- 2025-12-08: feat(webhooks): add Clerk organization event handlers
- 2025-12-08: docs: add Google OAuth configuration to Clerk production setup
- 2025-12-08: docs: add Clerk production deployment milestone
- 2025-12-08: fix(neptune): user messages now display plain white text instead of markdown
- 2025-12-08: feat(neptune): 10-point enhancement - navigation, PDF, keyboard shortcuts, search
- 2025-12-08: fix(neptune): use correct prism-react-renderer v2 API (Highlight instead of Prism)
- 2025-12-08: feat(neptune): add rich response rendering with markdown, link previews, and search cards
- 2025-12-08: feat(web): move Feedback to sidebar, remove floating button
- 2025-12-08: feat(web): move Settings, Connectors, Mission Control to avatar dropdown
- 2025-12-08: fix(admin): extract recharts to client component for analytics page
- 2025-12-08: fix(ui): use ComponentProps instead of non-existent ButtonProps export
- 2025-12-08: fix(crm): remove invalid setSelectedLeadData call - selectedLeadData is derived
- 2025-12-08: docs: update README and PROJECT_STATUS with analytics fix
- 2025-12-08: fix(analytics): prevent duplicate search tracking on Enter key
- 2025-12-08: fix(web): resolve Taylor's feedback - 4 bug fixes
- 2025-12-08: docs: complete analytics tracking documentation
- 2025-12-08: feat(analytics): redesign dashboard with Finance HQ style
- 2025-12-08: feat(analytics): add search query tracking
- 2025-12-08: feat(analytics): add click tracking for CTAs and navigation
- 2025-12-08: feat(analytics): add scroll depth tracking on blog posts
- 2025-12-08: feat(analytics): add global analytics provider with page view and time tracking
- 2025-12-08: docs: update README and PROJECT_STATUS with Mission Control improvements
- 2025-12-08: fix(admin): fix tab active state for nested routes like Categories
- 2025-12-08: fix(admin): match Feedback filter badge text size to Overview badges
- 2025-12-08: fix(admin): update Feedback filter badges styling to match Overview page
- 2025-12-08: feat(admin): add status filter badges to Feedback page
- 2025-12-08: feat(admin): add interactive status dropdown to Feedback page
- 2025-12-08: feat(admin): add Users and Settings pages to Mission Control
- 2025-12-08: fix(admin): fix Mission Control access - move authorization to layout
- 2025-12-08: chore: remove debug logging and temporary admin-debug endpoint
- 2025-12-08: chore: add admin debug endpoint (temporary)
- 2025-12-08: fix(sidebar): show Mission Control link for admin email whitelist
- 2025-12-08: feat(launchpad): restructure navigation with intent-based tabs
- 2025-12-08: feat(api): add creator ai edit and refresh status
- 2025-12-07: fix(ai): auto-execute web search tool
- 2025-12-07: feat(system): add web search debug endpoint
- 2025-12-07: docs: update documentation to reflect web search is not functional
- 2025-12-07: fix(neptune): add comprehensive logging for Perplexity API diagnostics
- 2025-12-07: fix(neptune): update Perplexity API to use correct model and response format
- 2025-12-07: feat(neptune): add Perplexity AI API for real-time web browsing
- 2025-12-07: fix(neptune): improve website analysis tool messages and AI instructions
- 2025-12-07: feat(neptune): implement serverless web crawler with Firecrawl-first approach
- 2025-12-07: docs: document website analysis limitation
- 2025-12-07: fix(neptune): fix type error for insights variable initialization
- 2025-12-07: fix(neptune): improve website analysis error messages and ensure non-null returns
- 2025-12-07: fix(neptune): fix QuickWebsiteInsights type import error
- 2025-12-07: fix(neptune): add missing closing brace in analyzeWebsiteQuick
- 2025-12-07: fix(neptune): strengthen URL detection tool call instruction
- 2025-12-07: fix(neptune): improve website analysis error handling and logging
- 2025-12-07: fix(neptune): add analysisNote to QuickWebsiteInsights interface
- 2025-12-07: feat(neptune): add web search and enhanced website analysis
- 2025-12-07: fix(api): resolve TypeScript errors causing Vercel build failures
- 2025-12-07: fix(agents): add missing 'or' import to context.ts
- 2025-12-07: fix(agents): correct Invoice field names in context gathering
- 2025-12-07: fix(agents): handle null page value in conversation context
- 2025-12-07: fix(agents): handle null feature value in generateSystemPrompt call
- 2025-12-07: fix(agents): add missing getActiveInsights function to proactive-engine
- 2025-12-07: feat(agents): complete Neptune AI overhaul - all 6 phases implemented
- 2025-12-07: fix(pricing): wrap useSearchParams in Suspense boundary for static generation
- 2025-12-07: feat(stripe): add complete Stripe subscription integration
- 2025-12-06: docs: update README and PROJECT_STATUS with Neptune chat UX improvements
- 2025-12-06: fix(chat): responsive icons for toggle and new chat button
- 2025-12-06: feat(chat): replace history dropdown with toggle view
- 2025-12-06: feat(chat): fresh conversation on login with history dropdown
- 2025-12-06: feat(pages): add legal, company pages and SEO files
- 2025-12-06: docs: update README and PROJECT_STATUS with latest fixes
- 2025-12-06: fix(oauth): add twitter to OAuthProvider type
- 2025-12-06: docs: update README and PROJECT_STATUS with bug fix note
- 2025-12-06: fix(insights): correct date range for upcoming events query
- 2025-12-06: docs: update README and PROJECT_STATUS with Neptune completion summary
- 2025-12-06: feat(neptune): advanced capabilities - voice, automation, collaboration
- 2025-12-06: feat(neptune): enhanced intelligence with chain-of-thought reasoning
- 2025-12-06: feat(neptune): email sending and calendar integration
- 2025-12-06: feat(neptune): parallel tool execution and semantic caching
- 2025-12-06: feat(neptune): RAG with knowledge base and citations
- 2025-12-06: feat(neptune): streaming responses with tool support
- 2025-12-06: fix(build): add missing Twitter integration and schema files
- 2025-12-06: fix(neptune): critical backend optimizations for response quality
- 2025-12-06: feat(neptune): instant website analysis with serverless-compatible crawler
- 2025-12-06: docs: add Twitter/X social media integration to README and PROJECT_STATUS
- 2025-12-06: fix(ui): responsive branded titles for mobile screens
- 2025-12-06: feat(dashboard): add dynamic Neptune-built roadmap
- 2025-12-06: feat(marketing): add Neptune-guided campaign builder with dynamic roadmap
- 2025-12-06: feat(neptune): unified conversations + smart file organization
- 2025-12-06: feat(db): add production database tables for campaigns, CRM, finance, automations
- 2025-12-06: feat(creator): make Creator page 100% production-ready with database integration
- 2025-12-06: docs: update README and PROJECT_STATUS with TypeScript fixes
- 2025-12-06: fix(types): resolve multiple TypeScript errors across codebase
- 2025-12-06: fix(types): fix CustomEvent type casting in NeptuneAssistPanel
- 2025-12-06: fix(api): fix aiMessages workspaceId reference in feedback route
- 2025-12-06: feat(library): add document actions dropdown menu with view/download/delete
- 2025-12-06: fix(web): add missing props to DashboardV2Client in dashboard page
- 2025-12-06: feat(web): dashboard refinements and CRM enhancements
- 2025-12-06: feat(neptune): transform into proactive autonomous learning assistant
- 2025-12-06: feat(dashboard): Neptune-first redesign with workspace roadmap
- 2025-12-06: feat(neptune): enhance AI with marketing expertise and concise communication
- 2025-12-06: fix(db): auto-create users from Clerk with workspace setup
- 2025-12-06: docs: update project status and readme with latest changes
- 2025-12-06: refactor(infra): migrate middleware to proxy convention
- 2025-12-06: fix(web): patch nextjs security release and align middlewares
- 2025-12-06: chore(infra): normalize end-of-file newlines
- 2025-12-06: fix(build): ensure Next.js production build passes
- 2025-12-05: fix(web): force dynamic rendering on header-based pages
- 2025-12-05: fix(build): remove unused ts expect error

---

## 📝 Recent Commits (Last 10)

- 2025-12-11: feat(ui): standardize remaining headers
- 2025-12-11: docs(status): update AI context
- 2025-12-11: feat(ui): standardize orchestration headers
- 2025-12-11: docs(status): update AI context
- 2025-12-11: docs(ui): update design system docs
- 2025-12-11: docs(status): update AI context
- 2025-12-11: chore(automation): improve AI_CONTEXT post-commit workflow
- 2025-12-11: feat(ui): standardize headers and pill tabs
- 2025-12-11: chore: minor TypeScript cleanup
- 2025-12-11: docs: update AI_CONTEXT

---

## 📁 Project Structure

```
galaxyco-ai-3.0/
├── docs/                    # All documentation (122 files)
│   ├── status/             # Current state & health
│   ├── plans/              # Roadmaps & strategies
│   ├── guides/             # Setup & tutorials
│   └── archive/            # Historical docs
├── src/
│   ├── app/                # Next.js App Router
│   ├── components/         # React components
│   ├── lib/                # Utilities & integrations
│   └── types/              # TypeScript definitions
└── tests/                  # E2E & unit tests
```

---

## 🎯 Known Issues

**None blocking production.**

Optional improvements:
- ESLint warnings cleanup (unused imports/vars)
- React hooks deps cleanup where flagged
- Console statements cleanup (prefer `logger`)

---

## 🚀 Next Priorities

1. **Feature Development** - Continue shipping product features
2. **Performance/Quality** - Incrementally reduce lint noise where touched
3. **Observability** - Keep Sentry + metrics coverage current

---

## 📚 Essential Docs for AI Agents

**Start Here (Read First):**
1. **This File** - Current state & recent changes
2. [Organization Guidelines](../guides/ORGANIZATION_GUIDELINES.md) - Project structure & conventions
3. [Backend Health Audit](./BACKEND_HEALTH_AUDIT.md) - Detailed health analysis

**Reference Docs:**
- [Roadmap](../plans/ROADMAP.md) - Long-term vision
- [API Documentation](../guides/API_DOCUMENTATION.md) - API reference
- [Design System](../guides/DESIGN-SYSTEM.md) - UI patterns & tokens
- [Agent Instructions](../guides/AGENT_INSTRUCTIONS.md) - AI agent guidelines

**For Specific Tasks:**
- New features: Read ORGANIZATION_GUIDELINES.md first
- Bug fixes: Check BACKEND_HEALTH_AUDIT.md for known issues
- Refactoring: Follow patterns in existing code

---

## 🏗️ Architecture Highlights

### Current Tech Decisions
- **Frontend:** Next.js App Router, React, TypeScript strict mode
- **Styling:** Tailwind CSS utilities only (no CSS modules/inline styles)
- **UI Components:** Radix UI primitives + shadcn/ui patterns
- **Data:** Drizzle ORM + Neon Postgres
- **Caching/Search:** Upstash (Redis/Vector)
- **Auth:** Clerk
- **Payments:** Stripe
- **Background Jobs:** Trigger.dev
- **Monitoring:** Sentry

### Key Patterns
- Server Components by default, Client Components when needed
- Zod validation for all user inputs
- Error boundaries around features
- TypeScript: Prefer `unknown` over `any`; type everything
- Git: Conventional Commits (feat, fix, refactor, docs, chore)

---

## 🔐 Safety Rules for AI Agents

**ALWAYS:**
- ✅ Work on a branch (never directly on main)
- ✅ Test after changes (typecheck, build, lint)
- ✅ Commit incrementally with descriptive messages
- ✅ Follow existing patterns and conventions
- ✅ Read ORGANIZATION_GUIDELINES.md before major changes

**NEVER:**
- ❌ Delete files without verification (move to _archive/ instead)
- ❌ Change imports without exhaustive grep
- ❌ Skip build verification after code changes
- ❌ Hard-code secrets (use environment variables)

---

## 💡 Tips for AI Agents

1. **Before Starting:** Read this file + ORGANIZATION_GUIDELINES.md (~7 min)
2. **For Context:** Check recent commits to see what's changed
3. **For Structure:** Refer to ORGANIZATION_GUIDELINES.md
4. **For Health:** Review BACKEND_HEALTH_AUDIT.md
5. **When Stuck:** Grep for similar patterns in existing code
6. **Before Committing:** Run health checks (typecheck + build)

---

**Generated by:** `scripts/update-context.js`  
**Update Frequency:** After significant work or weekly  
**Maintainer:** Executive Engineer AI + User

---

*This file provides a snapshot of the current project state. For detailed history, see git log or CHANGELOG.md.*
