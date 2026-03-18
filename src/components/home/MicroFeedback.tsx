'use client';

import { useState } from 'react';

interface MicroFeedbackProps {
  messageId: string;
  onFeedback?: (messageId: string, signal: 'more' | 'less') => void;
}

export function MicroFeedback({ messageId, onFeedback }: MicroFeedbackProps) {
  const [given, setGiven] = useState(false);

  if (given) return null;

  function handleClick(signal: 'more' | 'less') {
    setGiven(true);
    onFeedback?.(messageId, signal);
  }

  return (
    <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover/message:opacity-100">
      <button
        type="button"
        onClick={() => handleClick('more')}
        className="text-[10px] text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded px-1 py-0.5"
      >
        more like this
      </button>
      <span className="text-[10px] text-muted-foreground select-none">·</span>
      <button
        type="button"
        onClick={() => handleClick('less')}
        className="text-[10px] text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded px-1 py-0.5"
      >
        less like this
      </button>
    </div>
  );
}
