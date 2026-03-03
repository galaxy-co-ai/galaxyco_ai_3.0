import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SmartChipBar } from '@/components/home/SmartChipBar';
import type { SmartChip } from '@/types/home-feed';

describe('SmartChipBar', () => {
  const chips: SmartChip[] = [
    { id: 'c1', label: 'Reach out', action: 'contact_lead', variant: 'primary' },
    { id: 'c2', label: 'Review', action: 'view_lead', variant: 'secondary' },
    { id: 'c3', label: 'Skip', action: 'dismiss', variant: 'ghost' },
  ];

  it('should render all chips', () => {
    render(<SmartChipBar chips={chips} onChipClick={vi.fn()} />);
    expect(screen.getByText('Reach out')).toBeDefined();
    expect(screen.getByText('Review')).toBeDefined();
    expect(screen.getByText('Skip')).toBeDefined();
  });

  it('should call onChipClick with chip data when clicked', () => {
    const onClick = vi.fn();
    render(<SmartChipBar chips={chips} onChipClick={onClick} />);
    fireEvent.click(screen.getByText('Reach out'));
    expect(onClick).toHaveBeenCalledWith(chips[0]);
  });

  it('should disable all chips when loading', () => {
    render(<SmartChipBar chips={chips} onChipClick={vi.fn()} loading />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => expect(btn).toHaveProperty('disabled', true));
  });
});
