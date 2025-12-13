"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Bot,
  Mail,
  MessageSquare,
  FileText,
  CheckCircle2,
  Target,
  Brain,
  Calendar,
  Database,
  Workflow,
  TrendingUp,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  Zap,
  Shield,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES & CONFIG
// ============================================================================

const AGENT_TYPES = [
  {
    id: "email",
    name: "Email Agent",
    description: "Handles email drafts, replies, and inbox management",
    icon: Mail,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    capabilities: ["Draft emails", "Reply suggestions", "Inbox triage"],
  },
  {
    id: "call",
    name: "Call Agent",
    description: "Manages voice calls, transcriptions, and follow-ups",
    icon: MessageSquare,
    color: "text-green-600 bg-green-50 border-green-200",
    capabilities: ["Call scheduling", "Transcription", "Follow-up tasks"],
  },
  {
    id: "research",
    name: "Research Agent",
    description: "Gathers and synthesizes information from multiple sources",
    icon: Search,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    capabilities: ["Web research", "Data synthesis", "Report generation"],
  },
  {
    id: "content",
    name: "Content Agent",
    description: "Creates and optimizes content for various channels",
    icon: FileText,
    color: "text-pink-600 bg-pink-50 border-pink-200",
    capabilities: ["Content writing", "SEO optimization", "Social posts"],
  },
  {
    id: "sales",
    name: "Sales Agent",
    description: "Qualifies leads, manages pipelines, and tracks deals",
    icon: Target,
    color: "text-orange-600 bg-orange-50 border-orange-200",
    capabilities: ["Lead scoring", "Pipeline management", "Deal tracking"],
  },
  {
    id: "knowledge",
    name: "Knowledge Agent",
    description: "Answers questions using your company knowledge base",
    icon: Brain,
    color: "text-violet-600 bg-violet-50 border-violet-200",
    capabilities: ["Q&A", "Document search", "Knowledge retrieval"],
  },
  {
    id: "meeting",
    name: "Meeting Agent",
    description: "Schedules meetings and handles calendar coordination",
    icon: Calendar,
    color: "text-teal-600 bg-teal-50 border-teal-200",
    capabilities: ["Scheduling", "Reminders", "Notes preparation"],
  },
  {
    id: "data",
    name: "Data Agent",
    description: "Analyzes data and generates insights and reports",
    icon: Database,
    color: "text-cyan-600 bg-cyan-50 border-cyan-200",
    capabilities: ["Data analysis", "Report generation", "Trend detection"],
  },
  {
    id: "custom",
    name: "Custom Agent",
    description: "Build a custom agent with your own configuration",
    icon: Workflow,
    color: "text-gray-600 bg-gray-50 border-gray-200",
    capabilities: ["Custom workflows", "API integrations", "Flexible config"],
  },
] as const;

type AgentTypeId = (typeof AGENT_TYPES)[number]["id"];

interface AIModel {
  id: string;
  name: string;
  provider: string;
  recommended?: boolean;
  fast?: boolean;
}

const AI_MODELS: AIModel[] = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", recommended: true },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", fast: true },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { id: "claude-3-5-haiku", name: "Claude 3.5 Haiku", provider: "Anthropic", fast: true },
];

// ============================================================================
// SCHEMA
// ============================================================================

const wizardSchema = z.object({
  // Step 1: Type
  type: z.string().min(1, "Select an agent type"),
  // Step 2: Basic Info
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional(),
  // Step 3: Configuration
  model: z.string().min(1, "Select an AI model"),
  temperature: z.number().min(0).max(2),
  // Step 4: Triggers & Settings
  autoRun: z.boolean(),
  requireApproval: z.boolean(),
  maxExecutionsPerDay: z.number().min(1).max(1000),
});

type WizardForm = z.infer<typeof wizardSchema>;

// ============================================================================
// WIZARD STEPS
// ============================================================================

const STEPS = [
  { id: 1, title: "Agent Type", description: "Choose what your agent will do" },
  { id: 2, title: "Basic Info", description: "Name and describe your agent" },
  { id: 3, title: "AI Model", description: "Select the AI model to power your agent" },
  { id: 4, title: "Settings", description: "Configure triggers and limits" },
  { id: 5, title: "Review", description: "Confirm and create your agent" },
];

// ============================================================================
// COMPONENT
// ============================================================================

interface AgentCreationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AgentCreationWizard({
  open,
  onOpenChange,
  onSuccess,
}: AgentCreationWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WizardForm>({
    resolver: zodResolver(wizardSchema),
    defaultValues: {
      type: "",
      name: "",
      description: "",
      model: "gpt-4o",
      temperature: 0.7,
      autoRun: false,
      requireApproval: true,
      maxExecutionsPerDay: 100,
    },
  });

  const watchedType = form.watch("type");
  const watchedName = form.watch("name");
  const selectedAgentType = AGENT_TYPES.find((t) => t.id === watchedType);

  const handleClose = () => {
    form.reset();
    setCurrentStep(1);
    onOpenChange(false);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!watchedType;
      case 2:
        return !!watchedName && watchedName.length > 0;
      case 3:
        return !!form.watch("model");
      case 4:
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    const values = form.getValues();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          description: values.description || null,
          type: values.type,
          status: values.autoRun ? "active" : "draft",
          config: {
            model: values.model,
            temperature: values.temperature,
            requireApproval: values.requireApproval,
            maxExecutionsPerDay: values.maxExecutionsPerDay,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create agent");
      }

      toast.success(`${values.name} created successfully!`);
      handleClose();
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create agent"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100">
              <Sparkles className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Create New Agent</DialogTitle>
              <DialogDescription>
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].title}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress */}
        <div className="px-1 mt-2">
          <Progress value={progress} className="h-1.5" />
          <div className="flex justify-between mt-2">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "text-xs transition-colors",
                  step.id <= currentStep ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.id === currentStep ? step.title : ""}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px] overflow-y-auto py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 1: Agent Type */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {AGENT_TYPES.map((type) => {
                      const Icon = type.icon;
                      const isSelected = watchedType === type.id;
                      return (
                        <Card
                          key={type.id}
                          className={cn(
                            "p-4 cursor-pointer transition-all hover:shadow-md border-2",
                            isSelected
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-transparent hover:border-muted-foreground/20"
                          )}
                          onClick={() => form.setValue("type", type.id)}
                        >
                          <div
                            className={cn(
                              "p-2 rounded-lg w-fit border",
                              type.color
                            )}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <h4 className="font-semibold mt-3 text-sm">
                            {type.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {type.description}
                          </p>
                          {isSelected && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {type.capabilities.map((cap) => (
                                <Badge
                                  key={cap}
                                  variant="secondary"
                                  className="text-[10px]"
                                >
                                  {cap}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 2: Basic Info */}
              {currentStep === 2 && (
                <div className="space-y-6 max-w-md mx-auto">
                  {selectedAgentType && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <selectedAgentType.icon className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {selectedAgentType.name}
                      </span>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="name">Agent Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Email Assistant"
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="text-xs text-destructive">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="What will this agent do?"
                      rows={3}
                      {...form.register("description")}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: AI Model */}
              {currentStep === 3 && (
                <div className="space-y-4 max-w-md mx-auto">
                  <RadioGroup
                    value={form.watch("model")}
                    onValueChange={(v) => form.setValue("model", v)}
                    className="space-y-3"
                  >
                    {AI_MODELS.map((model) => (
                      <div
                        key={model.id}
                        className={cn(
                          "flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                          form.watch("model") === model.id
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-muted-foreground/30"
                        )}
                        onClick={() => form.setValue("model", model.id)}
                      >
                        <RadioGroupItem value={model.id} id={model.id} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <label
                              htmlFor={model.id}
                              className="font-medium cursor-pointer"
                            >
                              {model.name}
                            </label>
                            {model.recommended && (
                              <Badge variant="secondary" className="text-[10px]">
                                Recommended
                              </Badge>
                            )}
                            {model.fast && (
                              <Badge
                                variant="outline"
                                className="text-[10px] text-green-600 border-green-200"
                              >
                                <Zap className="h-3 w-3 mr-1" />
                                Fast
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {model.provider}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>

                  <div className="space-y-3 pt-4">
                    <div className="flex items-center justify-between">
                      <Label>Creativity (Temperature)</Label>
                      <span className="text-sm font-medium">
                        {form.watch("temperature")}
                      </span>
                    </div>
                    <Slider
                      value={[form.watch("temperature")]}
                      onValueChange={([v]) => form.setValue("temperature", v)}
                      min={0}
                      max={2}
                      step={0.1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Precise</span>
                      <span>Balanced</span>
                      <span>Creative</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Settings */}
              {currentStep === 4 && (
                <div className="space-y-6 max-w-md mx-auto">
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-50">
                        <Zap className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Auto-Run</p>
                        <p className="text-xs text-muted-foreground">
                          Start agent immediately after creation
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={form.watch("autoRun")}
                      onCheckedChange={(v) => form.setValue("autoRun", v)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-50">
                        <Shield className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Require Approval</p>
                        <p className="text-xs text-muted-foreground">
                          Review actions before they execute
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={form.watch("requireApproval")}
                      onCheckedChange={(v) => form.setValue("requireApproval", v)}
                    />
                  </div>

                  <div className="space-y-3 p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">Daily Limit</p>
                          <span className="text-sm font-medium">
                            {form.watch("maxExecutionsPerDay")}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Max executions per day
                        </p>
                      </div>
                    </div>
                    <Slider
                      value={[form.watch("maxExecutionsPerDay")]}
                      onValueChange={([v]) =>
                        form.setValue("maxExecutionsPerDay", v)
                      }
                      min={1}
                      max={500}
                      step={10}
                    />
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {currentStep === 5 && (
                <div className="space-y-6 max-w-md mx-auto">
                  <Card className="p-6">
                    <div className="flex items-start gap-4">
                      {selectedAgentType && (
                        <div
                          className={cn(
                            "p-3 rounded-xl border",
                            selectedAgentType.color
                          )}
                        >
                          <selectedAgentType.icon className="h-6 w-6" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {form.watch("name")}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {form.watch("description") || "No description"}
                        </p>
                        <Badge variant="secondary" className="mt-2">
                          {selectedAgentType?.name}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">AI Model</span>
                        <span className="font-medium">
                          {AI_MODELS.find((m) => m.id === form.watch("model"))
                            ?.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Temperature</span>
                        <span className="font-medium">
                          {form.watch("temperature")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Auto-Run</span>
                        <span className="font-medium">
                          {form.watch("autoRun") ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Require Approval
                        </span>
                        <span className="font-medium">
                          {form.watch("requireApproval") ? "Yes" : "No"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Daily Limit</span>
                        <span className="font-medium">
                          {form.watch("maxExecutionsPerDay")} executions
                        </span>
                      </div>
                    </div>
                  </Card>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
                    <Check className="h-4 w-4" />
                    <span>Ready to create your agent</span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {currentStep < STEPS.length ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Create Agent
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
