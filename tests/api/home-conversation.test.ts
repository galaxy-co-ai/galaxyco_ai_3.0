import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/home/conversation/route';
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

vi.mock('@/lib/home/session-manager', () => ({
  getOrCreateSession: vi.fn(() =>
    Promise.resolve({
      session: {
        id: 'session-1',
        conversationId: 'session-1',
        startedAt: '2026-03-18T10:00:00.000Z',
        lastActiveAt: '2026-03-18T10:00:00.000Z',
      },
      isNew: true,
    }),
  ),
  touchSession: vi.fn(() => Promise.resolve()),
}));

vi.mock('@/lib/home/workspace-data', () => ({
  fetchWorkspaceSnapshot: vi.fn(() =>
    Promise.resolve({
      contactCount: 42,
      hotContacts: [{ id: 'c1', firstName: 'Jane', lastName: 'Doe', company: 'Acme' }],
      overdueTasks: [{ id: 't1', title: 'Follow up with Jane', customerId: 'c1' }],
      recentCampaigns: [
        { id: 'cam1', name: 'Spring Launch', sentCount: 500, openCount: 150, clickCount: 30 },
      ],
      activeAgentCount: 2,
      integrationCount: 3,
      isNewUser: false,
    }),
  ),
}));

vi.mock('@/lib/home/narrative-builder', () => ({
  buildNarrativePrompt: vi.fn(() => 'mock narrative prompt'),
  parseNarrativeResponse: vi.fn(() => [{ type: 'text', content: 'Good morning, Alex.' }]),
  getTimeOfDay: vi.fn(() => 'morning'),
}));

vi.mock('@/lib/ai-providers', () => ({
  getOpenAI: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(async function* () {
          yield { choices: [{ delta: { content: 'Good morning, Alex.' } }] };
        }),
      },
    },
  })),
}));

vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve()),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() =>
            Promise.resolve([{ id: '550e8400-e29b-41d4-a716-446655440000', createdAt: new Date('2026-03-18T10:00:00Z') }]),
          ),
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reads all SSE events from a ReadableStream response body.
 */
async function collectSseEvents(response: Response): Promise<Array<Record<string, unknown>>> {
  const text = await response.text();
  const lines = text.split('\n\n').filter((chunk) => chunk.startsWith('data: '));
  return lines.map((chunk) => JSON.parse(chunk.replace('data: ', '')) as Record<string, unknown>);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/home/conversation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns streaming SSE response for session init (empty body)', async () => {
    const request = new NextRequest('http://localhost:3000/api/home/conversation', {
      method: 'POST',
      body: '{}',
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    expect(response.headers.get('Cache-Control')).toBe('no-cache');

    const events = await collectSseEvents(response);
    const types = events.map((e) => e.type);

    expect(types).toContain('session');
    expect(types).toContain('block-start');
    expect(types).toContain('block-complete');
    expect(types).toContain('message-complete');
  });

  it('returns streaming SSE response for a user message', async () => {
    const request = new NextRequest('http://localhost:3000/api/home/conversation', {
      method: 'POST',
      body: JSON.stringify({ sessionId: '550e8400-e29b-41d4-a716-446655440000', message: 'What are my hot leads?' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/event-stream');

    const events = await collectSseEvents(response);
    const types = events.map((e) => e.type);

    expect(types).toContain('session');
    expect(types).toContain('message-complete');
  });

  it('returns 401 when auth fails', async () => {
    const { getCurrentWorkspace } = await import('@/lib/auth');
    vi.mocked(getCurrentWorkspace).mockRejectedValueOnce(new Error('Unauthorized'));

    const request = new NextRequest('http://localhost:3000/api/home/conversation', {
      method: 'POST',
      body: '{}',
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });
});
