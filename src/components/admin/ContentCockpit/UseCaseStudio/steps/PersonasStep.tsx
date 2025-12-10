"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Trash2, User, Target, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeptuneButton } from "@/components/ui/neptune-button";
import type { UseCaseFormData, Persona } from "../types";

const emptyPersona: Persona = {
  name: "",
  role: "",
  goals: [],
  painPoints: [],
};

export function PersonasStep() {
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<UseCaseFormData>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "personas",
  });

  const personas = watch("personas");

  // Add a goal to a persona
  const addGoal = (personaIndex: number) => {
    const currentGoals = personas[personaIndex]?.goals || [];
    if (currentGoals.length < 10) {
      setValue(`personas.${personaIndex}.goals`, [...currentGoals, ""]);
    }
  };

  // Remove a goal from a persona
  const removeGoal = (personaIndex: number, goalIndex: number) => {
    const currentGoals = personas[personaIndex]?.goals || [];
    setValue(
      `personas.${personaIndex}.goals`,
      currentGoals.filter((_, i) => i !== goalIndex)
    );
  };

  // Add a pain point to a persona
  const addPainPoint = (personaIndex: number) => {
    const currentPainPoints = personas[personaIndex]?.painPoints || [];
    if (currentPainPoints.length < 10) {
      setValue(`personas.${personaIndex}.painPoints`, [
        ...currentPainPoints,
        "",
      ]);
    }
  };

  // Remove a pain point from a persona
  const removePainPoint = (personaIndex: number, painIndex: number) => {
    const currentPainPoints = personas[personaIndex]?.painPoints || [];
    setValue(
      `personas.${personaIndex}.painPoints`,
      currentPainPoints.filter((_, i) => i !== painIndex)
    );
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600">
        Define 1-5 target personas for this use case. Each persona represents a
        type of user who would benefit from this workflow.
      </p>

      {/* Personas List */}
      <div className="space-y-6">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="p-5 rounded-xl border border-gray-200 bg-gray-50/50 space-y-4"
          >
            {/* Persona Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                </div>
                <span className="font-medium text-gray-900">
                  Persona {index + 1}
                </span>
              </div>
              <NeptuneButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                aria-label={`Remove persona ${index + 1}`}
              >
                <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
              </NeptuneButton>
            </div>

            {/* Name & Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor={`persona-name-${index}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register(`personas.${index}.name`)}
                  id={`persona-name-${index}`}
                  type="text"
                  placeholder="e.g., Startup Sarah"
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border bg-white text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                    errors.personas?.[index]?.name
                      ? "border-red-300"
                      : "border-gray-300"
                  )}
                />
                {errors.personas?.[index]?.name && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.personas[index]?.name?.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`persona-role-${index}`}
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Role/Title
                </label>
                <input
                  {...register(`personas.${index}.role`)}
                  id={`persona-role-${index}`}
                  type="text"
                  placeholder="e.g., Founder & CEO"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Goals */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  Goals
                </label>
                <NeptuneButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addGoal(index)}
                  disabled={(personas[index]?.goals?.length || 0) >= 10}
                  aria-label="Add goal"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  Add
                </NeptuneButton>
              </div>
              <div className="space-y-2">
                {(personas[index]?.goals || []).map((_, goalIndex) => (
                  <div key={goalIndex} className="flex items-center gap-2">
                    <input
                      {...register(`personas.${index}.goals.${goalIndex}`)}
                      type="text"
                      placeholder="e.g., Scale to $1M ARR"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeGoal(index, goalIndex)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label={`Remove goal ${goalIndex + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {(personas[index]?.goals?.length || 0) === 0 && (
                  <p className="text-xs text-gray-400 italic">
                    No goals added yet. Click &quot;Add&quot; to add one.
                  </p>
                )}
              </div>
            </div>

            {/* Pain Points */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <AlertTriangle
                    className="h-4 w-4 text-amber-500"
                    aria-hidden="true"
                  />
                  Pain Points
                </label>
                <NeptuneButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => addPainPoint(index)}
                  disabled={(personas[index]?.painPoints?.length || 0) >= 10}
                  aria-label="Add pain point"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  Add
                </NeptuneButton>
              </div>
              <div className="space-y-2">
                {(personas[index]?.painPoints || []).map((_, painIndex) => (
                  <div key={painIndex} className="flex items-center gap-2">
                    <input
                      {...register(`personas.${index}.painPoints.${painIndex}`)}
                      type="text"
                      placeholder="e.g., Too many tools to manage"
                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => removePainPoint(index, painIndex)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label={`Remove pain point ${painIndex + 1}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {(personas[index]?.painPoints?.length || 0) === 0 && (
                  <p className="text-xs text-gray-400 italic">
                    No pain points added yet. Click &quot;Add&quot; to add one.
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Persona Button */}
      {fields.length < 5 && (
        <NeptuneButton
          type="button"
          variant="default"
          onClick={() => append(emptyPersona)}
          className="w-full"
          aria-label="Add new persona"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Persona
        </NeptuneButton>
      )}

      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <User className="h-12 w-12 mx-auto mb-3 text-gray-300" aria-hidden="true" />
          <p className="font-medium">No personas yet</p>
          <p className="text-sm mt-1">
            Add at least one persona to describe your target users
          </p>
        </div>
      )}

      {fields.length >= 5 && (
        <p className="text-sm text-amber-600 text-center">
          Maximum of 5 personas reached
        </p>
      )}
    </div>
  );
}

