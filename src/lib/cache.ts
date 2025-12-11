import { redis, shouldUseRedis, markRedisHealthy, markRedisUnhealthy } from '@/lib/upstash';
import { logger } from '@/lib/logger';

/**
 * Redis Cache Helper Utilities
 * Provides convenient functions for caching with TTL
 * 
 * Features:
 * - Graceful degradation when Redis is unavailable
 * - Health tracking to avoid spamming logs on failures
 * - Auto-recovery after temporary outages
 * 
 * Neptune Context Cache Keys:
 * - context:crm:{workspaceId} - CRM data (TTL: 5 min)
 * - context:calendar:{workspaceId} - Calendar events (TTL: 2 min)
 * - context:workspace:{workspaceId} - Workspace intelligence (TTL: 1 hour)
 * - context:prefs:{workspaceId}:{userId} - User preferences (TTL: 15 min)
 * - context:tasks:{workspaceId} - Tasks (TTL: 3 min)
 * - context:agents:{workspaceId} - Agents (TTL: 10 min)
 * - context:marketing:{workspaceId} - Marketing data (TTL: 5 min)
 */

// ============================================================================
// NEPTUNE CONTEXT CACHE TTL CONFIGURATION (in seconds)
// ============================================================================

export const CONTEXT_CACHE_TTL = {
  CRM: 5 * 60,              // 5 minutes - CRM data changes frequently but not per-request
  CALENDAR: 2 * 60,         // 2 minutes - Calendar needs to be relatively fresh
  WORKSPACE: 60 * 60,       // 1 hour - Workspace intelligence changes rarely
  USER_PREFS: 15 * 60,      // 15 minutes - User preferences are stable
  TASKS: 3 * 60,            // 3 minutes - Tasks change moderately
  AGENTS: 10 * 60,          // 10 minutes - Agent list is relatively stable
  MARKETING: 5 * 60,        // 5 minutes - Campaign stats need reasonable freshness
  CONTENT_COCKPIT: 10 * 60, // 10 minutes - Content metrics don't change rapidly
  FINANCE: 5 * 60,          // 5 minutes - Financial data needs reasonable freshness
  CONVERSATION: 5 * 60,     // 5 minutes - Conversation history context
  PROACTIVE_INSIGHTS: 5 * 60, // 5 minutes - Proactive insights
  RAG_SEARCH: 10 * 60,      // 10 minutes - RAG search results (documents don't change often)
  QUERY_EXPANSION: 60 * 60, // 1 hour - Query expansions are stable for same queries
} as const;

// ============================================================================
// NEPTUNE CONTEXT CACHE KEY BUILDERS
// ============================================================================

export const ContextCacheKeys = {
  crm: (workspaceId: string) => `context:crm:${workspaceId}`,
  calendar: (workspaceId: string) => `context:calendar:${workspaceId}`,
  workspace: (workspaceId: string) => `context:workspace:${workspaceId}`,
  userPrefs: (workspaceId: string, userId: string) => `context:prefs:${workspaceId}:${userId}`,
  tasks: (workspaceId: string) => `context:tasks:${workspaceId}`,
  agents: (workspaceId: string) => `context:agents:${workspaceId}`,
  marketing: (workspaceId: string) => `context:marketing:${workspaceId}`,
  contentCockpit: (workspaceId: string) => `context:content:${workspaceId}`,
  finance: (workspaceId: string) => `context:finance:${workspaceId}`,
  conversation: (workspaceId: string, userId: string) => `context:conversation:${workspaceId}:${userId}`,
  proactiveInsights: (workspaceId: string, userId: string) => `context:insights:${workspaceId}:${userId}`,
  // RAG cache keys
  ragSearch: (workspaceId: string, queryHash: string) => `rag:search:${workspaceId}:${queryHash}`,
  queryExpansion: (queryHash: string) => `rag:expand:${queryHash}`,
} as const;

interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 5 minutes)
  prefix?: string; // Cache key prefix
}

/**
 * Get cached data
 */
export async function getCache<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
  if (!shouldUseRedis() || !redis) return null;

  try {
    const { prefix = 'cache' } = options;
    const cacheKey = `${prefix}:${key}`;
    const cached = await redis.get(cacheKey);

    markRedisHealthy();
    
    if (cached === null || cached === undefined) {
      return null;
    }

    // Upstash Redis automatically parses JSON, so cached might already be an object
    // Handle both cases: string (needs parsing) or already-parsed object
    if (typeof cached === 'string') {
      return JSON.parse(cached) as T;
    }
    
    // Already parsed by Upstash
    return cached as T;
  } catch (error) {
    markRedisUnhealthy();
    // Only log on first few failures to avoid spam
    if (error instanceof Error && error.message.includes('fetch failed')) {
      logger.debug('Redis connection unavailable - caching disabled temporarily');
    } else {
      logger.error('Cache get error', error);
    }
    return null;
  }
}

/**
 * Set cached data with TTL
 */
export async function setCache<T>(
  key: string,
  data: T,
  options: CacheOptions = {}
): Promise<void> {
  if (!shouldUseRedis() || !redis) return;

  try {
    const { ttl = 300, prefix = 'cache' } = options; // Default 5 minutes
    const cacheKey = `${prefix}:${key}`;
    await redis.setex(cacheKey, ttl, JSON.stringify(data));
    markRedisHealthy();
  } catch (error) {
    markRedisUnhealthy();
    // Only log on first few failures to avoid spam
    if (error instanceof Error && error.message.includes('fetch failed')) {
      logger.debug('Redis connection unavailable - caching disabled temporarily');
    } else {
      logger.error('Cache set error', error);
    }
  }
}

/**
 * Invalidate cache by key
 */
export async function invalidateCache(key: string, options: CacheOptions = {}): Promise<void> {
  if (!shouldUseRedis() || !redis) return;

  try {
    const { prefix = 'cache' } = options;
    const cacheKey = `${prefix}:${key}`;
    await redis.del(cacheKey);
    markRedisHealthy();
  } catch (error) {
    markRedisUnhealthy();
    if (error instanceof Error && error.message.includes('fetch failed')) {
      logger.debug('Redis connection unavailable - cache invalidation skipped');
    } else {
      logger.error('Cache invalidate error', error);
    }
  }
}

/**
 * Invalidate multiple cache keys by pattern
 */
export async function invalidateCachePattern(
  pattern: string,
  options: CacheOptions = {}
): Promise<void> {
  if (!shouldUseRedis() || !redis) return;

  try {
    const { prefix = 'cache' } = options;
    const fullPattern = `${prefix}:${pattern}`;
    
    // Get all keys matching pattern
    const keys = await redis.keys(fullPattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    markRedisHealthy();
  } catch (error) {
    markRedisUnhealthy();
    if (error instanceof Error && error.message.includes('fetch failed')) {
      logger.debug('Redis connection unavailable - pattern invalidation skipped');
    } else {
      logger.error('Cache pattern invalidate error', error);
    }
  }
}

/**
 * Get or set cached data (cache-aside pattern)
 */
export async function getCacheOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Try to get from cache
  const cached = await getCache<T>(key, options);
  if (cached !== null) {
    return cached;
  }

  // If not cached, fetch and cache
  const data = await fetchFn();
  await setCache(key, data, options);
  return data;
}








