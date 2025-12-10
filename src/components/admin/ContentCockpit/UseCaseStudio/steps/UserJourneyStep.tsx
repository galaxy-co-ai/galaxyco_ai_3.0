"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Trash2, GripVertical, Route } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeptuneButton } from "@/components/ui/neptune-button";
import type { UseCaseFormData, JourneyStage } from "../types";

const emptyStage: JourneyStage = {
  name: "",
  description: "",
  actions: [],
  tools: [],
};

export function UserJourneyStep() {
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<UseCaseFormData>();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "journeyStages",
  });

  const journeyStages = watch("journeyStages");

  // Add an action to a stage
  const addAction = (stageIndex: number) => {
    const currentActions = journeyStages[stageIndex]?.actions || [];
    if (currentActions.length < 10) {
      setValue(`journeyStages.${stageIndex}.actions`, [...currentActions, ""]);
    }
  };

  // Remove an action from a stage
  const removeAction = (stageIndex: number, actionIndex: number) => {
    const currentActions = journeyStages[stageIndex]?.actions || [];
    setValue(
      `journeyStages.${stageIndex}.actions`,
      currentActions.filter((_, i) => i !== actionIndex)
    );
  };

  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
    if (sourceIndex !== targetIndex) {
      move(sourceIndex, targetIndex);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Define the key stages in your user's journey. These stages represent the
        progression from first awareness to ongoing success.
      </p>

      {/* Stages List */}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={cn(
              "p-4 rounded-xl border border-gray-200 bg-white",
              "hover:shadow-md transition-all duration-150"
            )}
          >
            {/* Stage Header */}
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                aria-label={`Drag to reorder stage ${index + 1}`}
              >
                <GripVertical className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                {index + 1}
              </div>

              <div className="flex-1">
                <input
                  {...register(`journeyStages.${index}.name`)}
                  type="text"
                  placeholder="Stage name (e.g., Awareness)"
                  className={cn(
                    "w-full px-3 py-1.5 rounded-lg border bg-white text-sm font-medium",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                    errors.journeyStages?.[index]?.name
                      ? "border-red-300"
                      : "border-gray-300"
                  )}
                />
              </div>

              {fields.length > 1 && (
                <NeptuneButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  aria-label={`Remove stage ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
                </NeptuneButton>
              )}
            </div>

            {/* Stage Description */}
            <div className="ml-14 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Description
                </label>
                <textarea
                  {...register(`journeyStages.${index}.description`)}
                  rows={2}
                  placeholder="What happens during this stage?"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                />
              </div>

              {/* Key Actions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-gray-500">
                    Key Actions
                  </label>
                  <button
                    type="button"
                    onClick={() => addAction(index)}
                    disabled={
                      (journeyStages[index]?.actions?.length || 0) >= 10
                    }
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
                  >
                    + Add Action
                  </button>
                </div>
                <div className="space-y-2">
                  {(journeyStages[index]?.actions || []).map(
                    (_, actionIndex) => (
                      <div key={actionIndex} className="flex items-center gap-2">
                        <input
                          {...register(
                            `journeyStages.${index}.actions.${actionIndex}`
                          )}
                          type="text"
                          placeholder="e.g., User signs up for free trial"
                          className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeAction(index, actionIndex)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label={`Remove action ${actionIndex + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    )
                  )}
                  {(journeyStages[index]?.actions?.length || 0) === 0 && (
                    <p className="text-xs text-gray-400 italic">
                      No actions defined yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Stage Button */}
      {fields.length < 10 && (
        <NeptuneButton
          type="button"
          variant="default"
          onClick={() => append(emptyStage)}
          className="w-full"
          aria-label="Add journey stage"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Stage
        </NeptuneButton>
      )}

      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Route
            className="h-12 w-12 mx-auto mb-3 text-gray-300"
            aria-hidden="true"
          />
          <p className="font-medium">No journey stages defined</p>
          <p className="text-sm mt-1">
            Add stages to map out the user's progression
          </p>
        </div>
      )}
    </div>
  );
}

