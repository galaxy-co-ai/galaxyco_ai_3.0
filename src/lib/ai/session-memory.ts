/**
 * Session Memory System (Phase 3)
 * 
 * Maintains short-term conversational context with:
 * - Entity extraction and tracking
 * - Key facts from conversation
 * - Auto-summarization after N turns
 * - Sliding window for recent messages
 * - Redis-backed caching with TTL
 * 
 * Expected improvements:
 * - Better follow-up question handling
 * - Coherent multi-turn conversations
 * - Reduced context token usage
 */

import { logger } from '@/lib/logger';
import { getOpenAI } from '@/lib/ai-providers';
import { getCache, setCache } from '@/lib/cache';

// ============================================================================
// TYPES
// ============================================================================

export interface ExtractedEntity {
  type: 'person' | 'company' | 'product' | 'date' | 'amount' | 'task' | 'project' | 'contact' | 'other';
  value: string;
  context: string;
  confidence: number;
  firstMentioned: Date;
  lastMentioned: Date;
  mentionCount: number;
}

export interface ConversationFact {
  fact: string;
  category: 'decision' | 'action' | 'preference' | 'context' | 'goal' | 'constraint';
  confidence: number;
  messageIndex: number;
  timestamp: Date;
}

export interface SessionMemory {
  workspaceId: string;
  userId: string;
  conversationId: string;
  
  // Extracted data
  entities: ExtractedEntity[];
  facts: ConversationFact[];
  
  // Context tracking
  currentTopic: string | null;
  topicHistory: string[];
  
  // Summarization
  summaryUpToMessage: number;
  summary: string | null;
  
  // Window tracking
  totalMessages: number;
  windowStart: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: Date;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Session memory settings (Phase 2B: Increased window size)
  SESSION_TTL_HOURS: 4,           // Session expires after 4 hours of inactivity
  WINDOW_SIZE: 50,                // Keep last 50 messages in full detail (increased from 10)
  SUMMARIZE_THRESHOLD: 20,        // Summarize after 20 messages
  MAX_ENTITIES: 50,               // Max entities to track per session
  MAX_FACTS: 30,                  // Max facts to track per session
  
  // Cache keys
  CACHE_PREFIX: 'session',
  CACHE_TTL: 4 * 60 * 60,         // 4 hours in seconds
};

// ============================================================================
// CACHE HELPERS
// ============================================================================

function getSessionCacheKey(conversationId: string): string {
  return `${CONFIG.CACHE_PREFIX}:memory:${conversationId}`;
}

/**
 * Get session memory from cache
 */
export async function getSessionMemory(
  conversationId: string
): Promise<SessionMemory | null> {
  try {
    const cached = await getCache<SessionMemory>(
      getSessionCacheKey(conversationId),
      { prefix: '', ttl: CONFIG.CACHE_TTL }
    );
    
    if (cached && new Date(cached.expiresAt) > new Date()) {
      return cached;
    }
    
    return null;
  } catch (error) {
    logger.error('[SessionMemory] Failed to get from cache', error);
    return null;
  }
}

/**
 * Save session memory to cache
 */
async function saveSessionMemory(memory: SessionMemory): Promise<void> {
  try {
    await setCache(
      getSessionCacheKey(memory.conversationId),
      memory,
      { prefix: '', ttl: CONFIG.CACHE_TTL }
    );
  } catch (error) {
    logger.error('[SessionMemory] Failed to save to cache', error);
  }
}

// ============================================================================
// ENTITY EXTRACTION
// ============================================================================

/**
 * Extract entities from a message using GPT-4o-mini
 */
async function extractEntities(
  content: string,
  existingEntities: ExtractedEntity[]
): Promise<ExtractedEntity[]> {
  if (content.length < 10) {
    return existingEntities;
  }
  
  try {
    const openai = getOpenAI();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extract named entities from the message. Output JSON array:
[{"type": "person|company|product|date|amount|task|project|contact|other", "value": "entity value", "context": "brief context", "confidence": 0.0-1.0}]

Only include entities with confidence >= 0.7. Output valid JSON array only, no markdown.`,
        },
        {
          role: 'user',
          content: content.slice(0, 2000),
        },
      ],
      max_tokens: 300,
      temperature: 0,
    });
    
    const responseText = response.choices[0]?.message?.content || '[]';
    // Clean response - remove markdown if present
    const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim();
    
    let newEntities: Array<{
      type: ExtractedEntity['type'];
      value: string;
      context: string;
      confidence: number;
    }> = [];
    
    try {
      newEntities = JSON.parse(cleanedResponse);
    } catch {
      logger.debug('[SessionMemory] Failed to parse entities JSON');
      return existingEntities;
    }
    
    const now = new Date();
    const mergedEntities = [...existingEntities];
    
    for (const entity of newEntities) {
      if (entity.confidence < 0.7) continue;
      
      // Check if entity already exists
      const existingIdx = mergedEntities.findIndex(
        e => e.type === entity.type && 
             e.value.toLowerCase() === entity.value.toLowerCase()
      );
      
      if (existingIdx >= 0) {
        // Update existing entity
        mergedEntities[existingIdx].lastMentioned = now;
        mergedEntities[existingIdx].mentionCount++;
        mergedEntities[existingIdx].confidence = Math.max(
          mergedEntities[existingIdx].confidence,
          entity.confidence
        );
      } else {
        // Add new entity
        mergedEntities.push({
          type: entity.type,
          value: entity.value,
          context: entity.context,
          confidence: entity.confidence,
          firstMentioned: now,
          lastMentioned: now,
          mentionCount: 1,
        });
      }
    }
    
    // Keep only top N entities by recency and mention count
    return mergedEntities
      .sort((a, b) => {
        // Sort by mention count first, then by recency
        const countDiff = b.mentionCount - a.mentionCount;
        if (countDiff !== 0) return countDiff;
        return b.lastMentioned.getTime() - a.lastMentioned.getTime();
      })
      .slice(0, CONFIG.MAX_ENTITIES);
  } catch (error) {
    logger.error('[SessionMemory] Entity extraction failed', error);
    return existingEntities;
  }
}

// ============================================================================
// FACT EXTRACTION
// ============================================================================

/**
 * Extract key facts from recent messages
 */
async function extractFacts(
  messages: Message[],
  existingFacts: ConversationFact[],
  startIndex: number
): Promise<ConversationFact[]> {
  if (messages.length < 2) {
    return existingFacts;
  }
  
  try {
    const openai = getOpenAI();
    
    const conversationText = messages
      .map((m, i) => `[${i + startIndex}] ${m.role}: ${m.content}`)
      .join('\n');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extract key facts from this conversation segment. Output JSON array:
[{"fact": "concise fact statement", "category": "decision|action|preference|context|goal|constraint", "confidence": 0.0-1.0, "messageIndex": number}]

Focus on:
- Decisions made
- Actions taken or planned
- User preferences expressed
- Important context
- Goals mentioned
- Constraints or requirements

Only include facts with confidence >= 0.7. Output valid JSON array only, no markdown.`,
        },
        {
          role: 'user',
          content: conversationText.slice(0, 3000),
        },
      ],
      max_tokens: 400,
      temperature: 0,
    });
    
    const responseText = response.choices[0]?.message?.content || '[]';
    const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim();
    
    let newFacts: Array<{
      fact: string;
      category: ConversationFact['category'];
      confidence: number;
      messageIndex: number;
    }> = [];
    
    try {
      newFacts = JSON.parse(cleanedResponse);
    } catch {
      logger.debug('[SessionMemory] Failed to parse facts JSON');
      return existingFacts;
    }
    
    const now = new Date();
    const mergedFacts = [...existingFacts];
    
    for (const fact of newFacts) {
      if (fact.confidence < 0.7) continue;
      
      // Check for duplicate facts (simple similarity check)
      const isDuplicate = mergedFacts.some(
        f => f.fact.toLowerCase().includes(fact.fact.toLowerCase().slice(0, 30)) ||
             fact.fact.toLowerCase().includes(f.fact.toLowerCase().slice(0, 30))
      );
      
      if (!isDuplicate) {
        mergedFacts.push({
          fact: fact.fact,
          category: fact.category,
          confidence: fact.confidence,
          messageIndex: fact.messageIndex,
          timestamp: now,
        });
      }
    }
    
    // Keep only most recent/relevant facts
    return mergedFacts
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, CONFIG.MAX_FACTS);
  } catch (error) {
    logger.error('[SessionMemory] Fact extraction failed', error);
    return existingFacts;
  }
}

// ============================================================================
// TOPIC DETECTION
// ============================================================================

/**
 * Detect current conversation topic
 */
async function detectTopic(
  messages: Message[],
  previousTopic: string | null
): Promise<string | null> {
  if (messages.length === 0) {
    return previousTopic;
  }
  
  try {
    const openai = getOpenAI();
    
    const recentContent = messages
      .slice(-5)
      .map(m => m.content)
      .join('\n');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Identify the main topic of this conversation segment in 2-5 words.
Examples: "CRM lead management", "Marketing campaign planning", "Calendar scheduling"
Output ONLY the topic phrase, nothing else.`,
        },
        {
          role: 'user',
          content: recentContent.slice(0, 1000),
        },
      ],
      max_tokens: 20,
      temperature: 0,
    });
    
    const topic = response.choices[0]?.message?.content?.trim() || null;
    return topic;
  } catch (error) {
    logger.error('[SessionMemory] Topic detection failed', error);
    return previousTopic;
  }
}

// ============================================================================
// SUMMARIZATION
// ============================================================================

/**
 * Summarize older messages to reduce context size
 */
async function summarizeMessages(
  messages: Message[],
  existingSummary: string | null
): Promise<string> {
  if (messages.length === 0) {
    return existingSummary || '';
  }
  
  try {
    const openai = getOpenAI();
    
    const conversationText = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');
    
    const prompt = existingSummary
      ? `Previous context summary:\n${existingSummary}\n\nNew conversation to incorporate:\n${conversationText}`
      : conversationText;
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Summarize this conversation concisely. Include:
- Main topics discussed
- Key decisions or actions
- Important context for future reference
- Any unresolved questions or tasks

Keep summary under 200 words. Focus on information useful for continuing the conversation.`,
        },
        {
          role: 'user',
          content: prompt.slice(0, 4000),
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });
    
    return response.choices[0]?.message?.content || existingSummary || '';
  } catch (error) {
    logger.error('[SessionMemory] Summarization failed', error);
    return existingSummary || '';
  }
}

// ============================================================================
// MAIN SESSION MEMORY FUNCTIONS
// ============================================================================

/**
 * Initialize or update session memory for a conversation
 */
export async function initializeSessionMemory(
  workspaceId: string,
  userId: string,
  conversationId: string
): Promise<SessionMemory> {
  // Check for existing session
  const existing = await getSessionMemory(conversationId);
  if (existing) {
    // Extend expiry
    existing.expiresAt = new Date(Date.now() + CONFIG.SESSION_TTL_HOURS * 60 * 60 * 1000);
    existing.updatedAt = new Date();
    await saveSessionMemory(existing);
    return existing;
  }
  
  // Create new session
  const now = new Date();
  const newSession: SessionMemory = {
    workspaceId,
    userId,
    conversationId,
    entities: [],
    facts: [],
    currentTopic: null,
    topicHistory: [],
    summaryUpToMessage: 0,
    summary: null,
    totalMessages: 0,
    windowStart: 0,
    createdAt: now,
    updatedAt: now,
    expiresAt: new Date(now.getTime() + CONFIG.SESSION_TTL_HOURS * 60 * 60 * 1000),
  };
  
  await saveSessionMemory(newSession);
  logger.info('[SessionMemory] Initialized new session', { conversationId });
  
  return newSession;
}

/**
 * Update session memory with new message
 */
export async function updateSessionMemory(
  conversationId: string,
  newMessage: Message,
  allMessages: Message[]
): Promise<SessionMemory | null> {
  const session = await getSessionMemory(conversationId);
  if (!session) {
    logger.warn('[SessionMemory] No session found for update', { conversationId });
    return null;
  }
  
  const now = new Date();
  session.totalMessages = allMessages.length;
  session.updatedAt = now;
  session.expiresAt = new Date(now.getTime() + CONFIG.SESSION_TTL_HOURS * 60 * 60 * 1000);
  
  // Extract entities from new message (user messages only for efficiency)
  if (newMessage.role === 'user') {
    session.entities = await extractEntities(newMessage.content, session.entities);
  }
  
  // Extract facts every few messages
  if (session.totalMessages % 4 === 0 && session.totalMessages > 0) {
    const recentMessages = allMessages.slice(-8);
    session.facts = await extractFacts(recentMessages, session.facts, session.totalMessages - 8);
  }
  
  // Detect topic
  if (session.totalMessages % 3 === 0 || session.totalMessages <= 3) {
    const oldTopic = session.currentTopic;
    session.currentTopic = await detectTopic(allMessages.slice(-5), session.currentTopic);
    
    // Track topic changes
    if (oldTopic && session.currentTopic && oldTopic !== session.currentTopic) {
      session.topicHistory = [...session.topicHistory, oldTopic].slice(-10);
    }
  }
  
  // Summarize if we've accumulated enough messages
  if (session.totalMessages >= CONFIG.SUMMARIZE_THRESHOLD && 
      session.totalMessages - session.summaryUpToMessage >= CONFIG.WINDOW_SIZE) {
    const messagesToSummarize = allMessages.slice(
      session.summaryUpToMessage,
      session.totalMessages - CONFIG.WINDOW_SIZE
    );
    
    session.summary = await summarizeMessages(messagesToSummarize, session.summary);
    session.summaryUpToMessage = session.totalMessages - CONFIG.WINDOW_SIZE;
    session.windowStart = session.summaryUpToMessage;
    
    logger.info('[SessionMemory] Summarized messages', {
      conversationId,
      summarizedCount: messagesToSummarize.length,
    });
  }
  
  await saveSessionMemory(session);
  return session;
}

/**
 * Build context string from session memory for AI prompt
 */
export function buildSessionContext(session: SessionMemory): string {
  const parts: string[] = [];
  
  // Add summary if available
  if (session.summary) {
    parts.push(`## Previous Context Summary\n${session.summary}`);
  }
  
  // Add current topic
  if (session.currentTopic) {
    parts.push(`## Current Topic\n${session.currentTopic}`);
  }
  
  // Add key entities
  if (session.entities.length > 0) {
    const topEntities = session.entities
      .slice(0, 10)
      .map(e => `- ${e.type}: "${e.value}" (${e.context})`)
      .join('\n');
    parts.push(`## Key Entities Mentioned\n${topEntities}`);
  }
  
  // Add recent facts
  if (session.facts.length > 0) {
    const recentFacts = session.facts
      .slice(0, 10)
      .map(f => `- [${f.category}] ${f.fact}`)
      .join('\n');
    parts.push(`## Key Facts\n${recentFacts}`);
  }
  
  if (parts.length === 0) {
    return '';
  }
  
  return `--- SESSION MEMORY ---\n${parts.join('\n\n')}\n--- END SESSION MEMORY ---`;
}

/**
 * Get optimized conversation history with session memory
 * Returns: session context + recent messages within window
 */
export async function getOptimizedConversationContext(
  conversationId: string,
  allMessages: Message[]
): Promise<{
  sessionContext: string;
  recentMessages: Message[];
  tokensSaved: number;
}> {
  const session = await getSessionMemory(conversationId);
  
  if (!session) {
    return {
      sessionContext: '',
      recentMessages: allMessages.slice(-CONFIG.WINDOW_SIZE),
      tokensSaved: 0,
    };
  }
  
  const sessionContext = buildSessionContext(session);
  const recentMessages = allMessages.slice(session.windowStart);
  
  // Estimate tokens saved (rough: 4 chars per token)
  const fullContextTokens = allMessages.reduce((sum, m) => sum + m.content.length / 4, 0);
  const optimizedTokens = sessionContext.length / 4 + recentMessages.reduce((sum, m) => sum + m.content.length / 4, 0);
  const tokensSaved = Math.max(0, Math.round(fullContextTokens - optimizedTokens));
  
  return {
    sessionContext,
    recentMessages,
    tokensSaved,
  };
}

/**
 * Clear session memory (e.g., when conversation ends or resets)
 */
export async function clearSessionMemory(conversationId: string): Promise<void> {
  try {
    // Set empty with short TTL to effectively delete
    await setCache(
      getSessionCacheKey(conversationId),
      { cleared: true },
      { prefix: '', ttl: 1 }
    );
    logger.info('[SessionMemory] Cleared session', { conversationId });
  } catch (error) {
    logger.error('[SessionMemory] Failed to clear session', error);
  }
}

/**
 * Get entities related to a specific query (for context enrichment)
 */
export function getRelevantEntities(
  session: SessionMemory,
  query: string
): ExtractedEntity[] {
  if (!session.entities.length) return [];
  
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  return session.entities.filter(entity => {
    const valueLower = entity.value.toLowerCase();
    const contextLower = entity.context.toLowerCase();
    
    return queryWords.some(word => 
      valueLower.includes(word) || 
      contextLower.includes(word) ||
      word.includes(valueLower)
    );
  });
}

/**
 * Get facts relevant to a query
 */
export function getRelevantFacts(
  session: SessionMemory,
  query: string
): ConversationFact[] {
  if (!session.facts.length) return [];
  
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  return session.facts.filter(fact => {
    const factLower = fact.fact.toLowerCase();
    return queryWords.some(word => factLower.includes(word));
  });
}
