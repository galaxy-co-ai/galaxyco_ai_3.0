import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContentBlockRenderer } from '@/components/home/ContentBlockRenderer';
import type { ContentBlock } from '@/types/neptune-conversation';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('ContentBlockRenderer', () => {
  it('renders text block as paragraph', () => {
    const block: ContentBlock = { type: 'text', content: 'Hello from Neptune.' };
    render(<ContentBlockRenderer block={block} />);
    const el = screen.getByText('Hello from Neptune.');
    expect(el.tagName).toBe('P');
    expect(el.className).toContain('text-foreground');
  });

  it('renders module-link block as a link', () => {
    const block: ContentBlock = { type: 'module-link', module: 'crm', label: 'Go to CRM' };
    render(<ContentBlockRenderer block={block} />);
    const link = screen.getByRole('link', { name: 'Go to CRM' });
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).toBe('/crm');
  });

  it('renders action-affordance block with buttons', () => {
    const block: ContentBlock = {
      type: 'action-affordance',
      prompt: 'What would you like to do?',
      actions: [
        { label: 'View report', intent: 'view_report' },
        { label: 'Dismiss', intent: 'dismiss' },
      ],
    };
    const onAction = vi.fn();
    render(<ContentBlockRenderer block={block} onAction={onAction} />);

    expect(screen.getByText('What would you like to do?')).toBeDefined();
    expect(screen.getByText('View report')).toBeDefined();
    expect(screen.getByText('Dismiss')).toBeDefined();

    fireEvent.click(screen.getByText('View report'));
    expect(onAction).toHaveBeenCalledWith(block.actions[0]);
  });

  it('renders visual block placeholder with data-chart-type', () => {
    const block: ContentBlock = {
      type: 'visual',
      spec: {
        chartType: 'bar',
        data: {},
        interactive: false,
        title: 'Revenue by Month',
      },
    };
    render(<ContentBlockRenderer block={block} />);
    const el = screen.getByText('Revenue by Month');
    expect(el.getAttribute('data-chart-type')).toBe('bar');
  });
});
