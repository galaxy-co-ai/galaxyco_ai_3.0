"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Plus, ArrowRight } from "lucide-react";
import * as Icons from "lucide-react";
import { AGENT_TEMPLATES } from "../templates";
import type { AgentTemplate } from "../types";

interface ChooseBaseStepProps {
  onSelect: (template: AgentTemplate | null) => void;
  neptuneOpen?: boolean;
}

// Dynamic icon component
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
}

export default function ChooseBaseStep({ onSelect, neptuneOpen = false }: ChooseBaseStepProps) {
  return (
    <div className={cn(
      "flex flex-col min-w-0",
      neptuneOpen ? "h-auto pb-4" : "h-full"
    )}>
      {/* Template Grid - Compact mode when Neptune is open */}
      <div className={cn(
        "gap-3 mb-4 w-full",
        neptuneOpen 
          ? "flex flex-col pt-1" 
          : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 pt-3 pr-1"
      )}>
        {AGENT_TEMPLATES.map((template, index) => (
          <motion.button
            key={template.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onSelect(template)}
            className={cn(
              "relative text-left transition-all duration-200 group w-full",
              "bg-white border-2 border-gray-100",
              "hover:shadow-md hover:border-gray-200",
              "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
              neptuneOpen 
                ? "flex items-center gap-3 p-3 rounded-lg overflow-hidden" 
                : "p-3 sm:p-4 rounded-xl overflow-visible min-w-0 flex flex-col"
            )}
            whileHover={neptuneOpen ? { x: 2 } : { y: -2 }}
            whileTap={{ scale: 0.98 }}
            aria-label={`Create ${template.name}`}
          >
            {/* Badge - Only show in full mode */}
            {template.badgeText && !neptuneOpen && (
              <div className="absolute -top-2.5 -right-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-medium shadow-sm z-50">
                {template.badgeText}
              </div>
            )}

            {/* Icon */}
            <div
              className={cn(
                "rounded-lg flex items-center justify-center transition-all shrink-0",
                template.iconBg,
                "group-hover:scale-110",
                neptuneOpen ? "w-10 h-10" : "w-10 h-10 mb-2.5"
              )}
            >
              <DynamicIcon name={template.icon} className={cn("h-5 w-5", template.iconColor)} />
            </div>

            {/* Content */}
            <div className={cn("flex-1 min-w-0 w-full flex flex-col overflow-hidden", neptuneOpen && "min-w-0")}>
              <h3 className={cn(
                "font-semibold text-gray-900",
                neptuneOpen ? "text-sm truncate" : "text-sm mb-1.5 break-words leading-tight"
              )}>
                {template.name}
              </h3>
              {!neptuneOpen && (
                <p className="text-xs text-gray-500 line-clamp-3 mb-2.5 break-words leading-relaxed min-w-0">
                  {template.shortDescription}
                </p>
              )}
              {neptuneOpen && template.badgeText && (
                <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[10px] font-medium">
                  {template.badgeText}
                </span>
              )}
            </div>

            {/* Hover indicator */}
            {!neptuneOpen && (
              <ArrowRight
                className={cn(
                  "transition-all shrink-0 absolute bottom-3 right-3 h-4 w-4",
                  "text-gray-300 group-hover:text-violet-500 group-hover:translate-x-1"
                )}
              />
            )}
            {neptuneOpen && (
              <ArrowRight
                className="h-4 w-4 shrink-0 transition-all text-gray-300 group-hover:text-violet-500 group-hover:translate-x-1"
              />
            )}
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
          "flex items-center gap-3 border-2 border-dashed transition-all",
          "border-gray-200 text-gray-500",
          "hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50/50",
          "focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2",
          neptuneOpen 
            ? "p-3 rounded-lg justify-start" 
            : "p-4 rounded-xl justify-center"
        )}
        whileHover={neptuneOpen ? { x: 2 } : { scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="w-10 h-10 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-violet-100">
          <Plus className="h-5 w-5" />
        </div>
        <div className={cn("text-left", neptuneOpen && "flex-1 min-w-0")}>
          <div className={cn("font-medium text-sm", neptuneOpen && "truncate")}>
            Start from Scratch
          </div>
          {!neptuneOpen && (
            <div className="text-xs opacity-70">Build a fully custom agent</div>
          )}
        </div>
        {neptuneOpen && (
          <ArrowRight className="h-4 w-4 shrink-0 transition-all text-gray-300 group-hover:text-violet-500 group-hover:translate-x-1" />
        )}
      </motion.button>
    </div>
  );
}
