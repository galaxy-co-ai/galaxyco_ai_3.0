"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Building2,
  Users,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Bot,
  Zap,
  ChevronRight,
  BarChart3,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import type {
  DepartmentMetrics,
  TeamAutonomyStats,
  TeamAutonomyLevel,
} from "@/lib/orchestration/types";

// ============================================================================
// TYPES
// ============================================================================

interface DepartmentDashboardProps {
  department?: string;
  onTeamClick?: (teamId: string) => void;
  onViewApprovals?: (teamId?: string) => void;
}

interface MetricsResponse {
  summary: {
    totalTeams: number;
    totalPendingApprovals: number;
    totalActionsToday: number;
    autonomyDistribution: {
      supervised: number;
      semiAutonomous: number;
      autonomous: number;
    };
  };
  departmentMetrics: DepartmentMetrics[];
  teamStats: TeamAutonomyStats[];
}

// ============================================================================
// DEPARTMENT CONFIG
// ============================================================================

const departmentConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  sales: {
    label: "Sales",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  marketing: {
    label: "Marketing",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    icon: <Sparkles className="h-4 w-4" />,
  },
  support: {
    label: "Support",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    icon: <Users className="h-4 w-4" />,
  },
  operations: {
    label: "Operations",
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    icon: <Activity className="h-4 w-4" />,
  },
  finance: {
    label: "Finance",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  product: {
    label: "Product",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    icon: <Zap className="h-4 w-4" />,
  },
  general: {
    label: "General",
    color: "text-gray-400",
    bgColor: "bg-gray-500/20",
    icon: <Building2 className="h-4 w-4" />,
  },
};

const autonomyLevelConfig: Record<
  TeamAutonomyLevel,
  { label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  supervised: {
    label: "Supervised",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    icon: <Eye className="h-4 w-4" />,
  },
  semi_autonomous: {
    label: "Semi-Autonomous",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    icon: <Shield className="h-4 w-4" />,
  },
  autonomous: {
    label: "Autonomous",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
};

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ============================================================================
// DEPARTMENT DASHBOARD COMPONENT
// ============================================================================

export default function DepartmentDashboard({
  department,
  onTeamClick,
  onViewApprovals,
}: DepartmentDashboardProps) {
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(
    new Set()
  );

  // Build query URL
  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (department) params.set("department", department);
    return `/api/orchestration/metrics?${params.toString()}`;
  }, [department]);

  // Fetch metrics
  const { data, error, mutate, isLoading } = useSWR<MetricsResponse>(
    queryUrl,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  const summary = data?.summary;
  const departmentMetrics = data?.departmentMetrics || [];
  const teamStats = data?.teamStats || [];

  // Group teams by department
  const teamsByDepartment = useMemo(() => {
    const grouped: Record<string, TeamAutonomyStats[]> = {};
    
    // Get unique departments from metrics
    departmentMetrics.forEach((metric) => {
      if (!grouped[metric.department]) {
        grouped[metric.department] = [];
      }
    });

    // Add teams to their departments (would need to cross-reference)
    // For now, just use the teamStats directly
    teamStats.forEach((team) => {
      // Teams don't have department info directly, would need to fetch
      // For demo, we'll just show all teams
      if (!grouped['all']) {
        grouped['all'] = [];
      }
      grouped['all'].push(team);
    });

    return grouped;
  }, [departmentMetrics, teamStats]);

  // Toggle department expansion
  const toggleDepartment = (dept: string) => {
    setExpandedDepartments((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) {
        next.delete(dept);
      } else {
        next.add(dept);
      }
      return next;
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="p-6 bg-gray-900/50 border-white/10">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="font-medium text-white mb-2">Failed to Load Metrics</h3>
          <p className="text-gray-400 text-sm mb-4">
            Unable to fetch department metrics
          </p>
          <Button
            variant="outline"
            onClick={() => mutate()}
            className="border-gray-600"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Building2 className="h-5 w-5 text-violet-400" />
            {department
              ? `${departmentConfig[department]?.label || department} Dashboard`
              : "Department Dashboard"}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Monitor autonomous operations across your organization
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => mutate()}
          className="text-gray-400 hover:text-white"
          aria-label="Refresh metrics"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Teams */}
          <Card className="p-4 bg-gray-900/50 border-white/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Teams</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {summary.totalTeams}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-violet-500/20">
                <Users className="h-5 w-5 text-violet-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-green-400">
                {summary.autonomyDistribution.autonomous} autonomous
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-blue-400">
                {summary.autonomyDistribution.semiAutonomous} semi
              </span>
              <span className="text-gray-600">•</span>
              <span className="text-yellow-400">
                {summary.autonomyDistribution.supervised} supervised
              </span>
            </div>
          </Card>

          {/* Pending Approvals */}
          <Card
            className={cn(
              "p-4 bg-gray-900/50 border-white/10 cursor-pointer transition-all hover:border-yellow-500/30",
              summary.totalPendingApprovals > 0 && "ring-1 ring-yellow-500/30"
            )}
            onClick={() => onViewApprovals?.()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onViewApprovals?.()}
            aria-label="View pending approvals"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending Approvals</p>
                <p
                  className={cn(
                    "text-2xl font-bold mt-1",
                    summary.totalPendingApprovals > 0
                      ? "text-yellow-400"
                      : "text-white"
                  )}
                >
                  {summary.totalPendingApprovals}
                </p>
              </div>
              <div
                className={cn(
                  "p-2 rounded-lg",
                  summary.totalPendingApprovals > 0
                    ? "bg-yellow-500/20"
                    : "bg-gray-500/20"
                )}
              >
                <Clock
                  className={cn(
                    "h-5 w-5",
                    summary.totalPendingApprovals > 0
                      ? "text-yellow-400"
                      : "text-gray-400"
                  )}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
              <ChevronRight className="h-3 w-3" />
              Click to view approval queue
            </div>
          </Card>

          {/* Actions Today */}
          <Card className="p-4 bg-gray-900/50 border-white/10">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-400">Actions Today</p>
                <p className="text-2xl font-bold text-white mt-1">
                  {summary.totalActionsToday}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/20">
                <Activity className="h-5 w-5 text-green-400" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
              <TrendingUp className="h-3 w-3 text-green-400" />
              <span className="text-green-400">Active</span>
              <span>autonomous operations</span>
            </div>
          </Card>

          {/* Autonomy Distribution */}
          <Card className="p-4 bg-gray-900/50 border-white/10">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-gray-400">Autonomy Level</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-gray-400 flex-1">Autonomous</span>
                <span className="text-xs text-white font-medium">
                  {summary.autonomyDistribution.autonomous}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-xs text-gray-400 flex-1">Semi-Auto</span>
                <span className="text-xs text-white font-medium">
                  {summary.autonomyDistribution.semiAutonomous}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <span className="text-xs text-gray-400 flex-1">Supervised</span>
                <span className="text-xs text-white font-medium">
                  {summary.autonomyDistribution.supervised}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Department Metrics */}
      {departmentMetrics.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-white">Department Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentMetrics.map((metric) => {
              const config = departmentConfig[metric.department] || departmentConfig.general;
              const isExpanded = expandedDepartments.has(metric.department);

              return (
                <Card
                  key={metric.department}
                  className="bg-gray-900/50 border-white/10 overflow-hidden"
                >
                  {/* Department Header */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => toggleDepartment(metric.department)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" && toggleDepartment(metric.department)
                    }
                    aria-expanded={isExpanded}
                    aria-label={`${config.label} department details`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", config.bgColor)}>
                          <span className={config.color}>{config.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-white">
                            {config.label}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {metric.teamCount} teams • {metric.activeTeams} active
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-5 w-5 text-gray-500 transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">
                          {metric.totalActions}
                        </p>
                        <p className="text-xs text-gray-500">Actions</p>
                      </div>
                      <div className="text-center">
                        <p
                          className={cn(
                            "text-lg font-bold",
                            metric.pendingApprovals > 0
                              ? "text-yellow-400"
                              : "text-white"
                          )}
                        >
                          {metric.pendingApprovals}
                        </p>
                        <p className="text-xs text-gray-500">Pending</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">
                          {Math.round(metric.successRate)}%
                        </p>
                        <p className="text-xs text-gray-500">Success</p>
                      </div>
                    </div>

                    {/* Success Rate Bar */}
                    <div className="mt-3">
                      <Progress
                        value={metric.successRate}
                        className="h-1.5"
                        aria-label={`${config.label} success rate`}
                      />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-3">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Auto-Approved</span>
                          <span className="text-green-400">
                            {metric.autoApprovedActions}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Manually Approved</span>
                          <span className="text-blue-400">
                            {metric.manuallyApprovedActions}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Rejected</span>
                          <span className="text-red-400">
                            {metric.rejectedActions}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Avg Response</span>
                          <span className="text-white">
                            {metric.avgResponseTimeMs > 0
                              ? `${Math.round(metric.avgResponseTimeMs)}ms`
                              : "N/A"}
                          </span>
                        </div>
                      </div>

                      {metric.pendingApprovals > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewApprovals?.(metric.department)}
                          className="w-full mt-3 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          View {metric.pendingApprovals} Pending
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Team Autonomy Stats */}
      {teamStats.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium text-white">Team Autonomy Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamStats.map((team) => {
              const autonomyConfig = autonomyLevelConfig[team.autonomyLevel];

              return (
                <Card
                  key={team.teamId}
                  className={cn(
                    "p-4 bg-gray-900/50 border-white/10 cursor-pointer transition-all hover:border-violet-500/30",
                    team.awaitingApproval > 0 && "ring-1 ring-yellow-500/20"
                  )}
                  onClick={() => onTeamClick?.(team.teamId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) =>
                    e.key === "Enter" && onTeamClick?.(team.teamId)
                  }
                  aria-label={`View ${team.teamName} team details`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", autonomyConfig.bgColor)}>
                        <span className={autonomyConfig.color}>
                          {autonomyConfig.icon}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-white flex items-center gap-2">
                          {team.teamName}
                          <Badge
                            className={cn(
                              autonomyConfig.bgColor,
                              autonomyConfig.color,
                              "border-0 text-xs"
                            )}
                          >
                            {autonomyConfig.label}
                          </Badge>
                        </h4>
                        {team.lastActionAt && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            Last active{" "}
                            {formatDistanceToNow(new Date(team.lastActionAt), {
                              addSuffix: true,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-500" />
                  </div>

                  {/* Stats Grid */}
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    <div className="text-center p-2 rounded bg-gray-800/50">
                      <p className="text-sm font-bold text-white">
                        {team.totalActions}
                      </p>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div className="text-center p-2 rounded bg-green-500/10">
                      <p className="text-sm font-bold text-green-400">
                        {team.autoExecuted}
                      </p>
                      <p className="text-xs text-gray-500">Auto</p>
                    </div>
                    <div
                      className={cn(
                        "text-center p-2 rounded",
                        team.awaitingApproval > 0
                          ? "bg-yellow-500/10"
                          : "bg-gray-800/50"
                      )}
                    >
                      <p
                        className={cn(
                          "text-sm font-bold",
                          team.awaitingApproval > 0
                            ? "text-yellow-400"
                            : "text-gray-400"
                        )}
                      >
                        {team.awaitingApproval}
                      </p>
                      <p className="text-xs text-gray-500">Pending</p>
                    </div>
                    <div className="text-center p-2 rounded bg-gray-800/50">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-sm font-bold text-green-400">
                          {team.approvedToday}
                        </span>
                        <span className="text-gray-600">/</span>
                        <span className="text-sm font-bold text-red-400">
                          {team.rejectedToday}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Today</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!summary && departmentMetrics.length === 0 && teamStats.length === 0 && (
        <Card className="p-8 bg-gray-900/50 border-white/10 text-center">
          <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <h3 className="font-medium text-white mb-2">No Data Available</h3>
          <p className="text-gray-400 text-sm">
            Create teams and enable autonomous operations to see metrics here
          </p>
        </Card>
      )}
    </div>
  );
}

