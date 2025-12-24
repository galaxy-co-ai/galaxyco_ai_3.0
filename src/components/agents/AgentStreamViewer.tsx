"use client";

import { useEffect, useState } from "react";
import { useRealtimeStream } from "@trigger.dev/react-hooks";
import { agentOutputStream, type AgentOutputPart } from "@/trigger/streams";
import { cn } from "@/lib/utils";
import { Bot, Loader2, CheckCircle2, Wrench } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
 * Uses Trigger.dev's useRealtimeStream hook to display live
 * streaming output from agent executions.
 */
export function AgentStreamViewer({
  runId,
  accessToken,
  className,
  onComplete,
  onError,
}: AgentStreamViewerProps) {
  const [streamedText, setStreamedText] = useState("");
  const [toolsExecuted, setToolsExecuted] = useState<Array<{ name: string; result?: unknown }>>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Subscribe to the agent output stream
  const { parts, error } = useRealtimeStream<AgentOutputPart>(
    agentOutputStream,
    runId,
    {
      accessToken,
      timeoutInSeconds: 300, // 5 minute timeout for long-running agents
      throttleInMs: 50, // Smooth updates
      onData: (chunk) => {
        // Handle text chunks
        if (chunk.chunk) {
          setStreamedText((prev) => prev + chunk.chunk);
        }
        
        // Handle tool execution notifications
        if (chunk.tool && !chunk.toolResult) {
          setToolsExecuted((prev) => {
            // Only add if not already executing this tool
            const existing = prev.find((t) => t.name === chunk.tool && !t.result);
            if (!existing) {
              return [...prev, { name: chunk.tool }];
            }
            return prev;
          });
        }
        
        // Handle tool results
        if (chunk.tool && chunk.toolResult) {
          setToolsExecuted((prev) =>
            prev.map((t) =>
              t.name === chunk.tool && !t.result
                ? { ...t, result: chunk.toolResult }
                : t
            )
          );
        }
        
        // Handle completion
        if (chunk.done) {
          setIsComplete(true);
          onComplete?.();
        }
      },
    }
  );

  // Handle errors
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  // Build display text from parts on initial load (when reconnecting to an existing stream)
  // This is only used when parts are already available but onData hasn't fired yet
  const initialText = parts && parts.length > 0 && !streamedText
    ? parts.filter((p) => p.chunk).map((p) => p.chunk).join("")
    : null;
  
  const initialComplete = parts && parts.length > 0
    ? parts[parts.length - 1]?.done
    : false;
  
  // Use initial values if streaming hasn't started populating state yet
  const displayText = streamedText || initialText || "";
  const displayComplete = isComplete || initialComplete;

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
