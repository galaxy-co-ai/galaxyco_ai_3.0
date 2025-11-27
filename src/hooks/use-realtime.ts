'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type { Channel, PresenceChannel, Members } from 'pusher-js';
import {
  getPusherClient,
  isPusherClientAvailable,
  subscribeToWorkspace,
  subscribeToUser,
  subscribeToPresence,
  unsubscribeFromChannel,
  bindEvent,
  unbindEvent,
  type EventType,
  type PusherEvent,
} from '@/lib/pusher-client';

// ============================================================================
// USE REALTIME HOOK
// ============================================================================

interface UseRealtimeOptions {
  workspaceId?: string;
  userId?: string;
  onActivity?: (activity: PusherEvent) => void;
  onNotification?: (notification: PusherEvent) => void;
  onLeadUpdate?: (event: PusherEvent) => void;
  onDealUpdate?: (event: PusherEvent) => void;
  onAgentUpdate?: (event: PusherEvent) => void;
  onCampaignUpdate?: (event: PusherEvent) => void;
  enabled?: boolean;
}

interface UseRealtimeReturn {
  isConnected: boolean;
  onlineUsers: Array<{ id: string; info: Record<string, unknown> }>;
  workspaceChannel: Channel | null;
  userChannel: Channel | null;
}

/**
 * Main hook for real-time updates
 * Automatically subscribes to workspace and user channels
 */
export function useRealtime(options: UseRealtimeOptions): UseRealtimeReturn {
  const {
    workspaceId,
    userId,
    onActivity,
    onNotification,
    onLeadUpdate,
    onDealUpdate,
    onAgentUpdate,
    onCampaignUpdate,
    enabled = true,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Array<{ id: string; info: Record<string, unknown> }>>([]);
  
  const workspaceChannelRef = useRef<Channel | null>(null);
  const userChannelRef = useRef<Channel | null>(null);
  const presenceChannelRef = useRef<PresenceChannel | null>(null);

  // Subscribe to workspace channel
  useEffect(() => {
    if (!enabled || !workspaceId || !isPusherClientAvailable()) {
      return;
    }

    const channel = subscribeToWorkspace(workspaceId);
    if (!channel) return;

    workspaceChannelRef.current = channel;

    // Handle connection state
    channel.bind('pusher:subscription_succeeded', () => {
      setIsConnected(true);
    });

    channel.bind('pusher:subscription_error', () => {
      setIsConnected(false);
    });

    // Bind to activity events
    if (onActivity) {
      bindEvent(channel, 'activity:new', onActivity);
    }

    // Bind to lead events
    if (onLeadUpdate) {
      bindEvent(channel, 'lead:created', onLeadUpdate);
      bindEvent(channel, 'lead:updated', onLeadUpdate);
      bindEvent(channel, 'lead:scored', onLeadUpdate);
    }

    // Bind to deal events
    if (onDealUpdate) {
      bindEvent(channel, 'deal:created', onDealUpdate);
      bindEvent(channel, 'deal:updated', onDealUpdate);
      bindEvent(channel, 'deal:won', onDealUpdate);
      bindEvent(channel, 'deal:lost', onDealUpdate);
    }

    // Bind to agent events
    if (onAgentUpdate) {
      bindEvent(channel, 'agent:started', onAgentUpdate);
      bindEvent(channel, 'agent:completed', onAgentUpdate);
      bindEvent(channel, 'agent:failed', onAgentUpdate);
    }

    // Bind to campaign events
    if (onCampaignUpdate) {
      bindEvent(channel, 'campaign:sent', onCampaignUpdate);
      bindEvent(channel, 'campaign:completed', onCampaignUpdate);
    }

    return () => {
      unsubscribeFromChannel(`private-workspace-${workspaceId}`);
      workspaceChannelRef.current = null;
    };
  }, [workspaceId, enabled, onActivity, onLeadUpdate, onDealUpdate, onAgentUpdate, onCampaignUpdate]);

  // Subscribe to user channel
  useEffect(() => {
    if (!enabled || !userId || !isPusherClientAvailable()) {
      return;
    }

    const channel = subscribeToUser(userId);
    if (!channel) return;

    userChannelRef.current = channel;

    // Bind to notification events
    if (onNotification) {
      bindEvent(channel, 'notification:new', onNotification);
    }

    return () => {
      unsubscribeFromChannel(`private-user-${userId}`);
      userChannelRef.current = null;
    };
  }, [userId, enabled, onNotification]);

  // Subscribe to presence channel for online users
  useEffect(() => {
    if (!enabled || !workspaceId || !isPusherClientAvailable()) {
      return;
    }

    const channel = subscribeToPresence(workspaceId);
    if (!channel) return;

    presenceChannelRef.current = channel;

    // Handle presence events
    channel.bind('pusher:subscription_succeeded', (members: Members) => {
      const users: Array<{ id: string; info: Record<string, unknown> }> = [];
      members.each((member: { id: string; info: Record<string, unknown> }) => {
        users.push({ id: member.id, info: member.info });
      });
      setOnlineUsers(users);
    });

    channel.bind('pusher:member_added', (member: { id: string; info: Record<string, unknown> }) => {
      setOnlineUsers((prev) => [...prev, { id: member.id, info: member.info }]);
    });

    channel.bind('pusher:member_removed', (member: { id: string }) => {
      setOnlineUsers((prev) => prev.filter((u) => u.id !== member.id));
    });

    return () => {
      unsubscribeFromChannel(`presence-workspace-${workspaceId}`);
      presenceChannelRef.current = null;
      setOnlineUsers([]);
    };
  }, [workspaceId, enabled]);

  return {
    isConnected,
    onlineUsers,
    workspaceChannel: workspaceChannelRef.current,
    userChannel: userChannelRef.current,
  };
}

// ============================================================================
// USE CHANNEL HOOK
// ============================================================================

interface UseChannelOptions {
  channelName: string;
  events: Array<{
    name: EventType;
    callback: (event: PusherEvent) => void;
  }>;
  enabled?: boolean;
}

/**
 * Hook for subscribing to a specific channel with multiple events
 */
export function useChannel(options: UseChannelOptions): Channel | null {
  const { channelName, events, enabled = true } = options;
  const channelRef = useRef<Channel | null>(null);

  useEffect(() => {
    if (!enabled || !isPusherClientAvailable()) {
      return;
    }

    const client = getPusherClient();
    if (!client) return;

    const channel = client.subscribe(channelName);
    channelRef.current = channel;

    // Bind all events
    for (const event of events) {
      bindEvent(channel, event.name, event.callback);
    }

    return () => {
      // Unbind all events
      for (const event of events) {
        unbindEvent(channel, event.name, event.callback);
      }
      unsubscribeFromChannel(channelName);
      channelRef.current = null;
    };
  }, [channelName, events, enabled]);

  return channelRef.current;
}

// ============================================================================
// USE EVENT HOOK
// ============================================================================

/**
 * Hook for subscribing to a single event on a channel
 */
export function useEvent<T = Record<string, unknown>>(
  channel: Channel | null,
  eventType: EventType,
  callback: (event: PusherEvent<T>) => void
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!channel) return;

    const handler = (event: PusherEvent<T>) => {
      callbackRef.current(event);
    };

    bindEvent(channel, eventType, handler);

    return () => {
      unbindEvent(channel, eventType, handler as (event: PusherEvent) => void);
    };
  }, [channel, eventType]);
}

// ============================================================================
// USE NOTIFICATIONS HOOK
// ============================================================================

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  actionUrl?: string;
  actionLabel?: string;
  timestamp: string;
  read: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

/**
 * Hook for managing real-time notifications
 */
export function useNotifications(userId: string | undefined): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleNotification = useCallback((event: PusherEvent) => {
    const notification: Notification = {
      ...(event.data as Omit<Notification, 'timestamp' | 'read'>),
      timestamp: event.timestamp,
      read: false,
    };
    setNotifications((prev) => [notification, ...prev].slice(0, 50)); // Keep last 50
  }, []);

  useRealtime({
    userId,
    onNotification: handleNotification,
    enabled: !!userId,
  });

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearAll,
  };
}

// ============================================================================
// USE ACTIVITY FEED HOOK
// ============================================================================

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  userName?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface UseActivityFeedReturn {
  activities: Activity[];
  isLoading: boolean;
  addActivity: (activity: Omit<Activity, 'timestamp'>) => void;
}

/**
 * Hook for real-time activity feed
 */
export function useActivityFeed(
  workspaceId: string | undefined,
  initialActivities: Activity[] = []
): UseActivityFeedReturn {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
  const [isLoading] = useState(false);

  const handleActivity = useCallback((event: PusherEvent) => {
    const activity: Activity = {
      ...(event.data as Omit<Activity, 'timestamp'>),
      timestamp: event.timestamp,
    };
    setActivities((prev) => [activity, ...prev].slice(0, 100)); // Keep last 100
  }, []);

  useRealtime({
    workspaceId,
    onActivity: handleActivity,
    enabled: !!workspaceId,
  });

  const addActivity = useCallback((activity: Omit<Activity, 'timestamp'>) => {
    setActivities((prev) => [
      { ...activity, timestamp: new Date().toISOString() },
      ...prev,
    ].slice(0, 100));
  }, []);

  return {
    activities,
    isLoading,
    addActivity,
  };
}

