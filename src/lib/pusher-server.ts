import Pusher from 'pusher';
import { logger } from '@/lib/logger';

// ============================================================================
// PUSHER SERVER CLIENT
// ============================================================================

let pusherServer: Pusher | null = null;

/**
 * Get or create the Pusher server instance
 */
function getPusher(): Pusher {
  if (pusherServer) {
    return pusherServer;
  }

  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.PUSHER_CLUSTER || 'us2';

  if (!appId || !key || !secret) {
    throw new Error(
      'Pusher not configured. Please set PUSHER_APP_ID, PUSHER_KEY, and PUSHER_SECRET environment variables.'
    );
  }

  pusherServer = new Pusher({
    appId,
    key,
    secret,
    cluster,
    useTLS: true,
  });

  return pusherServer;
}

/**
 * Check if Pusher is configured
 */
export function isPusherConfigured(): boolean {
  return !!(process.env.PUSHER_APP_ID && process.env.PUSHER_KEY && process.env.PUSHER_SECRET);
}

// ============================================================================
// CHANNEL NAMING CONVENTIONS
// ============================================================================

/**
 * Get the private channel name for a workspace
 * Used for workspace-wide events (activity feed, notifications)
 */
export function getWorkspaceChannel(workspaceId: string): string {
  return `private-workspace-${workspaceId}`;
}

/**
 * Get the private channel name for a user
 * Used for user-specific notifications
 */
export function getUserChannel(userId: string): string {
  return `private-user-${userId}`;
}

/**
 * Get the presence channel name for a workspace
 * Used for tracking online users
 */
export function getPresenceChannel(workspaceId: string): string {
  return `presence-workspace-${workspaceId}`;
}

// ============================================================================
// EVENT TYPES
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

export interface PusherEvent {
  type: EventType;
  data: Record<string, unknown>;
  timestamp: string;
  userId?: string;
  workspaceId?: string;
}

// ============================================================================
// TRIGGER EVENTS
// ============================================================================

/**
 * Trigger an event on a workspace channel
 */
export async function triggerWorkspaceEvent(
  workspaceId: string,
  eventType: EventType,
  data: Record<string, unknown>
): Promise<boolean> {
  if (!isPusherConfigured()) {
    logger.debug('[Pusher] Not configured - skipping event', { eventType });
    return false;
  }

  try {
    const pusher = getPusher();
    const channel = getWorkspaceChannel(workspaceId);

    const event: PusherEvent = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      workspaceId,
    };

    await pusher.trigger(channel, eventType, event);

    logger.debug('[Pusher] Event triggered', { channel, eventType });
    return true;
  } catch (error) {
    logger.error('[Pusher] Failed to trigger event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventType,
    });
    return false;
  }
}

/**
 * Trigger an event on a user channel
 */
export async function triggerUserEvent(
  userId: string,
  eventType: EventType,
  data: Record<string, unknown>
): Promise<boolean> {
  if (!isPusherConfigured()) {
    return false;
  }

  try {
    const pusher = getPusher();
    const channel = getUserChannel(userId);

    const event: PusherEvent = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      userId,
    };

    await pusher.trigger(channel, eventType, event);

    logger.debug('[Pusher] User event triggered', { channel, eventType });
    return true;
  } catch (error) {
    logger.error('[Pusher] Failed to trigger user event', {
      error: error instanceof Error ? error.message : 'Unknown error',
      eventType,
    });
    return false;
  }
}

/**
 * Trigger multiple events at once (batch)
 */
export async function triggerBatchEvents(
  events: Array<{
    channel: string;
    eventType: EventType;
    data: Record<string, unknown>;
  }>
): Promise<boolean> {
  if (!isPusherConfigured() || events.length === 0) {
    return false;
  }

  try {
    const pusher = getPusher();

    const batch = events.map((e) => ({
      channel: e.channel,
      name: e.eventType,
      data: {
        type: e.eventType,
        data: e.data,
        timestamp: new Date().toISOString(),
      },
    }));

    await pusher.triggerBatch(batch);

    logger.debug('[Pusher] Batch events triggered', { count: events.length });
    return true;
  } catch (error) {
    logger.error('[Pusher] Failed to trigger batch events', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

// ============================================================================
// CONVENIENCE METHODS FOR COMMON EVENTS
// ============================================================================

/**
 * Broadcast a new activity to the workspace
 */
export async function broadcastActivity(
  workspaceId: string,
  activity: {
    id: string;
    type: string;
    title: string;
    description?: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
    userName?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<boolean> {
  return triggerWorkspaceEvent(workspaceId, 'activity:new', activity);
}

/**
 * Send a notification to a specific user
 */
export async function sendNotification(
  userId: string,
  notification: {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    actionUrl?: string;
    actionLabel?: string;
  }
): Promise<boolean> {
  return triggerUserEvent(userId, 'notification:new', notification);
}

/**
 * Broadcast a lead update
 */
export async function broadcastLeadUpdate(
  workspaceId: string,
  action: 'created' | 'updated' | 'scored',
  lead: {
    id: string;
    name: string;
    email?: string;
    company?: string;
    stage?: string;
    score?: number;
  }
): Promise<boolean> {
  const eventType: EventType = `lead:${action}`;
  return triggerWorkspaceEvent(workspaceId, eventType, lead);
}

/**
 * Broadcast a deal update
 */
export async function broadcastDealUpdate(
  workspaceId: string,
  action: 'created' | 'updated' | 'won' | 'lost',
  deal: {
    id: string;
    name: string;
    value?: number;
    stage?: string;
    company?: string;
  }
): Promise<boolean> {
  const eventType: EventType = `deal:${action}`;
  return triggerWorkspaceEvent(workspaceId, eventType, deal);
}

/**
 * Broadcast agent execution status
 */
export async function broadcastAgentStatus(
  workspaceId: string,
  status: 'started' | 'completed' | 'failed',
  agent: {
    id: string;
    name: string;
    executionId?: string;
    error?: string;
    results?: Record<string, unknown>;
  }
): Promise<boolean> {
  const eventType: EventType = `agent:${status}`;
  return triggerWorkspaceEvent(workspaceId, eventType, agent);
}

/**
 * Broadcast campaign status
 */
export async function broadcastCampaignStatus(
  workspaceId: string,
  status: 'sent' | 'completed',
  campaign: {
    id: string;
    name: string;
    sentCount?: number;
    failedCount?: number;
  }
): Promise<boolean> {
  const eventType: EventType = `campaign:${status}`;
  return triggerWorkspaceEvent(workspaceId, eventType, campaign);
}

// ============================================================================
// AUTHENTICATION FOR PRIVATE CHANNELS
// ============================================================================

/**
 * Authenticate a user for a private channel
 * Used in the auth endpoint
 */
export function authenticateChannel(
  socketId: string,
  channel: string,
  userId?: string,
  userInfo?: Record<string, unknown>
): { auth: string; channel_data?: string } {
  const pusher = getPusher();

  // For presence channels, include user data
  if (channel.startsWith('presence-') && userId) {
    const presenceData = {
      user_id: userId,
      user_info: userInfo || {},
    };
    return pusher.authorizeChannel(socketId, channel, presenceData);
  }

  // For private channels, just authenticate
  return pusher.authorizeChannel(socketId, channel);
}
