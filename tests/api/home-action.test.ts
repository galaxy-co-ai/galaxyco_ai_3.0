import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/home/action/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  getCurrentWorkspace: vi.fn(() =>
    Promise.resolve({ workspaceId: 'ws-1', userId: 'user-1' }),
  ),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(() => Promise.resolve({ success: true, limit: 50, remaining: 49, reset: 0 })),
}));

vi.mock('@/lib/home/action-executor', () => ({
  executeCardAction: vi.fn(() =>
    Promise.resolve({
      success: true,
      expansion: {
        cardId: 'card-1',
        message: 'Done. I drafted an intro email.',
        chips: [
          { id: 'edit', label: 'Edit draft', action: 'edit_draft', variant: 'primary' as const },
        ],
      },
    }),
  ),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('POST /api/home/action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should execute an action and return expansion', async () => {
    const request = new NextRequest('http://localhost:3000/api/home/action', {
      method: 'POST',
      body: JSON.stringify({
        cardId: 'card-1',
        chipId: 'chip-1',
        action: 'contact_lead',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.expansion).toHaveProperty('message');
    expect(data.expansion.chips).toBeDefined();
  });

  it('should reject invalid request body', async () => {
    const request = new NextRequest('http://localhost:3000/api/home/action', {
      method: 'POST',
      body: JSON.stringify({ invalid: true }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});
