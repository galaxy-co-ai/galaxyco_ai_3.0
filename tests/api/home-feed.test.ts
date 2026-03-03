import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/home/feed/route';
import { NextRequest } from 'next/server';

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
  rateLimit: vi.fn(() => Promise.resolve({ success: true, limit: 100, remaining: 99, reset: 0 })),
}));

vi.mock('@/lib/home/card-engine', () => ({
  generateFeedCards: vi.fn(() =>
    Promise.resolve([
      {
        id: 'card-1',
        category: 'onboarding',
        icon: '🏢',
        headline: 'Tell me about your business',
        context: 'What do you do?',
        chips: [{ id: 'c1', label: 'Go', action: 'go', variant: 'primary' }],
        priority: 10,
        dismissible: false,
      },
    ]),
  ),
  generateGreeting: vi.fn(() => 'Good morning, Alex.'),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('GET /api/home/feed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return feed with greeting and cards', async () => {
    const request = new NextRequest('http://localhost:3000/api/home/feed');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('greeting');
    expect(data).toHaveProperty('cards');
    expect(data.greeting).toBe('Good morning, Alex.');
    expect(data.cards).toHaveLength(1);
    expect(data.cards[0].category).toBe('onboarding');
  });

  it('should return isNewUser flag', async () => {
    const request = new NextRequest('http://localhost:3000/api/home/feed');
    const response = await GET(request);
    const data = await response.json();

    expect(data).toHaveProperty('isNewUser');
  });
});
