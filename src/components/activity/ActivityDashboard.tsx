"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Copy,
  Activity,
  TrendingUp,
  DollarSign,
  Bot,
  Workflow,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Info,
  Zap,
  BookOpen,
  Edit,
  Play,
  Pause,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Execution {
  id: string;
  agentId: string;
  agentName: string;
  agentType: string;
  agentDescription?: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  input?: Record<string, any>;
  output?: Record<string, any>;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  durationMs?: number;
  tokensUsed?: number;
  cost?: number;
  startedAt?: Date | string;
  completedAt?: Date | string;
  createdAt: Date | string;
  triggeredBy: {
    id: string;
    name: string;
    email: string;
  };
}

interface ActivityStats {
  total: number;
  success: number;
  failed: number;
  running: number;
  pending: number;
  successRate: number;
  avgDurationMs: number;
  totalCostCents: number;
}

interface Agent {
  id: string;
  name: string;
  type: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  executionCount: number;
  lastExecutedAt?: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface ActivityDashboardProps {
  initialData: {
    executions: Execution[];
    stats: ActivityStats;
    agents: Agent[];
  };
}

export default function ActivityDashboard({ initialData }: ActivityDashboardProps) {
  const [activeTab, setActiveTab] = useState<"agents" | "executions">("agents");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedExecution, setExpandedExecution] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<string>("7d"); // 1d, 7d, 30d, all
  const [agentSearchQuery, setAgentSearchQuery] = useState("");

  // Build API URL with filters
  const buildApiUrl = () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (agentFilter !== "all") params.set("agentId", agentFilter);
    if (searchQuery) params.set("search", searchQuery);
    
    // Date range
    if (dateRange !== "all") {
      const endDate = new Date();
      const startDate = new Date();
      if (dateRange === "1d") {
        startDate.setDate(startDate.getDate() - 1);
      } else if (dateRange === "7d") {
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateRange === "30d") {
        startDate.setDate(startDate.getDate() - 30);
      }
      params.set("startDate", startDate.toISOString());
      params.set("endDate", endDate.toISOString());
    }
    
    params.set("limit", "100");
    return `/api/activity?${params.toString()}`;
  };

  const { data, error, isLoading, mutate } = useSWR(buildApiUrl(), fetcher, {
    refreshInterval: 10000, // Refresh every 10 seconds
    fallbackData: initialData,
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  });

  // Handle error state - don't show loading if we have fallback data
  const executions = data?.executions ?? initialData.executions;
  const stats = data?.stats ?? initialData.stats;
  const agents = initialData.agents;
  
  // Only show loading if we have no data at all and are actually loading
  const showLoading = isLoading && executions.length === 0 && !data && !error;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "running":
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "cancelled":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "bg-green-50 text-green-700 border-green-200",
      failed: "bg-red-50 text-red-700 border-red-200",
      running: "bg-blue-50 text-blue-700 border-blue-200",
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      cancelled: "bg-gray-50 text-gray-700 border-gray-200",
    };
    return (
      <Badge
        variant="outline"
        className={cn("text-xs", variants[status as keyof typeof variants] || "")}
      >
        {status}
      </Badge>
    );
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "N/A";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatCost = (cents?: number) => {
    if (!cents) return "$0.00";
    return `$${(cents / 100).toFixed(2)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return "N/A";
    const d = typeof date === "string" ? new Date(date) : date;
    return format(d, "MMM d, yyyy 'at' h:mm a");
  };

  const getAgentStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-50 text-green-700 border-green-200",
      paused: "bg-amber-50 text-amber-700 border-amber-200",
      draft: "bg-gray-50 text-gray-700 border-gray-200",
      archived: "bg-gray-50 text-gray-500 border-gray-200",
    };
    return (
      <Badge
        variant="outline"
        className={cn("text-xs capitalize", variants[status as keyof typeof variants] || "")}
      >
        {status}
      </Badge>
    );
  };

  const getAgentStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "paused":
        return <Pause className="h-4 w-4 text-amber-600" />;
      case "draft":
        return <Clock className="h-4 w-4 text-gray-600" />;
      case "archived":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Filter agents
  const filteredAgents = agents.filter((agent) => {
    if (agentSearchQuery) {
      const query = agentSearchQuery.toLowerCase();
      return (
        agent.name.toLowerCase().includes(query) ||
        agent.description?.toLowerCase().includes(query) ||
        agent.type.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const activeAgents = filteredAgents.filter((a) => a.status === "active");
  const pausedAgents = filteredAgents.filter((a) => a.status === "paused");
  const draftAgents = filteredAgents.filter((a) => a.status === "draft");

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 py-4 space-y-4">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Agent Activity</h1>
              <p className="text-sm text-muted-foreground">
                Real-time monitoring of agent executions and performance metrics
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Learn more about Activity">
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-xs mb-2 font-semibold">What is Agent Activity?</p>
                <p className="text-xs text-muted-foreground">
                  This page shows all executions of your AI agents, including their status, performance metrics, and detailed logs. Use filters to find specific executions or monitor agent health.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Stats Cards */}
        <TooltipProvider>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="p-4 cursor-help">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Executions</p>
                      <p className="text-lg font-semibold mt-1">{stats.total.toLocaleString()}</p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Total number of agent executions across all time</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="p-4 cursor-help">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Success Rate</p>
                      <p className="text-lg font-semibold mt-1">{stats.successRate.toFixed(1)}%</p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Percentage of executions that completed successfully</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="p-4 cursor-help">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Duration</p>
                      <p className="text-lg font-semibold mt-1">{formatDuration(stats.avgDurationMs)}</p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Average time taken for agent executions to complete</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="p-4 cursor-help">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Cost</p>
                      <p className="text-lg font-semibold mt-1">{formatCost(stats.totalCostCents)}</p>
                    </div>
                    <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-orange-600" />
                    </div>
                  </div>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Total cost of all agent executions (API usage, tokens, etc.)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>

        {/* Quick Help - Show for new users */}
        {stats.total === 0 && (
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium mb-1">Getting Started</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Once you create and run agents, you&apos;ll see their activity here. This page helps you monitor performance, debug issues, and track costs.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/studio">
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      <Workflow className="h-3 w-3 mr-1.5" />
                      Create Agent
                    </Button>
                  </Link>
                  <Link href="/lunar-labs">
                    <Button size="sm" variant="ghost" className="h-7 text-xs">
                      <BookOpen className="h-3 w-3 mr-1.5" />
                      Learn More
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs for Agents vs Executions */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "agents" | "executions")}>
          <TabsList className="mb-4">
            <TabsTrigger value="agents" className="gap-2">
              <Bot className="h-4 w-4" />
              Agents ({agents.length})
            </TabsTrigger>
            <TabsTrigger value="executions" className="gap-2">
              <Activity className="h-4 w-4" />
              Executions ({stats.total})
            </TabsTrigger>
          </TabsList>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-4">
            {/* Agent Search */}
            <Card className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search agents..."
                      value={agentSearchQuery}
                      onChange={(e) => setAgentSearchQuery(e.target.value)}
                      className="pl-9"
                      aria-label="Search agents"
                    />
                  </div>
                </div>
                <Link href="/studio">
                  <Button>
                    <Workflow className="h-4 w-4 mr-2" />
                    Create Agent
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Agents List */}
            <Card>
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Your Agents</h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      {activeAgents.length} Active
                    </span>
                    <span className="flex items-center gap-1">
                      <Pause className="h-4 w-4 text-amber-600" />
                      {pausedAgents.length} Paused
                    </span>
                  </div>
                </div>
              </div>

              <ScrollArea className="h-[600px]">
                <div className="p-4 space-y-3">
                  {filteredAgents.length === 0 ? (
                    <div className="py-12 text-center">
                      <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No agents found</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {agentSearchQuery
                          ? "Try adjusting your search query"
                          : "Create your first agent to get started"}
                      </p>
                      {!agentSearchQuery && (
                        <Link href="/studio">
                          <Button>
                            <Workflow className="h-4 w-4 mr-2" />
                            Create Agent
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    filteredAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className="border rounded-lg p-4 transition-all hover:shadow-sm"
                      >
                        <div className="flex items-start gap-4">
                          <div className="mt-0.5">{getAgentStatusIcon(agent.status)}</div>

                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-sm">{agent.name}</h3>
                                  {getAgentStatusBadge(agent.status)}
                                  <Badge variant="outline" className="text-xs">
                                    {agent.type}
                                  </Badge>
                                </div>
                                {agent.description && (
                                  <p className="text-xs text-muted-foreground mb-2">
                                    {agent.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>{agent.executionCount} executions</span>
                                  {agent.lastExecutedAt && (
                                    <>
                                      <span>•</span>
                                      <span>
                                        Last run {formatDistanceToNow(new Date(agent.lastExecutedAt), { addSuffix: true })}
                                      </span>
                                    </>
                                  )}
                                  {!agent.lastExecutedAt && (
                                    <>
                                      <span>•</span>
                                      <span>Never executed</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Link href={`/studio?agent=${agent.id}`}>
                                  <Button variant="outline" size="sm" className="gap-2">
                                    <Edit className="h-3 w-3" />
                                    Edit
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Executions Tab */}
          <TabsContent value="executions" className="space-y-4">
            {/* Filters */}
            <Card className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by agent name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                      aria-label="Search executions"
                    />
                  </div>
                </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-full md:w-[180px]" aria-label="Filter by agent">
                <SelectValue placeholder="Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-full md:w-[180px]" aria-label="Date range">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => mutate()}
              aria-label="Refresh data"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </Card>

        {/* Executions List */}
        <Card>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Execution History</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{executions.length} executions</span>
              </div>
            </div>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="p-4 space-y-3">
              {showLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Loading executions...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                  <p className="text-sm text-red-600 mb-2">Failed to load executions</p>
                  <Button variant="outline" size="sm" onClick={() => mutate()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : executions.length === 0 ? (
                <div className="py-12">
                  {stats.total === 0 ? (
                    // Empty state for new users
                    <div className="max-w-2xl mx-auto text-center space-y-6">
                      <div className="bg-gradient-to-b from-blue-50 to-transparent p-8 rounded-2xl border border-blue-100">
                        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Activity className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No agent activity yet</h3>
                        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                          Once you create and run agents, their executions will appear here. You&apos;ll be able to monitor performance, debug issues, and track costs.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Link href="/studio">
                            <Button className="w-full sm:w-auto">
                              <Workflow className="h-4 w-4 mr-2" />
                              Go to Studio
                            </Button>
                          </Link>
                          <Link href="/dashboard">
                            <Button variant="outline" className="w-full sm:w-auto">
                              <Bot className="h-4 w-4 mr-2" />
                              View Dashboard
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                        <Card className="p-4 text-left">
                          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                            <Workflow className="h-5 w-5 text-blue-600" />
                          </div>
                          <h4 className="text-sm font-semibold mb-1">Create an Agent</h4>
                          <p className="text-xs text-muted-foreground">
                            Build your first AI agent in Studio using templates or custom workflows
                          </p>
                        </Card>
                        <Card className="p-4 text-left">
                          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
                            <Zap className="h-5 w-5 text-purple-600" />
                          </div>
                          <h4 className="text-sm font-semibold mb-1">Run a Workflow</h4>
                          <p className="text-xs text-muted-foreground">
                            Execute workflows manually or set up triggers to run them automatically
                          </p>
                        </Card>
                        <Card className="p-4 text-left">
                          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
                            <BookOpen className="h-5 w-5 text-green-600" />
                          </div>
                          <h4 className="text-sm font-semibold mb-1">Learn More</h4>
                          <p className="text-xs text-muted-foreground">
                            Check out Lunar Labs for guides and best practices on building agents
                          </p>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    // No results after filtering
                    <div className="text-center py-12">
                      <Activity className="h-8 w-8 mx-auto text-muted-foreground mb-2 opacity-50" />
                      <p className="text-sm text-muted-foreground mb-1">No executions found</p>
                      <p className="text-xs text-muted-foreground mb-4">
                        Try adjusting your filters or date range
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setStatusFilter("all");
                          setAgentFilter("all");
                          setDateRange("all");
                          setSearchQuery("");
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                executions.map((execution) => (
                  <div
                    key={execution.id}
                    className={cn(
                      "border rounded-lg p-4 transition-all hover:shadow-sm",
                      expandedExecution === execution.id && "border-blue-200 bg-blue-50/30"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5">{getStatusIcon(execution.status)}</div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm truncate">
                                {execution.agentName}
                              </h3>
                              {getStatusBadge(execution.status)}
                              <Badge variant="outline" className="text-xs">
                                {execution.agentType}
                              </Badge>
                            </div>
                            {execution.agentDescription && (
                              <p className="text-xs text-muted-foreground mb-2">
                                {execution.agentDescription}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{formatDistanceToNow(new Date(execution.createdAt), { addSuffix: true })}</span>
                              {execution.durationMs && (
                                <>
                                  <span>•</span>
                                  <span>{formatDuration(execution.durationMs)}</span>
                                </>
                              )}
                              {execution.cost && (
                                <>
                                  <span>•</span>
                                  <span>{formatCost(execution.cost)}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>by {execution.triggeredBy.name}</span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              setExpandedExecution(
                                expandedExecution === execution.id ? null : execution.id
                              )
                            }
                            aria-label={expandedExecution === execution.id ? "Collapse" : "Expand"}
                          >
                            {expandedExecution === execution.id ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </div>

                        {/* Error message preview */}
                        {execution.error && (
                          <div className="bg-red-50 border border-red-200 rounded p-2">
                            <p className="text-xs text-red-700 font-medium">
                              {execution.error.message}
                            </p>
                          </div>
                        )}

                        {/* Expanded Details */}
                        {expandedExecution === execution.id && (
                          <div className="mt-4 pt-4 border-t space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Started</p>
                                <p className="font-medium">{formatDate(execution.startedAt)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Completed</p>
                                <p className="font-medium">{formatDate(execution.completedAt)}</p>
                              </div>
                              {execution.tokensUsed && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Tokens Used</p>
                                  <p className="font-medium">{execution.tokensUsed.toLocaleString()}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Execution ID</p>
                                <div className="flex items-center gap-2">
                                  <p className="font-mono text-xs">{execution.id}</p>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(execution.id)}
                                    aria-label="Copy execution ID"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>

                            {execution.input && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-medium">Input</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() =>
                                      copyToClipboard(JSON.stringify(execution.input, null, 2))
                                    }
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy
                                  </Button>
                                </div>
                                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(execution.input, null, 2)}
                                </pre>
                              </div>
                            )}

                            {execution.output && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-medium">Output</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() =>
                                      copyToClipboard(JSON.stringify(execution.output, null, 2))
                                    }
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy
                                  </Button>
                                </div>
                                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(execution.output, null, 2)}
                                </pre>
                              </div>
                            )}

                            {execution.error && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs font-medium text-red-700">Error Details</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs"
                                    onClick={() =>
                                      copyToClipboard(JSON.stringify(execution.error, null, 2))
                                    }
                                  >
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy
                                  </Button>
                                </div>
                                <pre className="bg-red-50 border border-red-200 p-3 rounded text-xs overflow-x-auto text-red-900">
                                  {JSON.stringify(execution.error, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

            {/* Helpful Tips Banner - Show when there are executions */}
            {executions.length > 0 && stats.total > 0 && (
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Info className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium mb-1">💡 Tips for using Activity</p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                      <li>Click any execution to view detailed input/output and error logs</li>
                      <li>Use filters to find specific agents or failed executions</li>
                      <li>Monitor success rate and duration trends to optimize agent performance</li>
                      <li>Track costs to manage your AI spending effectively</li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </TooltipProvider>
  );
}

