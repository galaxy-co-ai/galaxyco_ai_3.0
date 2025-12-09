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
  AlertTriangle,
  TrendingUp,
  RefreshCw,
  Shield,
  ShieldCheck,
  Zap,
  ChevronRight,
  BarChart3,
  Eye,
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
// DEPARTMENT CONFIG - Light Theme
// ============================================================================

const departmentConfig: Record<
  string,
  { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }
> = {
  sales: {
    label: "Sales",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: <TrendingUp className="h-4 w-4" />,
  },
  marketing: {
    label: "Marketing",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    icon: <Sparkles className="h-4 w-4" />,
  },
  support: {
    label: "Support",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: <Users className="h-4 w-4" />,
  },
  operations: {
    label: "Operations",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    icon: <Activity className="h-4 w-4" />,
  },
  finance: {
    label: "Finance",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
    icon: <BarChart3 className="h-4 w-4" />,
  },
  product: {
    label: "Product",
    color: "text-cyan-700",
    bgColor: "bg-cyan-50",
    borderColor: "border-cyan-200",
    icon: <Zap className="h-4 w-4" />,
  },
  general: {
    label: "General",
    color: "text-gray-700",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    icon: <Building2 className="h-4 w-4" />,
  },
};

const autonomyLevelConfig: Record<
  TeamAutonomyLevel,
  { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }
> = {
  supervised: {
    label: "Supervised",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    icon: <Eye className="h-4 w-4" />,
  },
  semi_autonomous: {
    label: "Semi-Autonomous",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: <Shield className="h-4 w-4" />,
  },
  autonomous: {
    label: "Autonomous",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
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
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  const summary = data?.summary;
  const departmentMetrics = data?.departmentMetrics || [];
  const teamStats = data?.teamStats || [];

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
      <Card className="p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="font-medium mb-2">Failed to Load Metrics</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Unable to fetch department metrics
          </p>
          <Button
            variant="outline"
            onClick={() => mutate()}
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
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-violet-600" />
            {department
              ? `${departmentConfig[department]?.label || department} Dashboard`
              : "Department Dashboard"}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor autonomous operations across your organization
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => mutate()}
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
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Teams</p>
                <p className="text-2xl font-bold mt-1">
                  {summary.totalTeams}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-violet-100">
                <Users className="h-5 w-5 text-violet-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-green-600">
                {summary.autonomyDistribution.autonomous} autonomous
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-blue-600">
                {summary.autonomyDistribution.semiAutonomous} semi
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-yellow-600">
                {summary.autonomyDistribution.supervised} supervised
              </span>
            </div>
          </Card>

          {/* Pending Approvals */}
          <Card
            className={cn(
              "p-4 cursor-pointer transition-all hover:border-yellow-300",
              summary.totalPendingApprovals > 0 && "ring-1 ring-yellow-300"
            )}
            onClick={() => onViewApprovals?.()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onViewApprovals?.()}
            aria-label="View pending approvals"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
                <p
                  className={cn(
                    "text-2xl font-bold mt-1",
                    summary.totalPendingApprovals > 0
                      ? "text-yellow-600"
                      : ""
                  )}
                >
                  {summary.totalPendingApprovals}
                </p>
              </div>
              <div
                className={cn(
                  "p-2 rounded-lg",
                  summary.totalPendingApprovals > 0
                    ? "bg-yellow-100"
                    : "bg-gray-100"
                )}
              >
                <Clock
                  className={cn(
                    "h-5 w-5",
                    summary.totalPendingApprovals > 0
                      ? "text-yellow-600"
                      : "text-gray-500"
                  )}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <ChevronRight className="h-3 w-3" />
              Click to view approval queue
            </div>
          </Card>

          {/* Actions Today */}
          <Card className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actions Today</p>
                <p className="text-2xl font-bold mt-1">
                  {summary.totalActionsToday}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-100">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600" />
              <span className="text-green-600">Active</span>
              <span>autonomous operations</span>
            </div>
          </Card>

          {/* Autonomy Distribution */}
          <Card className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-muted-foreground">Autonomy Level</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground flex-1">Autonomous</span>
                <span className="text-xs font-medium">
                  {summary.autonomyDistribution.autonomous}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs text-muted-foreground flex-1">Semi-Auto</span>
                <span className="text-xs font-medium">
                  {summary.autonomyDistribution.semiAutonomous}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-xs text-muted-foreground flex-1">Supervised</span>
                <span className="text-xs font-medium">
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
          <h3 className="font-medium">Department Performance</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentMetrics.map((metric) => {
              const config = departmentConfig[metric.department] || departmentConfig.general;
              const isExpanded = expandedDepartments.has(metric.department);

              return (
                <Card
                  key={metric.department}
                  className="overflow-hidden"
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
                          <h4 className="font-medium">
                            {config.label}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {metric.teamCount} teams • {metric.activeTeams} active
                          </p>
                        </div>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-5 w-5 text-muted-foreground transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div className="text-center">
                        <p className="text-lg font-bold">
                          {metric.totalActions}
                        </p>
                        <p className="text-xs text-muted-foreground">Actions</p>
                      </div>
                      <div className="text-center">
                        <p
                          className={cn(
                            "text-lg font-bold",
                            metric.pendingApprovals > 0
                              ? "text-yellow-600"
                              : ""
                          )}
                        >
                          {metric.pendingApprovals}
                        </p>
                        <p className="text-xs text-muted-foreground">Pending</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">
                          {Math.round(metric.successRate)}%
                        </p>
                        <p className="text-xs text-muted-foreground">Success</p>
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
                    <div className="px-4 pb-4 border-t pt-3">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Auto-Approved</span>
                          <span className="text-green-600">
                            {metric.autoApprovedActions}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Manually Approved</span>
                          <span className="text-blue-600">
                            {metric.manuallyApprovedActions}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Rejected</span>
                          <span className="text-red-600">
                            {metric.rejectedActions}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Avg Response</span>
                          <span>
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
                          className="w-full mt-3 border-yellow-300 text-yellow-700 hover:bg-yellow-50"
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
          <h3 className="font-medium">Team Autonomy Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamStats.map((team) => {
              const autonomyConfig = autonomyLevelConfig[team.autonomyLevel];

              return (
                <Card
                  key={team.teamId}
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:border-violet-300",
                    team.awaitingApproval > 0 && "ring-1 ring-yellow-200"
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
                        <h4 className="font-medium flex items-center gap-2">
                          {team.teamName}
                          <Badge
                            className={cn(
                              autonomyConfig.bgColor,
                              autonomyConfig.color,
                              "border",
                              autonomyConfig.borderColor,
                              "text-xs"
                            )}
                          >
                            {autonomyConfig.label}
                          </Badge>
                        </h4>
                        {team.lastActionAt && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Last active{" "}
                            {formatDistanceToNow(new Date(team.lastActionAt), {
                              addSuffix: true,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Stats Grid */}
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    <div className="text-center p-2 rounded bg-gray-50">
                      <p className="text-sm font-bold">
                        {team.totalActions}
                      </p>
                      <p className="text-xs text-muted-foreground">Total</p>
                    </div>
                    <div className="text-center p-2 rounded bg-green-50">
                      <p className="text-sm font-bold text-green-700">
                        {team.autoExecuted}
                      </p>
                      <p className="text-xs text-muted-foreground">Auto</p>
                    </div>
                    <div
                      className={cn(
                        "text-center p-2 rounded",
                        team.awaitingApproval > 0
                          ? "bg-yellow-50"
                          : "bg-gray-50"
                      )}
                    >
                      <p
                        className={cn(
                          "text-sm font-bold",
                          team.awaitingApproval > 0
                            ? "text-yellow-700"
                            : "text-gray-500"
                        )}
                      >
                        {team.awaitingApproval}
                      </p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                    <div className="text-center p-2 rounded bg-gray-50">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-sm font-bold text-green-700">
                          {team.approvedToday}
                        </span>
                        <span className="text-gray-400">/</span>
                        <span className="text-sm font-bold text-red-600">
                          {team.rejectedToday}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Today</p>
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
        <Card className="p-8 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium mb-2">No Data Available</h3>
          <p className="text-muted-foreground text-sm">
            Create teams and enable autonomous operations to see metrics here
          </p>
        </Card>
      )}
    </div>
  );
}
