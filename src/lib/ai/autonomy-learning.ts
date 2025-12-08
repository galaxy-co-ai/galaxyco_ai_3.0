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
export const TOOL_RISK_LEVELS: Record<string, ActionRiskLevel> = {
  // Low-risk: Auto-execute immediately
  create_task: { toolName: 'create_task', level: 'low', defaultConfidence: 80 },
  prioritize_tasks: { toolName: 'prioritize_tasks', level: 'low', defaultConfidence: 75 },
  batch_similar_tasks: { toolName: 'batch_similar_tasks', level: 'low', defaultConfidence: 70 },
  organize_documents: { toolName: 'organize_documents', level: 'low', defaultConfidence: 70 },
  auto_categorize_expenses: { toolName: 'auto_categorize_expenses', level: 'low', defaultConfidence: 75 },
  flag_anomalies: { toolName: 'flag_anomalies', level: 'low', defaultConfidence: 70 },
  project_cash_flow: { toolName: 'project_cash_flow', level: 'low', defaultConfidence: 70 },
  get_pipeline_summary: { toolName: 'get_pipeline_summary', level: 'low', defaultConfidence: 90 },
  get_campaign_stats: { toolName: 'get_campaign_stats', level: 'low', defaultConfidence: 90 },
  search_web: { toolName: 'search_web', level: 'low', defaultConfidence: 85 },
  
  // Medium-risk: Ask first, learn over time
  create_lead: { toolName: 'create_lead', level: 'medium', defaultConfidence: 0 },
  update_lead_stage: { toolName: 'update_lead_stage', level: 'medium', defaultConfidence: 0 },
  create_contact: { toolName: 'create_contact', level: 'medium', defaultConfidence: 0 },
  create_campaign: { toolName: 'create_campaign', level: 'medium', defaultConfidence: 0 },
  schedule_meeting: { toolName: 'schedule_meeting', level: 'medium', defaultConfidence: 0 },
  draft_proposal: { toolName: 'draft_proposal', level: 'medium', defaultConfidence: 0 },
  auto_qualify_lead: { toolName: 'auto_qualify_lead', level: 'medium', defaultConfidence: 0 },
  create_follow_up_sequence: { toolName: 'create_follow_up_sequence', level: 'medium', defaultConfidence: 0 },
  optimize_campaign: { toolName: 'optimize_campaign', level: 'medium', defaultConfidence: 0 },
  segment_audience: { toolName: 'segment_audience', level: 'medium', defaultConfidence: 0 },
  schedule_social_posts: { toolName: 'schedule_social_posts', level: 'medium', defaultConfidence: 0 },
  book_meeting_rooms: { toolName: 'book_meeting_rooms', level: 'medium', defaultConfidence: 0 },
  
  // High-risk: Always confirm
  send_email: { toolName: 'send_email', level: 'high', defaultConfidence: 0 },
  schedule_demo: { toolName: 'schedule_demo', level: 'high', defaultConfidence: 0 },
  send_payment_reminders: { toolName: 'send_payment_reminders', level: 'high', defaultConfidence: 0 },
  send_invoice_reminder: { toolName: 'send_invoice_reminder', level: 'high', defaultConfidence: 0 },
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
