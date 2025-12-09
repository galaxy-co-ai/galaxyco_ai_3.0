"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  UsersRound,
  Activity,
  Filter,
  RefreshCw,
  ChevronLeft,
  Play,
  Pause,
  Trash2,
  Settings,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import TeamCreationWizard from "@/components/agents/TeamCreationWizard";
import type { AgentDepartment } from "@/lib/orchestration/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Department configuration
const departmentConfig: Record<
  string,
  { icon: string; label: string; color: string; bgColor: string }
> = {
  sales: { icon: "💰", label: "Sales", color: "text-emerald-600", bgColor: "bg-emerald-50" },
  marketing: { icon: "📢", label: "Marketing", color: "text-blue-600", bgColor: "bg-blue-50" },
  support: { icon: "🎧", label: "Support", color: "text-purple-600", bgColor: "bg-purple-50" },
  operations: { icon: "⚙️", label: "Operations", color: "text-amber-600", bgColor: "bg-amber-50" },
  finance: { icon: "💳", label: "Finance", color: "text-teal-600", bgColor: "bg-teal-50" },
  product: { icon: "🚀", label: "Product", color: "text-indigo-600", bgColor: "bg-indigo-50" },
  general: { icon: "🤖", label: "General", color: "text-gray-600", bgColor: "bg-gray-50" },
};

// Status configuration
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: "Active", color: "text-green-600", bgColor: "bg-green-500/20" },
  paused: { label: "Paused", color: "text-yellow-600", bgColor: "bg-yellow-500/20" },
  archived: { label: "Archived", color: "text-gray-500", bgColor: "bg-gray-500/20" },
};

interface Team {
  id: string;
  name: string;
  department: string;
  description: string | null;
  status: string;
  memberCount: number;
  config: unknown;
  createdAt: Date;
  totalExecutions?: number;
  successfulExecutions?: number;
}

interface TeamsListClientProps {
  workspaceId: string;
  initialTeams: Team[];
  initialAgents: Array<{ id: string; name: string; type: string; status: string }>;
}

export default function TeamsListClient({
  workspaceId,
  initialTeams,
  initialAgents,
}: TeamsListClientProps) {
  const router = useRouter();
  const [showWizard, setShowWizard] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [processingTeams, setProcessingTeams] = useState<Set<string>>(new Set());

  // Fetch teams with SWR for real-time updates
  const { data: teamsData, mutate, isLoading } = useSWR(
    `/api/orchestration/teams`,
    fetcher,
    {
      fallbackData: { teams: initialTeams },
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  const teams = teamsData?.teams || initialTeams;

  // Filter teams
  const filteredTeams = useMemo(() => {
    return teams.filter((team: Team) => {
      const matchesSearch =
        !searchQuery ||
        team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment =
        departmentFilter === "all" || team.department === departmentFilter;
      return matchesSearch && matchesDepartment;
    });
  }, [teams, searchQuery, departmentFilter]);

  // Toggle team expansion
  const toggleExpand = useCallback((teamId: string) => {
    setExpandedTeams((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) {
        next.delete(teamId);
      } else {
        next.add(teamId);
      }
      return next;
    });
  }, []);

  // Run team with objective
  const runTeam = useCallback(
    async (teamId: string, objective: string) => {
      setProcessingTeams((prev) => new Set(prev).add(teamId));
      try {
        const response = await fetch(`/api/orchestration/teams/${teamId}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ objective }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to run team");
        }

        toast.success("Team execution started");
        mutate();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to run team"
        );
      } finally {
        setProcessingTeams((prev) => {
          const next = new Set(prev);
          next.delete(teamId);
          return next;
        });
      }
    },
    [mutate]
  );

  // Delete team
  const deleteTeam = useCallback(
    async (teamId: string) => {
      if (!confirm("Are you sure you want to delete this team?")) return;

      setProcessingTeams((prev) => new Set(prev).add(teamId));
      try {
        const response = await fetch(`/api/orchestration/teams/${teamId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete team");
        }

        toast.success("Team deleted");
        mutate();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete team"
        );
      } finally {
        setProcessingTeams((prev) => {
          const next = new Set(prev);
          next.delete(teamId);
          return next;
        });
      }
    },
    [mutate]
  );

  // Update team status
  const updateTeamStatus = useCallback(
    async (teamId: string, status: string) => {
      setProcessingTeams((prev) => new Set(prev).add(teamId));
      try {
        const response = await fetch(`/api/orchestration/teams/${teamId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update team");
        }

        toast.success(`Team ${status === "active" ? "activated" : "paused"}`);
        mutate();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to update team"
        );
      } finally {
        setProcessingTeams((prev) => {
          const next = new Set(prev);
          next.delete(teamId);
          return next;
        });
      }
    },
    [mutate]
  );

  // Handle team creation complete
  const handleTeamCreated = useCallback(
    (teamId: string) => {
      setShowWizard(false);
      mutate();
      router.push(`/orchestration/teams/${teamId}`);
    },
    [mutate, router]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="border-b border-white/5 bg-gray-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/orchestration">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                  aria-label="Back to orchestration dashboard"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                  <UsersRound className="h-8 w-8 text-blue-400" />
                  <span className="tracking-wide">
                    <span className="hidden sm:inline">A G E N T &nbsp; T E A M S</span>
                    <span className="sm:hidden">AGENT TEAMS</span>
                  </span>
                </h1>
                <p className="text-gray-400 mt-1 text-sm">
                  Create and manage AI agent teams for department automation
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowWizard(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              aria-label="Create new team"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Team
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Filters */}
        <Card className="p-4 bg-gray-900/50 border-white/10">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search teams..."
                className="pl-10 bg-gray-800 border-gray-700 text-white"
                aria-label="Search teams"
              />
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Filter by department"
              >
                <option value="all">All Departments</option>
                {Object.entries(departmentConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => mutate()}
              className="text-gray-400 hover:text-white"
              aria-label="Refresh teams list"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Teams Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredTeams.length === 0 ? (
          <Card className="p-12 bg-gray-900/50 border-white/10 text-center">
            <UsersRound className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Teams Found</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              {searchQuery || departmentFilter !== "all"
                ? "No teams match your search criteria. Try adjusting your filters."
                : "Create your first agent team to coordinate AI agents for department-level automation."}
            </p>
            <Button
              onClick={() => setShowWizard(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Team
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeams.map((team: Team) => {
              const dept = departmentConfig[team.department] || departmentConfig.general;
              const status = statusConfig[team.status] || statusConfig.active;
              const isExpanded = expandedTeams.has(team.id);
              const isProcessing = processingTeams.has(team.id);
              const config = team.config as { autonomyLevel?: string } | null;

              return (
                <Card
                  key={team.id}
                  className={cn(
                    "bg-gray-900/50 border-white/10 transition-all duration-200",
                    "hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5"
                  )}
                >
                  {/* Card Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "p-2 rounded-lg text-xl",
                            dept.bgColor
                          )}
                          aria-hidden="true"
                        >
                          {dept.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{team.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              className={cn(
                                dept.bgColor,
                                dept.color,
                                "border-0 text-xs"
                              )}
                            >
                              {dept.label}
                            </Badge>
                            <Badge
                              className={cn(
                                status.bgColor,
                                status.color,
                                "border-0 text-xs"
                              )}
                            >
                              {status.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(team.id)}
                        className="text-gray-400 hover:text-white"
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? "Collapse details" : "Expand details"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* Description */}
                    {team.description && (
                      <p className="text-sm text-gray-400 mt-3 line-clamp-2">
                        {team.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {team.memberCount} agents
                      </span>
                      {config?.autonomyLevel && (
                        <span className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          {config.autonomyLevel.replace("_", "-")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                      {/* Quick Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/orchestration/teams/${team.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-700 text-gray-300 hover:bg-gray-800"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Manage
                          </Button>
                        </Link>
                        {team.status === "active" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTeamStatus(team.id, "paused")}
                            disabled={isProcessing}
                            className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                          >
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTeamStatus(team.id, "active")}
                            disabled={isProcessing}
                            className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Activate
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runTeam(team.id, "Complete assigned tasks")}
                          disabled={isProcessing || team.status !== "active"}
                          className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Run
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteTeam(team.id)}
                          disabled={isProcessing}
                          className="text-red-400 hover:bg-red-500/10"
                          aria-label="Delete team"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* View Details Link */}
                      <Link
                        href={`/orchestration/teams/${team.id}`}
                        className="flex items-center text-sm text-blue-400 hover:text-blue-300"
                      >
                        View team details
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Team Stats Summary */}
        {teams.length > 0 && (
          <Card className="p-4 bg-gray-900/50 border-white/10">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-gray-400">Active:</span>
                <span className="text-white font-medium">
                  {teams.filter((t: Team) => t.status === "active").length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-gray-400">Paused:</span>
                <span className="text-white font-medium">
                  {teams.filter((t: Team) => t.status === "paused").length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="text-gray-400">Total:</span>
                <span className="text-white font-medium">{teams.length}</span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Team Creation Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <TeamCreationWizard
              onClose={() => setShowWizard(false)}
              onComplete={handleTeamCreated}
              existingAgents={initialAgents}
            />
          </div>
        </div>
      )}
    </div>
  );
}

