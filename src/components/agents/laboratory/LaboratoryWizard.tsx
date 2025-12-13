"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles, Eye } from "lucide-react";
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

const STEPS = [
  { number: 1, label: "Choose" },
  { number: 2, label: "Customize" },
  { number: 3, label: "Activate" },
];

interface LaboratoryWizardProps {
  onComplete?: (agentId: string) => void;
  onCancel?: () => void;
  neptuneOpen?: boolean;
}

export default function LaboratoryWizard({
  onComplete,
  onCancel,
  neptuneOpen = false,
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
    <div className="flex h-full min-w-0">
      {/* Left Panel - Configurator */}
      <div className="flex-1 flex flex-col p-3 sm:p-4 md:p-6 min-h-0 min-w-0 overflow-hidden">
        {/* Header with Step Indicator */}
        <div className="flex flex-col items-center gap-2 sm:gap-3 mb-4 sm:mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Build Your Agent
            </h2>
          </div>
          <StepIndicatorCompact steps={STEPS} currentStep={step} />
        </div>

        {/* Step Content - Step 1 needs scrolling in compact mode, overflow-visible in grid mode */}
        <div className={cn(
          "flex-1 min-h-0 min-w-0", 
          step === 1 ? (neptuneOpen ? "overflow-y-auto" : "overflow-y-auto") : "overflow-y-auto"
        )}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className={cn("h-full", neptuneOpen ? "overflow-visible" : "overflow-visible")}
              >
                <ChooseBaseStep onSelect={handleSelectTemplate} neptuneOpen={neptuneOpen} />
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
          {step > 1 ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="text-gray-600 hover:-translate-y-px active:scale-[0.95] transition-all duration-150"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="bg-violet-600 hover:bg-violet-600 text-white hover:-translate-y-px hover:shadow-lg active:scale-[0.98] active:shadow-md transition-all duration-150"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={isCreating || !config.name.trim()}
              className="bg-emerald-600 hover:bg-emerald-600 text-white hover:-translate-y-px hover:shadow-lg active:scale-[0.98] active:shadow-md transition-all duration-150"
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

      {/* Right Panel - Live Preview (Desktop Only, Hidden when Neptune is open) */}
      {!neptuneOpen && (
        <div className="hidden lg:flex lg:w-80 border-l bg-gray-50/50 p-6 flex-col">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
            <Eye className="h-5 w-5 text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            Live Preview
          </h2>
        </div>
        <AgentPreviewCard config={config} template={selectedTemplate} />
      </div>
      )}
    </div>
  );
}
