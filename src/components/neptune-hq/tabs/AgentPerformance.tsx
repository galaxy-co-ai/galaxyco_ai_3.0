"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '../shared/StatCard';
import { useAuth } from '@clerk/nextjs';
import { 
  Bot, 
  Zap, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Activity,
  BarChart3,
  RefreshCw,
  Play,
  Pause,
  CircleDot
} from 'lucide-react';
import { cn } from '@/lib/utils';
import useSWR from 'swr';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface AgentStats {
  totalAgents: number;
  activeAgents: number;
  totalExecutions: number;
  successRate: number;
  avgExecutionTime: number;
  trends: {
    agents: number;
    executions: number;
    successRate: number;
    executionTime: number;
  };
}

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error' | 'paused';
  lastExecuted: string;
  executionCount: number;
  successRate: number;
  avgTime: number;
  type: string;
}

interface Execution {
  id: string;
  agentName: string;
  status: 'success' | 'failed' | 'running';
  startedAt: string;
  duration: number;
  input?: string;
  output?: string;
}

interface PerformanceData {
  date: string;
  executions: number;
  successRate: number;
}

export function AgentPerformance() {
  const { orgId } = useAuth();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Fetch agent performance data
  const { data, isLoading, mutate } = useSWR<{
    stats: AgentStats;
    agents: Agent[];
    recentExecutions: Execution[];
    performanceChart: PerformanceData[];
  }>(
    orgId ? `/api/neptune-hq/agent-performance?workspaceId=${orgId}` : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'idle': return 'bg-gray-400';
      case 'error': return 'bg-red-500';
      case 'paused': return 'bg-amber-500';
      case 'success': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'running': return 'text-blue-600 bg-blue-100';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return Play;
      case 'idle': return CircleDot;
      case 'error': return XCircle;
      case 'paused': return Pause;
      case 'success': return CheckCircle2;
      case 'failed': return XCircle;
      case 'running': return RefreshCw;
      default: return CircleDot;
    }
  };

  const filteredExecutions = selectedAgent
    ? data?.recentExecutions.filter(e => e.agentName === selectedAgent)
    : data?.recentExecutions;

  return (
    <div className="space-y-6">
      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="p-4">
                <div className="animate-pulse space-y-2">
                  <div className="h-3 bg-muted rounded w-24"></div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : data?.stats ? (
          <>
            <StatCard
              title="Total Agents"
              value={data.stats.totalAgents}
              trend={{
                value: data.stats.trends.agents,
                direction: data.stats.trends.agents > 0 ? 'up' : data.stats.trends.agents < 0 ? 'down' : 'flat',
              }}
              color="blue"
              icon={Bot}
            />
            <StatCard
              title="Executions (7d)"
              value={data.stats.totalExecutions.toLocaleString()}
              trend={{
                value: data.stats.trends.executions,
                direction: data.stats.trends.executions > 0 ? 'up' : data.stats.trends.executions < 0 ? 'down' : 'flat',
              }}
              color="green"
              icon={Zap}
            />
            <StatCard
              title="Success Rate"
              value={`${data.stats.successRate}%`}
              trend={{
                value: data.stats.trends.successRate,
                direction: data.stats.trends.successRate > 0 ? 'up' : data.stats.trends.successRate < 0 ? 'down' : 'flat',
              }}
              color="amber"
              icon={CheckCircle2}
            />
            <StatCard
              title="Avg Execution Time"
              value={`${(data.stats.avgExecutionTime / 1000).toFixed(1)}s`}
              trend={{
                value: Math.abs(data.stats.trends.executionTime),
                direction: data.stats.trends.executionTime < 0 ? 'up' : data.stats.trends.executionTime > 0 ? 'down' : 'flat',
              }}
              color="blue"
              icon={Clock}
            />
          </>
        ) : null}
      </div>

      {/* Performance Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Execution Trends (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : data?.performanceChart && data.performanceChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.performanceChart}>
                <defs>
                  <linearGradient id="execGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4ADE80" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <YAxis 
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="executions" 
                  stroke="#4ADE80" 
                  fill="url(#execGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No performance data yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid: Agent List + Recent Executions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent List */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Agent Health
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => mutate()}
                className="h-7 w-7 p-0"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : data?.agents && data.agents.length > 0 ? (
              <div className="divide-y">
                {data.agents.map((agent) => {
                  const StatusIcon = getStatusIcon(agent.status);
                  return (
                    <div
                      key={agent.id}
                      className={cn(
                        "flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors cursor-pointer",
                        selectedAgent === agent.name && "bg-muted/50"
                      )}
                      onClick={() => setSelectedAgent(selectedAgent === agent.name ? null : agent.name)}
                    >
                      <div className="relative">
                        <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-muted">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                          getStatusColor(agent.status)
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium truncate">{agent.name}</p>
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                            {agent.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                          <span>{agent.executionCount} runs</span>
                          <span>{agent.successRate}% success</span>
                          <span>{(agent.avgTime / 1000).toFixed(1)}s avg</span>
                        </div>
                      </div>
                      <StatusIcon className={cn(
                        "h-4 w-4",
                        agent.status === 'active' && "text-green-500",
                        agent.status === 'idle' && "text-gray-400",
                        agent.status === 'error' && "text-red-500",
                        agent.status === 'paused' && "text-amber-500"
                      )} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bot className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No agents configured</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Executions */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Recent Executions
                {selectedAgent && (
                  <Badge variant="secondary" className="text-[10px] ml-1">
                    {selectedAgent}
                  </Badge>
                )}
              </CardTitle>
              {selectedAgent && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedAgent(null)}
                  className="h-7 text-xs"
                >
                  Clear filter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredExecutions && filteredExecutions.length > 0 ? (
              <div className="divide-y max-h-[320px] overflow-y-auto">
                {filteredExecutions.slice(0, 10).map((execution) => {
                  const StatusIcon = getStatusIcon(execution.status);
                  return (
                    <div
                      key={execution.id}
                      className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className={cn(
                        "flex items-center justify-center h-7 w-7 rounded-full shrink-0",
                        getStatusColor(execution.status)
                      )}>
                        <StatusIcon className={cn(
                          "h-3.5 w-3.5",
                          execution.status === 'running' && "animate-spin"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{execution.agentName}</p>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                          <span>{new Date(execution.startedAt).toLocaleTimeString()}</span>
                          {execution.status !== 'running' && (
                            <span>{(execution.duration / 1000).toFixed(1)}s</span>
                          )}
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[9px] h-5",
                          execution.status === 'success' && "border-green-200 bg-green-50 text-green-700",
                          execution.status === 'failed' && "border-red-200 bg-red-50 text-red-700",
                          execution.status === 'running' && "border-blue-200 bg-blue-50 text-blue-700"
                        )}
                      >
                        {execution.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Zap className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No recent executions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
