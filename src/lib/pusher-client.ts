'use client';

import Pusher from 'pusher-js';
import type { Channel, PresenceChannel } from 'pusher-js';

// ============================================================================
// PUSHER CLIENT SINGLETON
// ============================================================================

let pusherClient: Pusher | null = null;

/**
 * Get or create the Pusher client instance
 */
export function getPusherClient(): Pusher | null {
  if (typeof window === 'undefined') {
    return null;
  }

  if (pusherClient) {
    return pusherClient;
  }

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2';

  if (!key) {
    console.warn('[Pusher] Client not configured - missing NEXT_PUBLIC_PUSHER_KEY');
    return null;
  }

  pusherClient = new Pusher(key, {
    cluster,
    authEndpoint: '/api/pusher/auth',
    authTransport: 'ajax',
  });

  return pusherClient;
}

/**
 * Check if Pusher client is available
 */
export function isPusherClientAvailable(): boolean {
  return !!(typeof window !== 'undefined' && process.env.NEXT_PUBLIC_PUSHER_KEY);
}

/**
 * Disconnect the Pusher client
 */
export function disconnectPusher(): void {
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
  }
}

// ============================================================================
// CHANNEL HELPERS
// ============================================================================

/**
 * Subscribe to a workspace channel
 */
export function subscribeToWorkspace(workspaceId: string): Channel | null {
  const client = getPusherClient();
  if (!client) return null;

  const channelName = `private-workspace-${workspaceId}`;
  return client.subscribe(channelName);
}

/**
 * Subscribe to a user channel
 */
export function subscribeToUser(userId: string): Channel | null {
  const client = getPusherClient();
  if (!client) return null;

  const channelName = `private-user-${userId}`;
  return client.subscribe(channelName);
}

/**
 * Subscribe to a presence channel (for online status)
 */
export function subscribeToPresence(workspaceId: string): PresenceChannel | null {
  const client = getPusherClient();
  if (!client) return null;

  const channelName = `presence-workspace-${workspaceId}`;
  return client.subscribe(channelName) as PresenceChannel;
}

/**
 * Unsubscribe from a channel
 */
export function unsubscribeFromChannel(channelName: string): void {
  const client = getPusherClient();
  if (client) {
    client.unsubscribe(channelName);
  }
}

// ============================================================================
// EVENT TYPES (matching server types)
// ============================================================================

export type EventType =
  | 'activity:new'
  | 'notification:new'
  | 'lead:created'
  | 'lead:updated'
  | 'lead:scored'
  | 'deal:created'
  | 'deal:updated'
  | 'deal:won'
  | 'deal:lost'
  | 'campaign:sent'
  | 'campaign:completed'
  | 'agent:started'
  | 'agent:completed'
  | 'agent:failed'
  | 'document:uploaded'
  | 'document:indexed'
  | 'chat:message'
  | 'user:online'
  | 'user:offline';

export interface PusherEvent<T = Record<string, unknown>> {
  type: EventType;
  data: T;
  timestamp: string;
  userId?: string;
  workspaceId?: string;
}

// ============================================================================
// TYPE-SAFE EVENT BINDING
// ============================================================================

/**
 * Bind to an event with type safety
 */
export function bindEvent<T = Record<string, unknown>>(
  channel: Channel,
  eventType: EventType,
  callback: (event: PusherEvent<T>) => void
): void {
  channel.bind(eventType, callback);
}

/**
 * Unbind from an event
 */
export function unbindEvent(
  channel: Channel,
  eventType: EventType,
  callback?: (event: PusherEvent) => void
): void {
  if (callback) {
    channel.unbind(eventType, callback);
  } else {
    channel.unbind(eventType);
  }
}
