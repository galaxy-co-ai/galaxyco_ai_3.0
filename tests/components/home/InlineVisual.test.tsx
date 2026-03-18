import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InlineVisual } from '@/components/home/InlineVisual';
import type { VisualSpec } from '@/types/neptune-conversation';

// Recharts uses ResizeObserver + canvas — mock the dynamic imports so they
// return empty fragments in happy-dom, preventing hydration errors.
vi.mock('next/dynamic', () => ({
  default: (_loader: unknown, _opts?: unknown) => {
    // Return a no-op component for every lazy-loaded Recharts chunk.
    const Stub = () => null;
    Stub.displayName = 'DynamicStub';
    return Stub;
  },
}));

describe('InlineVisual', () => {
  it('renders metric with formatted number', () => {
    const spec: VisualSpec = {
      chartType: 'metric',
      data: { value: 4200, label: 'Revenue', prefix: '$' },
      interactive: false,
    };

    render(<InlineVisual spec={spec} />);

    expect(screen.getByText('$4,200')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
  });

  it('renders trend with direction arrow', () => {
    const spec: VisualSpec = {
      chartType: 'trend',
      data: { value: 12, label: 'Growth', suffix: '%', direction: 'up' },
      interactive: false,
    };

    render(<InlineVisual spec={spec} />);

    // Arrow character should appear somewhere in the document
    expect(screen.getByText(/↑/)).toBeInTheDocument();
    expect(screen.getByText('Growth')).toBeInTheDocument();
  });

  it('renders chart container for line type with data-chart-type', () => {
    const spec: VisualSpec = {
      chartType: 'line',
      title: 'Monthly Sales',
      data: {
        points: [
          { label: 'Jan', value: 100 },
          { label: 'Feb', value: 200 },
        ],
      },
      interactive: false,
    };

    const { container } = render(<InlineVisual spec={spec} />);

    // Wrapper div carries the attribute regardless of whether Recharts renders
    const wrapper = container.querySelector('[data-chart-type="line"]');
    expect(wrapper).toBeInTheDocument();
    expect(screen.getByText('Monthly Sales')).toBeInTheDocument();
  });
});
