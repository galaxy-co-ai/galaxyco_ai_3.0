import { 
  OpenAPIRegistry, 
  type RouteConfig,
  extendZodWithOpenApi 
} from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

// Extend Zod with OpenAPI methods
extendZodWithOpenApi(z);

/**
 * Global OpenAPI Registry
 * 
 * This registry collects all schemas and route definitions.
 * Import this to register new endpoints.
 */
export const registry = new OpenAPIRegistry();

/**
 * Common Schema Components
 * Register reusable schemas that appear across multiple endpoints
 */

// UUID Schema
export const UUIDSchema = z.string().uuid().describe('Unique identifier (UUID v4)').openapi('UUID');

// Timestamp Schema
export const TimestampSchema = z.string().datetime().describe('ISO 8601 timestamp').openapi('Timestamp');

// Pagination Schemas
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional().describe('Page number'),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional().describe('Items per page'),
}).openapi('PaginationQuery');

export const PaginationResponseSchema = z.object({
  page: z.number().int().describe('Current page number'),
  limit: z.number().int().describe('Items per page'),
  total: z.number().int().describe('Total number of items'),
  totalPages: z.number().int().describe('Total number of pages'),
  hasMore: z.boolean().describe('Whether there are more pages'),
}).openapi('PaginationResponse');

// Success Response
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional().describe('Optional success message'),
}).openapi('SuccessResponse');

// Error Response
export const ErrorResponseSchema = z.object({
  error: z.string().describe('Error message'),
  details: z.record(z.any()).optional().describe('Additional error details'),
}).openapi('ErrorResponse');

// Activity Type Enum
export const ActivityTypeSchema = z.enum(['note', 'email', 'call', 'meeting', 'task', 'deal_created', 'deal_updated']).openapi('ActivityType');

// Contact Status Enum
export const ContactStatusSchema = z.enum(['active', 'inactive', 'archived']).openapi('ContactStatus');

// Deal Stage Enum
export const DealStageSchema = z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']).openapi('DealStage');

// Priority Enum
export const PrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']).openapi('Priority');

/**
 * Helper to create a standard success response
 */
export function successResponse<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  });
}

/**
 * Helper to create a standard list response with pagination
 */
export function paginatedResponse<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    pagination: PaginationResponseSchema,
  });
}

/**
 * Helper to register a route with consistent error responses
 */
export function registerRoute(config: RouteConfig) {
  // Automatically add standard error responses if not provided
  const responses = config.responses || {};
  
  if (!responses['400']) {
    responses['400'] = {
      description: 'Bad Request - Invalid input or validation error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    };
  }
  
  if (!responses['401']) {
    responses['401'] = {
      description: 'Unauthorized - Missing or invalid authentication',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    };
  }
  
  if (!responses['404']) {
    responses['404'] = {
      description: 'Not Found - Resource does not exist',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    };
  }
  
  if (!responses['429']) {
    responses['429'] = {
      description: 'Too Many Requests - Rate limit exceeded',
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
            retryAfter: z.number().optional(),
          }),
        },
      },
    };
  }
  
  if (!responses['500']) {
    responses['500'] = {
      description: 'Internal Server Error',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    };
  }
  
  return registry.registerPath({
    ...config,
    responses,
  });
}

