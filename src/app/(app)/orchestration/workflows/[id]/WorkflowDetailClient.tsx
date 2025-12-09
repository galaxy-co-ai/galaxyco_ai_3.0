"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronLeft,
  Settings,
  Play,
  Pause,
  Trash2,
  Save,
  Loader2,
  Workflow,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Zap,
  Calendar,
  Bot,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import WorkflowBuilder from "@/components/orchestration/WorkflowBuilder";
import WorkflowExecutionMonitor from "@/components/orchestration/WorkflowExecutionMonitor";

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

// Execution status configuration - light theme
const executionStatusConfig: Record<
  string,
  { icon: React.ReactNode; label: string; color: string; bgColor: string; borderColor: string }
> = {
  running: {
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    label: "Running",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  completed: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: "Completed",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  failed: {
    icon: <XCircle className="h-4 w-4" />,
    label: "Failed",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
  paused: {
    icon: <Pause className="h-4 w-4" />,
    label: "Paused",
    color: "text-yellow-700",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
  },
};

interface WorkflowStep {
  id: string;
  agentId: string;
  action: string;
  inputs: Record<string, unknown>;
  conditions?: { field: string; operator: string; value: unknown }[];
  onSuccess?: string;
  onFailure?: string;
  timeout?: number;
}

interface Workflow {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  triggerConfig: Record<string, unknown> | null;
  status: string;
  steps: WorkflowStep[];
  teamId: string | null;
  teamName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Execution {
  id: string;
  status: string;
  currentStepId: string | null;
  stepResults: Record<string, { status: string; output: unknown; completedAt: string }> | null;
  context: Record<string, unknown> | null;
  startedAt: Date;
  completedAt: Date | null;
  error: { message: string; step?: string; details?: unknown } | null;
}

interface WorkflowDetailClientProps {
  workflow: Workflow;
  executions: Execution[];
  availableAgents: Array<{ id: string; name: string; type: string; status: string }>;
}

export default function WorkflowDetailClient({
  workflow: initialWorkflow,
  executions: initialExecutions,
  availableAgents,
}: WorkflowDetailClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [editedName, setEditedName] = useState(initialWorkflow.name);
  const [editedDescription, setEditedDescription] = useState(initialWorkflow.description || "");
  const [editedSteps, setEditedSteps] = useState<WorkflowStep[]>(initialWorkflow.steps);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);

  // Fetch workflow data with SWR
  const { data: workflowData, mutate } = useSWR(
    `/api/orchestration/workflows/${initialWorkflow.id}`,
    fetcher,
    {
      fallbackData: { workflow: initialWorkflow },
      refreshInterval: 30000,
    }
  );

  // Use initial executions (fetched server-side) - no separate API call needed
  const executionsData = { executions: initialExecutions };
  const mutateExecutions = mutate;

  const workflow = workflowData?.workflow || initialWorkflow;
  const executions = executionsData?.executions || initialExecutions;
  const trigger = triggerConfig[workflow.triggerType] || triggerConfig.manual;
  const status = statusConfig[workflow.status] || statusConfig.draft;

  // Save workflow changes
  const saveChanges = useCallback(async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/orchestration/workflows/${workflow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editedName,
          description: editedDescription,
          steps: editedSteps,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save changes");
      }

      toast.success("Workflow updated successfully");
      setIsEditing(false);
      mutate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  }, [workflow.id, editedName, editedDescription, editedSteps, mutate]);

  // Update workflow status
  const updateStatus = useCallback(
    async (newStatus: string) => {
      try {
        const response = await fetch(`/api/orchestration/workflows/${workflow.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update status");
        }

        toast.success(`Workflow ${newStatus === "active" ? "activated" : "paused"}`);
        mutate();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update status");
      }
    },
    [workflow.id, mutate]
  );

  // Execute workflow
  const executeWorkflow = useCallback(async () => {
    setIsExecuting(true);
    try {
      const response = await fetch(`/api/orchestration/workflows/${workflow.id}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to execute workflow");
      }

      const result = await response.json();
      toast.success("Workflow execution started");
      setSelectedExecutionId(result.execution?.id || null);
      mutate();
      mutateExecutions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to execute workflow");
    } finally {
      setIsExecuting(false);
    }
  }, [workflow.id, mutate, mutateExecutions]);

  // Delete workflow
  const deleteWorkflow = useCallback(async () => {
    if (!confirm("Are you sure you want to delete this workflow? This action cannot be undone."))
      return;

    try {
      const response = await fetch(`/api/orchestration/workflows/${workflow.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete workflow");
      }

      toast.success("Workflow deleted");
      router.push("/orchestration/workflows");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete workflow");
    }
  }, [workflow.id, router]);

  // Handle workflow save from builder
  const handleWorkflowSave = useCallback(
    async (savedWorkflow: { 
      name: string; 
      description: string;
      triggerType: string;
      triggerConfig: Record<string, unknown>;
      steps: WorkflowStep[];
    }) => {
      setEditedSteps(savedWorkflow.steps);
      setEditedName(savedWorkflow.name);
      setEditedDescription(savedWorkflow.description);
      toast.success("Workflow saved");
      mutate();
    },
    [mutate]
  );

  return (
    <div className="flex h-full flex-col bg-gray-50/50">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4">
          <div className="flex items-center gap-4">
            <Link href="/orchestration/workflows">
              <Button
                size="sm"
                className="bg-white hover:bg-white text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-px hover:shadow-lg active:scale-[0.98] active:shadow-sm border border-gray-200 transition-all duration-150 gap-2"
                aria-label="Back to workflows"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className={cn("p-3 rounded-xl", trigger.bgColor)}>
                <span className={trigger.color}>{trigger.icon}</span>
              </div>
              <div>
                {isEditing ? (
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-xl font-bold"
                    aria-label="Workflow name"
                  />
                ) : (
                  <h1 className="text-2xl font-bold">{workflow.name}</h1>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn(trigger.bgColor, trigger.color, "border", trigger.borderColor)}>
                    {trigger.label}
                  </Badge>
                  <Badge className={cn(status.bgColor, status.color, "border", status.borderColor)}>
                    {status.label}
                  </Badge>
                  <span className="text-muted-foreground text-sm">
                    {workflow.steps.length} steps
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="bg-white hover:bg-white text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-px hover:shadow-lg active:scale-[0.98] active:shadow-sm border border-gray-200 transition-all duration-150 gap-2"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveChanges}
                  disabled={isSaving}
                  className="bg-white hover:bg-white text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-px hover:shadow-lg active:scale-[0.98] active:shadow-sm border border-gray-200 transition-all duration-150 gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="bg-white hover:bg-white text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-px hover:shadow-lg active:scale-[0.98] active:shadow-sm border border-gray-200 transition-all duration-150 gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Edit
                </Button>
                {workflow.status === "active" ? (
                  <Button
                    size="sm"
                    onClick={() => updateStatus("paused")}
                    className="bg-white hover:bg-white text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-px hover:shadow-lg active:scale-[0.98] active:shadow-sm border border-gray-200 transition-all duration-150 gap-2"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => updateStatus("active")}
                    className="bg-white hover:bg-white text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-px hover:shadow-lg active:scale-[0.98] active:shadow-sm border border-gray-200 transition-all duration-150 gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Activate
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={executeWorkflow}
                  disabled={isExecuting || workflow.status !== "active"}
                  className="bg-white hover:bg-white text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-px hover:shadow-lg active:scale-[0.98] active:shadow-sm border border-gray-200 transition-all duration-150 gap-2"
                >
                  {isExecuting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Run
                </Button>
                <Button
                  size="sm"
                  onClick={deleteWorkflow}
                  className="bg-white hover:bg-white text-gray-700 shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:-translate-y-px hover:shadow-lg active:scale-[0.98] active:shadow-sm border border-gray-200 transition-all duration-150 gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-6 py-6">
        <Tabs defaultValue="builder" className="space-y-6">
          <TabsList>
            <TabsTrigger value="builder">Workflow Builder</TabsTrigger>
            <TabsTrigger value="executions">
              Executions ({executions.length})
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Workflow Builder Tab */}
          <TabsContent value="builder" className="space-y-6">
            <Card className="p-6">
              {isEditing && (
                <div className="mb-4">
                  <label htmlFor="workflow-description" className="block text-sm text-muted-foreground mb-1">
                    Description
                  </label>
                  <textarea
                    id="workflow-description"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="w-full h-20 p-3 rounded-lg border bg-background resize-none"
                    placeholder="What does this workflow do?"
                  />
                </div>
              )}
              <WorkflowBuilder
                workflowId={workflow.id}
                initialName={workflow.name}
                initialDescription={workflow.description || ""}
                initialTriggerType={workflow.triggerType as "manual" | "event" | "schedule" | "agent_request"}
                initialSteps={workflow.steps}
                agents={availableAgents}
                onSave={handleWorkflowSave}
              />
            </Card>
          </TabsContent>

          {/* Executions Tab */}
          <TabsContent value="executions" className="space-y-6">
            {selectedExecutionId ? (
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedExecutionId(null)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Executions
                </Button>
                <WorkflowExecutionMonitor
                  executionId={selectedExecutionId}
                  onClose={() => setSelectedExecutionId(null)}
                />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Recent Executions</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => mutateExecutions()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                {executions.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Executions Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Run this workflow to see execution history and results.
                    </p>
                    <Button
                      onClick={executeWorkflow}
                      disabled={isExecuting || workflow.status !== "active"}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Run Workflow
                    </Button>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {executions.map((execution: Execution) => {
                      const execStatus =
                        executionStatusConfig[execution.status] || executionStatusConfig.running;

                      return (
                        <Card
                          key={execution.id}
                          className={cn(
                            "p-4 cursor-pointer transition-all",
                            "hover:border-purple-300 hover:shadow-md"
                          )}
                          onClick={() => setSelectedExecutionId(execution.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) =>
                            e.key === "Enter" && setSelectedExecutionId(execution.id)
                          }
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn("p-2 rounded-lg", execStatus.bgColor)}>
                                <span className={execStatus.color}>{execStatus.icon}</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    Execution #{execution.id.slice(0, 8)}
                                  </span>
                                  <Badge
                                    className={cn(
                                      execStatus.bgColor,
                                      execStatus.color,
                                      "border",
                                      execStatus.borderColor,
                                      "text-xs"
                                    )}
                                  >
                                    {execStatus.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Started{" "}
                                  {formatDistanceToNow(new Date(execution.startedAt), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                          {execution.error && (
                            <div className="mt-3 p-2 rounded bg-red-50 text-red-700 text-sm border border-red-200">
                              {execution.error.message}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Workflow Configuration</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <p className="font-medium">Trigger Type</p>
                    <p className="text-sm text-muted-foreground">How the workflow is triggered</p>
                  </div>
                  <Badge className={cn(trigger.bgColor, trigger.color, "border", trigger.borderColor)}>
                    {trigger.label}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <p className="font-medium">Steps</p>
                    <p className="text-sm text-muted-foreground">Number of steps in workflow</p>
                  </div>
                  <span className="font-medium">{workflow.steps.length}</span>
                </div>
                {workflow.teamName && (
                  <div className="flex justify-between items-center py-3 border-b">
                    <div>
                      <p className="font-medium">Associated Team</p>
                      <p className="text-sm text-muted-foreground">Team that runs this workflow</p>
                    </div>
                    <Link
                      href={`/orchestration/teams/${workflow.teamId}`}
                      className="text-purple-600 hover:text-purple-700"
                    >
                      {workflow.teamName}
                    </Link>
                  </div>
                )}
                <div className="flex justify-between items-center py-3 border-b">
                  <div>
                    <p className="font-medium">Created</p>
                    <p className="text-sm text-muted-foreground">When workflow was created</p>
                  </div>
                  <span className="font-medium">
                    {format(new Date(workflow.createdAt), "PPP")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <div>
                    <p className="font-medium">Last Updated</p>
                    <p className="text-sm text-muted-foreground">When workflow was last modified</p>
                  </div>
                  <span className="font-medium">
                    {formatDistanceToNow(new Date(workflow.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 border-red-200 bg-red-50/50">
              <h3 className="font-semibold text-red-700 mb-4">Danger Zone</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Workflow</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this workflow and all execution history
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={deleteWorkflow}
                  className="border-red-300 text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Workflow
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
