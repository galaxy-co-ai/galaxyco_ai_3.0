import { Redis } from '@upstash/redis';
import { Index } from '@upstash/vector';

/**
 * Upstash Redis - Optional for caching and rate limiting
 * If not configured, caching features will be disabled
 */
const redisClient =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

/**
 * Redis health tracking to avoid spamming logs on connection failures
 */
let redisHealthy = true;
let redisFailureCount = 0;
let redisLastFailure = 0;
const REDIS_FAILURE_THRESHOLD = 3; // Disable after 3 consecutive failures
const REDIS_RECOVERY_MS = 60000; // Try again after 1 minute

/**
 * Mark Redis as unhealthy after connection failures
 */
export function markRedisUnhealthy(): void {
  redisFailureCount++;
  redisLastFailure = Date.now();
  if (redisFailureCount >= REDIS_FAILURE_THRESHOLD) {
    redisHealthy = false;
  }
}

/**
 * Mark Redis as healthy after successful operation
 */
export function markRedisHealthy(): void {
  redisFailureCount = 0;
  redisHealthy = true;
}

/**
 * Check if Redis should be used (configured AND healthy)
 */
export function shouldUseRedis(): boolean {
  if (!redisClient) return false;

  // If unhealthy, check if recovery period has passed
  if (!redisHealthy) {
    if (Date.now() - redisLastFailure > REDIS_RECOVERY_MS) {
      // Allow a retry attempt
      redisHealthy = true;
      redisFailureCount = 0;
    }
    return redisHealthy;
  }

  return true;
}

/**
 * Export the redis client (may be null if not configured)
 */
export const redis = redisClient;

/**
 * Upstash Vector - Optional if using Pinecone instead
 */
export const vectorIndex =
  process.env.UPSTASH_VECTOR_REST_URL && process.env.UPSTASH_VECTOR_REST_TOKEN
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
