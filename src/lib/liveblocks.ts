import { createClient } from '@liveblocks/client';
import { createRoomContext, createLiveblocksContext } from '@liveblocks/react';

// Create the Liveblocks client
export const liveblocksClient = createClient({
  authEndpoint: '/api/liveblocks/auth',
  throttle: 100,
});

// Presence type for Neptune conversations
export type Presence = {
  isTyping: boolean;
  lastActive: number;
  currentMessage?: string;
};

// Storage type for collaborative documents
export type Storage = {
  content: string;
  lastEditedBy: string | null;
  lastEditedAt: string | null;
};

// User metadata for presence
export type UserMeta = {
  id: string;
  info: {
    name: string;
    email: string;
    avatar?: string;
    color: string;
  };
};

// Room event types - must be JSON serializable
export type RoomEvent = {
  type: 'CURSOR_CLICK' | 'SELECTION_CHANGE' | 'CONTENT_SAVED';
  userId: string;
  data?: string | number | boolean | null;
};

// Create Liveblocks context
export const {
  suspense: {
    RoomProvider,
    useRoom,
    useMyPresence,
    useUpdateMyPresence,
    useSelf,
    useOthers,
    useOthersMapped,
    useOthersConnectionIds,
    useOther,
    useBroadcastEvent,
    useEventListener,
    useErrorListener,
    useStorage,
    useMutation,
    useStatus,
  },
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(liveblocksClient);

// Export Liveblocks provider context
export const {
  LiveblocksProvider,
  useInboxNotifications,
  useUnreadInboxNotificationsCount,
} = createLiveblocksContext(liveblocksClient);

// Generate a random color for user presence
export function generateUserColor(): string {
  const colors = [
    '#E57373', '#F06292', '#BA68C8', '#9575CD', '#7986CB',
    '#64B5F6', '#4FC3F7', '#4DD0E1', '#4DB6AC', '#81C784',
    '#AED581', '#DCE775', '#FFD54F', '#FFB74D', '#FF8A65',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Generate room ID from document ID
export function getDocumentRoomId(documentId: string): string {
  return `document:${documentId}`;
}

// Generate room ID for Neptune conversations
export function getNeptuneRoomId(workspaceId: string, conversationId: string): string {
  return `neptune:workspace:${workspaceId}:conversation:${conversationId}`;
}
