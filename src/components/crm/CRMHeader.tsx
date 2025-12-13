"use client";

import { useState } from "react";
import {
  Command,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CRMHeaderProps {
  transcribingCount: number;
  onRunCommand?: (value: string) => void;
  suggestions?: string[];
}

const defaultSuggestions = [
  "Summarize this contact",
  "Who needs follow up today?",
  "Generate QBR talking points",
  "Draft follow-up email",
];

export function CRMHeader({
  transcribingCount,
  onRunCommand,
  suggestions = defaultSuggestions,
}: CRMHeaderProps) {
  const [commandValue, setCommandValue] = useState("");

  const runCommand = (value?: string) => {
    const finalValue = (value ?? commandValue).trim();
    if (!finalValue) return;
    onRunCommand?.(finalValue);
    if (!value) {
      setCommandValue("");
    }
  };

  return (
    <div className="space-y-5 pb-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">AI-Native CRM</h1>
          <p className="text-sm text-muted-foreground">
            Auto-transcribe and organize calls, meetings, and emails with AI-powered insights
          </p>
        </div>

        <div className="space-y-2">
          <div className="relative group">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
            <Input
              value={commandValue}
              onChange={(event) => setCommandValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  runCommand();
                }
              }}
              placeholder="Ask AI to summarize pipeline, log a call, or find risks..."
              className="pl-10 pr-28 h-11 rounded-2xl border-0 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)] focus-visible:ring-2 focus-visible:ring-purple-200"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Badge variant="secondary" className="h-6 px-2 text-[11px] bg-muted text-muted-foreground">
                <Command className="h-3.5 w-3.5 mr-1" />
                K
              </Badge>
              <Button
                size="sm"
                className="h-7 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-3"
                onClick={() => runCommand()}
              >
                Run
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="h-7 rounded-full border-dashed text-xs text-muted-foreground hover:border-purple-200 hover:text-purple-700"
                onClick={() => runCommand(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
