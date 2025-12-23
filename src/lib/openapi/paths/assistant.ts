import { z } from 'zod';
import { registerRoute, successResponse } from '../registry';
import { UsageSchema } from '../schemas/common';

/**
 * AI Assistant / Neptune API Endpoints
 * 
 * These endpoints power the Neptune AI assistant with chat,
 * streaming, voice, insights, and conversation management.
 */

// Message role enum
const MessageRoleSchema = z.enum(['user', 'assistant', 'system']);

// Message schema
const MessageSchema = z.object({
  id: z.string().uuid(),
  role: MessageRoleSchema,
  content: z.string(),
  createdAt: z.string().datetime(),
  metadata: z.record(z.any()).optional(),
}).openapi('Message');

// Conversation schema
const ConversationSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  createdAt: z.string().datetime(),
  lastMessageAt: z.string().datetime().optional(),
  messageCount: z.number().int(),
  isPinned: z.boolean(),
  userId: z.string().uuid(),
}).openapi('Conversation');

// AI Preferences schema
const AIPreferencesSchema = z.object({
  autonomyLevel: z.enum(['ask_always', 'ask_for_risky', 'autonomous']).describe('How autonomous the AI should be'),
  preferredModel: z.enum(['gpt-4o', 'claude-3-5-sonnet', 'gemini-pro']).optional(),
  useRag: z.boolean().describe('Whether to use RAG for knowledge base search'),
  voiceEnabled: z.boolean().describe('Whether voice features are enabled'),
}).openapi('AIPreferences');

// Insight schema
const InsightSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['opportunity', 'risk', 'suggestion', 'summary']),
  title: z.string(),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  actionable: z.boolean(),
  suggestedAction: z.string().optional(),
  createdAt: z.string().datetime(),
}).openapi('Insight');

/**
 * POST /api/assistant/chat
 * Send a message to the AI assistant
 */
registerRoute({
  method: 'post',
  path: '/api/assistant/chat',
  tags: ['AI & Assistant'],
  summary: 'Send message to AI assistant',
  description: 'Send a message to Neptune AI and receive a response. This endpoint handles tool calling, context retrieval, and conversation management.',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().min(1).max(10000).describe('The user message'),
            conversationId: z.string().uuid().optional().describe('Existing conversation ID to continue'),
            context: z.object({
              workspace: z.string().optional(),
              currentPage: z.string().optional(),
              selectedData: z.record(z.any()).optional(),
            }).optional().describe('Additional context for the AI'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Successful response from AI',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            conversationId: z.string().uuid(),
            message: MessageSchema,
            usage: UsageSchema.optional(),
            toolCalls: z.array(z.object({
              name: z.string(),
              arguments: z.record(z.any()),
              result: z.any().optional(),
            })).optional(),
          })),
        },
      },
    },
  },
});

/**
 * POST /api/assistant/stream
 * Stream AI assistant responses
 */
registerRoute({
  method: 'post',
  path: '/api/assistant/stream',
  tags: ['AI & Assistant'],
  summary: 'Stream AI responses',
  description: 'Send a message and receive a streaming response via Server-Sent Events (SSE)',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().min(1).max(10000),
            conversationId: z.string().uuid().optional(),
            context: z.record(z.any()).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'SSE stream of AI response chunks',
      content: {
        'text/event-stream': {
          schema: z.object({
            content: z.string().describe('Response chunk'),
            done: z.boolean().optional().describe('True when stream is complete'),
          }),
        },
      },
    },
  },
});

/**
 * GET /api/assistant/conversations
 * List conversations
 */
registerRoute({
  method: 'get',
  path: '/api/assistant/conversations',
  tags: ['AI & Assistant'],
  summary: 'List conversations',
  description: 'Get all AI conversations for the current user',
  request: {
    query: z.object({
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
      offset: z.coerce.number().int().min(0).default(0).optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of conversations',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            conversations: z.array(ConversationSchema),
            total: z.number().int(),
          })),
        },
      },
    },
  },
});

/**
 * GET /api/assistant/conversations/[id]
 * Get conversation details
 */
registerRoute({
  method: 'get',
  path: '/api/assistant/conversations/{id}',
  tags: ['AI & Assistant'],
  summary: 'Get conversation',
  description: 'Retrieve a specific conversation with full message history',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Conversation details',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            conversation: ConversationSchema,
            messages: z.array(MessageSchema),
          })),
        },
      },
    },
  },
});

/**
 * DELETE /api/assistant/conversations/[id]
 * Delete conversation
 */
registerRoute({
  method: 'delete',
  path: '/api/assistant/conversations/{id}',
  tags: ['AI & Assistant'],
  summary: 'Delete conversation',
  description: 'Permanently delete a conversation and all its messages',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Successfully deleted',
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

/**
 * GET /api/assistant/greeting
 * Get dynamic greeting
 */
registerRoute({
  method: 'get',
  path: '/api/assistant/greeting',
  tags: ['AI & Assistant'],
  summary: 'Get personalized greeting',
  description: 'Get a dynamic, context-aware greeting from Neptune AI',
  responses: {
    200: {
      description: 'Personalized greeting',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            greeting: z.string(),
            timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']),
          })),
        },
      },
    },
  },
});

/**
 * GET /api/assistant/briefing
 * Get daily briefing
 */
registerRoute({
  method: 'get',
  path: '/api/assistant/briefing',
  tags: ['AI & Assistant'],
  summary: 'Get daily briefing',
  description: 'Get an AI-generated daily briefing with important updates and tasks',
  responses: {
    200: {
      description: 'Daily briefing',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            briefing: z.string(),
            highlights: z.array(z.string()),
            tasks: z.array(z.object({
              title: z.string(),
              priority: z.enum(['low', 'medium', 'high', 'urgent']),
              dueDate: z.string().datetime().optional(),
            })),
            metrics: z.record(z.any()).optional(),
          })),
        },
      },
    },
  },
});

/**
 * GET /api/assistant/insights
 * Get proactive insights
 */
registerRoute({
  method: 'get',
  path: '/api/assistant/insights',
  tags: ['AI & Assistant'],
  summary: 'Get AI insights',
  description: 'Get proactive AI-generated insights about your business',
  request: {
    query: z.object({
      type: z.enum(['opportunity', 'risk', 'suggestion', 'all']).optional().describe('Filter by insight type'),
      limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of insights',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            insights: z.array(InsightSchema),
            total: z.number().int(),
          })),
        },
      },
    },
  },
});

/**
 * GET /api/assistant/preferences
 * Get AI preferences
 */
registerRoute({
  method: 'get',
  path: '/api/assistant/preferences',
  tags: ['AI & Assistant'],
  summary: 'Get AI preferences',
  description: 'Get user AI preferences and settings',
  responses: {
    200: {
      description: 'AI preferences',
      content: {
        'application/json': {
          schema: successResponse(AIPreferencesSchema),
        },
      },
    },
  },
});

/**
 * PUT /api/assistant/preferences
 * Update AI preferences
 */
registerRoute({
  method: 'put',
  path: '/api/assistant/preferences',
  tags: ['AI & Assistant'],
  summary: 'Update AI preferences',
  description: 'Update user AI preferences and settings',
  request: {
    body: {
      content: {
        'application/json': {
          schema: AIPreferencesSchema.partial(),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Updated preferences',
      content: {
        'application/json': {
          schema: successResponse(AIPreferencesSchema),
        },
      },
    },
  },
});

/**
 * POST /api/assistant/upload
 * Upload file for context
 */
registerRoute({
  method: 'post',
  path: '/api/assistant/upload',
  tags: ['AI & Assistant'],
  summary: 'Upload file for AI context',
  description: 'Upload a file to provide context to the AI assistant (images, documents, etc.)',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.any().describe('File to upload (max 10MB)'),
            conversationId: z.string().uuid().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'File uploaded and processed',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            fileId: z.string().uuid(),
            url: z.string().url(),
            analysis: z.string().optional().describe('AI analysis of the file'),
            extractedText: z.string().optional(),
          })),
        },
      },
    },
  },
});

/**
 * POST /api/assistant/voice/speak
 * Text-to-speech
 */
registerRoute({
  method: 'post',
  path: '/api/assistant/voice/speak',
  tags: ['AI & Assistant'],
  summary: 'Text-to-speech',
  description: 'Convert text to speech audio',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            text: z.string().min(1).max(4000),
            voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional(),
            speed: z.number().min(0.25).max(4.0).default(1.0).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Audio file',
      content: {
        'audio/mpeg': {
          schema: z.any(),
        },
      },
    },
  },
});

/**
 * POST /api/assistant/voice/transcribe
 * Speech-to-text
 */
registerRoute({
  method: 'post',
  path: '/api/assistant/voice/transcribe',
  tags: ['AI & Assistant'],
  summary: 'Speech-to-text',
  description: 'Transcribe audio to text',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            audio: z.any().describe('Audio file (mp3, wav, m4a, etc.)'),
            language: z.string().optional().describe('ISO language code (e.g., en, es, fr)'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Transcription result',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            text: z.string(),
            language: z.string().optional(),
            confidence: z.number().min(0).max(1).optional(),
          })),
        },
      },
    },
  },
});

