/**
 * Observability Module - Sentry Performance Tracking
 *
 * This module provides utilities for tracking performance metrics across
 * the GalaxyCo platform, including Neptune AI and critical API routes.
 *
 * Metrics tracked:
 * - neptune.response_time - AI request duration in milliseconds
 * - neptune.tokens_used - Token usage per request
 * - neptune.rag_results - Number of RAG results returned
 * - neptune.cache_access - Cache hits/misses by type
 * - neptune.db_query_time - Database query execution time
 * - neptune.errors - Error count by type
 * - api.response_time - API route response times
 * - api.errors - API error tracking
 *
 * Performance Thresholds:
 * - Fast: <100ms (no tracking to reduce noise)
 * - Normal: 100-500ms (info level)
 * - Slow: 500-2000ms (warning level)
 * - Critical: >2000ms (error level)
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

// ============================================================================
// API ROUTE PERFORMANCE TRACKING
// ============================================================================

export interface APIRouteMetadata {
  route: string;           // e.g., '/api/workspaces/[id]'
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  workspaceId?: string;
  userId?: string;
  statusCode?: number;
  error?: string;
}

// Performance thresholds in milliseconds
const PERF_THRESHOLDS = {
  FAST: 100,      // Don't track (reduce noise)
  NORMAL: 500,    // Info level
  SLOW: 2000,     // Warning level
  CRITICAL: 5000, // Error level
} as const;

/**
 * Determine performance level based on duration
 */
function getPerformanceLevel(duration: number): 'fast' | 'normal' | 'slow' | 'critical' {
  if (duration < PERF_THRESHOLDS.FAST) return 'fast';
  if (duration < PERF_THRESHOLDS.NORMAL) return 'normal';
  if (duration < PERF_THRESHOLDS.SLOW) return 'slow';
  return 'critical';
}

/**
 * Track API route performance
 * Records response time and flags slow routes
 *
 * @example
 * ```ts
 * const startTime = Date.now();
 * try {
 *   // ... route handler logic
 *   trackAPIRoute(Date.now() - startTime, {
 *     route: '/api/workspaces/[id]',
 *     method: 'GET',
 *     workspaceId,
 *     statusCode: 200,
 *   });
 * } catch (error) {
 *   trackAPIRoute(Date.now() - startTime, {
 *     route: '/api/workspaces/[id]',
 *     method: 'GET',
 *     error: error.message,
 *     statusCode: 500,
 *   });
 * }
 * ```
 */
export function trackAPIRoute(duration: number, metadata: APIRouteMetadata) {
  try {
    const perfLevel = getPerformanceLevel(duration);

    // Skip tracking for fast routes to reduce noise
    if (perfLevel === 'fast' && !metadata.error) {
      return;
    }

    // Determine log level based on performance and errors
    let level: 'info' | 'warning' | 'error' = 'info';
    if (metadata.error || perfLevel === 'critical') {
      level = 'error';
    } else if (perfLevel === 'slow') {
      level = 'warning';
    }

    // Track via Sentry
    Sentry.captureEvent({
      message: metadata.error ? 'API Route Error' : 'API Route Performance',
      level,
      tags: {
        metric_type: 'api_route',
        route: metadata.route,
        method: metadata.method,
        performance: perfLevel,
        status_code: metadata.statusCode?.toString() || 'unknown',
        workspace: metadata.workspaceId || 'unknown',
        has_error: metadata.error ? 'true' : 'false',
      },
      extra: {
        duration,
        error: metadata.error,
        userId: metadata.userId,
      },
    });

    // Log based on level
    const logData = {
      route: metadata.route,
      method: metadata.method,
      duration,
      status: metadata.statusCode,
      performance: perfLevel,
    };

    if (level === 'error') {
      logger.error('[Observability] API route issue', {
        ...logData,
        error: metadata.error,
      });
    } else if (level === 'warning') {
      logger.warn('[Observability] Slow API route', logData);
    } else {
      logger.debug('[Observability] API route tracked', logData);
    }
  } catch (error) {
    // Don't let observability failures break the app
    logger.warn('[Observability] Failed to track API route', { error });
  }
}

/**
 * Track API error with full context
 * Use this for unhandled errors in API routes
 */
export function trackAPIError(
  error: Error,
  metadata: Omit<APIRouteMetadata, 'statusCode' | 'error'>
) {
  try {
    Sentry.captureException(error, {
      tags: {
        component: 'api',
        route: metadata.route,
        method: metadata.method,
        workspace: metadata.workspaceId || 'unknown',
      },
      extra: {
        userId: metadata.userId,
      },
    });

    logger.error('[Observability] API error tracked', {
      route: metadata.route,
      method: metadata.method,
      error: error.message,
      stack: error.stack,
    });
  } catch (observabilityError) {
    logger.warn('[Observability] Failed to track API error', { observabilityError });
  }
}

// ============================================================================
// ROUTE HANDLER WRAPPER
// ============================================================================

type NextRequest = Request;
type RouteHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<Response>;

interface WrapOptions {
  route: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

/**
 * Wrap an API route handler with automatic performance tracking
 *
 * @example
 * ```ts
 * // In your route.ts file:
 * import { withRouteTracking } from '@/lib/observability';
 *
 * async function handler(request: Request) {
 *   // ... your route logic
 *   return NextResponse.json({ data });
 * }
 *
 * export const GET = withRouteTracking(handler, {
 *   route: '/api/workspaces/[id]',
 *   method: 'GET',
 * });
 * ```
 */
export function withRouteTracking(
  handler: RouteHandler,
  options: WrapOptions
): RouteHandler {
  return async (request: NextRequest, context?: { params?: Record<string, string> }) => {
    const startTime = Date.now();
    let response: Response;
    let error: Error | undefined;

    try {
      response = await handler(request, context);
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err));
      // Re-throw after tracking
      const duration = Date.now() - startTime;
      trackAPIRoute(duration, {
        route: options.route,
        method: options.method,
        statusCode: 500,
        error: error.message,
      });
      throw err;
    }

    // Track successful completion
    const duration = Date.now() - startTime;
    trackAPIRoute(duration, {
      route: options.route,
      method: options.method,
      statusCode: response.status,
    });

    return response;
  };
}

// ============================================================================
// PERFORMANCE MONITORING UTILITIES
// ============================================================================

/**
 * Create a timer for measuring operation duration
 *
 * @example
 * ```ts
 * const timer = createTimer();
 * await someOperation();
 * const duration = timer.elapsed();
 * ```
 */
export function createTimer() {
  const startTime = Date.now();
  return {
    elapsed: () => Date.now() - startTime,
    elapsedSeconds: () => (Date.now() - startTime) / 1000,
  };
}

/**
 * Track a timed operation with automatic start/end
 *
 * @example
 * ```ts
 * const result = await trackOperation('fetchUserData', async () => {
 *   return await db.query.users.findFirst({ ... });
 * });
 * ```
 */
export async function trackOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  tags: Record<string, string> = {}
): Promise<T> {
  const timer = createTimer();

  try {
    const result = await operation();
    const duration = timer.elapsed();

    // Only track if operation took >100ms
    if (duration > PERF_THRESHOLDS.FAST) {
      const perfLevel = getPerformanceLevel(duration);
      trackCustomMetric(`operation.${operationName}`, duration, 'distribution', {
        ...tags,
        performance: perfLevel,
      });

      if (perfLevel === 'slow' || perfLevel === 'critical') {
        logger.warn('[Observability] Slow operation detected', {
          operation: operationName,
          duration,
          performance: perfLevel,
        });
      }
    }

    return result;
  } catch (error) {
    const duration = timer.elapsed();
    trackCustomMetric(`operation.${operationName}.error`, duration, 'counter', {
      ...tags,
      error: 'true',
    });

    logger.error('[Observability] Operation failed', {
      operation: operationName,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
}
