"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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

// Mock Data
const mockAgents: Agent[] = [
  {
    id: "agent-1",
    name: "Email Responder",
    description: "Automatically responds to customer inquiries",
    type: "communication",
    status: "active",
    icon: Mail,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    currentTask: "Sending follow-up to John Smith...",
    progress: 75,
    tasksToday: 23,
    timeSaved: "2.3 hrs",
    lastActive: new Date(),
    workflow: [
      { id: "w1", name: "Receive Email", status: "completed", icon: Mail },
      { id: "w2", name: "Analyze Content", status: "completed", icon: Brain },
      { id: "w3", name: "Draft Response", status: "current", icon: FileText },
      { id: "w4", name: "Send Email", status: "pending", icon: Mail },
    ],
  },
  {
    id: "agent-2",
    name: "Lead Scorer",
    description: "Scores and prioritizes new leads automatically",
    type: "sales",
    status: "active",
    icon: Target,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    currentTask: "Analyzing lead: Sarah Chen (TechCorp)",
    progress: 45,
    tasksToday: 67,
    timeSaved: "4.1 hrs",
    lastActive: new Date(Date.now() - 30000),
    workflow: [
      { id: "w1", name: "New Lead Detected", status: "completed", icon: Users },
      { id: "w2", name: "Data Enrichment", status: "current", icon: Database },
      { id: "w3", name: "Calculate Score", status: "pending", icon: Target },
      { id: "w4", name: "Assign to Team", status: "pending", icon: Users },
    ],
  },
  {
    id: "agent-3",
    name: "Meeting Prep",
    description: "Generates comprehensive meeting briefs",
    type: "productivity",
    status: "idle",
    icon: Calendar,
    color: "text-green-600",
    bgColor: "bg-green-50",
    tasksToday: 5,
    timeSaved: "1.5 hrs",
    lastActive: new Date(Date.now() - 3600000),
    workflow: [
      { id: "w1", name: "Detect Meeting", status: "completed", icon: Calendar },
      { id: "w2", name: "Gather Context", status: "completed", icon: Database },
      { id: "w3", name: "Generate Brief", status: "completed", icon: FileText },
    ],
  },
  {
    id: "agent-4",
    name: "Data Enricher",
    description: "Auto-populates missing contact and company data",
    type: "data",
    status: "new",
    icon: Database,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    tasksToday: 0,
    timeSaved: "0 hrs",
    lastActive: new Date(),
    isNew: true,
  },
  {
    id: "agent-5",
    name: "Follow-up Reminder",
    description: "Reminds you to follow up with leads",
    type: "sales",
    status: "paused",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    tasksToday: 12,
    timeSaved: "0.8 hrs",
    lastActive: new Date(Date.now() - 7200000),
  },
  {
    id: "agent-6",
    name: "Content Writer",
    description: "Generates marketing copy and social posts",
    type: "content",
    status: "idle",
    icon: FileText,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    tasksToday: 8,
    timeSaved: "3.2 hrs",
    lastActive: new Date(Date.now() - 1800000),
  },
];

const generateMockActivity = (): AgentActivity[] => {
  const activities: AgentActivity[] = [
    {
      id: "act-1",
      agentId: "agent-1",
      agentName: "Email Responder",
      action: "Sent follow-up email",
      description: "Follow-up sent to John Smith regarding Q4 proposal",
      timestamp: new Date(),
      status: "success",
    },
    {
      id: "act-2",
      agentId: "agent-2",
      agentName: "Lead Scorer",
      action: "Scored new lead",
      description: "Sarah Chen (TechCorp) - Score: 94 🔥",
      timestamp: new Date(Date.now() - 15000),
      status: "success",
      details: "High intent signals detected",
    },
    {
      id: "act-3",
      agentId: "agent-1",
      agentName: "Email Responder",
      action: "Processing email",
      description: "Analyzing incoming email from support@acme.com",
      timestamp: new Date(Date.now() - 30000),
      status: "running",
    },
    {
      id: "act-4",
      agentId: "agent-2",
      agentName: "Lead Scorer",
      action: "Enriched lead data",
      description: "Added company info for Mike Johnson (StartupXYZ)",
      timestamp: new Date(Date.now() - 60000),
      status: "success",
    },
    {
      id: "act-5",
      agentId: "agent-3",
      agentName: "Meeting Prep",
      action: "Generated brief",
      description: "Meeting brief created for 'Acme Corp Demo' at 2:00 PM",
      timestamp: new Date(Date.now() - 180000),
      status: "success",
      details: "3 pages, 5 talking points",
    },
    {
      id: "act-6",
      agentId: "agent-6",
      agentName: "Content Writer",
      action: "Created social post",
      description: "LinkedIn post drafted for product launch",
      timestamp: new Date(Date.now() - 300000),
      status: "success",
    },
    {
      id: "act-7",
      agentId: "agent-5",
      agentName: "Follow-up Reminder",
      action: "Scheduled reminder",
      description: "Reminder set for Lisa Park follow-up in 2 days",
      timestamp: new Date(Date.now() - 600000),
      status: "success",
    },
  ];
  return activities;
};

// Simulated new activities for real-time feel
const newActivityTemplates = [
  { agentId: "agent-1", agentName: "Email Responder", action: "Sent email", descriptions: ["Reply sent to customer inquiry", "Follow-up email delivered", "Auto-response sent"] },
  { agentId: "agent-2", agentName: "Lead Scorer", action: "Scored lead", descriptions: ["New lead scored: 87 points", "Lead qualified for sales", "Hot lead detected: Score 92"] },
  { agentId: "agent-3", agentName: "Meeting Prep", action: "Prepared brief", descriptions: ["Meeting context gathered", "Brief generated for upcoming call"] },
  { agentId: "agent-6", agentName: "Content Writer", action: "Generated content", descriptions: ["Email template created", "Social post drafted"] },
];

export default function ActivityPage() {
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [activities, setActivities] = useState<AgentActivity[]>(generateMockActivity());
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLive, setIsLive] = useState(true);
  const activityEndRef = useRef<HTMLDivElement>(null);

  // Simulate real-time activity updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      // Randomly add new activity
      if (Math.random() > 0.5) {
        const template = newActivityTemplates[Math.floor(Math.random() * newActivityTemplates.length)];
        const newActivity: AgentActivity = {
          id: `act-${Date.now()}`,
          agentId: template.agentId,
          agentName: template.agentName,
          action: template.action,
          description: template.descriptions[Math.floor(Math.random() * template.descriptions.length)],
          timestamp: new Date(),
          status: "success",
        };
        setActivities(prev => [newActivity, ...prev].slice(0, 50));
      }

      // Update agent progress randomly
      setAgents(prev => prev.map(agent => {
        if (agent.status === "active" && agent.progress !== undefined) {
          const newProgress = Math.min(100, agent.progress + Math.floor(Math.random() * 10));
          if (newProgress >= 100) {
            return { ...agent, progress: Math.floor(Math.random() * 30) + 10 };
          }
          return { ...agent, progress: newProgress };
        }
        return agent;
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

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
  const handlePauseAgent = (agentId: string) => {
    setAgents(prev => prev.map(a => 
      a.id === agentId 
        ? { ...a, status: a.status === "paused" ? "active" : "paused" as const }
        : a
    ));
    toast.success(agents.find(a => a.id === agentId)?.status === "paused" ? "Agent resumed" : "Agent paused");
  };

  const handleConfigureAgent = (agent: Agent) => {
    toast.info(`Opening configuration for ${agent.name}...`);
  };

  const handleViewWorkflow = (agent: Agent) => {
    setSelectedAgent(agent);
    toast.success(`Viewing workflow for ${agent.name}`);
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

  // Stats
  const stats = {
    activeAgents: agents.filter(a => a.status === "active").length,
    totalTasks: agents.reduce((sum, a) => sum + a.tasksToday, 0),
    totalTimeSaved: agents.reduce((sum, a) => sum + parseFloat(a.timeSaved), 0).toFixed(1),
    successRate: 98.5,
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
              {filteredAgents.map((agent) => {
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
              })}
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
              {filteredActivities.map((activity, index) => {
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
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
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
                      disabled={selectedAgent.isNew}
                      className="w-full"
                    >
                      {selectedAgent.status === "paused" ? (
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
            <AlertCircle className="h-4 w-4 text-green-600" />
            <span className="font-semibold text-green-600">0 errors</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
