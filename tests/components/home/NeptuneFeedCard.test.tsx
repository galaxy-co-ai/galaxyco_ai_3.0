import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NeptuneFeedCard } from '@/components/home/NeptuneFeedCard';
import type { FeedCard } from '@/types/home-feed';

describe('NeptuneFeedCard', () => {
  const card: FeedCard = {
    id: 'card-1',
    category: 'lead',
    icon: '👥',
    headline: 'New lead: Kitchen remodel, Frisco',
    context: 'Came through your website. Matches your ideal client profile.',
    chips: [
      { id: 'c1', label: 'Reach out', action: 'contact_lead', variant: 'primary' },
      { id: 'c2', label: 'Skip', action: 'dismiss', variant: 'ghost' },
    ],
    priority: 9,
    dismissible: true,
  };

  it('should render headline and context', () => {
    render(<NeptuneFeedCard card={card} onChipClick={vi.fn()} />);
    expect(screen.getByText('New lead: Kitchen remodel, Frisco')).toBeDefined();
    expect(screen.getByText(/Came through your website/)).toBeDefined();
  });

  it('should render icon', () => {
    render(<NeptuneFeedCard card={card} onChipClick={vi.fn()} />);
    expect(screen.getByText('👥')).toBeDefined();
  });

  it('should render smart chips', () => {
    render(<NeptuneFeedCard card={card} onChipClick={vi.fn()} />);
    expect(screen.getByText('Reach out')).toBeDefined();
    expect(screen.getByText('Skip')).toBeDefined();
  });

  it('should call onChipClick with chip and cardId', () => {
    const onClick = vi.fn();
    render(<NeptuneFeedCard card={card} onChipClick={onClick} />);
    fireEvent.click(screen.getByText('Reach out'));
    expect(onClick).toHaveBeenCalledWith(card.chips[0], 'card-1');
  });

  it('should show expansion content when provided', () => {
    const expansion = {
      cardId: 'card-1',
      message: 'Done. I drafted an intro email.',
      chips: [{ id: 'e1', label: 'Edit draft', action: 'edit', variant: 'primary' as const }],
    };
    render(
      <NeptuneFeedCard card={card} onChipClick={vi.fn()} expansion={expansion} />,
    );
    expect(screen.getByText(/drafted an intro email/)).toBeDefined();
    expect(screen.getByText('Edit draft')).toBeDefined();
  });
});
