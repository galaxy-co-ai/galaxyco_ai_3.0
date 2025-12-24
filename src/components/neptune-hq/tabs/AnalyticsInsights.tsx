"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '../shared/StatCard';
import { TrendChart } from '../shared/TrendChart';
import { useAuth } from '@clerk/nextjs';
import { MessageSquare, Users, Clock, ThumbsUp, TrendingUp, BarChart3 } from 'lucide-react';
import useSWR from 'swr';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Stats {
  totalConversations: number;
  totalMessages: number;
  avgResponseTime: number;
  activeUsers: number;
  trends: {
    conversations: number;
    messages: number;
    responseTime: number;
    users: number;
  };
}

interface Topic {
  name: string;
  count: number;
  trend: number;
}

interface ToolUsage {
  name: string;
  executions: number;
}

export function AnalyticsInsights() {
  const { orgId } = useAuth();

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useSWR<Stats>(
    orgId ? `/api/neptune-hq/stats?workspaceId=${orgId}` : null,
    fetcher
  );

  // Fetch topics
  const { data: topics, isLoading: topicsLoading } = useSWR<{ topics: Topic[] }>(
    orgId ? `/api/neptune-hq/topics?workspaceId=${orgId}` : null,
    fetcher
  );

  // Fetch tool usage
  const { data: toolUsage, isLoading: toolUsageLoading } = useSWR<{ tools: ToolUsage[] }>(
    orgId ? `/api/neptune-hq/tool-usage?workspaceId=${orgId}` : null,
    fetcher
  );

  // Fetch quality trends
  const { data: qualityTrends, isLoading: qualityLoading } = useSWR<{ data: Array<{ name: string; value: number }> }>(
    orgId ? `/api/neptune-hq/quality-trends?workspaceId=${orgId}` : null,
    fetcher
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsLoading ? (
          <LoadingSkeleton count={4} />
        ) : stats ? (
          <>
            <StatCard
              title="Total Conversations"
              value={stats.totalConversations}
              trend={{
                value: stats.trends.conversations,
                direction: stats.trends.conversations > 0 ? 'up' : stats.trends.conversations < 0 ? 'down' : 'flat',
              }}
              color="blue"
              icon={MessageSquare}
            />
            <StatCard
              title="Messages Sent/Received"
              value={stats.totalMessages.toLocaleString()}
              trend={{
                value: stats.trends.messages,
                direction: stats.trends.messages > 0 ? 'up' : stats.trends.messages < 0 ? 'down' : 'flat',
              }}
              color="green"
              icon={TrendingUp}
            />
            <StatCard
              title="Avg Response Time"
              value={`${(stats.avgResponseTime / 1000).toFixed(1)}s`}
              trend={{
                value: stats.trends.responseTime,
                direction: stats.trends.responseTime < 0 ? 'up' : stats.trends.responseTime > 0 ? 'down' : 'flat',
              }}
              color="amber"
              icon={Clock}
            />
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              trend={{
                value: stats.trends.users,
                direction: stats.trends.users > 0 ? 'up' : stats.trends.users < 0 ? 'down' : 'flat',
              }}
              color="blue"
              icon={Users}
            />
          </>
        ) : null}
      </div>

      {/* Grid Layout: Topic Analysis + Tool Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Analysis */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Topic Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            {topicsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : topics && topics.topics.length > 0 ? (
              <div className="space-y-2.5">
                {topics.topics.map((topic, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">{topic.name}</span>
                        <span className="text-[10px] text-muted-foreground">{topic.count} mentions</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${(topic.count / topics.topics[0].count) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No topic data yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tool Execution Chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Tool Execution</CardTitle>
          </CardHeader>
          <CardContent>
            {toolUsageLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : toolUsage && toolUsage.tools.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={toolUsage.tools}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="executions" fill="#4ADE80" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No tool usage data yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Response Quality Trends */}
      {qualityTrends && qualityTrends.data.length > 0 && (
        <TrendChart
          title="Response Quality Trends"
          description="User satisfaction over time"
          data={qualityTrends.data}
          color="#4ADE80"
        />
      )}
    </div>
  );
}

// Loading skeleton component
function LoadingSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <Card key={idx} className="shadow-sm animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
