# Neptune AI Optimization Plan V2
**Date Created:** December 11, 2024  
**Status:** Ready for Implementation  
**Priority:** High Impact - Low Risk  
**Location:** `docs/plans/NEPTUNE_OPTIMIZATION_PLAN_V2.md`

---

## 🚀 KICKOFF INSTRUCTIONS - START HERE

### For New Agent/Developer Reading This Plan

**What is this?**  
This is a comprehensive optimization plan for Neptune, the primary AI assistant powering galaxyco.ai. The plan addresses performance bottlenecks, enhances RAG (Retrieval-Augmented Generation), and improves context intelligence.

**Where to Start:**
1. **Read "Current Architecture Analysis"** (below) to understand what exists
2. **Review "External Services Status"** (at bottom) - All infrastructure is already configured! ✅
3. **Start with Phase 1** - Quick wins that deliver 2-3x performance improvement in 2 weeks
4. **Follow the implementation order** - P0 → P1 → P2 priorities

**Quick Reference:**
- **Main Files:** `src/lib/ai/context.ts`, `src/lib/ai/rag.ts`, `src/contexts/neptune-context.tsx`
- **Database:** Neon PostgreSQL via Vercel (connection pooling enabled)
- **Caching:** Upstash Redis (already configured, just needs implementation)
- **Vector DB:** Upstash Vector (already storing embeddings)
- **Current Performance:** ~4-6s average response time
- **Target Performance:** <2s average response time

**Phase 1 Checklist - COMPLETE ✅:**
- [x] Implement Redis caching layer in `src/lib/ai/context.ts` ✅ (2024-12-11)
- [x] Add database indexes via migration in `drizzle/migrations/0003_add_neptune_indexes.sql` ✅ (2024-12-11)
- [x] Create context pruning logic in `src/lib/ai/context-pruning.ts` ✅ (2024-12-11)
- [x] Create PR and push to GitHub ✅ (2024-12-11) - PR #1
- [x] Run database migration - 8 indexes created ✅ (2024-12-11)
- [x] Merge PR to main ✅ (2024-12-11)

**Post-Deployment Monitoring:**
- [ ] Monitor cache hit rates in Upstash dashboard (target: >70%)
- [ ] Measure Neptune response times (target: <2s from ~4-6s)

**Need Help?**
- Architecture questions → See `docs/architecture/`
- Current status → See `docs/status/`
- Related plans → See `docs/plans/`

---

## Executive Summary

Neptune is the primary AI assistant for GalaxyCo.ai platform. Current analysis reveals a solid foundation with comprehensive features but opportunities for significant performance gains, deeper context awareness, and more intelligent orchestration capabilities.

**Key Findings:**
- ✅ Strong multi-tenant architecture with comprehensive features
- ⚠️ Performance bottlenecks in context gathering and caching
- ⚠️ RAG can be enhanced with hybrid search and reranking
- ⚠️ Memory/learning systems exist but underutilized

**Expected Impact:**
- **2-3x faster response times** (Phase 1)
- **35-40% better RAG accuracy** (Phase 2)
- **30% more relevant automation suggestions** (Phase 3)
- **Zero new infrastructure costs** (all services already configured)

---

## Current Architecture Analysis

### ✅ Strong Foundations

**Backend Architecture**
- React context-based state management (`neptune-context.tsx`)
- Streaming SSE responses for real-time interaction
- PostgreSQL (Neon via Vercel) with Drizzle ORM
- Multi-tenant architecture with workspace isolation

**RAG Implementation**
- Upstash Vector for embeddings storage
- OpenAI `text-embedding-3-small` for cost-efficient embeddings
- Knowledge base with collections, tags, metadata (`knowledgeItems` table)
- Fallback keyword search when vector unavailable
- Semantic search with similarity scoring

**Memory & Learning**
- `aiUserPreferences` table for communication styles
- `aiConversations` and `aiMessages` for history
- `neptuneActionHistory` for autonomy learning
- `proactiveInsights` for AI-generated suggestions
- `workspaceIntelligence` for business context learning

**Context Gathering**
- Comprehensive context builder pulls CRM, calendar, tasks, agents, marketing, finance
- Website analysis integration
- Content Cockpit metrics
- Proactive insights system

### ⚠️ Optimization Opportunities

**Performance Bottlenecks**
1. Context gathering runs in parallel but fetches ALL workspace data
2. No caching layer for frequently accessed context
3. Embedding generation happens synchronously
4. Query limits not optimized (fetching 100 messages per conversation)
5. No connection pooling visible in DB config

**RAG Limitations**
1. Simple keyword fallback lacks semantic understanding
2. No hybrid search (combining vector + keyword)
3. Fixed chunk size without intelligent splitting
4. No query expansion or reranking
5. Embeddings stored in JSONB (not optimal for similarity search)

**Context Intelligence Gaps**
1. Context gathering doesn't prioritize by relevance
2. No temporal awareness (recent vs historical)
3. Missing cross-entity relationship awareness
4. No automatic context pruning for token efficiency

**Orchestration & Memory**
1. Action history exists but underutilized
2. Pattern detection implemented but not fully integrated
3. No session memory beyond conversation history
4. Missing collaborative filtering across users

---

## Optimization Strategy

### Phase 1: Quick Wins (Week 1-2) 🚀

**Priority:** P0 - Critical  
**Impact:** High  
**Effort:** Low-Medium  
**Expected Result:** 2-3x performance improvement

#### 1.1 Context Caching Layer

**Implementation:**
```typescript
// src/lib/cache.ts - Create new utility
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getCachedContext(key: string) {
  return await redis.get(key);
}

export async function setCachedContext(key: string, data: any, ttl: number) {
  return await redis.setex(key, ttl, JSON.stringify(data));
}
```

**What to cache:**
- CRM summaries (TTL: 5 mins) - key: `context:crm:{workspaceId}`
- Calendar events (TTL: 2 mins) - key: `context:calendar:{workspaceId}`
- Workspace intelligence (TTL: 1 hour) - key: `context:workspace:{workspaceId}`
- User preferences (TTL: 15 mins) - key: `context:prefs:{workspaceId}:{userId}`

**Target:** 60% reduction in DB queries for repeat context fetches

#### 1.2 Query Optimization

**Database Indexes:**
```sql
-- drizzle/migrations/XXXX_add_neptune_indexes.sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_messages_workspace_user_created 
ON ai_messages (workspace_id, user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ai_conversations_workspace_user_updated
ON ai_conversations (workspace_id, user_id, last_message_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_knowledge_items_workspace_status
ON knowledge_items (workspace_id, status) WHERE status = 'ready';
```

**Code Changes:**
- Reduce message fetch limit from 100 to 30 in `src/app/api/neptune/conversation/route.ts`
- Implement cursor-based pagination for conversations
- Add `EXPLAIN ANALYZE` logging for queries >500ms

**Target:** 40% faster context gathering

#### 1.3 Smart Context Pruning

**Relevance Scoring:**
```typescript
// src/lib/ai/context-pruning.ts
interface ContextItem {
  type: 'crm' | 'calendar' | 'task' | 'agent';
  data: any;
  relevanceScore: number;
}

export function scoreContextRelevance(item: ContextItem, query: string): number {
  // Priority weights
  const weights = {
    hotLead: 10,
    overdueTask: 9,
    todayEvent: 8,
    recentConversation: 7,
    general: 3,
  };
  
  // Implement scoring logic based on query keywords and time sensitivity
  // Return 0-10 score
}

export function pruneContext(items: ContextItem[], maxTokens: number): ContextItem[] {
  // Sort by relevance, fit within token budget
  // Only include full details for top 5 items, summaries for rest
}
```

**Target:** 50% token savings while maintaining accuracy

**Files to Modify:**
- `src/lib/ai/context.ts` - Add caching layer
- `src/lib/ai/system-prompt.ts` - Dynamic context selection
- `drizzle/migrations/` - New indexes
- `src/lib/cache.ts` - New Redis cache utilities

---

### Phase 2: RAG Enhancement (Week 3-4) 🔍

**Priority:** P1 - High  
**Impact:** High  
**Effort:** Medium  
**Expected Result:** 35-40% improvement in retrieval accuracy

#### 2.1 Hybrid Search Implementation

**Combine vector similarity (70%) + BM25 keyword (30%)**

```typescript
// src/lib/ai/rag.ts - Enhance searchKnowledgeBase
async function hybridSearch(query: string, workspaceId: string) {
  // Run in parallel
  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(query, workspaceId),
    keywordSearch(query, workspaceId),
  ]);
  
  // Reciprocal rank fusion
  return fuseResults(vectorResults, keywordResults);
}
```

**Query Expansion:**
```typescript
async function expandQuery(query: string): Promise<string[]> {
  // Use GPT-4o-mini to generate query variations
  const variations = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'system',
      content: 'Generate 3 search query variations for better information retrieval.'
    }, {
      role: 'user',
      content: query
    }],
    max_tokens: 100,
  });
  
  return parseVariations(variations);
}
```

**Target:** 35% improvement in retrieval accuracy

#### 2.2 Intelligent Chunking

**Semantic Chunking:**
```typescript
// src/lib/vector.ts - Add semantic chunking
export function semanticChunk(text: string, maxChunkSize = 500): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const chunks: string[] = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > maxChunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}
```

**Store Chunk Metadata:**
- Add `chunkIndex`, `chunkTotal`, `parentDocumentId` to vector metadata
- Enable context reconstruction from adjacent chunks

**Target:** 25% better context relevance

#### 2.3 Reranking Layer

**Cross-Encoder Reranking:**
```typescript
// Option 1: Use OpenAI for reranking
async function rerankResults(query: string, results: RAGResult[]) {
  const scores = await Promise.all(
    results.map(async (result) => {
      const score = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: `Query: ${query}\nDocument: ${result.content}`,
      });
      return { ...result, rerankScore: score };
    })
  );
  
  return scores.sort((a, b) => b.rerankScore - a.rerankScore).slice(0, 5);
}

// Option 2: Use Cohere (if needed later)
// const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
// const reranked = await cohere.rerank({...});
```

**Target:** 40% precision improvement

**Files to Modify:**
- `src/lib/ai/rag.ts` - Hybrid search, reranking
- `src/lib/vector.ts` - Chunk management
- `src/db/schema.ts` - Add chunk metadata fields

---

### Phase 3: Deep Memory System (Week 5-6) 🧠

**Priority:** P2 - Medium  
**Impact:** Medium-High  
**Effort:** High  
**Expected Result:** Better long-term learning and automation

#### 3.1 Session Memory

**Sliding Window Context:**
```typescript
// src/lib/ai/memory.ts - Add session memory
interface SessionMemory {
  workspaceId: string;
  userId: string;
  conversationId: string;
  entities: Record<string, string>; // Extracted entities
  facts: string[]; // Key facts from conversation
  context: string; // Summarized context
  expiresAt: Date;
}

export async function extractSessionMemory(messages: Message[]): Promise<SessionMemory> {
  // Use GPT-4o to extract entities and facts
  // Store in Redis with TTL
}
```

**Auto-Summarization:**
- After every 10 message pairs, summarize conversation
- Store summary, clear old messages
- Keep full detail for last 10 turns only

**Target:** Better follow-up question handling

#### 3.2 Pattern Recognition

**Workflow Detection:**
```typescript
// src/lib/ai/patterns.ts - Enhanced pattern detection
export async function detectWorkflowPatterns(
  workspaceId: string,
  userId: string
): Promise<Pattern[]> {
  const actionHistory = await getActionHistory(workspaceId, userId);
  
  // Find sequences that repeat 3+ times
  const patterns = findRepeatingSequences(actionHistory);
  
  // Suggest automation for patterns
  return patterns.map(p => ({
    ...p,
    suggestion: generateAutomationSuggestion(p),
  }));
}
```

**Optimal Timing Learning:**
- Track when users typically perform actions
- Suggest follow-ups at learned times
- Learn from acceptance/rejection patterns

**Target:** 30% increase in automation suggestions

#### 3.3 Cross-User Intelligence

**Anonymized Pattern Aggregation:**
```typescript
// src/lib/ai/intelligence.ts
export async function aggregateWorkspacePatterns(workspaceId: string) {
  // Aggregate patterns across all users in workspace
  // Identify best practices from successful users
  // Recommend improvements based on peer performance
  
  // IMPORTANT: Respect privacy - no PII in aggregates
}
```

**Target:** Proactive suggestions 2x more relevant

**Files to Modify:**
- `src/lib/ai/memory.ts` - Session memory, pattern detection
- `src/db/schema.ts` - Add `sessionMemory` table
- `src/lib/ai/patterns.ts` - Enhanced pattern matching

---

### Phase 4: Performance Monitoring (Week 7) 📊

**Priority:** P1 - High  
**Impact:** Medium  
**Effort:** Medium  
**Expected Result:** Full observability and continuous optimization

#### 4.1 Observability Layer

**OpenTelemetry Integration:**
```typescript
// src/lib/observability.ts
import { trace } from '@opentelemetry/api';

export const tracer = trace.getTracer('neptune-ai');

// Wrap key operations
export async function tracedContextGather(workspaceId: string) {
  return await tracer.startActiveSpan('context.gather', async (span) => {
    const startTime = Date.now();
    
    try {
      const context = await gatherAIContext(workspaceId);
      span.setAttribute('context.size', JSON.stringify(context).length);
      span.setAttribute('duration.ms', Date.now() - startTime);
      return context;
    } finally {
      span.end();
    }
  });
}
```

**Metrics to Track:**
- Response time (p50, p95, p99)
- Context fetch time
- Cache hit rate
- Token usage per query
- RAG accuracy (user feedback)

**Alerts:**
- Response time >5s for 5 consecutive requests
- Cache hit rate <50%
- Error rate >5%

#### 4.2 Performance Metrics Dashboard

**Create Admin API:**
```typescript
// src/app/api/admin/metrics/route.ts
export async function GET() {
  const metrics = {
    performance: {
      avgResponseTime: await calculateAvgResponseTime(),
      cacheHitRate: await getCacheHitRate(),
      tokenEfficiency: await calculateTokenEfficiency(),
    },
    intelligence: {
      ragAccuracy: await calculateRAGAccuracy(),
      proactiveInsightAcceptance: await getInsightAcceptanceRate(),
      automationUsage: await getAutomationUsageRate(),
    },
  };
  
  return Response.json(metrics);
}
```

**Files to Create:**
- `src/lib/observability.ts` - OpenTelemetry setup
- `src/lib/metrics.ts` - Custom metrics
- `src/app/api/admin/metrics/route.ts` - Metrics API
- `src/components/admin/MetricsDashboard.tsx` - UI dashboard

---

## Implementation Priority Matrix

| Task | Impact | Effort | Priority |
|------|--------|--------|----------|
| Context Caching | High | Low | 🔴 P0 |
| Query Optimization | High | Low | 🔴 P0 |
| Smart Context Pruning | High | Medium | 🔴 P0 |
| Hybrid Search | High | Medium | 🟡 P1 |
| Intelligent Chunking | Medium | Medium | 🟡 P1 |
| Reranking Layer | Medium | Medium | 🟡 P1 |
| Session Memory | Medium | High | 🟢 P2 |
| Pattern Recognition | Medium | High | 🟢 P2 |
| Cross-User Intelligence | Low | High | 🟢 P2 |
| Observability | Medium | Medium | 🟡 P1 |

---

## Success Metrics

### Performance Targets
- **Response Time**: <2s average (currently ~4-6s estimated)
- **Context Fetch**: <500ms (currently ~2s estimated)
- **Cache Hit Rate**: >70%
- **Token Efficiency**: 30% reduction without accuracy loss

### Intelligence Targets
- **RAG Accuracy**: 80% user satisfaction (measure via feedback)
- **Proactive Insights**: 2x acceptance rate
- **Automation Suggestions**: 3x usage
- **Context Relevance**: 90% of included context used by AI

---

## Safety Considerations

### Database Changes
- All migrations reversible with rollback scripts
- Test migrations on staging first
- Use `IF NOT EXISTS` for index creation
- Monitor query performance post-migration

### Caching Strategy
- Conservative TTLs to start (5-60 mins)
- Cache invalidation on data mutations
- Fallback to DB if cache unavailable
- Monitor stale data issues

### Memory & Context
- Respect user privacy (no cross-tenant leaks)
- GDPR-compliant data retention
- Clear user consent for pattern learning
- Allow opt-out of intelligence features

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Cache inconsistency | Aggressive invalidation + TTLs |
| DB performance regression | A/B test with 10% traffic |
| Increased costs (Redis, embeddings) | Monitor spend, implement quotas |
| Context token explosion | Hard limit at 8K tokens |
| RAG hallucination | Strong citation requirements |

---

## Rollout Plan

### Week 1-2: Foundation
- Deploy cache layer with monitoring
- Apply query optimizations
- Implement context pruning
- **Validation**: Run load tests, monitor metrics

### Week 3-4: RAG Upgrade
- Deploy hybrid search behind feature flag
- A/B test with 20% of queries
- Monitor accuracy improvement
- Roll out if metrics improve by >20%

### Week 5-6: Memory Enhancement
- Deploy session memory for new conversations
- Monitor memory usage and performance
- Tune pattern recognition thresholds
- Gradual rollout to all users

### Week 7: Stabilization
- Full observability deployment
- Performance tuning based on metrics
- Documentation updates
- Team training on new features

---

## Next Steps

1. **Approve plan** - Review and sign off on approach
2. **Setup monitoring** - Enable Sentry performance monitoring
3. **Create tickets** - Break down into Linear/Jira tasks
4. **Assign ownership** - Backend, AI teams
5. **Begin Phase 1** - Context caching and query optimization

---

## Estimated Timeline

- **Phase 1**: 2 weeks (Quick Wins)
- **Phase 2**: 2 weeks (RAG Enhancement)
- **Phase 3**: 2 weeks (Deep Memory)
- **Phase 4**: 1 week (Monitoring)
- **Total**: 7 weeks for complete implementation
- **Reduced Scope (P0 only)**: 2 weeks for core optimizations

---

## External Services Status ✅

### Already Configured (No Setup Needed)

✅ **Upstash Redis** - Already configured for caching
- URL: `UPSTASH_REDIS_REST_URL` (configured)
- Token: `UPSTASH_REDIS_REST_TOKEN` (configured)

✅ **Upstash Vector** - Already configured for embeddings
- URL: `UPSTASH_VECTOR_REST_URL` (configured)
- Token: `UPSTASH_VECTOR_REST_TOKEN` (configured)

✅ **Neon PostgreSQL** - Database configured via Vercel
- URL: `DATABASE_URL` (configured with connection pooling)

✅ **OpenAI API** - For LLM and embeddings
- Key: `OPENAI_API_KEY` (configured)

✅ **Trigger.dev** - For background jobs
- Key: `TRIGGER_SECRET_KEY` (configured)

✅ **Pusher** - For real-time updates
- Configured with app ID, key, secret

✅ **Sentry** - For error monitoring
- DSN: `NEXT_PUBLIC_SENTRY_DSN` (configured)

✅ **Vercel Blob** - For file storage
- Token: `BLOB_READ_WRITE_TOKEN` (configured)

### Optional Additions (Only if needed)

⚠️ **OpenTelemetry** - For detailed tracing (can use Sentry instead)
⚠️ **Cohere API** - For reranking (can use OpenAI alternative)

### Zero Additional Infrastructure Required! 🎉

All required services are already configured. The optimization plan can be implemented using existing infrastructure.

---

## Implementation Dependencies

- Staging environment for testing (existing Vercel preview)
- Load testing tools (k6 or Artillery - free/open source)
- Team availability (1 senior eng + 1 mid-level)
- No new paid services needed

---

## Related Documentation

- Architecture: `docs/architecture/`
- Current Status: `docs/status/`
- Other Plans: `docs/plans/`
- Testing: `docs/testing/`

---

## Changelog

- **2024-12-11**: Initial plan created with full architecture analysis
- **2024-12-11**: Confirmed all infrastructure already configured
- **2024-12-11**: Added kickoff instructions for new agents

---

## Questions or Issues?

If you're implementing this plan and run into issues:

1. Check existing implementations in `src/lib/ai/`
2. Review database schema in `src/db/schema.ts`
3. Test changes on staging before production
4. Monitor metrics in Sentry dashboard
5. Update this document with learnings

**Remember:** The goal is 2-3x performance improvement with zero new infrastructure. Start with Phase 1 (caching + indexes) for immediate wins!
