"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import * as Icons from "lucide-react";
import {
  Bot,
  Sparkles,
  Users,
  Mail,
  Calendar,
  BookOpen,
  Globe,
  Briefcase,
  Smile,
  Zap,
} from "lucide-react";
import type { AgentConfig, AgentTemplate } from "./types";

interface AgentPreviewCardProps {
  config: AgentConfig;
  template: AgentTemplate | null;
}

// Dynamic icon component
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const IconComponent = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[name];
  if (!IconComponent) return <Bot className={className} />;
  return <IconComponent className={className} />;
}

const CAPABILITY_ICONS: Record<string, React.ReactNode> = {
  crm: <Users className="h-3 w-3" />,
  email: <Mail className="h-3 w-3" />,
  calendar: <Calendar className="h-3 w-3" />,
  knowledge: <BookOpen className="h-3 w-3" />,
  web: <Globe className="h-3 w-3" />,
};

const TONE_ICONS: Record<string, React.ReactNode> = {
  professional: <Briefcase className="h-3 w-3" />,
  friendly: <Smile className="h-3 w-3" />,
  concise: <Zap className="h-3 w-3" />,
};

export default function AgentPreviewCard({
  config,
  template,
}: AgentPreviewCardProps) {
  const hasName = config.name && config.name.trim().length > 0;
  const hasCapabilities = config.capabilities && config.capabilities.length > 0;

  return (
    <motion.div
      layout
      className={cn(
        "flex-1 rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600",
        "shadow-xl shadow-violet-200"
      )}
    >
      {/* Card Content */}
      <div className="h-full flex flex-col p-5">
        {/* Agent Avatar */}
        <div className="flex justify-center mb-4">
          <motion.div
            layout
            className={cn(
              "w-20 h-20 rounded-2xl flex items-center justify-center",
              "bg-white/20 backdrop-blur-sm border border-white/30"
            )}
          >
            {template ? (
              <DynamicIcon
                name={template.icon}
                className="h-10 w-10 text-white"
              />
            ) : (
              <Bot className="h-10 w-10 text-white" />
            )}
          </motion.div>
        </div>

        {/* Agent Name */}
        <motion.div layout className="text-center mb-3">
          <h3 className="text-lg font-bold text-white truncate">
            {hasName ? config.name : "Your Agent"}
          </h3>
          <p className="text-sm text-white/70 capitalize">{config.type} Agent</p>
        </motion.div>

        {/* Description Preview */}
        {config.description && (
          <motion.p
            layout
            className="text-xs text-white/70 text-center line-clamp-2 mb-4"
          >
            {config.description}
          </motion.p>
        )}

        {/* Tone Badge */}
        <motion.div layout className="flex justify-center mb-3">
          <Badge
            className={cn(
              "px-3 py-1 flex items-center gap-1.5",
              "bg-white/20 text-white border-white/30 backdrop-blur-sm"
            )}
          >
            {TONE_ICONS[config.tone]}
            <span className="capitalize">{config.tone}</span>
          </Badge>
        </motion.div>

        {/* Capabilities */}
        {hasCapabilities && (
          <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap justify-center gap-1.5 mb-4"
          >
            {config.capabilities.map((cap) => (
              <motion.div
                key={cap}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center",
                  "bg-white/20 text-white border border-white/20"
                )}
                title={cap}
              >
                {CAPABILITY_ICONS[cap]}
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Status */}
        <motion.div layout className="mt-auto">
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="text-xs font-medium text-white">Ready to Activate</span>
            </div>
          </div>
        </motion.div>

        {/* Template Badge */}
        {template && (
          <motion.div
            layout
            className="flex justify-center mt-3"
          >
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <Sparkles className="h-3 w-3" />
              Based on {template.name}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
