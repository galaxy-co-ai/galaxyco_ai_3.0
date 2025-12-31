import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/assistant/chat/route';

// Helper to read the SSE stream into a single string
async function readStream(stream: ReadableStream<Uint8Array> | null): Promise<string> {
  if (!stream) return '';
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      result += decoder.decode(value);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/auth', () => ({
  getCurrentWorkspace: vi.fn(() =>
    Promise.resolve({
      workspaceId: 'test-workspace-id',
      workspace: { id: 'test-workspace-id', name: 'Test Workspace', slug: 'test' },
      userId: 'test-user-id',
      user: { id: 'test-user-id', email: 'test@example.com' },
      membership: null,
    }),
  ),
  getCurrentUser: vi.fn(() =>
    Promise.resolve({
      id: 'test-user-id',
      clerkUserId: 'clerk_test',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      avatarUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  ),
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
      workspaces: {
        findFirst: vi.fn(() => Promise.resolve({ subscriptionTier: 'free' })),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() =>
          Promise.resolve([
            {
              id: 'test-conversation-id',
              workspaceId: 'test-workspace-id',
              userId: 'test-user-id',
              title: 'Test conversation',
              lastMessageAt: new Date(),
              messageCount: 0,
              createdAt: new Date(),
              metadata: null,
            },
          ]),
        ),
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
  rateLimit: vi.fn(() =>
    Promise.resolve({
      success: true,
      remaining: 19,
      limit: 20,
      reset: Date.now() + 60_000,
    }),
  ),
}));

vi.mock('@/lib/ai-providers', () => ({
  getOpenAI: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(async () => {
          // Minimal async iterable that mimics OpenAI streaming
          const stream = {
            async *[Symbol.asyncIterator]() {
              yield {
                choices: [
                  {
                    delta: { content: 'Hello from stream. ' },
                    finish_reason: null,
                  },
                ],
              };

              yield {
                choices: [
                  {
                    delta: { content: 'More text.' },
                    finish_reason: 'stop',
                  },
                ],
              };
            },
          } as AsyncIterable<any>;

          return stream as any;
        }),
      },
    },
  })),
}));

vi.mock('@/lib/ai/context', () => ({
  gatherAIContext: vi.fn(() => Promise.resolve({})),
}));

vi.mock('@/lib/ai/system-prompt', () => ({
  generateSystemPrompt: vi.fn(() => 'System prompt'),
}));

vi.mock('@/lib/ai/memory', () => ({
  trackFrequentQuestion: vi.fn(() => Promise.resolve()),
  analyzeConversationForLearning: vi.fn(() => Promise.resolve([])),
  updateUserPreferencesFromInsights: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/document-processing', () => ({
  processDocuments: vi.fn(() => Promise.resolve('')),
}));

vi.mock('@/lib/ai/autonomy-learning', () => ({
  shouldAutoExecute: vi.fn(() =>
    Promise.resolve({ autoExecute: false, confidence: 0.5, reason: 'Test reason' }),
  ),
  recordActionExecution: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/ai/cache', () => ({
  getCachedResponse: vi.fn(() => Promise.resolve(null)),
  cacheResponse: vi.fn(() => Promise.resolve()),
  isCacheAvailable: vi.fn(() => true),
}));

vi.mock('@/lib/ai/tools', () => ({
  aiTools: [],
  getToolsForCapability: vi.fn(() => []),
  executeTool: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/cost-protection', () => ({
  checkTokenLimit: vi.fn(() =>
    Promise.resolve({ allowed: true, currentUsage: 0, limit: 100000 }),
  ),
  trackTokenUsage: vi.fn(() => Promise.resolve()),
  estimateTokens: vi.fn(() => 100),
}));

vi.mock('@/lib/observability', () => ({
  trackNeptuneRequest: vi.fn(),
  trackNeptuneError: vi.fn(),
}));

vi.mock('@/lib/ai/intent-classifier', () => ({
  classifyIntent: vi.fn(() =>
    Promise.resolve({
      intent: 'general',
      confidence: 0.8,
      detectionMethod: 'keyword',
      processingTimeMs: 5,
    }),
  ),
}));

vi.mock('@/lib/integrations', () => ({
  getConnectedApps: vi.fn(() => Promise.resolve([])),
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/assistant/chat (streaming)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('streams events with conversationId and DONE on success', async () => {
    const request = new Request('http://localhost:3000/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello Neptune',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request as any);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    const bodyText = await readStream(response.body as any);

    expect(bodyText).toContain('conversationId');
    expect(bodyText).toContain('Hello from stream');
    expect(bodyText).toContain('[DONE]');
  });

  it('sends an auth error when user is not signed in', async () => {
    const { getCurrentWorkspace } = await import('@/lib/auth');
    vi.mocked(getCurrentWorkspace).mockRejectedValueOnce(new Error('Not authenticated'));

    const request = new Request('http://localhost:3000/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request as any);
    const bodyText = await readStream(response.body as any);

    expect(bodyText).toContain('Please sign in to use Neptune.');
    expect(bodyText).toContain('[DONE]');
  });

  it('sends validation error for invalid message', async () => {
    const request = new Request('http://localhost:3000/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: '', // fails min(1)
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request as any);
    const bodyText = await readStream(response.body as any);

    expect(bodyText).toContain('Invalid request');
    expect(bodyText).toContain('Message is required');
    expect(bodyText).toContain('[DONE]');
  });

  it('sends rate limit error when limit is exceeded', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    vi.mocked(rateLimit).mockResolvedValueOnce({
      success: false,
      remaining: 0,
      limit: 20,
      reset: Date.now() + 60_000,
    });

    const request = new Request('http://localhost:3000/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message: 'Hello',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await POST(request as any);
    const bodyText = await readStream(response.body as any);

    expect(bodyText).toContain('Rate limit exceeded');
    expect(bodyText).toContain('[DONE]');
  });
});
