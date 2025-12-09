"use client";

import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  Users,
  Bot,
  Settings,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import {
  teamTemplates,
  type TeamTemplate,
  type AgentTemplate,
} from "@/lib/orchestration/team-templates";
import type { AgentDepartment, TeamAutonomyLevel } from "@/lib/orchestration/types";

// Department display config
const departmentDisplay: Record<AgentDepartment, { icon: string; label: string }> = {
  sales: { icon: "💰", label: "Sales" },
  marketing: { icon: "📢", label: "Marketing" },
  support: { icon: "🎧", label: "Support" },
  operations: { icon: "⚙️", label: "Operations" },
  finance: { icon: "💳", label: "Finance" },
  product: { icon: "🚀", label: "Product" },
  general: { icon: "🤖", label: "General" },
};

const autonomyLevels: Array<{
  value: TeamAutonomyLevel;
  label: string;
  description: string;
}> = [
  {
    value: "supervised",
    label: "Supervised",
    description: "All actions require human approval",
  },
  {
    value: "semi_autonomous",
    label: "Semi-Autonomous",
    description: "Low-risk actions execute automatically",
  },
  {
    value: "autonomous",
    label: "Autonomous",
    description: "Most actions execute without approval",
  },
];

type WizardStep = "template" | "customize" | "agents" | "confirm";

interface TeamCreationWizardProps {
  onClose: () => void;
  onComplete: (teamId: string) => void;
  existingAgents?: Array<{ id: string; name: string; type: string }>;
}

export default function TeamCreationWizard({
  onClose,
  onComplete,
  existingAgents = [],
}: TeamCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("template");
  const [isCreating, setIsCreating] = useState(false);

  // Selected template and configuration
  const [selectedTemplate, setSelectedTemplate] = useState<TeamTemplate | null>(null);
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [autonomyLevel, setAutonomyLevel] = useState<TeamAutonomyLevel>("semi_autonomous");
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [createNewAgents, setCreateNewAgents] = useState(true);

  const steps: WizardStep[] = ["template", "customize", "agents", "confirm"];
  const currentStepIndex = steps.indexOf(currentStep);

  // Navigation
  const goBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  }, [currentStepIndex, steps]);

  const goNext = useCallback(() => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  }, [currentStepIndex, steps]);

  // Template selection
  const handleSelectTemplate = useCallback((template: TeamTemplate) => {
    setSelectedTemplate(template);
    setTeamName(template.name);
    setTeamDescription(template.description);
    setAutonomyLevel(
      (template.config.autonomyLevel as TeamAutonomyLevel) || "semi_autonomous"
    );
    goNext();
  }, [goNext]);

  // Agent selection toggle
  const toggleAgentSelection = useCallback((agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  }, []);

  // Create team
  const handleCreateTeam = useCallback(async () => {
    if (!selectedTemplate) {
      toast.error("Please select a template");
      return;
    }

    if (!teamName.trim()) {
      toast.error("Please enter a team name");
      return;
    }

    setIsCreating(true);

    try {
      // Step 1: Create the team
      const teamResponse = await fetch("/api/orchestration/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: teamName,
          department: selectedTemplate.department,
          description: teamDescription,
          config: {
            autonomyLevel,
            approvalRequired: selectedTemplate.config.approvalRequired || [],
            maxConcurrentTasks: selectedTemplate.config.maxConcurrentTasks || 10,
            capabilities: selectedTemplate.config.capabilities || [],
          },
        }),
      });

      if (!teamResponse.ok) {
        const errorData = await teamResponse.json();
        throw new Error(errorData.error || "Failed to create team");
      }

      const { team } = await teamResponse.json();
      const teamId = team.id;

      // Step 2: Create agents from template (if selected)
      if (createNewAgents && selectedTemplate.agents.length > 0) {
        for (const agentTemplate of selectedTemplate.agents) {
          try {
            // Create agent
            const agentResponse = await fetch("/api/agents", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: agentTemplate.name,
                type: agentTemplate.type,
                description: agentTemplate.description,
                config: {
                  capabilities: agentTemplate.capabilities,
                  tools: agentTemplate.tools,
                  systemPrompt: agentTemplate.systemPrompt,
                },
              }),
            });

            if (agentResponse.ok) {
              const { agent } = await agentResponse.json();

              // Add agent to team
              await fetch(`/api/orchestration/teams/${teamId}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  agentId: agent.id,
                  role: agentTemplate.role,
                  priority: agentTemplate.priority,
                  config: {
                    specializations: agentTemplate.specializations,
                  },
                }),
              });
            }
          } catch (agentError) {
            logger.error("Failed to create agent from template", agentError);
            // Continue with other agents
          }
        }
      }

      // Step 3: Add existing selected agents (if any)
      for (const agentId of selectedAgents) {
        try {
          await fetch(`/api/orchestration/teams/${teamId}/members`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              agentId,
              role: "specialist",
              priority: 5,
            }),
          });
        } catch (memberError) {
          logger.error("Failed to add existing agent to team", memberError);
        }
      }

      toast.success(`Team "${teamName}" created successfully!`);
      onComplete(teamId);
    } catch (error) {
      logger.error("Failed to create team", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create team. Please try again."
      );
    } finally {
      setIsCreating(false);
    }
  }, [
    selectedTemplate,
    teamName,
    teamDescription,
    autonomyLevel,
    createNewAgents,
    selectedAgents,
    onComplete,
  ]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "template":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Choose a Department Template
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Start with a pre-configured team or customize from scratch
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {teamTemplates.map((template) => {
                const dept = departmentDisplay[template.department];
                return (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all duration-200",
                      "hover:border-primary hover:shadow-md hover:-translate-y-0.5",
                      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    )}
                    aria-label={`Select ${template.name} template`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{dept.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {template.name}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {template.agents.length} agents included
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {template.benefits.slice(0, 2).map((benefit, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {benefit.length > 25
                            ? benefit.slice(0, 25) + "..."
                            : benefit}
                        </Badge>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case "customize":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Customize Your Team
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Personalize the team settings for your needs
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="team-name">Team Name</Label>
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team name"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="team-description">Description</Label>
                <textarea
                  id="team-description"
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  placeholder="Describe what this team does..."
                  className="mt-1.5 w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <Label>Autonomy Level</Label>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {autonomyLevels.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => setAutonomyLevel(level.value)}
                      className={cn(
                        "p-3 rounded-lg border-2 text-left transition-all",
                        autonomyLevel === level.value
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="font-medium text-sm">{level.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {level.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case "agents":
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Configure Team Agents
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Create new agents from template or add existing ones
              </p>
            </div>

            {/* Create from template toggle */}
            <button
              onClick={() => setCreateNewAgents(!createNewAgents)}
              className={cn(
                "w-full p-4 rounded-lg border-2 text-left transition-all",
                createNewAgents
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    createNewAgents ? "bg-primary text-white" : "bg-gray-100"
                  )}
                >
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Create agents from template</div>
                  <div className="text-sm text-gray-500">
                    {selectedTemplate?.agents.length || 0} pre-configured agents
                  </div>
                </div>
                {createNewAgents && <Check className="h-5 w-5 text-primary" />}
              </div>
            </button>

            {createNewAgents && selectedTemplate && (
              <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Agents to be created:
                </div>
                {selectedTemplate.agents.map((agent, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-white rounded border"
                  >
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-sm">{agent.name}</span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {agent.role}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">{agent.type}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Existing agents */}
            {existingAgents.length > 0 && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">
                      Or add existing agents
                    </span>
                  </div>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {existingAgents.map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => toggleAgentSelection(agent.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all",
                        selectedAgents.includes(agent.id)
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-sm">{agent.name}</span>
                        <span className="text-xs text-gray-500">{agent.type}</span>
                      </div>
                      {selectedAgents.includes(agent.id) && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        );

      case "confirm":
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <Users className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Ready to Create Your Team
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Review your configuration before creating
              </p>
            </div>

            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Team Name</span>
                <span className="font-medium">{teamName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Department</span>
                <Badge variant="outline" className="capitalize">
                  {departmentDisplay[selectedTemplate?.department || "general"].icon}{" "}
                  {selectedTemplate?.department}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Autonomy Level</span>
                <span className="font-medium capitalize">
                  {autonomyLevel.replace("_", " ")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">New Agents</span>
                <span className="font-medium">
                  {createNewAgents ? selectedTemplate?.agents.length || 0 : 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Existing Agents</span>
                <span className="font-medium">{selectedAgents.length}</span>
              </div>
            </Card>

            {teamDescription && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Description</div>
                <p className="text-sm text-gray-700">{teamDescription}</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <h2 className="font-semibold text-lg">Create Agent Team</h2>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            aria-label="Close wizard"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step} className="flex items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    index < currentStepIndex
                      ? "bg-primary text-white"
                      : index === currentStepIndex
                      ? "bg-primary/10 text-primary border-2 border-primary"
                      : "bg-gray-100 text-gray-400"
                  )}
                >
                  {index < currentStepIndex ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-16 h-0.5 mx-2",
                      index < currentStepIndex ? "bg-primary" : "bg-gray-200"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>Template</span>
            <span>Customize</span>
            <span>Agents</span>
            <span>Confirm</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{renderStepContent()}</div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <Button
            variant="outline"
            onClick={currentStepIndex === 0 ? onClose : goBack}
            className="gap-1"
          >
            {currentStepIndex === 0 ? (
              "Cancel"
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                Back
              </>
            )}
          </Button>

          {currentStep === "confirm" ? (
            <Button
              onClick={handleCreateTeam}
              disabled={isCreating}
              className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Create Team
                </>
              )}
            </Button>
          ) : currentStep === "template" ? null : (
            <Button onClick={goNext} className="gap-1">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

