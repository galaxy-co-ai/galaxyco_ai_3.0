"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Bot,
  Mail,
  FileText,
  Calendar,
  Target,
  Database,
  Zap,
  Code,
  Shield,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Execution {
  id: string;
  agentId: string;
  agentName: string;
  agentType: string;
  agentDescription?: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  durationMs?: number;
  tokensUsed?: number;
  cost?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  triggeredBy?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ActivityResponse {
  executions: Execution[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  stats: {
    total: number;
    success: number;
    failed: number;
    running: number;
    pending: number;
    successRate: number;
    avgDurationMs: number;
    totalCostCents: number;
  };
}

// Map agent types to icons
const agentTypeIcons: Record<string, typeof Mail> = {
  email: Mail,
  call: FileText,
  task: CheckCircle2,
  calendar: Calendar,
  scope: Target,
  note: FileText,
  roadmap: Calendar,
  content: FileText,
  custom: Bot,
  browser: Database,
  "cross-app": Zap,
  knowledge: Database,
  sales: Target,
  trending: Zap,
  research: FileText,
  meeting: Calendar,
  code: Code,
  data: Database,
  security: Shield,
};

// Map status to colors
const statusConfig = {
  completed: {
    color: "bg-green-500/10 text-green-600 border-green-500/20",
    icon: CheckCircle2,
    label: "Completed",
  },
  running: {
    color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    icon: RefreshCw,
    label: "Running",
  },
  pending: {
    color: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    icon: Clock,
    label: "Pending",
  },
  failed: {
    color: "bg-red-500/10 text-red-600 border-red-500/20",
    icon: XCircle,
    label: "Failed",
  },
  cancelled: {
    color: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    icon: XCircle,
    label: "Cancelled",
  },
};

export default function ActivityPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Build query params
  const params = new URLSearchParams();
  params.set("limit", "50");
  if (statusFilter !== "all") params.set("status", statusFilter);
  if (searchQuery) params.set("search", searchQuery);

  const { data, error, isLoading, mutate } = useSWR<ActivityResponse>(
    `/api/activity?${params.toString()}`,
    fetcher,
    { refreshInterval: 10000 }
  );

  const executions = data?.executions || [];
  const stats = data?.stats;

  // Stat badges
  const statBadges = [
    {
      label: `${stats?.total || 0} Total`,
      icon: Activity,
      color: "bg-blue-100 text-blue-700",
    },
    {
      label: `${stats?.success || 0} Success`,
      icon: CheckCircle2,
      color: "bg-green-100 text-green-700",
    },
    {
      label: `${stats?.failed || 0} Failed`,
      icon: AlertCircle,
      color: "bg-red-100 text-red-700",
    },
    {
      label: `${stats?.successRate || 0}% Rate`,
      icon: Target,
      color: "bg-purple-100 text-purple-700",
    },
  ];

  return (
    <div className="h-full bg-gray-50/50 overflow-hidden flex flex-col">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto w-full px-6 py-4 space-y-4">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" />
            Activity Log
          </h1>
          <p className="text-muted-foreground text-base">
            Monitor agent executions and track automation performance.
          </p>

          {/* Stat Badges */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {statBadges.map((stat, index) => (
              <Badge
                key={index}
                className={`${stat.color} px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2`}
              >
                <stat.icon className="h-4 w-4" aria-hidden="true" />
                {stat.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row justify-center gap-4">
          {/* Status Filter */}
          <Tabs
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="w-full md:w-auto"
          >
            <TabsList className="bg-background/80 backdrop-blur-lg rounded-full shadow-sm p-1">
              {["all", "completed", "running", "pending", "failed"].map(
                (status) => (
                  <TabsTrigger
                    key={status}
                    value={status}
                    className="rounded-full px-4 py-1.5 text-sm data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </TabsTrigger>
                )
              )}
            </TabsList>
          </Tabs>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-full bg-background/80"
              aria-label="Search activity"
            />
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-hidden max-w-7xl mx-auto w-full px-6 pb-6">
        <Card className="h-full shadow-lg border-0">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-4">
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-4 rounded-lg border bg-white"
                  >
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))
              ) : error ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Failed to load activity. Please try again.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => mutate()}
                    className="mt-4"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : executions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No activity found</p>
                  <p className="text-sm">
                    Agent executions will appear here when they run.
                  </p>
                </div>
              ) : (
                <AnimatePresence>
                  {executions.map((execution, index) => {
                    const IconComponent =
                      agentTypeIcons[execution.agentType] || Bot;
                    const status =
                      statusConfig[execution.status] || statusConfig.pending;
                    const StatusIcon = status.icon;

                    return (
                      <motion.div
                        key={execution.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex gap-4 p-4 rounded-lg border bg-white hover:shadow-sm transition-shadow"
                      >
                        {/* Agent Icon */}
                        <div
                          className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0",
                            execution.status === "failed"
                              ? "bg-red-100 text-red-600"
                              : execution.status === "running"
                                ? "bg-blue-100 text-blue-600"
                                : execution.status === "completed"
                                  ? "bg-green-100 text-green-600"
                                  : "bg-gray-100 text-gray-600"
                          )}
                        >
                          <IconComponent className="h-5 w-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-gray-900">
                                {execution.agentName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {execution.agentDescription ||
                                  `${execution.agentType} task`}
                              </p>
                            </div>
                            <Badge variant="outline" className={status.color}>
                              <StatusIcon
                                className={cn(
                                  "h-3 w-3 mr-1",
                                  execution.status === "running" &&
                                    "animate-spin"
                                )}
                              />
                              {status.label}
                            </Badge>
                          </div>

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(
                                new Date(execution.createdAt),
                                { addSuffix: true }
                              )}
                            </span>
                            {execution.durationMs && (
                              <span>
                                Duration:{" "}
                                {execution.durationMs < 1000
                                  ? `${execution.durationMs}ms`
                                  : `${(execution.durationMs / 1000).toFixed(1)}s`}
                              </span>
                            )}
                            {execution.tokensUsed && (
                              <span>
                                {execution.tokensUsed.toLocaleString()} tokens
                              </span>
                            )}
                            {execution.triggeredBy && (
                              <span>by {execution.triggeredBy.name}</span>
                            )}
                          </div>

                          {/* Error Message */}
                          {execution.error && (
                            <div className="mt-2 p-2 rounded bg-red-50 border border-red-200">
                              <p className="text-xs text-red-600 font-mono">
                                {execution.error}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
