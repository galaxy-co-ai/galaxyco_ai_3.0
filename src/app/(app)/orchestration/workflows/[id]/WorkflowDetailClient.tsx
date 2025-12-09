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
  AlertTriangle,
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

// Trigger type configuration
const triggerConfig: Record<
  string,
  { icon: React.ReactNode; label: string; color: string; bgColor: string }
> = {
  manual: {
    icon: <Play className="h-4 w-4" />,
    label: "Manual",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  event: {
    icon: <Zap className="h-4 w-4" />,
    label: "Event",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
  },
  schedule: {
    icon: <Calendar className="h-4 w-4" />,
    label: "Scheduled",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
  agent_request: {
    icon: <Bot className="h-4 w-4" />,
    label: "Agent Request",
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
  },
};

// Status configuration
const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  active: { label: "Active", color: "text-green-400", bgColor: "bg-green-500/20" },
  paused: { label: "Paused", color: "text-yellow-400", bgColor: "bg-yellow-500/20" },
  draft: { label: "Draft", color: "text-gray-400", bgColor: "bg-gray-500/20" },
  archived: { label: "Archived", color: "text-gray-500", bgColor: "bg-gray-500/20" },
};

// Execution status configuration
const executionStatusConfig: Record<
  string,
  { icon: React.ReactNode; label: string; color: string; bgColor: string }
> = {
  running: {
    icon: <Loader2 className="h-4 w-4 animate-spin" />,
    label: "Running",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
  },
  completed: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: "Completed",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
  },
  failed: {
    icon: <XCircle className="h-4 w-4" />,
    label: "Failed",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
  },
  paused: {
    icon: <Pause className="h-4 w-4" />,
    label: "Paused",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
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
  workspaceId: string;
}

export default function WorkflowDetailClient({
  workflow: initialWorkflow,
  executions: initialExecutions,
  availableAgents,
  workspaceId,
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

  // Fetch executions
  const { data: executionsData, mutate: mutateExecutions } = useSWR(
    `/api/orchestration/workflows/executions?workflowId=${initialWorkflow.id}`,
    fetcher,
    {
      fallbackData: { executions: initialExecutions },
      refreshInterval: 10000,
    }
  );

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
    async (savedWorkflow: { id: string; name: string; steps: WorkflowStep[] }) => {
      setEditedSteps(savedWorkflow.steps);
      toast.success("Workflow saved");
      mutate();
    },
    [mutate]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <div className="border-b border-white/5 bg-gray-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/orchestration/workflows">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                  aria-label="Back to workflows"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
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
                      className="text-xl font-bold bg-gray-800 border-gray-700 text-white"
                      aria-label="Workflow name"
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-white">{workflow.name}</h1>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={cn(trigger.bgColor, trigger.color, "border-0")}>
                      {trigger.label}
                    </Badge>
                    <Badge className={cn(status.bgColor, status.color, "border-0")}>
                      {status.label}
                    </Badge>
                    <span className="text-gray-500 text-sm">
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
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="border-gray-700 text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={saveChanges}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  {workflow.status === "active" ? (
                    <Button
                      variant="outline"
                      onClick={() => updateStatus("paused")}
                      className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => updateStatus("active")}
                      className="border-green-500/50 text-green-400 hover:bg-green-500/10"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Activate
                    </Button>
                  )}
                  <Button
                    onClick={executeWorkflow}
                    disabled={isExecuting || workflow.status !== "active"}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isExecuting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Run
                  </Button>
                  <Button
                    variant="outline"
                    onClick={deleteWorkflow}
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="builder" className="space-y-6">
          <TabsList className="bg-gray-900/50 border border-white/10">
            <TabsTrigger value="builder">Workflow Builder</TabsTrigger>
            <TabsTrigger value="executions">
              Executions ({executions.length})
            </TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Workflow Builder Tab */}
          <TabsContent value="builder" className="space-y-6">
            <Card className="p-6 bg-gray-900/50 border-white/10">
              {isEditing && (
                <div className="mb-4">
                  <label htmlFor="workflow-description" className="block text-sm text-gray-400 mb-1">
                    Description
                  </label>
                  <textarea
                    id="workflow-description"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="w-full h-20 p-3 rounded-lg bg-gray-800 border border-gray-700 text-white resize-none"
                    placeholder="What does this workflow do?"
                  />
                </div>
              )}
              <WorkflowBuilder
                workflowId={workflow.id}
                initialWorkflow={{
                  id: workflow.id,
                  name: workflow.name,
                  steps: workflow.steps,
                }}
                availableAgents={availableAgents}
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
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back to Executions
                </Button>
                <WorkflowExecutionMonitor
                  executionId={selectedExecutionId}
                  workflowSteps={workflow.steps}
                  onClose={() => setSelectedExecutionId(null)}
                />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-white">Recent Executions</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => mutateExecutions()}
                    className="text-gray-400 hover:text-white"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>

                {executions.length === 0 ? (
                  <Card className="p-12 bg-gray-900/50 border-white/10 text-center">
                    <Clock className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Executions Yet</h3>
                    <p className="text-gray-400 mb-6">
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
                            "p-4 bg-gray-900/50 border-white/10 cursor-pointer transition-all",
                            "hover:border-purple-500/30"
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
                                  <span className="font-medium text-white">
                                    Execution #{execution.id.slice(0, 8)}
                                  </span>
                                  <Badge
                                    className={cn(
                                      execStatus.bgColor,
                                      execStatus.color,
                                      "border-0 text-xs"
                                    )}
                                  >
                                    {execStatus.label}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-500">
                                  Started{" "}
                                  {formatDistanceToNow(new Date(execution.startedAt), {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-500" />
                          </div>
                          {execution.error && (
                            <div className="mt-3 p-2 rounded bg-red-500/10 text-red-400 text-sm">
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
            <Card className="p-6 bg-gray-900/50 border-white/10">
              <h3 className="font-semibold text-white mb-4">Workflow Configuration</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <div>
                    <p className="text-white">Trigger Type</p>
                    <p className="text-sm text-gray-400">How the workflow is triggered</p>
                  </div>
                  <Badge className={cn(trigger.bgColor, trigger.color, "border-0")}>
                    {trigger.label}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <div>
                    <p className="text-white">Steps</p>
                    <p className="text-sm text-gray-400">Number of steps in workflow</p>
                  </div>
                  <span className="text-white font-medium">{workflow.steps.length}</span>
                </div>
                {workflow.teamName && (
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                    <div>
                      <p className="text-white">Associated Team</p>
                      <p className="text-sm text-gray-400">Team that runs this workflow</p>
                    </div>
                    <Link
                      href={`/orchestration/teams/${workflow.teamId}`}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      {workflow.teamName}
                    </Link>
                  </div>
                )}
                <div className="flex justify-between items-center py-3 border-b border-white/5">
                  <div>
                    <p className="text-white">Created</p>
                    <p className="text-sm text-gray-400">When workflow was created</p>
                  </div>
                  <span className="text-white font-medium">
                    {format(new Date(workflow.createdAt), "PPP")}
                  </span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <div>
                    <p className="text-white">Last Updated</p>
                    <p className="text-sm text-gray-400">When workflow was last modified</p>
                  </div>
                  <span className="text-white font-medium">
                    {formatDistanceToNow(new Date(workflow.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </Card>

            {/* Danger Zone */}
            <Card className="p-6 bg-red-950/30 border-red-500/20">
              <h3 className="font-semibold text-red-400 mb-4">Danger Zone</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white">Delete Workflow</p>
                  <p className="text-sm text-gray-400">
                    Permanently delete this workflow and all execution history
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={deleteWorkflow}
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
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

