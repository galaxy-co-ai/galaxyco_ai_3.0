# TASK: Content Cockpit - Phase H: Neptune AI Integration

## CONTEXT

Phase G is complete ✅. The Use Case Studio is now live with:
- 7-step wizard (Basic Info, Personas, Platform Mapping, Journey, Marketing, Questions, Review)
- CRUD + match + generate-roadmap APIs  
- AI roadmap generator using GPT-4o
- UseCaseListPage with status filters, search, and card grid
- UseCaseCard with edit/duplicate/delete actions

Phase H integrates all Content Cockpit tools with Neptune AI for conversational content creation.

## FILES TO REVIEW FIRST

1. `c:\Users\Owner\.cursor\plans\content_cockpit_implementation_e7966eac.plan.md` - Full plan (Phase H section)
2. `src/components/neptune/` - Neptune AI components
3. `src/lib/ai/` - AI utilities
4. `src/app/api/admin/` - Admin API routes

## PHASE H DELIVERABLES

### 1. Neptune AI Context Enhancement

**Enhance Neptune's context awareness for Content Cockpit:**
- Add Content Cockpit state to Neptune's context provider
- Include recent Hit List items in AI context
- Include active Use Case templates in AI context
- Include Sources Hub data for research assistance

### 2. Content-Aware Conversation Handlers

**`src/lib/ai/content-cockpit-handlers.ts`:**
- Handle "create an article about X" → guide to Article Studio
- Handle "what should I write next" → query Hit List priorities
- Handle "find sources for X" → trigger source discovery
- Handle "create a use case for X" → guide to Use Case Studio

### 3. Smart Suggestions

**Add Neptune suggestions panel to Content Cockpit:**
- Contextual suggestions based on current view
- "Your hit list has 3 high-priority topics"
- "Source discovery found 2 new suggestions"
- "Use case 'SaaS Founders' has no roadmap yet"

### 4. Quick Actions from Neptune

**Enable Neptune to trigger Content Cockpit actions:**
- Create topic idea directly from conversation
- Add source from URL mentioned in chat
- Generate roadmap for existing use case
- Start Article Studio with brainstorm context

### 5. Content Analytics Insights

**Neptune can analyze and report on content performance:**
- "How is my blog performing this month?"
- "Which articles need optimization?"
- "What topics are trending in my niche?"

## REQUIREMENTS

- All Neptune interactions should feel natural and conversational
- Actions triggered should show appropriate loading/success states
- Maintain existing Neptune UX patterns
- Follow multi-tenant workspace scoping

## VERIFICATION BEFORE COMMIT

- [ ] npm run lint - 0 errors
- [ ] npm run typecheck - 0 errors
- [ ] npm run build - succeeds
- [ ] Neptune can answer Content Cockpit questions
- [ ] Quick actions trigger correct flows
- [ ] Context is workspace-scoped

## AFTER COMPLETION

1. Update PROJECT_STATUS.md with Phase H completion
2. Git commit: `feat(content-cockpit): Phase H - Neptune AI Integration`
3. Create Phase I kickoff message for Testing and Polish
