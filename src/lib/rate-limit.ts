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

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

interface RateLimitOptions {
  limit?: number;
  window?: number;
}

/**
 * Higher-order function to wrap API route handlers with rate limiting
 * 
 * @param handler - The API route handler function
 * @param options - Rate limit options (limit and window in seconds)
 * @returns Wrapped handler with rate limiting
 * 
 * @example
 * ```ts
 * export const GET = withRateLimit(async (request) => {
 *   return NextResponse.json({ data: 'response' });
 * }, { limit: 30, window: 60 });
 * ```
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: RateLimitOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  const { limit = 100, window = 60 } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Get identifier (userId if authenticated, IP otherwise)
      const { userId } = await auth();
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                 request.headers.get('x-real-ip') || 
                 'anonymous';
      const identifier = userId || `ip:${ip}`;

      // Check rate limit
      const result = await rateLimit(identifier, limit, window);

      if (!result.success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(result.limit),
              'X-RateLimit-Remaining': String(result.remaining),
              'X-RateLimit-Reset': String(result.reset),
              'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
            }
          }
        );
      }

      // Call the original handler
      const response = await handler(request);

      // Add rate limit headers to successful response
      response.headers.set('X-RateLimit-Limit', String(result.limit));
      response.headers.set('X-RateLimit-Remaining', String(result.remaining));
      response.headers.set('X-RateLimit-Reset', String(result.reset));

      return response;
    } catch (error) {
      logger.error('Rate limit wrapper error', error);
      // On error, proceed without rate limiting
      return handler(request);
    }
  };
}








