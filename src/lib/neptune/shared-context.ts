/**
 * Neptune Shared Context System
 * 
 * Enables Neptune to reference past conversations naturally:
 * - "Remember when we discussed the marketing strategy..."
 * - "Building on our earlier idea about..."
 * - "This connects to what we decided about..."
 * 
 * This creates the feeling of working with a partner who truly
 * remembers your shared journey together.
 */

import { db } from '@/lib/db';
import { aiConversations, aiMessages } from '@/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { getOpenAI } from '@/lib/ai-providers';
import { getCache, setCache } from '@/lib/cache';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * A memorable moment from past conversations
 */
export interface SharedMemory {
  id: string;
  type: 'decision' | 'idea' | 'plan' | 'insight' | 'commitment' | 'preference';
  title: string;
  content: string;
  context: string;
  conversationId: string;
  conversationTitle: string;
  timestamp: Date;
  importance: number; // 1-10
  relatedTopics: string[];
}

/**
 * Context that can be referenced in conversation
 */
export interface ReferenceableContext {
  // Recent decisions we made together
  decisions: SharedMemory[];
  
  // Ideas we brainstormed
  ideas: SharedMemory[];
  
  // Plans we outlined
  plans: SharedMemory[];
  
  // Commitments or next steps
  commitments: SharedMemory[];
  
  // User preferences learned
  preferences: SharedMemory[];
  
  // Business insights discovered
  insights: SharedMemory[];
}

/**
 * Conversation summary for context building
 */
export interface ConversationSummaryItem {
  conversationId: string;
  title: string;
  summary: string;
  topics: string[];
  decisions: string[];
  nextSteps: string[];
  timestamp: Date;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  CACHE_PREFIX: 'neptune:shared-context',
  CACHE_TTL: 30 * 60, // 30 minutes
  MAX_MEMORIES_PER_TYPE: 10,
  LOOKBACK_DAYS: 30, // How far back to look for shared context
  MIN_CONVERSATION_LENGTH: 4, // Minimum messages for meaningful analysis
};

// ============================================================================
// CACHE HELPERS
// ============================================================================

function getCacheKey(workspaceId: string, userId: string): string {
  return `${CONFIG.CACHE_PREFIX}:${workspaceId}:${userId}`;
}

// ============================================================================
// MEMORY EXTRACTION
// ============================================================================

/**
 * Extract memorable moments from a conversation
 */
async function extractMemoriesFromConversation(
  conversationId: string,
  conversationTitle: string,
  messages: Array<{ role: string; content: string; createdAt: Date }>
): Promise<SharedMemory[]> {
  if (messages.length < CONFIG.MIN_CONVERSATION_LENGTH) {
    return [];
  }
  
  try {
    const openai = getOpenAI();
    
    const conversationText = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Analyze this conversation between a user and Neptune (AI assistant) and extract memorable moments that should be referenced in future conversations.

Extract only significant items - things that represent shared understanding, commitments, or important context.

Output JSON:
{
  "memories": [
    {
      "type": "decision" | "idea" | "plan" | "insight" | "commitment" | "preference",
      "title": "Brief title (5-10 words)",
      "content": "What was decided/discussed (1-2 sentences)",
      "context": "Why this matters (1 sentence)",
      "importance": 1-10,
      "relatedTopics": ["topic1", "topic2"]
    }
  ]
}

Types explained:
- decision: Something the user decided to do
- idea: A brainstormed concept or approach
- plan: A strategy or roadmap discussed
- insight: A realization or discovery about their business
- commitment: A next step or action item
- preference: A user preference learned

Only include truly significant memories. Output valid JSON only.`,
        },
        {
          role: 'user',
          content: conversationText.slice(0, 8000),
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });
    
    const responseText = response.choices[0]?.message?.content || '{"memories":[]}';
    
    try {
      const parsed = JSON.parse(responseText) as { 
        memories: Array<{
          type: SharedMemory['type'];
          title: string;
          content: string;
          context: string;
          importance: number;
          relatedTopics: string[];
        }> 
      };
      
      const lastMessageTime = messages[messages.length - 1]?.createdAt || new Date();
      
      return parsed.memories.map((m, i) => ({
        id: `${conversationId}-mem-${i}`,
        type: m.type,
        title: m.title,
        content: m.content,
        context: m.context,
        conversationId,
        conversationTitle,
        timestamp: lastMessageTime,
        importance: m.importance,
        relatedTopics: m.relatedTopics || [],
      }));
    } catch {
      logger.debug('[SharedContext] Failed to parse memories JSON');
      return [];
    }
  } catch (error) {
    logger.error('[SharedContext] Failed to extract memories', { conversationId, error });
    return [];
  }
}

/**
 * Summarize a conversation for quick reference
 */
async function summarizeConversation(
  conversationId: string,
  conversationTitle: string,
  messages: Array<{ role: string; content: string; createdAt: Date }>
): Promise<ConversationSummaryItem | null> {
  if (messages.length < CONFIG.MIN_CONVERSATION_LENGTH) {
    return null;
  }
  
  try {
    const openai = getOpenAI();
    
    const conversationText = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n\n');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Summarize this conversation in a way that helps Neptune reference it in future conversations.

Output JSON:
{
  "summary": "2-3 sentence summary of what was discussed and accomplished",
  "topics": ["main topic 1", "main topic 2"],
  "decisions": ["Decision 1 made", "Decision 2 made"],
  "nextSteps": ["Next step discussed", "Action item mentioned"]
}

Be concise but capture the essence. Output valid JSON only.`,
        },
        {
          role: 'user',
          content: conversationText.slice(0, 6000),
        },
      ],
      temperature: 0.3,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    });
    
    const responseText = response.choices[0]?.message?.content || '{}';
    
    try {
      const parsed = JSON.parse(responseText) as {
        summary: string;
        topics: string[];
        decisions: string[];
        nextSteps: string[];
      };
      
      return {
        conversationId,
        title: conversationTitle,
        summary: parsed.summary || '',
        topics: parsed.topics || [],
        decisions: parsed.decisions || [],
        nextSteps: parsed.nextSteps || [],
        timestamp: messages[messages.length - 1]?.createdAt || new Date(),
      };
    } catch {
      return null;
    }
  } catch (error) {
    logger.error('[SharedContext] Failed to summarize conversation', { conversationId, error });
    return null;
  }
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Build referenceable context from past conversations
 * 
 * This is what enables Neptune to say things like:
 * "Remember when we discussed the Q4 marketing strategy..."
 */
export async function buildSharedContext(
  workspaceId: string,
  userId: string
): Promise<ReferenceableContext> {
  // Check cache first
  const cacheKey = getCacheKey(workspaceId, userId);
  const cached = await getCache<ReferenceableContext>(cacheKey, { 
    prefix: '', 
    ttl: CONFIG.CACHE_TTL 
  });
  
  if (cached) {
    logger.debug('[SharedContext] Returning cached context');
    return cached;
  }
  
  logger.info('[SharedContext] Building shared context', { workspaceId, userId });
  
  const lookbackDate = new Date(Date.now() - CONFIG.LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  
  // Get recent conversations
  const recentConversations = await db.query.aiConversations.findMany({
    where: and(
      eq(aiConversations.workspaceId, workspaceId),
      eq(aiConversations.userId, userId),
      gte(aiConversations.createdAt, lookbackDate)
    ),
    orderBy: [desc(aiConversations.lastMessageAt)],
    limit: 20,
  });
  
  if (recentConversations.length === 0) {
    const emptyContext: ReferenceableContext = {
      decisions: [],
      ideas: [],
      plans: [],
      commitments: [],
      preferences: [],
      insights: [],
    };
    return emptyContext;
  }
  
  // Collect memories from each conversation
  const allMemories: SharedMemory[] = [];
  
  for (const conv of recentConversations.slice(0, 10)) {
    const messages = await db.query.aiMessages.findMany({
      where: eq(aiMessages.conversationId, conv.id),
      orderBy: [aiMessages.createdAt],
    });
    
    const memoriesFromConv = await extractMemoriesFromConversation(
      conv.id,
      conv.title,
      messages.map(m => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      }))
    );
    
    allMemories.push(...memoriesFromConv);
  }
  
  // Organize by type and sort by importance
  const context: ReferenceableContext = {
    decisions: [],
    ideas: [],
    plans: [],
    commitments: [],
    preferences: [],
    insights: [],
  };
  
  for (const memory of allMemories) {
    const typeKey = `${memory.type}s` as keyof ReferenceableContext;
    if (context[typeKey]) {
      context[typeKey].push(memory);
    }
  }
  
  // Sort each type by importance and limit
  for (const key of Object.keys(context) as (keyof ReferenceableContext)[]) {
    context[key] = context[key]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, CONFIG.MAX_MEMORIES_PER_TYPE);
  }
  
  // Cache the result
  await setCache(cacheKey, context, { prefix: '', ttl: CONFIG.CACHE_TTL });
  
  logger.info('[SharedContext] Built shared context', {
    workspaceId,
    userId,
    totalMemories: allMemories.length,
    decisions: context.decisions.length,
    ideas: context.ideas.length,
    plans: context.plans.length,
  });
  
  return context;
}

/**
 * Find memories relevant to a current query
 */
export async function findRelevantMemories(
  workspaceId: string,
  userId: string,
  currentQuery: string,
  limit = 3
): Promise<SharedMemory[]> {
  const context = await buildSharedContext(workspaceId, userId);
  
  if (!currentQuery || currentQuery.length < 5) {
    // Return most important recent memories
    const allMemories = [
      ...context.decisions,
      ...context.commitments,
      ...context.plans,
    ];
    return allMemories
      .sort((a, b) => b.importance - a.importance)
      .slice(0, limit);
  }
  
  // Simple keyword matching for relevance
  const queryWords = currentQuery.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const allMemories = [
    ...context.decisions,
    ...context.ideas,
    ...context.plans,
    ...context.commitments,
    ...context.insights,
  ];
  
  const scoredMemories = allMemories.map(memory => {
    const searchText = `${memory.title} ${memory.content} ${memory.relatedTopics.join(' ')}`.toLowerCase();
    const matchCount = queryWords.filter(word => searchText.includes(word)).length;
    return { memory, score: matchCount + (memory.importance / 10) };
  });
  
  return scoredMemories
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(m => m.memory);
}

/**
 * Get recent conversation summaries for context
 */
export async function getRecentConversationSummaries(
  workspaceId: string,
  userId: string,
  limit = 5
): Promise<ConversationSummaryItem[]> {
  const lookbackDate = new Date(Date.now() - CONFIG.LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  
  const recentConversations = await db.query.aiConversations.findMany({
    where: and(
      eq(aiConversations.workspaceId, workspaceId),
      eq(aiConversations.userId, userId),
      gte(aiConversations.createdAt, lookbackDate)
    ),
    orderBy: [desc(aiConversations.lastMessageAt)],
    limit,
  });
  
  const summaries: ConversationSummaryItem[] = [];
  
  for (const conv of recentConversations) {
    const messages = await db.query.aiMessages.findMany({
      where: eq(aiMessages.conversationId, conv.id),
      orderBy: [aiMessages.createdAt],
    });
    
    const summary = await summarizeConversation(
      conv.id,
      conv.title,
      messages.map(m => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      }))
    );
    
    if (summary) {
      summaries.push(summary);
    }
  }
  
  return summaries;
}

/**
 * Build a prompt section for shared context
 * This gets injected into the system prompt
 */
export async function buildSharedContextPrompt(
  workspaceId: string,
  userId: string,
  currentQuery?: string
): Promise<string> {
  const context = await buildSharedContext(workspaceId, userId);
  
  // Check if there's meaningful shared context
  const hasContext = 
    context.decisions.length > 0 ||
    context.plans.length > 0 ||
    context.commitments.length > 0;
  
  if (!hasContext) {
    return '';
  }
  
  const parts: string[] = [];
  parts.push('## SHARED HISTORY (Reference naturally using "we" language)');
  
  // Recent decisions
  if (context.decisions.length > 0) {
    parts.push(`\n**Decisions we've made together:**`);
    for (const decision of context.decisions.slice(0, 3)) {
      const timeAgo = getTimeAgo(decision.timestamp);
      parts.push(`- ${decision.title}: ${decision.content} (${timeAgo})`);
    }
  }
  
  // Active plans
  if (context.plans.length > 0) {
    parts.push(`\n**Plans we're working on:**`);
    for (const plan of context.plans.slice(0, 2)) {
      parts.push(`- ${plan.title}: ${plan.content}`);
    }
  }
  
  // Open commitments
  if (context.commitments.length > 0) {
    parts.push(`\n**Open action items:**`);
    for (const commitment of context.commitments.slice(0, 3)) {
      parts.push(`- ${commitment.content}`);
    }
  }
  
  // Find relevant memories if there's a current query
  if (currentQuery) {
    const relevant = await findRelevantMemories(workspaceId, userId, currentQuery, 2);
    if (relevant.length > 0 && !context.decisions.includes(relevant[0])) {
      parts.push(`\n**Relevant to current topic:**`);
      for (const memory of relevant) {
        parts.push(`- From "${memory.conversationTitle}": ${memory.content}`);
      }
    }
  }
  
  parts.push(`\n**How to use this context:**
- Reference naturally: "Building on our decision about..."
- Connect dots: "This ties back to the marketing plan we discussed..."
- Follow up: "How's the [commitment] going?"
- Don't force references - only mention if genuinely relevant`);
  
  return parts.join('\n');
}

/**
 * Record a new shared memory from the current conversation
 * Call this when something significant happens (decision made, plan outlined, etc.)
 */
export async function recordSharedMemory(
  workspaceId: string,
  userId: string,
  memory: Omit<SharedMemory, 'id' | 'timestamp'>
): Promise<void> {
  try {
    // Invalidate cache so new memory is picked up
    const cacheKey = getCacheKey(workspaceId, userId);
    await setCache(cacheKey, null, { prefix: '', ttl: 1 });
    
    // Note: In production, you might want to persist this to a database table
    // For now, the cache invalidation will cause a rebuild that picks up
    // the new conversation content
    
    logger.info('[SharedContext] Recorded new memory', {
      workspaceId,
      userId,
      type: memory.type,
      title: memory.title,
    });
  } catch (error) {
    logger.error('[SharedContext] Failed to record memory', { error });
  }
}

/**
 * Clear shared context cache (for testing or reset)
 */
export async function clearSharedContext(
  workspaceId: string,
  userId: string
): Promise<void> {
  const cacheKey = getCacheKey(workspaceId, userId);
  await setCache(cacheKey, null, { prefix: '', ttl: 1 });
  logger.info('[SharedContext] Cleared shared context', { workspaceId, userId });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return 'last week';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

// Types are already exported via export interface above
