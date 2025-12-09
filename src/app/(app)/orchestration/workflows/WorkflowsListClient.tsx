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
  Workflow,
  Filter,
  RefreshCw,
  ChevronLeft,
  Play,
  Pause,
  Trash2,
  Settings,
  Zap,
  Calendar,
  Bot,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Trigger type configuration - light theme
const triggerConfig: Record<
  string,
  { icon: React.ReactNode; label: string; color: string; bgColor: string; borderColor: string }
> = {
  manual: {
    icon: <Play className="h-4 w-4" />,
    label: "Manual",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  event: {
    icon: <Zap className="h-4 w-4" />,
    label: "Event",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  schedule: {
    icon: <Calendar className="h-4 w-4" />,
    label: "Scheduled",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  agent_request: {
    icon: <Bot className="h-4 w-4" />,
    label: "Agent Request",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
};

// Status configuration - light theme
const statusConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  active: { label: "Active", color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200" },
  paused: { label: "Paused", color: "text-yellow-700", bgColor: "bg-yellow-50", borderColor: "border-yellow-200" },
  draft: { label: "Draft", color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200" },
  archived: { label: "Archived", color: "text-gray-500", bgColor: "bg-gray-50", borderColor: "border-gray-200" },
};

interface WorkflowItem {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  status: string;
  teamId: string | null;
  teamName: string | null;
  stepCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowsListClientProps {
  workspaceId: string;
  initialWorkflows: WorkflowItem[];
  initialTeams: Array<{ id: string; name: string; department: string }>;
  initialAgents: Array<{ id: string; name: string; type: string }>;
}

export default function WorkflowsListClient({
  workspaceId,
  initialWorkflows,
  initialTeams,
  initialAgents,
}: WorkflowsListClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [triggerFilter, setTriggerFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());
  const [processingWorkflows, setProcessingWorkflows] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState("");
  const [newWorkflowDescription, setNewWorkflowDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch workflows with SWR
  const { data: workflowsData, mutate, isLoading } = useSWR(
    `/api/orchestration/workflows`,
    fetcher,
    {
      fallbackData: { workflows: initialWorkflows },
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  const workflows = workflowsData?.workflows || initialWorkflows;

  // Filter workflows
  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow: WorkflowItem) => {
      const matchesSearch =
        !searchQuery ||
        workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTrigger =
        triggerFilter === "all" || workflow.triggerType === triggerFilter;
      const matchesStatus =
        statusFilter === "all" || workflow.status === statusFilter;
      return matchesSearch && matchesTrigger && matchesStatus;
    });
  }, [workflows, searchQuery, triggerFilter, statusFilter]);

  // Toggle workflow expansion
  const toggleExpand = useCallback((workflowId: string) => {
    setExpandedWorkflows((prev) => {
      const next = new Set(prev);
      if (next.has(workflowId)) {
        next.delete(workflowId);
      } else {
        next.add(workflowId);
      }
      return next;
    });
  }, []);

  // Create new workflow
  const createWorkflow = useCallback(async () => {
    if (!newWorkflowName.trim()) {
      toast.error("Please enter a workflow name");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/orchestration/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newWorkflowName,
          description: newWorkflowDescription,
          triggerType: "manual",
          steps: [],
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create workflow");
      }

      const result = await response.json();
      toast.success("Workflow created");
      setShowCreateModal(false);
      setNewWorkflowName("");
      setNewWorkflowDescription("");
      mutate();
      router.push(`/orchestration/workflows/${result.workflow.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create workflow");
    } finally {
      setIsCreating(false);
    }
  }, [newWorkflowName, newWorkflowDescription, mutate, router]);

  // Execute workflow
  const executeWorkflow = useCallback(
    async (workflowId: string) => {
      setProcessingWorkflows((prev) => new Set(prev).add(workflowId));
      try {
        const response = await fetch(`/api/orchestration/workflows/${workflowId}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to execute workflow");
        }

        toast.success("Workflow execution started");
        mutate();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to execute workflow");
      } finally {
        setProcessingWorkflows((prev) => {
          const next = new Set(prev);
          next.delete(workflowId);
          return next;
        });
      }
    },
    [mutate]
  );

  // Update workflow status
  const updateWorkflowStatus = useCallback(
    async (workflowId: string, status: string) => {
      setProcessingWorkflows((prev) => new Set(prev).add(workflowId));
      try {
        const response = await fetch(`/api/orchestration/workflows/${workflowId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update workflow");
        }

        toast.success(`Workflow ${status === "active" ? "activated" : "paused"}`);
        mutate();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update workflow");
      } finally {
        setProcessingWorkflows((prev) => {
          const next = new Set(prev);
          next.delete(workflowId);
          return next;
        });
      }
    },
    [mutate]
  );

  // Delete workflow
  const deleteWorkflow = useCallback(
    async (workflowId: string) => {
      if (!confirm("Are you sure you want to delete this workflow?")) return;

      setProcessingWorkflows((prev) => new Set(prev).add(workflowId));
      try {
        const response = await fetch(`/api/orchestration/workflows/${workflowId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete workflow");
        }

        toast.success("Workflow deleted");
        mutate();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete workflow");
      } finally {
        setProcessingWorkflows((prev) => {
          const next = new Set(prev);
          next.delete(workflowId);
          return next;
        });
      }
    },
    [mutate]
  );

  return (
    <div className="flex h-full flex-col bg-gray-50/50">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
          <div className="flex items-center gap-4">
            <Link href="/orchestration">
              <Button
                variant="ghost"
                size="sm"
                aria-label="Back to orchestration dashboard"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Workflow 
                className="w-7 h-7"
                style={{
                  stroke: 'url(#icon-gradient-workflows)',
                  strokeWidth: 2,
                  filter: 'drop-shadow(0 2px 4px rgba(147, 51, 234, 0.15))'
                }}
              />
              <svg width="0" height="0" className="absolute">
                <defs>
                  <linearGradient id="icon-gradient-workflows" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9333ea" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div>
                <h1 
                  className="branded-page-title text-2xl uppercase"
                  style={{ 
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <span className="hidden sm:inline">W O R K F L O W S</span>
                  <span className="sm:hidden">WORKFLOWS</span>
                </h1>
                <p className="text-muted-foreground text-sm">
                  Build and manage multi-agent workflows
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
            aria-label="Create new workflow"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Workflow
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-6 py-6 space-y-6">
        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workflows..."
                className="pl-10"
                aria-label="Search workflows"
              />
            </div>

            {/* Trigger Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={triggerFilter}
                onChange={(e) => setTriggerFilter(e.target.value)}
                className="px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                aria-label="Filter by trigger type"
              >
                <option value="all">All Triggers</option>
                {Object.entries(triggerConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              aria-label="Filter by status"
            >
              <option value="all">All Status</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>

            {/* Refresh */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => mutate()}
              aria-label="Refresh workflows list"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Workflows Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <Card className="p-12 text-center">
            <Workflow className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Workflows Found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery || triggerFilter !== "all" || statusFilter !== "all"
                ? "No workflows match your search criteria. Try adjusting your filters."
                : "Create your first workflow to chain agents together for complex automation."}
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Workflow
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkflows.map((workflow: WorkflowItem) => {
              const trigger = triggerConfig[workflow.triggerType] || triggerConfig.manual;
              const status = statusConfig[workflow.status] || statusConfig.draft;
              const isExpanded = expandedWorkflows.has(workflow.id);
              const isProcessing = processingWorkflows.has(workflow.id);

              return (
                <Card
                  key={workflow.id}
                  className={cn(
                    "transition-all duration-200",
                    "hover:border-purple-300 hover:shadow-md"
                  )}
                >
                  {/* Card Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", trigger.bgColor)}>
                          <span className={trigger.color}>{trigger.icon}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{workflow.name}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              className={cn(trigger.bgColor, trigger.color, "border", trigger.borderColor, "text-xs")}
                            >
                              {trigger.label}
                            </Badge>
                            <Badge
                              className={cn(status.bgColor, status.color, "border", status.borderColor, "text-xs")}
                            >
                              {status.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(workflow.id)}
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
                    {workflow.description && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {workflow.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Workflow className="h-4 w-4" />
                        {workflow.stepCount} steps
                      </span>
                      {workflow.teamName && (
                        <span className="flex items-center gap-1">
                          <Bot className="h-4 w-4" />
                          {workflow.teamName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t pt-3 space-y-3">
                      {/* Last Updated */}
                      <p className="text-xs text-muted-foreground">
                        Updated {formatDistanceToNow(new Date(workflow.updatedAt), { addSuffix: true })}
                      </p>

                      {/* Quick Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/orchestration/workflows/${workflow.id}`}>
                          <Button
                            size="sm"
                            variant="outline"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        {workflow.status === "active" ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateWorkflowStatus(workflow.id, "paused")}
                            disabled={isProcessing}
                            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                          >
                            <Pause className="h-3 w-3 mr-1" />
                            Pause
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateWorkflowStatus(workflow.id, "active")}
                            disabled={isProcessing}
                            className="border-green-300 text-green-700 hover:bg-green-50"
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Activate
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => executeWorkflow(workflow.id)}
                          disabled={isProcessing || workflow.status !== "active"}
                          className="border-purple-300 text-purple-700 hover:bg-purple-50"
                        >
                          {isProcessing ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Play className="h-3 w-3 mr-1" />
                          )}
                          Run
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteWorkflow(workflow.id)}
                          disabled={isProcessing}
                          className="text-red-600 hover:bg-red-50"
                          aria-label="Delete workflow"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* View Details Link */}
                      <Link
                        href={`/orchestration/workflows/${workflow.id}`}
                        className="flex items-center text-sm text-purple-600 hover:text-purple-700"
                      >
                        View workflow details
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        {/* Workflow Stats Summary */}
        {workflows.length > 0 && (
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Active:</span>
                <span className="font-medium">
                  {workflows.filter((w: WorkflowItem) => w.status === "active").length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <span className="text-muted-foreground">Paused:</span>
                <span className="font-medium">
                  {workflows.filter((w: WorkflowItem) => w.status === "paused").length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-400" />
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">{workflows.length}</span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Workflow</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="workflow-name" className="block text-sm text-muted-foreground mb-1">
                  Workflow Name
                </label>
                <Input
                  id="workflow-name"
                  value={newWorkflowName}
                  onChange={(e) => setNewWorkflowName(e.target.value)}
                  placeholder="e.g., Lead Qualification Pipeline"
                />
              </div>
              <div>
                <label htmlFor="workflow-description" className="block text-sm text-muted-foreground mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="workflow-description"
                  value={newWorkflowDescription}
                  onChange={(e) => setNewWorkflowDescription(e.target.value)}
                  placeholder="What does this workflow do?"
                  className="w-full h-20 p-3 rounded-lg border bg-background resize-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createWorkflow}
                  disabled={isCreating || !newWorkflowName.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create Workflow
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
