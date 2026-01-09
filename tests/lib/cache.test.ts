/**
 * Tests for Cache Module
 * 
 * Tests Redis caching layer with graceful degradation, TTL management,
 * cache key generation, and error resilience across the GalaxyCo platform.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  getCache,
  setCache,
  invalidateCache,
  invalidateCachePattern,
  getCacheOrFetch,
  ContextCacheKeys,
  CONTEXT_CACHE_TTL,
} from '@/lib/cache';
import { redis, shouldUseRedis, markRedisHealthy, markRedisUnhealthy } from '@/lib/upstash';
import { logger } from '@/lib/logger';
import { trackCacheHit } from '@/lib/observability';

// Mock dependencies
vi.mock('@/lib/upstash', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
    incr: vi.fn(),
  },
  shouldUseRedis: vi.fn(),
  markRedisHealthy: vi.fn(),
  markRedisUnhealthy: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/observability', () => ({
  trackCacheHit: vi.fn(),
}));

describe('cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(shouldUseRedis).mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCache', () => {
    it('should return null when Redis is disabled', async () => {
      vi.mocked(shouldUseRedis).mockReturnValue(false);

      const result = await getCache('test-key');

      expect(result).toBeNull();
      expect(redis.get).not.toHaveBeenCalled();
    });

    it('should return null when Redis client is null', async () => {
      vi.mocked(shouldUseRedis).mockReturnValue(true);
      const mockRedis = redis as any;
      const originalGet = mockRedis.get;
      mockRedis.get = null;

      const result = await getCache('test-key');

      expect(result).toBeNull();
      mockRedis.get = originalGet;
    });

    it('should get cached data with default prefix', async () => {
      const cachedData = { id: 1, name: 'Test' };
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(cachedData));

      const result = await getCache('test-key');

      expect(redis.get).toHaveBeenCalledWith('cache:test-key');
      expect(result).toEqual(cachedData);
      expect(markRedisHealthy).toHaveBeenCalled();
    });

    it('should get cached data with custom prefix', async () => {
      const cachedData = { value: 42 };
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(cachedData));

      const result = await getCache('test-key', { prefix: 'custom' });

      expect(redis.get).toHaveBeenCalledWith('custom:test-key');
      expect(result).toEqual(cachedData);
    });

    it('should handle already-parsed data from Upstash', async () => {
      const cachedData = { id: 1, name: 'Test' };
      vi.mocked(redis.get).mockResolvedValue(cachedData);

      const result = await getCache('test-key');

      expect(result).toEqual(cachedData);
      expect(markRedisHealthy).toHaveBeenCalled();
    });

    it('should return null when cache key does not exist', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);

      const result = await getCache('nonexistent-key');

      expect(result).toBeNull();
      expect(markRedisHealthy).toHaveBeenCalled();
    });

    it('should return null when cached value is undefined', async () => {
      vi.mocked(redis.get).mockResolvedValue(undefined);

      const result = await getCache('undefined-key');

      expect(result).toBeNull();
    });

    it('should handle fetch failed errors gracefully', async () => {
      const error = new Error('fetch failed');
      vi.mocked(redis.get).mockRejectedValue(error);

      const result = await getCache('test-key');

      expect(result).toBeNull();
      expect(markRedisUnhealthy).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        'Redis connection unavailable - caching disabled temporarily'
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should handle other Redis errors and log them', async () => {
      const error = new Error('Redis internal error');
      vi.mocked(redis.get).mockRejectedValue(error);

      const result = await getCache('test-key');

      expect(result).toBeNull();
      expect(markRedisUnhealthy).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Cache get error', error);
    });

    it('should parse complex nested objects', async () => {
      const cachedData = {
        user: { id: 1, profile: { name: 'Test', settings: { theme: 'dark' } } },
        metadata: { timestamp: '2024-01-01', count: 42 },
      };
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(cachedData));

      const result = await getCache('complex-key');

      expect(result).toEqual(cachedData);
    });

    it('should handle arrays', async () => {
      const cachedData = [1, 2, 3, 4, 5];
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(cachedData));

      const result = await getCache<number[]>('array-key');

      expect(result).toEqual(cachedData);
    });
  });

  describe('setCache', () => {
    it('should not set cache when Redis is disabled', async () => {
      vi.mocked(shouldUseRedis).mockReturnValue(false);

      await setCache('test-key', { value: 42 });

      expect(redis.setex).not.toHaveBeenCalled();
    });

    it('should set cache with default TTL and prefix', async () => {
      const data = { id: 1, name: 'Test' };
      vi.mocked(redis.setex).mockResolvedValue('OK');

      await setCache('test-key', data);

      expect(redis.setex).toHaveBeenCalledWith(
        'cache:test-key',
        300, // Default 5 minutes
        JSON.stringify(data)
      );
      expect(markRedisHealthy).toHaveBeenCalled();
    });

    it('should set cache with custom TTL', async () => {
      const data = { value: 42 };
      vi.mocked(redis.setex).mockResolvedValue('OK');

      await setCache('test-key', data, { ttl: 600 });

      expect(redis.setex).toHaveBeenCalledWith(
        'cache:test-key',
        600,
        JSON.stringify(data)
      );
    });

    it('should set cache with custom prefix', async () => {
      const data = { value: 42 };
      vi.mocked(redis.setex).mockResolvedValue('OK');

      await setCache('test-key', data, { prefix: 'custom', ttl: 120 });

      expect(redis.setex).toHaveBeenCalledWith(
        'custom:test-key',
        120,
        JSON.stringify(data)
      );
    });

    it('should handle fetch failed errors gracefully', async () => {
      const error = new Error('fetch failed');
      vi.mocked(redis.setex).mockRejectedValue(error);

      await setCache('test-key', { value: 42 });

      expect(markRedisUnhealthy).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        'Redis connection unavailable - caching disabled temporarily'
      );
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should handle other Redis errors and log them', async () => {
      const error = new Error('Redis write error');
      vi.mocked(redis.setex).mockRejectedValue(error);

      await setCache('test-key', { value: 42 });

      expect(markRedisUnhealthy).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Cache set error', error);
    });

    it('should serialize complex objects correctly', async () => {
      const data = {
        nested: { deep: { value: 42 } },
        array: [1, 2, 3],
        date: new Date('2024-01-01').toISOString(),
      };
      vi.mocked(redis.setex).mockResolvedValue('OK');

      await setCache('complex-key', data);

      expect(redis.setex).toHaveBeenCalledWith(
        'cache:complex-key',
        300,
        JSON.stringify(data)
      );
    });
  });

  describe('invalidateCache', () => {
    it('should not invalidate when Redis is disabled', async () => {
      vi.mocked(shouldUseRedis).mockReturnValue(false);

      await invalidateCache('test-key');

      expect(redis.del).not.toHaveBeenCalled();
    });

    it('should delete cache key with default prefix', async () => {
      vi.mocked(redis.del).mockResolvedValue(1);

      await invalidateCache('test-key');

      expect(redis.del).toHaveBeenCalledWith('cache:test-key');
      expect(markRedisHealthy).toHaveBeenCalled();
    });

    it('should delete cache key with custom prefix', async () => {
      vi.mocked(redis.del).mockResolvedValue(1);

      await invalidateCache('test-key', { prefix: 'custom' });

      expect(redis.del).toHaveBeenCalledWith('custom:test-key');
    });

    it('should handle fetch failed errors gracefully', async () => {
      const error = new Error('fetch failed');
      vi.mocked(redis.del).mockRejectedValue(error);

      await invalidateCache('test-key');

      expect(markRedisUnhealthy).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        'Redis connection unavailable - cache invalidation skipped'
      );
    });

    it('should handle other Redis errors and log them', async () => {
      const error = new Error('Redis delete error');
      vi.mocked(redis.del).mockRejectedValue(error);

      await invalidateCache('test-key');

      expect(markRedisUnhealthy).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Cache invalidate error', error);
    });
  });

  describe('invalidateCachePattern', () => {
    it('should not invalidate when Redis is disabled', async () => {
      vi.mocked(shouldUseRedis).mockReturnValue(false);

      await invalidateCachePattern('test:*');

      expect(redis.keys).not.toHaveBeenCalled();
      expect(redis.del).not.toHaveBeenCalled();
    });

    it('should delete all keys matching pattern', async () => {
      const matchingKeys = ['cache:user:1', 'cache:user:2', 'cache:user:3'];
      vi.mocked(redis.keys).mockResolvedValue(matchingKeys);
      vi.mocked(redis.del).mockResolvedValue(3);

      await invalidateCachePattern('user:*');

      expect(redis.keys).toHaveBeenCalledWith('cache:user:*');
      expect(redis.del).toHaveBeenCalledWith(...matchingKeys);
      expect(markRedisHealthy).toHaveBeenCalled();
    });

    it('should not call delete when no keys match', async () => {
      vi.mocked(redis.keys).mockResolvedValue([]);

      await invalidateCachePattern('nonexistent:*');

      expect(redis.keys).toHaveBeenCalledWith('cache:nonexistent:*');
      expect(redis.del).not.toHaveBeenCalled();
      expect(markRedisHealthy).toHaveBeenCalled();
    });

    it('should use custom prefix', async () => {
      const matchingKeys = ['custom:session:abc', 'custom:session:def'];
      vi.mocked(redis.keys).mockResolvedValue(matchingKeys);
      vi.mocked(redis.del).mockResolvedValue(2);

      await invalidateCachePattern('session:*', { prefix: 'custom' });

      expect(redis.keys).toHaveBeenCalledWith('custom:session:*');
      expect(redis.del).toHaveBeenCalledWith(...matchingKeys);
    });

    it('should handle fetch failed errors gracefully', async () => {
      const error = new Error('fetch failed');
      vi.mocked(redis.keys).mockRejectedValue(error);

      await invalidateCachePattern('test:*');

      expect(markRedisUnhealthy).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith(
        'Redis connection unavailable - pattern invalidation skipped'
      );
    });

    it('should handle other Redis errors and log them', async () => {
      const error = new Error('Redis pattern error');
      vi.mocked(redis.keys).mockRejectedValue(error);

      await invalidateCachePattern('test:*');

      expect(markRedisUnhealthy).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('Cache pattern invalidate error', error);
    });
  });

  describe('getCacheOrFetch', () => {
    it('should return cached data on cache hit', async () => {
      const cachedData = { id: 1, name: 'Cached' };
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(cachedData));
      vi.mocked(redis.incr).mockResolvedValue(1);
      const fetchFn = vi.fn();

      const result = await getCacheOrFetch('test-key', fetchFn);

      expect(result).toEqual(cachedData);
      expect(fetchFn).not.toHaveBeenCalled();
      expect(trackCacheHit).toHaveBeenCalledWith('context', true);
      expect(redis.incr).toHaveBeenCalledWith('metrics:cache:hits');
    });

    it('should fetch and cache on cache miss', async () => {
      const fetchedData = { id: 2, name: 'Fetched' };
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(redis.setex).mockResolvedValue('OK');
      vi.mocked(redis.incr).mockResolvedValue(1);
      const fetchFn = vi.fn().mockResolvedValue(fetchedData);

      const result = await getCacheOrFetch('test-key', fetchFn);

      expect(result).toEqual(fetchedData);
      expect(fetchFn).toHaveBeenCalled();
      expect(trackCacheHit).toHaveBeenCalledWith('context', false);
      expect(redis.incr).toHaveBeenCalledWith('metrics:cache:misses');
      expect(redis.setex).toHaveBeenCalledWith(
        'cache:test-key',
        300,
        JSON.stringify(fetchedData)
      );
    });

    it('should detect RAG cache type from key', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(redis.setex).mockResolvedValue('OK');
      const fetchFn = vi.fn().mockResolvedValue({ results: [] });

      await getCacheOrFetch('rag:search:workspace-123:hash', fetchFn);

      expect(trackCacheHit).toHaveBeenCalledWith('rag', false);
    });

    it('should detect user prefs cache type from key', async () => {
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(redis.setex).mockResolvedValue('OK');
      const fetchFn = vi.fn().mockResolvedValue({ theme: 'dark' });

      await getCacheOrFetch('prefs:user:123', fetchFn);

      expect(trackCacheHit).toHaveBeenCalledWith('user_prefs', false);
    });

    it('should use custom TTL', async () => {
      const fetchedData = { value: 42 };
      vi.mocked(redis.get).mockResolvedValue(null);
      vi.mocked(redis.setex).mockResolvedValue('OK');
      const fetchFn = vi.fn().mockResolvedValue(fetchedData);

      await getCacheOrFetch('test-key', fetchFn, { ttl: 600, prefix: 'custom' });

      expect(redis.setex).toHaveBeenCalledWith(
        'custom:test-key',
        600,
        JSON.stringify(fetchedData)
      );
    });

    it('should handle Redis metrics counter errors silently', async () => {
      const cachedData = { id: 1 };
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify(cachedData));
      vi.mocked(redis.incr).mockRejectedValue(new Error('Counter error'));

      const result = await getCacheOrFetch('test-key', vi.fn());

      expect(result).toEqual(cachedData);
      // Should not throw even though incr failed
    });

    it('should still work when Redis is unavailable', async () => {
      vi.mocked(shouldUseRedis).mockReturnValue(false);
      const fetchedData = { id: 3, name: 'Fallback' };
      const fetchFn = vi.fn().mockResolvedValue(fetchedData);

      const result = await getCacheOrFetch('test-key', fetchFn);

      expect(result).toEqual(fetchedData);
      expect(fetchFn).toHaveBeenCalled();
      expect(trackCacheHit).toHaveBeenCalledWith('context', false);
    });
  });

  describe('ContextCacheKeys', () => {
    it('should generate CRM cache key', () => {
      const key = ContextCacheKeys.crm('workspace-123');
      expect(key).toBe('context:crm:workspace-123');
    });

    it('should generate calendar cache key', () => {
      const key = ContextCacheKeys.calendar('workspace-123');
      expect(key).toBe('context:calendar:workspace-123');
    });

    it('should generate workspace cache key', () => {
      const key = ContextCacheKeys.workspace('workspace-123');
      expect(key).toBe('context:workspace:workspace-123');
    });

    it('should generate user prefs cache key', () => {
      const key = ContextCacheKeys.userPrefs('workspace-123', 'user-456');
      expect(key).toBe('context:prefs:workspace-123:user-456');
    });

    it('should generate tasks cache key', () => {
      const key = ContextCacheKeys.tasks('workspace-123');
      expect(key).toBe('context:tasks:workspace-123');
    });

    it('should generate agents cache key', () => {
      const key = ContextCacheKeys.agents('workspace-123');
      expect(key).toBe('context:agents:workspace-123');
    });

    it('should generate marketing cache key', () => {
      const key = ContextCacheKeys.marketing('workspace-123');
      expect(key).toBe('context:marketing:workspace-123');
    });

    it('should generate content cockpit cache key', () => {
      const key = ContextCacheKeys.contentCockpit('workspace-123');
      expect(key).toBe('context:content:workspace-123');
    });

    it('should generate finance cache key', () => {
      const key = ContextCacheKeys.finance('workspace-123');
      expect(key).toBe('context:finance:workspace-123');
    });

    it('should generate conversation cache key', () => {
      const key = ContextCacheKeys.conversation('workspace-123', 'user-456');
      expect(key).toBe('context:conversation:workspace-123:user-456');
    });

    it('should generate proactive insights cache key', () => {
      const key = ContextCacheKeys.proactiveInsights('workspace-123', 'user-456');
      expect(key).toBe('context:insights:workspace-123:user-456');
    });

    it('should generate RAG search cache key', () => {
      const key = ContextCacheKeys.ragSearch('workspace-123', 'queryhash123');
      expect(key).toBe('rag:search:workspace-123:queryhash123');
    });

    it('should generate query expansion cache key', () => {
      const key = ContextCacheKeys.queryExpansion('queryhash123');
      expect(key).toBe('rag:expand:queryhash123');
    });

    it('should generate website analysis cache key', () => {
      const key = ContextCacheKeys.websiteAnalysis('example.com');
      expect(key).toBe('website:analysis:example.com');
    });
  });

  describe('CONTEXT_CACHE_TTL', () => {
    it('should define correct TTL values', () => {
      expect(CONTEXT_CACHE_TTL.CRM).toBe(600); // 10 minutes
      expect(CONTEXT_CACHE_TTL.CALENDAR).toBe(300); // 5 minutes
      expect(CONTEXT_CACHE_TTL.WORKSPACE).toBe(7200); // 2 hours
      expect(CONTEXT_CACHE_TTL.USER_PREFS).toBe(1800); // 30 minutes
      expect(CONTEXT_CACHE_TTL.TASKS).toBe(300); // 5 minutes
      expect(CONTEXT_CACHE_TTL.AGENTS).toBe(1200); // 20 minutes
      expect(CONTEXT_CACHE_TTL.MARKETING).toBe(600); // 10 minutes
      expect(CONTEXT_CACHE_TTL.CONTENT_COCKPIT).toBe(900); // 15 minutes
      expect(CONTEXT_CACHE_TTL.FINANCE).toBe(600); // 10 minutes
      expect(CONTEXT_CACHE_TTL.CONVERSATION).toBe(600); // 10 minutes
      expect(CONTEXT_CACHE_TTL.PROACTIVE_INSIGHTS).toBe(600); // 10 minutes
      expect(CONTEXT_CACHE_TTL.RAG_SEARCH).toBe(1800); // 30 minutes
      expect(CONTEXT_CACHE_TTL.QUERY_EXPANSION).toBe(7200); // 2 hours
      expect(CONTEXT_CACHE_TTL.WEBSITE_ANALYSIS).toBe(1209600); // 14 days
    });

    it('should have all TTL values as positive integers', () => {
      Object.values(CONTEXT_CACHE_TTL).forEach((ttl) => {
        expect(ttl).toBeGreaterThan(0);
        expect(Number.isInteger(ttl)).toBe(true);
      });
    });
  });
});
