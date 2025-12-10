"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormContext } from "react-hook-form";
import {
  Sparkles,
  Users,
  Route,
  Megaphone,
  HelpCircle,
  Wrench,
  Check,
  Loader2,
  FileText,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NeptuneButton } from "@/components/ui/neptune-button";
import { toast } from "sonner";
import { CATEGORY_OPTIONS } from "../types";
import type { UseCaseFormData, RoadmapStep } from "../types";

interface ReviewStepProps {
  useCaseId?: string;
  mode: "create" | "edit";
  onSaveDraft: () => Promise<void>;
}

export function ReviewStep({ useCaseId, mode, onSaveDraft }: ReviewStepProps) {
  const router = useRouter();
  const { getValues } = useFormContext<UseCaseFormData>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generatedRoadmap, setGeneratedRoadmap] = useState<RoadmapStep[]>([]);

  const data = getValues();

  const categoryLabel =
    CATEGORY_OPTIONS.find((c) => c.value === data.category)?.label ||
    data.category;

  // Generate AI roadmap
  const handleGenerateRoadmap = async () => {
    if (!useCaseId) {
      // Need to save first
      toast.error("Please save as draft first before generating roadmap");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(
        `/api/admin/use-cases/${useCaseId}/generate-roadmap`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate");
      }

      const result = await response.json();
      setGeneratedRoadmap(result.roadmap);
      toast.success("Roadmap generated successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate roadmap"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Publish the use case
  const handlePublish = async () => {
    if (!useCaseId) {
      toast.error("Please save as draft first");
      return;
    }

    if (generatedRoadmap.length === 0) {
      toast.error("Please generate a roadmap first");
      return;
    }

    setIsPublishing(true);
    try {
      const response = await fetch(`/api/admin/use-cases/${useCaseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          status: "published",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to publish");
      }

      toast.success("Use case published!");
      router.push("/admin/content/use-cases");
    } catch (error) {
      toast.error("Failed to publish use case");
    } finally {
      setIsPublishing(false);
    }
  };

  // Completion checklist
  const checklist = [
    { label: "Name", complete: !!data.name },
    { label: "Category", complete: !!data.category },
    { label: "At least 1 persona", complete: data.personas.length > 0 },
    { label: "Platform tools selected", complete: data.platformTools.length > 0 },
    { label: "Journey stages defined", complete: data.journeyStages.some((s) => s.name) },
    { label: "Roadmap generated", complete: generatedRoadmap.length > 0 },
  ];

  const completedCount = checklist.filter((c) => c.complete).length;
  const isComplete = completedCount === checklist.length;

  return (
    <div className="space-y-6">
      {/* Completion Progress */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-gray-900">Completion Status</span>
          <span
            className={cn(
              "text-sm font-medium px-2.5 py-0.5 rounded-full",
              isComplete
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            )}
          >
            {completedCount}/{checklist.length}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {checklist.map((item) => (
            <div
              key={item.label}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                item.complete ? "bg-white/80" : "bg-white/40"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center",
                  item.complete ? "bg-emerald-500" : "bg-gray-300"
                )}
              >
                {item.complete && (
                  <Check className="h-3 w-3 text-white" aria-hidden="true" />
                )}
              </div>
              <span
                className={item.complete ? "text-gray-900" : "text-gray-500"}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Info */}
        <SummaryCard
          icon={FileText}
          title="Basic Info"
          items={[
            { label: "Name", value: data.name || "Not set" },
            { label: "Category", value: categoryLabel },
          ]}
        />

        {/* Personas */}
        <SummaryCard
          icon={Users}
          title="Personas"
          items={[
            {
              label: "Count",
              value: `${data.personas.length} persona${data.personas.length !== 1 ? "s" : ""}`,
            },
            {
              label: "Names",
              value:
                data.personas.map((p) => p.name).join(", ") || "None added",
            },
          ]}
        />

        {/* Platform */}
        <SummaryCard
          icon={Wrench}
          title="Platform Tools"
          items={[
            {
              label: "Selected",
              value: `${data.platformTools.length} tool${data.platformTools.length !== 1 ? "s" : ""}`,
            },
          ]}
        />

        {/* Journey */}
        <SummaryCard
          icon={Route}
          title="User Journey"
          items={[
            {
              label: "Stages",
              value: `${data.journeyStages.filter((s) => s.name).length} stage${data.journeyStages.filter((s) => s.name).length !== 1 ? "s" : ""}`,
            },
          ]}
        />

        {/* Marketing */}
        <SummaryCard
          icon={Megaphone}
          title="Marketing"
          items={[
            {
              label: "Tagline",
              value: data.messaging?.tagline || "Not set",
            },
            {
              label: "Channels",
              value: `${data.messaging?.targetChannels?.filter((c) => !c.startsWith("tone:")).length || 0} selected`,
            },
          ]}
        />

        {/* Questions */}
        <SummaryCard
          icon={HelpCircle}
          title="Quiz Questions"
          items={[
            {
              label: "Count",
              value: `${data.onboardingQuestions.length} question${data.onboardingQuestions.length !== 1 ? "s" : ""}`,
            },
          ]}
        />
      </div>

      {/* Generate Roadmap Section */}
      <div className="p-5 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/30">
        <div className="text-center">
          <Sparkles
            className="h-10 w-10 mx-auto text-indigo-500 mb-3"
            aria-hidden="true"
          />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Generate AI Roadmap
          </h3>
          <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
            Based on your personas, tools, and journey stages, AI will create a
            personalized onboarding roadmap for this use case.
          </p>
          <NeptuneButton
            type="button"
            variant="primary"
            size="lg"
            onClick={handleGenerateRoadmap}
            disabled={isGenerating || !useCaseId || data.personas.length === 0}
            aria-label="Generate AI roadmap"
          >
            {isGenerating ? (
              <>
                <Loader2
                  className="h-5 w-5 animate-spin"
                  aria-hidden="true"
                />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" aria-hidden="true" />
                Generate Roadmap
              </>
            )}
          </NeptuneButton>
          {!useCaseId && (
            <p className="text-xs text-amber-600 mt-2">
              Save as draft first to enable roadmap generation
            </p>
          )}
        </div>
      </div>

      {/* Generated Roadmap Preview */}
      {generatedRoadmap.length > 0 && (
        <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/50">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Check className="h-5 w-5 text-emerald-500" aria-hidden="true" />
            Generated Roadmap ({generatedRoadmap.length} steps)
          </h3>
          <div className="space-y-3">
            {generatedRoadmap.map((step) => (
              <div
                key={step.step}
                className="flex gap-3 p-3 rounded-lg bg-white border border-gray-100"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-sm font-bold text-indigo-600">
                  {step.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{step.title}</p>
                  <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                    {step.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      {step.estimatedMinutes} min
                    </span>
                    {step.tools.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Wrench className="h-3 w-3" aria-hidden="true" />
                        {step.tools.length} tool
                        {step.tools.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <NeptuneButton
          type="button"
          variant="default"
          onClick={onSaveDraft}
          aria-label="Save as draft"
        >
          Save as Draft
        </NeptuneButton>
        <NeptuneButton
          type="button"
          variant="success"
          onClick={handlePublish}
          disabled={isPublishing || !isComplete}
          aria-label="Publish use case"
        >
          {isPublishing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Publishing...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              Publish
            </>
          )}
        </NeptuneButton>
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ElementType;
  title: string;
  items: { label: string; value: string }[];
}) {
  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
          <Icon className="h-4 w-4 text-gray-600" aria-hidden="true" />
        </div>
        <span className="font-medium text-gray-900">{title}</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between text-sm">
            <span className="text-gray-500">{item.label}</span>
            <span className="text-gray-900 font-medium truncate ml-2 max-w-[60%]">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

