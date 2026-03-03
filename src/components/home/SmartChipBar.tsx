'use client';

import { cn } from '@/lib/utils';
import type { SmartChip } from '@/types/home-feed';

interface SmartChipBarProps {
  chips: SmartChip[];
  onChipClick: (chip: SmartChip) => void;
  loading?: boolean;
}

const variantStyles: Record<SmartChip['variant'], string> = {
  primary: [
    'bg-nebula-teal text-white',
    'hover:bg-nebula-teal/90 hover:-translate-y-px',
    'active:scale-[0.98]',
  ].join(' '),
  secondary: [
    'border border-foreground/15 text-foreground/80',
    'hover:bg-foreground/5 hover:text-foreground hover:border-foreground/25',
    'active:scale-[0.98]',
  ].join(' '),
  ghost: [
    'text-muted-foreground',
    'hover:text-foreground hover:bg-foreground/5',
    'active:scale-[0.98]',
  ].join(' '),
};

export function SmartChipBar({ chips, onChipClick, loading }: SmartChipBarProps) {
  return (
    <div className="flex flex-wrap gap-2 pt-3">
      {chips.map((chip) => (
        <button
          key={chip.id}
          onClick={() => onChipClick(chip)}
          disabled={loading}
          className={cn(
            'rounded-full px-4 py-1.5',
            'font-[family-name:var(--font-dm-sans)] text-sm font-medium',
            'transition-all',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1',
            variantStyles[chip.variant],
          )}
          style={{
            transitionDuration: 'var(--duration-fast)',
            transitionTimingFunction: 'var(--ease-standard)',
          }}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
