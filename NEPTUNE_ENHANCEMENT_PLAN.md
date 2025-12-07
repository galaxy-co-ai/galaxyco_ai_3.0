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

**Status:** [x] COMPLETE ✅

**Goal:** Neptune can search user's uploaded documents to give grounded answers.

### Files Created/Modified
- `src/lib/ai/rag.ts` - New RAG module with searchKnowledgeBase, shouldUseRAG, formatCitations
- `src/lib/ai/tools.ts` - Enhanced search_knowledge tool to use RAG module with citations
- `src/lib/ai/system-prompt.ts` - Added instructions for Neptune to use RAG proactively

### Implementation Completed
1. ✅ Created `searchKnowledgeBase(query, workspaceId, options)` function with full RAG capabilities
2. ✅ Uses existing Upstash Vector for similarity search with keyword fallback
3. ✅ Updated search_knowledge tool to return contextText and citations for AI
4. ✅ Neptune automatically searches documents when questions might need lookup
5. ✅ Citation support: "According to [Document Title]..." with numbered references

### Success Criteria
- [x] Neptune finds relevant documents automatically
- [x] Answers cite sources when using RAG
- [x] Works with existing knowledge base uploads
- [x] Keyword fallback when vector search unavailable

---

## Phase 3: Parallel Tool Execution and Caching

**Status:** [x] COMPLETE ✅

**Goal:** Execute independent tools simultaneously, cache frequent queries.

### Files Created/Modified
- `src/app/api/assistant/chat/route.ts` - Modified processToolCalls for parallel execution with Promise.all
- `src/lib/ai/cache.ts` - New semantic caching module with embedding-based similarity

### Implementation Completed
1. ✅ All tools now execute in parallel using Promise.all()
2. ✅ Created semantic caching with 95% similarity threshold
3. ✅ Cache responses with TTL (1 hour default), smart invalidation
4. ✅ Cached responses stream to maintain UX consistency
5. ✅ Time-sensitive queries (today, schedule, create) bypass cache

### Success Criteria
- [x] Multiple tool calls complete faster (parallel execution)
- [x] Common queries return instantly from cache
- [x] Cache based on semantic similarity, not exact match
- [x] Smart invalidation for data changes

---

## Phase 4: Email Sending and Calendar Integration

**Status:** [x] COMPLETE ✅

**Goal:** Neptune can actually send emails and sync with real calendars.

### Files Created/Modified
- `src/lib/email.ts` - Already had full Resend integration (verified working)
- `src/lib/ai/tools.ts` - send_email already implemented, added find_available_times tool
- `src/lib/calendar/google.ts` - New Google Calendar service with availability checking
- OAuth already configured with Google Calendar scopes in `src/lib/oauth.ts`

### Implementation Completed
1. ✅ send_email tool already sends via Resend with lead tracking
2. ✅ Google/Microsoft Calendar OAuth scopes already configured
3. ✅ Created Google Calendar service for event sync and availability
4. ✅ Added find_available_times tool - suggests open meeting slots

### Success Criteria
- [x] Emails actually send (via Resend, with lead tracking)
- [x] Neptune can read Google Calendar events
- [x] Neptune can find available times for scheduling
- [x] Calendar conflict detection works with local + Google events

---

## Phase 5: Enhanced Intelligence

**Status:** [x] COMPLETE ✅

**Goal:** Multi-step reasoning, structured outputs, precomputed insights.

### Files Created/Modified
- `src/lib/ai/reasoning.ts` - Chain-of-thought + structured output module
- `src/lib/ai/system-prompt.ts` - Added reasoning approach guidelines
- `src/trigger/precompute-insights.ts` - Daily insights generator job
- `src/trigger/jobs.ts` - Export new insights tasks

### Implementation Completed
1. ✅ Chain-of-thought prompting with isComplexQuestion detection
2. ✅ Structured output with getStructuredResponse using JSON schema
3. ✅ Trigger.dev job for daily insight precomputation (6 AM daily)
4. ✅ Insights stored in proactiveInsights table (stalled leads, campaigns, tasks)

### Success Criteria
- [x] Complex questions get structured, step-by-step answers (performReasoning)
- [x] Tool parameters validated via structured schemas
- [x] Daily insights generated (scheduledInsightsPrecompute)

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
| Phase 2 | [x] ✅ | December 6, 2025 | RAG module, enhanced search_knowledge with citations |
| Phase 3 | [x] ✅ | December 6, 2025 | Parallel tool execution, semantic caching with 95% similarity |
| Phase 4 | [x] ✅ | December 6, 2025 | Email via Resend, Google Calendar integration, find_available_times |
| Phase 5 | [x] ✅ | December 6, 2025 | Chain-of-thought reasoning, structured output, daily insights job |
| Phase 6 | [ ] | - | - |

---

**Mark this document COMPLETE when all phases are finished.**
