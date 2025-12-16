import { z } from 'zod';
import { registry, registerRoute, successResponse } from '../registry';
import { UserRefSchema } from '../schemas/common';

/**
 * Knowledge Base API Endpoints
 * 
 * Document storage, upload, and semantic search
 */

// Collection schema
const CollectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  itemCount: z.number().int(),
  color: z.string().optional().describe('Hex color code'),
  icon: z.string().optional().describe('Icon name or emoji'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('KnowledgeCollection');

// Document type enum
const DocumentTypeSchema = z.enum(['document', 'pdf', 'image', 'spreadsheet', 'presentation', 'text', 'markdown', 'code']);

// Knowledge item schema
const KnowledgeItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  type: DocumentTypeSchema,
  url: z.string().url(),
  fileSize: z.number().int().describe('Size in bytes'),
  contentType: z.string().describe('MIME type'),
  collectionId: z.string().uuid().optional(),
  collectionName: z.string().optional(),
  summary: z.string().optional().describe('AI-generated summary'),
  tags: z.array(z.string()),
  isPublic: z.boolean().default(false),
  shareToken: z.string().optional().describe('Public share token'),
  createdBy: UserRefSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('KnowledgeItem');

// Search result schema
const SearchResultSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  summary: z.string(),
  content: z.string().describe('Excerpt of matching content'),
  url: z.string().url(),
  collection: z.string().optional(),
  collectionColor: z.string().optional(),
  score: z.number().min(0).max(10).describe('Relevance score'),
  matchType: z.enum(['semantic', 'keyword', 'hybrid']),
  createdAt: z.string().datetime(),
}).openapi('KnowledgeSearchResult');

/**
 * POST /api/knowledge/upload
 * Upload document
 */
registerRoute({
  method: 'post',
  path: '/api/knowledge/upload',
  tags: ['Knowledge Base'],
  summary: 'Upload document',
  description: 'Upload a document to the knowledge base. AI will automatically extract text, generate summaries, and create embeddings for semantic search.',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.any().describe('File to upload (max 10MB)'),
            collectionId: z.string().uuid().optional().describe('Collection to add document to'),
            title: z.string().max(200).optional().describe('Custom title (defaults to filename)'),
            description: z.string().optional(),
            tags: z.string().optional().describe('Comma-separated tags'),
            isPublic: z.boolean().optional().describe('Make document publicly accessible'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Document uploaded successfully',
      content: {
        'application/json': {
          schema: successResponse(KnowledgeItemSchema),
        },
      },
    },
    413: {
      description: 'File too large',
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
            maxSize: z.string(),
          }),
        },
      },
    },
  },
});

/**
 * POST /api/knowledge/search
 * Search knowledge base
 */
registerRoute({
  method: 'post',
  path: '/api/knowledge/search',
  tags: ['Knowledge Base'],
  summary: 'Search knowledge base',
  description: 'Search documents using hybrid semantic + keyword search. Results are ranked by relevance.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            query: z.string().min(1).max(500).describe('Search query'),
            limit: z.number().int().min(1).max(50).default(10).optional(),
            collectionId: z.string().uuid().optional().describe('Filter by collection'),
            type: DocumentTypeSchema.optional().describe('Filter by document type'),
            includeContent: z.boolean().default(false).optional().describe('Include full content in results'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Search results',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            query: z.string(),
            results: z.array(SearchResultSchema),
            count: z.number().int(),
            hasMore: z.boolean(),
          })),
        },
      },
    },
  },
});

/**
 * GET /api/knowledge
 * List knowledge items
 */
registerRoute({
  method: 'get',
  path: '/api/knowledge',
  tags: ['Knowledge Base'],
  summary: 'List knowledge items',
  description: 'Get all knowledge base items and collections',
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
      collectionId: z.string().uuid().optional().describe('Filter by collection'),
      type: DocumentTypeSchema.optional().describe('Filter by type'),
      search: z.string().optional().describe('Keyword search in titles'),
    }),
  },
  responses: {
    200: {
      description: 'Knowledge items and collections',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            collections: z.array(CollectionSchema),
            items: z.array(KnowledgeItemSchema),
            pagination: z.object({
              page: z.number().int(),
              limit: z.number().int(),
              total: z.number().int(),
              totalPages: z.number().int(),
            }),
          })),
        },
      },
    },
  },
});

/**
 * GET /api/knowledge/[id]
 * Get knowledge item
 */
registerRoute({
  method: 'get',
  path: '/api/knowledge/{id}',
  tags: ['Knowledge Base'],
  summary: 'Get knowledge item',
  description: 'Retrieve a specific knowledge item with full details',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Knowledge item details',
      content: {
        'application/json': {
          schema: successResponse(KnowledgeItemSchema.extend({
            extractedText: z.string().optional().describe('Full extracted text'),
            metadata: z.record(z.any()).optional(),
          })),
        },
      },
    },
  },
});

/**
 * PUT /api/knowledge/[id]
 * Update knowledge item
 */
registerRoute({
  method: 'put',
  path: '/api/knowledge/{id}',
  tags: ['Knowledge Base'],
  summary: 'Update knowledge item',
  description: 'Update metadata for a knowledge item',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().max(200).optional(),
            description: z.string().optional(),
            collectionId: z.string().uuid().optional(),
            tags: z.array(z.string()).optional(),
            isPublic: z.boolean().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Knowledge item updated',
      content: {
        'application/json': {
          schema: successResponse(KnowledgeItemSchema),
        },
      },
    },
  },
});

/**
 * DELETE /api/knowledge/[id]
 * Delete knowledge item
 */
registerRoute({
  method: 'delete',
  path: '/api/knowledge/{id}',
  tags: ['Knowledge Base'],
  summary: 'Delete knowledge item',
  description: 'Permanently delete a knowledge item',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Knowledge item deleted',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            deleted: z.boolean(),
          })),
        },
      },
    },
  },
});

