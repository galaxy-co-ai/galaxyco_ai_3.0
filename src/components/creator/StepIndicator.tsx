"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Step {
  number: number;
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export default function StepIndicator({
  steps,
  currentStep,
  className,
}: StepIndicatorProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isCurrent = currentStep === step.number;
        const isUpcoming = currentStep < step.number;

        return (
          <div key={step.number} className="flex items-center">
            {/* Step Circle */}
            <motion.div
              initial={false}
              animate={{
                scale: isCurrent ? 1.1 : 1,
                backgroundColor: isCompleted
                  ? "#10B981" // emerald-500
                  : isCurrent
                  ? "#7C3AED" // violet-600
                  : "#E5E7EB", // gray-200
              }}
              transition={{ duration: 0.2 }}
              className={cn(
                "relative flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-all",
                isCompleted && "bg-emerald-500 text-white",
                isCurrent && "bg-violet-600 text-white ring-4 ring-violet-100",
                isUpcoming && "bg-gray-200 text-gray-500"
              )}
            >
              {isCompleted ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Check className="h-4 w-4" />
                </motion.div>
              ) : (
                step.number
              )}
            </motion.div>

            {/* Step Label */}
            <div className="ml-2 mr-4">
              <p
                className={cn(
                  "text-sm font-medium transition-colors",
                  isCompleted && "text-emerald-600",
                  isCurrent && "text-violet-700",
                  isUpcoming && "text-gray-400"
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-gray-400">{step.description}</p>
              )}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-shrink-0 w-12 h-0.5 mx-2">
                <motion.div
                  initial={false}
                  animate={{
                    width: isCompleted ? "100%" : "0%",
                  }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ originX: 0 }}
                />
                <div
                  className={cn(
                    "h-0.5 -mt-0.5 rounded-full",
                    isCompleted ? "bg-emerald-500" : "bg-gray-200"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Compact version for mobile/smaller spaces
export function StepIndicatorCompact({
  steps,
  currentStep,
  className,
}: StepIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isCurrent = currentStep === step.number;

        return (
          <div key={step.number} className="flex items-center">
            <motion.div
              initial={false}
              animate={{
                backgroundColor: isCompleted
                  ? "#10B981"
                  : isCurrent
                  ? "#7C3AED"
                  : "#E5E7EB",
              }}
              className={cn(
                "w-2 h-2 rounded-full",
                isCurrent && "w-6"
              )}
            />
            {index < steps.length - 1 && (
              <div className="w-2 h-0.5 bg-gray-200 mx-0.5" />
            )}
          </div>
        );
      })}
      <span className="ml-2 text-xs text-gray-500">
        Step {currentStep} of {steps.length}
      </span>
    </div>
  );
}
