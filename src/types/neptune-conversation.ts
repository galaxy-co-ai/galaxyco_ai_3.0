// src/types/neptune-conversation.ts

// --- Content Blocks (spec Section 10) ---

export type ContentBlock =
  | TextBlock
  | VisualBlock
  | ActionAffordanceBlock
  | ModuleLinkBlock;

export interface TextBlock {
  type: 'text';
  content: string;
}

export interface VisualBlock {
  type: 'visual';
  spec: VisualSpec;
}

export interface ActionAffordanceBlock {
  type: 'action-affordance';
  prompt: string;
  actions: ActionOption[];
}

export interface ModuleLinkBlock {
  type: 'module-link';
  module: string;
  entity?: string;
  label: string;
}

export type ChartType = 'line' | 'bar' | 'metric' | 'comparison' | 'trend';

export interface VisualSpec {
  chartType: ChartType;
  data: Record<string, unknown>;
  interactive: boolean;
  title?: string;
}

export interface ActionOption {
  label: string;
  intent: string;
  args?: Record<string, unknown>;
  requiresConfirmation?: boolean;
}

// --- Messages ---

export interface ConversationMessage {
  id: string;
  sessionId: string;
  timestamp: string;
  role: 'neptune' | 'user';
  blocks: ContentBlock[];
}

// --- Session ---

export interface ConversationSession {
  id: string;
  conversationId: string;
  startedAt: string;
  lastActiveAt: string;
}

// --- API Types ---

export interface ConversationInitRequest {
  sessionId?: string;
}

export interface ConversationSendRequest {
  sessionId: string;
  message: string;
}

export interface ConversationHistoryResponse {
  sessions: ConversationSession[];
  messages: ConversationMessage[];
  hasMore: boolean;
  cursor?: string;
}

// --- Streaming Event Types (SSE) ---

export type StreamEvent =
  | { type: 'session'; session: ConversationSession }
  | { type: 'block-start'; blockType: ContentBlock['type']; index: number }
  | { type: 'text-delta'; content: string }
  | { type: 'block-complete'; block: ContentBlock; index: number }
  | { type: 'message-complete'; message: ConversationMessage }
  | { type: 'error'; message: string };
