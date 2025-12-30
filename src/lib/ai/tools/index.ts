/**
 * AI Assistant Tool Definitions - Modular Structure
 *
 * These tools allow the AI assistant to execute actions on behalf of the user.
 * Each tool is mapped to a real API action in the platform.
 */

import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import type { ToolContext, ToolResult } from './types';
import { logger } from '@/lib/logger';

// Import all categories
import { crmToolDefinitions, crmToolImplementations } from './crm';
import { calendarToolDefinitions, calendarToolImplementations } from './calendar';
import { agentsToolDefinitions, agentsToolImplementations } from './agents';
import { analyticsToolDefinitions, analyticsToolImplementations } from './analytics';
import { contentToolDefinitions, contentToolImplementations } from './content';
import { knowledgeToolDefinitions, knowledgeToolImplementations } from './knowledge';
import { orchestrationToolDefinitions, orchestrationToolImplementations } from './orchestration';
import { tasksToolDefinitions, tasksToolImplementations } from './tasks';
import { financeToolDefinitions, financeToolImplementations } from './finance';
import { marketingToolDefinitions, marketingToolImplementations } from './marketing';

// Aggregate all tool definitions
export const aiTools: ChatCompletionTool[] = [
  ...crmToolDefinitions,
  ...calendarToolDefinitions,
  ...agentsToolDefinitions,
  ...analyticsToolDefinitions,
  ...contentToolDefinitions,
  ...knowledgeToolDefinitions,
  ...orchestrationToolDefinitions,
  ...tasksToolDefinitions,
  ...financeToolDefinitions,
  ...marketingToolDefinitions,
];

// Aggregate all implementations
const toolImplementations: Record<string, (args: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>> = {
  ...crmToolImplementations,
  ...calendarToolImplementations,
  ...agentsToolImplementations,
  ...analyticsToolImplementations,
  ...contentToolImplementations,
  ...knowledgeToolImplementations,
  ...orchestrationToolImplementations,
  ...tasksToolImplementations,
  ...financeToolImplementations,
  ...marketingToolImplementations,
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
  calendar: Object.keys(calendarToolImplementations),
  agents: Object.keys(agentsToolImplementations),
  analytics: Object.keys(analyticsToolImplementations),
  content: Object.keys(contentToolImplementations),
  knowledge: Object.keys(knowledgeToolImplementations),
  orchestration: Object.keys(orchestrationToolImplementations),
  tasks: Object.keys(tasksToolImplementations),
  finance: Object.keys(financeToolImplementations),
  marketing: Object.keys(marketingToolImplementations),
};

// ============================================================================
// HELPER: Get Tools by Capability
// ============================================================================

const capabilityToTools: Record<string, string[]> = {
  crm: ['crm', 'calendar', 'tasks'],
  marketing: ['marketing', 'content', 'analytics'],
  sales: ['crm', 'calendar', 'analytics', 'marketing'],
  finance: ['finance', 'analytics'],
  operations: ['tasks', 'calendar', 'orchestration'],
  agents: ['agents', 'orchestration'],
  knowledge: ['knowledge', 'content'],
  all: ['crm', 'calendar', 'agents', 'analytics', 'content', 'knowledge', 'orchestration', 'tasks', 'finance', 'marketing'],
};

export function getToolsForCapability(capability: string): ChatCompletionTool[] {
  const categories = capabilityToTools[capability] || capabilityToTools.all;

  const categoryToolDefs: Record<string, ChatCompletionTool[]> = {
    crm: crmToolDefinitions,
    calendar: calendarToolDefinitions,
    agents: agentsToolDefinitions,
    analytics: analyticsToolDefinitions,
    content: contentToolDefinitions,
    knowledge: knowledgeToolDefinitions,
    orchestration: orchestrationToolDefinitions,
    tasks: tasksToolDefinitions,
    finance: financeToolDefinitions,
    marketing: marketingToolDefinitions,
  };

  return categories.flatMap(cat => categoryToolDefs[cat] || []);
}

// Export types
export type { ToolContext, ToolResult } from './types';
