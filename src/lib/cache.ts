import { redis } from '@/lib/upstash';
import { logger } from '@/lib/logger';

/**
 * Redis Cache Helper Utilities
 * Provides convenient functions for caching with TTL
 */

interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 5 minutes)
  prefix?: string; // Cache key prefix
}

/**
 * Get cached data
 */
export async function getCache<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
  if (!redis) return null;

  try {
    const { prefix = 'cache' } = options;
    const cacheKey = `${prefix}:${key}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached as string) as T;
    }

    return null;
  } catch (error) {
    logger.error('Cache get error', error);
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
  if (!redis) return;

  try {
    const { ttl = 300, prefix = 'cache' } = options; // Default 5 minutes
    const cacheKey = `${prefix}:${key}`;
    await redis.setex(cacheKey, ttl, JSON.stringify(data));
  } catch (error) {
    logger.error('Cache set error', error);
  }
}

/**
 * Invalidate cache by key
 */
export async function invalidateCache(key: string, options: CacheOptions = {}): Promise<void> {
  if (!redis) return;

  try {
    const { prefix = 'cache' } = options;
    const cacheKey = `${prefix}:${key}`;
    await redis.del(cacheKey);
  } catch (error) {
    logger.error('Cache invalidate error', error);
  }
}

/**
 * Invalidate multiple cache keys by pattern
 */
export async function invalidateCachePattern(
  pattern: string,
  options: CacheOptions = {}
): Promise<void> {
  if (!redis) return;

  try {
    const { prefix = 'cache' } = options;
    const fullPattern = `${prefix}:${pattern}`;
    
    // Get all keys matching pattern
    const keys = await redis.keys(fullPattern);
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    logger.error('Cache pattern invalidate error', error);
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








