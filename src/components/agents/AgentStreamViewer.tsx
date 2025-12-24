"use client";

import { useEffect, useState } from "react";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { cn } from "@/lib/utils";
import { Bot, Loader2, CheckCircle2, Wrench } from "lucide-react";
import ReactMarkdown from "react-markdown";

// Types for streaming data
interface AgentOutputPart {
  chunk?: string;
  tool?: string;
  toolResult?: unknown;
  done?: boolean;
}

interface AgentStreamViewerProps {
  /** The Trigger.dev run ID to subscribe to */
  runId: string;
  /** Public access token for authentication */
  accessToken: string;
  /** Optional className for the container */
  className?: string;
  /** Callback when streaming completes */
  onComplete?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * AgentStreamViewer - Real-time display of AI agent output
 * 
 * Uses Trigger.dev's useRealtimeRun hook to display live
 * run status and output from agent executions.
 */
export function AgentStreamViewer({
  runId,
  accessToken,
  className,
  onComplete,
  onError,
}: AgentStreamViewerProps) {
  const [toolsExecuted, setToolsExecuted] = useState<Array<{ name: string; result?: unknown }>>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Subscribe to the run using realtime hooks
  const { run, error } = useRealtimeRun(runId, {
    accessToken,
    enabled: !!runId && !!accessToken,
  });

  // Extract output from run when available
  const output = run?.output as { response?: string; tools?: Array<{ name: string; result?: unknown }> } | undefined;
  const displayText = output?.response || "";

  // Handle completion
  useEffect(() => {
    if (run?.status === "COMPLETED" && !isComplete) {
      setIsComplete(true);
      if (output?.tools) {
        setToolsExecuted(output.tools);
      }
      onComplete?.();
    }
  }, [run?.status, isComplete, output, onComplete]);

  // Handle errors
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  // Determine display state
  const isRunning = run?.status === "EXECUTING" || run?.status === "QUEUED";
  const displayComplete = isComplete || run?.status === "COMPLETED";

  if (error) {
    return (
      <div className={cn("p-4 rounded-lg bg-red-50 border border-red-200", className)}>
        <p className="text-sm text-red-600">
          Failed to connect to agent stream: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Tools being executed */}
      {toolsExecuted.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {toolsExecuted.map((tool, index) => (
            <div
              key={`${tool.name}-${index}`}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                tool.result
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              )}
            >
              {tool.result ? (
                <CheckCircle2 className="h-3 w-3" />
              ) : (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              <Wrench className="h-3 w-3" />
              <span>{tool.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Streaming content */}
      <div className="relative">
        {/* Loading state */}
        {!displayText && !displayComplete && (
          <div className="flex items-center gap-2 text-gray-500">
            <Bot className="h-4 w-4" />
            <span className="text-sm">Agent is thinking</span>
            <span className="flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
            </span>
          </div>
        )}

        {/* Streamed content */}
        {displayText && (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{displayText}</ReactMarkdown>
            
            {/* Typing cursor */}
            {!displayComplete && (
              <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-0.5" />
            )}
          </div>
        )}

        {/* Completion indicator */}
        {displayComplete && displayText && (
          <div className="flex items-center gap-1.5 mt-3 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Complete</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default AgentStreamViewer;
