/**
 * Observability Module - Sentry Performance Tracking
 *
 * This module provides utilities for tracking Neptune AI performance metrics
 * using Sentry's metrics and tracing capabilities.
 *
 * Metrics tracked:
 * - neptune.response_time - Request duration in milliseconds
 * - neptune.tokens_used - Token usage per request
 * - neptune.rag_results - Number of RAG results returned
 * - neptune.cache_access - Cache hits/misses by type
 * - neptune.db_query_time - Database query execution time
 * - neptune.errors - Error count by type
 */

import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

// ============================================================================
// NEPTUNE REQUEST TRACKING
// ============================================================================

export interface NeptuneRequestMetadata {
  userId?: string;
  workspaceId?: string;
  cached: boolean;
  tokensUsed: number;
  ragResultsCount: number;
}

/**
 * Track Neptune request performance
 * Records response time, token usage, and RAG metrics
 */
export function trackNeptuneRequest(duration: number, metadata: NeptuneRequestMetadata) {
  try {
    // Build tags for metrics
    const tags = {
      cached: metadata.cached.toString(),
      workspace: metadata.workspaceId || 'unknown',
      has_rag: (metadata.ragResultsCount > 0).toString(),
    };

    // Track response time distribution using custom event
    Sentry.captureEvent({
      message: 'Neptune Request',
      level: 'info',
      tags: {
        ...tags,
        metric_type: 'response_time',
      },
      extra: {
        duration,
        tokensUsed: metadata.tokensUsed,
        ragResultsCount: metadata.ragResultsCount,
      },
    });

    logger.debug('[Observability] Neptune request tracked', {
      duration,
      cached: metadata.cached,
      tokens: metadata.tokensUsed,
      ragResults: metadata.ragResultsCount,
    });
  } catch (error) {
    // Don't let observability failures break the app
    logger.warn('[Observability] Failed to track Neptune request', { error });
  }
}

// ============================================================================
// CACHE PERFORMANCE TRACKING
// ============================================================================

export type CacheType = 'context' | 'rag' | 'user_prefs';

/**
 * Track cache hit/miss events
 * Used to calculate cache hit rates
 */
export function trackCacheHit(cacheType: CacheType, hit: boolean) {
  try {
    // Track cache access using custom event
    Sentry.captureEvent({
      message: 'Neptune Cache Access',
      level: 'debug',
      tags: {
        metric_type: 'cache_access',
        cache_type: cacheType,
        hit: hit.toString(),
      },
    });

    logger.debug('[Observability] Cache access tracked', {
      type: cacheType,
      hit,
    });
  } catch (error) {
    logger.warn('[Observability] Failed to track cache hit', { error });
  }
}

// ============================================================================
// DATABASE QUERY TRACKING
// ============================================================================

/**
 * Track database query performance
 * Measures query execution time and flags slow queries (>500ms)
 */
export async function trackDatabaseQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = Date.now();

  try {
    const result = await queryFn();
    const duration = Date.now() - start;

    // Track query time using custom event
    if (duration > 100) {
      // Only track queries >100ms to reduce noise
      Sentry.captureEvent({
        message: 'Neptune Database Query',
        level: duration > 500 ? 'warning' : 'info',
        tags: {
          metric_type: 'db_query',
          query: queryName,
          slow_query: duration > 500 ? 'true' : 'false',
        },
        extra: { duration },
      });
    }

    // Flag slow queries for investigation
    if (duration > 500) {
      logger.warn('[Observability] Slow query detected', {
        query: queryName,
        duration,
      });
    }

    return result;
  } catch (error) {
    // Track query errors
    Sentry.captureException(error, {
      tags: {
        component: 'database',
        query: queryName,
      },
    });

    logger.error('[Observability] Database query error', {
      query: queryName,
      error,
    });

    throw error;
  }
}

// ============================================================================
// ERROR TRACKING
// ============================================================================

/**
 * Track Neptune-specific errors
 * Captures error context for debugging
 */
export function trackNeptuneError(error: Error, context: Record<string, any>) {
  try {
    Sentry.captureException(error, {
      tags: {
        component: 'neptune',
        error_type: error.name,
        workspace: context.workspaceId || 'unknown',
      },
      extra: context,
    });

    logger.error('[Observability] Neptune error tracked', {
      error: error.message,
      context,
    });
  } catch (observabilityError) {
    // Don't let observability failures break the app
    logger.warn('[Observability] Failed to track error', { observabilityError });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a performance span for complex operations
 * Use for operations that span multiple steps
 */
export function startPerformanceTransaction(name: string, operation: string) {
  try {
    // Using startSpan for newer Sentry API
    return Sentry.startSpan(
      {
        name,
        op: operation,
        attributes: { component: 'neptune' },
      },
      (span) => span
    );
  } catch (error) {
    logger.warn('[Observability] Failed to start span', { error });
    // Return a no-op span
    return {
      finish: () => {},
      setTag: () => {},
      setData: () => {},
    };
  }
}

/**
 * Track custom metric
 * Generic helper for tracking arbitrary metrics
 */
export function trackCustomMetric(
  name: string,
  value: number,
  type: 'counter' | 'gauge' | 'distribution' = 'gauge',
  tags: Record<string, string> = {}
) {
  try {
    // Track custom metrics using events
    Sentry.captureEvent({
      message: `Custom Metric: ${name}`,
      level: 'info',
      tags: {
        ...tags,
        metric_name: name,
        metric_type: type,
      },
      extra: { value },
    });
  } catch (error) {
    logger.warn('[Observability] Failed to track custom metric', { error });
  }
}
