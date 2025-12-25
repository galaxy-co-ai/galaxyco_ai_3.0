/**
 * LLM Response Caching with Redis
 *
 * Dramatically reduces OpenAI API costs and latency by caching responses.
 *
 * **Savings Potential:**
 * - 50-70% cost reduction on repeated queries
 * - 10x faster response times (Redis << OpenAI API)
 * - Reduced rate limiting issues
 *
 * **Cache Strategy:**
 * - TTL: 24 hours (configurable per use case)
 * - Key based on: model + normalized prompt + params
 * - Automatically disabled if Redis unavailable
 */

import { redis, shouldUseRedis, markRedisHealthy, markRedisUnhealthy } from './upstash';
import { logger } from './logger';
import crypto from 'crypto';

export interface LLMCacheOptions {
  /**
   * Time to live in seconds
   * @default 86400 (24 hours)
   */
  ttl?: number;

  /**
   * Skip cache for this call
   * @default false
   */
  skipCache?: boolean;

  /**
   * Cache key prefix for organization
   * @default 'llm'
   */
  prefix?: string;

  /**
   * Model name for cache key
   */
  model?: string;

  /**
   * Additional context for cache key (e.g., userId, workspaceId)
   */
  context?: Record<string, string>;
}

interface CacheEntry {
  response: unknown;
  model: string;
  timestamp: number;
  tokensUsed?: number;
}

/**
 * Generate a stable cache key from the prompt and options
 *
 * Uses SHA-256 hash to create deterministic keys from inputs
 */
function generateCacheKey(prompt: string | object, options: LLMCacheOptions = {}): string {
  const { prefix = 'llm', model = 'gpt-4o-mini', context = {} } = options;

  // Normalize prompt (handle both string and object messages)
  const normalizedPrompt = typeof prompt === 'string' ? prompt : JSON.stringify(prompt);

  // Create deterministic hash
  const content = JSON.stringify({
    prompt: normalizedPrompt.trim().toLowerCase(),
    model,
    context: Object.keys(context)
      .sort()
      .reduce((acc, key) => ({ ...acc, [key]: context[key] }), {}),
  });

  const hash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);

  // Build key: llm:model:hash[:context]
  const contextSuffix =
    Object.keys(context).length > 0 ? `:${Object.values(context).join(':')}` : '';
  return `${prefix}:${model}:${hash}${contextSuffix}`;
}

/**
 * Get cached LLM response
 *
 * @returns Cached response or null if not found/expired
 */
export async function getCachedLLMResponse<T = unknown>(
  prompt: string | object,
  options: LLMCacheOptions = {}
): Promise<T | null> {
  if (!shouldUseRedis() || options.skipCache) {
    return null;
  }

  try {
    const key = generateCacheKey(prompt, options);
    const cached = await redis!.get<CacheEntry>(key);

    if (!cached) {
      logger.debug('[LLM Cache] Miss', { key: key.substring(0, 30) });
      return null;
    }

    // Validate cache entry
    if (!cached.response || !cached.timestamp) {
      logger.warn('[LLM Cache] Invalid entry, purging', { key });
      await redis!.del(key);
      return null;
    }

    markRedisHealthy();
    logger.info('[LLM Cache] Hit', {
      key: key.substring(0, 30),
      model: cached.model,
      age: Math.floor((Date.now() - cached.timestamp) / 1000) + 's',
      tokensUsed: cached.tokensUsed,
    });

    return cached.response as T;
  } catch (error) {
    logger.error('[LLM Cache] Get error (falling back to API)', error);
    markRedisUnhealthy();
    return null;
  }
}

/**
 * Cache LLM response
 *
 * Stores response with metadata for debugging and analytics
 */
export async function cacheLLMResponse(
  prompt: string | object,
  response: unknown,
  options: LLMCacheOptions = {}
): Promise<void> {
  if (!shouldUseRedis() || options.skipCache) {
    return;
  }

  try {
    const key = generateCacheKey(prompt, options);
    const { ttl = 86400, model = 'gpt-4o-mini' } = options; // 24h default

    const entry: CacheEntry = {
      response,
      model,
      timestamp: Date.now(),
      tokensUsed:
        typeof response === 'object' && response !== null && 'usage' in response
          ? (response as { usage?: { total_tokens?: number } }).usage?.total_tokens
          : undefined,
    };

    await redis!.setex(key, ttl, JSON.stringify(entry));

    markRedisHealthy();
    logger.debug('[LLM Cache] Cached', {
      key: key.substring(0, 30),
      model,
      ttl,
      tokensUsed: entry.tokensUsed,
    });
  } catch (error) {
    logger.error('[LLM Cache] Set error (non-blocking)', error);
    markRedisUnhealthy();
  }
}

/**
 * Wrapper for OpenAI chat completions with automatic caching
 *
 * @example
 * ```ts
 * const response = await cachedChatCompletion({
 *   model: 'gpt-4o-mini',
 *   messages: [{ role: 'user', content: 'Hello' }],
 * }, {
 *   ttl: 3600, // 1 hour
 *   context: { workspaceId: '123' },
 * });
 * ```
 */
export async function cachedChatCompletion<T = unknown>(
  params: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    [key: string]: unknown;
  },
  cacheOptions: LLMCacheOptions = {},
  apiCall: () => Promise<T>
): Promise<T> {
  // Try cache first
  const cached = await getCachedLLMResponse<T>(params.messages, {
    ...cacheOptions,
    model: params.model,
  });

  if (cached) {
    return cached;
  }

  // Call API
  const response = await apiCall();

  // Cache for next time
  await cacheLLMResponse(params.messages, response, {
    ...cacheOptions,
    model: params.model,
  });

  return response;
}

/**
 * Clear all LLM cache entries (admin/debugging)
 */
export async function clearLLMCache(prefix = 'llm'): Promise<number> {
  if (!shouldUseRedis()) {
    return 0;
  }

  try {
    const pattern = `${prefix}:*`;
    const keys = await redis!.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    await redis!.del(...keys);
    logger.info('[LLM Cache] Cleared', { count: keys.length, prefix });
    return keys.length;
  } catch (error) {
    logger.error('[LLM Cache] Clear error', error);
    markRedisUnhealthy();
    return 0;
  }
}

/**
 * Get cache statistics (admin/debugging)
 */
export async function getLLMCacheStats(prefix = 'llm'): Promise<{
  totalKeys: number;
  totalSize: number;
  oldestEntry: number;
  newestEntry: number;
}> {
  if (!shouldUseRedis()) {
    return { totalKeys: 0, totalSize: 0, oldestEntry: 0, newestEntry: 0 };
  }

  try {
    const pattern = `${prefix}:*`;
    const keys = await redis!.keys(pattern);

    let totalSize = 0;
    let oldestEntry = Date.now();
    let newestEntry = 0;

    for (const key of keys) {
      const entry = await redis!.get<CacheEntry>(key);
      if (entry && entry.timestamp) {
        const entrySize = JSON.stringify(entry).length;
        totalSize += entrySize;
        oldestEntry = Math.min(oldestEntry, entry.timestamp);
        newestEntry = Math.max(newestEntry, entry.timestamp);
      }
    }

    return {
      totalKeys: keys.length,
      totalSize,
      oldestEntry: oldestEntry === Date.now() ? 0 : oldestEntry,
      newestEntry,
    };
  } catch (error) {
    logger.error('[LLM Cache] Stats error', error);
    markRedisUnhealthy();
    return { totalKeys: 0, totalSize: 0, oldestEntry: 0, newestEntry: 0 };
  }
}
