"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import ChooseBaseStep from "./steps/ChooseBaseStep";
import CustomizeStep from "./steps/CustomizeStep";
import ActivateStep from "./steps/ActivateStep";
import AgentPreviewCard from "./AgentPreviewCard";
import { StepIndicatorCompact } from "@/components/creator/StepIndicator";

import type { AgentConfig, AgentTemplate } from "./types";
import { DEFAULT_AGENT_CONFIG } from "./types";
import { getTemplateById } from "./templates";

const STEPS = [
  { number: 1, label: "Choose" },
  { number: 2, label: "Customize" },
  { number: 3, label: "Activate" },
];

interface LaboratoryWizardProps {
  onComplete?: (agentId: string) => void;
  onCancel?: () => void;
}

export default function LaboratoryWizard({
  onComplete,
  onCancel,
}: LaboratoryWizardProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<AgentConfig>(DEFAULT_AGENT_CONFIG);
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Handle template selection
  const handleSelectTemplate = useCallback((template: AgentTemplate | null) => {
    setSelectedTemplate(template);
    
    if (template) {
      // Pre-fill config from template with personalized name
      setConfig({
        name: `My ${template.name}`,
        description: template.description,
        type: template.type,
        tone: "professional",
        capabilities: template.capabilities,
        trigger: { type: "manual" },
        systemPrompt: template.systemPrompt,
        templateId: template.id,
        icon: template.icon,
      });
    } else {
      // Blank agent - generate a unique name with timestamp
      const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).replace(/[:\s]/g, '');
      setConfig({
        ...DEFAULT_AGENT_CONFIG,
        name: `Custom Agent ${timestamp}`,
        description: "A custom AI agent that can be configured to automate tasks, answer questions, and work with your data.",
      });
    }
    
    setStep(2);
  }, []);

  // Handle config updates
  const handleUpdateConfig = useCallback((updates: Partial<AgentConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  // Handle step navigation
  const handleNext = useCallback(() => {
    if (step < 3) {
      setStep(step + 1);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  // Handle agent creation
  const handleCreate = useCallback(async () => {
    if (!config.name.trim()) {
      toast.error("Please give your agent a name");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          type: config.type,
          status: "active",
          config: {
            tone: config.tone,
            capabilities: config.capabilities,
            trigger: config.trigger,
            systemPrompt: config.systemPrompt,
            templateId: config.templateId,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create agent");
      }

      const agent = await response.json();
      toast.success(`${config.name} is now active!`, {
        description: "Your agent is ready to work",
      });
      onComplete?.(agent.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create agent"
      );
    } finally {
      setIsCreating(false);
    }
  }, [config, onComplete]);

  // Validation for next button
  const canProceed = step === 1 || (step === 2 && config.name.trim().length > 0);

  return (
    <div className="flex h-full">
      {/* Left Panel - Configurator */}
      <div className="flex-1 flex flex-col p-6 min-h-0">
        {/* Header with Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Agent Laboratory
              </h2>
              <p className="text-sm text-gray-500">
                {step === 1 && "Choose a template or start from scratch"}
                {step === 2 && "Customize your agent's behavior"}
                {step === 3 && "Review and activate"}
              </p>
            </div>
          </div>
          <StepIndicatorCompact steps={STEPS} currentStep={step} />
        </div>

        {/* Step Content - Step 1 needs overflow-visible for badges, Steps 2-3 need scrolling */}
        <div className={cn("flex-1 min-h-0", step === 1 ? "overflow-visible" : "overflow-hidden")}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-visible"
              >
                <ChooseBaseStep onSelect={handleSelectTemplate} />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto"
              >
                <CustomizeStep
                  config={config}
                  template={selectedTemplate}
                  onUpdate={handleUpdateConfig}
                />
              </motion.div>
            )}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto"
              >
                <ActivateStep
                  config={config}
                  template={selectedTemplate}
                  onUpdate={handleUpdateConfig}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={step === 1 ? onCancel : handleBack}
            className="text-gray-600"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step === 1 ? "Cancel" : "Back"}
          </Button>

          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              Continue
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={isCreating || !config.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isCreating ? (
                <>
                  <motion.div
                    className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Activate Agent
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Right Panel - Live Preview */}
      <div className="w-80 border-l bg-gray-50/50 p-6 flex flex-col">
        <div className="text-sm font-medium text-gray-500 mb-4">Live Preview</div>
        <AgentPreviewCard config={config} template={selectedTemplate} />
      </div>
    </div>
  );
}
