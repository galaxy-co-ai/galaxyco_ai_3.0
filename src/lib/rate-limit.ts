import { redis, shouldUseRedis, markRedisHealthy, markRedisUnhealthy } from '@/lib/upstash';
import { logger } from '@/lib/logger';

/**
 * Rate Limiting Utility using Upstash Redis
 * Implements sliding window rate limiting
 * 
 * Features:
 * - Graceful degradation when Redis is unavailable
 * - Health tracking to avoid repeated failures
 */

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  limit: number;
  reset: number; // Unix timestamp when the limit resets
}

/**
 * Rate limit a request by identifier (user ID, IP address, etc.)
 * 
 * @param identifier - Unique identifier (userId, IP, etc.)
 * @param limit - Maximum number of requests allowed
 * @param window - Time window in seconds
 * @returns Rate limit result with success status
 */
export async function rateLimit(
  identifier: string,
  limit: number = 100,
  window: number = 60
): Promise<RateLimitResult> {
  // If Redis is not available or unhealthy, allow all requests
  if (!shouldUseRedis() || !redis) {
    return {
      success: true,
      remaining: limit,
      limit,
      reset: Date.now() + window * 1000,
    };
  }

  try {
    const key = `rate-limit:${identifier}`;
    
    // Increment the counter
    const count = await redis.incr(key);
    
    // Set expiration on first request
    if (count === 1) {
      await redis.expire(key, window);
    }

    // Get TTL to calculate reset time
    const ttl = await redis.ttl(key);
    const reset = Date.now() + (ttl > 0 ? ttl * 1000 : window * 1000);

    const remaining = Math.max(0, limit - count);
    
    markRedisHealthy();
    
    return {
      success: count <= limit,
      remaining,
      limit,
      reset,
    };
  } catch (error) {
    markRedisUnhealthy();
    // Only log detailed errors for non-connection issues
    if (error instanceof Error && error.message.includes('fetch failed')) {
      logger.debug('Redis connection unavailable - rate limiting disabled temporarily');
    } else {
      logger.error('Rate limit error', error);
    }
    // On error, allow the request
    return {
      success: true,
      remaining: limit,
      limit,
      reset: Date.now() + window * 1000,
    };
  }
}

/**
 * Rate limit for API endpoints
 * More strict limits for public APIs
 */
export async function apiRateLimit(
  identifier: string,
  tier: 'free' | 'starter' | 'professional' | 'enterprise' = 'free'
): Promise<RateLimitResult> {
  const limits = {
    free: { limit: 100, window: 3600 }, // 100 requests per hour
    starter: { limit: 1000, window: 3600 }, // 1000 requests per hour
    professional: { limit: 10000, window: 3600 }, // 10k requests per hour
    enterprise: { limit: 100000, window: 3600 }, // 100k requests per hour
  };

  const { limit, window } = limits[tier];
  return rateLimit(identifier, limit, window);
}

/**
 * Rate limit for expensive operations (AI, vector search)
 */
export async function expensiveOperationLimit(
  identifier: string
): Promise<RateLimitResult> {
  return rateLimit(identifier, 10, 60); // 10 requests per minute
}








