/**
 * Notification Integration for Autonomy System
 *
 * Integrates the autonomy approval workflow with the notification system
 * to alert users about pending approvals and action results.
 */

import { db } from '@/lib/db';
import { notifications, workspaceMembers, agentTeams } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import type { ActionRiskLevel, PendingAction, ActionAuditEntry } from './types';

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

// Map to database notification type enum (info, success, warning, error, mention, assignment, reminder, system)
type NotificationType = 'info' | 'success' | 'warning' | 'error';

interface CreateNotificationInput {
  workspaceId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
}

// ============================================================================
// NOTIFICATION HELPERS
// ============================================================================

/**
 * Create a notification for a user
 */
async function createNotification(input: CreateNotificationInput): Promise<string | null> {
  try {
    const [notification] = await db
      .insert(notifications)
      .values({
        workspaceId: input.workspaceId,
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        actionUrl: input.actionUrl,
        actionLabel: input.actionLabel,
        metadata: input.metadata,
        expiresAt: input.expiresAt,
      })
      .returning();

    return notification.id;
  } catch (error) {
    logger.error('[Notification] Failed to create notification', error);
    return null;
  }
}

/**
 * Get workspace admins and team coordinators to notify
 */
async function getNotifyTargets(
  workspaceId: string,
  teamId?: string
): Promise<string[]> {
  const targets: string[] = [];

  // Get workspace admins/owners
  const members = await db.query.workspaceMembers.findMany({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      inArray(workspaceMembers.role, ['owner', 'admin'])
    ),
  });

  targets.push(...members.map((m) => m.userId));

  // If there's a team, also notify the coordinator
  if (teamId) {
    const team = await db.query.agentTeams.findFirst({
      where: eq(agentTeams.id, teamId),
    });

    if (team?.coordinatorAgentId) {
      // The coordinator is an agent, not a user, so we'd need to track
      // which user manages this agent. For now, skip this.
    }

    // Get team creator as an additional target
    if (team?.createdBy && !targets.includes(team.createdBy)) {
      targets.push(team.createdBy);
    }
  }

  return targets;
}

/**
 * Get risk level display info
 */
function getRiskInfo(riskLevel: ActionRiskLevel): {
  emoji: string;
  priority: NotificationType;
} {
  switch (riskLevel) {
    case 'critical':
      return { emoji: '🚨', priority: 'error' };
    case 'high':
      return { emoji: '⚠️', priority: 'warning' };
    case 'medium':
      return { emoji: '📋', priority: 'warning' };
    case 'low':
    default:
      return { emoji: '📝', priority: 'info' };
  }
}

// ============================================================================
// APPROVAL NOTIFICATIONS
// ============================================================================

/**
 * Send notifications when a new action is queued for approval
 */
export async function notifyPendingApproval(action: PendingAction): Promise<void> {
  try {
    const targets = await getNotifyTargets(action.workspaceId, action.teamId);
    const riskInfo = getRiskInfo(action.riskLevel);

    for (const userId of targets) {
      await createNotification({
        workspaceId: action.workspaceId,
        userId,
        type: riskInfo.priority,
        title: `${riskInfo.emoji} Approval Required: ${action.actionType}`,
        message: action.description,
        actionUrl: `/orchestration/approvals?action=${action.id}`,
        actionLabel: 'Review Action',
        metadata: {
          actionId: action.id,
          actionType: action.actionType,
          riskLevel: action.riskLevel,
          agentName: action.agentName,
          teamName: action.teamName,
        },
        expiresAt: action.expiresAt,
      });
    }

    logger.info('[Notification] Sent pending approval notifications', {
      actionId: action.id,
      targetCount: targets.length,
    });
  } catch (error) {
    logger.error('[Notification] Failed to send pending approval notifications', error);
  }
}

/**
 * Send notification when an action is approved
 */
export async function notifyActionApproved(
  action: PendingAction,
  reviewerId: string
): Promise<void> {
  try {
    const targets = await getNotifyTargets(action.workspaceId, action.teamId);

    // Don't notify the reviewer themselves
    const filteredTargets = targets.filter((id) => id !== reviewerId);

    for (const userId of filteredTargets) {
      await createNotification({
        workspaceId: action.workspaceId,
        userId,
        type: 'success',
        title: `✅ Action Approved: ${action.actionType}`,
        message: `${action.description} was approved.`,
        actionUrl: `/orchestration/audit?action=${action.id}`,
        actionLabel: 'View Details',
        metadata: {
          actionId: action.id,
          actionType: action.actionType,
          reviewerId,
        },
      });
    }

    logger.info('[Notification] Sent action approved notifications', {
      actionId: action.id,
      targetCount: filteredTargets.length,
    });
  } catch (error) {
    logger.error('[Notification] Failed to send action approved notifications', error);
  }
}

/**
 * Send notification when an action is rejected
 */
export async function notifyActionRejected(
  action: PendingAction,
  reviewerId: string,
  reason?: string
): Promise<void> {
  try {
    const targets = await getNotifyTargets(action.workspaceId, action.teamId);
    const filteredTargets = targets.filter((id) => id !== reviewerId);

    for (const userId of filteredTargets) {
      await createNotification({
        workspaceId: action.workspaceId,
        userId,
        type: 'warning',
        title: `❌ Action Rejected: ${action.actionType}`,
        message: reason
          ? `${action.description} was rejected: ${reason}`
          : `${action.description} was rejected.`,
        actionUrl: `/orchestration/audit?action=${action.id}`,
        actionLabel: 'View Details',
        metadata: {
          actionId: action.id,
          actionType: action.actionType,
          reviewerId,
          reason,
        },
      });
    }

    logger.info('[Notification] Sent action rejected notifications', {
      actionId: action.id,
      targetCount: filteredTargets.length,
    });
  } catch (error) {
    logger.error('[Notification] Failed to send action rejected notifications', error);
  }
}

/**
 * Send notification when an action expires
 */
export async function notifyActionExpired(action: PendingAction): Promise<void> {
  try {
    const targets = await getNotifyTargets(action.workspaceId, action.teamId);

    for (const userId of targets) {
      await createNotification({
        workspaceId: action.workspaceId,
        userId,
        type: 'warning',
        title: `⏰ Action Expired: ${action.actionType}`,
        message: `${action.description} expired without review.`,
        actionUrl: `/orchestration/audit?action=${action.id}`,
        actionLabel: 'View Details',
        metadata: {
          actionId: action.id,
          actionType: action.actionType,
        },
      });
    }

    logger.info('[Notification] Sent action expired notifications', {
      actionId: action.id,
      targetCount: targets.length,
    });
  } catch (error) {
    logger.error('[Notification] Failed to send action expired notifications', error);
  }
}

// ============================================================================
// TEAM NOTIFICATIONS
// ============================================================================

/**
 * Send notification when a team's autonomy level changes
 */
export async function notifyAutonomyLevelChanged(
  workspaceId: string,
  teamId: string,
  teamName: string,
  oldLevel: string,
  newLevel: string,
  changedBy: string
): Promise<void> {
  try {
    const targets = await getNotifyTargets(workspaceId, teamId);
    const filteredTargets = targets.filter((id) => id !== changedBy);

    const levelEmoji: Record<string, string> = {
      supervised: '👁️',
      semi_autonomous: '🤖',
      autonomous: '🚀',
    };

    for (const userId of filteredTargets) {
      await createNotification({
        workspaceId,
        userId,
        type: 'info',
        title: `${levelEmoji[newLevel] || '📋'} Autonomy Level Changed`,
        message: `${teamName} team changed from ${oldLevel.replace('_', ' ')} to ${newLevel.replace('_', ' ')}.`,
        actionUrl: `/orchestration/teams/${teamId}`,
        actionLabel: 'View Team',
        metadata: {
          teamId,
          teamName,
          oldLevel,
          newLevel,
          changedBy,
        },
      });
    }

    logger.info('[Notification] Sent autonomy level changed notifications', {
      teamId,
      targetCount: filteredTargets.length,
    });
  } catch (error) {
    logger.error('[Notification] Failed to send autonomy level notifications', error);
  }
}

/**
 * Send daily digest of autonomous actions
 */
export async function sendDailyAutonomyDigest(
  workspaceId: string,
  userId: string,
  stats: {
    totalActions: number;
    autoApproved: number;
    manuallyApproved: number;
    rejected: number;
    pending: number;
    successRate: number;
  }
): Promise<void> {
  try {
    await createNotification({
      workspaceId,
      userId,
      type: 'info',
      title: '📊 Daily Autonomy Digest',
      message: `${stats.totalActions} actions processed. ${stats.autoApproved} auto-approved, ${stats.manuallyApproved} manually approved, ${stats.rejected} rejected. ${stats.pending} pending review.`,
      actionUrl: '/orchestration/approvals',
      actionLabel: 'View Dashboard',
      metadata: {
        stats,
        digestType: 'daily',
      },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
    });

    logger.info('[Notification] Sent daily autonomy digest', {
      workspaceId,
      userId,
    });
  } catch (error) {
    logger.error('[Notification] Failed to send daily digest', error);
  }
}

// ============================================================================
// ALERT NOTIFICATIONS
// ============================================================================

/**
 * Send alert when there are too many pending approvals
 */
export async function alertHighPendingCount(
  workspaceId: string,
  count: number,
  threshold: number = 10
): Promise<void> {
  if (count < threshold) return;

  try {
    const targets = await getNotifyTargets(workspaceId);

    for (const userId of targets) {
      await createNotification({
        workspaceId,
        userId,
        type: 'error',
        title: `🚨 ${count} Actions Awaiting Approval`,
        message: `There are ${count} actions waiting for review. Please review and process them to prevent expiration.`,
        actionUrl: '/orchestration/approvals',
        actionLabel: 'Review Now',
        metadata: {
          pendingCount: count,
          threshold,
        },
      });
    }

    logger.info('[Notification] Sent high pending count alert', {
      workspaceId,
      count,
      targetCount: targets.length,
    });
  } catch (error) {
    logger.error('[Notification] Failed to send high pending alert', error);
  }
}

/**
 * Send alert when a critical action needs immediate review
 */
export async function alertCriticalAction(action: PendingAction): Promise<void> {
  if (action.riskLevel !== 'critical') return;

  try {
    const targets = await getNotifyTargets(action.workspaceId, action.teamId);

    for (const userId of targets) {
      await createNotification({
        workspaceId: action.workspaceId,
        userId,
        type: 'error',
        title: `🚨 CRITICAL: Immediate Review Required`,
        message: `Critical action "${action.actionType}" requires immediate review: ${action.description}`,
        actionUrl: `/orchestration/approvals?action=${action.id}`,
        actionLabel: 'Review Now',
        metadata: {
          actionId: action.id,
          actionType: action.actionType,
          riskLevel: action.riskLevel,
          urgent: true,
        },
      });
    }

    logger.info('[Notification] Sent critical action alert', {
      actionId: action.id,
      targetCount: targets.length,
    });
  } catch (error) {
    logger.error('[Notification] Failed to send critical action alert', error);
  }
}

/**
 * Send alert when an autonomous action fails
 */
export async function alertActionFailed(
  entry: ActionAuditEntry,
  errorMessage: string
): Promise<void> {
  try {
    const targets = await getNotifyTargets(entry.workspaceId, entry.teamId);

    for (const userId of targets) {
      await createNotification({
        workspaceId: entry.workspaceId,
        userId,
        type: 'error',
        title: `❌ Autonomous Action Failed`,
        message: `${entry.actionType} failed: ${errorMessage}`,
        actionUrl: `/orchestration/audit?entry=${entry.id}`,
        actionLabel: 'View Details',
        metadata: {
          entryId: entry.id,
          actionType: entry.actionType,
          error: errorMessage,
          wasAutomatic: entry.wasAutomatic,
        },
      });
    }

    logger.info('[Notification] Sent action failed alert', {
      entryId: entry.id,
      targetCount: targets.length,
    });
  } catch (error) {
    logger.error('[Notification] Failed to send action failed alert', error);
  }
}

