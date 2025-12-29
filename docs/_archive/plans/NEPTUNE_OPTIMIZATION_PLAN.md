# Neptune AI Optimization Plan
**Without Supermemory.ai - Cost-Free Improvements**

**Date:** 2025-12-11  
**Goal:** Faster responses, stronger memory, better agent orchestration  
**Budget:** $0 (use existing infrastructure)

---

## 🎯 Three-Pillar Optimization Strategy

### **1. Faster Responses** ⚡
### **2. Stronger Memory** 🧠
### **3. Better Agent Orchestration** 🤝

---

## ⚡ PILLAR 1: Faster Responses

### **A. Response Streaming (Already Implemented)**
✅ You already have streaming responses via `openai.chat.completions.create({ stream: true })`

**Optimization:**
- Ensure all Neptune endpoints use streaming
- Add progress indicators for tool execution
- Stream tool outputs as they complete

### **B. Parallel Tool Execution**
**Current:** Sequential tool calls  
**Optimized:** Parallel execution when tools don't depend on each other

```typescript
// Instead of:
const result1 = await tool1();
const result2 = await tool2();
const result3 = await tool3();

// Do this:
const [result1, result2, result3] = await Promise.all([
  tool1(),
  tool2(),
  tool3(),
]);
```

**Impact:** 3x faster for independent tools

### **C. Semantic Caching (via Upstash Redis)**
Cache frequently asked questions and their responses:

```typescript
import { redis } from '@/lib/redis';

async function getCachedResponse(query: string, contextHash: string) {
  const cacheKey = `neptune:response:${hash(query + contextHash)}`;
  
  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Generate response
  const response = await generateAIResponse(query);
  
  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(response));
  
  return response;
}
```

**Impact:** <100ms for cached queries vs. 2-5s for LLM calls

### **D. Smaller, Faster Models for Simple Tasks**
Use GPT-4o-mini for simple tasks, GPT-4o for complex ones:

```typescript
function selectModel(task: string): string {
  const complexityScore = analyzeComplexity(task);
  
  if (complexityScore < 5) {
    return 'gpt-4o-mini'; // 60% faster, 80% cheaper
  }
  
  return 'gpt-4o'; // Full power
}
```

**Examples:**
- Simple queries → GPT-4o-mini
- Data formatting → GPT-4o-mini
- Complex reasoning → GPT-4o
- Code generation → GPT-4o

### **E. Preload Context**
Preload user context before LLM call:

```typescript
// Parallel context loading
const [userPrefs, recentConvos, relevantDocs] = await Promise.all([
  db.query.aiUserPreferences.findFirst({ where: eq(...) }),
  db.query.aiConversations.findMany({ limit: 5 }),
  vectorSearch(query, { limit: 3 }),
]);

// Context ready before LLM call
const response = await openai.chat.completions.create({
  messages: [
    { role: 'system', content: buildSystemPrompt(userPrefs) },
    ...formatConversationHistory(recentConvos),
    { role: 'user', content: query },
  ],
});
```

**Impact:** 200-500ms saved

---

## 🧠 PILLAR 2: Stronger Memory

### **A. Add Simple Knowledge Graph**
Add entity relationships without external service:

```typescript
// New table in schema.ts
export const entityRelationships = pgTable('entity_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull(),
  
  // Entities
  fromEntity: text('from_entity').notNull(), // e.g., "Project Alpha"
  toEntity: text('to_entity').notNull(),     // e.g., "Acme Corp"
  
  // Relationship
  relationshipType: text('relationship_type').notNull(), // e.g., "for_client"
  
  // Metadata
  confidence: integer('confidence').default(100), // 0-100
  source: text('source'), // Where this was learned
  lastConfirmedAt: timestamp('last_confirmed_at').defaultNow(),
  
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Auto-Extract Relationships:**
```typescript
async function extractEntitiesAndRelationships(conversationText: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{
      role: 'system',
      content: `Extract entities and relationships from this conversation.
      Return JSON: { entities: [...], relationships: [{ from, to, type }] }`
    }, {
      role: 'user',
      content: conversationText
    }],
    response_format: { type: 'json_object' }
  });
  
  // Store in database
  const { entities, relationships } = JSON.parse(response.choices[0].message.content);
  
  for (const rel of relationships) {
    await db.insert(entityRelationships).values({
      workspaceId,
      fromEntity: rel.from,
      toEntity: rel.to,
      relationshipType: rel.type,
      source: 'conversation',
    });
  }
}
```

**Query Relationships:**
```typescript
async function getRelatedEntities(entity: string, workspaceId: string) {
  return await db.query.entityRelationships.findMany({
    where: and(
      eq(entityRelationships.workspaceId, workspaceId),
      or(
        eq(entityRelationships.fromEntity, entity),
        eq(entityRelationships.toEntity, entity)
      )
    )
  });
}
```

**Cost:** $0 (uses existing infrastructure)

### **B. Conversation Summarization**
Summarize old conversations to reduce token usage:

```typescript
async function summarizeOldConversation(conversationId: string) {
  const messages = await db.query.aiMessages.findMany({
    where: eq(aiMessages.conversationId, conversationId),
    orderBy: [asc(aiMessages.createdAt)],
  });
  
  // Summarize every 10 messages
  if (messages.length > 10) {
    const summary = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cheaper for summaries
      messages: [{
        role: 'system',
        content: 'Summarize this conversation, preserving key facts and decisions.'
      }, {
        role: 'user',
        content: formatMessagesForSummary(messages.slice(0, -5)) // Keep last 5 messages full
      }]
    });
    
    // Store summary
    await db.update(aiConversations)
      .set({ summary: summary.choices[0].message.content })
      .where(eq(aiConversations.id, conversationId));
  }
}
```

**Impact:** Reduce context tokens by 70%, faster responses

### **C. User Intent Classification**
Classify queries to load only relevant context:

```typescript
type Intent = 'crm' | 'content' | 'finance' | 'general' | 'analytics';

async function classifyIntent(query: string): Promise<Intent> {
  // Fast classification with gpt-4o-mini
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'system',
      content: 'Classify this query into: crm, content, finance, general, or analytics. Respond with one word only.'
    }, {
      role: 'user',
      content: query
    }],
    max_tokens: 10,
  });
  
  return response.choices[0].message.content.toLowerCase() as Intent;
}

async function loadContextByIntent(intent: Intent, workspaceId: string) {
  switch (intent) {
    case 'crm':
      return loadCRMContext(workspaceId);
    case 'content':
      return loadContentContext(workspaceId);
    case 'finance':
      return loadFinanceContext(workspaceId);
    // ... etc
  }
}
```

**Impact:** Load only relevant data, faster + cheaper

### **D. Incremental Learning**
Update user preferences automatically:

```typescript
async function updateUserPreferences(userId: string, message: string) {
  // Detect preference statements
  const patterns = [
    /i prefer/i,
    /i like/i,
    /always/i,
    /never/i,
    /make sure to/i,
  ];
  
  if (patterns.some(p => p.test(message))) {
    // Extract preference
    const pref = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: 'Extract user preference from this message. Return JSON: { category, preference, strength: 1-10 }'
      }, {
        role: 'user',
        content: message
      }],
      response_format: { type: 'json_object' }
    });
    
    const { category, preference, strength } = JSON.parse(pref.choices[0].message.content);
    
    // Store in aiUserPreferences
    await db.insert(aiUserPreferences).values({
      userId,
      category,
      preference,
      strength,
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: [aiUserPreferences.userId, aiUserPreferences.category],
      set: { preference, strength, updatedAt: new Date() }
    });
  }
}
```

**Impact:** Neptune learns continuously without manual input

---

## 🤝 PILLAR 3: Better Agent Orchestration

### **A. Agent Specialization**
Create specialized sub-agents for different tasks:

```typescript
const agents = {
  researcher: {
    model: 'gpt-4o',
    systemPrompt: 'You are a research specialist. Find and analyze information.',
    tools: ['web_search', 'document_retrieval'],
  },
  writer: {
    model: 'gpt-4o',
    systemPrompt: 'You are a content writer. Create engaging, well-structured content.',
    tools: ['style_guide', 'grammar_check'],
  },
  analyst: {
    model: 'gpt-4o',
    systemPrompt: 'You are a data analyst. Process and visualize data.',
    tools: ['query_database', 'create_charts'],
  },
};

async function routeToSpecialist(task: string, type: keyof typeof agents) {
  const agent = agents[type];
  
  return await openai.chat.completions.create({
    model: agent.model,
    messages: [{
      role: 'system',
      content: agent.systemPrompt
    }, {
      role: 'user',
      content: task
    }],
    tools: agent.tools,
  });
}
```

### **B. Multi-Agent Collaboration**
Chain agents for complex tasks:

```typescript
async function multiAgentWorkflow(userQuery: string) {
  // Step 1: Researcher gathers info
  const research = await routeToSpecialist(userQuery, 'researcher');
  
  // Step 2: Analyst processes data
  const analysis = await routeToSpecialist(
    `Analyze this research: ${research}`,
    'analyst'
  );
  
  // Step 3: Writer creates final output
  const finalOutput = await routeToSpecialist(
    `Write a summary of: ${analysis}`,
    'writer'
  );
  
  return finalOutput;
}
```

**Impact:** Higher quality outputs, specialized expertise

### **C. Async Task Queue**
Offload long-running tasks:

```typescript
import { Queue } from 'bull';

const neptune Queue = new Queue('neptune-tasks', {
  redis: process.env.UPSTASH_REDIS_REST_URL
});

// Queue a long task
await neptuneQueue.add('complex-analysis', {
  userId,
  workspaceId,
  task: 'Analyze 100 customer records',
});

// Process in background
neptuneQueue.process('complex-analysis', async (job) => {
  const result = await performComplexAnalysis(job.data);
  
  // Notify user when done
  await sendNotification(job.data.userId, 'Analysis complete!');
  
  return result;
});
```

**Impact:** Neptune responds instantly, works in background

### **D. Agent Memory Sharing**
Shared memory for multi-agent collaboration:

```typescript
// Already have: agentSharedMemory table

async function shareMemory(fromAgent: string, toAgent: string, data: any) {
  await db.insert(agentSharedMemory).values({
    workspaceId,
    fromAgentId: fromAgent,
    toAgentId: toAgent,
    memoryType: 'context',
    data,
    expiresAt: new Date(Date.now() + 3600000), // 1 hour
  });
}

async function getSharedMemory(agentId: string) {
  return await db.query.agentSharedMemory.findMany({
    where: and(
      eq(agentSharedMemory.toAgentId, agentId),
      gt(agentSharedMemory.expiresAt, new Date())
    )
  });
}
```

---

## 📊 Implementation Priority

### **High Priority (Week 1)**
1. ✅ Parallel tool execution
2. ✅ Semantic caching (Redis)
3. ✅ Model selection (gpt-4o vs gpt-4o-mini)
4. ✅ Intent classification

### **Medium Priority (Week 2-3)**
5. ✅ Simple knowledge graph
6. ✅ Conversation summarization
7. ✅ Incremental learning
8. ✅ Agent specialization

### **Low Priority (Month 2)**
9. ✅ Async task queue
10. ✅ Multi-agent workflows
11. ✅ Agent memory sharing

---

## 💰 Cost Impact

| Optimization | Cost Change | Speed Impact |
|--------------|-------------|--------------|
| Parallel tools | $0 | 2-3x faster |
| Semantic caching | +$5/mo (Redis) | 10-100x faster (cached) |
| Model selection | -30% | 60% faster (mini) |
| Knowledge graph | $0 | +Memory quality |
| Summarization | -50% tokens | Faster + cheaper |
| Intent classification | +$1/mo | Targeted context |

**Net Impact:** -25% costs, 2-3x faster

---

## 🎯 Success Metrics

Track these KPIs:

1. **Response Time:** Target <2s (p50), <5s (p95)
2. **Cache Hit Rate:** Target >40%
3. **Token Usage:** Target -30% reduction
4. **User Satisfaction:** Track feedback ratings
5. **Memory Accuracy:** Test with known facts

---

## 📝 Implementation Checklist

- [ ] Add entity relationships table to schema
- [ ] Implement parallel tool execution
- [ ] Add Redis semantic caching
- [ ] Implement model selection logic
- [ ] Add intent classification
- [ ] Build knowledge graph extraction
- [ ] Implement conversation summarization
- [ ] Add incremental preference learning
- [ ] Create specialized agent prompts
- [ ] Test multi-agent workflows
- [ ] Set up async task queue (optional)
- [ ] Monitor KPIs in dashboard

---

**Total Cost:** $0-10/month (mostly existing infra)  
**Expected Impact:** 2-3x faster, stronger memory, better orchestration  
**Timeline:** 2-3 weeks for full implementation

---

*Last Updated: 2025-12-11*
