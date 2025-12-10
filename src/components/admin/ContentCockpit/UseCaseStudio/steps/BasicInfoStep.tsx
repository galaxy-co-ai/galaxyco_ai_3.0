"use client";

import { useFormContext } from "react-hook-form";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_OPTIONS } from "../types";
import type { UseCaseFormData } from "../types";

export function BasicInfoStep() {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<UseCaseFormData>();

  const selectedCategory = watch("category");

  return (
    <div className="space-y-6">
      {/* Name Field */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Use Case Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register("name")}
          type="text"
          id="name"
          placeholder="e.g., SaaS Founder Getting Started"
          className={cn(
            "w-full px-4 py-2.5 rounded-lg border bg-white",
            "text-gray-900 placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
            "transition-colors duration-150",
            errors.name ? "border-red-300" : "border-gray-300"
          )}
          aria-describedby={errors.name ? "name-error" : undefined}
        />
        {errors.name && (
          <p id="name-error" className="mt-1.5 text-sm text-red-600">
            {errors.name.message}
          </p>
        )}
        <p className="mt-1.5 text-xs text-gray-500">
          A clear name that describes this user journey or workflow
        </p>
      </div>

      {/* Description Field */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          Description
        </label>
        <textarea
          {...register("description")}
          id="description"
          rows={3}
          placeholder="Describe what this use case covers and who it's for..."
          className={cn(
            "w-full px-4 py-2.5 rounded-lg border bg-white",
            "text-gray-900 placeholder:text-gray-400",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500",
            "transition-colors duration-150 resize-none",
            errors.description ? "border-red-300" : "border-gray-300"
          )}
          aria-describedby={errors.description ? "description-error" : undefined}
        />
        {errors.description && (
          <p id="description-error" className="mt-1.5 text-sm text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Category <span className="text-red-500">*</span>
        </label>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
          role="radiogroup"
          aria-label="Select use case category"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={cn(
                "relative flex items-center justify-center px-4 py-3 rounded-lg border cursor-pointer",
                "text-sm font-medium transition-all duration-150",
                "hover:-translate-y-px hover:shadow-md",
                selectedCategory === option.value
                  ? "bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20"
                  : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
              )}
            >
              <input
                {...register("category")}
                type="radio"
                value={option.value}
                className="sr-only"
                aria-label={option.label}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {errors.category && (
          <p className="mt-2 text-sm text-red-600">{errors.category.message}</p>
        )}
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-100">
        <Info
          className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Why categories matter</p>
          <p className="text-blue-700">
            The category helps the AI generate more relevant onboarding steps and
            recommendations tailored to your target audience's typical workflow
            and challenges.
          </p>
        </div>
      </div>
    </div>
  );
}

