"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronLeft,
  ChevronRight,
  Save,
  Loader2,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NeptuneButton } from "@/components/ui/neptune-button";
import { toast } from "sonner";
import { WIZARD_STEPS, defaultFormValues } from "./types";
import type { UseCase, UseCaseFormData } from "./types";

// Import step components
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { PersonasStep } from "./steps/PersonasStep";
import { PlatformMappingStep } from "./steps/PlatformMappingStep";
import { UserJourneyStep } from "./steps/UserJourneyStep";
import { MarketingStep } from "./steps/MarketingStep";
import { OnboardingQuestionsStep } from "./steps/OnboardingQuestionsStep";
import { ReviewStep } from "./steps/ReviewStep";

// Zod schema for form validation
const personaSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  role: z.string().max(200),
  goals: z.array(z.string().max(300)).max(10),
  painPoints: z.array(z.string().max(300)).max(10),
});

const journeyStageSchema = z.object({
  name: z.string().min(1, "Stage name is required").max(100),
  description: z.string().max(500),
  actions: z.array(z.string().max(300)).max(10),
  tools: z.array(z.string().max(100)).max(10),
});

const messagingSchema = z.object({
  tagline: z.string().max(200).optional(),
  valueProposition: z.string().max(1000).optional(),
  targetChannels: z.array(z.string().max(100)).max(10).optional(),
});

const onboardingQuestionSchema = z.object({
  question: z.string().min(1, "Question is required").max(300),
  options: z.array(z.string().max(200)).min(2, "At least 2 options required").max(6),
  matchingWeight: z.number().int().min(0).max(100),
});

const formSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000),
  category: z.enum([
    "b2b_saas",
    "b2c_app",
    "agency",
    "enterprise",
    "solopreneur",
    "ecommerce",
    "creator",
    "consultant",
    "internal_team",
    "other",
  ]),
  personas: z.array(personaSchema).max(5),
  platformTools: z.array(z.string().max(100)).max(50),
  journeyStages: z.array(journeyStageSchema).max(10),
  messaging: messagingSchema,
  onboardingQuestions: z.array(onboardingQuestionSchema).max(10),
});

interface UseCaseWizardProps {
  initialData?: UseCase;
  mode: "create" | "edit";
}

export function UseCaseWizard({ initialData, mode }: UseCaseWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Initialize form with existing data or defaults
  const methods = useForm<UseCaseFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description || "",
          category: initialData.category,
          personas: initialData.personas || [],
          platformTools: initialData.platformTools || [],
          journeyStages: initialData.journeyStages?.length
            ? initialData.journeyStages
            : defaultFormValues.journeyStages,
          messaging: initialData.messaging || defaultFormValues.messaging,
          onboardingQuestions: initialData.onboardingQuestions || [],
        }
      : defaultFormValues,
    mode: "onChange",
  });

  const { handleSubmit, formState: { errors, isDirty }, watch } = methods;

  // Watch form values for auto-save
  const formValues = watch();

  // Mark step as complete when moving forward
  const markStepComplete = useCallback((step: number) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
  }, []);

  // Auto-save on step change (debounced)
  useEffect(() => {
    if (mode === "edit" && initialData && isDirty) {
      const timer = setTimeout(() => {
        saveDraft(formValues);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formValues, mode, initialData, isDirty]);

  // Save as draft
  const saveDraft = async (data: UseCaseFormData) => {
    if (mode === "create" && !initialData) return;

    try {
      const response = await fetch(`/api/admin/use-cases/${initialData?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }
    } catch {
      // Silent fail for auto-save, user can manually save
    }
  };

  // Navigate to next step
  const goNext = async () => {
    // Validate current step
    const stepFields = getStepFields(currentStep);
    const isValid = await methods.trigger(stepFields);

    if (!isValid) {
      toast.error("Please fix the errors before continuing");
      return;
    }

    markStepComplete(currentStep);

    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Navigate to previous step
  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Get fields to validate for each step
  const getStepFields = (step: number): (keyof UseCaseFormData)[] => {
    switch (step) {
      case 0:
        return ["name", "category"];
      case 1:
        return ["personas"];
      case 2:
        return ["platformTools"];
      case 3:
        return ["journeyStages"];
      case 4:
        return ["messaging"];
      case 5:
        return ["onboardingQuestions"];
      default:
        return [];
    }
  };

  // Handle save draft button
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const data = methods.getValues();

      if (mode === "create") {
        // Create new use case
        const response = await fetch("/api/admin/use-cases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create");
        }

        const result = await response.json();
        toast.success("Use case created as draft");
        router.push(`/admin/content/use-cases/${result.useCase.id}`);
      } else {
        // Update existing
        const response = await fetch(`/api/admin/use-cases/${initialData?.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Failed to save");
        }

        toast.success("Draft saved");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save draft"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <BasicInfoStep />;
      case 1:
        return <PersonasStep />;
      case 2:
        return <PlatformMappingStep />;
      case 3:
        return <UserJourneyStep />;
      case 4:
        return <MarketingStep />;
      case 5:
        return <OnboardingQuestionsStep />;
      case 6:
        return (
          <ReviewStep
            useCaseId={initialData?.id}
            mode={mode}
            onSaveDraft={handleSaveDraft}
          />
        );
      default:
        return null;
    }
  };

  return (
    <FormProvider {...methods}>
      <div className="space-y-6">
        {/* Step Progress Indicator */}
        <nav aria-label="Wizard progress" className="mb-8">
          <ol className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => {
              const isCompleted = completedSteps.has(index);
              const isCurrent = index === currentStep;
              const isPast = index < currentStep;

              return (
                <li
                  key={step.id}
                  className="flex-1 relative"
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {/* Connector line */}
                  {index > 0 && (
                    <div
                      className={cn(
                        "absolute left-0 top-4 -translate-y-1/2 w-full h-0.5 -translate-x-1/2",
                        isPast || isCurrent
                          ? "bg-indigo-600"
                          : "bg-gray-200"
                      )}
                      style={{ width: "100%", left: "-50%" }}
                      aria-hidden="true"
                    />
                  )}

                  {/* Step button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isPast || isCompleted) {
                        setCurrentStep(index);
                      }
                    }}
                    disabled={!isPast && !isCompleted && !isCurrent}
                    className={cn(
                      "relative z-10 flex flex-col items-center gap-1 group",
                      "disabled:cursor-not-allowed"
                    )}
                    aria-label={`Step ${index + 1}: ${step.title}`}
                  >
                    <span
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                        isCurrent
                          ? "bg-indigo-600 text-white ring-4 ring-indigo-100"
                          : isPast || isCompleted
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-200 text-gray-500"
                      )}
                    >
                      {isPast || isCompleted ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium hidden sm:block",
                        isCurrent
                          ? "text-indigo-600"
                          : isPast
                            ? "text-gray-700"
                            : "text-gray-400"
                      )}
                    >
                      {step.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Step Content */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 min-h-[400px]">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {WIZARD_STEPS[currentStep].title}
            </h2>
            <p className="text-sm text-gray-500">
              {WIZARD_STEPS[currentStep].description}
            </p>
          </div>

          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4">
          <NeptuneButton
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={currentStep === 0}
            aria-label="Go to previous step"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </NeptuneButton>

          <div className="flex items-center gap-3">
            {currentStep < WIZARD_STEPS.length - 1 && (
              <NeptuneButton
                type="button"
                variant="default"
                onClick={handleSaveDraft}
                disabled={isSaving}
                aria-label="Save as draft"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                Save Draft
              </NeptuneButton>
            )}

            {currentStep < WIZARD_STEPS.length - 1 && (
              <NeptuneButton
                type="button"
                variant="primary"
                onClick={goNext}
                aria-label="Go to next step"
              >
                Next
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </NeptuneButton>
            )}
          </div>
        </div>
      </div>
    </FormProvider>
  );
}

