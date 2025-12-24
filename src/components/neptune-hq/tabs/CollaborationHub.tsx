"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActivityFeed } from '../shared/ActivityFeed';
import { UserAvatar } from '../shared/UserAvatar';
import { StatusBadge } from '../shared/StatusBadge';
import { useAuth } from '@clerk/nextjs';
import { Users, MessageSquare, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
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

  // Mock heatmap data - monthly view (will be replaced with real data from API)
  const heatmapData = generateMockMonthlyHeatmap();

  return (
    <div className="space-y-6">
      {/* Live Activity Card */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Live Activity</CardTitle>
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
        {/* Team Usage Heatmap - Monthly */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Team Usage - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {/* Day labels */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-[10px] text-center text-muted-foreground font-medium">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for offset */}
                {Array.from({ length: heatmapData.firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                
                {/* Day cells */}
                {heatmapData.data.map((day) => {
                  const isToday = day.date === heatmapData.today;
                  return (
                    <div
                      key={day.date}
                      className="group relative aspect-square rounded flex items-center justify-center text-[10px] font-medium transition-all hover:ring-2 hover:ring-primary hover:z-10 cursor-pointer"
                      style={{
                        backgroundColor: getHeatmapColor(day.activity),
                      }}
                    >
                      <span className={cn(
                        isToday && 'font-bold',
                        day.activity > 10 ? 'text-white' : 'text-gray-700'
                      )}>
                        {day.date}
                      </span>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                        <div className="bg-gray-900/95 text-white text-xs rounded-lg p-2 shadow-lg whitespace-nowrap">
                          <div className="font-semibold mb-1">{day.dayName}, {new Date().toLocaleDateString('en-US', { month: 'short' })} {day.date}</div>
                          <div className="space-y-0.5 text-[11px]">
                            <div className="flex justify-between gap-3">
                              <span className="text-gray-300">Activities:</span>
                              <span className="font-medium">{day.activity}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-gray-300">Conversations:</span>
                              <span className="font-medium">{day.conversations}</span>
                            </div>
                            <div className="flex justify-between gap-3">
                              <span className="text-gray-300">Messages:</span>
                              <span className="font-medium">{day.messages}</span>
                            </div>
                          </div>
                          {/* Tooltip arrow */}
                          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                            <div className="border-4 border-transparent border-t-gray-900/95"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-end gap-1 pt-2">
                <span className="text-[10px] text-muted-foreground mr-1">Less</span>
                {[0, 3, 7, 11, 15].map((val) => (
                  <div
                    key={val}
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: getHeatmapColor(val) }}
                  />
                ))}
                <span className="text-[10px] text-muted-foreground ml-1">More</span>
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

// Helper function to generate mock monthly heatmap data
function generateMockMonthlyHeatmap() {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayOfWeek = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  
  // Create array of day objects
  const monthData = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(today.getFullYear(), today.getMonth(), i);
    monthData.push({
      date: i,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      activity: Math.floor(Math.random() * 15), // 0-14 activities
      conversations: Math.floor(Math.random() * 5),
      messages: Math.floor(Math.random() * 25),
    });
  }
  
  return { data: monthData, firstDayOfWeek, today: today.getDate() };
}

// Helper function to get heatmap color based on activity level
function getHeatmapColor(value: number): string {
  if (value === 0) return '#e5e7eb';
  if (value < 3) return '#a7f3d0';
  if (value < 6) return '#6ee7b7';
  if (value < 8) return '#34d399';
  return '#10b981';
}
