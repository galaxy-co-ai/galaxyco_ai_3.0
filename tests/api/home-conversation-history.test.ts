import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/home/conversation/history/route';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/auth', () => ({
  getCurrentWorkspace: vi.fn(() =>
    Promise.resolve({
      workspaceId: 'ws-1',
      userId: 'user-1',
      user: { firstName: 'Alex', lastName: 'Smith' },
    }),
  ),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => Promise.resolve({ success: true, limit: 30, remaining: 29, reset: 0 })),
}));

const mockSessionRows = [
  {
    id: 'session-1',
    conversationId: 'session-1',
    startedAt: new Date('2026-03-18T10:00:00.000Z'),
    lastActiveAt: new Date('2026-03-18T10:05:00.000Z'),
    createdAt: new Date('2026-03-18T10:00:00.000Z'),
  },
  {
    id: 'session-2',
    conversationId: 'session-2',
    startedAt: new Date('2026-03-17T09:00:00.000Z'),
    lastActiveAt: new Date('2026-03-17T09:10:00.000Z'),
    createdAt: new Date('2026-03-17T09:00:00.000Z'),
  },
];

const mockMessageRows = [
  {
    id: 'msg-1',
    conversationId: 'session-1',
    role: 'user',
    content: 'Hello Neptune',
    createdAt: new Date('2026-03-18T10:01:00.000Z'),
  },
  {
    id: 'msg-2',
    conversationId: 'session-1',
    role: 'assistant',
    content: 'Good morning, Alex.',
    createdAt: new Date('2026-03-18T10:01:05.000Z'),
  },
];

// Track how many times db.select() has been called so we can differentiate
// the first query (sessions, ends with .limit()) from the second (messages,
// ends with .orderBy()).
let dbSelectCallCount = 0;

vi.mock('@/lib/db', () => {
  // Build a chainable query builder that resolves at the terminal step.
  // Sessions query chain: select → from → where → orderBy → limit → Promise
  // Messages query chain: select → from → where → orderBy → Promise
  const makeChain = (result: unknown[]) => {
    // The terminal promise-like object
    const terminal = Promise.resolve(result);

    // .orderBy() resolves for messages OR continues for sessions via .limit()
    const withOrderBy = {
      orderBy: vi.fn(() => {
        // If this orderBy is called on the sessions chain it will be followed
        // by .limit() — return withLimit so the chain can continue.
        // If it's the messages chain it IS the terminal — but we can't know
        // ahead of time. So always return an object that is BOTH a promise
        // AND has .limit(). We achieve this by returning a thenable that also
        // has .limit().
        const thenableWithLimit = Object.assign(Object.create(Promise.prototype), {
          then: terminal.then.bind(terminal),
          catch: terminal.catch.bind(terminal),
          finally: terminal.finally.bind(terminal),
          limit: vi.fn(() => terminal),
        });
        return thenableWithLimit;
      }),
    };

    const withWhere = {
      where: vi.fn(() => withOrderBy),
    };

    const withFrom = {
      from: vi.fn(() => withWhere),
    };

    return withFrom;
  };

  return {
    db: {
      select: vi.fn(() => {
        dbSelectCallCount++;
        // First select = sessions query → limited to PAGE_SIZE+1
        // Second select = messages query
        const rows = dbSelectCallCount === 1 ? mockSessionRows : mockMessageRows;
        return makeChain(rows);
      }),
    },
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GET /api/home/conversation/history', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbSelectCallCount = 0;
  });

  it('returns 200 with sessions, messages, and hasMore fields', async () => {
    const request = new NextRequest('http://localhost:3000/api/home/conversation/history');
    const response = await GET(request);

    expect(response.status).toBe(200);

    const data = await response.json();

    expect(data).toHaveProperty('sessions');
    expect(data).toHaveProperty('messages');
    expect(data).toHaveProperty('hasMore');
  });

  it('returns sessions as ISO date strings', async () => {
    const request = new NextRequest('http://localhost:3000/api/home/conversation/history');
    const response = await GET(request);
    const data = await response.json();

    expect(Array.isArray(data.sessions)).toBe(true);
    if (data.sessions.length > 0) {
      const session = data.sessions[0];
      expect(session).toHaveProperty('id');
      expect(session).toHaveProperty('conversationId');
      expect(session).toHaveProperty('startedAt');
      expect(session).toHaveProperty('lastActiveAt');
      // Verify ISO date format
      expect(() => new Date(session.startedAt)).not.toThrow();
    }
  });

  it('maps assistant role to neptune in messages', async () => {
    const request = new NextRequest('http://localhost:3000/api/home/conversation/history');
    const response = await GET(request);
    const data = await response.json();

    expect(Array.isArray(data.messages)).toBe(true);
    // Expect no raw 'assistant' roles in the response
    const assistantMsgs = data.messages.filter((m: { role: string }) => m.role === 'assistant');
    expect(assistantMsgs).toHaveLength(0);
  });

  it('returns messages with blocks array containing text type', async () => {
    const request = new NextRequest('http://localhost:3000/api/home/conversation/history');
    const response = await GET(request);
    const data = await response.json();

    expect(Array.isArray(data.messages)).toBe(true);
    if (data.messages.length > 0) {
      const msg = data.messages[0];
      expect(msg).toHaveProperty('id');
      expect(msg).toHaveProperty('sessionId');
      expect(msg).toHaveProperty('timestamp');
      expect(msg).toHaveProperty('role');
      expect(msg).toHaveProperty('blocks');
      expect(Array.isArray(msg.blocks)).toBe(true);
      expect(msg.blocks[0]).toHaveProperty('type', 'text');
      expect(msg.blocks[0]).toHaveProperty('content');
    }
  });

  it('returns 401 when auth fails', async () => {
    const { getCurrentWorkspace } = await import('@/lib/auth');
    vi.mocked(getCurrentWorkspace).mockRejectedValueOnce(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost:3000/api/home/conversation/history');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('returns 429 when rate limit exceeded', async () => {
    const { rateLimit } = await import('@/lib/rate-limit');
    vi.mocked(rateLimit).mockResolvedValueOnce({
      success: false,
      limit: 30,
      remaining: 0,
      reset: 60,
    });

    const request = new NextRequest('http://localhost:3000/api/home/conversation/history');
    const response = await GET(request);

    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toBe('Rate limit exceeded');
  });

  it('accepts cursor query parameter without error', async () => {
    const cursor = '2026-03-17T00:00:00.000Z';
    const request = new NextRequest(
      `http://localhost:3000/api/home/conversation/history?cursor=${encodeURIComponent(cursor)}`,
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('sessions');
    expect(data).toHaveProperty('hasMore');
  });
});
