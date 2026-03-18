import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { NeptuneConversation } from '@/components/home/NeptuneConversation';

// ---------------------------------------------------------------------------
// Mock child components so we don't render deeply nested trees
// ---------------------------------------------------------------------------

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/home/ConversationMessage', () => ({
  ConversationMessage: ({ message }: { message: { role: string; blocks: { content?: string }[] } }) => (
    <div data-testid="conversation-message" data-role={message.role}>
      {message.blocks.map((b, i) => (
        <span key={i}>{b.content}</span>
      ))}
    </div>
  ),
}));

vi.mock('@/components/home/ConversationInput', () => ({
  ConversationInput: ({ onSubmit, isLoading }: { onSubmit: (v: string) => void; isLoading?: boolean }) => (
    <div data-testid="conversation-input" data-loading={String(isLoading)}>
      <input
        placeholder="Talk to Neptune..."
        onChange={() => {}}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit((e.target as HTMLInputElement).value);
        }}
      />
    </div>
  ),
}));

vi.mock('@/components/home/MicroFeedback', () => ({
  MicroFeedback: ({ messageId }: { messageId: string }) => (
    <div data-testid="micro-feedback" data-message-id={messageId} />
  ),
}));

// ---------------------------------------------------------------------------
// SSE stream helpers
// ---------------------------------------------------------------------------

function buildSseBody(events: object[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const chunks = events.map((e) => encoder.encode(`data: ${JSON.stringify(e)}\n\n`));

  let idx = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (idx < chunks.length) {
        controller.enqueue(chunks[idx++]);
      } else {
        controller.close();
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NeptuneConversation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the conversation container (data-neptune-conversation)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        body: buildSseBody([
          { type: 'session', session: { id: 's1', conversationId: 'c1', startedAt: '', lastActiveAt: '' } },
          {
            type: 'message-complete',
            message: {
              id: 'msg-1',
              sessionId: 's1',
              timestamp: '2026-03-18T00:00:00Z',
              role: 'neptune',
              blocks: [{ type: 'text', content: 'Hello from Neptune' }],
            },
          },
        ]),
      }),
    );

    render(<NeptuneConversation />);

    const container = document.querySelector('[data-neptune-conversation]');
    expect(container).toBeInTheDocument();
  });

  it('renders the input field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        body: buildSseBody([
          { type: 'session', session: { id: 's1', conversationId: 'c1', startedAt: '', lastActiveAt: '' } },
        ]),
      }),
    );

    render(<NeptuneConversation />);

    expect(screen.getByTestId('conversation-input')).toBeInTheDocument();
  });

  it('shows fallback message on fetch error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));

    render(<NeptuneConversation />);

    await waitFor(() => {
      const errorEl = document.querySelector('p.italic');
      expect(errorEl).toBeInTheDocument();
      expect(errorEl?.textContent).toContain('trouble pulling everything together');
    });
  });
});
