import { Redis } from '@upstash/redis';
import { Index } from '@upstash/vector';

/**
 * Upstash Redis - Optional for caching and rate limiting
 * If not configured, caching features will be disabled
 */
export const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * Upstash Vector - Optional if using Pinecone instead
 */
export const vectorIndex = (process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN)
  ? new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    })
  : null;

/**
 * Check if Upstash Redis is configured
 */
export function isRedisConfigured(): boolean {
  return !!redis;
}

/**
 * Check if Upstash Vector is configured
 */
export function isUpstashVectorConfigured(): boolean {
  return !!vectorIndex;
}


