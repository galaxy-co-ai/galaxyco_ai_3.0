/**
 * Trigger.dev Realtime Streams
 * 
 * Typed stream definitions for real-time data transfer
 * from Trigger.dev tasks to frontend components.
 */

import { streams, InferStreamType } from "@trigger.dev/sdk/v3";

// ============================================================================
// STREAM PART TYPES
// ============================================================================

/**
 * Type for agent output stream chunks
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
// STREAM DEFINITIONS
// ============================================================================

/**
 * Stream for AI agent output - enables real-time streaming of
 * LLM responses to the frontend during agent execution.
 */
export const agentOutputStream = streams.define<AgentOutputPart>({
  id: "agent-output",
});

/**
 * Stream for campaign sending progress - enables real-time
 * updates on bulk email campaign status.
 */
export const campaignProgressStream = streams.define<CampaignProgressPart>({
  id: "campaign-progress",
});

/**
 * Stream for batch operation progress - generic progress tracking
 * for bulk operations like lead scoring, document indexing, etc.
 */
export const batchProgressStream = streams.define<BatchProgressPart>({
  id: "batch-progress",
});

// ============================================================================
// INFERRED TYPES FOR CONSUMERS
// ============================================================================

export type AgentOutputStreamType = InferStreamType<typeof agentOutputStream>;
export type CampaignProgressStreamType = InferStreamType<typeof campaignProgressStream>;
export type BatchProgressStreamType = InferStreamType<typeof batchProgressStream>;

/**
 * All stream types for useRealtimeRunWithStreams
 */
export type STREAMS = {
  "agent-output": AgentOutputPart;
  "campaign-progress": CampaignProgressPart;
  "batch-progress": BatchProgressPart;
};
