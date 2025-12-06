# Neptune AI Enhancement Plan

> **Status:** IN PROGRESS  
> **Created:** December 6, 2025  
> **Goal:** Make Neptune a top-tier AI assistant with streaming, RAG, parallel execution, and advanced capabilities

---

## Phase 1: Streaming Responses (Replace Current Chat)

**Status:** [x] COMPLETE ✅

**Goal:** Make Neptune feel instant by streaming tokens as they generate.

### Files Modified
- `src/app/api/assistant/chat/route.ts` - Complete rewrite with SSE streaming + tool support
- `src/contexts/neptune-context.tsx` - Updated to consume streaming responses with async generator
- `src/components/conversations/NeptuneAssistPanel.tsx` - Added streaming cursor indicator

### Implementation Completed
1. ✅ Merged tool support from `chat/route.ts` into streaming architecture
2. ✅ Used OpenAI's streaming with tool calls: `stream: true` with `tool_choice`
3. ✅ Handle streamed tool calls (accumulated from chunks, executed on finish_reason: tool_calls)
4. ✅ Updated frontend to use fetch with SSE parsing via async generator
5. ✅ Chat endpoint now serves streaming responses by default

### Success Criteria
- [x] First token appears in under 500ms
- [x] Tool calls still work during streaming
- [x] All existing functionality preserved
- [x] Visual streaming indicator (animated cursor)
- [x] Abort support for cancelling streams

---

## Phase 2: RAG with Knowledge Base

**Status:** [ ] Not Started

**Goal:** Neptune can search user's uploaded documents to give grounded answers.

### Files to Create/Modify
- `src/lib/ai/rag.ts` - New RAG retrieval module
- `src/lib/vector.ts` - Already exists, enhance for RAG queries
- `src/lib/ai/tools.ts` - Add `search_knowledge_base` tool
- `src/lib/ai/context.ts` - Add knowledge context to AI context

### Implementation Steps
1. Create `searchKnowledgeBase(query, workspaceId, limit)` function
2. Use existing Pinecone/Upstash Vector for similarity search
3. Add tool that Neptune calls automatically when questions need document lookup
4. Inject top 3-5 relevant chunks into context
5. Add citation support ("According to [Document Name]...")

### Success Criteria
- [ ] Neptune finds relevant documents automatically
- [ ] Answers cite sources when using RAG
- [ ] Works with existing knowledge base uploads

---

## Phase 3: Parallel Tool Execution and Caching

**Status:** [ ] Not Started

**Goal:** Execute independent tools simultaneously, cache frequent queries.

### Files to Create/Modify
- `src/lib/ai/tools.ts` - Modify `processToolCalls` for parallel execution
- `src/lib/ai/cache.ts` - New semantic caching module
- `src/lib/ai/context.ts` - Add caching layer

### Implementation Steps
1. Identify independent tools (no data dependencies)
2. Use `Promise.all()` for parallel execution
3. Create semantic caching with embeddings (similarity > 0.95)
4. Cache responses with TTL, invalidate on data changes

### Success Criteria
- [ ] Multiple tool calls complete faster
- [ ] Common queries return instantly from cache

---

## Phase 4: Email Sending and Calendar Integration

**Status:** [ ] Not Started

**Goal:** Neptune can actually send emails and sync with real calendars.

### Files to Create/Modify
- `src/lib/ai/tools.ts` - Update `send_email` tool to actually send via Resend
- `src/lib/email.ts` - Already exists with Resend
- `src/lib/calendar/google.ts` - New Google Calendar integration
- `src/lib/calendar/outlook.ts` - New Outlook Calendar integration
- `src/app/api/auth/oauth/[provider]/` - Add Google/Microsoft calendar OAuth

### Implementation Steps
1. Modify `send_email` tool to use Resend API with confirmation step
2. Add Google Calendar OAuth scopes
3. Create calendar sync service
4. Add tools: `get_calendar_events`, `create_calendar_event`, `find_available_times`

### Success Criteria
- [ ] Emails actually send (with confirmation)
- [ ] Neptune can read and create calendar events

---

## Phase 5: Enhanced Intelligence

**Status:** [ ] Not Started

**Goal:** Multi-step reasoning, structured outputs, precomputed insights.

### Files to Create/Modify
- `src/lib/ai/reasoning.ts` - New chain-of-thought module
- `src/lib/ai/structured-output.ts` - JSON schema enforcement
- `src/trigger/precompute-insights.ts` - Background insight generation
- `src/lib/ai/system-prompt.ts` - Add reasoning instructions

### Implementation Steps
1. Add chain-of-thought prompting for complex questions
2. Use GPT-4o's `response_format: { type: "json_schema" }` for reliable outputs
3. Create Trigger.dev job for daily insight precomputation
4. Store insights in `proactiveInsights` table

### Success Criteria
- [ ] Complex questions get structured, step-by-step answers
- [ ] Tool parameters always valid
- [ ] Users see relevant insights on login

---

## Phase 6: Advanced Capabilities

**Status:** [ ] Not Started

**Goal:** Voice, workflow automation, real-time data, team collaboration.

### Files to Create/Modify
- `src/lib/ai/voice.ts` - Whisper transcription + TTS
- `src/lib/workflows/builder.ts` - Workflow automation from chat
- `src/lib/data-feeds/` - Real-time data connections
- `src/lib/ai/collaboration.ts` - Team mentions and delegation

### Implementation Steps
1. Add Whisper API for speech-to-text, OpenAI TTS for text-to-speech
2. Create `/api/assistant/voice` endpoint
3. Add tool: `create_automation` using `automation_rules` table
4. Add @mention team members, tool: `assign_to_team_member`

### Success Criteria
- [ ] Users can talk to Neptune
- [ ] Automations can be created via chat
- [ ] Tasks can be assigned to team

---

## Estimated Effort

| Phase | Effort | Priority |
|-------|--------|----------|
| Phase 1: Streaming | 2-3 hours | Critical |
| Phase 2: RAG | 3-4 hours | High |
| Phase 3: Parallel/Cache | 2-3 hours | High |
| Phase 4: Email/Calendar | 4-6 hours | High |
| Phase 5: Intelligence | 3-4 hours | Medium |
| Phase 6: Advanced | 6-8 hours | Medium |

**Total: 20-28 hours across multiple sessions**

---

## Completion Log

| Phase | Completed | Date | Notes |
|-------|-----------|------|-------|
| Phase 1 | [x] ✅ | December 6, 2025 | Streaming with tool support, SSE, visual cursor indicator |
| Phase 2 | [ ] | - | - |
| Phase 3 | [ ] | - | - |
| Phase 4 | [ ] | - | - |
| Phase 5 | [ ] | - | - |
| Phase 6 | [ ] | - | - |

---

**Mark this document COMPLETE when all phases are finished.**
