import { describe, it, expect } from 'vitest';
import { createErrorResponse, createSuccessResponse, createPaginatedResponse } from '@/lib/api-error-handler';

describe('createErrorResponse', () => {
  it('should handle authentication errors with 401', async () => {
    const error = new Error('Unauthorized');
    const response = createErrorResponse(error);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  it('should handle validation errors with 400', async () => {
    const error = new Error('Validation failed: invalid email');
    const response = createErrorResponse(error);

    expect(response.status).toBe(400);
  });

  it('should handle not found errors with 404', async () => {
    const error = new Error('Resource not found');
    const response = createErrorResponse(error);

    expect(response.status).toBe(404);
  });

  it('should handle duplicate/conflict errors with 409', async () => {
    const error = new Error('A resource with this email already exists');
    const response = createErrorResponse(error);

    expect(response.status).toBe(409);
  });

  it('should handle rate limit errors with 429', async () => {
    const error = new Error('Rate limit exceeded');
    const response = createErrorResponse(error);

    expect(response.status).toBe(429);
  });

  it('should handle service unavailable errors with 503', async () => {
    const error = new Error('API key not configured');
    const response = createErrorResponse(error);

    expect(response.status).toBe(503);
  });

  it('should default to 500 for unknown errors', async () => {
    const error = new Error('Something unexpected happened');
    const response = createErrorResponse(error);

    expect(response.status).toBe(500);
  });

  it('should handle non-Error objects', async () => {
    const error = 'String error message';
    const response = createErrorResponse(error);

    expect(response.status).toBe(500);
  });

  it('should include context in error response', async () => {
    const error = new Error('Test error');
    const response = createErrorResponse(error, 'User creation failed');

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });
});

describe('createSuccessResponse', () => {
  it('should create 200 response by default', () => {
    const response = createSuccessResponse({ id: '123', name: 'Test' });

    expect(response.status).toBe(200);
  });

  it('should accept custom status code', () => {
    const response = createSuccessResponse({ id: '123' }, 201);

    expect(response.status).toBe(201);
  });

  it('should wrap data in data property', async () => {
    const testData = { id: '123', name: 'Test' };
    const response = createSuccessResponse(testData);

    const json = await response.json();
    expect(json).toHaveProperty('data');
    expect(json.data).toEqual(testData);
  });
});

describe('createPaginatedResponse', () => {
  it('should include items and pagination metadata', async () => {
    const items = [{ id: '1' }, { id: '2' }];
    const pagination = {
      total: 100,
      limit: 10,
      offset: 0,
      hasMore: true,
    };

    const response = createPaginatedResponse(items, pagination);
    const json = await response.json();

    expect(json).toHaveProperty('items');
    expect(json).toHaveProperty('pagination');
    expect(json.items).toEqual(items);
    expect(json.pagination).toEqual(pagination);
  });

  it('should handle empty results', async () => {
    const items: any[] = [];
    const pagination = {
      total: 0,
      limit: 10,
      offset: 0,
      hasMore: false,
    };

    const response = createPaginatedResponse(items, pagination);
    const json = await response.json();

    expect(json.items).toEqual([]);
    expect(json.pagination.total).toBe(0);
  });
});





































































