"use client";

import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  Play,
  Save,
  GripVertical,
  ArrowRight,
  ArrowDownRight,
  Settings,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Bot,
  Workflow,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type {
  WorkflowStep,
  WorkflowTriggerType,
  WorkflowStepCondition,
} from "@/lib/orchestration/types";

// ============================================================================
// TYPES
// ============================================================================

interface Agent {
  id: string;
  name: string;
  type: string;
  status: string;
}

interface WorkflowBuilderStep extends Omit<WorkflowStep, "agentId"> {
  agentId: string | null;
  isExpanded: boolean;
}

interface WorkflowBuilderProps {
  workflowId?: string;
  initialName?: string;
  initialDescription?: string;
  initialTriggerType?: WorkflowTriggerType;
  initialSteps?: WorkflowStep[];
  agents: Agent[];
  onSave: (workflow: {
    name: string;
    description: string;
    triggerType: WorkflowTriggerType;
    triggerConfig: Record<string, unknown>;
    steps: WorkflowStep[];
  }) => Promise<void>;
  onCancel?: () => void;
  onTest?: (steps: WorkflowStep[]) => void;
}

// ============================================================================
// TRIGGER OPTIONS
// ============================================================================

const triggerOptions: Array<{
  value: WorkflowTriggerType;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    value: "manual",
    label: "Manual",
    description: "Start workflow manually via button or API",
    icon: <Play className="h-4 w-4" />,
  },
  {
    value: "event",
    label: "Event",
    description: "Trigger when a specific event occurs",
    icon: <Zap className="h-4 w-4" />,
  },
  {
    value: "schedule",
    label: "Schedule",
    description: "Run on a recurring schedule (cron)",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    value: "agent_request",
    label: "Agent Request",
    description: "Triggered by another agent",
    icon: <Bot className="h-4 w-4" />,
  },
];

// ============================================================================
// CONDITION OPERATORS
// ============================================================================

const conditionOperators = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "exists", label: "Exists" },
];

// ============================================================================
// WORKFLOW BUILDER COMPONENT
// ============================================================================

export default function WorkflowBuilder({
  workflowId,
  initialName = "",
  initialDescription = "",
  initialTriggerType = "manual",
  initialSteps = [],
  agents,
  onSave,
  onCancel,
  onTest,
}: WorkflowBuilderProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [triggerType, setTriggerType] = useState<WorkflowTriggerType>(initialTriggerType);
  const [triggerConfig, setTriggerConfig] = useState<Record<string, unknown>>({});
  const [steps, setSteps] = useState<WorkflowBuilderStep[]>(
    initialSteps.map((s, i) => ({
      ...s,
      isExpanded: i === 0,
    }))
  );
  const [isSaving, setIsSaving] = useState(false);
  const [draggedStep, setDraggedStep] = useState<number | null>(null);

  // Create empty step
  const createEmptyStep = useCallback(
    (index: number): WorkflowBuilderStep => ({
      id: `step_${Date.now()}_${index}`,
      name: `Step ${index + 1}`,
      agentId: null,
      action: "",
      inputs: {},
      conditions: [],
      timeout: 300,
      isExpanded: true,
    }),
    []
  );

  // Add new step
  const addStep = useCallback(() => {
    setSteps((prev) => {
      const newStep = createEmptyStep(prev.length);
      // Set previous step's onSuccess to new step
      if (prev.length > 0) {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          onSuccess: newStep.id,
        };
        return [...updated, newStep];
      }
      return [...prev, newStep];
    });
  }, [createEmptyStep]);

  // Remove step
  const removeStep = useCallback((index: number) => {
    setSteps((prev) => {
      const removed = prev[index];
      const updated = prev.filter((_, i) => i !== index);

      // Update references to removed step
      return updated.map((step) => ({
        ...step,
        onSuccess: step.onSuccess === removed.id ? undefined : step.onSuccess,
        onFailure: step.onFailure === removed.id ? undefined : step.onFailure,
      }));
    });
  }, []);

  // Update step
  const updateStep = useCallback(
    (index: number, updates: Partial<WorkflowBuilderStep>) => {
      setSteps((prev) =>
        prev.map((step, i) => (i === index ? { ...step, ...updates } : step))
      );
    },
    []
  );

  // Toggle step expansion
  const toggleStep = useCallback((index: number) => {
    setSteps((prev) =>
      prev.map((step, i) =>
        i === index ? { ...step, isExpanded: !step.isExpanded } : step
      )
    );
  }, []);

  // Move step
  const moveStep = useCallback((fromIndex: number, toIndex: number) => {
    setSteps((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  // Add condition to step
  const addCondition = useCallback((stepIndex: number) => {
    setSteps((prev) =>
      prev.map((step, i) =>
        i === stepIndex
          ? {
              ...step,
              conditions: [
                ...(step.conditions || []),
                { field: "", operator: "equals" as const, value: "" },
              ],
            }
          : step
      )
    );
  }, []);

  // Update condition
  const updateCondition = useCallback(
    (
      stepIndex: number,
      conditionIndex: number,
      updates: Partial<WorkflowStepCondition>
    ) => {
      setSteps((prev) =>
        prev.map((step, i) =>
          i === stepIndex
            ? {
                ...step,
                conditions: step.conditions?.map((c, ci) =>
                  ci === conditionIndex ? { ...c, ...updates } : c
                ),
              }
            : step
        )
      );
    },
    []
  );

  // Remove condition
  const removeCondition = useCallback(
    (stepIndex: number, conditionIndex: number) => {
      setSteps((prev) =>
        prev.map((step, i) =>
          i === stepIndex
            ? {
                ...step,
                conditions: step.conditions?.filter((_, ci) => ci !== conditionIndex),
              }
            : step
        )
      );
    },
    []
  );

  // Validate workflow
  const validateWorkflow = useCallback(() => {
    const errors: string[] = [];

    if (!name.trim()) {
      errors.push("Workflow name is required");
    }

    if (steps.length === 0) {
      errors.push("At least one step is required");
    }

    steps.forEach((step, index) => {
      if (!step.name.trim()) {
        errors.push(`Step ${index + 1}: Name is required`);
      }
      if (!step.agentId) {
        errors.push(`Step ${index + 1}: Agent is required`);
      }
      if (!step.action.trim()) {
        errors.push(`Step ${index + 1}: Action is required`);
      }
    });

    return errors;
  }, [name, steps]);

  // Save workflow
  const handleSave = useCallback(async () => {
    const errors = validateWorkflow();
    if (errors.length > 0) {
      errors.forEach((err) => toast.error(err));
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name,
        description,
        triggerType,
        triggerConfig,
        steps: steps.map(({ isExpanded, ...step }) => ({
          ...step,
          agentId: step.agentId || "",
        })),
      });
      toast.success(workflowId ? "Workflow updated" : "Workflow created");
    } catch (error) {
      toast.error("Failed to save workflow");
    } finally {
      setIsSaving(false);
    }
  }, [
    validateWorkflow,
    onSave,
    name,
    description,
    triggerType,
    triggerConfig,
    steps,
    workflowId,
  ]);

  // Handle test
  const handleTest = useCallback(() => {
    const errors = validateWorkflow();
    if (errors.length > 0) {
      errors.forEach((err) => toast.error(err));
      return;
    }

    if (onTest) {
      onTest(
        steps.map(({ isExpanded, ...step }) => ({
          ...step,
          agentId: step.agentId || "",
        }))
      );
    }
  }, [validateWorkflow, onTest, steps]);

  // Drag handlers
  const handleDragStart = useCallback((index: number) => {
    setDraggedStep(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedStep !== null && draggedStep !== index) {
        moveStep(draggedStep, index);
        setDraggedStep(index);
      }
    },
    [draggedStep, moveStep]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedStep(null);
  }, []);

  // Active agents only
  const activeAgents = agents.filter((a) => a.status === "active");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/20">
            <Workflow className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">
              {workflowId ? "Edit Workflow" : "Create Workflow"}
            </h2>
            <p className="text-sm text-gray-400">
              Build multi-agent workflows with visual editor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button
              variant="ghost"
              onClick={onCancel}
              className="text-gray-400 hover:text-white"
            >
              Cancel
            </Button>
          )}
          {onTest && (
            <Button
              variant="outline"
              onClick={handleTest}
              className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10"
            >
              <Play className="h-4 w-4 mr-2" />
              Test
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Basic Info */}
        <Card className="p-4 bg-gray-900/50 border-white/10">
          <h3 className="font-medium text-white mb-4">Workflow Details</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-300">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Lead Qualification Pipeline"
                className="mt-1 bg-gray-800 border-gray-700 text-white"
                aria-label="Workflow name"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-gray-300">
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this workflow do?"
                className="mt-1 bg-gray-800 border-gray-700 text-white"
                aria-label="Workflow description"
              />
            </div>
          </div>
        </Card>

        {/* Trigger */}
        <Card className="p-4 bg-gray-900/50 border-white/10">
          <h3 className="font-medium text-white mb-4">Trigger</h3>
          <div className="grid grid-cols-2 gap-3">
            {triggerOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTriggerType(option.value)}
                className={cn(
                  "p-3 rounded-lg border text-left transition-all",
                  triggerType === option.value
                    ? "border-violet-500 bg-violet-500/10"
                    : "border-white/10 hover:border-white/20 bg-gray-800/50"
                )}
                aria-label={`Select ${option.label} trigger`}
                aria-pressed={triggerType === option.value}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      triggerType === option.value
                        ? "text-violet-400"
                        : "text-gray-400"
                    )}
                  >
                    {option.icon}
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      triggerType === option.value
                        ? "text-violet-400"
                        : "text-white"
                    )}
                  >
                    {option.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{option.description}</p>
              </button>
            ))}
          </div>

          {/* Trigger Config */}
          {triggerType === "event" && (
            <div className="mt-4">
              <Label htmlFor="eventType" className="text-gray-300">
                Event Type
              </Label>
              <Input
                id="eventType"
                value={(triggerConfig.eventType as string) || ""}
                onChange={(e) =>
                  setTriggerConfig((prev) => ({
                    ...prev,
                    eventType: e.target.value,
                  }))
                }
                placeholder="e.g., lead.created, ticket.updated"
                className="mt-1 bg-gray-800 border-gray-700 text-white"
                aria-label="Event type"
              />
            </div>
          )}

          {triggerType === "schedule" && (
            <div className="mt-4">
              <Label htmlFor="cron" className="text-gray-300">
                Cron Expression
              </Label>
              <Input
                id="cron"
                value={(triggerConfig.cron as string) || ""}
                onChange={(e) =>
                  setTriggerConfig((prev) => ({ ...prev, cron: e.target.value }))
                }
                placeholder="e.g., 0 9 * * MON (every Monday at 9am)"
                className="mt-1 bg-gray-800 border-gray-700 text-white"
                aria-label="Cron expression"
              />
            </div>
          )}
        </Card>

        {/* Steps */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-white">
              Workflow Steps ({steps.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={addStep}
              className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10"
              aria-label="Add workflow step"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Step
            </Button>
          </div>

          {steps.length === 0 ? (
            <Card className="p-8 bg-gray-900/50 border-white/10 text-center">
              <Workflow className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">No steps yet</p>
              <Button
                onClick={addStep}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Step
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "transition-opacity",
                    draggedStep === index && "opacity-50"
                  )}
                >
                  <Card className="bg-gray-900/50 border-white/10 overflow-hidden">
                    {/* Step Header */}
                    <div
                      className="flex items-center gap-3 p-3 cursor-pointer"
                      onClick={() => toggleStep(index)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && toggleStep(index)}
                      aria-expanded={step.isExpanded}
                      aria-label={`Toggle step ${index + 1}: ${step.name}`}
                    >
                      <GripVertical className="h-4 w-4 text-gray-500 cursor-grab" />
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {step.name || `Step ${index + 1}`}
                          </span>
                          {step.agentId && (
                            <Badge
                              variant="outline"
                              className="border-blue-500/50 text-blue-400"
                            >
                              {agents.find((a) => a.id === step.agentId)?.name ||
                                "Unknown Agent"}
                            </Badge>
                          )}
                        </div>
                        {step.action && (
                          <p className="text-xs text-gray-500">{step.action}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStep(index);
                        }}
                        className="text-gray-500 hover:text-red-400"
                        aria-label={`Remove step ${index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {step.isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </div>

                    {/* Step Content (Expanded) */}
                    {step.isExpanded && (
                      <div className="p-4 border-t border-white/10 space-y-4">
                        {/* Name */}
                        <div>
                          <Label className="text-gray-300">Step Name</Label>
                          <Input
                            value={step.name}
                            onChange={(e) =>
                              updateStep(index, { name: e.target.value })
                            }
                            placeholder="e.g., Qualify Lead"
                            className="mt-1 bg-gray-800 border-gray-700 text-white"
                            aria-label="Step name"
                          />
                        </div>

                        {/* Agent */}
                        <div>
                          <Label className="text-gray-300">Agent</Label>
                          <select
                            value={step.agentId || ""}
                            onChange={(e) =>
                              updateStep(index, {
                                agentId: e.target.value || null,
                              })
                            }
                            className="mt-1 w-full p-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                            aria-label="Select agent"
                          >
                            <option value="">Select an agent</option>
                            {activeAgents.map((agent) => (
                              <option key={agent.id} value={agent.id}>
                                {agent.name} ({agent.type})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Action */}
                        <div>
                          <Label className="text-gray-300">Action</Label>
                          <Input
                            value={step.action}
                            onChange={(e) =>
                              updateStep(index, { action: e.target.value })
                            }
                            placeholder="e.g., qualify_lead, generate_proposal"
                            className="mt-1 bg-gray-800 border-gray-700 text-white"
                            aria-label="Action"
                          />
                        </div>

                        {/* Timeout */}
                        <div>
                          <Label className="text-gray-300">
                            Timeout (seconds)
                          </Label>
                          <Input
                            type="number"
                            value={step.timeout || 300}
                            onChange={(e) =>
                              updateStep(index, {
                                timeout: parseInt(e.target.value) || 300,
                              })
                            }
                            className="mt-1 bg-gray-800 border-gray-700 text-white w-32"
                            aria-label="Timeout"
                          />
                        </div>

                        {/* Routing */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-300">
                              On Success → Next Step
                            </Label>
                            <select
                              value={step.onSuccess || ""}
                              onChange={(e) =>
                                updateStep(index, {
                                  onSuccess: e.target.value || undefined,
                                })
                              }
                              className="mt-1 w-full p-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                              aria-label="On success routing"
                            >
                              <option value="">Next in sequence</option>
                              {steps
                                .filter((s) => s.id !== step.id)
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div>
                            <Label className="text-gray-300">
                              On Failure → Fallback Step
                            </Label>
                            <select
                              value={step.onFailure || ""}
                              onChange={(e) =>
                                updateStep(index, {
                                  onFailure: e.target.value || undefined,
                                })
                              }
                              className="mt-1 w-full p-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                              aria-label="On failure routing"
                            >
                              <option value="">Workflow fails</option>
                              {steps
                                .filter((s) => s.id !== step.id)
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>

                        {/* Conditions */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-gray-300">
                              Conditions (all must be met)
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addCondition(index)}
                              className="text-violet-400 hover:text-violet-300"
                              aria-label="Add condition"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                          {step.conditions && step.conditions.length > 0 ? (
                            <div className="space-y-2">
                              {step.conditions.map((condition, ci) => (
                                <div
                                  key={ci}
                                  className="flex items-center gap-2 p-2 bg-gray-800/50 rounded"
                                >
                                  <Input
                                    value={condition.field}
                                    onChange={(e) =>
                                      updateCondition(index, ci, {
                                        field: e.target.value,
                                      })
                                    }
                                    placeholder="Field"
                                    className="flex-1 h-8 bg-gray-700 border-gray-600 text-white text-sm"
                                    aria-label="Condition field"
                                  />
                                  <select
                                    value={condition.operator}
                                    onChange={(e) =>
                                      updateCondition(index, ci, {
                                        operator: e.target.value as WorkflowStepCondition["operator"],
                                      })
                                    }
                                    className="h-8 px-2 rounded bg-gray-700 border border-gray-600 text-white text-sm"
                                    aria-label="Condition operator"
                                  >
                                    {conditionOperators.map((op) => (
                                      <option key={op.value} value={op.value}>
                                        {op.label}
                                      </option>
                                    ))}
                                  </select>
                                  <Input
                                    value={condition.value as string}
                                    onChange={(e) =>
                                      updateCondition(index, ci, {
                                        value: e.target.value,
                                      })
                                    }
                                    placeholder="Value"
                                    className="flex-1 h-8 bg-gray-700 border-gray-600 text-white text-sm"
                                    aria-label="Condition value"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeCondition(index, ci)}
                                    className="h-8 w-8 p-0 text-gray-500 hover:text-red-400"
                                    aria-label="Remove condition"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">
                              No conditions - step will always execute
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Arrow to next step */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center py-1">
                      <ArrowRight className="h-4 w-4 text-gray-600" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

