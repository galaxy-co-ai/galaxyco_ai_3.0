/**
 * Shared types for AI tool system
 */
import type { ChatCompletionTool } from 'openai/resources/chat/completions';

export interface ToolContext {
  workspaceId: string;
  userId: string;
  userEmail: string;
  userName: string;
  connectedApps?: Array<{
    provider: string;
    type: string;
    scopes: string[];
    accessToken?: string;
    status: string;
  }>;
}

export interface ToolResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
  error?: string;
  suggestedNextStep?: {
    action: string;
    reason: string;
    prompt: string;
    autoSuggest: boolean;
  };
}

export type ToolFunction = (
  args: Record<string, unknown>,
  context: ToolContext
) => Promise<ToolResult>;

export type ToolImplementations = Record<string, ToolFunction>;

export type ToolDefinitions = ChatCompletionTool[];
