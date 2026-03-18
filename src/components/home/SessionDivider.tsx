'use client';

interface SessionDividerProps {
  date: string;
}

export function SessionDivider({ date }: SessionDividerProps) {
  const formatted = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="h-px flex-1 bg-border/50" />
      <span className="text-xs text-muted-foreground">{formatted}</span>
      <div className="h-px flex-1 bg-border/50" />
    </div>
  );
}
