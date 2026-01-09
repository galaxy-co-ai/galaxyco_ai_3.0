/**
 * Tests for Observability Module
 * 
 * Tests Sentry performance tracking, error tracking, and metrics collection
 * for Neptune AI and API routes across the GalaxyCo platform.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import {
  trackNeptuneRequest,
  trackCacheHit,
  trackDatabaseQuery,
  trackNeptuneError,
  startPerformanceTransaction,
  trackCustomMetric,
  trackAPIRoute,
  trackAPIError,
  withRouteTracking,
  createTimer,
  trackOperation,
  type NeptuneRequestMetadata,
  type APIRouteMetadata,
} from '@/lib/observability';
import { logger } from '@/lib/logger';

// Mock Sentry
vi.mock('@sentry/nextjs', () => ({
  captureEvent: vi.fn(),
  captureException: vi.fn(),
  startSpan: vi.fn(),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('observability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('trackNeptuneRequest', () => {
    it('should track successful Neptune request with metadata', () => {
      const metadata: NeptuneRequestMetadata = {
        userId: 'user-123',
        workspaceId: 'workspace-456',
        cached: false,
        tokensUsed: 150,
        ragResultsCount: 3,
      };

      trackNeptuneRequest(250, metadata);

      expect(Sentry.captureEvent).toHaveBeenCalledWith({
        message: 'Neptune Request',
        level: 'info',
        tags: {
          cached: 'false',
          workspace: 'workspace-456',
          has_rag: 'true',
          metric_type: 'response_time',
        },
        extra: {
          duration: 250,
          tokensUsed: 150,
          ragResultsCount: 3,
        },
      });

      expect(logger.debug).toHaveBeenCalledWith(
        '[Observability] Neptune request tracked',
        {
          duration: 250,
          cached: false,
          tokens: 150,
          ragResults: 3,
        }
      );
    });

    it('should track cached Neptune request', () => {
      const metadata: NeptuneRequestMetadata = {
        cached: true,
        tokensUsed: 0,
        ragResultsCount: 0,
      };

      trackNeptuneRequest(50, metadata);

      expect(Sentry.captureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.objectContaining({
            cached: 'true',
            has_rag: 'false',
          }),
        })
      );
    });

    it('should handle missing workspace ID', () => {
      const metadata: NeptuneRequestMetadata = {
        cached: false,
        tokensUsed: 100,
        ragResultsCount: 2,
      };

      trackNeptuneRequest(200, metadata);

      expect(Sentry.captureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.objectContaining({
            workspace: 'unknown',
          }),
        })
      );
    });

    it('should not throw if Sentry fails', () => {
      vi.mocked(Sentry.captureEvent).mockImplementationOnce(() => {
        throw new Error('Sentry error');
      });

      const metadata: NeptuneRequestMetadata = {
        cached: false,
        tokensUsed: 100,
        ragResultsCount: 1,
      };

      expect(() => trackNeptuneRequest(100, metadata)).not.toThrow();
      expect(logger.warn).toHaveBeenCalledWith(
        '[Observability] Failed to track Neptune request',
        expect.any(Object)
      );
    });
  });

  describe('trackCacheHit', () => {
    it('should track cache hit for context cache', () => {
      trackCacheHit('context', true);

      expect(Sentry.captureEvent).toHaveBeenCalledWith({
        message: 'Neptune Cache Access',
        level: 'debug',
        tags: {
          metric_type: 'cache_access',
          cache_type: 'context',
          hit: 'true',
        },
      });

      expect(logger.debug).toHaveBeenCalledWith(
        '[Observability] Cache access tracked',
        { type: 'context', hit: true }
      );
    });

    it('should track cache miss for RAG cache', () => {
      trackCacheHit('rag', false);

      expect(Sentry.captureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: {
            metric_type: 'cache_access',
            cache_type: 'rag',
            hit: 'false',
          },
        })
      );
    });

    it('should track user preferences cache', () => {
      trackCacheHit('user_prefs', true);

      expect(Sentry.captureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.objectContaining({
            cache_type: 'user_prefs',
          }),
        })
      );
    });

    it('should not throw if Sentry fails', () => {
      vi.mocked(Sentry.captureEvent).mockImplementationOnce(() => {
        throw new Error('Sentry error');
      });

      expect(() => trackCacheHit('context', true)).not.toThrow();
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('trackDatabaseQuery', () => {
    it('should track fast query (<100ms) without Sentry event', async () => {
      const queryFn = vi.fn().mockResolvedValue({ id: 1, name: 'Test' });

      const result = await trackDatabaseQuery('fetchUser', queryFn);

      expect(result).toEqual({ id: 1, name: 'Test' });
      expect(queryFn).toHaveBeenCalled();
      expect(Sentry.captureEvent).not.toHaveBeenCalled();
    });

    it('should track normal query (100-500ms) at info level', async () => {
      const queryFn = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ id: 1 }), 150)
          )
      );

      await trackDatabaseQuery('fetchData', queryFn);

      expect(Sentry.captureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Neptune Database Query',
          level: 'info',
          tags: expect.objectContaining({
            metric_type: 'db_query',
            query: 'fetchData',
            slow_query: 'false',
          }),
        })
      );
    });

    it('should track slow query (>500ms) at warning level', async () => {
      const queryFn = vi.fn().mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ id: 1 }), 600)
          )
      );

      await trackDatabaseQuery('slowQuery', queryFn);

      expect(Sentry.captureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'warning',
          tags: expect.objectContaining({
            slow_query: 'true',
          }),
        })
      );

      expect(logger.warn).toHaveBeenCalledWith(
        '[Observability] Slow query detected',
        expect.objectContaining({
          query: 'slowQuery',
        })
      );
    });

    it('should track query errors with Sentry', async () => {
      const queryError = new Error('Database connection failed');
      const queryFn = vi.fn().mockRejectedValue(queryError);

      await expect(trackDatabaseQuery('failedQuery', queryFn)).rejects.toThrow(
        'Database connection failed'
      );

      expect(Sentry.captureException).toHaveBeenCalledWith(
        queryError,
        expect.objectContaining({
          tags: {
            component: 'database',
            query: 'failedQuery',
          },
        })
      );

      expect(logger.error).toHaveBeenCalledWith(
        '[Observability] Database query error',
        expect.objectContaining({
          query: 'failedQuery',
          error: queryError,
        })
      );
    });
  });

  describe('trackNeptuneError', () => {
    it('should track Neptune errors with context', () => {
      const error = new Error('AI processing failed');
      error.name = 'AIProcessingError';

      const context = {
        workspaceId: 'workspace-123',
        userId: 'user-456',
        operation: 'generate_content',
      };

      trackNeptuneError(error, context);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: {
            component: 'neptune',
            error_type: 'AIProcessingError',
            workspace: 'workspace-123',
          },
          extra: context,
        })
      );

      expect(logger.error).toHaveBeenCalledWith(
        '[Observability] Neptune error tracked',
        {
          error: 'AI processing failed',
          context,
        }
      );
    });

    it('should handle unknown workspace in error context', () => {
      const error = new Error('Test error');
      trackNeptuneError(error, { userId: 'user-123' });

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: expect.objectContaining({
            workspace: 'unknown',
          }),
        })
      );
    });

    it('should not throw if Sentry fails', () => {
      vi.mocked(Sentry.captureException).mockImplementationOnce(() => {
        throw new Error('Sentry error');
      });

      const error = new Error('Test error');
      expect(() => trackNeptuneError(error, {})).not.toThrow();
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('startPerformanceTransaction', () => {
    it('should start a performance span', () => {
      const mockSpan = { id: 'span-123' };
      vi.mocked(Sentry.startSpan).mockReturnValue(mockSpan as any);

      const result = startPerformanceTransaction(
        'Neptune AI Processing',
        'ai.process'
      );

      expect(Sentry.startSpan).toHaveBeenCalledWith(
        {
          name: 'Neptune AI Processing',
          op: 'ai.process',
          attributes: { component: 'neptune' },
        },
        expect.any(Function)
      );

      expect(result).toEqual(mockSpan);
    });

    it('should return no-op span if Sentry fails', () => {
      vi.mocked(Sentry.startSpan).mockImplementationOnce(() => {
        throw new Error('Sentry error');
      });

      const result = startPerformanceTransaction('Test', 'test.op');

      expect(result).toHaveProperty('finish');
      expect(result).toHaveProperty('setTag');
      expect(result).toHaveProperty('setData');
      expect(() => result.finish()).not.toThrow();
    });
  });

  describe('trackCustomMetric', () => {
    it('should track gauge metric', () => {
      trackCustomMetric('active_users', 42, 'gauge', {
        workspace: 'workspace-123',
      });

      expect(Sentry.captureEvent).toHaveBeenCalledWith({
        message: 'Custom Metric: active_users',
        level: 'info',
        tags: {
          workspace: 'workspace-123',
          metric_name: 'active_users',
          metric_type: 'gauge',
        },
        extra: { value: 42 },
      });
    });

    it('should track counter metric', () => {
      trackCustomMetric('api_calls', 100, 'counter');

      expect(Sentry.captureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.objectContaining({
            metric_type: 'counter',
          }),
        })
      );
    });

    it('should track distribution metric', () => {
      trackCustomMetric('response_times', 250, 'distribution', {
        route: '/api/users',
      });

      expect(Sentry.captureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.objectContaining({
            metric_type: 'distribution',
            route: '/api/users',
          }),
        })
      );
    });

    it('should not throw if Sentry fails', () => {
      vi.mocked(Sentry.captureEvent).mockImplementationOnce(() => {
        throw new Error('Sentry error');
      });

      expect(() => trackCustomMetric('test', 1)).not.toThrow();
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('trackAPIRoute', () => {
    it('should not track fast routes (<100ms) without errors', () => {
      const metadata: APIRouteMetadata = {
        route: '/api/health',
        method: 'GET',
        statusCode: 200,
      };

      trackAPIRoute(50, metadata);

      expect(Sentry.captureEvent).not.toHaveBeenCalled();
    });

    it('should track normal route (100-500ms) at info level', () => {
      const metadata: APIRouteMetadata = {
        route: '/api/users',
        method: 'GET',
        statusCode: 200,
        workspaceId: 'workspace-123',
      };

      trackAPIRoute(250, metadata);

      expect(Sentry.captureEvent).toHaveBeenCalledWith({
        message: 'API Route Performance',
        level: 'info',
        tags: {
          metric_type: 'api_route',
          route: '/api/users',
          method: 'GET',
          performance: 'normal',
          status_code: '200',
          workspace: 'workspace-123',
          has_error: 'false',
        },
        extra: {
          duration: 250,
          error: undefined,
          userId: undefined,
        },
      });

      expect(logger.debug).toHaveBeenCalled();
    });

    it('should track slow route (500-2000ms) at warning level', () => {
      const metadata: APIRouteMetadata = {
        route: '/api/reports',
        method: 'POST',
        statusCode: 200,
      };

      trackAPIRoute(1000, metadata);

      expect(Sentry.captureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'warning',
          tags: expect.objectContaining({
            performance: 'slow',
          }),
        })
      );

      expect(logger.warn).toHaveBeenCalledWith(
        '[Observability] Slow API route',
        expect.any(Object)
      );
    });

    it('should track critical route (>2000ms) at error level', () => {
      const metadata: APIRouteMetadata = {
        route: '/api/heavy-operation',
        method: 'POST',
        statusCode: 200,
      };

      trackAPIRoute(3000, metadata);

      expect(Sentry.captureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          tags: expect.objectContaining({
            performance: 'critical',
          }),
        })
      );

      expect(logger.error).toHaveBeenCalled();
    });

    it('should track routes with errors at error level', () => {
      const metadata: APIRouteMetadata = {
        route: '/api/users',
        method: 'POST',
        statusCode: 500,
        error: 'Database connection failed',
      };

      trackAPIRoute(100, metadata);

      expect(Sentry.captureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'API Route Error',
          level: 'error',
          tags: expect.objectContaining({
            has_error: 'true',
          }),
          extra: expect.objectContaining({
            error: 'Database connection failed',
          }),
        })
      );
    });

    it('should track fast routes if they have errors', () => {
      const metadata: APIRouteMetadata = {
        route: '/api/test',
        method: 'GET',
        statusCode: 400,
        error: 'Validation failed',
      };

      trackAPIRoute(50, metadata);

      expect(Sentry.captureEvent).toHaveBeenCalled();
    });

    it('should not throw if Sentry fails', () => {
      vi.mocked(Sentry.captureEvent).mockImplementationOnce(() => {
        throw new Error('Sentry error');
      });

      const metadata: APIRouteMetadata = {
        route: '/api/test',
        method: 'GET',
        statusCode: 200,
      };

      expect(() => trackAPIRoute(200, metadata)).not.toThrow();
    });
  });

  describe('trackAPIError', () => {
    it('should track API errors with full context', () => {
      const error = new Error('Internal server error');
      const metadata = {
        route: '/api/workspaces/[id]',
        method: 'PUT' as const,
        workspaceId: 'workspace-123',
        userId: 'user-456',
      };

      trackAPIError(error, metadata);

      expect(Sentry.captureException).toHaveBeenCalledWith(error, {
        tags: {
          component: 'api',
          route: '/api/workspaces/[id]',
          method: 'PUT',
          workspace: 'workspace-123',
        },
        extra: {
          userId: 'user-456',
        },
      });

      expect(logger.error).toHaveBeenCalledWith(
        '[Observability] API error tracked',
        expect.objectContaining({
          route: '/api/workspaces/[id]',
          method: 'PUT',
          error: 'Internal server error',
        })
      );
    });

    it('should handle missing workspace ID', () => {
      const error = new Error('Test error');
      trackAPIError(error, { route: '/api/test', method: 'GET' });

      expect(Sentry.captureException).toHaveBeenCalledWith(
        error,
        expect.objectContaining({
          tags: expect.objectContaining({
            workspace: 'unknown',
          }),
        })
      );
    });
  });

  describe('withRouteTracking', () => {
    it('should wrap route handler and track successful requests', async () => {
      const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
        status: 200,
      });

      // Add delay to ensure >100ms for tracking
      const handler = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
        return mockResponse;
      });

      const wrappedHandler = withRouteTracking(handler, {
        route: '/api/test',
        method: 'GET',
      });

      const mockRequest = new Request('http://localhost:3000/api/test');
      const result = await wrappedHandler(mockRequest);

      expect(handler).toHaveBeenCalledWith(mockRequest, undefined);
      expect(result).toBe(mockResponse);
      expect(Sentry.captureEvent).toHaveBeenCalled();
    });

    it('should track errors and re-throw', async () => {
      const error = new Error('Handler error');
      const handler = vi.fn().mockRejectedValue(error);
      const wrappedHandler = withRouteTracking(handler, {
        route: '/api/test',
        method: 'POST',
      });

      const mockRequest = new Request('http://localhost:3000/api/test', {
        method: 'POST',
      });

      await expect(wrappedHandler(mockRequest)).rejects.toThrow('Handler error');

      expect(Sentry.captureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expect.objectContaining({
            route: '/api/test',
            method: 'POST',
            status_code: '500',
          }),
          extra: expect.objectContaining({
            error: 'Handler error',
          }),
        })
      );
    });

    it('should pass context to handler', async () => {
      const mockResponse = new Response('OK');
      const handler = vi.fn().mockResolvedValue(mockResponse);
      const wrappedHandler = withRouteTracking(handler, {
        route: '/api/items/[id]',
        method: 'GET',
      });

      const mockRequest = new Request('http://localhost:3000/api/items/123');
      const context = { params: { id: '123' } };

      await wrappedHandler(mockRequest, context);

      expect(handler).toHaveBeenCalledWith(mockRequest, context);
    });
  });

  describe('createTimer', () => {
    it('should create timer and measure elapsed time', () => {
      const timer = createTimer();

      // Wait a bit
      const start = Date.now();
      while (Date.now() - start < 10) {
        // busy wait
      }

      const elapsed = timer.elapsed();
      expect(elapsed).toBeGreaterThanOrEqual(10);
    });

    it('should return elapsed seconds', () => {
      const timer = createTimer();

      // Mock Date.now to control time
      const originalNow = Date.now;
      let currentTime = originalNow();
      Date.now = vi.fn(() => currentTime);

      currentTime += 2000; // Add 2 seconds

      const seconds = timer.elapsedSeconds();
      expect(seconds).toBe(2);

      Date.now = originalNow;
    });
  });

  describe('trackOperation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should track operations faster than 100ms without metrics', async () => {
      const operation = vi.fn().mockResolvedValue({ success: true });

      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      const promise = trackOperation('fastOp', operation);

      vi.advanceTimersByTime(50);
      await promise;

      expect(operation).toHaveBeenCalled();
      expect(Sentry.captureEvent).not.toHaveBeenCalled();
    });

    it('should track normal operations (100-500ms)', async () => {
      const operation = vi.fn().mockResolvedValue({ success: true });

      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      const promise = trackOperation('normalOp', operation, {
        workspace: 'workspace-123',
      });

      vi.advanceTimersByTime(200);
      await promise;

      expect(Sentry.captureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Custom Metric: operation.normalOp',
          tags: expect.objectContaining({
            workspace: 'workspace-123',
            performance: 'normal',
          }),
        })
      );
    });

    it('should warn on slow operations', async () => {
      const operation = vi.fn().mockResolvedValue({ success: true });

      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      const promise = trackOperation('slowOp', operation);

      vi.advanceTimersByTime(1000);
      await promise;

      expect(logger.warn).toHaveBeenCalledWith(
        '[Observability] Slow operation detected',
        expect.objectContaining({
          operation: 'slowOp',
          performance: 'slow',
        })
      );
    });

    it('should track operation errors', async () => {
      const error = new Error('Operation failed');
      const operation = vi.fn().mockRejectedValue(error);

      vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
      const promise = trackOperation('failedOp', operation, { user: 'user-123' });

      vi.advanceTimersByTime(150);

      await expect(promise).rejects.toThrow('Operation failed');

      expect(Sentry.captureEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Custom Metric: operation.failedOp.error',
          tags: expect.objectContaining({
            user: 'user-123',
            error: 'true',
          }),
        })
      );

      expect(logger.error).toHaveBeenCalledWith(
        '[Observability] Operation failed',
        expect.objectContaining({
          operation: 'failedOp',
          error: 'Operation failed',
        })
      );
    });
  });
});
