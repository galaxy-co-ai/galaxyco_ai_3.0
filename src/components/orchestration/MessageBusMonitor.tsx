'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Pusher from 'pusher-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Circle, Pause, Play, Radio, Search, Trash2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface MessageEvent {
  id: string;
  channel: string;
  event: string;
  data: unknown;
  timestamp: Date;
}

const eventTypeColors: Record<string, { bg: string; text: string }> = {
  'activity:new': { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  'chat:message': { bg: 'bg-green-500/20', text: 'text-green-400' },
  'notification:new': { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  'agent:execution': { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  'workflow:update': { bg: 'bg-pink-500/20', text: 'text-pink-400' },
  'deal:update': { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  'contact:update': { bg: 'bg-teal-500/20', text: 'text-teal-400' },
  default: { bg: 'bg-gray-500/20', text: 'text-gray-400' },
};

interface MessageBusMonitorProps {
  workspaceId?: string;
}

export function MessageBusMonitor({ workspaceId }: MessageBusMonitorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [events, setEvents] = useState<MessageEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [showData, setShowData] = useState(true);
  const pusherRef = useRef<Pusher | null>(null);
  const channelsRef = useRef<Map<string, ReturnType<Pusher['subscribe']>>>(new Map());
  const eventIdRef = useRef(0);

  // Channels to subscribe to
  const channelPrefixes = [
    'workspace',
    'notifications',
    'activity',
    'agents',
    'workflows',
    'crm',
  ];

  const addEvent = useCallback((channel: string, event: string, data: unknown) => {
    if (isPaused) return;

    const newEvent: MessageEvent = {
      id: `${++eventIdRef.current}`,
      channel,
      event,
      data,
      timestamp: new Date(),
    };

    setEvents(prev => [newEvent, ...prev].slice(0, 500)); // Keep last 500 events
  }, [isPaused]);

  useEffect(() => {
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1';

    if (!pusherKey) {
      console.warn('Pusher key not configured');
      return;
    }

    // Initialize Pusher
    const pusher = new Pusher(pusherKey, {
      cluster: pusherCluster,
    });

    pusherRef.current = pusher;

    pusher.connection.bind('connected', () => {
      setIsConnected(true);
    });

    pusher.connection.bind('disconnected', () => {
      setIsConnected(false);
    });

    pusher.connection.bind('error', (err: unknown) => {
      console.error('Pusher error:', err);
      setIsConnected(false);
    });

    // Subscribe to channels
    const channels = channelPrefixes.map(prefix => {
      const channelName = workspaceId ? `${prefix}-${workspaceId}` : `${prefix}-global`;
      const channel = pusher.subscribe(channelName);

      // Bind to all events on this channel
      channel.bind_global((eventName: string, data: unknown) => {
        // Skip internal Pusher events
        if (eventName.startsWith('pusher:')) return;
        addEvent(channelName, eventName, data);
      });

      channelsRef.current.set(channelName, channel);
      return channel;
    });

    return () => {
      channels.forEach(channel => {
        channel.unbind_all();
      });
      pusher.disconnect();
    };
  }, [workspaceId, addEvent]);

  // Get unique channels from events
  const uniqueChannels = [...new Set(events.map(e => e.channel))];

  // Filter events
  const filteredEvents = events.filter(event => {
    if (selectedChannel !== 'all' && event.channel !== selectedChannel) return false;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      return (
        event.channel.toLowerCase().includes(searchLower) ||
        event.event.toLowerCase().includes(searchLower) ||
        JSON.stringify(event.data).toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  // Stats
  const stats = {
    total: events.length,
    perSecond: events.filter(e => Date.now() - e.timestamp.getTime() < 60000).length / 60,
    channels: uniqueChannels.length,
  };

  const getEventColor = (event: string) => {
    return eventTypeColors[event] || eventTypeColors.default;
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <Card className="border-white/10 bg-white/5 backdrop-blur">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <Circle className="h-3 w-3 fill-green-500 text-green-500 animate-pulse" />
                    <span className="text-sm text-green-400">Connected</span>
                  </>
                ) : (
                  <>
                    <Circle className="h-3 w-3 fill-red-500 text-red-500" />
                    <span className="text-sm text-red-400">Disconnected</span>
                  </>
                )}
              </div>

              <div className="h-4 w-px bg-white/10" />

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span>{stats.total} events</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span>{stats.perSecond.toFixed(1)}/min</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Radio className="h-4 w-4" />
                <span>{stats.channels} channels</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPaused(!isPaused)}
                className={isPaused ? 'text-yellow-400 border-yellow-400/50' : ''}
              >
                {isPaused ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                )}
              </Button>

              <Button variant="outline" size="sm" onClick={clearEvents}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-white/10 bg-white/5 backdrop-blur">
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedChannel === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedChannel('all')}
              >
                All Channels
              </Button>
              {uniqueChannels.slice(0, 5).map(channel => (
                <Button
                  key={channel}
                  variant={selectedChannel === channel ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedChannel(channel)}
                >
                  {channel.split('-')[0]}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={showData}
                onCheckedChange={setShowData}
                aria-label="Show data"
              />
              <Label className="text-sm">
                Show Data
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Event Stream */}
      <Card className="border-white/10 bg-white/5 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Event Stream
            {isPaused && (
              <Badge variant="outline" className="ml-2 text-yellow-400 border-yellow-400/50">
                Paused
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Real-time message bus events from Pusher
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-2">
              {filteredEvents.map(event => {
                const colors = getEventColor(event.event);
                return (
                  <div
                    key={event.id}
                    className="flex gap-3 p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className={cn('px-2 py-1 rounded text-xs font-mono', colors.bg, colors.text)}>
                      {event.event}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="text-xs font-mono">
                          {event.channel}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                        </span>
                      </div>
                      {showData && event.data ? (
                        <pre className="mt-2 p-2 rounded bg-black/30 text-xs font-mono text-muted-foreground overflow-x-auto">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              {filteredEvents.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Radio className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No events captured yet</p>
                  <p className="text-sm mt-1">Events will appear here as they occur</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
