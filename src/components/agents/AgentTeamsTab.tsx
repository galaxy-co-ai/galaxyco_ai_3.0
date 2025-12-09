"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Users,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  RefreshCw,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import TeamCard, { type Team, type TeamMember } from "./TeamCard";
import TeamCreationWizard from "./TeamCreationWizard";
import TeamConfigModal from "./TeamConfigModal";
import type { AgentDepartment } from "@/lib/orchestration/types";

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// API response types
interface ApiTeam {
  id: string;
  name: string;
  department: AgentDepartment;
  description: string | null;
  status: string;
  totalExecutions: number;
  successfulExecutions: number;
  lastActiveAt: string | null;
  config: {
    autonomyLevel?: string;
    maxConcurrentTasks?: number;
  } | null;
  memberCount: number;
  members?: Array<{
    id: string;
    agentId: string;
    role: string;
    agent?: {
      name: string;
      status: string;
    };
  }>;
}

interface ApiAgent {
  id: string;
  name: string;
  type: string;
  status: string;
}

// Department filter options
const departmentFilters: Array<{ value: string; label: string; icon: string }> = [
  { value: "all", label: "All Teams", icon: "🔍" },
  { value: "sales", label: "Sales", icon: "💰" },
  { value: "marketing", label: "Marketing", icon: "📢" },
  { value: "support", label: "Support", icon: "🎧" },
  { value: "operations", label: "Operations", icon: "⚙️" },
];

// Transform API team to local format
function transformApiTeam(apiTeam: ApiTeam): Team {
  const members: TeamMember[] = (apiTeam.members || []).map((m) => ({
    id: m.id,
    agentId: m.agentId,
    agentName: m.agent?.name || "Unknown Agent",
    role: m.role as TeamMember["role"],
    status: m.agent?.status || "inactive",
  }));

  return {
    id: apiTeam.id,
    name: apiTeam.name,
    department: apiTeam.department,
    description: apiTeam.description || undefined,
    status: apiTeam.status as Team["status"],
    memberCount: apiTeam.memberCount,
    members,
    totalExecutions: apiTeam.totalExecutions,
    successfulExecutions: apiTeam.successfulExecutions,
    lastActiveAt: apiTeam.lastActiveAt ? new Date(apiTeam.lastActiveAt) : undefined,
    config: apiTeam.config || undefined,
  };
}

interface AgentTeamsTabProps {
  neptuneOpen?: boolean;
}

export default function AgentTeamsTab({ neptuneOpen = false }: AgentTeamsTabProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [showWizard, setShowWizard] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configTeamId, setConfigTeamId] = useState<string | null>(null);
  const [runningTeams, setRunningTeams] = useState<Set<string>>(new Set());
  const [objectiveInput, setObjectiveInput] = useState("");

  // Fetch teams
  const {
    data: teamsData,
    error: teamsError,
    mutate: mutateTeams,
    isLoading: isLoadingTeams,
  } = useSWR<{ teams: ApiTeam[] }>("/api/orchestration/teams?includeMembers=true", fetcher, {
    refreshInterval: 30000,
  });

  // Fetch agents (for wizard)
  const { data: agentsData } = useSWR<{ agents: ApiAgent[] }>("/api/agents", fetcher);

  // Transform data
  const teams: Team[] = (teamsData?.teams || []).map(transformApiTeam);
  const existingAgents =
    agentsData?.agents?.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
    })) || [];

  // Filter teams
  const filteredTeams = teams.filter((team) => {
    const matchesSearch =
      searchQuery === "" ||
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment =
      departmentFilter === "all" || team.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  // Stats
  const stats = {
    total: teams.length,
    active: teams.filter((t) => t.status === "active").length,
    totalExecutions: teams.reduce((sum, t) => sum + t.totalExecutions, 0),
    avgSuccessRate:
      teams.length > 0
        ? Math.round(
            teams.reduce((sum, t) => {
              if (t.totalExecutions === 0) return sum;
              return sum + (t.successfulExecutions / t.totalExecutions) * 100;
            }, 0) /
              teams.filter((t) => t.totalExecutions > 0).length || 0
          )
        : 0,
  };

  // Selected team
  const selectedTeam = selectedTeamId
    ? teams.find((t) => t.id === selectedTeamId)
    : null;

  // Handlers
  const handleSelectTeam = useCallback((team: Team) => {
    setSelectedTeamId(team.id);
    setObjectiveInput("");
  }, []);

  const handleRunTeam = useCallback(
    async (teamId: string, objective?: string) => {
      if (!objective) {
        toast.error("Please enter an objective for the team");
        return;
      }

      setRunningTeams((prev) => new Set(prev).add(teamId));

      try {
        const response = await fetch(`/api/orchestration/teams/${teamId}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ objective }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to run team");
        }

        const result = await response.json();
        toast.success(`Team started! ${result.agentsInvolved?.length || 0} agents involved.`);
        mutateTeams();
      } catch (error) {
        logger.error("Failed to run team", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to run team. Please try again."
        );
      } finally {
        setRunningTeams((prev) => {
          const next = new Set(prev);
          next.delete(teamId);
          return next;
        });
      }
    },
    [mutateTeams]
  );

  const handlePauseTeam = useCallback(
    async (teamId: string) => {
      try {
        const response = await fetch(`/api/orchestration/teams/${teamId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "paused" }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to pause team");
        }

        toast.success("Team paused");
        mutateTeams();
      } catch (error) {
        logger.error("Failed to pause team", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to pause team. Please try again."
        );
      }
    },
    [mutateTeams]
  );

  const handleDeleteTeam = useCallback(
    async (teamId: string) => {
      if (!confirm("Are you sure you want to delete this team?")) {
        return;
      }

      try {
        const response = await fetch(`/api/orchestration/teams/${teamId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete team");
        }

        if (selectedTeamId === teamId) {
          setSelectedTeamId(null);
        }

        toast.success("Team deleted");
        mutateTeams();
      } catch (error) {
        logger.error("Failed to delete team", error);
        toast.error(
          error instanceof Error ? error.message : "Failed to delete team. Please try again."
        );
      }
    },
    [selectedTeamId, mutateTeams]
  );

  const handleConfigureTeam = useCallback((teamId: string) => {
    setConfigTeamId(teamId);
    setShowConfigModal(true);
  }, []);

  const handleWizardComplete = useCallback(
    (teamId: string) => {
      setShowWizard(false);
      setSelectedTeamId(teamId);
      mutateTeams();
    },
    [mutateTeams]
  );

  // Loading state
  if (isLoadingTeams && !teamsData) {
    return (
      <div className="h-full flex flex-col p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (teamsError) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="font-semibold text-lg">Failed to load teams</h3>
        <p className="text-sm text-gray-500 mb-4">Please try again</p>
        <Button onClick={() => mutateTeams()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Agent Teams</h2>
              <p className="text-sm text-gray-500">
                Coordinate agents for department automation
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowWizard(true)}
            className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            <Plus className="h-4 w-4" />
            Create Team
          </Button>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            {stats.active} Active
          </Badge>
          <Badge
            variant="outline"
            className="px-3 py-1.5 bg-blue-50 text-blue-700 border-blue-200"
          >
            <Users className="h-3.5 w-3.5 mr-1.5" />
            {stats.total} Teams
          </Badge>
          <Badge
            variant="outline"
            className="px-3 py-1.5 bg-purple-50 text-purple-700 border-purple-200"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            {stats.avgSuccessRate}% Success
          </Badge>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teams..."
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            {departmentFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setDepartmentFilter(filter.value)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  departmentFilter === filter.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
                aria-label={`Filter by ${filter.label}`}
              >
                {filter.icon}
                <span className="ml-1 hidden sm:inline">{filter.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Teams List */}
        <div
          className={cn(
            "overflow-y-auto p-4 transition-all",
            selectedTeam ? "w-1/2 border-r" : "w-full"
          )}
        >
          {filteredTeams.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">No teams found</h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchQuery || departmentFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first team to get started"}
              </p>
              {!searchQuery && departmentFilter === "all" && (
                <Button onClick={() => setShowWizard(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Team
                </Button>
              )}
            </div>
          ) : (
            <div className={cn("grid gap-4", selectedTeam ? "grid-cols-1" : "grid-cols-2")}>
              {filteredTeams.map((team) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  isSelected={team.id === selectedTeamId}
                  onClick={() => handleSelectTeam(team)}
                  onRun={(id) => {
                    setSelectedTeamId(id);
                    // Focus on objective input
                  }}
                  onPause={handlePauseTeam}
                  onConfigure={handleConfigureTeam}
                  onDelete={handleDeleteTeam}
                  isRunning={runningTeams.has(team.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Selected Team Detail Panel */}
        {selectedTeam && (
          <div className="w-1/2 overflow-y-auto p-4">
            <Card className="p-4 space-y-4">
              {/* Team Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{selectedTeam.name}</h3>
                  <p className="text-sm text-gray-500">{selectedTeam.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTeamId(null)}
                  aria-label="Close detail panel"
                >
                  ✕
                </Button>
              </div>

              {/* Run Team */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Run Team with Objective
                </label>
                <div className="flex gap-2">
                  <Input
                    value={objectiveInput}
                    onChange={(e) => setObjectiveInput(e.target.value)}
                    placeholder="e.g., Follow up with all stalled deals"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && objectiveInput.trim()) {
                        handleRunTeam(selectedTeam.id, objectiveInput);
                      }
                    }}
                  />
                  <Button
                    onClick={() => handleRunTeam(selectedTeam.id, objectiveInput)}
                    disabled={!objectiveInput.trim() || runningTeams.has(selectedTeam.id)}
                    className="gap-2"
                  >
                    {runningTeams.has(selectedTeam.id) ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Running
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Run
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Describe what you want the team to accomplish
                </p>
              </div>

              {/* Team Members */}
              {selectedTeam.members && selectedTeam.members.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Team Members ({selectedTeam.members.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedTeam.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{member.agentName}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {member.role}
                          </Badge>
                        </div>
                        <Badge
                          variant={member.status === "active" ? "default" : "secondary"}
                          className={cn(
                            "text-xs",
                            member.status === "active" && "bg-emerald-500"
                          )}
                        >
                          {member.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Team Stats */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedTeam.totalExecutions}
                  </div>
                  <div className="text-xs text-gray-500">Total Runs</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-600">
                    {selectedTeam.totalExecutions > 0
                      ? Math.round(
                          (selectedTeam.successfulExecutions /
                            selectedTeam.totalExecutions) *
                            100
                        )
                      : 0}
                    %
                  </div>
                  <div className="text-xs text-gray-500">Success Rate</div>
                </div>
              </div>

              {/* Configuration */}
              {selectedTeam.config && (
                <div className="pt-2 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Configuration</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Autonomy Level</span>
                      <span className="capitalize">
                        {selectedTeam.config.autonomyLevel?.replace("_", " ") || "Not set"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Max Concurrent Tasks</span>
                      <span>{selectedTeam.config.maxConcurrentTasks || "Unlimited"}</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>

      {/* Creation Wizard Modal */}
      {showWizard && (
        <TeamCreationWizard
          onClose={() => setShowWizard(false)}
          onComplete={handleWizardComplete}
          existingAgents={existingAgents}
        />
      )}

      {/* Team Configuration Modal */}
      <TeamConfigModal
        open={showConfigModal}
        onOpenChange={setShowConfigModal}
        teamId={configTeamId}
        onSuccess={() => {
          mutateTeams();
          setConfigTeamId(null);
        }}
      />
    </div>
  );
}

