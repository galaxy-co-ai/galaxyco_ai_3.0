import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NeptuneFeed } from '@/components/home/NeptuneFeed';
import type { FeedCard } from '@/types/home-feed';

global.fetch = vi.fn();

describe('NeptuneFeed', () => {
  const cards: FeedCard[] = [
    {
      id: 'card-1',
      category: 'lead',
      icon: '👥',
      headline: 'Hot lead waiting',
      context: 'Someone wants to hire you.',
      chips: [{ id: 'c1', label: 'Go', action: 'go', variant: 'primary' }],
      priority: 9,
      dismissible: true,
    },
    {
      id: 'card-2',
      category: 'campaign',
      icon: '📈',
      headline: 'Campaign results',
      context: '18% open rate.',
      chips: [{ id: 'c2', label: 'See', action: 'see', variant: 'primary' }],
      priority: 6,
      dismissible: true,
    },
  ];

  it('should render greeting', () => {
    render(
      <NeptuneFeed greeting="Good morning, Alex." cards={cards} isNewUser={false} />,
    );
    expect(screen.getByText('Good morning, Alex.')).toBeDefined();
  });

  it('should render all cards', () => {
    render(
      <NeptuneFeed greeting="Good morning, Alex." cards={cards} isNewUser={false} />,
    );
    expect(screen.getByText('Hot lead waiting')).toBeDefined();
    expect(screen.getByText('Campaign results')).toBeDefined();
  });

  it('should render the Neptune input at the bottom', () => {
    render(
      <NeptuneFeed greeting="Good morning, Alex." cards={cards} isNewUser={false} />,
    );
    const input = screen.getByPlaceholderText(/Talk to Neptune/i);
    expect(input).toBeDefined();
  });

  it('should show new user subtitle when isNewUser is true', () => {
    render(
      <NeptuneFeed greeting="Good morning, Alex." cards={cards} isNewUser={true} />,
    );
    expect(screen.getByText(/your business partner/i)).toBeDefined();
  });
});
