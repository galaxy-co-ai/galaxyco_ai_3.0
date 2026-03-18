'use client';

import type { ActionOption } from '@/types/neptune-conversation';

interface ActionAffordanceProps {
  prompt: string;
  actions: ActionOption[];
  onAction?: (action: ActionOption) => void;
}

export function ActionAffordance({ prompt, actions, onAction }: ActionAffordanceProps) {
  return (
    <div className="flex flex-col gap-2 font-[family-name:var(--font-dm-sans)]">
      <p className="text-xs italic text-muted-foreground">{prompt}</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.intent}
            onClick={() => onAction?.(action)}
            className="rounded-lg border bg-card px-3 py-1.5 text-xs text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
