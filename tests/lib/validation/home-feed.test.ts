import { describe, it, expect } from 'vitest';
import {
  FeedCardSchema,
  FeedActionRequestSchema,
  type FeedCard,
  type FeedActionRequest,
} from '@/lib/validation/home-feed';

describe('FeedCardSchema', () => {
  it('should validate a valid money card', () => {
    const card: FeedCard = {
      id: 'card-1',
      category: 'money',
      icon: '💰',
      headline: '2 invoices paid overnight ($3,200)',
      context: 'Jackson Roofing ($2,100) and Martinez Kitchen ($1,100).',
      chips: [
        { id: 'chip-1', label: 'See details', action: 'view_invoices', variant: 'primary' },
        { id: 'chip-2', label: 'Send more invoices', action: 'create_invoice', variant: 'secondary' },
      ],
      priority: 9,
      dismissible: true,
    };
    const result = FeedCardSchema.safeParse(card);
    expect(result.success).toBe(true);
  });

  it('should reject a card with no chips', () => {
    const card = {
      id: 'card-1',
      category: 'money',
      icon: '💰',
      headline: 'Test',
      context: 'Test context',
      chips: [],
      priority: 5,
      dismissible: true,
    };
    const result = FeedCardSchema.safeParse(card);
    expect(result.success).toBe(false);
  });

  it('should reject invalid category', () => {
    const card = {
      id: 'card-1',
      category: 'invalid',
      icon: '💰',
      headline: 'Test',
      context: 'Test',
      chips: [{ id: 'c1', label: 'Go', action: 'do_thing', variant: 'primary' }],
      priority: 5,
      dismissible: true,
    };
    const result = FeedCardSchema.safeParse(card);
    expect(result.success).toBe(false);
  });
});

describe('FeedActionRequestSchema', () => {
  it('should validate an action request', () => {
    const req: FeedActionRequest = {
      cardId: 'card-1',
      chipId: 'chip-1',
      action: 'view_invoices',
    };
    const result = FeedActionRequestSchema.safeParse(req);
    expect(result.success).toBe(true);
  });

  it('should reject missing cardId', () => {
    const result = FeedActionRequestSchema.safeParse({ chipId: 'c1', action: 'go' });
    expect(result.success).toBe(false);
  });
});
