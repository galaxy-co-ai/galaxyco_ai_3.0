/**
 * Trigger.dev Realtime Streams
 * 
 * Typed stream definitions for real-time data transfer
 * from Trigger.dev tasks to frontend components.
 * 
 * Uses metadata.stream() API to forward OpenAI streaming responses
 * to the Trigger.dev Realtime API for consumption by frontend hooks.
 */

import type OpenAI from "openai";

// ============================================================================
// STREAM PART TYPES
// ============================================================================

/**
 * Type for OpenAI chat completion stream chunks.
 * This matches the OpenAI SDK's ChatCompletionChunk type exactly
 * for proper type inference in useRealtimeRunWithStreams.
 */
export type OpenAIStreamPart = OpenAI.Chat.Completions.ChatCompletionChunk;

/**
 * Type for tool execution events during agent streaming.
 * Sent alongside OpenAI chunks to show tool usage in real-time.
 */
export interface ToolExecutionPart {
  /** Type discriminator */
  type: "tool_start" | "tool_complete" | "tool_error";
  /** Tool name being executed */
  toolName: string;
  /** Tool arguments (for tool_start) */
  args?: Record<string, unknown>;
  /** Tool result (for tool_complete) */
  result?: unknown;
  /** Error message (for tool_error) */
  error?: string;
  /** Timestamp */
  timestamp: string;
}

/**
 * Legacy type for agent output stream chunks (kept for backwards compatibility)
 * @deprecated Use OpenAIStreamPart instead for new implementations
 */
export interface AgentOutputPart {
  /** The streamed text chunk from the AI model */
  chunk: string;
  /** Whether this is the final chunk */
  done: boolean;
  /** Optional tool being executed */
  tool?: string;
  /** Optional tool result */
  toolResult?: unknown;
}

/**
 * Type for campaign progress stream chunks
 */
export interface CampaignProgressPart {
  /** Number of emails sent so far */
  sent: number;
  /** Number of emails failed so far */
  failed: number;
  /** Total emails to send */
  total: number;
  /** Current batch being processed */
  currentBatch: number;
  /** Whether the campaign is complete */
  complete: boolean;
}

/**
 * Type for batch operation progress stream chunks
 */
export interface BatchProgressPart {
  /** Operation identifier */
  operation: string;
  /** Number of items processed */
  processed: number;
  /** Total items to process */
  total: number;
  /** Current item being processed */
  currentItem?: string;
  /** Whether the batch is complete */
  complete: boolean;
  /** Any errors encountered */
  errors: string[];
}

// ============================================================================
// STREAM TYPE DEFINITIONS FOR useRealtimeRunWithStreams
// ============================================================================

/**
 * All stream types for useRealtimeRunWithStreams hook.
 * 
 * Keys are the stream IDs used in metadata.stream(key, stream).
 * Values are the chunk types for each stream.
 * 
 * @example
 * // In a task:
 * const stream = await openai.chat.completions.create({ stream: true, ... });
 * await metadata.stream("openai", stream);
 * 
 * // In React component:
 * const { streams } = useRealtimeRunWithStreams<typeof executeAgentTask, STREAMS>(runId, { accessToken });
 * const text = streams.openai?.map(c => c.choices[0]?.delta?.content || "").join("");
 */
export type STREAMS = {
  /** OpenAI chat completion chunks for real-time LLM output */
  openai: OpenAIStreamPart;
  /** Tool execution events for showing tool usage during agent execution */
  tools: ToolExecutionPart;
  /** Campaign sending progress updates */
  "campaign-progress": CampaignProgressPart;
  /** Generic batch operation progress */
  "batch-progress": BatchProgressPart;
};

// ============================================================================
// LEGACY STREAM DEFINITIONS (for backwards compatibility)
// ============================================================================

// Note: The new Trigger.dev v3 streaming approach uses metadata.stream()
// directly in tasks rather than defining streams upfront. These are kept
// for backwards compatibility but new code should use the STREAMS type above.
