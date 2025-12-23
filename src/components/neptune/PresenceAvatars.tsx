"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNeptunePresence } from '@/hooks/useNeptunePresence';
import { cn } from '@/lib/utils';
import { Users } from 'lucide-react';

interface PresenceAvatarsProps {
  className?: string;
  maxVisible?: number;
}

/**
 * Display avatars of users currently active in the Neptune conversation
 * Shows up to maxVisible avatars with overflow count
 */
export function PresenceAvatars({ 
  className, 
  maxVisible = 5 
}: PresenceAvatarsProps) {
  const { otherUsers, otherUsersCount } = useNeptunePresence();

  // Don't render if no other users
  if (otherUsersCount === 0) {
    return null;
  }

  const visibleUsers = otherUsers.slice(0, maxVisible);
  const overflowCount = otherUsersCount - maxVisible;

  return (
    <TooltipProvider>
      <div className={cn('flex items-center gap-1', className)}>
        {/* Active indicator */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>{otherUsersCount} {otherUsersCount === 1 ? 'person' : 'people'} here</span>
        </div>

        {/* Avatar stack */}
        <div className="flex -space-x-2">
          {visibleUsers.map((user) => (
            <Tooltip key={user.connectionId}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="h-8 w-8 border-2 border-background ring-2 ring-offset-1 ring-offset-background transition-transform hover:scale-110 hover:z-10">
                    {user.info.avatar && (
                      <AvatarImage 
                        src={user.info.avatar} 
                        alt={user.info.name}
                      />
                    )}
                    <AvatarFallback 
                      style={{ backgroundColor: user.info.color }}
                      className="text-white text-xs font-medium"
                    >
                      {getInitials(user.info.name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Typing indicator pulse */}
                  {user.presence.isTyping && (
                    <div 
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background animate-pulse"
                      style={{ backgroundColor: user.info.color }}
                    />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{user.info.name}</span>
                  {user.presence.isTyping && (
                    <span className="text-muted-foreground">Typing...</span>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Overflow count */}
          {overflowCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted border-2 border-background text-xs font-medium text-muted-foreground hover:scale-110 transition-transform cursor-default">
                  +{overflowCount}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {overflowCount} more {overflowCount === 1 ? 'person' : 'people'}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

/**
 * Get initials from a name (max 2 characters)
 */
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
