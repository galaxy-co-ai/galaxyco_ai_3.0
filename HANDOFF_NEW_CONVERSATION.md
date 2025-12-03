# GalaxyCo.ai 3.0 - Project Handoff

## 🎯 Project Overview

GalaxyCo.ai is a comprehensive AI-powered business platform featuring CRM, marketing automation, workflow studio, knowledge base, and intelligent AI assistants. The platform is **fully functional and deployed** at https://galaxyco.ai.

**Current Version:** `v3.0.0` (stable tag created - DO NOT break the UI)

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Neon PostgreSQL with Drizzle ORM
- **Auth:** Clerk
- **AI:** OpenAI GPT-4
- **Styling:** Tailwind CSS + Shadcn UI
- **Deployment:** Vercel
- **Repository:** https://github.com/galaxy-co-ai/galaxyco_ai_3.0

## 📁 Key File Structure

```
src/
├── app/
│   ├── (app)/           # Main app pages (dashboard, crm, studio, etc.)
│   └── api/             # API routes
├── components/
│   ├── ui/              # Shadcn UI components
│   ├── dashboard/       # Dashboard components
│   ├── crm/             # CRM components
│   ├── studio/          # Workflow studio components
│   └── shared/          # Shared components (FloatingAIAssistant, etc.)
├── db/
│   └── schema.ts        # Database schema (Drizzle ORM)
└── lib/
    ├── auth.ts          # getCurrentWorkspace(), getCurrentUser()
    ├── db.ts            # Database connection
    ├── openai.ts        # OpenAI client
    └── ai-providers.ts  # getOpenAI() helper
```

## ✅ Working Features

| Page | Status | Key Features |
|------|--------|--------------|
| Landing | ✅ | Beautiful hero, feature tabs, pricing |
| Dashboard | ✅ | 6 tabs: AI Assistant, Snapshot, Automations, Planner, Messages, Agents |
| Activity | ✅ | Real-time agent monitoring, pause/resume |
| Studio | ✅ | 8 templates, workflow builder, create agents |
| CRM | ✅ | Leads, Organizations, Contacts, Deals, Insights, Automations |
| Marketing | ✅ | Campaigns, content, channels, analytics |
| AI Assistant | ✅ | 6 capabilities, GPT-4 chat, conversation history |
| Knowledge Base | ✅ | Collections, articles, search |
| Settings | ✅ | Profile, workspace, team, billing, security, notifications, API keys |
| Lunar Labs | ✅ | Interactive learning center, 25 steps |
| Integrations | ✅ | OAuth connection status |

## 🗄️ Database Schema Highlights

```typescript
// Key tables in src/db/schema.ts
- workspaces        // Multi-tenant workspaces
- users             // User profiles
- agents            // AI agents/workflows
- agentExecutions   // Execution history
- aiConversations   // AI chat conversations
- aiMessages        // Chat messages
- prospects         // CRM leads
- contacts          // CRM contacts
- customers         // Organizations
- deals             // Sales deals
- knowledgeCollections
- knowledgeItems
- calendarEvents
- integrations
```

## 🔌 Key API Endpoints

```
/api/agents                    - List/create agents
/api/agents/[id]               - Get/update/delete agent
/api/agents/[id]/chat          - Chat with specific agent
/api/assistant/chat            - Main AI assistant chat
/api/assistant/conversations   - Conversation history
/api/dashboard                 - Dashboard metrics
/api/activity                  - Activity/execution logs
/api/crm/prospects             - Leads CRUD
/api/crm/contacts              - Contacts CRUD
/api/workflows                 - Workflow CRUD
/api/workflows/[id]/execute    - Run workflow
/api/calendar/events           - Calendar events
```

## 🎨 UI Rules (CRITICAL)

⚠️ **DO NOT MODIFY THE UI** - The design is finalized and loved by the user.

- Don't change layouts, colors, or component structure
- Don't add/remove UI elements unless explicitly requested
- Focus on backend functionality and AI capabilities
- Use existing Skeleton components for loading states
- Use existing toast patterns for notifications

## 🚀 NEXT MISSION: Powerful AI Assistant

The user wants to evolve the AI Assistant into a deeply intelligent, contextual, and personable companion. Goals:

### 1. **Full Task Execution**
- AI should be able to perform actions on behalf of the user
- Create leads, send emails, schedule meetings, create workflows
- Execute multi-step tasks autonomously

### 2. **Deep Contextual Awareness**
- Remember user preferences, communication style, past interactions
- Understand the user's business, goals, and priorities
- Learn from every interaction to improve recommendations

### 3. **Personable & Relationship-Building**
- Develop a unique personality that resonates with the user
- Remember personal details (birthdays, preferences, habits)
- Proactive suggestions based on learned patterns
- Build emotional connection and trust

### 4. **Cross-Feature Intelligence**
- Know what's happening across CRM, Marketing, Calendar
- Connect dots between different features
- Provide holistic insights and recommendations

## 📊 Current AI Implementation

```typescript
// Main AI chat endpoint: src/app/api/assistant/chat/route.ts
// Agent-specific chat: src/app/api/agents/[id]/chat/route.ts

// Conversations stored in:
- aiConversations (title, context, userId, workspaceId)
- aiMessages (role, content, conversationId)

// User preferences (exists but underutilized):
- aiUserPreferences table in schema
```

## 🔑 Environment Variables Needed

```
DATABASE_URL=          # Neon PostgreSQL
CLERK_SECRET_KEY=      # Clerk auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
OPENAI_API_KEY=        # GPT-4
```

## 🏃 Quick Start Commands

```bash
npm install           # Install dependencies
npm run dev           # Start dev server (port 3000)
npm run build         # Production build
npm run db:push       # Push schema to database
npm run db:studio     # Open Drizzle Studio
```

## 📝 Key Patterns Used

1. **Multi-tenancy**: Every query filters by `workspaceId`
2. **Auth**: `getCurrentWorkspace()` and `getCurrentUser()` from `@/lib/auth`
3. **Error handling**: `createErrorResponse()` from `@/lib/api-error-handler`
4. **Data fetching**: useSWR on frontend, direct Drizzle queries on backend
5. **Validation**: Zod schemas for all API inputs

---

## 🎯 Starting Point for AI Enhancement

Begin by reviewing:
1. `src/app/api/assistant/chat/route.ts` - Main AI endpoint
2. `src/db/schema.ts` - Look at `aiUserPreferences` table
3. `src/components/shared/FloatingAIAssistant.tsx` - The floating AI bubble
4. `src/components/dashboard/DashboardDashboard.tsx` - Dashboard AI integration

The vision is to make the AI assistant feel like a trusted colleague who truly understands and cares about the user's success.
















