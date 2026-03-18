'use client';

import { useState, useCallback } from 'react';
import { AmbientPulse } from './AmbientPulse';

interface ConversationInputProps {
  onSubmit: (message: string) => void;
  isLoading?: boolean;
}

export function ConversationInput({ onSubmit, isLoading = false }: ConversationInputProps) {
  const [value, setValue] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;
      onSubmit(trimmed);
      setValue('');
    },
    [value, onSubmit],
  );

  return (
    <div className="glass-surface fixed bottom-0 left-0 right-0 z-30 px-6 py-4">
      <form className="relative mx-auto max-w-2xl" onSubmit={handleSubmit}>
        <AmbientPulse isActive={!isLoading} />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Talk to Neptune..."
          disabled={isLoading}
          className={[
            'glass-input w-full rounded-xl px-5 py-3 pl-6',
            'font-[family-name:var(--font-dm-sans)] text-sm',
            'text-foreground placeholder:text-muted-foreground',
            'disabled:opacity-50',
          ].join(' ')}
        />
      </form>
    </div>
  );
}
