import { describe, it, expect } from 'vitest';
import {
  ContentBlockSchema,
  ConversationMessageSchema,
  ConversationInitRequestSchema,
  ConversationSendRequestSchema,
} from '@/lib/validation/neptune-conversation';

describe('neptune-conversation validation', () => {
  it('validates text block', () => {
    const result = ContentBlockSchema.safeParse({ type: 'text', content: 'hello' });
    expect(result.success).toBe(true);
  });

  it('rejects text block without content', () => {
    const result = ContentBlockSchema.safeParse({ type: 'text' });
    expect(result.success).toBe(false);
  });

  it('validates visual block', () => {
    const result = ContentBlockSchema.safeParse({
      type: 'visual',
      spec: { chartType: 'metric', data: { value: 42 }, interactive: false },
    });
    expect(result.success).toBe(true);
  });

  it('rejects visual block with invalid chartType', () => {
    const result = ContentBlockSchema.safeParse({
      type: 'visual',
      spec: { chartType: 'donut', data: {}, interactive: false },
    });
    expect(result.success).toBe(false);
  });

  it('validates action-affordance block', () => {
    const result = ContentBlockSchema.safeParse({
      type: 'action-affordance',
      prompt: 'Approve?',
      actions: [{ label: 'Yes', intent: 'approve' }],
    });
    expect(result.success).toBe(true);
  });

  it('validates module-link block', () => {
    const result = ContentBlockSchema.safeParse({
      type: 'module-link',
      module: 'crm',
      label: 'Open CRM',
    });
    expect(result.success).toBe(true);
  });

  it('validates full ConversationMessage', () => {
    const result = ConversationMessageSchema.safeParse({
      id: 'msg-1',
      sessionId: 'sess-1',
      timestamp: '2026-03-18T10:00:00Z',
      role: 'neptune',
      blocks: [{ type: 'text', content: 'Morning.' }],
    });
    expect(result.success).toBe(true);
  });

  it('validates ConversationInitRequest without sessionId', () => {
    const result = ConversationInitRequestSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('validates ConversationSendRequest', () => {
    const result = ConversationSendRequestSchema.safeParse({
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
      message: 'How did last week go?',
    });
    expect(result.success).toBe(true);
  });

  it('rejects ConversationSendRequest without message', () => {
    const result = ConversationSendRequestSchema.safeParse({
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(false);
  });
});
