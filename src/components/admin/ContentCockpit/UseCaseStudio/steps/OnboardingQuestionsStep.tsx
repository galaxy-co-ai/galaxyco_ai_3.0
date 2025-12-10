"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Plus, Trash2, HelpCircle, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { NeptuneButton } from "@/components/ui/neptune-button";
import type { UseCaseFormData, OnboardingQuestion } from "../types";

const emptyQuestion: OnboardingQuestion = {
  question: "",
  options: ["", ""],
  matchingWeight: 50,
};

export function OnboardingQuestionsStep() {
  const {
    register,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<UseCaseFormData>();

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "onboardingQuestions",
  });

  const questions = watch("onboardingQuestions") || [];

  // Add an option to a question
  const addOption = (questionIndex: number) => {
    const currentOptions = questions[questionIndex]?.options || [];
    if (currentOptions.length < 6) {
      setValue(`onboardingQuestions.${questionIndex}.options`, [
        ...currentOptions,
        "",
      ]);
    }
  };

  // Remove an option from a question
  const removeOption = (questionIndex: number, optionIndex: number) => {
    const currentOptions = questions[questionIndex]?.options || [];
    if (currentOptions.length > 2) {
      setValue(
        `onboardingQuestions.${questionIndex}.options`,
        currentOptions.filter((_, i) => i !== optionIndex)
      );
    }
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
        Build 3-5 quiz questions to match new users to this use case. Each
        question helps determine if this workflow is right for them.
      </p>

      {/* Questions List */}
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
            {/* Question Header */}
            <div className="flex items-start gap-3 mb-4">
              <button
                type="button"
                className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 mt-2"
                aria-label={`Drag to reorder question ${index + 1}`}
              >
                <GripVertical className="h-5 w-5" aria-hidden="true" />
              </button>

              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">
                    Question {index + 1}
                  </span>
                  <NeptuneButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    aria-label={`Remove question ${index + 1}`}
                  >
                    <Trash2
                      className="h-4 w-4 text-red-500"
                      aria-hidden="true"
                    />
                  </NeptuneButton>
                </div>

                {/* Question Text */}
                <input
                  {...register(`onboardingQuestions.${index}.question`)}
                  type="text"
                  placeholder="e.g., What's your primary business goal?"
                  className={cn(
                    "w-full px-3 py-2 rounded-lg border bg-white text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
                    errors.onboardingQuestions?.[index]?.question
                      ? "border-red-300"
                      : "border-gray-300"
                  )}
                />
                {errors.onboardingQuestions?.[index]?.question && (
                  <p className="text-xs text-red-600">
                    {errors.onboardingQuestions[index]?.question?.message}
                  </p>
                )}

                {/* Answer Options */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-500">
                      Answer Options
                    </label>
                    <button
                      type="button"
                      onClick={() => addOption(index)}
                      disabled={
                        (questions[index]?.options?.length || 0) >= 6
                      }
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
                    >
                      + Add Option
                    </button>
                  </div>
                  {(questions[index]?.options || []).map((_, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <input
                        {...register(
                          `onboardingQuestions.${index}.options.${optionIndex}`
                        )}
                        type="text"
                        placeholder={`Option ${optionIndex + 1}`}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                      {(questions[index]?.options?.length || 0) > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index, optionIndex)}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label={`Remove option ${optionIndex + 1}`}
                        >
                          <Trash2
                            className="h-3.5 w-3.5"
                            aria-hidden="true"
                          />
                        </button>
                      )}
                    </div>
                  ))}
                  {errors.onboardingQuestions?.[index]?.options && (
                    <p className="text-xs text-red-600">
                      {errors.onboardingQuestions[index]?.options?.message}
                    </p>
                  )}
                </div>

                {/* Matching Weight */}
                <div className="flex items-center gap-4 pt-2">
                  <label className="text-xs font-medium text-gray-500">
                    Match Weight:
                  </label>
                  <input
                    {...register(`onboardingQuestions.${index}.matchingWeight`, {
                      valueAsNumber: true,
                    })}
                    type="range"
                    min="0"
                    max="100"
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    aria-label="Matching weight"
                  />
                  <span className="text-sm font-medium text-indigo-600 w-10 text-right">
                    {questions[index]?.matchingWeight || 50}%
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Higher weight = more important for matching users to this use
                  case
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Question Button */}
      {fields.length < 10 && (
        <NeptuneButton
          type="button"
          variant="default"
          onClick={() => append(emptyQuestion)}
          className="w-full"
          aria-label="Add onboarding question"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Question
        </NeptuneButton>
      )}

      {fields.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <HelpCircle
            className="h-12 w-12 mx-auto mb-3 text-gray-300"
            aria-hidden="true"
          />
          <p className="font-medium">No quiz questions yet</p>
          <p className="text-sm mt-1">
            Add questions to help match users to this use case
          </p>
        </div>
      )}

      {/* Tip Box */}
      <div className="p-4 rounded-lg bg-amber-50 border border-amber-100">
        <p className="text-sm text-amber-800">
          <strong>Tip:</strong> Good matching questions ask about business type,
          team size, goals, or current challenges. Avoid yes/no questions -
          multiple choice with 3-4 options works best.
        </p>
      </div>
    </div>
  );
}

