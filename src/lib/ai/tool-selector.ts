/**
 * Dynamic Tool Selection
 * 
 * Intelligently selects only relevant tools for each request instead of sending all 94.
 * Reduces token usage by ~70%, improves response time, and increases accuracy.
 */

import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import type { PageContextData } from '@/lib/neptune/page-context';
import { aiTools, toolsByCategory } from './tools';
import { logger } from '@/lib/logger';

export interface Message {
  role: string;
  content: string;
}

// Page-specific tool mappings
const pageToolMap: Record<string, string[]> = {
  // CRM module
  'crm': [...toolsByCategory.crm, ...toolsByCategory.deals, ...toolsByCategory.analytics],
  
  // Dashboard - show most common tools
  'dashboard': [...toolsByCategory.dashboard],
  
  // Content Cockpit
  'creator': [...toolsByCategory.content_cockpit, ...toolsByCategory.content],
  
  // Marketing
  'marketing': [...toolsByCategory.marketing, ...toolsByCategory.content],
  
  // Finance
  'finance': [...toolsByCategory.finance, ...toolsByCategory.analytics],
  
  // Agents & Orchestration
  'agents': [...toolsByCategory.agents, ...toolsByCategory.orchestration],
  'orchestration': [...toolsByCategory.orchestration, ...toolsByCategory.agents],
  
  // Knowledge Base
  'knowledge': [...toolsByCategory.knowledge, ...toolsByCategory.content],
  'knowledge-base': [...toolsByCategory.knowledge, ...toolsByCategory.content],
  
  // Tasks & Calendar
  'calendar': [...toolsByCategory.calendar, ...toolsByCategory.tasks],
  
  // Conversations
  'conversations': [...toolsByCategory.content, ...toolsByCategory.crm],
  
  // Settings - minimal tools
  'settings': [...toolsByCategory.team],
  
  // Lunar Labs - all tools for experimentation
  'lunar-labs': [], // Will use all tools
  
  // Neptune HQ - analytics about Neptune
  'neptune-hq': [...toolsByCategory.analytics],
};

/**
 * Main function: Select relevant tools for a request
 */
export async function selectRelevantTools(
  message: string,
  pageContext?: PageContextData,
  conversationHistory?: Message[],
  options: {
    maxTools?: number;
    forceInclude?: string[];
  } = {}
): Promise<ChatCompletionTool[]> {
  const { maxTools = 20, forceInclude = [] } = options;
  
  logger.debug('Selecting relevant tools', {
    messageLength: message.length,
    module: pageContext?.module,
    pageType: pageContext?.pageType,
  });
  
  const selectedToolNames = new Set<string>(forceInclude);
  
  // Step 1: Intent-based tool selection (using suggested tools directly)
  // Note: Full intent classification requires workspace context, so we'll use
  // the suggested tools from page context and message analysis instead
  // This will be enhanced in Phase 2 with full context integration
  
  // Step 2: Page-aware tool filtering
  if (pageContext?.module) {
    const pageTools = pageToolMap[pageContext.module] || [];
    
    // For lunar-labs, include all tools
    if (pageContext.module === 'lunar-labs') {
      return aiTools;
    }
    
    pageTools.forEach(toolName => selectedToolNames.add(toolName));
    
    logger.debug('Page-aware selection', {
      module: pageContext.module,
      pageTools: pageTools.length,
      totalSelected: selectedToolNames.size,
    });
  }
  
  // Step 3: Context-based additions
  // If user mentions specific entities, add relevant tools
  if (message.toLowerCase().includes('lead')) {
    toolsByCategory.crm.forEach(t => selectedToolNames.add(t));
  }
  if (message.toLowerCase().includes('meeting') || message.toLowerCase().includes('schedule')) {
    toolsByCategory.calendar.forEach(t => selectedToolNames.add(t));
  }
  if (message.toLowerCase().includes('task')) {
    toolsByCategory.tasks.forEach(t => selectedToolNames.add(t));
  }
  if (message.toLowerCase().includes('campaign')) {
    toolsByCategory.marketing.forEach(t => selectedToolNames.add(t));
  }
  if (message.toLowerCase().includes('agent') || message.toLowerCase().includes('workflow')) {
    toolsByCategory.agents.forEach(t => selectedToolNames.add(t));
    toolsByCategory.orchestration.forEach(t => selectedToolNames.add(t));
  }
  
  // Step 4: Long/complex messages might need more tools
  if (message.length > 200) {
    // Add analytics and content tools for complex queries
    toolsByCategory.analytics.slice(0, 3).forEach(t => selectedToolNames.add(t));
    toolsByCategory.content.slice(0, 3).forEach(t => selectedToolNames.add(t));
  }
  
  // Step 5: Always include essential tools
  const essentialTools = [
    'search_knowledge',
    'search_web',
    'create_task',
    'navigate_to_page',
  ];
  essentialTools.forEach(t => selectedToolNames.add(t));
  
  // Step 6: Filter aiTools to only selected ones
  const selectedTools = aiTools.filter(tool => {
    if (tool.type === 'function' && 'function' in tool) {
      return selectedToolNames.has(tool.function.name);
    }
    return false;
  });
  
  // Step 7: Limit to maxTools
  const finalTools = selectedTools.slice(0, maxTools);
  
  logger.info('Tool selection complete', {
    totalAvailable: aiTools.length,
    selected: finalTools.length,
    reduction: `${Math.round((1 - finalTools.length / aiTools.length) * 100)}%`,
  });
  
  return finalTools;
}

/**
 * Get tools for a specific page/module
 */
export function getToolsForPage(module: string): string[] {
  return pageToolMap[module] || [];
}

/**
 * Estimate token savings from tool selection
 */
export function estimateTokenSavings(
  originalToolCount: number,
  selectedToolCount: number
): { tokensSaved: number; percentReduction: number } {
  // Average tool definition is ~30 tokens
  const avgTokensPerTool = 30;
  const tokensSaved = (originalToolCount - selectedToolCount) * avgTokensPerTool;
  const percentReduction = ((originalToolCount - selectedToolCount) / originalToolCount) * 100;
  
  return {
    tokensSaved,
    percentReduction: Math.round(percentReduction),
  };
}
