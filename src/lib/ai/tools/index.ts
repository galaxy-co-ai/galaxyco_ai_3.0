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
  crm: ['create_lead', 'search_leads', 'update_lead_stage', 'create_contact', 'add_note', 'get_activity_timeline', 'auto_qualify_lead', 'draft_proposal', 'schedule_demo', 'create_follow_up_sequence'],
  calendar: ['schedule_meeting', 'get_upcoming_events', 'find_available_times', 'book_meeting_rooms'],
  tasks: ['create_task', 'prioritize_tasks', 'batch_similar_tasks', 'assign_to_team_member'],
  analytics: ['get_pipeline_summary', 'get_hot_leads', 'get_conversion_metrics', 'forecast_revenue', 'get_team_performance'],
  agents: ['list_agents', 'run_agent', 'get_agent_status', 'create_agent_quick'],
  content: ['draft_email', 'send_email', 'generate_document', 'create_professional_document', 'generate_image', 'organize_documents', 'save_upload_to_library'],
  knowledge: ['search_knowledge', 'create_document', 'generate_document', 'create_collection', 'list_collections', 'create_professional_document', 'organize_documents', 'save_upload_to_library', 'search_web'],
  dashboard: ['update_dashboard_roadmap', 'create_lead', 'create_contact', 'create_task', 'schedule_meeting', 'create_agent', 'create_agent_quick', 'search_knowledge', 'analyze_company_website', 'post_to_social_media', 'search_web', 'generate_image', 'create_professional_document', 'navigate_to_page', 'generate_pdf'],
  automation: ['create_automation'],
  team: ['list_team_members', 'assign_to_team_member'],
  content_cockpit: [
    'add_content_source',
    'add_to_hit_list',
    'get_hit_list_insights',
    'reprioritize_hit_list',
    'get_article_analytics',
    'get_content_insights',
    'get_use_case_recommendation',
    'get_source_suggestions',
  ],
  orchestration: [
    'create_agent_team',
    'list_agent_teams',
    'run_agent_team',
    'get_team_status',
    'create_workflow',
    'execute_workflow',
    'get_workflow_status',
    'delegate_to_agent',
    'coordinate_agents',
    'check_agent_availability',
    'store_shared_context',
    'retrieve_agent_memory',
  ],
  marketing: [
    'create_campaign',
    'get_campaign_stats',
    'update_campaign_roadmap',
    'launch_campaign',
    'generate_image',
    'generate_marketing_copy',
    'analyze_brand_message',
    'create_content_calendar',
    'generate_brand_guidelines',
    'optimize_campaign',
    'segment_audience',
    'schedule_social_posts',
    'post_to_social_media',
    'analyze_competitor',
    'analyze_lead_for_campaign',
    'suggest_next_marketing_action',
    'score_campaign_effectiveness',
  ],
  deals: ['create_deal', 'update_deal', 'get_deals_closing_soon'],
  finance: ['get_finance_summary', 'get_overdue_invoices', 'send_invoice_reminder', 'generate_cash_flow_forecast', 'compare_financial_periods', 'get_finance_integrations', 'auto_categorize_expenses', 'flag_anomalies', 'project_cash_flow', 'send_payment_reminders'],
};

// ============================================================================
// HELPER: Get Tools by Capability
// ============================================================================

export function getToolsForCapability(capability: string): ChatCompletionTool[] {
  const toolNames: string[] = [];

  switch (capability) {
    case 'workflow':
      toolNames.push(...toolsByCategory.agents, ...toolsByCategory.tasks);
      break;
    case 'insights':
      toolNames.push(...toolsByCategory.analytics, ...toolsByCategory.crm);
      break;
    case 'content':
      toolNames.push(...toolsByCategory.content);
      break;
    case 'scheduling':
      toolNames.push(...toolsByCategory.calendar);
      break;
    case 'leads':
      toolNames.push(...toolsByCategory.crm, ...toolsByCategory.analytics);
      break;
    case 'sales':
      toolNames.push(...toolsByCategory.crm, ...toolsByCategory.calendar, ...toolsByCategory.analytics, ...toolsByCategory.marketing);
      break;
    case 'research':
      toolNames.push(...toolsByCategory.crm);
      break;
    case 'finance':
      toolNames.push(...toolsByCategory.finance, ...toolsByCategory.analytics);
      break;
    case 'marketing':
      toolNames.push(...toolsByCategory.marketing, ...toolsByCategory.content, ...toolsByCategory.crm);
      break;
    case 'dashboard':
      toolNames.push(...toolsByCategory.dashboard, ...toolsByCategory.crm, ...toolsByCategory.tasks, ...toolsByCategory.calendar, ...toolsByCategory.agents);
      break;
    case 'orchestration':
      toolNames.push(...toolsByCategory.orchestration, ...toolsByCategory.agents);
      break;
    case 'content_cockpit':
      toolNames.push(...toolsByCategory.content_cockpit, ...toolsByCategory.content);
      break;
    default:
      // Return all tools
      return aiTools;
  }

  return aiTools.filter((tool) => {
    if (tool.type === 'function' && 'function' in tool) {
      return toolNames.includes(tool.function.name);
    }
    return false;
  });
}

// Export types
export type { ToolContext, ToolResult } from './types';
