import { redis, shouldUseRedis, markRedisHealthy, markRedisUnhealthy } from '@/lib/upstash';
import { logger } from '@/lib/logger';

/**
 * Cost Protection Utility
 * Enforces hard limits to prevent runaway AI costs
 *
 * Features:
 * - Per-request token limits
 * - Daily token usage caps per workspace
 * - File size limits for uploads
 * - Timeout signals for long-running operations
 * - Graceful degradation when Redis is unavailable
 */

export type WorkspaceTier = 'free' | 'starter' | 'professional' | 'enterprise';

export interface ResourceLimits {
  maxTokensPerRequest: number;
  maxTokensPerDay: number;
  maxFileSize: number; // bytes
  maxRunDuration: number; // milliseconds
  maxConcurrentRuns: number;
}

export const TIER_LIMITS: Record<WorkspaceTier, ResourceLimits> = {
  free: {
    maxTokensPerRequest: 4000,
    maxTokensPerDay: 50000,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxRunDuration: 5 * 60 * 1000, // 5 minutes
    maxConcurrentRuns: 1,
  },
  starter: {
    maxTokensPerRequest: 8000,
    maxTokensPerDay: 200000,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    maxRunDuration: 15 * 60 * 1000, // 15 minutes
    maxConcurrentRuns: 3,
  },
  professional: {
    maxTokensPerRequest: 16000,
    maxTokensPerDay: 1000000,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxRunDuration: 30 * 60 * 1000, // 30 minutes
    maxConcurrentRuns: 10,
  },
  enterprise: {
    maxTokensPerRequest: 32000,
    maxTokensPerDay: 5000000,
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    maxRunDuration: 60 * 60 * 1000, // 60 minutes
    maxConcurrentRuns: 50,
  },
};

export interface TokenLimitResult {
  allowed: boolean;
  reason?: string;
  currentUsage: number;
  limit: number;
  remaining: number;
}

/**
 * Get the Redis key for daily token usage tracking
 */
function getDailyTokenKey(workspaceId: string): string {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return `tokens:daily:${workspaceId}:${today}`;
}

/**
 * Check if a workspace can use the requested tokens
 * Checks both per-request and daily limits
 *
 * @param workspaceId - The workspace ID
 * @param tier - The workspace's subscription tier
 * @param requestedTokens - Number of tokens requested for this operation
 * @returns Object indicating if the request is allowed and why
 */
export async function checkTokenLimit(
  workspaceId: string,
  tier: WorkspaceTier,
  requestedTokens: number
): Promise<TokenLimitResult> {
  const limits = TIER_LIMITS[tier];

  // Check per-request limit
  if (requestedTokens > limits.maxTokensPerRequest) {
    return {
      allowed: false,
      reason: `Request exceeds maximum tokens per request (${requestedTokens} > ${limits.maxTokensPerRequest})`,
      currentUsage: 0,
      limit: limits.maxTokensPerRequest,
      remaining: 0,
    };
  }

  // If Redis is not available, allow the request but log it
  if (!shouldUseRedis() || !redis) {
    logger.warn('Redis unavailable for token tracking - allowing request without usage check', {
      workspaceId,
      requestedTokens,
    });
    return {
      allowed: true,
      currentUsage: 0,
      limit: limits.maxTokensPerDay,
      remaining: limits.maxTokensPerDay,
    };
  }

  try {
    const key = getDailyTokenKey(workspaceId);
    const currentUsageStr = await redis.get(key);
    const currentUsage = currentUsageStr ? parseInt(String(currentUsageStr), 10) : 0;

    markRedisHealthy();

    const remaining = Math.max(0, limits.maxTokensPerDay - currentUsage);

    // Check if adding these tokens would exceed daily limit
    if (currentUsage + requestedTokens > limits.maxTokensPerDay) {
      logger.warn('Daily token limit exceeded', {
        workspaceId,
        tier,
        currentUsage,
        requestedTokens,
        limit: limits.maxTokensPerDay,
      });
      return {
        allowed: false,
        reason: `Daily token limit exceeded. Used: ${currentUsage}/${limits.maxTokensPerDay}. Resets at midnight UTC.`,
        currentUsage,
        limit: limits.maxTokensPerDay,
        remaining,
      };
    }

    return {
      allowed: true,
      currentUsage,
      limit: limits.maxTokensPerDay,
      remaining: remaining - requestedTokens,
    };
  } catch (error) {
    markRedisUnhealthy();
    logger.error('Token limit check failed', { error, workspaceId });
    // On error, allow the request
    return {
      allowed: true,
      currentUsage: 0,
      limit: limits.maxTokensPerDay,
      remaining: limits.maxTokensPerDay,
    };
  }
}

/**
 * Track token usage after a successful AI operation
 *
 * @param workspaceId - The workspace ID
 * @param tokensUsed - Number of tokens actually used
 */
export async function trackTokenUsage(workspaceId: string, tokensUsed: number): Promise<void> {
  if (!shouldUseRedis() || !redis) {
    logger.debug('Redis unavailable - skipping token tracking', { workspaceId, tokensUsed });
    return;
  }

  try {
    const key = getDailyTokenKey(workspaceId);

    // Increment the counter
    await redis.incrby(key, tokensUsed);

    // Set expiration to end of day UTC (24 hours from midnight)
    // This ensures the key expires even if created late in the day
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setUTCHours(23, 59, 59, 999);
    const ttlSeconds = Math.ceil((endOfDay.getTime() - now.getTime()) / 1000) + 1;

    await redis.expire(key, ttlSeconds);

    markRedisHealthy();

    logger.debug('Token usage tracked', { workspaceId, tokensUsed, key });
  } catch (error) {
    markRedisUnhealthy();
    logger.error('Failed to track token usage', { error, workspaceId, tokensUsed });
    // Don't throw - tracking failure shouldn't break the main operation
  }
}

/**
 * Get current token usage for a workspace
 *
 * @param workspaceId - The workspace ID
 * @returns Current daily token usage, or 0 if unavailable
 */
export async function getTokenUsage(workspaceId: string): Promise<number> {
  if (!shouldUseRedis() || !redis) {
    return 0;
  }

  try {
    const key = getDailyTokenKey(workspaceId);
    const usage = await redis.get(key);
    markRedisHealthy();
    return usage ? parseInt(String(usage), 10) : 0;
  } catch (error) {
    markRedisUnhealthy();
    logger.error('Failed to get token usage', { error, workspaceId });
    return 0;
  }
}

export interface FileSizeLimitResult {
  allowed: boolean;
  reason?: string;
  fileSize: number;
  limit: number;
}

/**
 * Check if a file size is within the tier's limit
 *
 * @param fileSize - Size of the file in bytes
 * @param tier - The workspace's subscription tier
 * @returns Object indicating if the file size is allowed
 */
export function checkFileSizeLimit(fileSize: number, tier: WorkspaceTier): FileSizeLimitResult {
  const limits = TIER_LIMITS[tier];

  if (fileSize > limits.maxFileSize) {
    const limitMB = Math.round(limits.maxFileSize / (1024 * 1024));
    const fileMB = Math.round(fileSize / (1024 * 1024));
    return {
      allowed: false,
      reason: `File size (${fileMB}MB) exceeds limit (${limitMB}MB) for ${tier} tier`,
      fileSize,
      limit: limits.maxFileSize,
    };
  }

  return {
    allowed: true,
    fileSize,
    limit: limits.maxFileSize,
  };
}

/**
 * Enforce file size limit - throws if exceeded
 *
 * @param fileSize - Size of the file in bytes
 * @param tier - The workspace's subscription tier
 * @throws Error if file size exceeds limit
 */
export function enforceFileSizeLimit(fileSize: number, tier: WorkspaceTier): void {
  const result = checkFileSizeLimit(fileSize, tier);
  if (!result.allowed) {
    throw new Error(result.reason);
  }
}

/**
 * Create an AbortSignal that times out based on tier limits
 *
 * @param tier - The workspace's subscription tier
 * @returns AbortSignal that will abort after the tier's max duration
 */
export function createTimeoutSignal(tier: WorkspaceTier): AbortSignal {
  const limits = TIER_LIMITS[tier];
  return AbortSignal.timeout(limits.maxRunDuration);
}

/**
 * Create an AbortSignal with a custom timeout
 *
 * @param timeoutMs - Timeout in milliseconds
 * @returns AbortSignal that will abort after the specified duration
 */
export function createCustomTimeoutSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

/**
 * Get the Redis key for tracking concurrent runs
 */
function getConcurrentRunsKey(workspaceId: string): string {
  return `runs:concurrent:${workspaceId}`;
}

export interface ConcurrentRunResult {
  allowed: boolean;
  reason?: string;
  currentRuns: number;
  limit: number;
}

/**
 * Check if a workspace can start a new concurrent run
 *
 * @param workspaceId - The workspace ID
 * @param tier - The workspace's subscription tier
 * @returns Object indicating if a new run is allowed
 */
export async function checkConcurrentRunLimit(
  workspaceId: string,
  tier: WorkspaceTier
): Promise<ConcurrentRunResult> {
  const limits = TIER_LIMITS[tier];

  if (!shouldUseRedis() || !redis) {
    return {
      allowed: true,
      currentRuns: 0,
      limit: limits.maxConcurrentRuns,
    };
  }

  try {
    const key = getConcurrentRunsKey(workspaceId);
    const currentRunsStr = await redis.get(key);
    const currentRuns = currentRunsStr ? parseInt(String(currentRunsStr), 10) : 0;

    markRedisHealthy();

    if (currentRuns >= limits.maxConcurrentRuns) {
      return {
        allowed: false,
        reason: `Maximum concurrent runs (${limits.maxConcurrentRuns}) reached for ${tier} tier`,
        currentRuns,
        limit: limits.maxConcurrentRuns,
      };
    }

    return {
      allowed: true,
      currentRuns,
      limit: limits.maxConcurrentRuns,
    };
  } catch (error) {
    markRedisUnhealthy();
    logger.error('Concurrent run check failed', { error, workspaceId });
    return {
      allowed: true,
      currentRuns: 0,
      limit: limits.maxConcurrentRuns,
    };
  }
}

/**
 * Increment concurrent run count when starting a run
 * Returns a cleanup function to decrement when done
 *
 * @param workspaceId - The workspace ID
 * @returns Cleanup function to call when the run completes
 */
export async function startConcurrentRun(workspaceId: string): Promise<() => Promise<void>> {
  if (!shouldUseRedis() || !redis) {
    return async () => {}; // No-op cleanup
  }

  const key = getConcurrentRunsKey(workspaceId);

  try {
    await redis.incr(key);
    // Set a TTL as a safety net in case cleanup never happens (e.g., crash)
    await redis.expire(key, 3600); // 1 hour max
    markRedisHealthy();
  } catch (error) {
    markRedisUnhealthy();
    logger.error('Failed to start concurrent run tracking', { error, workspaceId });
  }

  // Return cleanup function
  return async () => {
    if (!shouldUseRedis() || !redis) return;

    try {
      const newCount = await redis.decr(key);
      // If count goes to 0 or below, delete the key
      if (newCount <= 0) {
        await redis.del(key);
      }
      markRedisHealthy();
    } catch (error) {
      markRedisUnhealthy();
      logger.error('Failed to end concurrent run tracking', { error, workspaceId });
    }
  };
}

/**
 * Estimate token count from text (rough approximation)
 * Uses ~4 characters per token as a rough estimate
 *
 * @param text - The text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English text
  // This is conservative to avoid underestimating
  return Math.ceil(text.length / 3.5);
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format token count to human-readable string
 */
export function formatTokens(tokens: number): string {
  if (tokens < 1000) return `${tokens}`;
  if (tokens < 1000000) return `${(tokens / 1000).toFixed(1)}K`;
  return `${(tokens / 1000000).toFixed(1)}M`;
}
