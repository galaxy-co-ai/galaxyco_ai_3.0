"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Briefcase,
  Smile,
  Zap,
  Users,
  Mail,
  Calendar,
  BookOpen,
  Globe,
} from "lucide-react";
import type { AgentConfig, AgentTemplate, AgentTone } from "../types";
import { AVAILABLE_CAPABILITIES } from "../types";

interface CustomizeStepProps {
  config: AgentConfig;
  template: AgentTemplate | null;
  onUpdate: (updates: Partial<AgentConfig>) => void;
}

const TONE_OPTIONS: { value: AgentTone; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: "professional",
    label: "Professional",
    icon: <Briefcase className="h-4 w-4" />,
    description: "Formal and business-focused",
  },
  {
    value: "friendly",
    label: "Friendly",
    icon: <Smile className="h-4 w-4" />,
    description: "Warm and approachable",
  },
  {
    value: "concise",
    label: "Concise",
    icon: <Zap className="h-4 w-4" />,
    description: "Brief and to the point",
  },
];

const CAPABILITY_ICONS: Record<string, React.ReactNode> = {
  crm: <Users className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
  knowledge: <BookOpen className="h-4 w-4" />,
  web: <Globe className="h-4 w-4" />,
};

export default function CustomizeStep({
  config,
  template,
  onUpdate,
}: CustomizeStepProps) {
  const toggleCapability = (capId: string) => {
    const current = config.capabilities || [];
    const updated = current.includes(capId)
      ? current.filter((c) => c !== capId)
      : [...current, capId];
    onUpdate({ capabilities: updated });
  };

  return (
    <div className="h-full flex flex-col gap-5 pb-4">
      {/* Name & Description */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <div>
          <Label htmlFor="agent-name" className="text-sm font-medium text-gray-700">
            Agent Name
          </Label>
          <Input
            id="agent-name"
            value={config.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            placeholder="e.g., Sales Assistant"
            className="mt-1.5"
            aria-label="Agent name"
          />
        </div>
        <div>
          <Label htmlFor="agent-description" className="text-sm font-medium text-gray-700">
            Description
          </Label>
          <Textarea
            id="agent-description"
            value={config.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="What does this agent do?"
            className="mt-1.5 resize-none h-16"
            aria-label="Agent description"
          />
        </div>
      </motion.div>

      {/* Tone Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Communication Tone
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {TONE_OPTIONS.map((tone) => (
            <button
              key={tone.value}
              onClick={() => onUpdate({ tone: tone.value })}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                config.tone === tone.value
                  ? "border-violet-500 bg-violet-50 text-violet-700"
                  : "border-gray-100 hover:border-gray-200 text-gray-600"
              )}
              aria-label={`Set tone to ${tone.label}`}
              aria-pressed={config.tone === tone.value}
            >
              <div
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  config.tone === tone.value ? "bg-violet-100" : "bg-gray-100"
                )}
              >
                {tone.icon}
              </div>
              <span className="text-xs font-medium">{tone.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Capabilities */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          Capabilities
        </Label>
        <div className="space-y-2">
          {AVAILABLE_CAPABILITIES.map((cap) => {
            const isEnabled = config.capabilities?.includes(cap.id);
            return (
              <div
                key={cap.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-all",
                  isEnabled
                    ? "border-violet-200 bg-violet-50/50"
                    : "border-gray-100 hover:border-gray-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      isEnabled ? "bg-violet-100 text-violet-600" : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {CAPABILITY_ICONS[cap.id]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{cap.name}</div>
                    <div className="text-xs text-gray-500">{cap.description}</div>
                  </div>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={() => toggleCapability(cap.id)}
                  aria-label={`Toggle ${cap.name}`}
                />
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
