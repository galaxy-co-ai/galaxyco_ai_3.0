"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  Plus,
  Pause,
  Play,
  CheckCircle2,
  Clock,
  TrendingUp,
  Activity,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { motion, AnimatePresence } from "framer-motion";
import NeptuneAssistPanel from "@/components/conversations/NeptuneAssistPanel";

import AgentTabs, { type AgentTabType } from "./AgentTabs";
import AgentList, { type Agent, type AgentStatus } from "./AgentList";
import AgentActivityPanel, { type AgentActivity } from "./AgentActivityPanel";
import AgentMessagesTab from "./AgentMessagesTab";
import AgentLaboratoryTab from "./AgentLaboratoryTab";

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((r) => r.json());

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

// Transform API agent status to simplified 3-status system
function normalizeStatus(apiStatus: string): AgentStatus {
  switch (apiStatus) {
    case "active":
      return "active";
    case "paused":
      return "paused";
    case "draft":
    case "archived":
    case "error":
    default:
      return "inactive";
  }
}

// Transform API agent to local Agent format
function transformApiAgent(apiAgent: ApiAgent): Agent {
  return {
    id: apiAgent.id,
    name: apiAgent.name,
    description: apiAgent.description || "No description",
    type: apiAgent.type,
    status: normalizeStatus(apiAgent.status),
    tasksToday: apiAgent.executionCount || 0,
    lastActive: apiAgent.lastExecutedAt
      ? new Date(apiAgent.lastExecutedAt)
      : new Date(),
    unreadMessages: 0, // No unread messages by default - real counts could come from API
  };
}

// Transform API execution to AgentActivity format
function transformApiExecution(execution: ApiExecution): AgentActivity {
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
    action:
      execution.status === "completed"
        ? "Completed task"
        : execution.status === "running"
        ? "Processing"
        : execution.status === "failed"
        ? "Failed"
        : "Pending",
    description: execution.agentDescription || `Execution ${execution.status}`,
    timestamp: new Date(execution.createdAt),
    status: statusMap[execution.status] || "success",
    details: execution.durationMs
      ? `Duration: ${execution.durationMs}ms`
      : undefined,
  };
}

interface MyAgentsDashboardProps {
  initialAgents?: Agent[];
  initialStats?: {
    activeAgents: number;
    totalTasks: number;
    totalTimeSaved: string;
    successRate: number;
  };
}

export default function MyAgentsDashboard({
  initialAgents = [],
  initialStats,
}: MyAgentsDashboardProps) {
  const [activeTab, setActiveTab] = useState<AgentTabType>("activity");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isLive, setIsLive] = useState(true);
  const [isUpdatingAgent, setIsUpdatingAgent] = useState<string | null>(null);
  const [showNeptune, setShowNeptune] = useState(false);

  // Fetch agents from API
  const {
    data: agentsData,
    error: agentsError,
    mutate: mutateAgents,
    isLoading: isLoadingAgents,
  } = useSWR<{ agents: ApiAgent[] }>("/api/agents", fetcher, {
    refreshInterval: isLive ? 10000 : 0,
    fallbackData: { agents: [] },
  });

  // Fetch activity/executions from API
  const {
    data: activityData,
    error: activityError,
    mutate: mutateActivity,
    isLoading: isLoadingActivity,
  } = useSWR("/api/activity?limit=50", fetcher, {
    refreshInterval: isLive ? 5000 : 0,
  });

  // Transform API data to local format
  const agents: Agent[] =
    agentsData?.agents?.map(transformApiAgent) || initialAgents;
  const activities: AgentActivity[] =
    activityData?.executions?.map(transformApiExecution) || [];

  // Stats from real API data
  const stats = initialStats || {
    activeAgents: agents.filter((a) => a.status === "active").length,
    totalTasks: activityData?.stats?.total || 0,
    totalTimeSaved: ((activityData?.stats?.total || 0) * 0.05).toFixed(1),
    successRate: activityData?.stats?.successRate || 0,
  };

  // Handle agent pause/resume
  const handlePauseAgent = useCallback(
    async (agentId: string) => {
      const agent = agents.find((a) => a.id === agentId);
      if (!agent) return;

      const newStatus = agent.status === "paused" ? "active" : "paused";
      setIsUpdatingAgent(agentId);

      try {
        const response = await fetch(`/api/agents/${agentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update agent");
        }

        await mutateAgents();
        toast.success(
          newStatus === "paused" ? "Agent paused" : "Agent resumed"
        );
      } catch (error) {
        logger.error("Failed to update agent status", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to update agent. Please try again."
        );
      } finally {
        setIsUpdatingAgent(null);
      }
    },
    [agents, mutateAgents]
  );

  // Handle agent configuration
  const handleConfigureAgent = useCallback((agent: Agent) => {
    toast.info(`Opening configuration for ${agent.name}...`);
    // TODO: Navigate to agent configuration or open modal
  }, []);

  // Handle retry
  const handleRetry = useCallback(() => {
    mutateAgents();
    mutateActivity();
  }, [mutateAgents, mutateActivity]);

  // Update selected agent when agent data changes
  useEffect(() => {
    if (selectedAgent) {
      const updatedAgent = agents.find((a) => a.id === selectedAgent.id);
      if (updatedAgent) {
        setSelectedAgent(updatedAgent);
      }
    }
  }, [agents, selectedAgent?.id]);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <Zap 
              className="w-7 h-7"
              style={{
                stroke: 'url(#icon-gradient)',
                strokeWidth: 2,
                filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.15))'
              }}
            />
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <h1 
              className="text-2xl uppercase"
              style={{ 
                fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif',
                fontWeight: 700,
                letterSpacing: '0.25em',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.04)' 
              }}
            >
              My Agents
            </h1>
          </div>
          
          {/* Stats Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
              <Activity className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
              <span className="font-semibold">{stats.activeAgents}</span>
              <span className="ml-1 text-emerald-600/70 font-normal">Active</span>
            </Badge>
            <Badge className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
              <span className="font-semibold">{stats.totalTasks}</span>
              <span className="ml-1 text-blue-600/70 font-normal">Tasks</span>
            </Badge>
            <Badge className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-amber-600" />
              <span className="font-semibold">{stats.successRate}%</span>
              <span className="ml-1 text-amber-600/70 font-normal">Success</span>
            </Badge>
          </div>
        </div>

        {/* Tab Bar with Ask Neptune Button */}
        <div className="mt-14 relative flex items-center justify-center">
          <AgentTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            counts={{
              activity: activities.length,
              messages: agents.reduce(
                (acc, a) => acc + (a.unreadMessages || 0),
                0
              ),
            }}
          />
          <div className="absolute right-0">
            <Button
              size="sm"
              onClick={() => setShowNeptune(!showNeptune)}
              className="bg-white hover:bg-white text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-px hover:shadow-lg active:scale-[0.98] active:shadow-sm border border-gray-200 transition-all duration-150 gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Neptune
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={cn(
        "flex flex-1 overflow-hidden gap-6",
        showNeptune && activeTab === "laboratory" 
          ? "pl-6 pt-6 pb-6" 
          : "p-6"
      )}>
        {activeTab === "laboratory" ? (
          // Laboratory tab with optional Neptune
          <>
            <Card className="flex-1 rounded-2xl shadow-sm border bg-card overflow-visible transition-all">
              <AgentLaboratoryTab neptuneOpen={showNeptune} />
            </Card>
            
            {/* Neptune Panel for Laboratory */}
            <AnimatePresence>
              {showNeptune && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '28%', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col relative z-40"
                >
                  <Card className="flex flex-col h-full rounded-l-2xl shadow-sm border border-r-0 bg-card overflow-hidden">
                    <NeptuneAssistPanel
                      conversationId={null}
                      conversation={null}
                    />
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          <>
            {/* Left Panel - Agent List */}
            <Card className={cn(
              "flex flex-col rounded-2xl shadow-sm border bg-card overflow-hidden transition-all",
              showNeptune ? "w-[22%] min-w-[240px]" : "w-[30%] min-w-[280px] max-w-[360px]"
            )}>
              <AgentList
                agents={agents}
                selectedAgentId={selectedAgent?.id || null}
                onSelectAgent={setSelectedAgent}
                isLoading={isLoadingAgents}
                error={!!agentsError}
                onRetry={handleRetry}
                showMessageBadge={activeTab === "messages"}
              />
            </Card>

            {/* Center Panel - Content based on active tab */}
            <Card className="flex flex-col flex-1 rounded-2xl shadow-sm border bg-card overflow-hidden transition-all">
              {activeTab === "activity" ? (
                <AgentActivityPanel
                  selectedAgent={selectedAgent}
                  activities={activities}
                  isLoading={isLoadingActivity}
                  error={!!activityError}
                  onRetry={handleRetry}
                  onPauseAgent={handlePauseAgent}
                  onConfigureAgent={handleConfigureAgent}
                  isPausing={isUpdatingAgent !== null}
                />
              ) : activeTab === "messages" ? (
                <AgentMessagesTab
                  selectedAgent={selectedAgent}
                  onSelectAgent={setSelectedAgent}
                  onConfigureAgent={handleConfigureAgent}
                />
              ) : null}
            </Card>

            {/* Right Panel - Neptune AI (Toggleable) */}
            <AnimatePresence>
              {showNeptune && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '28%', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col relative z-40"
                >
                  <Card className="flex flex-col h-full rounded-l-2xl shadow-sm border border-r-0 bg-card overflow-hidden">
                    <NeptuneAssistPanel
                      conversationId={null}
                      conversation={null}
                    />
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
