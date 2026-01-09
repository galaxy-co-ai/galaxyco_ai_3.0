/**
 * Tests for Session Memory System
 * 
 * Tests short-term conversational context, entity extraction, fact tracking,
 * topic detection, and auto-summarization for the AI platform.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  initializeSessionMemory,
  updateSessionMemory,
  buildSessionContext,
  getOptimizedConversationContext,
  clearSessionMemory,
  getRelevantEntities,
  getRelevantFacts,
  type SessionMemory,
  type Message,
  type ExtractedEntity,
  type ConversationFact,
} from '@/lib/ai/session-memory';
import { getCache, setCache } from '@/lib/cache';
import { logger } from '@/lib/logger';
import { getOpenAI } from '@/lib/ai-providers';

// Mock dependencies
vi.mock('@/lib/cache', () => ({
  getCache: vi.fn(),
  setCache: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/ai-providers', () => ({
  getOpenAI: vi.fn(),
}));

describe('ai/session-memory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00Z'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('initializeSessionMemory', () => {
    it('should create new session when none exists', async () => {
      vi.mocked(getCache).mockResolvedValue(null);
      vi.mocked(setCache).mockResolvedValue();

      const result = await initializeSessionMemory(
        'workspace-123',
        'user-456',
        'conv-789'
      );

      expect(result).toMatchObject({
        workspaceId: 'workspace-123',
        userId: 'user-456',
        conversationId: 'conv-789',
        entities: [],
        facts: [],
        currentTopic: null,
        topicHistory: [],
        summary: null,
        totalMessages: 0,
        windowStart: 0,
      });

      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      expect(setCache).toHaveBeenCalledWith(
        'session:memory:conv-789',
        expect.any(Object),
        { prefix: '', ttl: 14400 }
      );
      expect(logger.info).toHaveBeenCalledWith(
        '[SessionMemory] Initialized new session',
        { conversationId: 'conv-789' }
      );
    });

    it('should extend expiry for existing session', async () => {
      const existingSession: SessionMemory = {
        workspaceId: 'workspace-123',
        userId: 'user-456',
        conversationId: 'conv-789',
        entities: [
          {
            type: 'person',
            value: 'John Doe',
            context: 'CEO',
            confidence: 0.9,
            firstMentioned: new Date('2024-01-15T09:00:00Z'),
            lastMentioned: new Date('2024-01-15T09:30:00Z'),
            mentionCount: 3,
          },
        ],
        facts: [],
        currentTopic: 'CRM Discussion',
        topicHistory: [],
        summaryUpToMessage: 0,
        summary: null,
        totalMessages: 5,
        windowStart: 0,
        createdAt: new Date('2024-01-15T09:00:00Z'),
        updatedAt: new Date('2024-01-15T09:30:00Z'),
        expiresAt: new Date('2024-01-15T13:30:00Z'),
      };

      vi.mocked(getCache).mockResolvedValue(existingSession);
      vi.mocked(setCache).mockResolvedValue();

      const result = await initializeSessionMemory(
        'workspace-123',
        'user-456',
        'conv-789'
      );

      expect(result.entities).toHaveLength(1);
      expect(result.entities[0].value).toBe('John Doe');
      expect(result.totalMessages).toBe(5);
      // Expiry should be extended to now + 4 hours
      // At 10:00 (system time), expiry should be 14:00, which is > old 13:30
      const expectedMinExpiry = Date.now() + (4 * 60 * 60 * 1000);
      expect(result.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMinExpiry - 1000); // Allow 1s tolerance
      expect(setCache).toHaveBeenCalled();
    });

    it('should handle expired sessions by creating new', async () => {
      const expiredSession: SessionMemory = {
        workspaceId: 'workspace-123',
        userId: 'user-456',
        conversationId: 'conv-789',
        entities: [],
        facts: [],
        currentTopic: null,
        topicHistory: [],
        summaryUpToMessage: 0,
        summary: null,
        totalMessages: 10,
        windowStart: 0,
        createdAt: new Date('2024-01-14T10:00:00Z'),
        updatedAt: new Date('2024-01-14T10:00:00Z'),
        expiresAt: new Date('2024-01-14T14:00:00Z'), // Expired
      };

      vi.mocked(getCache).mockResolvedValue(expiredSession);
      vi.mocked(setCache).mockResolvedValue();

      const result = await initializeSessionMemory(
        'workspace-123',
        'user-456',
        'conv-789'
      );

      // Should create new session since expired
      expect(result.totalMessages).toBe(0);
      expect(result.createdAt.getTime()).toBe(Date.now());
    });

    it('should handle cache errors gracefully', async () => {
      vi.mocked(getCache).mockRejectedValue(new Error('Redis connection failed'));
      vi.mocked(setCache).mockResolvedValue();

      const result = await initializeSessionMemory(
        'workspace-123',
        'user-456',
        'conv-789'
      );

      expect(result).toMatchObject({
        workspaceId: 'workspace-123',
        userId: 'user-456',
        conversationId: 'conv-789',
      });
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('updateSessionMemory', () => {
    const mockSession: SessionMemory = {
      workspaceId: 'workspace-123',
      userId: 'user-456',
      conversationId: 'conv-789',
      entities: [],
      facts: [],
      currentTopic: null,
      topicHistory: [],
      summaryUpToMessage: 0,
      summary: null,
      totalMessages: 0,
      windowStart: 0,
      createdAt: new Date('2024-01-15T09:00:00Z'),
      updatedAt: new Date('2024-01-15T09:00:00Z'),
      expiresAt: new Date('2024-01-15T13:00:00Z'),
    };

    it('should return null when session not found', async () => {
      vi.mocked(getCache).mockResolvedValue(null);

      const result = await updateSessionMemory(
        'conv-789',
        { role: 'user', content: 'Hello' },
        []
      );

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        '[SessionMemory] No session found for update',
        { conversationId: 'conv-789' }
      );
    });

    it('should extract entities from user messages', async () => {
      vi.mocked(getCache).mockResolvedValue(mockSession);
      vi.mocked(setCache).mockResolvedValue();

      const mockOpenAI = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify([
                      {
                        type: 'person',
                        value: 'Alice',
                        context: 'mentioned in meeting',
                        confidence: 0.85,
                      },
                      {
                        type: 'company',
                        value: 'Acme Corp',
                        context: 'client company',
                        confidence: 0.9,
                      },
                    ]),
                  },
                },
              ],
            }),
          },
        },
      };
      vi.mocked(getOpenAI).mockReturnValue(mockOpenAI as any);

      const result = await updateSessionMemory(
        'conv-789',
        {
          role: 'user',
          content: 'Meeting with Alice from Acme Corp tomorrow',
        },
        [{ role: 'user', content: 'Meeting with Alice from Acme Corp tomorrow' }]
      );

      expect(result).not.toBeNull();
      expect(result!.entities).toHaveLength(2);
      expect(result!.entities[0].value).toBe('Alice');
      expect(result!.entities[1].value).toBe('Acme Corp');
      expect(result!.totalMessages).toBe(1);
      expect(setCache).toHaveBeenCalled();
    });

    it('should skip entity extraction for short messages', async () => {
      // Start with empty session, set totalMessages to avoid triggering topic detection
      const emptySession = { ...mockSession, entities: [], totalMessages: 1 };
      vi.mocked(getCache).mockResolvedValue(emptySession);
      vi.mocked(setCache).mockResolvedValue();

      const result = await updateSessionMemory(
        'conv-789',
        { role: 'user', content: 'Hi' },
        [{ role: 'user', content: 'Hi' }]
      );

      expect(result).not.toBeNull();
      expect(result!.entities).toHaveLength(0);
      // OpenAI may be called for topic detection, but not for entity extraction (short message)
    });

    it('should not extract entities from assistant messages', async () => {
      // Start with empty session, set totalMessages to not trigger topic detection (not multiple of 3)
      const emptySession = { ...mockSession, entities: [], totalMessages: 1 };
      vi.mocked(getCache).mockResolvedValue(emptySession);
      vi.mocked(setCache).mockResolvedValue();

      const result = await updateSessionMemory(
        'conv-789',
        {
          role: 'assistant',
          content: 'Here is information about Alice from Acme Corp',
        },
        [
          { role: 'assistant', content: 'Here is information about Alice from Acme Corp' },
        ]
      );

      expect(result).not.toBeNull();
      expect(result!.entities).toHaveLength(0);
      // Entity extraction is skipped for assistant messages
      // But topic detection might still be called
    });

    it('should extract facts every 4 messages', async () => {
      const sessionWith3Messages = {
        ...mockSession,
        totalMessages: 3,
      };

      vi.mocked(getCache).mockResolvedValue(sessionWith3Messages);
      vi.mocked(setCache).mockResolvedValue();

      const mockOpenAI = {
        chat: {
          completions: {
            create: vi.fn()
              .mockResolvedValueOnce({
                // Entity extraction call
                choices: [{ message: { content: '[]' } }],
              })
              .mockResolvedValueOnce({
                // Fact extraction call
                choices: [
                  {
                    message: {
                      content: JSON.stringify([
                        {
                          fact: 'User prefers morning meetings',
                          category: 'preference',
                          confidence: 0.8,
                          messageIndex: 3,
                        },
                      ]),
                    },
                  },
                ],
              }),
          },
        },
      };
      vi.mocked(getOpenAI).mockReturnValue(mockOpenAI as any);

      const messages: Message[] = [
        { role: 'user', content: 'Message 1' },
        { role: 'assistant', content: 'Response 1' },
        { role: 'user', content: 'Message 2' },
        { role: 'assistant', content: 'Response 2' },
      ];

      const result = await updateSessionMemory(
        'conv-789',
        { role: 'user', content: 'I prefer morning meetings' },
        messages
      );

      expect(result).not.toBeNull();
      expect(result!.facts).toHaveLength(1);
      expect(result!.facts[0].fact).toBe('User prefers morning meetings');
      expect(result!.facts[0].category).toBe('preference');
    });

    it('should detect topic every 3 messages', async () => {
      const sessionWith2Messages = {
        ...mockSession,
        totalMessages: 2,
      };

      vi.mocked(getCache).mockResolvedValue(sessionWith2Messages);
      vi.mocked(setCache).mockResolvedValue();

      const mockOpenAI = {
        chat: {
          completions: {
            create: vi.fn()
              .mockResolvedValueOnce({
                // Entity extraction
                choices: [{ message: { content: '[]' } }],
              })
              .mockResolvedValueOnce({
                // Topic detection
                choices: [
                  {
                    message: {
                      content: 'Marketing campaign planning',
                    },
                  },
                ],
              }),
          },
        },
      };
      vi.mocked(getOpenAI).mockReturnValue(mockOpenAI as any);

      const messages: Message[] = [
        { role: 'user', content: 'Tell me about marketing' },
        { role: 'assistant', content: 'Here is info about marketing' },
        { role: 'user', content: 'How do I plan a campaign?' },
      ];

      const result = await updateSessionMemory(
        'conv-789',
        { role: 'user', content: 'How do I plan a campaign?' },
        messages
      );

      expect(result).not.toBeNull();
      expect(result!.currentTopic).toBe('Marketing campaign planning');
    });

    it('should track topic changes in history', async () => {
      const sessionWithTopic = {
        ...mockSession,
        totalMessages: 5,
        currentTopic: 'CRM features',
        topicHistory: [],
      };

      vi.mocked(getCache).mockResolvedValue(sessionWithTopic);
      vi.mocked(setCache).mockResolvedValue();

      const mockOpenAI = {
        chat: {
          completions: {
            create: vi.fn()
              .mockResolvedValueOnce({
                choices: [{ message: { content: '[]' } }],
              })
              .mockResolvedValueOnce({
                choices: [
                  {
                    message: {
                      content: 'Email marketing automation',
                    },
                  },
                ],
              }),
          },
        },
      };
      vi.mocked(getOpenAI).mockReturnValue(mockOpenAI as any);

      const messages: Message[] = [
        { role: 'user', content: 'Tell me about email marketing' },
      ];

      const result = await updateSessionMemory(
        'conv-789',
        { role: 'user', content: 'Tell me about email marketing' },
        messages
      );

      expect(result).not.toBeNull();
      expect(result!.currentTopic).toBe('Email marketing automation');
      expect(result!.topicHistory).toContain('CRM features');
    });

    it('should summarize messages after threshold reached', async () => {
      const sessionWith70Messages = {
        ...mockSession,
        totalMessages: 69,
        summaryUpToMessage: 0,
      };

      vi.mocked(getCache).mockResolvedValue(sessionWith70Messages);
      vi.mocked(setCache).mockResolvedValue();

      const mockOpenAI = {
        chat: {
          completions: {
            create: vi.fn()
              .mockResolvedValueOnce({
                choices: [{ message: { content: '[]' } }],
              })
              .mockResolvedValueOnce({
                choices: [
                  {
                    message: {
                      content:
                        'User discussed CRM features and campaign planning. Decided to use email automation.',
                    },
                  },
                ],
              }),
          },
        },
      };
      vi.mocked(getOpenAI).mockReturnValue(mockOpenAI as any);

      const messages: Message[] = Array.from({ length: 70 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
      }));

      const result = await updateSessionMemory(
        'conv-789',
        { role: 'user', content: 'New message' },
        messages
      );

      expect(result).not.toBeNull();
      expect(result!.summary).toContain('CRM features');
      expect(result!.summaryUpToMessage).toBe(20);
      expect(logger.info).toHaveBeenCalledWith(
        '[SessionMemory] Summarized messages',
        expect.any(Object)
      );
    });

    it('should update expiry time on each update', async () => {
      const emptySession = { ...mockSession, entities: [] };
      vi.mocked(getCache).mockResolvedValue(emptySession);
      vi.mocked(setCache).mockResolvedValue();

      const originalExpiry = emptySession.expiresAt.getTime();
      
      // Advance time slightly
      vi.advanceTimersByTime(1000);

      const result = await updateSessionMemory(
        'conv-789',
        { role: 'user', content: 'Test message' },
        [{ role: 'user', content: 'Test message' }]
      );

      expect(result).not.toBeNull();
      expect(result!.expiresAt.getTime()).toBeGreaterThan(originalExpiry);
      expect(result!.updatedAt.getTime()).toBe(Date.now());
    });

    it('should handle entity extraction errors gracefully', async () => {
      const emptySession = { ...mockSession, entities: [] };
      vi.mocked(getCache).mockResolvedValue(emptySession);
      vi.mocked(setCache).mockResolvedValue();

      const mockOpenAI = {
        chat: {
          completions: {
            create: vi.fn().mockRejectedValue(new Error('OpenAI API error')),
          },
        },
      };
      vi.mocked(getOpenAI).mockReturnValue(mockOpenAI as any);

      const result = await updateSessionMemory(
        'conv-789',
        {
          role: 'user',
          content: 'Meeting with Alice from Acme Corp',
        },
        [{ role: 'user', content: 'Meeting with Alice from Acme Corp' }]
      );

      expect(result).not.toBeNull();
      expect(result!.entities).toHaveLength(0);
      expect(logger.error).toHaveBeenCalledWith(
        '[SessionMemory] Entity extraction failed',
        expect.any(Error)
      );
    });

    it('should filter entities by confidence threshold', async () => {
      const emptySession = { ...mockSession, entities: [] };
      vi.mocked(getCache).mockResolvedValue(emptySession);
      vi.mocked(setCache).mockResolvedValue();

      const mockOpenAI = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify([
                      {
                        type: 'person',
                        value: 'Alice',
                        context: 'high confidence',
                        confidence: 0.9,
                      },
                      {
                        type: 'person',
                        value: 'Bob',
                        context: 'low confidence',
                        confidence: 0.5, // Below threshold
                      },
                    ]),
                  },
                },
              ],
            }),
          },
        },
      };
      vi.mocked(getOpenAI).mockReturnValue(mockOpenAI as any);

      const result = await updateSessionMemory(
        'conv-789',
        { role: 'user', content: 'Meeting with Alice and Bob' },
        [{ role: 'user', content: 'Meeting with Alice and Bob' }]
      );

      expect(result).not.toBeNull();
      expect(result!.entities).toHaveLength(1);
      expect(result!.entities[0].value).toBe('Alice');
    });

    it('should update existing entity mention counts', async () => {
      const sessionWithEntity: SessionMemory = {
        ...mockSession,
        entities: [
          {
            type: 'person',
            value: 'Alice',
            context: 'team member',
            confidence: 0.8,
            firstMentioned: new Date('2024-01-15T09:00:00Z'),
            lastMentioned: new Date('2024-01-15T09:30:00Z'),
            mentionCount: 2,
          },
        ],
      };

      vi.mocked(getCache).mockResolvedValue(sessionWithEntity);
      vi.mocked(setCache).mockResolvedValue();

      const mockOpenAI = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [
                {
                  message: {
                    content: JSON.stringify([
                      {
                        type: 'person',
                        value: 'Alice',
                        context: 'mentioned again',
                        confidence: 0.9,
                      },
                    ]),
                  },
                },
              ],
            }),
          },
        },
      };
      vi.mocked(getOpenAI).mockReturnValue(mockOpenAI as any);

      const result = await updateSessionMemory(
        'conv-789',
        { role: 'user', content: 'Alice mentioned again' },
        [{ role: 'user', content: 'Alice mentioned again' }]
      );

      expect(result).not.toBeNull();
      expect(result!.entities).toHaveLength(1);
      expect(result!.entities[0].mentionCount).toBe(3);
      expect(result!.entities[0].confidence).toBe(0.9);
    });

    it('should limit entities to max count', async () => {
      const manyEntities: ExtractedEntity[] = Array.from({ length: 60 }, (_, i) => ({
        type: 'person',
        value: `Person ${i}`,
        context: 'test',
        confidence: 0.8,
        firstMentioned: new Date(),
        lastMentioned: new Date(),
        mentionCount: 1,
      }));

      const sessionWithManyEntities: SessionMemory = {
        ...mockSession,
        entities: manyEntities,
      };

      vi.mocked(getCache).mockResolvedValue(sessionWithManyEntities);
      vi.mocked(setCache).mockResolvedValue();

      const mockOpenAI = {
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{ message: { content: '[]' } }],
            }),
          },
        },
      };
      vi.mocked(getOpenAI).mockReturnValue(mockOpenAI as any);

      const result = await updateSessionMemory(
        'conv-789',
        { role: 'user', content: 'New message' },
        [{ role: 'user', content: 'New message' }]
      );

      expect(result).not.toBeNull();
      expect(result!.entities.length).toBeLessThanOrEqual(50);
    });
  });

  describe('buildSessionContext', () => {
    it('should return empty string when no data available', () => {
      const emptySession: SessionMemory = {
        workspaceId: 'workspace-123',
        userId: 'user-456',
        conversationId: 'conv-789',
        entities: [],
        facts: [],
        currentTopic: null,
        topicHistory: [],
        summaryUpToMessage: 0,
        summary: null,
        totalMessages: 0,
        windowStart: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(),
      };

      const context = buildSessionContext(emptySession);
      expect(context).toBe('');
    });

    it('should include summary when available', () => {
      const session: SessionMemory = {
        workspaceId: 'workspace-123',
        userId: 'user-456',
        conversationId: 'conv-789',
        entities: [],
        facts: [],
        currentTopic: null,
        topicHistory: [],
        summaryUpToMessage: 20,
        summary: 'User discussed CRM features and email automation.',
        totalMessages: 30,
        windowStart: 20,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(),
      };

      const context = buildSessionContext(session);
      expect(context).toContain('--- SESSION MEMORY ---');
      expect(context).toContain('## Previous Context Summary');
      expect(context).toContain('CRM features');
      expect(context).toContain('--- END SESSION MEMORY ---');
    });

    it('should include current topic', () => {
      const session: SessionMemory = {
        workspaceId: 'workspace-123',
        userId: 'user-456',
        conversationId: 'conv-789',
        entities: [],
        facts: [],
        currentTopic: 'Marketing automation',
        topicHistory: [],
        summaryUpToMessage: 0,
        summary: null,
        totalMessages: 5,
        windowStart: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(),
      };

      const context = buildSessionContext(session);
      expect(context).toContain('## Current Topic');
      expect(context).toContain('Marketing automation');
    });

    it('should include key entities with limit', () => {
      const entities: ExtractedEntity[] = Array.from({ length: 15 }, (_, i) => ({
        type: 'person',
        value: `Person ${i}`,
        context: `Context ${i}`,
        confidence: 0.8,
        firstMentioned: new Date(),
        lastMentioned: new Date(),
        mentionCount: i + 1,
      }));

      const session: SessionMemory = {
        workspaceId: 'workspace-123',
        userId: 'user-456',
        conversationId: 'conv-789',
        entities,
        facts: [],
        currentTopic: null,
        topicHistory: [],
        summaryUpToMessage: 0,
        summary: null,
        totalMessages: 10,
        windowStart: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(),
      };

      const context = buildSessionContext(session);
      expect(context).toContain('## Key Entities Mentioned');
      expect(context).toContain('person: "Person');
      // Should limit to 10 entities
      const entityMatches = context.match(/person: "Person/g);
      expect(entityMatches?.length).toBeLessThanOrEqual(10);
    });

    it('should include key facts with limit', () => {
      const facts: ConversationFact[] = Array.from({ length: 15 }, (_, i) => ({
        fact: `Fact ${i}`,
        category: 'decision' as const,
        confidence: 0.8,
        messageIndex: i,
        timestamp: new Date(),
      }));

      const session: SessionMemory = {
        workspaceId: 'workspace-123',
        userId: 'user-456',
        conversationId: 'conv-789',
        entities: [],
        facts,
        currentTopic: null,
        topicHistory: [],
        summaryUpToMessage: 0,
        summary: null,
        totalMessages: 15,
        windowStart: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(),
      };

      const context = buildSessionContext(session);
      expect(context).toContain('## Key Facts');
      expect(context).toContain('[decision] Fact');
      // Should limit to 10 facts
      const factMatches = context.match(/\[decision\] Fact/g);
      expect(factMatches?.length).toBeLessThanOrEqual(10);
    });

    it('should format complete context with all sections', () => {
      const session: SessionMemory = {
        workspaceId: 'workspace-123',
        userId: 'user-456',
        conversationId: 'conv-789',
        entities: [
          {
            type: 'person',
            value: 'Alice',
            context: 'CEO',
            confidence: 0.9,
            firstMentioned: new Date(),
            lastMentioned: new Date(),
            mentionCount: 3,
          },
        ],
        facts: [
          {
            fact: 'Prefers morning meetings',
            category: 'preference',
            confidence: 0.85,
            messageIndex: 5,
            timestamp: new Date(),
          },
        ],
        currentTopic: 'Calendar scheduling',
        topicHistory: [],
        summaryUpToMessage: 10,
        summary: 'Previous discussion about CRM.',
        totalMessages: 15,
        windowStart: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(),
      };

      const context = buildSessionContext(session);
      expect(context).toContain('--- SESSION MEMORY ---');
      expect(context).toContain('## Previous Context Summary');
      expect(context).toContain('Previous discussion about CRM');
      expect(context).toContain('## Current Topic');
      expect(context).toContain('Calendar scheduling');
      expect(context).toContain('## Key Entities Mentioned');
      expect(context).toContain('person: "Alice" (CEO)');
      expect(context).toContain('## Key Facts');
      expect(context).toContain('[preference] Prefers morning meetings');
      expect(context).toContain('--- END SESSION MEMORY ---');
    });
  });

  describe('getOptimizedConversationContext', () => {
    it('should return all messages when no session exists', async () => {
      vi.mocked(getCache).mockResolvedValue(null);

      const messages: Message[] = Array.from({ length: 60 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
      }));

      const result = await getOptimizedConversationContext('conv-789', messages);

      expect(result.sessionContext).toBe('');
      expect(result.recentMessages.length).toBe(50); // Window size
      expect(result.tokensSaved).toBe(0);
    });

    it('should return optimized context with session', async () => {
      const session: SessionMemory = {
        workspaceId: 'workspace-123',
        userId: 'user-456',
        conversationId: 'conv-789',
        entities: [
          {
            type: 'person',
            value: 'John',
            context: 'developer',
            confidence: 0.9,
            firstMentioned: new Date(),
            lastMentioned: new Date(),
            mentionCount: 3,
          },
        ],
        facts: [
          {
            fact: 'Prefers TypeScript',
            category: 'preference',
            confidence: 0.8,
            messageIndex: 5,
            timestamp: new Date(),
          },
        ],
        currentTopic: 'CRM',
        topicHistory: [],
        summaryUpToMessage: 20,
        summary: 'User discussed CRM features.',
        totalMessages: 60,
        windowStart: 40,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      };

      vi.mocked(getCache).mockResolvedValue(session);

      const messages: Message[] = Array.from({ length: 60 }, (_, i) => ({
        role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
        content: `Message ${i}`,
      }));

      const result = await getOptimizedConversationContext('conv-789', messages);

      // Check that context contains all expected sections
      expect(result.sessionContext).toContain('SESSION MEMORY');
      expect(result.sessionContext).toContain('Current Topic');
      expect(result.sessionContext).toContain('CRM');
      expect(result.recentMessages.length).toBe(20); // From windowStart (60-40)
      expect(result.tokensSaved).toBeGreaterThan(0);
    });

    it('should estimate tokens saved correctly', async () => {
      const session: SessionMemory = {
        workspaceId: 'workspace-123',
        userId: 'user-456',
        conversationId: 'conv-789',
        entities: [
          {
            type: 'person',
            value: 'Alice',
            context: 'developer',
            confidence: 0.9,
            firstMentioned: new Date(),
            lastMentioned: new Date(),
            mentionCount: 2,
          },
        ],
        facts: [
          {
            fact: 'Uses React',
            category: 'context',
            confidence: 0.85,
            messageIndex: 3,
            timestamp: new Date(),
          },
        ],
        currentTopic: 'Testing',
        topicHistory: [],
        summaryUpToMessage: 10,
        summary: 'Short summary of previous conversation context.',
        totalMessages: 20,
        windowStart: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      };

      vi.mocked(getCache).mockResolvedValue(session);

      const messages: Message[] = Array.from({ length: 20 }, (_, i) => ({
        role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
        content: 'This is a test message with some content that takes up space.',
      }));

      const result = await getOptimizedConversationContext('conv-789', messages);

      // With summary + topic + entities + facts, we saved tokens from the first 10 messages
      expect(result.tokensSaved).toBeGreaterThan(0);
      expect(typeof result.tokensSaved).toBe('number');
    });
  });

  describe('clearSessionMemory', () => {
    it('should clear session from cache', async () => {
      vi.mocked(setCache).mockResolvedValue();

      await clearSessionMemory('conv-789');

      expect(setCache).toHaveBeenCalledWith(
        'session:memory:conv-789',
        { cleared: true },
        { prefix: '', ttl: 1 }
      );
      expect(logger.info).toHaveBeenCalledWith('[SessionMemory] Cleared session', {
        conversationId: 'conv-789',
      });
    });

    it('should handle cache errors gracefully', async () => {
      vi.mocked(setCache).mockRejectedValue(new Error('Cache error'));

      await clearSessionMemory('conv-789');

      expect(logger.error).toHaveBeenCalledWith(
        '[SessionMemory] Failed to clear session',
        expect.any(Error)
      );
    });
  });

  describe('getRelevantEntities', () => {
    const session: SessionMemory = {
      workspaceId: 'workspace-123',
      userId: 'user-456',
      conversationId: 'conv-789',
      entities: [
        {
          type: 'person',
          value: 'Alice Johnson',
          context: 'CEO at Acme Corp',
          confidence: 0.9,
          firstMentioned: new Date(),
          lastMentioned: new Date(),
          mentionCount: 5,
        },
        {
          type: 'company',
          value: 'Acme Corp',
          context: 'client company',
          confidence: 0.95,
          firstMentioned: new Date(),
          lastMentioned: new Date(),
          mentionCount: 8,
        },
        {
          type: 'person',
          value: 'Bob Smith',
          context: 'developer',
          confidence: 0.85,
          firstMentioned: new Date(),
          lastMentioned: new Date(),
          mentionCount: 3,
        },
      ],
      facts: [],
      currentTopic: null,
      topicHistory: [],
      summaryUpToMessage: 0,
      summary: null,
      totalMessages: 10,
      windowStart: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(),
    };

    it('should return empty array when no entities exist', () => {
      const emptySession: SessionMemory = {
        ...session,
        entities: [],
      };

      const result = getRelevantEntities(emptySession, 'test query');
      expect(result).toEqual([]);
    });

    it('should find entities matching query words', () => {
      const result = getRelevantEntities(session, 'Tell me about Alice please');

      // Should match because "alice" (from value "Alice Johnson") is included in/matches query word "alice"
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].value).toBe('Alice Johnson');
    });

    it('should match entities by context', () => {
      const result = getRelevantEntities(session, 'Tell me about the CEO');

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((e) => e.context.includes('CEO'))).toBe(true);
    });

    it('should filter out short query words', () => {
      const result = getRelevantEntities(session, 'Who is at Acme Corp?');

      // Should match "Who" (3 chars), "Acme" (4 chars), "Corp" (4 chars)
      // Won't match "is" (2 chars), "at" (2 chars)
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle case-insensitive matching', () => {
      const result = getRelevantEntities(session, 'ALICE JOHNSON');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].value).toBe('Alice Johnson');
    });
  });

  describe('getRelevantFacts', () => {
    const session: SessionMemory = {
      workspaceId: 'workspace-123',
      userId: 'user-456',
      conversationId: 'conv-789',
      entities: [],
      facts: [
        {
          fact: 'User prefers morning meetings',
          category: 'preference',
          confidence: 0.8,
          messageIndex: 5,
          timestamp: new Date(),
        },
        {
          fact: 'Decided to use Enterprise plan',
          category: 'decision',
          confidence: 0.9,
          messageIndex: 10,
          timestamp: new Date(),
        },
        {
          fact: 'Working on Q1 product launch',
          category: 'goal',
          confidence: 0.85,
          messageIndex: 15,
          timestamp: new Date(),
        },
      ],
      currentTopic: null,
      topicHistory: [],
      summaryUpToMessage: 0,
      summary: null,
      totalMessages: 20,
      windowStart: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(),
    };

    it('should return empty array when no facts exist', () => {
      const emptySession: SessionMemory = {
        ...session,
        facts: [],
      };

      const result = getRelevantFacts(emptySession, 'test query');
      expect(result).toEqual([]);
    });

    it('should find facts matching query words', () => {
      const result = getRelevantFacts(session, 'Tell me about our meetings');

      // Should match because "meetings" is in the fact "User prefers morning meetings"
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].fact).toContain('morning meetings');
    });

    it('should match multiple facts', () => {
      const result = getRelevantFacts(session, 'product launch plan');

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((f) => f.fact.includes('launch'))).toBe(true);
    });

    it('should filter out short query words', () => {
      const result = getRelevantFacts(session, 'What is the plan for Q1?');

      // Should match "What" (4 chars), "the" (3 chars), "plan" (4 chars)
      // Won't match "is" (2 chars), "for" (3 chars keeps), "Q1?" (removes ?)
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle case-insensitive matching', () => {
      const result = getRelevantFacts(session, 'ENTERPRISE PLAN');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].fact).toContain('Enterprise plan');
    });
  });
});
