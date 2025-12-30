/**
 * AI Assistant Tool Definitions - Modular Structure
 * 
 * These tools allow the AI assistant to execute actions on behalf of the user.
 * Each tool is mapped to a real API action in the platform.
 */

import type { ToolContext, ToolResult, ToolDefinitions } from './types';
import { logger } from '@/lib/logger';

// Import all categories
import { crmToolDefinitions, crmToolImplementations } from './crm';
// import { calendarToolDefinitions, calendarToolImplementations } from './calendar';
// ... etc

// Aggregate all tools
export const aiTools: ToolDefinitions = [
  ...crmToolDefinitions,
  // More categories will be added here
];

// Aggregate all implementations
const toolImplementations = {
  ...crmToolImplementations,
  // More implementations will be added here
};

// ============================================================================
// TOOL EXECUTOR
// ============================================================================

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  context: ToolContext
): Promise<ToolResult> {
  const implementation = toolImplementations[toolName];
  
  if (!implementation) {
    logger.error('Unknown tool called', { toolName });
    return {
      success: false,
      message: `Unknown tool: ${toolName}`,
    };
  }

  logger.info('Executing AI tool', { toolName, workspaceId: context.workspaceId });
  
  try {
    const result = await implementation(args, context);
    logger.info('AI tool completed', { toolName, success: result.success });
    return result;
  } catch (error) {
    logger.error('AI tool execution failed', { toolName, error });
    return {
      success: false,
      message: `Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

// ============================================================================
// HELPER: Get Tool Names by Category
// ============================================================================

export const toolsByCategory = {
  crm: Object.keys(crmToolImplementations),
  // More categories will be added here
};

// Export types
export type { ToolContext, ToolResult } from './types';
