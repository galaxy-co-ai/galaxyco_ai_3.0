import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ConversationMessage } from '@/components/home/ConversationMessage';
import type { ConversationMessage as MessageType } from '@/types/neptune-conversation';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, 'data-role': dataRole, ...rest }: React.HTMLAttributes<HTMLDivElement> & { 'data-role'?: string }) => (
      <div className={className} data-role={dataRole}>
        {children}
      </div>
    ),
  },
}));

// Mock ContentBlockRenderer to isolate this component's logic
vi.mock('@/components/home/ContentBlockRenderer', () => ({
  ContentBlockRenderer: ({ block }: { block: { type: string; content?: string } }) => (
    <div data-testid="content-block" data-block-type={block.type}>
      {block.type === 'text' ? block.content : block.type}
    </div>
  ),
}));

const neptuneMessage: MessageType = {
  id: 'msg-1',
  sessionId: 'session-1',
  timestamp: '2026-03-18T00:00:00Z',
  role: 'neptune',
  blocks: [
    { type: 'text', content: 'Hello, how can I help?' },
    { type: 'text', content: 'Here is some more info.' },
  ],
};

const userMessage: MessageType = {
  id: 'msg-2',
  sessionId: 'session-1',
  timestamp: '2026-03-18T00:01:00Z',
  role: 'user',
  blocks: [
    { type: 'text', content: 'Show me my revenue.' },
  ],
};

describe('ConversationMessage', () => {
  it('renders neptune message with text blocks', () => {
    render(<ConversationMessage message={neptuneMessage} />);

    const blocks = screen.getAllByTestId('content-block');
    expect(blocks).toHaveLength(2);
    expect(screen.getByText('Hello, how can I help?')).toBeInTheDocument();
    expect(screen.getByText('Here is some more info.')).toBeInTheDocument();
  });

  it('renders user message as plain text', () => {
    render(<ConversationMessage message={userMessage} />);

    const blocks = screen.getAllByTestId('content-block');
    expect(blocks).toHaveLength(1);
    expect(screen.getByText('Show me my revenue.')).toBeInTheDocument();
  });

  it('applies different styling for neptune vs user (data-role attribute)', () => {
    const { rerender } = render(<ConversationMessage message={neptuneMessage} />);

    let wrapper = document.querySelector('[data-role="neptune"]') as HTMLElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper.className).toContain('space-y-2');
    expect(wrapper.className).not.toContain('ml-auto');

    rerender(<ConversationMessage message={userMessage} />);

    wrapper = document.querySelector('[data-role="user"]') as HTMLElement;
    expect(wrapper).toBeInTheDocument();
    expect(wrapper.className).toContain('ml-auto');
    expect(wrapper.className).toContain('rounded-xl');
    expect(wrapper.className).toContain('bg-card');
  });
});
