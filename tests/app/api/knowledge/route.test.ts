/**
 * Tests for Knowledge API Routes
 * 
 * Tests knowledge base CRUD operations and search including:
 * - GET /api/knowledge - List collections and items
 * - DELETE /api/knowledge/[id] - Delete knowledge item
 * - POST /api/knowledge/search - Hybrid semantic + keyword search
 * - Authentication and authorization
 * - Rate limiting
 * - Vector database integration
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GET } from '@/app/api/knowledge/route';
import { DELETE } from '@/app/api/knowledge/[id]/route';
import { POST as SEARCH } from '@/app/api/knowledge/search/route';
import { getCurrentWorkspace } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { searchKnowledge, isVectorConfigured, deleteKnowledgeDocument } from '@/lib/vector';
import { logger } from '@/lib/logger';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getCurrentWorkspace: vi.fn(),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      knowledgeCollections: {
        findMany: vi.fn(),
      },
      knowledgeItems: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  },
}));

vi.mock('@/lib/vector', () => ({
  searchKnowledge: vi.fn(),
  isVectorConfigured: vi.fn(),
  deleteKnowledgeDocument: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/api-error-handler', () => ({
  createErrorResponse: vi.fn((error: any, message: string) => {
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }),
}));

describe('app/api/knowledge', () => {
  const mockWorkspaceId = 'workspace-123';
  const mockUserId = 'user-456';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful auth
    vi.mocked(getCurrentWorkspace).mockResolvedValue({
      workspaceId: mockWorkspaceId,
      userId: 'clerk-123',
    });
    
    // Default successful rate limit
    vi.mocked(rateLimit).mockResolvedValue({
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 3600000,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // GET /api/knowledge - LIST TESTS
  // ==========================================================================

  describe('GET /api/knowledge', () => {
    const mockCollections = [
      {
        id: 'col-1',
        name: 'Product Docs',
        description: 'Product documentation',
        itemCount: 5,
        color: '#FF6B6B',
        icon: 'book',
        createdAt: new Date('2024-01-15'),
      },
      {
        id: 'col-2',
        name: 'Marketing',
        description: 'Marketing materials',
        itemCount: 3,
        color: '#4ECDC4',
        icon: 'megaphone',
        createdAt: new Date('2024-01-10'),
      },
    ];

    const mockItems = [
      {
        id: 'item-1',
        title: 'API Documentation',
        type: 'document',
        content: 'API guide content here',
        summary: 'Comprehensive API guide',
        fileSize: 2048,
        createdAt: new Date('2024-01-15T10:00:00Z'),
        collection: {
          name: 'Product Docs',
        },
        creator: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      },
      {
        id: 'item-2',
        title: 'Brand Guidelines',
        type: 'document',
        content: 'Brand guidelines content',
        summary: null,
        fileSize: null,
        createdAt: new Date('2024-01-14T15:30:00Z'),
        collection: {
          name: 'Marketing',
        },
        creator: {
          id: 'user-2',
          firstName: null,
          lastName: null,
          email: 'jane@example.com',
        },
      },
    ];

    it('should return collections and items', async () => {
      vi.mocked(db.query.knowledgeCollections.findMany).mockResolvedValue(mockCollections as any);
      vi.mocked(db.query.knowledgeItems.findMany).mockResolvedValue(mockItems as any);

      const request = new Request('http://localhost/api/knowledge');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.collections).toHaveLength(2);
      expect(data.items).toHaveLength(2);
      expect(data.collections[0].name).toBe('Product Docs');
      expect(data.items[0].name).toBe('API Documentation');
    });

    it('should filter items by collection ID', async () => {
      vi.mocked(db.query.knowledgeCollections.findMany).mockResolvedValue(mockCollections as any);
      vi.mocked(db.query.knowledgeItems.findMany).mockResolvedValue([mockItems[0]] as any);

      const request = new Request('http://localhost/api/knowledge?collectionId=col-1');
      const response = await GET(request);
      
      const data = await response.json();
      expect(data.items).toHaveLength(1);
      expect(db.query.knowledgeItems.findMany).toHaveBeenCalled();
    });

    it('should return empty arrays when no data', async () => {
      vi.mocked(db.query.knowledgeCollections.findMany).mockResolvedValue([]);
      vi.mocked(db.query.knowledgeItems.findMany).mockResolvedValue([]);

      const request = new Request('http://localhost/api/knowledge');
      const response = await GET(request);
      
      const data = await response.json();
      expect(data.collections).toEqual([]);
      expect(data.items).toEqual([]);
    });

    it('should format file sizes correctly', async () => {
      vi.mocked(db.query.knowledgeCollections.findMany).mockResolvedValue([]);
      vi.mocked(db.query.knowledgeItems.findMany).mockResolvedValue(mockItems as any);

      const request = new Request('http://localhost/api/knowledge');
      const response = await GET(request);
      
      const data = await response.json();
      expect(data.items[0].size).toBe('2.0 KB');
      expect(data.items[1].size).toBe('N/A');
    });

    it('should format relative time correctly', async () => {
      const recentItem = {
        ...mockItems[0],
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
      };
      
      vi.mocked(db.query.knowledgeCollections.findMany).mockResolvedValue([]);
      vi.mocked(db.query.knowledgeItems.findMany).mockResolvedValue([recentItem] as any);

      const request = new Request('http://localhost/api/knowledge');
      const response = await GET(request);
      
      const data = await response.json();
      expect(data.items[0].createdAt).toMatch(/30 min ago/);
    });

    it('should handle rate limit exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({
        success: false,
        limit: 100,
        remaining: 0,
        reset: Date.now() + 1800000,
      });

      const request = new Request('http://localhost/api/knowledge');
      const response = await GET(request);
      
      expect(response.status).toBe(429);
      
      const data = await response.json();
      expect(data.error).toContain('Rate limit exceeded');
      
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('should require authentication', async () => {
      vi.mocked(getCurrentWorkspace).mockRejectedValue(new Error('Unauthorized'));

      const request = new Request('http://localhost/api/knowledge');
      const response = await GET(request);
      
      expect(response.status).toBe(500);
    });

    it('should handle database errors', async () => {
      vi.mocked(db.query.knowledgeCollections.findMany).mockRejectedValue(
        new Error('Database connection failed')
      );

      const request = new Request('http://localhost/api/knowledge');
      const response = await GET(request);
      
      expect(response.status).toBe(500);
    });

    it('should handle creator name fallbacks', async () => {
      const itemNoName = {
        ...mockItems[0],
        creator: {
          id: 'user-3',
          firstName: null,
          lastName: null,
          email: 'user@example.com',
        },
      };
      
      vi.mocked(db.query.knowledgeCollections.findMany).mockResolvedValue([]);
      vi.mocked(db.query.knowledgeItems.findMany).mockResolvedValue([itemNoName] as any);

      const request = new Request('http://localhost/api/knowledge');
      const response = await GET(request);
      
      const data = await response.json();
      expect(data.items[0].createdBy).toBe('user@example.com');
    });
  });

  // ==========================================================================
  // DELETE /api/knowledge/[id] - DELETE TESTS
  // ==========================================================================

  describe('DELETE /api/knowledge/[id]', () => {
    const mockItem = {
      id: 'item-123',
      title: 'Test Document',
      workspaceId: mockWorkspaceId,
    };

    it('should delete knowledge item successfully', async () => {
      vi.mocked(db.query.knowledgeItems.findFirst).mockResolvedValue(mockItem as any);
      vi.mocked(deleteKnowledgeDocument).mockResolvedValue();

      const request = new Request('http://localhost/api/knowledge/item-123', {
        method: 'DELETE',
      });
      
      const response = await DELETE(
        request,
        { params: Promise.resolve({ id: 'item-123' }) }
      );
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      
      expect(deleteKnowledgeDocument).toHaveBeenCalledWith('item-123', mockWorkspaceId);
      expect(logger.info).toHaveBeenCalledWith('Knowledge item deleted successfully', expect.any(Object));
    });

    it('should return 404 when item not found', async () => {
      vi.mocked(db.query.knowledgeItems.findFirst).mockResolvedValue(null);

      const request = new Request('http://localhost/api/knowledge/nonexistent', {
        method: 'DELETE',
      });
      
      const response = await DELETE(
        request,
        { params: Promise.resolve({ id: 'nonexistent' }) }
      );
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.error).toBe('Document not found');
    });

    it('should enforce workspace isolation', async () => {
      const otherWorkspaceItem = {
        ...mockItem,
        workspaceId: 'other-workspace',
      };
      
      vi.mocked(db.query.knowledgeItems.findFirst).mockResolvedValue(null);

      const request = new Request('http://localhost/api/knowledge/item-123', {
        method: 'DELETE',
      });
      
      const response = await DELETE(
        request,
        { params: Promise.resolve({ id: 'item-123' }) }
      );
      
      expect(response.status).toBe(404);
    });

    it('should continue when vector deletion fails', async () => {
      vi.mocked(db.query.knowledgeItems.findFirst).mockResolvedValue(mockItem as any);
      vi.mocked(deleteKnowledgeDocument).mockRejectedValue(new Error('Vector DB error'));

      const request = new Request('http://localhost/api/knowledge/item-123', {
        method: 'DELETE',
      });
      
      const response = await DELETE(
        request,
        { params: Promise.resolve({ id: 'item-123' }) }
      );
      
      expect(response.status).toBe(200);
      expect(logger.warn).toHaveBeenCalledWith(
        'Failed to delete from vector database (non-critical)',
        expect.any(Object)
      );
    });

    it('should handle rate limit exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({
        success: false,
        limit: 100,
        remaining: 0,
        reset: Date.now() + 1800000,
      });

      const request = new Request('http://localhost/api/knowledge/item-123', {
        method: 'DELETE',
      });
      
      const response = await DELETE(
        request,
        { params: Promise.resolve({ id: 'item-123' }) }
      );
      
      expect(response.status).toBe(429);
    });

    it('should require authentication', async () => {
      vi.mocked(getCurrentWorkspace).mockRejectedValue(new Error('Unauthorized'));

      const request = new Request('http://localhost/api/knowledge/item-123', {
        method: 'DELETE',
      });
      
      const response = await DELETE(
        request,
        { params: Promise.resolve({ id: 'item-123' }) }
      );
      
      expect(response.status).toBe(500);
    });
  });

  // ==========================================================================
  // POST /api/knowledge/search - SEARCH TESTS
  // ==========================================================================

  describe('POST /api/knowledge/search', () => {
    const mockSearchResults = {
      results: [
        {
          itemId: 'item-1',
          score: 0.95,
          chunk: 'This is a relevant chunk about API authentication...',
        },
        {
          itemId: 'item-2',
          score: 0.78,
          chunk: 'Another relevant chunk about API endpoints...',
        },
      ],
    };

    const mockDbItems = [
      {
        id: 'item-1',
        title: 'API Authentication Guide',
        type: 'document',
        summary: 'Learn about API authentication',
        content: 'Full content here...',
        sourceUrl: 'https://example.com/api-auth',
        createdAt: new Date('2024-01-15'),
        collection: {
          name: 'API Docs',
          color: '#FF6B6B',
        },
      },
      {
        id: 'item-2',
        title: 'API Endpoints Reference',
        type: 'document',
        summary: 'Complete endpoint list',
        content: 'Full content here...',
        sourceUrl: 'https://example.com/api-endpoints',
        createdAt: new Date('2024-01-14'),
        collection: {
          name: 'API Docs',
          color: '#FF6B6B',
        },
      },
    ];

    beforeEach(() => {
      vi.mocked(isVectorConfigured).mockReturnValue(true);
    });

    it('should perform hybrid search successfully', async () => {
      vi.mocked(searchKnowledge).mockResolvedValue(mockSearchResults as any);
      vi.mocked(db.query.knowledgeItems.findMany).mockResolvedValue(mockDbItems as any);

      const request = new Request('http://localhost/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'API authentication' }),
      });
      
      const response = await SEARCH(request);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.query).toBe('API authentication');
      expect(data.results).toBeDefined();
      expect(data.count).toBeGreaterThan(0);
      
      expect(searchKnowledge).toHaveBeenCalledWith(
        mockWorkspaceId,
        'API authentication',
        expect.objectContaining({ topK: 20, minScore: 0.4 })
      );
    });

    it('should validate required query field', async () => {
      const request = new Request('http://localhost/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '' }),
      });
      
      const response = await SEARCH(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.error).toBe('Validation failed');
    });

    it('should validate query max length', async () => {
      const longQuery = 'a'.repeat(501);
      
      const request = new Request('http://localhost/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: longQuery }),
      });
      
      const response = await SEARCH(request);
      
      expect(response.status).toBe(400);
    });

    it('should accept optional limit parameter', async () => {
      vi.mocked(searchKnowledge).mockResolvedValue({ results: [] } as any);
      vi.mocked(db.query.knowledgeItems.findMany).mockResolvedValue([]);

      const request = new Request('http://localhost/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test', limit: 5 }),
      });
      
      const response = await SEARCH(request);
      
      expect(response.status).toBe(200);
      
      expect(searchKnowledge).toHaveBeenCalledWith(
        mockWorkspaceId,
        'test',
        expect.objectContaining({ topK: 10 })
      );
    });

    it('should filter by collection ID', async () => {
      vi.mocked(searchKnowledge).mockResolvedValue({ results: [] } as any);
      vi.mocked(db.query.knowledgeItems.findMany).mockResolvedValue([]);

      const request = new Request('http://localhost/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'test',
          collectionId: '550e8400-e29b-41d4-a716-446655440000',
        }),
      });
      
      const response = await SEARCH(request);
      
      expect(response.status).toBe(200);
    });

    it('should fallback to keyword search when vector search fails', async () => {
      vi.mocked(searchKnowledge).mockRejectedValue(new Error('Vector DB error'));
      vi.mocked(db.query.knowledgeItems.findMany).mockResolvedValue(mockDbItems as any);

      const request = new Request('http://localhost/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'API' }),
      });
      
      const response = await SEARCH(request);
      
      expect(response.status).toBe(200);
      expect(logger.error).toHaveBeenCalledWith('Vector search failed', expect.any(Error));
      
      const data = await response.json();
      expect(data.results.length).toBeGreaterThan(0);
    });

    it('should skip vector search when not configured', async () => {
      vi.mocked(isVectorConfigured).mockReturnValue(false);
      vi.mocked(db.query.knowledgeItems.findMany).mockResolvedValue(mockDbItems as any);

      const request = new Request('http://localhost/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'API' }),
      });
      
      const response = await SEARCH(request);
      
      expect(response.status).toBe(200);
      expect(searchKnowledge).not.toHaveBeenCalled();
    });

    it('should merge vector and keyword results', async () => {
      vi.mocked(searchKnowledge).mockResolvedValue({
        results: [
          {
            itemId: 'item-1',
            score: 0.95,
            chunk: 'Relevant chunk',
          },
        ],
      } as any);
      
      vi.mocked(db.query.knowledgeItems.findMany)
        .mockResolvedValueOnce(mockDbItems as any) // Vector items lookup
        .mockResolvedValueOnce([mockDbItems[0], mockDbItems[1]] as any); // Keyword search

      const request = new Request('http://localhost/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'API' }),
      });
      
      const response = await SEARCH(request);
      
      const data = await response.json();
      
      // Should boost items that match both vector and keyword
      const hybridMatch = data.results.find((r: any) => r.matchType === 'hybrid');
      expect(hybridMatch).toBeDefined();
    });

    it('should sort results by score', async () => {
      vi.mocked(searchKnowledge).mockResolvedValue({
        results: [
          { itemId: 'item-1', score: 0.95, chunk: 'High score' },
          { itemId: 'item-2', score: 0.60, chunk: 'Low score' },
        ],
      } as any);
      
      vi.mocked(db.query.knowledgeItems.findMany)
        .mockResolvedValueOnce(mockDbItems as any);

      const request = new Request('http://localhost/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'API' }),
      });
      
      const response = await SEARCH(request);
      const data = await response.json();
      
      // First result should have higher score
      expect(data.results[0].score).toBeGreaterThan(data.results[1].score);
    });

    it('should truncate content in results', async () => {
      const longContentItem = {
        ...mockDbItems[0],
        content: 'a'.repeat(500),
      };
      
      vi.mocked(searchKnowledge).mockResolvedValue({ results: [] } as any);
      vi.mocked(db.query.knowledgeItems.findMany).mockResolvedValue([longContentItem] as any);

      const request = new Request('http://localhost/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test' }),
      });
      
      const response = await SEARCH(request);
      const data = await response.json();
      
      expect(data.results[0].content.length).toBeLessThanOrEqual(303); // 300 + '...'
    });

    it('should handle rate limit exceeded', async () => {
      vi.mocked(rateLimit).mockResolvedValue({
        success: false,
        limit: 30,
        remaining: 0,
        reset: Date.now() + 60000,
      });

      const request = new Request('http://localhost/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test' }),
      });
      
      const response = await SEARCH(request);
      
      expect(response.status).toBe(429);
      
      const data = await response.json();
      expect(data.error).toContain('rate limit');
    });

    it('should require authentication', async () => {
      vi.mocked(getCurrentWorkspace).mockRejectedValue(new Error('Unauthorized'));

      const request = new Request('http://localhost/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test' }),
      });
      
      const response = await SEARCH(request);
      
      expect(response.status).toBe(500);
    });

    it('should return hasMore flag correctly', async () => {
      const manyResults = Array.from({ length: 15 }, (_, i) => ({
        itemId: `item-${i}`,
        score: 0.9 - i * 0.05,
        chunk: `Chunk ${i}`,
      }));
      
      vi.mocked(searchKnowledge).mockResolvedValue({ results: manyResults } as any);
      vi.mocked(db.query.knowledgeItems.findMany).mockResolvedValue(
        Array.from({ length: 15 }, (_, i) => ({
          ...mockDbItems[0],
          id: `item-${i}`,
        })) as any
      );

      const request = new Request('http://localhost/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'test', limit: 10 }),
      });
      
      const response = await SEARCH(request);
      const data = await response.json();
      
      expect(data.hasMore).toBe(true);
      expect(data.results.length).toBeLessThanOrEqual(10);
    });
  });
});
