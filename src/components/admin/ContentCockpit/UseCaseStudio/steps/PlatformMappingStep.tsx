"use client";

import { useFormContext } from "react-hook-form";
import { Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_TOOLS } from "@/lib/ai/use-case-roadmap-generator";
import type { UseCaseFormData } from "../types";

// Group tools by category
const toolsByCategory = Object.entries(PLATFORM_TOOLS).reduce(
  (acc, [key, tool]) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push({ id: key, ...tool });
    return acc;
  },
  {} as Record<string, Array<{ id: string; name: string; description: string; category: string }>>
);

const categoryOrder = [
  "AI Assistant",
  "CRM",
  "Marketing",
  "Finance",
  "Operations",
  "Analytics",
];

export function PlatformMappingStep() {
  const { watch, setValue } = useFormContext<UseCaseFormData>();

  const selectedTools = watch("platformTools") || [];

  const toggleTool = (toolId: string) => {
    if (selectedTools.includes(toolId)) {
      setValue(
        "platformTools",
        selectedTools.filter((t) => t !== toolId)
      );
    } else {
      setValue("platformTools", [...selectedTools, toolId]);
    }
  };

  const selectAll = (category: string) => {
    const categoryTools = toolsByCategory[category]?.map((t) => t.id) || [];
    const allSelected = categoryTools.every((t) => selectedTools.includes(t));

    if (allSelected) {
      setValue(
        "platformTools",
        selectedTools.filter((t) => !categoryTools.includes(t))
      );
    } else {
      const newTools = new Set([...selectedTools, ...categoryTools]);
      setValue("platformTools", Array.from(newTools));
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Select which GalaxyCo platform features are most relevant for this use
        case. These will be incorporated into the generated roadmap.
      </p>

      {/* Selection Summary */}
      <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-indigo-50 border border-indigo-100">
        <span className="text-sm font-medium text-indigo-900">
          {selectedTools.length} tool{selectedTools.length !== 1 ? "s" : ""}{" "}
          selected
        </span>
        {selectedTools.length > 0 && (
          <button
            type="button"
            onClick={() => setValue("platformTools", [])}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Tools by Category */}
      <div className="space-y-6">
        {categoryOrder.map((category) => {
          const tools = toolsByCategory[category];
          if (!tools) return null;

          const categoryToolIds = tools.map((t) => t.id);
          const selectedInCategory = categoryToolIds.filter((t) =>
            selectedTools.includes(t)
          ).length;
          const allSelected = selectedInCategory === tools.length;

          return (
            <div key={category} className="space-y-3">
              {/* Category Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  {category}
                </h3>
                <button
                  type="button"
                  onClick={() => selectAll(category)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                  aria-label={
                    allSelected
                      ? `Deselect all ${category} tools`
                      : `Select all ${category} tools`
                  }
                >
                  {allSelected ? "Deselect all" : "Select all"}
                </button>
              </div>

              {/* Tools Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {tools.map((tool) => {
                  const isSelected = selectedTools.includes(tool.id);

                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => toggleTool(tool.id)}
                      className={cn(
                        "relative flex items-start gap-3 p-3 rounded-lg border text-left",
                        "transition-all duration-150",
                        "hover:-translate-y-px hover:shadow-md",
                        isSelected
                          ? "bg-indigo-50 border-indigo-300 ring-1 ring-indigo-500/20"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      )}
                      aria-pressed={isSelected}
                      aria-label={`${tool.name}: ${tool.description}`}
                    >
                      {/* Checkbox Indicator */}
                      <div
                        className={cn(
                          "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center",
                          isSelected
                            ? "bg-indigo-600 border-indigo-600"
                            : "border-gray-300"
                        )}
                      >
                        {isSelected && (
                          <Check
                            className="h-3 w-3 text-white"
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      {/* Tool Info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm font-medium",
                            isSelected ? "text-indigo-900" : "text-gray-900"
                          )}
                        >
                          {tool.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {tool.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100">
        <Info
          className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Tool selection tips</p>
          <p className="text-blue-700">
            Select tools that align with your personas' goals. The AI will
            prioritize these when generating the onboarding roadmap, ensuring
            users discover the most valuable features first.
          </p>
        </div>
      </div>
    </div>
  );
}

