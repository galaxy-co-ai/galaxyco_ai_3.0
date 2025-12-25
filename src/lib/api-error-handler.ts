import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

/**
 * Standardized API Error Handler
 * Provides consistent error handling across all API routes
 *
 * @module api-error-handler
 * @description Centralized error handling utility for API routes.
 * Automatically classifies errors and returns appropriate HTTP status codes
 * with user-friendly error messages.
 */

export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
  details?: unknown;
}

/**
 * Creates a standardized error response for API routes
 *
 * @param error - The error that occurred (Error instance or unknown)
 * @param context - Optional context string for logging (e.g., 'Create user error')
 * @returns NextResponse with standardized error format
 *
 * @example
 * ```typescript
 * try {
 *   // ... API logic
 * } catch (error) {
 *   return createErrorResponse(error, 'Create user error');
 * }
 * ```
 */
export function createErrorResponse(
  error: unknown,
  context?: string
): NextResponse<{ error: string }> {
  const errorDetails = error instanceof Error ? error : new Error(String(error));

  // Log error with context
  logger.error(context || 'API error', errorDetails);

  // Determine status code and user-friendly message
  const { statusCode, message } = classifyError(errorDetails);

  // Return standardized error response
  return NextResponse.json({ error: message }, { status: statusCode });
}

/**
 * Classifies errors and returns appropriate HTTP status code and user-friendly message
 *
 * @param error - The error to classify
 * @returns Object with statusCode and message
 * @internal
 */
function classifyError(error: Error): { statusCode: number; message: string } {
  const errorMessage = error.message.toLowerCase();

  // Authentication errors (401)
  if (
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('not authenticated') ||
    errorMessage.includes('user not found')
  ) {
    return {
      statusCode: 401,
      message: 'Authentication required. Please sign in.',
    };
  }

  // Authorization errors (403)
  if (
    errorMessage.includes('forbidden') ||
    errorMessage.includes('permission') ||
    errorMessage.includes('access denied') ||
    errorMessage.includes('not authorized')
  ) {
    return {
      statusCode: 403,
      message: 'You do not have permission to perform this action.',
    };
  }

  // Not found errors (404)
  if (
    errorMessage.includes('not found') ||
    errorMessage.includes('does not exist') ||
    errorMessage.includes('missing')
  ) {
    return {
      statusCode: 404,
      message: 'The requested resource was not found.',
    };
  }

  // Validation errors (400)
  if (
    errorMessage.includes('validation') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('bad request') ||
    errorMessage.includes('required')
  ) {
    return {
      statusCode: 400,
      message: 'Invalid request. Please check your input and try again.',
    };
  }

  // Conflict errors (409)
  if (
    errorMessage.includes('unique') ||
    errorMessage.includes('duplicate') ||
    errorMessage.includes('already exists') ||
    errorMessage.includes('conflict')
  ) {
    return {
      statusCode: 409,
      message: 'A resource with this information already exists.',
    };
  }

  // Rate limit errors (429)
  if (
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('429')
  ) {
    return {
      statusCode: 429,
      message: 'Too many requests. Please wait a moment and try again.',
    };
  }

  // Service unavailable errors (503)
  if (
    errorMessage.includes('api key') ||
    errorMessage.includes('openai_api_key') ||
    errorMessage.includes('service unavailable') ||
    errorMessage.includes('not configured') ||
    errorMessage.includes('503')
  ) {
    return {
      statusCode: 503,
      message: 'Service is temporarily unavailable. Please try again later.',
    };
  }

  // Database errors (500)
  if (
    errorMessage.includes('database') ||
    errorMessage.includes('query') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout')
  ) {
    return {
      statusCode: 500,
      message: 'Database error. Please try again.',
    };
  }

  // Default: Internal server error (500)
  // In development, return the actual error message for debugging
  if (process.env.NODE_ENV === 'development') {
    return {
      statusCode: 500,
      message: error.message || 'An unexpected error occurred.',
    };
  }

  return {
    statusCode: 500,
    message: 'An unexpected error occurred. Please try again.',
  };
}

/**
 * Wraps route handler functions with automatic error handling
 *
 * @param handler - The route handler function to wrap
 * @param context - Optional context string for error logging
 * @returns Wrapped handler that automatically catches and handles errors
 *
 * @example
 * ```typescript
 * export const GET = withErrorHandler(async (request: Request) => {
 *   // ... handler logic
 *   return NextResponse.json({ data: result });
 * }, 'Get users error');
 * ```
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T,
  context?: string
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await handler(...args);
    } catch (error) {
      return createErrorResponse(error, context);
    }
  }) as T;
}

/**
 * Creates a success response with consistent format
 *
 * @param data - The data to return in the response
 * @param statusCode - HTTP status code (default: 200)
 * @returns NextResponse with data wrapped in { data } object
 *
 * @example
 * ```typescript
 * return createSuccessResponse({ id: '123', name: 'John' }, 201);
 * ```
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse<{ data: T }> {
  return NextResponse.json({ data }, { status: statusCode });
}

/**
 * Creates a paginated response with consistent format
 *
 * @param items - Array of items for current page
 * @param pagination - Pagination metadata
 * @returns NextResponse with items and pagination info
 *
 * @example
 * ```typescript
 * return createPaginatedResponse(users, {
 *   total: 100,
 *   limit: 10,
 *   offset: 0,
 *   hasMore: true,
 * });
 * ```
 */
export function createPaginatedResponse<T>(
  items: T[],
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  }
): NextResponse<{
  items: T[];
  pagination: typeof pagination;
}> {
  return NextResponse.json({
    items,
    pagination,
  });
}
