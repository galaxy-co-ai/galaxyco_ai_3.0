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
  Workflow,
  Activity,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  RefreshCw,
  Sparkles,
  Zap,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import WorkflowCard, { type Workflow as WorkflowType } from "./WorkflowCard";
import WorkflowBuilder from "./WorkflowBuilder";
import WorkflowExecutionMonitor from "./WorkflowExecutionMonitor";
import {
  workflowTemplates,
  type WorkflowTemplate,
} from "@/lib/orchestration/workflow-templates";
import type { WorkflowStep, WorkflowTriggerType } from "@/lib/orchestration/types";

// Fetcher for SWR
const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ============================================================================
// TYPES
// ============================================================================

interface ApiWorkflow {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  status: string;
  triggerType: string;
  steps: unknown[];
  totalExecutions: number;
  successfulExecutions: number;
  lastExecutedAt: string | null;
  teamId: string | null;
  teamName?: string;
}

interface ApiAgent {
  id: string;
  name: string;
  type: string;
  status: string;
}

// Category filter options
const categoryFilters = [
  { value: "all", label: "All Workflows", icon: "🔍" },
  { value: "sales", label: "Sales", icon: "💰" },
  { value: "marketing", label: "Marketing", icon: "📢" },
  { value: "support", label: "Support", icon: "🎧" },
  { value: "operations", label: "Operations", icon: "⚙️" },
];

// Transform API workflow to local format
function transformApiWorkflow(apiWorkflow: ApiWorkflow): WorkflowType {
  return {
    id: apiWorkflow.id,
    name: apiWorkflow.name,
    description: apiWorkflow.description || undefined,
    category: apiWorkflow.category || undefined,
    status: apiWorkflow.status as WorkflowType["status"],
    triggerType: apiWorkflow.triggerType as WorkflowType["triggerType"],
    stepCount: apiWorkflow.steps?.length || 0,
    totalExecutions: apiWorkflow.totalExecutions,
    successfulExecutions: apiWorkflow.successfulExecutions,
    lastExecutedAt: apiWorkflow.lastExecutedAt
      ? new Date(apiWorkflow.lastExecutedAt)
      : undefined,
    teamId: apiWorkflow.teamId || undefined,
    teamName: apiWorkflow.teamName,
  };
}

// ============================================================================
// AGENT WORKFLOWS TAB COMPONENT
// ============================================================================

interface AgentWorkflowsTabProps {
  neptuneOpen?: boolean;
}

export default function AgentWorkflowsTab({
  neptuneOpen = false,
}: AgentWorkflowsTabProps) {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showBuilder, setShowBuilder] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<ApiWorkflow | null>(null);
  const [runningWorkflows, setRunningWorkflows] = useState<Set<string>>(new Set());
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);

  // Fetch workflows
  const {
    data: workflowsData,
    error: workflowsError,
    mutate: mutateWorkflows,
    isLoading: isLoadingWorkflows,
  } = useSWR<{ workflows: ApiWorkflow[] }>(
    "/api/orchestration/workflows",
    fetcher,
    { refreshInterval: 30000 }
  );

  // Fetch agents (for builder)
  const { data: agentsData } = useSWR<{ agents: ApiAgent[] }>(
    "/api/agents",
    fetcher
  );

  // Transform data
  const workflows: WorkflowType[] = (workflowsData?.workflows || []).map(
    transformApiWorkflow
  );
  const agents = agentsData?.agents || [];

  // Filter workflows
  const filteredWorkflows = workflows.filter((workflow) => {
    const matchesSearch =
      searchQuery === "" ||
      workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || workflow.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Stats
  const stats = {
    total: workflows.length,
    active: workflows.filter((w) => w.status === "active").length,
    totalExecutions: workflows.reduce((sum, w) => sum + w.totalExecutions, 0),
    successRate:
      workflows.reduce((sum, w) => sum + w.totalExecutions, 0) > 0
        ? Math.round(
            (workflows.reduce((sum, w) => sum + w.successfulExecutions, 0) /
              workflows.reduce((sum, w) => sum + w.totalExecutions, 0)) *
              100
          )
        : 0,
  };

  // Selected workflow
  const selectedWorkflow = selectedWorkflowId
    ? workflowsData?.workflows?.find((w) => w.id === selectedWorkflowId)
    : null;

  // Create workflow from template
  const handleCreateFromTemplate = useCallback(
    async (template: WorkflowTemplate) => {
      const agentMapping: Record<string, string> = {};
      const missingTypes: string[] = [];

      for (const agentType of template.requiredAgentTypes) {
        const matchingAgent = agents.find(
          (a) => a.type === agentType && a.status === "active"
        );
        if (matchingAgent) {
          agentMapping[agentType] = matchingAgent.id;
        } else {
          missingTypes.push(agentType);
        }
      }

      if (missingTypes.length > 0) {
        toast.error(
          `Missing agents for types: ${missingTypes.join(", ")}. Create these agents first.`
        );
        return;
      }

      const steps: WorkflowStep[] = template.steps.map((stepTemplate) => ({
        id: stepTemplate.id,
        name: stepTemplate.name,
        agentId: agentMapping[stepTemplate.agentType] || "",
        action: stepTemplate.action,
        inputs: stepTemplate.inputs,
        conditions: stepTemplate.conditions,
        onSuccess: stepTemplate.onSuccess,
        onFailure: stepTemplate.onFailure,
        timeout: stepTemplate.timeout,
        retryConfig: stepTemplate.retryConfig,
      }));

      try {
        const response = await fetch("/api/orchestration/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: template.name,
            description: template.description,
            category: template.category,
            triggerType: template.triggerType,
            triggerConfig: template.triggerConfig,
            steps,
            status: "active",
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create workflow");
        }

        mutateWorkflows();
        setShowTemplates(false);
        toast.success(`Created workflow: ${template.name}`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create workflow"
        );
      }
    },
    [agents, mutateWorkflows]
  );

  // Save workflow (create or update)
  const handleSaveWorkflow = useCallback(
    async (workflow: {
      name: string;
      description: string;
      triggerType: WorkflowTriggerType;
      triggerConfig: Record<string, unknown>;
      steps: WorkflowStep[];
    }) => {
      const isEdit = editingWorkflow !== null;
      const url = isEdit
        ? `/api/orchestration/workflows/${editingWorkflow.id}`
        : "/api/orchestration/workflows";
      const method = isEdit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...workflow,
          status: "active",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save workflow");
      }

      mutateWorkflows();
      setShowBuilder(false);
      setEditingWorkflow(null);
    },
    [editingWorkflow, mutateWorkflows]
  );

  // Run workflow
  const handleRunWorkflow = useCallback(
    async (workflowId: string) => {
      setRunningWorkflows((prev) => new Set(prev).add(workflowId));

      try {
        const response = await fetch(
          `/api/orchestration/workflows/${workflowId}/execute`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to run workflow");
        }

        setActiveExecutionId(data.executionId);
        toast.success("Workflow started");
        mutateWorkflows();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to run workflow"
        );
      } finally {
        setRunningWorkflows((prev) => {
          const next = new Set(prev);
          next.delete(workflowId);
          return next;
        });
      }
    },
    [mutateWorkflows]
  );

  // Delete workflow
  const handleDeleteWorkflow = useCallback(
    async (workflowId: string) => {
      if (!confirm("Are you sure you want to delete this workflow?")) return;

      try {
        const response = await fetch(
          `/api/orchestration/workflows/${workflowId}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete workflow");
        }

        if (selectedWorkflowId === workflowId) {
          setSelectedWorkflowId(null);
        }

        mutateWorkflows();
        toast.success("Workflow deleted");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to delete workflow"
        );
      }
    },
    [selectedWorkflowId, mutateWorkflows]
  );

  // Edit workflow
  const handleEditWorkflow = useCallback((workflow: ApiWorkflow) => {
    setEditingWorkflow(workflow);
    setShowBuilder(true);
  }, []);

  // Show builder or templates
  if (showBuilder) {
    return (
      <WorkflowBuilder
        workflowId={editingWorkflow?.id}
        initialName={editingWorkflow?.name || ""}
        initialDescription={editingWorkflow?.description || ""}
        initialTriggerType={
          (editingWorkflow?.triggerType as WorkflowTriggerType) || "manual"
        }
        initialSteps={(editingWorkflow?.steps as WorkflowStep[]) || []}
        agents={agents}
        onSave={handleSaveWorkflow}
        onCancel={() => {
          setShowBuilder(false);
          setEditingWorkflow(null);
        }}
      />
    );
  }

  // Show execution monitor
  if (activeExecutionId) {
    return (
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={() => setActiveExecutionId(null)}
          className="mb-4"
        >
          ← Back to Workflows
        </Button>
        <WorkflowExecutionMonitor
          executionId={activeExecutionId}
          onClose={() => setActiveExecutionId(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div
        className={cn(
          "flex-1 overflow-y-auto p-4",
          neptuneOpen && selectedWorkflowId ? "lg:w-1/2" : ""
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold">Workflows</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Multi-agent automation pipelines
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTemplates(true)}
              className="border-violet-300 text-violet-700 hover:bg-violet-50"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Templates
            </Button>
            <Button
              onClick={() => setShowBuilder(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-100">
                <Workflow className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Workflows</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {stats.totalExecutions}
                </p>
                <p className="text-xs text-muted-foreground">Total Runs</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Zap className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold">
                  {stats.successRate}%
                </p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-4 mb-6">
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
          <div className="flex items-center gap-2">
            {categoryFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={categoryFilter === filter.value ? "default" : "outline"}
                size="sm"
                onClick={() => setCategoryFilter(filter.value)}
                className={cn(
                  categoryFilter === filter.value
                    ? "bg-violet-600 text-white"
                    : ""
                )}
              >
                <span className="mr-1">{filter.icon}</span>
                {filter.label}
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => mutateWorkflows()}
            aria-label="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Workflows List */}
        {isLoadingWorkflows ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : workflowsError ? (
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Failed to load workflows</p>
            <Button
              variant="outline"
              onClick={() => mutateWorkflows()}
              className="mt-4"
            >
              Retry
            </Button>
          </Card>
        ) : filteredWorkflows.length === 0 ? (
          <Card className="p-8 text-center">
            <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery || categoryFilter !== "all"
                ? "No workflows match your search"
                : "No workflows yet"}
            </p>
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTemplates(true)}
                className="border-violet-300 text-violet-700 hover:bg-violet-50"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Use Template
              </Button>
              <Button
                onClick={() => setShowBuilder(true)}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredWorkflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                isSelected={workflow.id === selectedWorkflowId}
                onSelect={() =>
                  setSelectedWorkflowId(
                    workflow.id === selectedWorkflowId ? null : workflow.id
                  )
                }
                onRun={() => handleRunWorkflow(workflow.id)}
                onEdit={() => {
                  const apiWorkflow = workflowsData?.workflows?.find(
                    (w) => w.id === workflow.id
                  );
                  if (apiWorkflow) handleEditWorkflow(apiWorkflow);
                }}
                onDelete={() => handleDeleteWorkflow(workflow.id)}
                isRunning={runningWorkflows.has(workflow.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-3xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-background p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Workflow Templates</h3>
                <p className="text-sm text-muted-foreground">
                  Pre-built workflows ready to deploy
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTemplates(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              {workflowTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="p-4 hover:border-violet-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{template.icon}</span>
                        <h4 className="font-medium">{template.name}</h4>
                        <Badge
                          variant="outline"
                          className="border-violet-200 text-violet-700"
                        >
                          {template.department}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span>{template.steps.length} steps</span>
                        <span>•</span>
                        <span>{template.estimatedDuration}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-3">
                        {template.benefits.slice(0, 3).map((benefit, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-xs"
                          >
                            {benefit}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleCreateFromTemplate(template)}
                      className="bg-violet-600 hover:bg-violet-700 text-white shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Use
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Detail Panel */}
      {selectedWorkflow && !neptuneOpen && (
        <div className="w-96 border-l bg-gray-50/50 p-4 overflow-y-auto hidden lg:block">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Workflow Details</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedWorkflowId(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p>{selectedWorkflow.name}</p>
            </div>
            {selectedWorkflow.description && (
              <div>
                <p className="text-xs text-muted-foreground">Description</p>
                <p className="text-sm">
                  {selectedWorkflow.description}
                </p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Trigger</p>
              <p className="capitalize">{selectedWorkflow.triggerType}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Steps</p>
              <div className="mt-2 space-y-2">
                {(selectedWorkflow.steps as Array<{ id: string; name: string; action: string }>)?.map(
                  (step, index) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-2 p-2 bg-gray-100 rounded"
                    >
                      <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-xs text-violet-600">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{step.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {step.action}
                        </p>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={() => handleRunWorkflow(selectedWorkflow.id)}
                disabled={
                  selectedWorkflow.status !== "active" ||
                  runningWorkflows.has(selectedWorkflow.id)
                }
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {runningWorkflows.has(selectedWorkflow.id) ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Workflow
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
