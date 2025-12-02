# GalaxyCo.ai 3.0 - Project Status

> **⚠️ CANONICAL STATUS DOCUMENT** - This is the single source of truth for project status.  
> Other `.md` files in the root may be outdated. Always refer to this file.

---

## Last Verified Build

| Field | Value |
|-------|-------|
| **Date** | December 2, 2024 |
| **Build Status** | ✅ Passing |
| **Deployment** | Vercel Production |
| **Latest Commit** | `4f0c130` - Team chat file sharing |

---

## Tech Stack

- **Framework**: Next.js 16.0.3 (Turbopack)
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Clerk (with Organizations for multi-tenancy)
- **AI Providers**: OpenAI, Anthropic Claude, Google Gemini, Gamma.app
- **Communications**: Twilio (SMS, WhatsApp, Voice) with Flex Contact Center
- **File Storage**: Vercel Blob
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

---

## Key Pages

| Page | Route | Status |
|------|-------|--------|
| Landing | `/` | ✅ Static |
| Dashboard | `/dashboard` | ✅ Dynamic |
| Dashboard v2 | `/dashboard-v2` | ✅ Dynamic (User-first redesign) |
| My Agents | `/activity` | ✅ Dynamic (with Laboratory) |
| Creator | `/creator` | ✅ Dynamic |
| Library | `/library` | ✅ Dynamic |
| CRM | `/crm` | ✅ Dynamic |
| Conversations | `/conversations` | ✅ Dynamic (with Team Chat) |
| Finance HQ | `/finance` | ✅ Dynamic |
| Marketing | `/marketing` | ✅ Dynamic |
| Lunar Labs | `/lunar-labs` | 🔄 Redesign planned |
| Connected Apps | `/connected-apps` | ✅ Dynamic |
| Settings | `/settings` | ✅ Dynamic (with Clerk Organizations) |
| Assistant | `/assistant` | ✅ Dynamic |
| Onboarding | `/onboarding` | ✅ Dynamic |

---

## Recent Changes

### December 2, 2024 (Session 4)

#### New Features

- **Team Chat** - Internal workspace messaging (Commits: `f2a5f8d`, `4f0c130`)
  - New "Team" tab on Conversations page for internal communication
  - Channel-based messaging (`#general`, `#sales`, etc.)
  - Channel types: General, Group, Announcement, Direct Message
  - Public channels auto-join on first message
  - File sharing with Vercel Blob storage:
    - Images: JPG, PNG, GIF, WebP, SVG
    - Documents: PDF, Word, Excel, PowerPoint, TXT, CSV, JSON
    - Archives: ZIP, RAR, GZ
    - Max 10MB per file
  - Paste images from clipboard (Ctrl+V)
  - Auto-detect and linkify URLs in messages
  - Real-time polling (5s refresh)
  - New database tables: `team_channels`, `team_messages`, `team_channel_members`
  - New API routes:
    - `/api/team/channels` - List/create channels
    - `/api/team/channels/[id]/messages` - Send/receive messages
    - `/api/team/upload` - File uploads
  - **Impact**: Teams can now communicate internally without leaving the platform

- **Agent Laboratory** - Complete agent creation wizard (Commit: `0861019`)
  - Replaced "Coming Soon" placeholder with full wizard
  - 3-step flow: Choose Base → Customize → Activate
  - 6 pre-built templates: Lead Qualifier, Meeting Prep, Customer Support, Data Analyst, Content Creator, Task Automator
  - Live preview panel showing agent as you build
  - AI-generated names and descriptions (editable)
  - Capability-based configuration (CRM Access, Email, Calendar, etc.)
  - Communication tone settings (Professional, Friendly, Concise)
  - Test run functionality before activation
  - NikeID/Oakley-style customization (not node-based)
  - New components in `src/components/agents/laboratory/`
  - New API: `/api/agent-templates` for template data
  - **Impact**: Users can easily create production-ready agents

- **Agent Execution System** - Real AI-powered agents
  - New API: `/api/agents/[id]/run` - Execute capability-based agents
  - New API: `/api/agents/test-run` - Test agent before creation
  - Agents use real database tools:
    - `create_lead` - Add leads to CRM
    - `schedule_meeting` - Book calendar events
    - `search_knowledge` - Query knowledge base
    - `send_email` - Send emails
  - Enhanced `workflow-executor.ts` for production execution
  - **Impact**: Agents perform real actions, not simulations

- **Enhanced Agent Chat** - Personalized, self-adjusting conversations
  - Concise responses (like talking to an employee)
  - Agent personality and contextual awareness
  - Self-adjustment tools:
    - `update_my_preferences` - Remember user preferences
    - `add_note_to_self` - Store context for future
    - `get_my_recent_activity` - Access recent executions
  - Preferences and notes stored in agent config
  - GPT-4o with tuned parameters (temp: 0.8, max_tokens: 300)
  - **Impact**: Agents learn and improve through conversation

- **Clerk Organizations** - Multi-tenant team management
  - Organization switcher in sidebar
  - OrganizationProfile in Settings for team management
  - Invite team members (even non-registered users) via email
  - Updated `auth.ts` to handle orgId context
  - Workspaces linked to Clerk Organization IDs
  - **Impact**: Full team collaboration support

#### Bug Fixes

- **Fixed workspace settings save** - Name/URL changes now persist correctly
  - Fixed API slug uniqueness check logic
  - Fixed client-side state update after save
- **Fixed Messages tab** - Removed random unread count causing erratic updates

---

### December 2, 2024 (Session 3)

#### New Features
- **Twilio Flex Integration** - Full contact center capabilities
  - New lib: `src/lib/twilio.ts` - Complete Twilio API client with:
    - SMS sending/receiving
    - WhatsApp messaging
    - Voice calls with TwiML support
    - TaskRouter for intelligent call routing
    - Worker management and activities
    - Real-time workspace statistics
  - New webhook: `/api/webhooks/twilio/status` - Delivery status callbacks
  - Updated `/api/integrations/status` - Shows Twilio connection status
  - **Impact**: Conversations page now fully powered by Twilio

- **Twilio in Connected Apps**
  - Added Twilio and Twilio Flex cards to Connected Apps page
  - Shows phone number, Flex status, and TaskRouter configuration
  - Quick link to Twilio Console for management
  - **Impact**: Users can see Twilio connection status at a glance

#### Bug Fixes
- **Fixed "Add Agent" link** - Changed from non-existent `/studio` to `/lunar-labs`
- **Wired Agent Messages to real API** - Messages tab now uses `/api/agents/[id]/chat` instead of mock data
  - Full conversation persistence in database
  - AI-powered agent responses
  - Clear history functionality

---

### December 2, 2024 (Session 2)

#### New Features
- **Gamma.app Integration for Creator** 
  - Added `GAMMA_API_KEY` environment variable support
  - New API route: `/api/creator/gamma` for polished document generation
  - New lib: `src/lib/gamma.ts` - Gamma API client with generation, polling, and helpers
  - Creator page now shows "Polish with Gamma" button after initial document generation
  - Supported types: Presentation, Document, Proposal, Newsletter, Blog, Social Post
  - Features: Edit in Gamma link, PDF export, "Polished with Gamma" badge
  - **Impact**: Users can now generate professionally designed documents with one click

#### UI/UX Improvements
- **Renamed "Integrations" to "Connected Apps"**
  - Route changed: `/integrations` → `/connected-apps`
  - Updated sidebar navigation label and href
  - Updated all internal links (Finance HQ reconnect links, etc.)
  - **Impact**: Clearer, more user-friendly terminology

---

### December 2, 2024 (Session 1)

#### UI/UX Improvements
- **Refactored Library page tabs** (Commits: `d268a8a`, `e58718a`)
  - Removed "Create" tab to eliminate confusion with Creator page
  - Converted Upload button to a tab for consistent UI
  - New tab structure: Articles | Categories | Favorites | Recent | Upload
  - Library now focuses on browsing, organizing, and uploading documents
  - Creator page (`/creator`) is the dedicated space for creating new content
  - **Impact**: Clearer separation of concerns and more intuitive navigation

- **Fixed document type card hover states** (Commit: `595601e`)
  - `TypeSelector.tsx`: Fixed gradient background not showing on icon hover
  - Implemented layered backgrounds with smooth opacity transitions
  - Base color layer fades out, gradient layer fades in on hover
  - **Impact**: Document type cards now have proper visual feedback on hover

#### Bug Fixes
- **Fixed stale closure bug in Creator components** (Commit: `9363a8d`)
  - `CreatorNeptunePanel.tsx`: Fixed `handleQuickAction` to pass prompt directly to `handleSend()` instead of using `setInput()` + `setTimeout()` pattern
  - `GuidedSession.tsx`: Already fixed - `handleOptionSelect` passes option directly to `handleSend(messageOverride)`
  - Both components now use `handleSend(messageOverride?: string)` pattern to avoid stale closures
  - Removed unused Badge import
  - **Impact**: Quick action buttons and option selects now send correct messages instead of stale state
  - **Status**: ✅ Committed and build verified

- **Rebuilt Activity page into "My Agents" hub** with 2-column layout matching Conversations page
  - Added 3 tabs: Activity, Messages, Laboratory
  - Agent list with simplified 3-status badges (Active/Paused/Inactive)
  - Messages tab for chat-style agent communication and training
  - Laboratory tab with full agent creation wizard
- **Updated sidebar**: Renamed "Activity" to "My Agents" with Bot icon
- **Cleaned up Dashboard**: Removed redundant Messages and Agents tabs (now in dedicated pages)
- Created new `src/components/agents/` component library

---

## Environment Variables

### Required
- `DATABASE_URL` - Neon PostgreSQL connection string
- `CLERK_SECRET_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Authentication

### AI Providers (at least one required)
- `OPENAI_API_KEY` - OpenAI GPT models (required for agents)
- `ANTHROPIC_API_KEY` - Claude models
- `GOOGLE_GENERATIVE_AI_API_KEY` - Gemini models
- `GAMMA_API_KEY` - Gamma.app document generation

### Twilio (Required for Conversations)
- `TWILIO_ACCOUNT_SID` - Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Twilio Auth Token
- `TWILIO_PHONE_NUMBER` - SMS/Voice phone number
- `TWILIO_WHATSAPP_NUMBER` - WhatsApp Business number (optional)
- `TWILIO_FLEX_INSTANCE_SID` - Flex instance for contact center (optional)
- `TWILIO_TASKROUTER_WORKSPACE_SID` - TaskRouter workspace for routing (optional)

### Optional
- `PINECONE_API_KEY` - Vector database for RAG
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob file storage (required for team chat attachments)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `TRIGGER_SECRET_KEY` - Background jobs
- `NEXT_PUBLIC_SENTRY_DSN` - Error tracking

---

## Database Schema (Key Tables)

### Team Messaging (New)
```
team_channels        - Workspace chat channels
team_messages        - Chat messages with attachments
team_channel_members - Channel membership and read status
```

### Agents
```
agents              - Agent configurations with capabilities
agent_templates     - Pre-built agent templates
agent_executions    - Execution history and results
agent_schedules     - Scheduled agent runs
agent_logs          - Detailed execution logs
```

### AI Conversations
```
ai_conversations    - Chat sessions (Neptune, agent chats)
ai_messages         - Individual messages
ai_user_preferences - User AI preferences
```

---

## Known Issues

_None currently blocking production._

---

## Quick Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Database migrations
npx drizzle-kit push
```

---

## File Structure (Key Directories)

```
src/
├── app/           # Next.js App Router pages
│   ├── (app)/     # Authenticated app pages
│   │   ├── activity/       # My Agents page
│   │   ├── conversations/  # Conversations + Team Chat
│   │   ├── connected-apps/ # Third-party integrations
│   │   ├── dashboard-v2/   # Redesigned dashboard
│   │   └── settings/       # Settings with Clerk Org
│   └── api/       # API routes
│       ├── agents/
│       │   ├── [id]/
│       │   │   ├── chat/   # Agent conversations
│       │   │   └── run/    # Agent execution
│       │   └── test-run/   # Test before creation
│       ├── agent-templates/
│       ├── team/
│       │   ├── channels/   # Team chat channels
│       │   └── upload/     # File uploads
│       ├── creator/
│       │   └── gamma/      # Gamma.app integration
│       └── webhooks/
│           └── twilio/     # Twilio webhooks
├── components/    # React components
│   ├── agents/
│   │   ├── laboratory/     # Agent creation wizard
│   │   │   ├── steps/      # Wizard steps
│   │   │   └── ...
│   │   └── ...
│   ├── conversations/
│   │   ├── TeamChat.tsx    # Team messaging UI
│   │   └── ...
│   ├── creator/
│   ├── dashboard-v2/
│   ├── galaxy/
│   │   └── sidebar.tsx     # With OrganizationSwitcher
│   └── ...
├── db/
│   └── schema.ts           # Drizzle schema (all tables)
├── lib/
│   ├── auth.ts             # With Clerk org support
│   ├── ai/
│   │   └── tools.ts        # AI agent tools
│   ├── gamma.ts
│   ├── twilio.ts
│   ├── storage.ts          # Vercel Blob
│   └── communications/
└── types/
```

---

## Notes for Future Developers

1. **This file is the source of truth** - Update this file when making significant changes
2. **Drizzle relations** - Use helper functions to normalize `object | array` union types
3. **Vercel builds** - Run `npm run build` locally before pushing to catch TypeScript errors
4. **Schema changes** - The `replyToId` self-reference uses relations, not inline `.references()`
5. **Gamma integration** - Requires Pro/Ultra/Teams/Business subscription for API access
6. **Lunar Labs** - Scheduled for complete redesign, don't invest in current implementation
7. **Clerk Organizations** - Enabled for multi-tenant workspaces; personal accounts also supported
8. **Team Chat** - Requires `BLOB_READ_WRITE_TOKEN` for file attachments
9. **Agent Tools** - All tools in `src/lib/ai/tools.ts` use real database operations
10. **Twilio webhooks** - Configure these URLs in Twilio Console after deployment:
    - SMS: `https://yourdomain.com/api/webhooks/twilio?type=sms&workspace=WORKSPACE_ID`
    - WhatsApp: `https://yourdomain.com/api/webhooks/twilio?type=whatsapp&workspace=WORKSPACE_ID`
    - Voice: `https://yourdomain.com/api/webhooks/twilio?type=voice&workspace=WORKSPACE_ID`
    - Status Callback: `https://yourdomain.com/api/webhooks/twilio/status`

---

_Last updated by: AI Assistant_  
_Update this file when: Build status changes, major features added, or breaking changes occur_
