"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Activity,
  Bot,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  Mail,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Workflow,
  Zap,
  AlertCircle,
  Eye,
  MoreVertical,
  Star,
  FileText,
  Database,
  MessageSquare,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Types
interface AgentActivity {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  description: string;
  timestamp: Date;
  status: "success" | "running" | "pending" | "error";
  details?: string;
}

interface Agent {
  id: string;
  name: string;
  description: string;
  type: string;
  status: "active" | "idle" | "paused" | "error" | "new";
  icon: typeof Bot;
  color: string;
  bgColor: string;
  currentTask?: string;
  progress?: number;
  tasksToday: number;
  timeSaved: string;
  lastActive: Date;
  isNew?: boolean;
  workflow?: WorkflowStep[];
}

interface WorkflowStep {
  id: string;
  name: string;
  status: "completed" | "current" | "pending";
  icon: typeof Mail;
}

// API response types
interface ApiAgent {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  executionCount: number;
  lastExecutedAt: string | null;
}

interface ApiExecution {
  id: string;
  agentId: string;
  agentName: string;
  agentType: string;
  agentDescription: string | null;
  status: string;
  durationMs: number | null;
  createdAt: string;
}

// Agent type mapping for icons and colors
const agentTypeConfig: Record<string, { icon: typeof Bot; color: string; bgColor: string }> = {
  email: { icon: Mail, color: "text-blue-600", bgColor: "bg-blue-50" },
  call: { icon: MessageSquare, color: "text-green-600", bgColor: "bg-green-50" },
  note: { icon: FileText, color: "text-amber-600", bgColor: "bg-amber-50" },
  task: { icon: CheckCircle2, color: "text-purple-600", bgColor: "bg-purple-50" },
  roadmap: { icon: Target, color: "text-indigo-600", bgColor: "bg-indigo-50" },
  content: { icon: FileText, color: "text-pink-600", bgColor: "bg-pink-50" },
  custom: { icon: Bot, color: "text-gray-600", bgColor: "bg-gray-50" },
  browser: { icon: Database, color: "text-cyan-600", bgColor: "bg-cyan-50" },
  "cross-app": { icon: Workflow, color: "text-orange-600", bgColor: "bg-orange-50" },
  knowledge: { icon: Brain, color: "text-violet-600", bgColor: "bg-violet-50" },
  sales: { icon: Target, color: "text-purple-600", bgColor: "bg-purple-50" },
  trending: { icon: TrendingUp, color: "text-red-600", bgColor: "bg-red-50" },
  research: { icon: Search, color: "text-blue-600", bgColor: "bg-blue-50" },
  meeting: { icon: Calendar, color: "text-green-600", bgColor: "bg-green-50" },
  code: { icon: Database, color: "text-gray-600", bgColor: "bg-gray-50" },
  data: { icon: Database, color: "text-cyan-600", bgColor: "bg-cyan-50" },
  security: { icon: AlertCircle, color: "text-red-600", bgColor: "bg-red-50" },
  scope: { icon: Target, color: "text-indigo-600", bgColor: "bg-indigo-50" },
};

// Transform API agent to local Agent format
const transformApiAgent = (apiAgent: ApiAgent): Agent => {
  const typeConfig = agentTypeConfig[apiAgent.type] || agentTypeConfig.custom;
  const statusMap: Record<string, Agent["status"]> = {
    draft: "new",
    active: "active",
    paused: "paused",
    archived: "idle",
  };
  
  return {
    id: apiAgent.id,
    name: apiAgent.name,
    description: apiAgent.description || "No description",
    type: apiAgent.type,
    status: statusMap[apiAgent.status] || "idle",
    icon: typeConfig.icon,
    color: typeConfig.color,
    bgColor: typeConfig.bgColor,
    tasksToday: apiAgent.executionCount || 0,
    timeSaved: `${((apiAgent.executionCount || 0) * 0.1).toFixed(1)} hrs`,
    lastActive: apiAgent.lastExecutedAt ? new Date(apiAgent.lastExecutedAt) : new Date(),
    isNew: apiAgent.status === "draft",
  };
};

// Transform API execution to AgentActivity format
const transformApiExecution = (execution: ApiExecution): AgentActivity => {
  const statusMap: Record<string, AgentActivity["status"]> = {
    pending: "pending",
    running: "running",
    completed: "success",
    failed: "error",
    cancelled: "error",
  };
  
  return {
    id: execution.id,
    agentId: execution.agentId,
    agentName: execution.agentName,
    action: execution.status === "completed" ? "Completed task" : 
            execution.status === "running" ? "Processing" : 
            execution.status === "failed" ? "Failed" : "Pending",
    description: execution.agentDescription || `Execution ${execution.status}`,
    timestamp: new Date(execution.createdAt),
    status: statusMap[execution.status] || "success",
    details: execution.durationMs ? `Duration: ${execution.durationMs}ms` : undefined,
  };
};

export default function ActivityPage() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLive, setIsLive] = useState(true);
  const [isUpdatingAgent, setIsUpdatingAgent] = useState<string | null>(null);
  const activityEndRef = useRef<HTMLDivElement>(null);

  // Fetch agents from API
  const { data: agentsData, error: agentsError, mutate: mutateAgents, isLoading: isLoadingAgents } = useSWR<ApiAgent[]>(
    '/api/agents',
    fetcher,
    { refreshInterval: isLive ? 10000 : 0 }
  );

  // Fetch activity/executions from API
  const { data: activityData, error: activityError, mutate: mutateActivity, isLoading: isLoadingActivity } = useSWR(
    '/api/activity?limit=50',
    fetcher,
    { refreshInterval: isLive ? 5000 : 0 }
  );

  // Transform API data to local format
  const agents: Agent[] = agentsData?.map(transformApiAgent) || [];
  const activities: AgentActivity[] = activityData?.executions?.map(transformApiExecution) || [];

  // Refresh data periodically when live
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      mutateAgents();
      mutateActivity();
    }, 10000);

    return () => clearInterval(interval);
  }, [isLive, mutateAgents, mutateActivity]);

  // Filter agents
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter activities by selected agent
  const filteredActivities = selectedAgent
    ? activities.filter(a => a.agentId === selectedAgent.id)
    : activities;

  // Handlers
  const handlePauseAgent = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;
    
    const newStatus = agent.status === "paused" ? "active" : "paused";
    setIsUpdatingAgent(agentId);
    
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update agent');
      }
      
      // Refresh agents data
      await mutateAgents();
      toast.success(newStatus === "paused" ? "Agent paused" : "Agent resumed");
    } catch (error) {
      logger.error('Failed to update agent status', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update agent. Please try again.');
    } finally {
      setIsUpdatingAgent(null);
    }
  };

  const handleConfigureAgent = (agent: Agent) => {
    toast.info(`Opening configuration for ${agent.name}...`);
    // TODO: Navigate to agent configuration page
  };

  const handleViewWorkflow = (agent: Agent) => {
    setSelectedAgent(agent);
    toast.info(`Viewing workflow for ${agent.name}`);
    // TODO: Navigate to workflow builder
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 5) return "Just now";
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  const getStatusIndicator = (status: Agent["status"]) => {
    switch (status) {
      case "active":
        return <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>;
      case "idle":
        return <span className="h-3 w-3 rounded-full bg-yellow-400" />;
      case "paused":
        return <span className="h-3 w-3 rounded-full bg-gray-400" />;
      case "error":
        return <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>;
      case "new":
        return <span className="h-3 w-3 rounded-full bg-indigo-500 animate-pulse" />;
      default:
        return <span className="h-3 w-3 rounded-full bg-gray-300" />;
    }
  };

  const getStatusLabel = (status: Agent["status"]) => {
    switch (status) {
      case "active": return "Working";
      case "idle": return "Idle";
      case "paused": return "Paused";
      case "error": return "Error";
      case "new": return "New";
      default: return status;
    }
  };

  // Stats from real API data
  const stats = {
    activeAgents: agents.filter(a => a.status === "active").length,
    totalTasks: activityData?.stats?.total || 0,
    totalTimeSaved: ((activityData?.stats?.total || 0) * 0.05).toFixed(1), // Estimate ~3 min saved per task
    successRate: activityData?.stats?.successRate || 0,
    errors: activityData?.stats?.failed || 0,
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity</h1>
          <p className="text-gray-500 mt-1">Monitor and manage your AI agents in real-time</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={cn(
            "px-3 py-1.5 flex items-center gap-2",
            isLive 
              ? "bg-green-100 text-green-700 border-green-200" 
              : "bg-gray-100 text-gray-600 border-gray-200"
          )}>
            {isLive && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span></span>}
            {isLive ? "LIVE" : "Paused"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className={cn(isLive && "border-green-200")}
          >
            {isLive ? <Pause className="h-4 w-4 mr-1.5" /> : <Play className="h-4 w-4 mr-1.5" />}
            {isLive ? "Pause" : "Resume"}
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Agent
          </Button>
        </div>
      </div>

      {/* Stats Bar - Compact Inline */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
          <Activity className="h-3.5 w-3.5 mr-1.5 text-green-600" />
          <span className="font-semibold">{stats.activeAgents}</span>
          <span className="ml-1 text-green-600/70 font-normal">Active</span>
        </Badge>
        <Badge className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
          <span className="font-semibold">{stats.totalTasks}</span>
          <span className="ml-1 text-blue-600/70 font-normal">Tasks</span>
        </Badge>
        <Badge className="px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors">
          <Clock className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
          <span className="font-semibold">{stats.totalTimeSaved}h</span>
          <span className="ml-1 text-purple-600/70 font-normal">Saved</span>
        </Badge>
        <Badge className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
          <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
          <span className="font-semibold">{stats.successRate}%</span>
          <span className="ml-1 text-amber-600/70 font-normal">Success</span>
        </Badge>
      </div>

      {/* Main Content */}
      <Card className="p-6 shadow-lg border-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px]">
          {/* Agent Roster - Left Panel */}
          <div className="lg:col-span-4 flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">Agents</span>
                  <span className="text-xs text-gray-400">({filteredAgents.length})</span>
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-7 px-2 text-xs border border-gray-200 rounded-md bg-gray-50 text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                  aria-label="Filter by status"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="idle">Idle</option>
                  <option value="paused">Paused</option>
                  <option value="new">New</option>
                </select>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm bg-gray-50 border-gray-200"
                />
              </div>
            </div>

            {/* Agent List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isLoadingAgents ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg border border-gray-100 bg-white">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-9 w-9 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </div>
                ))
              ) : agentsError ? (
                // Error state
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Failed to load agents</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => mutateAgents()}
                  >
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Retry
                  </Button>
                </div>
              ) : filteredAgents.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bot className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No agents found</p>
                  <p className="text-xs text-gray-400">Try adjusting your filters</p>
                </div>
              ) : (
                filteredAgents.map((agent) => {
                  const isSelected = selectedAgent?.id === agent.id;
                  const AgentIcon = agent.icon;

                  return (
                    <button
                      key={agent.id}
                      onClick={() => setSelectedAgent(isSelected ? null : agent)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-all duration-200",
                        isSelected
                          ? `${agent.bgColor} border-2 ${agent.color.replace('text-', 'border-')} shadow-md`
                          : agent.isNew
                          ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:border-indigo-300"
                          : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      )}
                      aria-label={`Select ${agent.name}`}
                      aria-pressed={isSelected}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg relative", agent.bgColor)}>
                          <AgentIcon className={cn("h-5 w-5", agent.color)} />
                          <div className="absolute -top-1 -right-1">
                            {getStatusIndicator(agent.status)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-semibold text-sm text-gray-900 truncate">{agent.name}</h4>
                            {agent.isNew && (
                              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-indigo-100 text-indigo-700 border-0">
                                <Star className="h-2.5 w-2.5 mr-0.5" />
                                NEW
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate mb-1.5">{agent.description}</p>
                          
                          {agent.status === "active" && agent.currentTask && (
                            <div className="mb-1.5">
                              <p className="text-[11px] text-gray-600 truncate">{agent.currentTask}</p>
                              {agent.progress !== undefined && (
                                <Progress value={agent.progress} className="h-1 mt-1" />
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-[10px] text-gray-400">
                            <span className="flex items-center gap-1">
                              {getStatusIndicator(agent.status)}
                              <span className="ml-0.5">{getStatusLabel(agent.status)}</span>
                            </span>
                            <span>•</span>
                            <span>{agent.tasksToday} today</span>
                            <span>•</span>
                            <span>{agent.timeSaved} saved</span>
                          </div>
                        </div>
                        <ChevronRight className={cn(
                          "h-4 w-4 transition-transform flex-shrink-0",
                          isSelected ? `${agent.color} rotate-90` : "text-gray-300"
                        )} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Activity Stream - Center Panel */}
          <div className="lg:col-span-4 flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">Activity</span>
                {isLive && (
                  <span className="flex items-center gap-1.5 text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                    </span>
                    Live
                  </span>
                )}
              </div>
              {selectedAgent && (
                <span className="text-xs text-gray-500">
                  {selectedAgent.name}
                </span>
              )}
            </div>

            {/* Activity List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isLoadingActivity ? (
                // Loading skeletons
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-3 rounded-lg border border-gray-100 bg-white">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-7 w-7 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  </div>
                ))
              ) : activityError ? (
                // Error state
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-2">Failed to load activity</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => mutateActivity()}
                  >
                    <RefreshCw className="h-4 w-4 mr-1.5" />
                    Retry
                  </Button>
                </div>
              ) : filteredActivities.length === 0 ? (
                // Empty state
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Activity className="h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">No activity yet</p>
                  <p className="text-xs text-gray-400">Agent activity will appear here</p>
                </div>
              ) : (
                filteredActivities.map((activity, index) => {
                  const agent = agents.find(a => a.id === activity.agentId);
                  const AgentIcon = agent?.icon || Bot;

                  return (
                    <div
                      key={activity.id}
                      className={cn(
                        "p-3 rounded-lg border transition-all",
                        index === 0 && isLive ? "animate-pulse-once bg-green-50/50 border-green-200" : "bg-white border-gray-100",
                        activity.status === "running" && "border-l-2 border-l-blue-500"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn("p-1.5 rounded-lg flex-shrink-0", agent?.bgColor || "bg-gray-100")}>
                          <AgentIcon className={cn("h-4 w-4", agent?.color || "text-gray-600")} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-medium text-gray-900">{activity.agentName}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{activity.action}</span>
                          </div>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          {activity.details && (
                            <p className="text-xs text-gray-400 mt-1">{activity.details}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-gray-400">{formatTimestamp(activity.timestamp)}</span>
                            {activity.status === "running" && (
                              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-50 text-blue-600 border-blue-200">
                                <Loader2 className="h-2.5 w-2.5 mr-0.5 animate-spin" />
                                Running
                              </Badge>
                            )}
                            {activity.status === "success" && (
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                            )}
                            {activity.status === "error" && (
                              <AlertCircle className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={activityEndRef} />
            </div>
          </div>

          {/* Agent Detail - Right Panel */}
          <div className="lg:col-span-4 flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden">
            {selectedAgent ? (
              <>
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("p-2 rounded-lg", selectedAgent.bgColor)}>
                        <selectedAgent.icon className={cn("h-5 w-5", selectedAgent.color)} />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">{selectedAgent.name}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {getStatusIndicator(selectedAgent.status)}
                          <span>{getStatusLabel(selectedAgent.status)}</span>
                          <span className="text-gray-300">•</span>
                          <span>{selectedAgent.tasksToday} tasks</span>
                          <span className="text-gray-300">•</span>
                          <span>{selectedAgent.timeSaved}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedAgent(null)}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                      aria-label="Close panel"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* Current Task */}
                  {selectedAgent.status === "active" && selectedAgent.currentTask && (
                    <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                        <span className="text-sm font-medium text-blue-700">Current Task</span>
                      </div>
                      <p className="text-sm text-gray-700">{selectedAgent.currentTask}</p>
                      {selectedAgent.progress !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{selectedAgent.progress}%</span>
                          </div>
                          <Progress value={selectedAgent.progress} className="h-2" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* New Agent Setup */}
                  {selectedAgent.isNew && (
                    <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="h-5 w-5 text-indigo-600" />
                        <span className="font-semibold text-indigo-700">Welcome! Setup Required</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        This agent needs to be configured before it can start working.
                      </p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-xs text-indigo-600">1</span>
                          </div>
                          <span className="text-gray-600">Connect data source</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-xs text-gray-400">2</span>
                          </div>
                          <span className="text-gray-400">Configure triggers</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                            <span className="text-xs text-gray-400">3</span>
                          </div>
                          <span className="text-gray-400">Activate agent</span>
                        </div>
                      </div>
                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white">
                        Continue Setup
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}

                  {/* Workflow */}
                  {selectedAgent.workflow && selectedAgent.workflow.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Workflow className="h-4 w-4 text-indigo-600" />
                        Current Workflow
                      </h4>
                      <div className="space-y-2">
                        {selectedAgent.workflow.map((step, index) => {
                          const isLast = index === selectedAgent.workflow!.length - 1;
                          const StepIcon = step.icon;
                          
                          return (
                            <div key={step.id} className="relative">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center",
                                  step.status === "completed" ? "bg-green-100" :
                                  step.status === "current" ? "bg-blue-100" : "bg-gray-100"
                                )}>
                                  {step.status === "completed" ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                  ) : step.status === "current" ? (
                                    <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                                  ) : (
                                    <StepIcon className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                                <span className={cn(
                                  "text-sm",
                                  step.status === "completed" ? "text-green-700" :
                                  step.status === "current" ? "text-blue-700 font-medium" : "text-gray-400"
                                )}>
                                  {step.name}
                                </span>
                                {step.status === "current" && (
                                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-50 text-blue-600 border-blue-200">
                                    In Progress
                                  </Badge>
                                )}
                              </div>
                              {!isLast && (
                                <div className="absolute left-4 top-8 w-0.5 h-4 bg-gray-200" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

                {/* Actions */}
                <div className="p-4 border-t bg-gray-50 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePauseAgent(selectedAgent.id)}
                      disabled={selectedAgent.isNew || isUpdatingAgent === selectedAgent.id}
                      className="w-full"
                    >
                      {isUpdatingAgent === selectedAgent.id ? (
                        <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Updating...</>
                      ) : selectedAgent.status === "paused" ? (
                        <><Play className="h-4 w-4 mr-1.5" />Resume</>
                      ) : (
                        <><Pause className="h-4 w-4 mr-1.5" />Pause</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConfigureAgent(selectedAgent)}
                      className="w-full"
                    >
                      <Settings className="h-4 w-4 mr-1.5" />
                      Configure
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => handleViewWorkflow(selectedAgent)}
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    View Full Workflow
                  </Button>
                </div>
              </>
            ) : (
              /* Empty State */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-4">
                  <Bot className="h-10 w-10 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an Agent</h3>
                <p className="text-sm text-gray-500 max-w-xs mb-6">
                  Click on any agent in the roster to view details, check workflow status, and take actions.
                </p>
                <div className="flex flex-col gap-2 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
                    <span>Green = Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-yellow-400" />
                    <span>Yellow = Idle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-gray-400" />
                    <span>Gray = Paused</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-indigo-500 animate-pulse" />
                    <span>Purple = New</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Daily Summary Footer */}
      <Card className="p-4 border-0 shadow-sm bg-gradient-to-r from-slate-50 to-gray-50">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-gray-600">Today:</span>
            <span className="font-semibold text-gray-900">{stats.totalTasks} tasks completed</span>
          </div>
          <span className="text-gray-300 hidden md:inline">•</span>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-600" />
            <span className="font-semibold text-gray-900">{stats.totalTimeSaved} hours saved</span>
          </div>
          <span className="text-gray-300 hidden md:inline">•</span>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-600" />
            <span className="font-semibold text-gray-900">{stats.successRate}% success rate</span>
          </div>
          <span className="text-gray-300 hidden md:inline">•</span>
          <div className="flex items-center gap-2">
            <AlertCircle className={cn("h-4 w-4", stats.errors > 0 ? "text-red-600" : "text-green-600")} />
            <span className={cn("font-semibold", stats.errors > 0 ? "text-red-600" : "text-green-600")}>
              {stats.errors} {stats.errors === 1 ? "error" : "errors"}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
