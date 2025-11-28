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
 */

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








