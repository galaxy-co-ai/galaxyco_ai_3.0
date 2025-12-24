/**
 * MCP (Model Context Protocol) Types
 * 
 * Types for the MCP server that enables ChatGPT to interact with GalaxyCo.
 * Reference: https://modelcontextprotocol.io/
 */

// ============================================================================
// JSON-RPC TYPES
// ============================================================================

export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: unknown;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

// Standard JSON-RPC error codes
export const JSON_RPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

// ============================================================================
// MCP PROTOCOL TYPES
// ============================================================================

export interface MCPServerInfo {
  name: string;
  version: string;
  protocolVersion: string;
}

export interface MCPCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  prompts?: {
    listChanged?: boolean;
  };
}

export interface MCPInitializeResult {
  serverInfo: MCPServerInfo;
  capabilities: MCPCapabilities;
}

// ============================================================================
// TOOL TYPES
// ============================================================================

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, MCPPropertySchema>;
    required?: string[];
  };
}

export interface MCPPropertySchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description?: string;
  enum?: string[];
  items?: MCPPropertySchema;
  properties?: Record<string, MCPPropertySchema>;
}

export interface MCPToolsListResult {
  tools: MCPToolDefinition[];
}

export interface MCPToolCallParams {
  name: string;
  arguments?: Record<string, unknown>;
}

export interface MCPToolResult {
  content: MCPContent[];
  isError?: boolean;
}

export interface MCPContent {
  type: 'text' | 'image' | 'resource';
  text?: string;
  data?: string;
  mimeType?: string;
  uri?: string;
}

// ============================================================================
// RESOURCE TYPES
// ============================================================================

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPResourcesListResult {
  resources: MCPResource[];
}

export interface MCPResourceReadResult {
  contents: MCPResourceContent[];
}

export interface MCPResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

// ============================================================================
// PROMPT TYPES
// ============================================================================

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: MCPPromptArgument[];
}

export interface MCPPromptArgument {
  name: string;
  description?: string;
  required?: boolean;
}

export interface MCPPromptsListResult {
  prompts: MCPPrompt[];
}

// ============================================================================
// SESSION & AUTH TYPES
// ============================================================================

export interface MCPSession {
  id: string;
  userId: string;
  workspaceId: string;
  accessToken: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface MCPAuthContext {
  userId: string;
  workspaceId: string;
  userEmail: string;
  userName: string;
}

// ============================================================================
// SSE MESSAGE TYPES
// ============================================================================

export interface SSEMessage {
  event?: string;
  data: string;
  id?: string;
  retry?: number;
}

export function formatSSEMessage(message: SSEMessage): string {
  let result = '';
  
  if (message.event) {
    result += `event: ${message.event}\n`;
  }
  
  if (message.id) {
    result += `id: ${message.id}\n`;
  }
  
  if (message.retry) {
    result += `retry: ${message.retry}\n`;
  }
  
  // Data can be multi-line, each line needs 'data: ' prefix
  const dataLines = message.data.split('\n');
  for (const line of dataLines) {
    result += `data: ${line}\n`;
  }
  
  result += '\n';
  return result;
}
