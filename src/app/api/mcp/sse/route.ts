/**
 * Neptune MCP Server - Unified Endpoint
 * 
 * Single endpoint for ChatGPT MCP integration supporting both:
 * - JSON-RPC 2.0 over POST (primary method for ChatGPT)
 * - Server-Sent Events over GET (for real-time updates)
 * 
 * ChatGPT Connection URL: https://app.galaxyco.ai/api/mcp/sse
 * 
 * Protocol: Model Context Protocol (MCP) 2024-11-05
 * Reference: https://modelcontextprotocol.io/
 */

import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { verifyAccessToken } from '../auth/token/route';
import { mcpTools, executeTool } from '@/lib/mcp/tools';
import {
  type JsonRpcRequest,
  type JsonRpcResponse,
  type MCPInitializeResult,
  type MCPToolsListResult,
  type MCPToolResult,
  type MCPAuthContext,
  JSON_RPC_ERRORS,
  formatSSEMessage,
} from '@/lib/mcp/types';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// ============================================================================
// CORS CONFIGURATION FOR CHATGPT
// ============================================================================

const CHATGPT_ORIGINS = [
  'https://chatgpt.com',
  'https://chat.openai.com',
  'https://www.chatgpt.com',
  'https://www.chat.openai.com',
];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // ChatGPT requires wildcard for initial handshake
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, MCP-Protocol-Version',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '86400',
};

// ============================================================================
// MCP SERVER INFO
// ============================================================================

const SERVER_INFO = {
  name: 'Neptune by Galaxy Co',
  version: '1.0.0',
  protocolVersion: '2024-11-05',
};

const CAPABILITIES = {
  tools: {
    listChanged: false,
  },
};

// ============================================================================
// SSE ENDPOINT
// ============================================================================

export async function GET(request: NextRequest) {
  // Extract access token from Authorization header or query param
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '') || 
                request.nextUrl.searchParams.get('token');

  if (!token) {
    return new Response(
      JSON.stringify({ error: 'unauthorized', message: 'Access token required' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Verify the access token
  const tokenData = await verifyAccessToken(token);
  if (!tokenData) {
    return new Response(
      JSON.stringify({ error: 'unauthorized', message: 'Invalid or expired access token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Get user info for context
  let userEmail = '';
  let userName = '';
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, tokenData.userId),
    });
    userEmail = user?.email || '';
    userName = user?.firstName && user?.lastName 
      ? `${user.firstName} ${user.lastName}`.trim() 
      : user?.firstName || '';
  } catch {
    // User lookup failed, continue with basic info
  }

  const authContext: MCPAuthContext = {
    userId: tokenData.userId,
    workspaceId: tokenData.workspaceId,
    userEmail,
    userName,
  };

  logger.info('[MCP SSE] Connection established', {
    userId: tokenData.userId,
    workspaceId: tokenData.workspaceId,
  });

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const connectionMessage = formatSSEMessage({
        event: 'open',
        data: JSON.stringify({ status: 'connected', serverInfo: SERVER_INFO }),
      });
      controller.enqueue(new TextEncoder().encode(connectionMessage));

      // Keep connection alive with periodic pings
      const pingInterval = setInterval(() => {
        try {
          const ping = formatSSEMessage({
            event: 'ping',
            data: JSON.stringify({ timestamp: Date.now() }),
          });
          controller.enqueue(new TextEncoder().encode(ping));
        } catch {
          clearInterval(pingInterval);
        }
      }, 30000); // Every 30 seconds

      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval);
        controller.close();
        logger.info('[MCP SSE] Connection closed', { userId: tokenData.userId });
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

// ============================================================================
// JSON-RPC MESSAGE HANDLER (POST)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Extract access token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Access token required' }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          } 
        }
      );
    }

    // Verify the access token
    const tokenData = await verifyAccessToken(token);
    if (!tokenData) {
      return new Response(
        JSON.stringify({ error: 'unauthorized', message: 'Invalid or expired access token' }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            ...CORS_HEADERS,
          } 
        }
      );
    }

    // Get user info for context
    let userEmail = '';
    let userName = '';
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, tokenData.userId),
      });
      userEmail = user?.email || '';
      userName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}`.trim() 
        : user?.firstName || '';
    } catch {
      // User lookup failed, continue with basic info
    }

    const authContext: MCPAuthContext = {
      userId: tokenData.userId,
      workspaceId: tokenData.workspaceId,
      userEmail,
      userName,
    };

    // Parse JSON-RPC request
    const rpcRequest: JsonRpcRequest = await request.json();

    logger.debug('[MCP] Received request', {
      method: rpcRequest.method,
      id: rpcRequest.id,
    });

    // Handle the request
    const response = await handleJsonRpcRequest(rpcRequest, authContext);

    return new Response(JSON.stringify(response), {
      headers: { 
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
      },
    });
  } catch (error) {
    logger.error('[MCP] Request failed', { error });
    
    const errorResponse: JsonRpcResponse = {
      jsonrpc: '2.0',
      id: 0,
      error: {
        code: JSON_RPC_ERRORS.INTERNAL_ERROR,
        message: 'Internal server error',
      },
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
      },
    });
  }
}

// ============================================================================
// JSON-RPC REQUEST HANDLER
// ============================================================================

async function handleJsonRpcRequest(
  request: JsonRpcRequest,
  context: MCPAuthContext
): Promise<JsonRpcResponse> {
  const { method, params, id } = request;

  switch (method) {
    case 'initialize':
      return handleInitialize(id);

    case 'tools/list':
      return handleToolsList(id);

    case 'tools/call':
      return handleToolCall(id, params as { name: string; arguments?: Record<string, unknown> }, context);

    case 'ping':
      return {
        jsonrpc: '2.0',
        id,
        result: { pong: true },
      };

    default:
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: JSON_RPC_ERRORS.METHOD_NOT_FOUND,
          message: `Method not found: ${method}`,
        },
      };
  }
}

// ============================================================================
// METHOD HANDLERS
// ============================================================================

function handleInitialize(id: string | number): JsonRpcResponse {
  const result: MCPInitializeResult = {
    serverInfo: SERVER_INFO,
    capabilities: CAPABILITIES,
  };

  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

function handleToolsList(id: string | number): JsonRpcResponse {
  const result: MCPToolsListResult = {
    tools: mcpTools,
  };

  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

async function handleToolCall(
  id: string | number,
  params: { name: string; arguments?: Record<string, unknown> },
  context: MCPAuthContext
): Promise<JsonRpcResponse> {
  if (!params?.name) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: JSON_RPC_ERRORS.INVALID_PARAMS,
        message: 'Tool name is required',
      },
    };
  }

  // Check if tool exists
  const tool = mcpTools.find((t) => t.name === params.name);
  if (!tool) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: JSON_RPC_ERRORS.INVALID_PARAMS,
        message: `Unknown tool: ${params.name}`,
      },
    };
  }

  // Execute the tool
  const result: MCPToolResult = await executeTool(
    params.name,
    params.arguments || {},
    context
  );

  return {
    jsonrpc: '2.0',
    id,
    result,
  };
}

// ============================================================================
// CORS OPTIONS (Required for ChatGPT preflight)
// ============================================================================

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}
