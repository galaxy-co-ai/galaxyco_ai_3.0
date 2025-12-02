"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Clock,
  Zap,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Users,
  Mail,
  Calendar,
  BookOpen,
  Globe,
} from "lucide-react";
import type { AgentConfig, AgentTemplate, AgentTrigger } from "../types";

interface ActivateStepProps {
  config: AgentConfig;
  template: AgentTemplate | null;
  onUpdate: (updates: Partial<AgentConfig>) => void;
}

const TRIGGER_OPTIONS: { type: AgentTrigger["type"]; label: string; icon: React.ReactNode; description: string }[] = [
  {
    type: "manual",
    label: "Manual",
    icon: <Play className="h-4 w-4" />,
    description: "Run on demand when you need it",
  },
  {
    type: "schedule",
    label: "Scheduled",
    icon: <Clock className="h-4 w-4" />,
    description: "Run automatically on a schedule",
  },
  {
    type: "event",
    label: "Event-based",
    icon: <Zap className="h-4 w-4" />,
    description: "Trigger when specific events occur",
  },
];

const CAPABILITY_ICONS: Record<string, React.ReactNode> = {
  crm: <Users className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  calendar: <Calendar className="h-3.5 w-3.5" />,
  knowledge: <BookOpen className="h-3.5 w-3.5" />,
  web: <Globe className="h-3.5 w-3.5" />,
};

const CAPABILITY_NAMES: Record<string, string> = {
  crm: "CRM",
  email: "Email",
  calendar: "Calendar",
  knowledge: "Knowledge Base",
  web: "Web Search",
};

export default function ActivateStep({
  config,
  template,
  onUpdate,
}: ActivateStepProps) {
  const [testStatus, setTestStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleTest = async () => {
    setTestStatus("running");
    setTestResult(null);

    try {
      // Call the real test-run API
      const response = await fetch("/api/agents/test-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          type: config.type,
          tone: config.tone,
          capabilities: config.capabilities,
          systemPrompt: config.systemPrompt,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestStatus("success");
        // Show the AI's actual response
        const toolInfo = data.toolsUsed?.length 
          ? ` Used ${data.toolsUsed.length} tool(s) successfully.`
          : "";
        setTestResult(`${data.message}${toolInfo} Response: "${data.response.slice(0, 150)}${data.response.length > 150 ? "..." : ""}"`);
      } else {
        setTestStatus("error");
        setTestResult(data.error || "Test failed. Please check the configuration.");
      }
    } catch (error) {
      setTestStatus("error");
      setTestResult("Failed to connect to test service. Please try again.");
    }
  };

  return (
    <div className="h-full flex flex-col gap-5 pb-4">
      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200"
      >
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Agent Summary
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Name</span>
            <span className="font-medium text-gray-900">{config.name || "Unnamed"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Type</span>
            <span className="font-medium text-gray-900 capitalize">{config.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Tone</span>
            <span className="font-medium text-gray-900 capitalize">{config.tone}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-gray-500">Capabilities</span>
            <div className="flex flex-wrap gap-1 justify-end">
              {config.capabilities?.length ? (
                config.capabilities.map((cap) => (
                  <Badge
                    key={cap}
                    variant="secondary"
                    className="text-xs flex items-center gap-1"
                  >
                    {CAPABILITY_ICONS[cap]}
                    {CAPABILITY_NAMES[cap]}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-400">None selected</span>
              )}
            </div>
          </div>
          {template && (
            <div className="flex justify-between">
              <span className="text-gray-500">Based on</span>
              <Badge variant="outline" className="text-xs">
                {template.name}
              </Badge>
            </div>
          )}
        </div>
      </motion.div>

      {/* Trigger Selection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Label className="text-sm font-medium text-gray-700 mb-2 block">
          When should this agent run?
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {TRIGGER_OPTIONS.map((trigger) => (
            <button
              key={trigger.type}
              onClick={() => onUpdate({ trigger: { type: trigger.type } })}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all",
                config.trigger.type === trigger.type
                  ? "border-violet-500 bg-violet-50 text-violet-700"
                  : "border-gray-100 hover:border-gray-200 text-gray-600"
              )}
              aria-label={`Set trigger to ${trigger.label}`}
              aria-pressed={config.trigger.type === trigger.type}
            >
              <div
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  config.trigger.type === trigger.type ? "bg-violet-100" : "bg-gray-100"
                )}
              >
                {trigger.icon}
              </div>
              <span className="text-xs font-medium">{trigger.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {TRIGGER_OPTIONS.find((t) => t.type === config.trigger.type)?.description}
        </p>
      </motion.div>

      {/* Test Run */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 rounded-xl border border-gray-200 bg-white"
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Test Run</h3>
            <p className="text-xs text-gray-500">
              Verify your agent works before activating
            </p>
          </div>
          <Button
            size="sm"
            variant={testStatus === "success" ? "outline" : "default"}
            onClick={handleTest}
            disabled={testStatus === "running"}
            className={cn(
              testStatus === "success" && "border-emerald-500 text-emerald-600"
            )}
          >
            {testStatus === "running" ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Testing...
              </>
            ) : testStatus === "success" ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Passed
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1.5" />
                Run Test
              </>
            )}
          </Button>
        </div>

        {testResult && (
          <div
            className={cn(
              "p-3 rounded-lg text-sm flex items-start gap-2",
              testStatus === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            )}
          >
            {testStatus === "success" ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            )}
            {testResult}
          </div>
        )}
      </motion.div>
    </div>
  );
}
