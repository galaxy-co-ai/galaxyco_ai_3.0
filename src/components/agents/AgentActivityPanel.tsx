"use client";

import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Settings,
  Bot,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  TrendingUp,
  Pause,
  Play,
  RefreshCw,
  Mail,
  MessageSquare,
  FileText,
  Target,
  Brain,
  Calendar,
  Database,
  Workflow,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Agent, AgentStatus } from "./AgentList";

export interface AgentActivity {
  id: string;
  agentId: string;
  agentName: string;
  action: string;
  description: string;
  timestamp: Date;
  status: "success" | "running" | "pending" | "error";
  details?: string;
}

interface AgentActivityPanelProps {
  selectedAgent: Agent | null;
  activities: AgentActivity[];
  isLoading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onPauseAgent?: (agentId: string) => void;
  onConfigureAgent?: (agent: Agent) => void;
  isPausing?: boolean;
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

function formatTimestamp(date: Date) {
  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 5) return "Just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  return date.toLocaleDateString();
}

export default function AgentActivityPanel({
  selectedAgent,
  activities,
  isLoading = false,
  error = false,
  onRetry,
  onPauseAgent,
  onConfigureAgent,
  isPausing = false,
}: AgentActivityPanelProps) {
  const activityEndRef = useRef<HTMLDivElement>(null);

  // Filter activities for selected agent
  const filteredActivities = selectedAgent
    ? activities.filter((a) => a.agentId === selectedAgent.id)
    : activities;

  if (!selectedAgent) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-6">
          <Bot className="h-10 w-10 text-emerald-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Select an Agent
        </h3>
        <p className="text-sm text-gray-500 max-w-sm mb-8">
          Click on any agent in the list to view their activity, status, and
          manage their settings.
        </p>
        <div className="flex flex-col gap-3 text-sm text-gray-500">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span>Active — Agent is working</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span>Paused — Agent is on standby</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-gray-400" />
            <span>Inactive — Agent needs setup</span>
          </div>
        </div>
      </div>
    );
  }

  const Icon = agentTypeIcons[selectedAgent.type] || Bot;
  const colors = agentTypeColors[selectedAgent.type] || {
    text: "text-gray-600",
    bg: "bg-gray-50",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Agent Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", colors.bg)}>
              <Icon className={cn("h-6 w-6", colors.text)} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedAgent.name}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                {getStatusIndicator(selectedAgent.status)}
                <span className="text-sm text-gray-500">
                  {getStatusLabel(selectedAgent.status)}
                </span>
                <span className="text-gray-300">•</span>
                <span className="text-sm text-gray-500">
                  {selectedAgent.tasksToday} tasks today
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Pause/Resume Button */}
            {onPauseAgent && selectedAgent.status !== "inactive" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPauseAgent(selectedAgent.id)}
                disabled={isPausing}
                className="h-9"
              >
                {isPausing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : selectedAgent.status === "paused" ? (
                  <>
                    <Play className="h-4 w-4 mr-1.5" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-1.5" />
                    Pause
                  </>
                )}
              </Button>
            )}
            {/* Settings Button */}
            {onConfigureAgent && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConfigureAgent(selectedAgent)}
                className="h-9"
                aria-label="Agent settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        {/* Description */}
        <p className="text-sm text-gray-500 mt-3 pl-[68px]">
          {selectedAgent.description}
        </p>
      </div>

      {/* Activity Feed Header */}
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">
            Recent Activity
          </span>
          <span className="text-xs text-gray-400">
            ({filteredActivities.length})
          </span>
        </div>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-7 text-xs text-gray-500"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        )}
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="p-3 rounded-lg border border-gray-100 bg-white"
            >
              <div className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </div>
          ))
        ) : error ? (
          // Error state
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-10 w-10 text-red-400 mb-3" />
            <p className="text-sm text-gray-600 mb-3">Failed to load activity</p>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Retry
              </Button>
            )}
          </div>
        ) : filteredActivities.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No activity yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Agent activity will appear here
            </p>
          </div>
        ) : (
          filteredActivities.map((activity, index) => {
            const ActivityIcon = agentTypeIcons[selectedAgent.type] || Bot;
            const activityColors = colors;

            return (
              <div
                key={activity.id}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  index === 0
                    ? "bg-emerald-50/50 border-emerald-200"
                    : "bg-white border-gray-100",
                  activity.status === "running" && "border-l-2 border-l-blue-500"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg flex-shrink-0",
                      activityColors.bg
                    )}
                  >
                    <ActivityIcon
                      className={cn("h-4 w-4", activityColors.text)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {activity.action}
                      </span>
                      {activity.status === "running" && (
                        <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-50 text-blue-600 border-blue-200">
                          <Loader2 className="h-2.5 w-2.5 mr-0.5 animate-spin" />
                          Running
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {activity.description}
                    </p>
                    {activity.details && (
                      <p className="text-xs text-gray-400 mt-1">
                        {activity.details}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-[11px] text-gray-400">
                        {formatTimestamp(activity.timestamp)}
                      </span>
                      {activity.status === "success" && (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-1" />
                      )}
                      {activity.status === "error" && (
                        <AlertCircle className="h-3 w-3 text-red-500 ml-1" />
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
  );
}
