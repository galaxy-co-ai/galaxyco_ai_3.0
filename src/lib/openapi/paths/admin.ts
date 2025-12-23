import { z } from 'zod';
import { registerRoute, successResponse, paginatedResponse } from '../registry';
import { UserRefSchema } from '../schemas/common';

/**
 * Admin & Content Management API Endpoints
 * 
 * Blog posts, topics, sources, use cases, hit list, and AI content generation
 */

// Blog post schema
const BlogPostSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  content: z.string(),
  excerpt: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  categoryId: z.string().uuid().optional(),
  categoryName: z.string().optional(),
  tags: z.array(z.string()),
  featuredImage: z.string().url().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  publishedAt: z.string().datetime().optional(),
  author: UserRefSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('BlogPost');

// Topic idea schema
const TopicIdeaSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['idea', 'researching', 'writing', 'completed']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  targetKeywords: z.array(z.string()),
  estimatedWordCount: z.number().int().optional(),
  assignedTo: UserRefSchema.optional(),
  dueDate: z.string().datetime().optional(),
  aiGenerated: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('TopicIdea');

// Content source schema
const ContentSourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string().url(),
  type: z.enum(['article', 'research', 'documentation', 'blog', 'video', 'podcast', 'other']),
  credibilityScore: z.number().min(0).max(10).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()),
  lastAccessed: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('ContentSource');

// Use case schema
const UseCaseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  industry: z.string().optional(),
  problemStatement: z.string(),
  solution: z.string(),
  benefits: z.array(z.string()),
  metrics: z.object({
    timeSaved: z.string().optional(),
    costReduction: z.string().optional(),
    efficiencyGain: z.string().optional(),
  }).optional(),
  tags: z.array(z.string()),
  featured: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('UseCase');

// Hit list item schema
const HitListItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  priority: z.number().int().min(1).max(100),
  status: z.enum(['backlog', 'todo', 'in_progress', 'done', 'cancelled']),
  type: z.enum(['feature', 'bug', 'improvement', 'content', 'other']),
  assignedTo: UserRefSchema.optional(),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('HitListItem');

/**
 * POST /api/admin/posts
 * Create blog post
 */
registerRoute({
  method: 'post',
  path: '/api/admin/posts',
  tags: ['Content & Admin'],
  summary: 'Create blog post',
  description: 'Create a new blog post',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().min(1).max(200),
            content: z.string().min(1),
            excerpt: z.string().optional(),
            status: z.enum(['draft', 'published']).default('draft'),
            categoryId: z.string().uuid().optional(),
            tags: z.array(z.string()).optional(),
            featuredImage: z.string().url().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Blog post created',
      content: {
        'application/json': {
          schema: successResponse(BlogPostSchema),
        },
      },
    },
  },
});

/**
 * GET /api/admin/posts
 * List blog posts
 */
registerRoute({
  method: 'get',
  path: '/api/admin/posts',
  tags: ['Content & Admin'],
  summary: 'List blog posts',
  description: 'Get all blog posts with filtering',
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
      status: z.enum(['draft', 'published', 'archived']).optional(),
      categoryId: z.string().uuid().optional(),
      search: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of blog posts',
      content: {
        'application/json': {
          schema: paginatedResponse(BlogPostSchema),
        },
      },
    },
  },
});

/**
 * PUT /api/admin/posts/[id]
 * Update blog post
 */
registerRoute({
  method: 'put',
  path: '/api/admin/posts/{id}',
  tags: ['Content & Admin'],
  summary: 'Update blog post',
  description: 'Update an existing blog post',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().min(1).max(200).optional(),
            content: z.string().optional(),
            status: z.enum(['draft', 'published', 'archived']).optional(),
            tags: z.array(z.string()).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Blog post updated',
      content: {
        'application/json': {
          schema: successResponse(BlogPostSchema),
        },
      },
    },
  },
});

/**
 * POST /api/admin/topics
 * Create topic idea
 */
registerRoute({
  method: 'post',
  path: '/api/admin/topics',
  tags: ['Content & Admin'],
  summary: 'Create topic idea',
  description: 'Create a new topic idea for content planning',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().min(1).max(200),
            description: z.string().optional(),
            priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
            targetKeywords: z.array(z.string()).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Topic idea created',
      content: {
        'application/json': {
          schema: successResponse(TopicIdeaSchema),
        },
      },
    },
  },
});

/**
 * GET /api/admin/topics
 * List topic ideas
 */
registerRoute({
  method: 'get',
  path: '/api/admin/topics',
  tags: ['Content & Admin'],
  summary: 'List topic ideas',
  description: 'Get all topic ideas with filtering',
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
      status: z.enum(['idea', 'researching', 'writing', 'completed']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of topic ideas',
      content: {
        'application/json': {
          schema: paginatedResponse(TopicIdeaSchema),
        },
      },
    },
  },
});

/**
 * POST /api/admin/sources
 * Add content source
 */
registerRoute({
  method: 'post',
  path: '/api/admin/sources',
  tags: ['Content & Admin'],
  summary: 'Add content source',
  description: 'Add a new content source for research',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(1),
            url: z.string().url(),
            type: z.enum(['article', 'research', 'documentation', 'blog', 'video', 'podcast', 'other']),
            notes: z.string().optional(),
            tags: z.array(z.string()).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Content source added',
      content: {
        'application/json': {
          schema: successResponse(ContentSourceSchema),
        },
      },
    },
  },
});

/**
 * GET /api/admin/sources
 * List content sources
 */
registerRoute({
  method: 'get',
  path: '/api/admin/sources',
  tags: ['Content & Admin'],
  summary: 'List content sources',
  description: 'Get all content sources',
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
      type: z.enum(['article', 'research', 'documentation', 'blog', 'video', 'podcast', 'other']).optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of content sources',
      content: {
        'application/json': {
          schema: paginatedResponse(ContentSourceSchema),
        },
      },
    },
  },
});

/**
 * POST /api/admin/use-cases
 * Create use case
 */
registerRoute({
  method: 'post',
  path: '/api/admin/use-cases',
  tags: ['Content & Admin'],
  summary: 'Create use case',
  description: 'Create a new use case profile',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().min(1),
            description: z.string(),
            industry: z.string().optional(),
            problemStatement: z.string(),
            solution: z.string(),
            benefits: z.array(z.string()),
            tags: z.array(z.string()).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Use case created',
      content: {
        'application/json': {
          schema: successResponse(UseCaseSchema),
        },
      },
    },
  },
});

/**
 * GET /api/admin/use-cases
 * List use cases
 */
registerRoute({
  method: 'get',
  path: '/api/admin/use-cases',
  tags: ['Content & Admin'],
  summary: 'List use cases',
  description: 'Get all use case profiles',
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
      industry: z.string().optional(),
      featured: z.coerce.boolean().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of use cases',
      content: {
        'application/json': {
          schema: paginatedResponse(UseCaseSchema),
        },
      },
    },
  },
});

/**
 * POST /api/admin/hit-list
 * Add hit list item
 */
registerRoute({
  method: 'post',
  path: '/api/admin/hit-list',
  tags: ['Content & Admin'],
  summary: 'Add hit list item',
  description: 'Add a new item to the hit list',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string().min(1),
            description: z.string().optional(),
            priority: z.number().int().min(1).max(100).default(50),
            type: z.enum(['feature', 'bug', 'improvement', 'content', 'other']),
            tags: z.array(z.string()).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Hit list item added',
      content: {
        'application/json': {
          schema: successResponse(HitListItemSchema),
        },
      },
    },
  },
});

/**
 * GET /api/admin/hit-list
 * List hit list items
 */
registerRoute({
  method: 'get',
  path: '/api/admin/hit-list',
  tags: ['Content & Admin'],
  summary: 'List hit list items',
  description: 'Get all hit list items',
  request: {
    query: z.object({
      status: z.enum(['backlog', 'todo', 'in_progress', 'done', 'cancelled']).optional(),
      type: z.enum(['feature', 'bug', 'improvement', 'content', 'other']).optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of hit list items',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            items: z.array(HitListItemSchema),
            total: z.number().int(),
          })),
        },
      },
    },
  },
});

/**
 * POST /api/admin/ai/topics
 * Generate topic ideas with AI
 */
registerRoute({
  method: 'post',
  path: '/api/admin/ai/topics',
  tags: ['Content & Admin'],
  summary: 'Generate topic ideas',
  description: 'Use AI to generate content topic ideas',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            niche: z.string().optional().describe('Content niche or focus area'),
            count: z.number().int().min(1).max(20).default(5),
            keywords: z.array(z.string()).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Generated topic ideas',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            topics: z.array(z.object({
              title: z.string(),
              description: z.string(),
              keywords: z.array(z.string()),
              estimatedWordCount: z.number().int(),
            })),
          })),
        },
      },
    },
  },
});

/**
 * POST /api/admin/ai/outline
 * Generate article outline
 */
registerRoute({
  method: 'post',
  path: '/api/admin/ai/outline',
  tags: ['Content & Admin'],
  summary: 'Generate article outline',
  description: 'Use AI to generate an article outline',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            title: z.string(),
            targetWordCount: z.number().int().min(100).optional(),
            keywords: z.array(z.string()).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Generated outline',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            outline: z.array(z.object({
              heading: z.string(),
              subheadings: z.array(z.string()),
              points: z.array(z.string()),
            })),
          })),
        },
      },
    },
  },
});

/**
 * POST /api/admin/ai/rewrite
 * Rewrite content with AI
 */
registerRoute({
  method: 'post',
  path: '/api/admin/ai/rewrite',
  tags: ['Content & Admin'],
  summary: 'Rewrite content',
  description: 'Use AI to rewrite or improve content',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            content: z.string().min(1),
            style: z.enum(['professional', 'casual', 'technical', 'creative']).optional(),
            tone: z.enum(['formal', 'friendly', 'authoritative', 'conversational']).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Rewritten content',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            rewritten: z.string(),
            improvements: z.array(z.string()).optional(),
          })),
        },
      },
    },
  },
});

/**
 * POST /api/admin/ai/image
 * Generate image with AI
 */
registerRoute({
  method: 'post',
  path: '/api/admin/ai/image',
  tags: ['Content & Admin'],
  summary: 'Generate image',
  description: 'Use AI (DALL-E 3) to generate an image',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            prompt: z.string().min(1).max(1000),
            size: z.enum(['1024x1024', '1792x1024', '1024x1792']).default('1024x1024').optional(),
            quality: z.enum(['standard', 'hd']).default('standard').optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Generated image',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            url: z.string().url(),
            revisedPrompt: z.string().optional(),
          })),
        },
      },
    },
  },
});

/**
 * GET /api/admin/metrics
 * Get admin metrics
 */
registerRoute({
  method: 'get',
  path: '/api/admin/metrics',
  tags: ['Content & Admin'],
  summary: 'Get admin metrics',
  description: 'Retrieve comprehensive admin and content metrics',
  responses: {
    200: {
      description: 'Admin metrics',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            content: z.object({
              totalPosts: z.number().int(),
              publishedPosts: z.number().int(),
              draftPosts: z.number().int(),
              topicIdeas: z.number().int(),
            }),
            performance: z.object({
              avgReadTime: z.number(),
              totalViews: z.number().int(),
              engagementRate: z.number(),
            }),
            productivity: z.object({
              postsThisMonth: z.number().int(),
              postsLastMonth: z.number().int(),
              hitListProgress: z.number().min(0).max(100),
            }),
          })),
        },
      },
    },
  },
});

