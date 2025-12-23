import { useEffect, useCallback, useRef } from 'react';
import { 
  useMyPresence, 
  useOthers, 
  useSelf,
  useUpdateMyPresence 
} from '@/lib/liveblocks';
import { logger } from '@/lib/logger';

export interface NeptunePresenceState {
  isTyping: boolean;
  lastActive: number;
  currentMessage?: string;
}

export interface OtherUser {
  connectionId: number;
  id: string;
  info: {
    name: string;
    email: string;
    avatar?: string;
    color: string;
  };
  presence: NeptunePresenceState;
}

/**
 * Hook for managing Neptune conversation presence
 * Tracks typing state, active users, and real-time updates
 */
export function useNeptunePresence() {
  const [myPresence, updateMyPresence] = useMyPresence();
  const others = useOthers();
  const self = useSelf();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update typing state
  const setTyping = useCallback((isTyping: boolean) => {
    updateMyPresence({
      isTyping,
      lastActive: Date.now(),
    });

    // Auto-clear typing state after 3 seconds of inactivity
    if (isTyping) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        updateMyPresence({
          isTyping: false,
          lastActive: Date.now(),
        });
      }, 3000);
    }
  }, [updateMyPresence]);

  // Update last active timestamp
  const updateActivity = useCallback(() => {
    updateMyPresence({
      lastActive: Date.now(),
    });
  }, [updateMyPresence]);

  // Get list of other users with their presence
  const otherUsers: OtherUser[] = others.map((other) => ({
    connectionId: other.connectionId,
    id: other.id || 'unknown',
    info: {
      name: other.info?.name || 'Unknown User',
      email: other.info?.email || '',
      avatar: other.info?.avatar,
      color: other.info?.color || '#64B5F6',
    },
    presence: {
      isTyping: other.presence?.isTyping || false,
      lastActive: other.presence?.lastActive || Date.now(),
      currentMessage: other.presence?.currentMessage,
    },
  }));

  // Get users who are currently typing
  const typingUsers = otherUsers.filter((user) => user.presence.isTyping);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Log presence changes in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('[Neptune Presence] State updated', {
        myPresence,
        otherUsersCount: otherUsers.length,
        typingUsersCount: typingUsers.length,
      });
    }
  }, [myPresence, otherUsers.length, typingUsers.length]);

  return {
    // My presence state
    myPresence,
    updateMyPresence,
    
    // Typing state
    setTyping,
    isTyping: myPresence.isTyping || false,
    
    // Activity tracking
    updateActivity,
    
    // Other users
    otherUsers,
    otherUsersCount: otherUsers.length,
    
    // Typing indicators
    typingUsers,
    someoneIsTyping: typingUsers.length > 0,
    
    // Self info (for debugging)
    self: self ? {
      id: self.id,
      connectionId: self.connectionId,
      info: self.info,
    } : null,
  };
}

/**
 * Hook to handle input changes and update typing state
 */
export function useTypingIndicator() {
  const { setTyping } = useNeptunePresence();
  const lastValueRef = useRef<string>('');

  const handleInputChange = useCallback((value: string) => {
    const isTyping = value.length > 0 && value !== lastValueRef.current;
    setTyping(isTyping);
    lastValueRef.current = value;
  }, [setTyping]);

  const clearTyping = useCallback(() => {
    setTyping(false);
    lastValueRef.current = '';
  }, [setTyping]);

  return {
    handleInputChange,
    clearTyping,
  };
}
