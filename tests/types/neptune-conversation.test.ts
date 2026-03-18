// tests/types/neptune-conversation.test.ts
import { describe, it, expectTypeOf } from 'vitest';
import type {
  ContentBlock,
  ConversationMessage,
  StreamEvent,
} from '@/types/neptune-conversation';

describe('neptune-conversation types', () => {
  it('ContentBlock discriminates on type field', () => {
    const text: ContentBlock = { type: 'text', content: 'hello' };
    const visual: ContentBlock = {
      type: 'visual',
      spec: { chartType: 'metric', data: { value: 42 }, interactive: false },
    };
    const action: ContentBlock = {
      type: 'action-affordance',
      prompt: 'Approve?',
      actions: [{ label: 'Yes', intent: 'approve' }],
    };
    const link: ContentBlock = {
      type: 'module-link',
      module: 'crm',
      label: 'Open CRM',
    };

    expectTypeOf(text).toMatchTypeOf<ContentBlock>();
    expectTypeOf(visual).toMatchTypeOf<ContentBlock>();
    expectTypeOf(action).toMatchTypeOf<ContentBlock>();
    expectTypeOf(link).toMatchTypeOf<ContentBlock>();
  });

  it('ConversationMessage requires blocks array', () => {
    const msg: ConversationMessage = {
      id: '1',
      sessionId: 's1',
      timestamp: new Date().toISOString(),
      role: 'neptune',
      blocks: [{ type: 'text', content: 'Morning.' }],
    };
    expectTypeOf(msg.blocks).toMatchTypeOf<ContentBlock[]>();
  });

  it('StreamEvent discriminates on type', () => {
    const delta: StreamEvent = { type: 'text-delta', content: 'Hi' };
    expectTypeOf(delta).toMatchTypeOf<StreamEvent>();
  });
});
