/**
 * Neptune Autonomy Learning System
 * 
 * Tracks user responses to Neptune suggestions and learns when to auto-execute actions.
 * Starts cautious, learns from patterns, gradually becomes more autonomous.
 */

import { db } from '@/lib/db';
import { neptuneActionHistory, userAutonomyPreferences } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type AutonomyLevel = 'low' | 'medium' | 'high';

export interface ActionRiskLevel {
  toolName: string;
  level: AutonomyLevel;
  defaultConfidence: number; // Starting confidence (0-100)
}

// Risk classification for all tools
// Updated 2025-12-17: Comprehensive classification of all 101 Neptune tools
export const TOOL_RISK_LEVELS: Record<string, ActionRiskLevel> = {
  // ============================================================================
  // LOW-RISK TOOLS: Auto-execute immediately (read-only, organizational, safe)
  // ============================================================================
  
  // Analytics & Reporting (read-only)
  get_pipeline_summary: { toolName: 'get_pipeline_summary', level: 'low', defaultConfidence: 90 },
  get_campaign_stats: { toolName: 'get_campaign_stats', level: 'low', defaultConfidence: 90 },
  get_hot_leads: { toolName: 'get_hot_leads', level: 'low', defaultConfidence: 90 },
  get_conversion_metrics: { toolName: 'get_conversion_metrics', level: 'low', defaultConfidence: 90 },
  get_team_performance: { toolName: 'get_team_performance', level: 'low', defaultConfidence: 85 },
  get_activity_timeline: { toolName: 'get_activity_timeline', level: 'low', defaultConfidence: 85 },
  get_deals_closing_soon: { toolName: 'get_deals_closing_soon', level: 'low', defaultConfidence: 90 },
  get_finance_summary: { toolName: 'get_finance_summary', level: 'low', defaultConfidence: 85 },
  get_overdue_invoices: { toolName: 'get_overdue_invoices', level: 'low', defaultConfidence: 85 },
  get_finance_integrations: { toolName: 'get_finance_integrations', level: 'low', defaultConfidence: 90 },
  compare_financial_periods: { toolName: 'compare_financial_periods', level: 'low', defaultConfidence: 85 },
  forecast_revenue: { toolName: 'forecast_revenue', level: 'low', defaultConfidence: 80 },
  generate_cash_flow_forecast: { toolName: 'generate_cash_flow_forecast', level: 'low', defaultConfidence: 80 },
  project_cash_flow: { toolName: 'project_cash_flow', level: 'low', defaultConfidence: 75 },
  
  // Search & Retrieval (read-only)
  search_leads: { toolName: 'search_leads', level: 'low', defaultConfidence: 90 },
  search_knowledge: { toolName: 'search_knowledge', level: 'low', defaultConfidence: 90 },
  search_web: { toolName: 'search_web', level: 'low', defaultConfidence: 85 },
  list_agents: { toolName: 'list_agents', level: 'low', defaultConfidence: 90 },
  list_agent_teams: { toolName: 'list_agent_teams', level: 'low', defaultConfidence: 90 },
  list_collections: { toolName: 'list_collections', level: 'low', defaultConfidence: 90 },
  list_team_members: { toolName: 'list_team_members', level: 'low', defaultConfidence: 90 },
  get_agent_status: { toolName: 'get_agent_status', level: 'low', defaultConfidence: 85 },
  get_team_status: { toolName: 'get_team_status', level: 'low', defaultConfidence: 85 },
  get_workflow_status: { toolName: 'get_workflow_status', level: 'low', defaultConfidence: 85 },
  get_upcoming_events: { toolName: 'get_upcoming_events', level: 'low', defaultConfidence: 85 },
  find_available_times: { toolName: 'find_available_times', level: 'low', defaultConfidence: 80 },
  check_agent_availability: { toolName: 'check_agent_availability', level: 'low', defaultConfidence: 85 },
  retrieve_agent_memory: { toolName: 'retrieve_agent_memory', level: 'low', defaultConfidence: 85 },
  
  // Analysis & Insights (non-destructive)
  analyze_company_website: { toolName: 'analyze_company_website', level: 'low', defaultConfidence: 85 },
  analyze_brand_message: { toolName: 'analyze_brand_message', level: 'low', defaultConfidence: 80 },
  analyze_competitor: { toolName: 'analyze_competitor', level: 'low', defaultConfidence: 80 },
  analyze_lead_for_campaign: { toolName: 'analyze_lead_for_campaign', level: 'low', defaultConfidence: 80 },
  auto_qualify_lead: { toolName: 'auto_qualify_lead', level: 'low', defaultConfidence: 75 },
  score_campaign_effectiveness: { toolName: 'score_campaign_effectiveness', level: 'low', defaultConfidence: 80 },
  
  // Organization & Prioritization (reversible)
  prioritize_tasks: { toolName: 'prioritize_tasks', level: 'low', defaultConfidence: 75 },
  batch_similar_tasks: { toolName: 'batch_similar_tasks', level: 'low', defaultConfidence: 70 },
  organize_documents: { toolName: 'organize_documents', level: 'low', defaultConfidence: 70 },
  auto_categorize_expenses: { toolName: 'auto_categorize_expenses', level: 'low', defaultConfidence: 75 },
  flag_anomalies: { toolName: 'flag_anomalies', level: 'low', defaultConfidence: 70 },
  reprioritize_hit_list: { toolName: 'reprioritize_hit_list', level: 'low', defaultConfidence: 75 },
  
  // Content Cockpit (read-only insights)
  get_hit_list_insights: { toolName: 'get_hit_list_insights', level: 'low', defaultConfidence: 85 },
  get_article_analytics: { toolName: 'get_article_analytics', level: 'low', defaultConfidence: 85 },
  get_content_insights: { toolName: 'get_content_insights', level: 'low', defaultConfidence: 85 },
  get_use_case_recommendation: { toolName: 'get_use_case_recommendation', level: 'low', defaultConfidence: 85 },
  get_source_suggestions: { toolName: 'get_source_suggestions', level: 'low', defaultConfidence: 85 },
  
  // Navigation & UI (safe operations)
  navigate_to_page: { toolName: 'navigate_to_page', level: 'low', defaultConfidence: 90 },
  
  // ============================================================================
  // MEDIUM-RISK TOOLS: Ask first, learn over time (creates/modifies data)
  // ============================================================================
  
  // CRM Operations (increased confidence - common, reversible actions)
  create_lead: { toolName: 'create_lead', level: 'medium', defaultConfidence: 50 },
  create_contact: { toolName: 'create_contact', level: 'medium', defaultConfidence: 50 },
  update_lead_stage: { toolName: 'update_lead_stage', level: 'medium', defaultConfidence: 45 },
  create_deal: { toolName: 'create_deal', level: 'medium', defaultConfidence: 45 },
  update_deal: { toolName: 'update_deal', level: 'medium', defaultConfidence: 40 },
  
  // Task Management & Notes (RECLASSIFIED TO LOW - safe, reversible, UI-only)
  create_task: { toolName: 'create_task', level: 'low', defaultConfidence: 80 },
  add_note: { toolName: 'add_note', level: 'low', defaultConfidence: 85 },
  assign_to_team_member: { toolName: 'assign_to_team_member', level: 'medium', defaultConfidence: 40 },
  
  // Agent & Orchestration (increased confidence - core Neptune functionality)
  create_agent: { toolName: 'create_agent', level: 'medium', defaultConfidence: 60 },
  run_agent: { toolName: 'run_agent', level: 'medium', defaultConfidence: 55 },
  create_agent_team: { toolName: 'create_agent_team', level: 'medium', defaultConfidence: 50 },
  run_agent_team: { toolName: 'run_agent_team', level: 'medium', defaultConfidence: 50 },
  delegate_to_agent: { toolName: 'delegate_to_agent', level: 'medium', defaultConfidence: 50 },
  coordinate_agents: { toolName: 'coordinate_agents', level: 'medium', defaultConfidence: 45 },
  store_shared_context: { toolName: 'store_shared_context', level: 'low', defaultConfidence: 80 },
  
  // Workflow & Automation (increased confidence)
  create_workflow: { toolName: 'create_workflow', level: 'medium', defaultConfidence: 45 },
  execute_workflow: { toolName: 'execute_workflow', level: 'medium', defaultConfidence: 40 },
  create_automation: { toolName: 'create_automation', level: 'medium', defaultConfidence: 40 },
  
  // Marketing Operations (increased confidence + reclassify safe ones)
  create_campaign: { toolName: 'create_campaign', level: 'medium', defaultConfidence: 50 },
  launch_campaign: { toolName: 'launch_campaign', level: 'medium', defaultConfidence: 35 },
  update_campaign_roadmap: { toolName: 'update_campaign_roadmap', level: 'low', defaultConfidence: 80 },
  optimize_campaign: { toolName: 'optimize_campaign', level: 'low', defaultConfidence: 75 },
  segment_audience: { toolName: 'segment_audience', level: 'low', defaultConfidence: 75 },
  create_content_calendar: { toolName: 'create_content_calendar', level: 'low', defaultConfidence: 70 },
  generate_brand_guidelines: { toolName: 'generate_brand_guidelines', level: 'low', defaultConfidence: 70 },
  suggest_next_marketing_action: { toolName: 'suggest_next_marketing_action', level: 'low', defaultConfidence: 85 },
  
  // Content Generation (RECLASSIFIED - safe, creates drafts not final content)
  generate_image: { toolName: 'generate_image', level: 'low', defaultConfidence: 75 },
  generate_marketing_copy: { toolName: 'generate_marketing_copy', level: 'low', defaultConfidence: 70 },
  generate_document: { toolName: 'generate_document', level: 'low', defaultConfidence: 70 },
  create_document: { toolName: 'create_document', level: 'low', defaultConfidence: 75 },
  create_professional_document: { toolName: 'create_professional_document', level: 'low', defaultConfidence: 70 },
  generate_pdf: { toolName: 'generate_pdf', level: 'low', defaultConfidence: 70 },
  save_upload_to_library: { toolName: 'save_upload_to_library', level: 'low', defaultConfidence: 90 },
  
  // Knowledge Base (RECLASSIFIED - organizational, safe)
  create_collection: { toolName: 'create_collection', level: 'low', defaultConfidence: 80 },
  add_content_source: { toolName: 'add_content_source', level: 'low', defaultConfidence: 75 },
  add_to_hit_list: { toolName: 'add_to_hit_list', level: 'low', defaultConfidence: 80 },
  
  // Calendar & Meetings (increased confidence - common actions)
  schedule_meeting: { toolName: 'schedule_meeting', level: 'medium', defaultConfidence: 45 },
  book_meeting_rooms: { toolName: 'book_meeting_rooms', level: 'medium', defaultConfidence: 40 },
  
  // Social Media (drafts/scheduling - increased confidence)
  schedule_social_posts: { toolName: 'schedule_social_posts', level: 'medium', defaultConfidence: 40 },
  post_to_social_media: { toolName: 'post_to_social_media', level: 'medium', defaultConfidence: 30 },
  
  // Dashboard & Roadmap (Phase 1E - auto-update on actions)
  update_dashboard_roadmap: { toolName: 'update_dashboard_roadmap', level: 'low', defaultConfidence: 95 },
  
  // Drafting (RECLASSIFIED - creates drafts, not final content)
  draft_email: { toolName: 'draft_email', level: 'low', defaultConfidence: 75 },
  draft_proposal: { toolName: 'draft_proposal', level: 'low', defaultConfidence: 70 },
  create_follow_up_sequence: { toolName: 'create_follow_up_sequence', level: 'low', defaultConfidence: 70 },
  
  // ============================================================================
  // HIGH-RISK TOOLS: Always confirm (irreversible external actions)
  // ============================================================================
  
  // Email Sending (external communication)
  send_email: { toolName: 'send_email', level: 'high', defaultConfidence: 0 },
  send_invoice_reminder: { toolName: 'send_invoice_reminder', level: 'high', defaultConfidence: 0 },
  send_payment_reminders: { toolName: 'send_payment_reminders', level: 'high', defaultConfidence: 0 },
  
  // Customer-facing Scheduling
  schedule_demo: { toolName: 'schedule_demo', level: 'high', defaultConfidence: 0 },
};

// ============================================================================
// AUTONOMY DECISION LOGIC
// ============================================================================

/**
 * Determine if an action should be auto-executed based on learned preferences
 */
export async function shouldAutoExecute(
  toolName: string,
  workspaceId: string,
  userId: string
): Promise<{ autoExecute: boolean; confidence: number; reason: string }> {
  const riskLevel = TOOL_RISK_LEVELS[toolName];
  
  if (!riskLevel) {
    // Unknown tool - always ask
    return {
      autoExecute: false,
      confidence: 0,
      reason: 'Unknown tool - requires confirmation',
    };
  }

  // Low-risk tools: Auto-execute by default
  if (riskLevel.level === 'low') {
    return {
      autoExecute: true,
      confidence: riskLevel.defaultConfidence,
      reason: 'Low-risk action - safe to auto-execute',
    };
  }

  // High-risk tools: Never auto-execute
  if (riskLevel.level === 'high') {
    return {
      autoExecute: false,
      confidence: 0,
      reason: 'High-risk action - requires confirmation',
    };
  }

  // Medium-risk tools: Check learned preferences
  const preference = await getUserAutonomyPreference(workspaceId, userId, toolName);
  
  if (!preference) {
    // No learning yet - ask first
    return {
      autoExecute: false,
      confidence: 0,
      reason: 'No learning history - asking for confirmation',
    };
  }

  // Check if user has enabled auto-execute
  if (preference.autoExecuteEnabled && preference.confidenceScore >= 80) {
    return {
      autoExecute: true,
      confidence: preference.confidenceScore,
      reason: `Learned preference: ${preference.approvalCount} approvals, ${preference.confidenceScore}% confidence`,
    };
  }

  // Confidence is high but not enabled yet - offer to enable
  if (preference.confidenceScore >= 60 && !preference.autoExecuteEnabled) {
    return {
      autoExecute: false,
      confidence: preference.confidenceScore,
      reason: `High confidence (${preference.confidenceScore}%) but auto-execute not enabled - offer to enable`,
    };
  }

  // Low confidence - ask
  return {
    autoExecute: false,
    confidence: preference.confidenceScore,
    reason: `Low confidence (${preference.confidenceScore}%) - asking for confirmation`,
  };
}

/**
 * Get user's autonomy preference for a specific tool
 */
async function getUserAutonomyPreference(
  workspaceId: string,
  userId: string,
  toolName: string
) {
  try {
    const preference = await db.query.userAutonomyPreferences.findFirst({
      where: and(
        eq(userAutonomyPreferences.workspaceId, workspaceId),
        eq(userAutonomyPreferences.userId, userId),
        eq(userAutonomyPreferences.toolName, toolName)
      ),
    });

    return preference || null;
  } catch (error) {
    logger.error('Failed to get autonomy preference', { workspaceId, userId, toolName, error });
    return null;
  }
}

// ============================================================================
// LEARNING FROM USER ACTIONS
// ============================================================================

/**
 * Record an action execution and update learning
 */
export async function recordActionExecution(
  workspaceId: string,
  userId: string,
  toolName: string,
  wasAutomatic: boolean,
  userApproved: boolean | null,
  executionTime: number,
  resultStatus: 'success' | 'failed' | 'pending'
): Promise<void> {
  try {
    // Record in history
    await db.insert(neptuneActionHistory).values({
      workspaceId,
      userId,
      actionType: toolName,
      toolName,
      wasAutomatic,
      userApproved,
      executionTime,
      resultStatus,
    });

    // Update learning if user provided feedback
    if (userApproved !== null) {
      await updateAutonomyLearning(workspaceId, userId, toolName, userApproved);
    }
  } catch (error) {
    logger.error('Failed to record action execution', { workspaceId, userId, toolName, error });
  }
}

/**
 * Update autonomy learning based on user approval/rejection
 */
async function updateAutonomyLearning(
  workspaceId: string,
  userId: string,
  toolName: string,
  approved: boolean
): Promise<void> {
  try {
    const existing = await getUserAutonomyPreference(workspaceId, userId, toolName);
    const riskLevel = TOOL_RISK_LEVELS[toolName];
    const defaultConfidence = riskLevel?.defaultConfidence || 0;

    if (existing) {
      // Update existing preference
      const newApprovalCount = approved ? existing.approvalCount + 1 : existing.approvalCount;
      const newRejectionCount = approved ? existing.rejectionCount : existing.rejectionCount + 1;
      const total = newApprovalCount + newRejectionCount;

      // Calculate confidence: (approvals / total) * 100, with minimum based on default
      let newConfidence = total > 0 
        ? Math.round((newApprovalCount / total) * 100)
        : defaultConfidence;

      // Boost confidence if we have consistent approvals
      if (approved && newApprovalCount >= 3 && newRejectionCount === 0) {
        newConfidence = Math.min(90, newConfidence + 15);
      }

      // Decay old rejections (reduce impact of old rejections over time)
      // If last update was > 30 days ago, reduce rejection impact
      const daysSinceLastUpdate = existing.lastUpdated
        ? Math.floor((Date.now() - existing.lastUpdated.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      if (daysSinceLastUpdate > 30 && newRejectionCount > 0) {
        // Reduce effective rejection count for old rejections
        const effectiveRejections = Math.max(0, newRejectionCount - Math.floor(daysSinceLastUpdate / 30));
        newConfidence = (newApprovalCount + effectiveRejections) > 0
          ? Math.round((newApprovalCount / (newApprovalCount + effectiveRejections)) * 100)
          : defaultConfidence;
      }

      // Reset if user rejects 2x in a row (only if recent - within last 7 days)
      if (!approved && newRejectionCount >= 2 && existing.approvalCount === 0 && daysSinceLastUpdate < 7) {
        newConfidence = 0;
      }

      // Auto-enable if confidence >= 80 and user has approved 5+ times (lowered from 10)
      const autoExecuteEnabled = newConfidence >= 80 && newApprovalCount >= 5;

      await db.update(userAutonomyPreferences)
        .set({
          confidenceScore: newConfidence,
          approvalCount: newApprovalCount,
          rejectionCount: newRejectionCount,
          autoExecuteEnabled,
          lastUpdated: new Date(),
        })
        .where(
          and(
            eq(userAutonomyPreferences.workspaceId, workspaceId),
            eq(userAutonomyPreferences.userId, userId),
            eq(userAutonomyPreferences.toolName, toolName)
          )
        );
    } else {
      // Create new preference
      const initialConfidence = approved ? 20 : 0;
      
      await db.insert(userAutonomyPreferences).values({
        workspaceId,
        userId,
        actionType: toolName,
        toolName,
        confidenceScore: initialConfidence,
        approvalCount: approved ? 1 : 0,
        rejectionCount: approved ? 0 : 1,
        autoExecuteEnabled: false,
      });
    }
  } catch (error) {
    logger.error('Failed to update autonomy learning', { workspaceId, userId, toolName, error });
  }
}

/**
 * Get autonomy summary for a user
 */
export async function getAutonomySummary(
  workspaceId: string,
  userId: string
): Promise<{
  totalActions: number;
  autoEnabledCount: number;
  averageConfidence: number;
  topAutoTools: Array<{ toolName: string; confidence: number }>;
}> {
  try {
    const preferences = await db.query.userAutonomyPreferences.findMany({
      where: and(
        eq(userAutonomyPreferences.workspaceId, workspaceId),
        eq(userAutonomyPreferences.userId, userId)
      ),
    });

    const autoEnabled = preferences.filter(p => p.autoExecuteEnabled);
    const avgConfidence = preferences.length > 0
      ? Math.round(preferences.reduce((sum, p) => sum + p.confidenceScore, 0) / preferences.length)
      : 0;

    const topAutoTools = preferences
      .filter(p => p.autoExecuteEnabled)
      .sort((a, b) => b.confidenceScore - a.confidenceScore)
      .slice(0, 5)
      .map(p => ({ toolName: p.toolName, confidence: p.confidenceScore }));

    return {
      totalActions: preferences.length,
      autoEnabledCount: autoEnabled.length,
      averageConfidence: avgConfidence,
      topAutoTools,
    };
  } catch (error) {
    logger.error('Failed to get autonomy summary', { workspaceId, userId, error });
    return {
      totalActions: 0,
      autoEnabledCount: 0,
      averageConfidence: 0,
      topAutoTools: [],
    };
  }
}
