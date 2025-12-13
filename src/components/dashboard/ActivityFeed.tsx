"use client";

/**
 * Activity Feed Component
 * 
 * Features:
 * - Infinite scroll with intersection observer
 * - Filter by type (agent, task, CRM, all)
 * - Mark as read functionality
 * - Real-time updates via Pusher WebSocket
 * - Loading states and error handling
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRealtime } from '@/hooks/use-realtime';
import type { PusherEvent } from '@/lib/pusher-client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Circle,
  ChevronRight,
  Loader2,
  CheckCheck,
  Bot,
  ListTodo,
  Users,
  AlertTriangle,
} from 'lucide-react';

type ActivityType = 'agent' | 'task' | 'crm' | 'all';
type ActivityStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

interface ActivityEvent {
  id: string;
  agentId: string;
  agentName: string;
  agentType: string;
  status: ActivityStatus;
  createdAt: string;
  durationMs?: number | null;
  cost?: number | null;
  error?: { message: string } | null;
  triggeredBy?: {
    id: string;
    name: string;
  };
}

interface ActivityFeedProps {
  workspaceId: string;
  userId?: string;
  className?: string;
}

export default function ActivityFeed({ workspaceId, userId, className }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [filterType, setFilterType] = useState<ActivityType>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [readItems, setReadItems] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const limit = 20;

  // Real-time activity handler - prepend new activities to the list
  const handleRealtimeActivity = useCallback((event: PusherEvent) => {
    const data = event.data as {
      id?: string;
      agentId?: string;
      agentName?: string;
      agentType?: string;
      status?: ActivityStatus;
      timestamp?: string;
      durationMs?: number | null;
      cost?: number | null;
      error?: { message: string } | null;
      triggeredBy?: { id: string; name: string };
    };
    
    if (!data.id) return;
    
    const newActivity: ActivityEvent = {
      id: data.id,
      agentId: data.agentId || '',
      agentName: data.agentName || 'Unknown Agent',
      agentType: data.agentType || 'agent',
      status: data.status || 'pending',
      createdAt: data.timestamp || new Date().toISOString(),
      durationMs: data.durationMs,
      cost: data.cost,
      error: data.error,
      triggeredBy: data.triggeredBy,
    };

    setActivities((prev) => {
      // Avoid duplicates
      if (prev.some((a) => a.id === newActivity.id)) {
        // Update existing activity (e.g., status change)
        return prev.map((a) => (a.id === newActivity.id ? newActivity : a));
      }
      // Prepend new activity
      return [newActivity, ...prev];
    });
  }, []);

  // Subscribe to real-time events
  useRealtime({
    workspaceId,
    userId,
    onActivity: handleRealtimeActivity,
    onAgentUpdate: handleRealtimeActivity, // Agent events also update activity feed
    enabled: !!workspaceId,
  });

  // Load read items from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`activity-read-${workspaceId}`);
    if (stored) {
      try {
        setReadItems(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error('Failed to parse read items', e);
      }
    }
  }, [workspaceId]);

  // Save read items to localStorage
  useEffect(() => {
    localStorage.setItem(`activity-read-${workspaceId}`, JSON.stringify(Array.from(readItems)));
  }, [readItems, workspaceId]);

  // Fetch activities
  const fetchActivities = useCallback(async (currentOffset: number, append = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: currentOffset.toString(),
        status: 'all',
      });

      const response = await fetch(`/api/activity?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch activities');
      }

      const data = await response.json();
      const newActivities = data.executions || [];

      if (append) {
        setActivities(prev => [...prev, ...newActivities]);
      } else {
        setActivities(newActivities);
      }

      setHasMore(data.pagination?.hasMore || false);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activities');
      setIsLoading(false);
    }
  }, [limit]);

  // Initial load
  useEffect(() => {
    fetchActivities(0, false);
  }, [fetchActivities]);

  // Note: Real-time updates now handled by useRealtime hook above
  // Removed polling in favor of WebSocket push

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          const newOffset = offset + limit;
          setOffset(newOffset);
          fetchActivities(newOffset, true);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, offset, fetchActivities, limit]);

  // Filter activities by type
  const filteredActivities = activities.filter((activity) => {
    if (filterType === 'all') return true;
    if (filterType === 'agent') return activity.agentType === 'agent';
    if (filterType === 'task') return activity.agentType === 'task';
    if (filterType === 'crm') return activity.agentType === 'crm';
    return true;
  });

  // Mark item as read
  const markAsRead = (id: string) => {
    setReadItems(prev => new Set([...prev, id]));
  };

  // Mark all as read
  const markAllAsRead = () => {
    setReadItems(new Set(activities.map(a => a.id)));
  };

  // Get status icon
  const getStatusIcon = (status: ActivityStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="h-3.5 w-3.5 text-red-600" />;
      case 'running':
        return <div className="h-3.5 w-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'pending':
        return <Clock className="h-3.5 w-3.5 text-amber-600" />;
      default:
        return <Circle className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  // Get status color
  const getStatusColor = (status: ActivityStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800';
      case 'running':
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800';
      case 'pending':
        return 'bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800';
      default:
        return 'bg-muted border-border';
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Format duration
  const formatDuration = (ms: number | null | undefined) => {
    if (!ms) return null;
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const unreadCount = filteredActivities.filter(a => !readItems.has(a.id)).length;

  return (
    <div className={`flex flex-col h-full bg-background border rounded-lg ${className || ''}`}>
      {/* Header */}
      <div className="p-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold">Activity Feed</h3>
            {unreadCount > 0 && (
              <Badge variant="soft" tone="violet" size="sm">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-7 text-xs"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              filterType === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('agent')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              filterType === 'agent'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            <Bot className="h-3 w-3" />
            Agents
          </button>
          <button
            onClick={() => setFilterType('task')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              filterType === 'task'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            <ListTodo className="h-3 w-3" />
            Tasks
          </button>
          <button
            onClick={() => setFilterType('crm')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              filterType === 'crm'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
            }`}
          >
            <Users className="h-3 w-3" />
            CRM
          </button>
        </div>
      </div>

      {/* Activity List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {error && (
            <div className="p-4 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">Failed to load activities</p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchActivities(0, false)}
                    className="mt-2 h-7 text-xs"
                  >
                    Try again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {filteredActivities.length === 0 && !isLoading && !error && (
            <div className="text-center py-12 px-6">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                <Activity className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">No activity yet</h3>
              <p className="text-xs text-muted-foreground">
                When your agents run, their activity will appear here.
              </p>
            </div>
          )}

          {filteredActivities.map((activity) => {
            const isRead = readItems.has(activity.id);
            const duration = formatDuration(activity.durationMs);
            
            return (
              <div
                key={activity.id}
                onClick={() => markAsRead(activity.id)}
                className={`group relative p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
                  getStatusColor(activity.status)
                } ${!isRead ? 'ring-1 ring-primary/20' : 'opacity-75'}`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 shrink-0">
                    {getStatusIcon(activity.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    {/* Agent Name & Status */}
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-medium truncate">{activity.agentName}</p>
                      {!isRead && (
                        <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>

                    {/* Status Message */}
                    <p className="text-xs text-foreground/80 mb-1.5 leading-relaxed">
                      {activity.status === 'completed' && 'Execution completed successfully'}
                      {activity.status === 'failed' && (activity.error?.message || 'Execution failed')}
                      {activity.status === 'running' && 'Currently running...'}
                      {activity.status === 'pending' && 'Waiting to start'}
                      {activity.status === 'cancelled' && 'Execution cancelled'}
                    </p>

                    {/* Metadata */}
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                      <span>{formatTimeAgo(activity.createdAt)}</span>
                      {duration && (
                        <>
                          <span>•</span>
                          <span>{duration}</span>
                        </>
                      )}
                      {activity.triggeredBy && (
                        <>
                          <span>•</span>
                          <span className="truncate">{activity.triggeredBy.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Hover Arrow */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}

          {/* Loading indicator for initial load */}
          {isLoading && filteredActivities.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Infinite scroll trigger */}
          {hasMore && filteredActivities.length > 0 && (
            <div ref={loadMoreRef} className="flex items-center justify-center py-4">
              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading more...
                </div>
              )}
            </div>
          )}

          {/* End of list indicator */}
          {!hasMore && filteredActivities.length > 0 && (
            <div className="text-center py-4 text-xs text-muted-foreground">
              All activity loaded
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
