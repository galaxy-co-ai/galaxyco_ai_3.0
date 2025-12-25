import { redis, shouldUseRedis, markRedisHealthy, markRedisUnhealthy } from '@/lib/upstash';
import { logger } from '@/lib/logger';
import { trackCacheHit, type CacheType } from '@/lib/observability';

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
// Phase 3B: Increased TTLs for stable data to improve cache hit rate
// ============================================================================

export const CONTEXT_CACHE_TTL = {
  CRM: 10 * 60, // 10 minutes (was 5) - CRM data changes frequently but not per-request
  CALENDAR: 5 * 60, // 5 minutes (was 2) - Balance freshness with performance
  WORKSPACE: 2 * 60 * 60, // 2 hours (was 1) - Workspace intelligence changes rarely
  USER_PREFS: 30 * 60, // 30 minutes (was 15) - User preferences are stable
  TASKS: 5 * 60, // 5 minutes (was 3) - Tasks change moderately
  AGENTS: 20 * 60, // 20 minutes (was 10) - Agent list is relatively stable
  MARKETING: 10 * 60, // 10 minutes (was 5) - Campaign stats need reasonable freshness
  CONTENT_COCKPIT: 15 * 60, // 15 minutes (was 10) - Content metrics don't change rapidly
  FINANCE: 10 * 60, // 10 minutes (was 5) - Financial data needs reasonable freshness
  CONVERSATION: 10 * 60, // 10 minutes (was 5) - Conversation history context
  PROACTIVE_INSIGHTS: 10 * 60, // 10 minutes (was 5) - Proactive insights
  RAG_SEARCH: 30 * 60, // 30 minutes (was 10) - RAG search results (documents don't change often)
  QUERY_EXPANSION: 2 * 60 * 60, // 2 hours (was 1) - Query expansions are stable for same queries
  WEBSITE_ANALYSIS: 14 * 24 * 60 * 60, // 14 days (was 7) - Website analysis results are stable
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
  conversation: (workspaceId: string, userId: string) =>
    `context:conversation:${workspaceId}:${userId}`,
  proactiveInsights: (workspaceId: string, userId: string) =>
    `context:insights:${workspaceId}:${userId}`,
  // RAG cache keys
  ragSearch: (workspaceId: string, queryHash: string) => `rag:search:${workspaceId}:${queryHash}`,
  queryExpansion: (queryHash: string) => `rag:expand:${queryHash}`,
  // Website analysis cache key
  websiteAnalysis: (normalizedUrl: string) => `website:analysis:${normalizedUrl}`,
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
export async function setCache<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
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
 * Now includes observability tracking for cache hits/misses
 */
export async function getCacheOrFetch<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  // Determine cache type from key for tracking
  let cacheType: CacheType = 'context'; // default
  if (key.includes('rag:')) {
    cacheType = 'rag';
  } else if (key.includes('prefs:')) {
    cacheType = 'user_prefs';
  }

  // Try to get from cache
  const cached = await getCache<T>(key, options);

  if (cached !== null) {
    // Track cache hit
    trackCacheHit(cacheType, true);

    // Increment Redis counter for API metrics
    if (shouldUseRedis() && redis) {
      redis.incr('metrics:cache:hits').catch(() => {});
    }

    return cached;
  }

  // Track cache miss
  trackCacheHit(cacheType, false);

  // Increment Redis counter for API metrics
  if (shouldUseRedis() && redis) {
    redis.incr('metrics:cache:misses').catch(() => {});
  }

  // If not cached, fetch and cache
  const data = await fetchFn();
  await setCache(key, data, options);
  return data;
}
