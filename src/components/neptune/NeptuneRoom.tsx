"use client";

import { ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { RoomProvider } from '@/lib/liveblocks';
import { getNeptuneRoomId } from '@/lib/liveblocks';
import { logger } from '@/lib/logger';

interface NeptuneRoomProps {
  conversationId: string | null;
  children: ReactNode;
}

/**
 * Wrapper component that provides Liveblocks RoomProvider for Neptune conversations
 * Handles room ID generation and initial presence state
 */
export function NeptuneRoom({ conversationId, children }: NeptuneRoomProps) {
  const { user } = useUser();

  // Don't render room if no conversation ID or user
  if (!conversationId || !user) {
    return <>{children}</>;
  }

  // Get workspace ID from user metadata
  // For now, use userId as workspaceId (TODO: get actual workspace from user metadata/database)
  const workspaceId = user.publicMetadata?.workspaceId as string || user.id;

  // Generate room ID
  const roomId = getNeptuneRoomId(workspaceId, conversationId);

  logger.debug('[Neptune Room] Initializing', {
    conversationId,
    workspaceId,
    roomId,
  });

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        isTyping: false,
        lastActive: Date.now(),
      }}
      initialStorage={{
        content: '',
        lastEditedBy: null,
        lastEditedAt: null,
      }}
    >
      {children}
    </RoomProvider>
  );
}
