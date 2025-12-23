"use client";

import { useNeptunePresence } from '@/hooks/useNeptunePresence';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  className?: string;
}

/**
 * Show typing indicators for other users in the Neptune conversation
 * Displays "{Name} is typing..." with animated dots
 */
export function TypingIndicator({ className }: TypingIndicatorProps) {
  const { typingUsers } = useNeptunePresence();

  // Don't render if no one is typing
  if (typingUsers.length === 0) {
    return null;
  }

  // Format names based on how many users are typing
  const formatTypingText = (): string => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].info.name} is typing`;
    }
    
    if (typingUsers.length === 2) {
      return `${typingUsers[0].info.name} and ${typingUsers[1].info.name} are typing`;
    }
    
    if (typingUsers.length === 3) {
      return `${typingUsers[0].info.name}, ${typingUsers[1].info.name}, and ${typingUsers[2].info.name} are typing`;
    }
    
    // More than 3 users
    return `${typingUsers[0].info.name}, ${typingUsers[1].info.name}, and ${typingUsers.length - 2} others are typing`;
  };

  return (
    <div 
      className={cn(
        'flex items-center gap-2 text-sm text-muted-foreground px-3 py-2',
        className
      )}
    >
      <span>{formatTypingText()}</span>
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
        <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
      </div>
    </div>
  );
}
