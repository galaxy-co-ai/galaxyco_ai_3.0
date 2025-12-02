"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { documentTypes, type DocumentTypeConfig } from "./documentRequirements";
import { ArrowRight } from "lucide-react";

interface TypeSelectorProps {
  onSelect: (docType: DocumentTypeConfig) => void;
  className?: string;
}

export default function TypeSelector({ onSelect, className }: TypeSelectorProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          What would you like to create?
        </h2>
        <p className="text-sm text-gray-500">
          Select a content type to get started with Neptune's guidance
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {documentTypes.map((docType, index) => (
          <motion.button
            key={docType.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(docType)}
            className={cn(
              "relative p-5 rounded-xl border-2 text-left transition-all duration-200 group",
              "bg-white border-gray-100",
              "hover:shadow-lg hover:scale-[1.02] hover:border-gray-200",
              "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            )}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            aria-label={`Create ${docType.name}`}
          >
            {/* Gradient overlay on hover */}
            <div
              className={cn(
                "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity",
                "bg-gradient-to-br",
                docType.gradientFrom,
                docType.gradientTo,
                "opacity-0 group-hover:opacity-5"
              )}
            />

            {/* Icon */}
            <div className="relative w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all overflow-hidden">
              {/* Base background */}
              <div className={cn("absolute inset-0 transition-opacity", docType.bgColor, "group-hover:opacity-0")} />
              
              {/* Gradient background on hover */}
              <div
                className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br",
                  docType.gradientFrom,
                  docType.gradientTo
                )}
              />
              
              {/* Icon */}
              <docType.icon
                className={cn(
                  "h-6 w-6 transition-colors relative z-10",
                  docType.iconColor,
                  "group-hover:text-white"
                )}
              />
            </div>

            {/* Text */}
            <h3 className="font-semibold text-base text-gray-900 mb-1 group-hover:text-gray-900">
              {docType.name}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-2 mb-3">
              {docType.description}
            </p>

            {/* Requirements preview */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {docType.requirements.filter((r) => r.required).length} questions
              </span>
              <ArrowRight
                className={cn(
                  "h-4 w-4 transition-all",
                  "text-gray-300 group-hover:text-violet-500 group-hover:translate-x-1"
                )}
              />
            </div>

            {/* Hover border color */}
            <div
              className={cn(
                "absolute inset-0 rounded-xl border-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
                docType.borderColor
              )}
            />
          </motion.button>
        ))}
      </div>

      {/* Helper text */}
      <p className="text-center text-xs text-gray-400">
        Neptune will guide you through a few questions to create the perfect content
      </p>
    </div>
  );
}
