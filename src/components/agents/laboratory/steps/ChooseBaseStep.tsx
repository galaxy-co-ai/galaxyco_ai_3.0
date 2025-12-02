"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Plus, ArrowRight, CheckCircle2 } from "lucide-react";
import * as Icons from "lucide-react";
import { AGENT_TEMPLATES } from "../templates";
import type { AgentTemplate } from "../types";

interface ChooseBaseStepProps {
  onSelect: (template: AgentTemplate | null) => void;
}

// Dynamic icon component
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
}

export default function ChooseBaseStep({ onSelect }: ChooseBaseStepProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Template Grid - pt-3 pr-3 to accommodate badges that stick out */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4 pt-3 pr-1">
        {AGENT_TEMPLATES.map((template, index) => (
          <motion.button
            key={template.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(template)}
            className={cn(
              "relative p-4 rounded-xl border-2 text-left transition-all duration-200 group overflow-visible",
              "bg-white border-gray-100",
              "hover:shadow-md hover:border-gray-200",
              "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            )}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            aria-label={`Create ${template.name}`}
          >
            {/* Badge */}
            {template.badgeText && (
              <div className="absolute -top-2.5 -right-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-medium shadow-sm z-10">
                {template.badgeText}
              </div>
            )}

            {/* Icon */}
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-all",
                template.iconBg,
                "group-hover:scale-110"
              )}
            >
              <DynamicIcon name={template.icon} className={cn("h-5 w-5", template.iconColor)} />
            </div>

            {/* Content */}
            <h3 className="font-semibold text-sm text-gray-900 mb-1">
              {template.name}
            </h3>
            <p className="text-xs text-gray-500 line-clamp-2 mb-2">
              {template.shortDescription}
            </p>

            {/* KPIs */}
            <div className="flex items-center gap-2 text-xs">
              {template.kpis.successRate && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3 w-3" />
                  {template.kpis.successRate}%
                </span>
              )}
              {template.kpis.avgTimeSaved && (
                <span className="text-gray-400">
                  Saves {template.kpis.avgTimeSaved}
                </span>
              )}
            </div>

            {/* Hover indicator */}
            <ArrowRight
              className={cn(
                "absolute bottom-4 right-4 h-4 w-4 transition-all",
                "text-gray-300 group-hover:text-violet-500 group-hover:translate-x-1"
              )}
            />
          </motion.button>
        ))}
      </div>

      {/* Blank Agent Option */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: AGENT_TEMPLATES.length * 0.05 }}
        onClick={() => onSelect(null)}
        className={cn(
          "flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed transition-all",
          "border-gray-200 text-gray-500",
          "hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50/50",
          "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-violet-100">
          <Plus className="h-5 w-5" />
        </div>
        <div className="text-left">
          <div className="font-medium text-sm">Start from Scratch</div>
          <div className="text-xs opacity-70">Build a fully custom agent</div>
        </div>
      </motion.button>
    </div>
  );
}
