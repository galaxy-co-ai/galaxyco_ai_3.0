import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateFeedCards, generateGreeting } from '@/lib/home/card-engine';
import type { FeedCard } from '@/types/home-feed';

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
          orderBy: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    })),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

describe('generateFeedCards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return an array of FeedCard objects', async () => {
    const cards = await generateFeedCards('workspace-1', 'user-1', 'Alex');
    expect(Array.isArray(cards)).toBe(true);
    cards.forEach((card: FeedCard) => {
      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('category');
      expect(card).toHaveProperty('headline');
      expect(card).toHaveProperty('chips');
      expect(card.chips.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should return max 5 cards', async () => {
    const cards = await generateFeedCards('workspace-1', 'user-1', 'Alex');
    expect(cards.length).toBeLessThanOrEqual(5);
  });

  it('should return cards sorted by priority (highest first)', async () => {
    const cards = await generateFeedCards('workspace-1', 'user-1', 'Alex');
    for (let i = 1; i < cards.length; i++) {
      expect(cards[i - 1].priority).toBeGreaterThanOrEqual(cards[i].priority);
    }
  });

  it('should return onboarding cards for new users (no data)', async () => {
    const cards = await generateFeedCards('workspace-1', 'user-1', 'Alex');
    const hasOnboarding = cards.some((c: FeedCard) => c.category === 'onboarding');
    expect(hasOnboarding).toBe(true);
  });
});

describe('generateGreeting', () => {
  it('should return a greeting with the first name', () => {
    const greeting = generateGreeting('Alex Smith');
    expect(greeting).toContain('Alex');
    expect(greeting).toMatch(/^Good (morning|afternoon|evening), Alex\.$/);
  });

  it('should handle single name', () => {
    const greeting = generateGreeting('Alex');
    expect(greeting).toContain('Alex');
  });
});
