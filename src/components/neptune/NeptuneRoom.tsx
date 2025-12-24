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
  const { user, isLoaded } = useUser();

  // Render children immediately if no conversation ID (dashboard with null conversationId)
  // This prevents blocking the entire page while Clerk/Liveblocks loads
  if (!conversationId) {
    return <>{children}</>;
  }

  // If Clerk hasn't loaded yet, render children without Liveblocks
  // Liveblocks features will be unavailable but page won't be blocked
  if (!isLoaded || !user) {
    logger.debug('[Neptune Room] User not loaded yet, skipping Liveblocks');
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
