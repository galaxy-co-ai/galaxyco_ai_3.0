"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActivityFeed } from '../shared/ActivityFeed';
import { UserAvatar } from '../shared/UserAvatar';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuth } from '@clerk/nextjs';
import { Users, MessageSquare, TrendingUp } from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ActiveConversation {
  id: string;
  title: string;
  lastActiveAt: string;
  activeUsers: Array<{
    id: string;
    name: string;
    avatar?: string;
    color: string;
  }>;
}

interface ActivityItem {
  id: string;
  user: {
    name: string;
    avatar?: string;
    color: string;
  };
  action: string;
  description: string;
  timestamp: string;
}

export function CollaborationHub() {
  const { orgId } = useAuth();
  
  // Fetch active conversations
  const { data: conversations, isLoading: conversationsLoading } = useSWR<{ conversations: ActiveConversation[] }>(
    orgId ? `/api/neptune-hq/active-conversations?workspaceId=${orgId}` : null,
    fetcher,
    { refreshInterval: 5000 } // Refresh every 5 seconds
  );

  // Fetch recent activity
  const { data: activity, isLoading: activityLoading } = useSWR<{ activities: ActivityItem[] }>(
    orgId ? `/api/neptune-hq/recent-activity?workspaceId=${orgId}` : null,
    fetcher,
    { refreshInterval: 10000 } // Refresh every 10 seconds
  );

  // Mock heatmap data (will be replaced with real data from API)
  const heatmapData = generateMockHeatmap();

  return (
    <div className="space-y-6">
      {/* Live Activity Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Live Activity</CardTitle>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">
                {conversations?.conversations.reduce((sum, c) => sum + c.activeUsers.length, 0) || 0} people active
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {conversationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : conversations && conversations.conversations.length > 0 ? (
            <div className="space-y-4">
              {conversations.conversations.map((conv) => (
                <div key={conv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{conv.title || 'Untitled Conversation'}</p>
                    <p className="text-xs text-muted-foreground">
                      Last active {new Date(conv.lastActiveAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {conv.activeUsers.slice(0, 3).map((user) => (
                        <UserAvatar
                          key={user.id}
                          name={user.name}
                          avatar={user.avatar}
                          color={user.color}
                          size="sm"
                          status="online"
                        />
                      ))}
                      {conv.activeUsers.length > 3 && (
                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-muted border-2 border-background text-xs font-medium">
                          +{conv.activeUsers.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No active conversations right now</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid Layout: Usage Heatmap + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Usage Heatmap */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Team Usage Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {heatmapData.map((day) => (
                <div key={day.day} className="flex items-center gap-2">
                  <div className="w-16 text-xs text-muted-foreground">{day.day}</div>
                  <div className="flex-1 flex gap-1">
                    {day.hours.map((hour, idx) => (
                      <div
                        key={idx}
                        className="flex-1 h-6 rounded transition-opacity"
                        style={{
                          backgroundColor: getHeatmapColor(hour),
                          opacity: hour === 0 ? 0.2 : 1,
                        }}
                        title={`${hour} activities`}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
                <span>12am</span>
                <span>6am</span>
                <span>12pm</span>
                <span>6pm</span>
                <span>11pm</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        {activity && (
          <ActivityFeed
            title="Recent Activity"
            items={activity.activities.map((a) => ({
              ...a,
              timestamp: new Date(a.timestamp),
            }))}
          />
        )}
      </div>
    </div>
  );
}

// Helper function to generate mock heatmap data
function generateMockHeatmap() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day) => ({
    day,
    hours: Array.from({ length: 24 }, () => Math.floor(Math.random() * 10)),
  }));
}

// Helper function to get heatmap color based on activity level
function getHeatmapColor(value: number): string {
  if (value === 0) return '#e5e7eb';
  if (value < 3) return '#a7f3d0';
  if (value < 6) return '#6ee7b7';
  if (value < 8) return '#34d399';
  return '#10b981';
}
