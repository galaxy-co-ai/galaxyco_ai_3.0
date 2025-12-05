import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/assistant/chat/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  getCurrentWorkspace: vi.fn(() => Promise.resolve({
    workspaceId: 'test-workspace-id',
    workspace: { id: 'test-workspace-id', name: 'Test Workspace', slug: 'test' },
    userId: 'test-user-id',
    user: { id: 'test-user-id', email: 'test@example.com' },
    membership: null,
  })),
  getCurrentUser: vi.fn(() => Promise.resolve({
    id: 'test-user-id',
    clerkUserId: 'clerk_test',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
}));

vi.mock('@/lib/db', () => ({
  db: {
    query: {
      aiConversations: {
        findFirst: vi.fn(() => Promise.resolve(null)),
      },
      aiMessages: {
        findMany: vi.fn(() => Promise.resolve([])),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{
          id: 'test-conversation-id',
          workspaceId: 'test-workspace-id',
          userId: 'test-user-id',
          title: 'Test conversation',
          lastMessageAt: new Date(),
          messageCount: 0,
          createdAt: new Date(),
        }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
  },
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => Promise.resolve({
    success: true,
    remaining: 19,
    limit: 20,
    reset: Date.now() + 60000,
  })),
}));

vi.mock('@/lib/ai-providers', () => ({
  getOpenAI: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(() => Promise.resolve({
          choices: [{
            message: {
              content: 'This is a test AI response',
            },
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
        })),
      },
    },
  })),
}));

describe('POST /api/assistant/chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a new conversation and return AI response', async () => {
    const request = new NextRequest('http://localhost:3000/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello, AI assistant!',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('conversationId');
    expect(data).toHaveProperty('message');
    expect(data.message.content).toBe('This is a test AI response');
    expect(data).toHaveProperty('usage');
  });

  it('should validate message input - empty message', async () => {
    const request = new NextRequest('http://localhost:3000/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: '',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  it('should validate message input - missing message', async () => {
    const request = new NextRequest('http://localhost:3000/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  it('should enforce rate limiting when limit exceeded', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    vi.mocked(rateLimit).mockResolvedValueOnce({
      success: false,
      remaining: 0,
      limit: 20,
      reset: Date.now() + 60000,
    });

    const request = new NextRequest('http://localhost:3000/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toContain('Rate limit');
  });

  it('should handle very long messages', async () => {
    const longMessage = 'a'.repeat(500);
    const request = new NextRequest('http://localhost:3000/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: longMessage,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('conversationId');
  });

  it('should reject messages over max length', async () => {
    const tooLongMessage = 'a'.repeat(10001); // Over 10000 char limit
    const request = new NextRequest('http://localhost:3000/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: tooLongMessage,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toHaveProperty('error');
  });
});
























