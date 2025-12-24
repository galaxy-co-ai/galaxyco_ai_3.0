"use client";

import { useEffect, useState, useMemo } from "react";
import { useRealtimeRunWithStreams } from "@trigger.dev/react-hooks";
import { cn } from "@/lib/utils";
import { Bot, Loader2, CheckCircle2, Wrench, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { STREAMS, ToolExecutionPart } from "@/trigger/streams";

// ============================================================================
// TYPES
// ============================================================================

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

interface ToolDisplayState {
  name: string;
  status: "running" | "complete" | "error";
  result?: unknown;
  error?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * AgentStreamViewer - Real-time display of AI agent output
 * 
 * Uses Trigger.dev's useRealtimeRunWithStreams hook to display live
 * LLM output character-by-character as it streams from the OpenAI API.
 * 
 * Features:
 * - True realtime streaming of AI responses (not polling)
 * - Live tool execution status indicators
 * - Markdown rendering of streamed content
 * - Error handling and completion callbacks
 */
export function AgentStreamViewer({
  runId,
  accessToken,
  className,
  onComplete,
  onError,
}: AgentStreamViewerProps) {
  const [hasCalledComplete, setHasCalledComplete] = useState(false);

  // Subscribe to the run AND its streams using realtime hooks
  // This gives us access to the OpenAI stream chunks as they arrive
  const { run, streams, error } = useRealtimeRunWithStreams(
    runId,
    {
      accessToken,
      enabled: !!runId && !!accessToken,
    }
  ) as {
    run: { status: string; output: unknown; metadata?: { toolEvents?: ToolExecutionPart[] } } | undefined;
    streams: { openai?: Array<{ choices?: Array<{ delta?: { content?: string } }> }> };
    error: Error | undefined;
  };

  // Extract streamed text from OpenAI chunks
  // Each chunk contains delta.content which we concatenate
  const streamedText = useMemo(() => {
    if (!streams.openai || streams.openai.length === 0) {
      return "";
    }
    
    return streams.openai
      .map((chunk) => {
        // OpenAI ChatCompletionChunk structure
        const content = chunk.choices?.[0]?.delta?.content;
        return content || "";
      })
      .join("");
  }, [streams.openai]);

  // Get tool execution events from run metadata
  // These are set via metadata.set("toolEvents", [...]) in the task
  const toolEvents = useMemo(() => {
    const events = run?.metadata?.toolEvents as ToolExecutionPart[] | undefined;
    return events || [];
  }, [run?.metadata]);

  // Convert tool events into display state
  // Shows tools with their current status (running, complete, error)
  const toolsDisplayState = useMemo(() => {
    const toolMap = new Map<string, ToolDisplayState>();
    
    for (const event of toolEvents) {
      if (event.type === "tool_start") {
        toolMap.set(event.toolName, {
          name: event.toolName,
          status: "running",
        });
      } else if (event.type === "tool_complete") {
        toolMap.set(event.toolName, {
          name: event.toolName,
          status: "complete",
          result: event.result,
        });
      } else if (event.type === "tool_error") {
        toolMap.set(event.toolName, {
          name: event.toolName,
          status: "error",
          error: event.error,
        });
      }
    }
    
    return Array.from(toolMap.values());
  }, [toolEvents]);

  // Determine run state
  const isRunning = run?.status === "EXECUTING" || run?.status === "QUEUED";
  const isComplete = run?.status === "COMPLETED";
  const isFailed = run?.status === "FAILED";

  // Get final response from completed run output
  const finalResponse = useMemo(() => {
    if (!isComplete) return null;
    const output = run?.output as { results?: { response?: string } } | undefined;
    return output?.results?.response || null;
  }, [isComplete, run?.output]);

  // Use streamed text while running, final response when complete
  const displayText = isComplete ? (finalResponse || streamedText) : streamedText;

  // Handle completion callback (only call once)
  useEffect(() => {
    if (isComplete && !hasCalledComplete) {
      setHasCalledComplete(true);
      onComplete?.();
    }
  }, [isComplete, hasCalledComplete, onComplete]);

  // Handle errors
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  // Error state
  if (error) {
    return (
      <div className={cn("p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800", className)}>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm font-medium">Failed to connect to agent stream</p>
        </div>
        <p className="text-sm text-red-500 dark:text-red-300 mt-1">{error.message}</p>
      </div>
    );
  }

  // Failed run state
  if (isFailed) {
    const failedOutput = run?.output as { error?: string } | undefined;
    return (
      <div className={cn("p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800", className)}>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <p className="text-sm font-medium">Agent execution failed</p>
        </div>
        {failedOutput?.error && (
          <p className="text-sm text-red-500 dark:text-red-300 mt-1">{failedOutput.error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Tools being executed - shows realtime status */}
      {toolsDisplayState.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {toolsDisplayState.map((tool, index) => (
            <div
              key={`${tool.name}-${index}`}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all",
                tool.status === "complete" && "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
                tool.status === "running" && "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
                tool.status === "error" && "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
              )}
            >
              {tool.status === "complete" && <CheckCircle2 className="h-3 w-3" />}
              {tool.status === "running" && <Loader2 className="h-3 w-3 animate-spin" />}
              {tool.status === "error" && <AlertCircle className="h-3 w-3" />}
              <Wrench className="h-3 w-3" />
              <span>{tool.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Streaming content */}
      <div className="relative">
        {/* Loading state - shown when waiting for first chunk */}
        {!displayText && isRunning && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Bot className="h-4 w-4" />
            <span className="text-sm">Agent is thinking</span>
            <span className="flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
            </span>
          </div>
        )}

        {/* Streamed content with markdown rendering */}
        {displayText && (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown>{displayText}</ReactMarkdown>
            
            {/* Typing cursor - shows while still receiving chunks */}
            {isRunning && (
              <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-0.5 rounded-sm" />
            )}
          </div>
        )}

        {/* Completion indicator */}
        {isComplete && displayText && (
          <div className="flex items-center gap-1.5 mt-3 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Complete</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default AgentStreamViewer;
