"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Search,
  Bot,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Mail,
  MessageSquare,
  FileText,
  CheckCircle2,
  Target,
  Brain,
  Calendar,
  Database,
  Workflow,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Agent status types (simplified to 3)
export type AgentStatus = "active" | "paused" | "inactive";

export interface Agent {
  id: string;
  name: string;
  description: string;
  type: string;
  status: AgentStatus;
  tasksToday: number;
  lastActive: Date;
  unreadMessages?: number;
}

interface AgentListProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (agent: Agent | null) => void;
  isLoading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  showMessageBadge?: boolean;
}

// Agent type to icon mapping
const agentTypeIcons: Record<string, typeof Bot> = {
  email: Mail,
  call: MessageSquare,
  note: FileText,
  task: CheckCircle2,
  roadmap: Target,
  content: FileText,
  custom: Bot,
  browser: Database,
  "cross-app": Workflow,
  knowledge: Brain,
  sales: Target,
  trending: TrendingUp,
  research: Search,
  meeting: Calendar,
  code: Database,
  data: Database,
  security: AlertCircle,
  scope: Target,
};

// Agent type to color mapping
const agentTypeColors: Record<string, { text: string; bg: string }> = {
  email: { text: "text-blue-600", bg: "bg-blue-50" },
  call: { text: "text-green-600", bg: "bg-green-50" },
  note: { text: "text-amber-600", bg: "bg-amber-50" },
  task: { text: "text-purple-600", bg: "bg-purple-50" },
  roadmap: { text: "text-indigo-600", bg: "bg-indigo-50" },
  content: { text: "text-pink-600", bg: "bg-pink-50" },
  custom: { text: "text-gray-600", bg: "bg-gray-50" },
  browser: { text: "text-cyan-600", bg: "bg-cyan-50" },
  "cross-app": { text: "text-orange-600", bg: "bg-orange-50" },
  knowledge: { text: "text-violet-600", bg: "bg-violet-50" },
  sales: { text: "text-purple-600", bg: "bg-purple-50" },
  trending: { text: "text-red-600", bg: "bg-red-50" },
  research: { text: "text-blue-600", bg: "bg-blue-50" },
  meeting: { text: "text-green-600", bg: "bg-green-50" },
  code: { text: "text-gray-600", bg: "bg-gray-50" },
  data: { text: "text-cyan-600", bg: "bg-cyan-50" },
  security: { text: "text-red-600", bg: "bg-red-50" },
  scope: { text: "text-indigo-600", bg: "bg-indigo-50" },
};

function getStatusIndicator(status: AgentStatus) {
  switch (status) {
    case "active":
      return (
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
      );
    case "paused":
      return <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />;
    case "inactive":
      return <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />;
  }
}

function getStatusLabel(status: AgentStatus) {
  switch (status) {
    case "active":
      return "Active";
    case "paused":
      return "Paused";
    case "inactive":
      return "Inactive";
  }
}

function getStatusBadgeClasses(status: AgentStatus) {
  switch (status) {
    case "active":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "paused":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "inactive":
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

export default function AgentList({
  agents,
  selectedAgentId,
  onSelectAgent,
  isLoading = false,
  error = false,
  onRetry,
  showMessageBadge = false,
}: AgentListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AgentStatus | "all">("all");

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">Agents</span>
            <span className="text-xs text-gray-400">
              ({filteredAgents.length})
            </span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as AgentStatus | "all")
            }
            className="h-7 px-2 text-xs border border-gray-200 rounded-md bg-gray-50 text-gray-600 focus:outline-none focus:ring-1 focus:ring-emerald-200"
            aria-label="Filter by status"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm bg-gray-50 border-gray-200"
          />
        </div>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="p-3 rounded-xl border border-gray-100 bg-white"
            >
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </div>
          ))
        ) : error ? (
          // Error state
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
            <p className="text-sm text-gray-600 mb-3">Failed to load agents</p>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Retry
              </Button>
            )}
          </div>
        ) : filteredAgents.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bot className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No agents found</p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          filteredAgents.map((agent) => {
            const isSelected = selectedAgentId === agent.id;
            const Icon = agentTypeIcons[agent.type] || Bot;
            const colors = agentTypeColors[agent.type] || {
              text: "text-gray-600",
              bg: "bg-gray-50",
            };

            return (
              <button
                key={agent.id}
                onClick={() => onSelectAgent(isSelected ? null : agent)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all duration-200",
                  isSelected
                    ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 shadow-md"
                    : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                )}
                aria-label={`Select ${agent.name}`}
                aria-pressed={isSelected}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-2.5 rounded-lg relative", colors.bg)}>
                    <Icon className={cn("h-5 w-5", colors.text)} />
                    <div className="absolute -top-0.5 -right-0.5">
                      {getStatusIndicator(agent.status)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-semibold text-sm text-gray-900 truncate">
                        {agent.name}
                      </h4>
                      {showMessageBadge && agent.unreadMessages && agent.unreadMessages > 0 && (
                        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-500 text-white border-0">
                          {agent.unreadMessages}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mb-2">
                      {agent.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={cn(
                          "text-[10px] px-2 py-0.5 h-5 border font-medium",
                          getStatusBadgeClasses(agent.status)
                        )}
                      >
                        {getStatusIndicator(agent.status)}
                        <span className="ml-1">{getStatusLabel(agent.status)}</span>
                      </Badge>
                      <span className="text-[10px] text-gray-400">
                        {agent.tasksToday} tasks today
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-transform flex-shrink-0 mt-1",
                      isSelected
                        ? "text-emerald-600 rotate-90"
                        : "text-gray-300"
                    )}
                  />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
