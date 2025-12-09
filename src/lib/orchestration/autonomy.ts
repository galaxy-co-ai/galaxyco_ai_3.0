/**
 * Autonomy Service - Manages autonomous agent operations with human oversight
 *
 * This service handles:
 * - Risk classification of agent actions
 * - Approval workflow for sensitive actions
 * - Audit logging of all autonomous actions
 * - Department-level metrics and insights
 */

import { db } from '@/lib/db';
import {
  agentTeams,
  agentPendingActions,
  agentActionAuditLog,
  agents,
  users,
} from '@/db/schema';
import { eq, and, desc, gte, lte, sql, count, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import type {
  TeamAutonomyLevel,
  ActionRiskLevel,
  ApprovalStatus,
  RiskClassification,
  PendingAction,
  QueueActionInput,
  ProcessApprovalInput,
  ActionAuditEntry,
  RecordAuditInput,
  PendingActionsFilters,
  AuditLogFilters,
  DepartmentMetrics,
  TeamAutonomyStats,
  ActionRiskRules,
} from './types';

// ============================================================================
// DEFAULT RISK RULES
// ============================================================================

/**
 * Default risk classification rules for common action types
 * Teams can customize these via their config
 */
const DEFAULT_RISK_RULES: ActionRiskRules = {
  lowRisk: [
    'read_data',
    'list_items',
    'get_status',
    'log_activity',
    'update_internal_note',
    'fetch_analytics',
    'check_availability',
    'retrieve_memory',
    'store_context',
  ],
  mediumRisk: [
    'create_task',
    'update_task',
    'create_note',
    'update_crm_field',
    'send_internal_notification',
    'schedule_reminder',
    'tag_contact',
    'update_lead_status',
    'create_draft',
  ],
  highRisk: [
    'send_email',
    'send_message',
    'schedule_meeting',
    'update_calendar',
    'modify_contact',
    'update_deal_value',
    'change_pipeline_stage',
    'external_api_call',
    'publish_content',
  ],
  critical: [
    'financial_transaction',
    'delete_data',
    'bulk_delete',
    'send_mass_email',
    'update_payment',
    'modify_subscription',
    'export_data',
    'customer_communication',
    'contract_modification',
  ],
};

// ============================================================================
// AUTONOMY SERVICE CLASS
// ============================================================================

export class AutonomyService {
  private workspaceId: string;
  private riskRules: ActionRiskRules;

  constructor(workspaceId: string, customRiskRules?: Partial<ActionRiskRules>) {
    this.workspaceId = workspaceId;
    this.riskRules = {
      ...DEFAULT_RISK_RULES,
      ...customRiskRules,
    };
  }

  // ==========================================================================
  // RISK CLASSIFICATION
  // ==========================================================================

  /**
   * Classify the risk level of an action
   */
  classifyRisk(actionType: string, actionData?: Record<string, unknown>): RiskClassification {
    const reasons: string[] = [];
    let riskLevel: ActionRiskLevel = 'low';

    // Check action type against risk rules
    if (this.riskRules.critical.some((pattern) => actionType.includes(pattern))) {
      riskLevel = 'critical';
      reasons.push(`Action type '${actionType}' is classified as critical`);
    } else if (this.riskRules.highRisk.some((pattern) => actionType.includes(pattern))) {
      riskLevel = 'high';
      reasons.push(`Action type '${actionType}' involves external communication or data modification`);
    } else if (this.riskRules.mediumRisk.some((pattern) => actionType.includes(pattern))) {
      riskLevel = 'medium';
      reasons.push(`Action type '${actionType}' modifies internal data`);
    } else if (this.riskRules.lowRisk.some((pattern) => actionType.includes(pattern))) {
      riskLevel = 'low';
      reasons.push(`Action type '${actionType}' is read-only or internal`);
    } else {
      // Unknown action types default to medium risk
      riskLevel = 'medium';
      reasons.push(`Unknown action type '${actionType}' defaulting to medium risk`);
    }

    // Additional risk factors from action data
    if (actionData) {
      // Check for bulk operations
      if (actionData.count && typeof actionData.count === 'number' && actionData.count > 10) {
        if (riskLevel === 'low') riskLevel = 'medium';
        else if (riskLevel === 'medium') riskLevel = 'high';
        reasons.push(`Bulk operation affecting ${actionData.count} items`);
      }

      // Check for external recipients
      if (actionData.externalRecipient || actionData.toExternal) {
        if (riskLevel !== 'critical') riskLevel = 'high';
        reasons.push('Action involves external recipient');
      }

      // Check for monetary values
      if (actionData.amount || actionData.value) {
        const amount = actionData.amount || actionData.value;
        if (typeof amount === 'number' && amount > 0) {
          riskLevel = 'critical';
          reasons.push(`Action involves monetary value: ${amount}`);
        }
      }

      // Check for deletion
      if (actionData.delete || actionData.remove || actionData.destroy) {
        if (riskLevel !== 'critical') riskLevel = 'high';
        reasons.push('Action involves deletion');
      }
    }

    return {
      riskLevel,
      reasons,
      requiresApproval: false, // Will be determined by autonomy level check
    };
  }

  /**
   * Determine if an action requires approval based on team autonomy level
   */
  async requiresApproval(
    teamId: string | undefined,
    actionType: string,
    actionData?: Record<string, unknown>
  ): Promise<RiskClassification> {
    const classification = this.classifyRisk(actionType, actionData);

    // If no team, default to requiring approval for non-low risk
    if (!teamId) {
      classification.requiresApproval = classification.riskLevel !== 'low';
      return classification;
    }

    // Get team config
    const team = await db.query.agentTeams.findFirst({
      where: and(
        eq(agentTeams.id, teamId),
        eq(agentTeams.workspaceId, this.workspaceId)
      ),
    });

    if (!team) {
      // Team not found - require approval for safety
      classification.requiresApproval = true;
      classification.reasons.push('Team not found - requiring approval for safety');
      return classification;
    }

    const config = team.config as {
      autonomyLevel: TeamAutonomyLevel;
      approvalRequired: string[];
    } | null;

    const autonomyLevel = config?.autonomyLevel || 'supervised';
    const explicitlyRequired = config?.approvalRequired || [];

    // Check if action type is explicitly required to have approval
    if (explicitlyRequired.includes(actionType)) {
      classification.requiresApproval = true;
      classification.reasons.push(`Action '${actionType}' is explicitly configured to require approval`);
      return classification;
    }

    // Determine based on autonomy level
    switch (autonomyLevel) {
      case 'supervised':
        // All actions require approval
        classification.requiresApproval = true;
        classification.reasons.push('Team is in supervised mode - all actions require approval');
        break;

      case 'semi_autonomous':
        // Low risk auto-approved, medium/high/critical require approval
        classification.requiresApproval = classification.riskLevel !== 'low';
        if (classification.requiresApproval) {
          classification.reasons.push(`Semi-autonomous mode: ${classification.riskLevel} risk requires approval`);
        }
        break;

      case 'autonomous':
        // Only critical actions require approval
        classification.requiresApproval = classification.riskLevel === 'critical';
        if (classification.requiresApproval) {
          classification.reasons.push('Autonomous mode: critical risk always requires approval');
        }
        break;

      default:
        // Unknown autonomy level - require approval for safety
        classification.requiresApproval = true;
        classification.reasons.push('Unknown autonomy level - requiring approval for safety');
    }

    return classification;
  }

  // ==========================================================================
  // APPROVAL QUEUE MANAGEMENT
  // ==========================================================================

  /**
   * Queue an action for approval
   */
  async queueForApproval(input: QueueActionInput): Promise<string> {
    try {
      const classification = await this.requiresApproval(
        input.teamId,
        input.actionType,
        input.actionData
      );

      const expiresAt = input.expiresInHours
        ? new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000)
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default 24 hours

      const [pendingAction] = await db
        .insert(agentPendingActions)
        .values({
          workspaceId: input.workspaceId,
          teamId: input.teamId,
          agentId: input.agentId,
          workflowExecutionId: input.workflowExecutionId,
          actionType: input.actionType,
          actionData: input.actionData,
          description: input.description,
          riskLevel: classification.riskLevel,
          riskReasons: classification.reasons,
          status: 'pending',
          expiresAt,
        })
        .returning();

      logger.info('[Autonomy] Action queued for approval', {
        actionId: pendingAction.id,
        actionType: input.actionType,
        riskLevel: classification.riskLevel,
        teamId: input.teamId,
      });

      return pendingAction.id;
    } catch (error) {
      logger.error('[Autonomy] Failed to queue action for approval', error);
      throw error;
    }
  }

  /**
   * Get pending actions for workspace with optional filters
   */
  async getPendingActions(filters: PendingActionsFilters = {}): Promise<PendingAction[]> {
    try {
      const conditions = [eq(agentPendingActions.workspaceId, this.workspaceId)];

      if (filters.teamId) {
        conditions.push(eq(agentPendingActions.teamId, filters.teamId));
      }
      if (filters.agentId) {
        conditions.push(eq(agentPendingActions.agentId, filters.agentId));
      }
      if (filters.status) {
        conditions.push(eq(agentPendingActions.status, filters.status));
      }
      if (filters.riskLevel) {
        conditions.push(eq(agentPendingActions.riskLevel, filters.riskLevel));
      }
      if (filters.actionType) {
        conditions.push(eq(agentPendingActions.actionType, filters.actionType));
      }

      const results = await db.query.agentPendingActions.findMany({
        where: and(...conditions),
        orderBy: [desc(agentPendingActions.createdAt)],
        limit: filters.limit || 50,
        offset: filters.offset || 0,
      });

      // Enrich with agent and team names
      const enriched = await Promise.all(
        results.map(async (action) => {
          let agentName: string | undefined;
          let teamName: string | undefined;
          let reviewerName: string | undefined;

          if (action.agentId) {
            const agent = await db.query.agents.findFirst({
              where: eq(agents.id, action.agentId),
            });
            agentName = agent?.name;
          }

          if (action.teamId) {
            const team = await db.query.agentTeams.findFirst({
              where: eq(agentTeams.id, action.teamId),
            });
            teamName = team?.name;
          }

          if (action.reviewedBy) {
            const reviewer = await db.query.users.findFirst({
              where: eq(users.id, action.reviewedBy),
            });
            reviewerName = reviewer
              ? `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim() || reviewer.email
              : undefined;
          }

          return {
            id: action.id,
            workspaceId: action.workspaceId,
            teamId: action.teamId || undefined,
            agentId: action.agentId || undefined,
            workflowExecutionId: action.workflowExecutionId || undefined,
            actionType: action.actionType,
            actionData: action.actionData as Record<string, unknown>,
            description: action.description,
            riskLevel: action.riskLevel as ActionRiskLevel,
            riskReasons: (action.riskReasons as string[]) || [],
            status: action.status as ApprovalStatus,
            reviewedBy: action.reviewedBy || undefined,
            reviewedAt: action.reviewedAt || undefined,
            reviewNotes: action.reviewNotes || undefined,
            expiresAt: action.expiresAt || undefined,
            createdAt: action.createdAt,
            agentName,
            teamName,
            reviewerName,
          };
        })
      );

      return enriched;
    } catch (error) {
      logger.error('[Autonomy] Failed to get pending actions', error);
      throw error;
    }
  }

  /**
   * Get a single pending action by ID
   */
  async getPendingAction(actionId: string): Promise<PendingAction | null> {
    try {
      const action = await db.query.agentPendingActions.findFirst({
        where: and(
          eq(agentPendingActions.id, actionId),
          eq(agentPendingActions.workspaceId, this.workspaceId)
        ),
      });

      if (!action) return null;

      let agentName: string | undefined;
      let teamName: string | undefined;
      let reviewerName: string | undefined;

      if (action.agentId) {
        const agent = await db.query.agents.findFirst({
          where: eq(agents.id, action.agentId),
        });
        agentName = agent?.name;
      }

      if (action.teamId) {
        const team = await db.query.agentTeams.findFirst({
          where: eq(agentTeams.id, action.teamId),
        });
        teamName = team?.name;
      }

      if (action.reviewedBy) {
        const reviewer = await db.query.users.findFirst({
          where: eq(users.id, action.reviewedBy),
        });
        reviewerName = reviewer
          ? `${reviewer.firstName || ''} ${reviewer.lastName || ''}`.trim() || reviewer.email
          : undefined;
      }

      return {
        id: action.id,
        workspaceId: action.workspaceId,
        teamId: action.teamId || undefined,
        agentId: action.agentId || undefined,
        workflowExecutionId: action.workflowExecutionId || undefined,
        actionType: action.actionType,
        actionData: action.actionData as Record<string, unknown>,
        description: action.description,
        riskLevel: action.riskLevel as ActionRiskLevel,
        riskReasons: (action.riskReasons as string[]) || [],
        status: action.status as ApprovalStatus,
        reviewedBy: action.reviewedBy || undefined,
        reviewedAt: action.reviewedAt || undefined,
        reviewNotes: action.reviewNotes || undefined,
        expiresAt: action.expiresAt || undefined,
        createdAt: action.createdAt,
        agentName,
        teamName,
        reviewerName,
      };
    } catch (error) {
      logger.error('[Autonomy] Failed to get pending action', error);
      return null;
    }
  }

  /**
   * Process an approval decision (approve or reject)
   */
  async processApproval(input: ProcessApprovalInput): Promise<boolean> {
    try {
      const action = await db.query.agentPendingActions.findFirst({
        where: and(
          eq(agentPendingActions.id, input.actionId),
          eq(agentPendingActions.workspaceId, this.workspaceId)
        ),
      });

      if (!action) {
        logger.warn('[Autonomy] Pending action not found', { actionId: input.actionId });
        return false;
      }

      if (action.status !== 'pending') {
        logger.warn('[Autonomy] Action is not pending', {
          actionId: input.actionId,
          status: action.status,
        });
        return false;
      }

      // Check if expired
      if (action.expiresAt && new Date(action.expiresAt) < new Date()) {
        await db
          .update(agentPendingActions)
          .set({ status: 'expired' })
          .where(eq(agentPendingActions.id, input.actionId));
        logger.warn('[Autonomy] Action has expired', { actionId: input.actionId });
        return false;
      }

      // Update the approval status
      await db
        .update(agentPendingActions)
        .set({
          status: input.approved ? 'approved' : 'rejected',
          reviewedBy: input.reviewerId,
          reviewedAt: new Date(),
          reviewNotes: input.reviewNotes,
        })
        .where(eq(agentPendingActions.id, input.actionId));

      // Record in audit log
      await this.recordAudit({
        workspaceId: this.workspaceId,
        teamId: action.teamId || undefined,
        agentId: action.agentId || undefined,
        workflowExecutionId: action.workflowExecutionId || undefined,
        actionType: action.actionType,
        actionData: action.actionData as Record<string, unknown>,
        description: action.description,
        wasAutomatic: false,
        approvalId: action.id,
        riskLevel: action.riskLevel as ActionRiskLevel,
        success: input.approved,
        error: input.approved ? undefined : `Rejected: ${input.reviewNotes || 'No reason provided'}`,
      });

      logger.info('[Autonomy] Approval processed', {
        actionId: input.actionId,
        approved: input.approved,
        reviewerId: input.reviewerId,
      });

      return true;
    } catch (error) {
      logger.error('[Autonomy] Failed to process approval', error);
      throw error;
    }
  }

  /**
   * Process bulk approvals
   */
  async processBulkApproval(
    actionIds: string[],
    approved: boolean,
    reviewerId: string,
    reviewNotes?: string
  ): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    for (const actionId of actionIds) {
      try {
        const success = await this.processApproval({
          actionId,
          approved,
          reviewerId,
          reviewNotes,
        });
        if (success) {
          processed++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    logger.info('[Autonomy] Bulk approval completed', {
      total: actionIds.length,
      processed,
      failed,
      approved,
    });

    return { processed, failed };
  }

  /**
   * Expire old pending actions
   */
  async expirePendingActions(): Promise<number> {
    try {
      const result = await db
        .update(agentPendingActions)
        .set({ status: 'expired' })
        .where(
          and(
            eq(agentPendingActions.workspaceId, this.workspaceId),
            eq(agentPendingActions.status, 'pending'),
            lte(agentPendingActions.expiresAt, new Date())
          )
        )
        .returning();

      logger.info('[Autonomy] Expired pending actions', { count: result.length });
      return result.length;
    } catch (error) {
      logger.error('[Autonomy] Failed to expire pending actions', error);
      return 0;
    }
  }

  // ==========================================================================
  // AUDIT LOG
  // ==========================================================================

  /**
   * Record an action in the audit log
   */
  async recordAudit(input: RecordAuditInput): Promise<string> {
    try {
      const [entry] = await db
        .insert(agentActionAuditLog)
        .values({
          workspaceId: input.workspaceId,
          teamId: input.teamId,
          agentId: input.agentId,
          workflowExecutionId: input.workflowExecutionId,
          actionType: input.actionType,
          actionData: input.actionData,
          description: input.description,
          wasAutomatic: input.wasAutomatic,
          approvalId: input.approvalId,
          riskLevel: input.riskLevel,
          success: input.success,
          error: input.error,
          result: input.result,
          durationMs: input.durationMs,
        })
        .returning();

      return entry.id;
    } catch (error) {
      logger.error('[Autonomy] Failed to record audit', error);
      throw error;
    }
  }

  /**
   * Get audit log entries with filters
   */
  async getAuditLog(filters: AuditLogFilters = {}): Promise<ActionAuditEntry[]> {
    try {
      const conditions = [eq(agentActionAuditLog.workspaceId, this.workspaceId)];

      if (filters.teamId) {
        conditions.push(eq(agentActionAuditLog.teamId, filters.teamId));
      }
      if (filters.agentId) {
        conditions.push(eq(agentActionAuditLog.agentId, filters.agentId));
      }
      if (filters.actionType) {
        conditions.push(eq(agentActionAuditLog.actionType, filters.actionType));
      }
      if (filters.wasAutomatic !== undefined) {
        conditions.push(eq(agentActionAuditLog.wasAutomatic, filters.wasAutomatic));
      }
      if (filters.success !== undefined) {
        conditions.push(eq(agentActionAuditLog.success, filters.success));
      }
      if (filters.startDate) {
        conditions.push(gte(agentActionAuditLog.executedAt, filters.startDate));
      }
      if (filters.endDate) {
        conditions.push(lte(agentActionAuditLog.executedAt, filters.endDate));
      }

      const results = await db.query.agentActionAuditLog.findMany({
        where: and(...conditions),
        orderBy: [desc(agentActionAuditLog.executedAt)],
        limit: filters.limit || 100,
        offset: filters.offset || 0,
      });

      // Enrich with agent and team names
      const enriched = await Promise.all(
        results.map(async (entry) => {
          let agentName: string | undefined;
          let teamName: string | undefined;

          if (entry.agentId) {
            const agent = await db.query.agents.findFirst({
              where: eq(agents.id, entry.agentId),
            });
            agentName = agent?.name;
          }

          if (entry.teamId) {
            const team = await db.query.agentTeams.findFirst({
              where: eq(agentTeams.id, entry.teamId),
            });
            teamName = team?.name;
          }

          return {
            id: entry.id,
            workspaceId: entry.workspaceId,
            teamId: entry.teamId || undefined,
            agentId: entry.agentId || undefined,
            workflowExecutionId: entry.workflowExecutionId || undefined,
            actionType: entry.actionType,
            actionData: (entry.actionData as Record<string, unknown>) || undefined,
            description: entry.description || undefined,
            executedAt: entry.executedAt,
            wasAutomatic: entry.wasAutomatic,
            approvalId: entry.approvalId || undefined,
            riskLevel: (entry.riskLevel as ActionRiskLevel) || undefined,
            success: entry.success,
            error: entry.error || undefined,
            result: (entry.result as Record<string, unknown>) || undefined,
            durationMs: entry.durationMs || undefined,
            agentName,
            teamName,
          };
        })
      );

      return enriched;
    } catch (error) {
      logger.error('[Autonomy] Failed to get audit log', error);
      throw error;
    }
  }

  // ==========================================================================
  // METRICS & ANALYTICS
  // ==========================================================================

  /**
   * Get pending approval count
   */
  async getPendingCount(teamId?: string): Promise<number> {
    const conditions = [
      eq(agentPendingActions.workspaceId, this.workspaceId),
      eq(agentPendingActions.status, 'pending'),
    ];

    if (teamId) {
      conditions.push(eq(agentPendingActions.teamId, teamId));
    }

    const result = await db
      .select({ count: count() })
      .from(agentPendingActions)
      .where(and(...conditions));

    return result[0]?.count || 0;
  }

  /**
   * Get department metrics
   */
  async getDepartmentMetrics(department?: string): Promise<DepartmentMetrics[]> {
    try {
      // Get teams (optionally filtered by department)
      const teamsConditions = [eq(agentTeams.workspaceId, this.workspaceId)];
      if (department) {
        teamsConditions.push(eq(agentTeams.department, department as typeof agentTeams.department.enumValues[number]));
      }

      const teams = await db.query.agentTeams.findMany({
        where: and(...teamsConditions),
      });

      if (teams.length === 0) {
        return [];
      }

      // Group teams by department
      const departmentTeams = teams.reduce(
        (acc, team) => {
          const dept = team.department;
          if (!acc[dept]) {
            acc[dept] = [];
          }
          acc[dept].push(team);
          return acc;
        },
        {} as Record<string, typeof teams>
      );

      const metrics: DepartmentMetrics[] = [];

      for (const [dept, deptTeams] of Object.entries(departmentTeams)) {
        const teamIds = deptTeams.map((t) => t.id);

        // Get action counts from audit log
        const auditStats = await db
          .select({
            total: count(),
            autoApproved: sql<number>`SUM(CASE WHEN ${agentActionAuditLog.wasAutomatic} = true THEN 1 ELSE 0 END)`,
            success: sql<number>`SUM(CASE WHEN ${agentActionAuditLog.success} = true THEN 1 ELSE 0 END)`,
            avgDuration: sql<number>`AVG(${agentActionAuditLog.durationMs})`,
          })
          .from(agentActionAuditLog)
          .where(
            and(
              eq(agentActionAuditLog.workspaceId, this.workspaceId),
              inArray(agentActionAuditLog.teamId, teamIds)
            )
          );

        // Get pending count
        const pendingStats = await db
          .select({ count: count() })
          .from(agentPendingActions)
          .where(
            and(
              eq(agentPendingActions.workspaceId, this.workspaceId),
              eq(agentPendingActions.status, 'pending'),
              inArray(agentPendingActions.teamId, teamIds)
            )
          );

        // Get rejected count
        const rejectedStats = await db
          .select({ count: count() })
          .from(agentPendingActions)
          .where(
            and(
              eq(agentPendingActions.workspaceId, this.workspaceId),
              eq(agentPendingActions.status, 'rejected'),
              inArray(agentPendingActions.teamId, teamIds)
            )
          );

        const totalActions = Number(auditStats[0]?.total) || 0;
        const autoApproved = Number(auditStats[0]?.autoApproved) || 0;
        const successCount = Number(auditStats[0]?.success) || 0;

        metrics.push({
          department: dept,
          teamCount: deptTeams.length,
          activeTeams: deptTeams.filter((t) => t.status === 'active').length,
          totalActions,
          autoApprovedActions: autoApproved,
          manuallyApprovedActions: totalActions - autoApproved,
          rejectedActions: Number(rejectedStats[0]?.count) || 0,
          pendingApprovals: Number(pendingStats[0]?.count) || 0,
          successRate: totalActions > 0 ? (successCount / totalActions) * 100 : 0,
          avgResponseTimeMs: Number(auditStats[0]?.avgDuration) || 0,
        });
      }

      return metrics;
    } catch (error) {
      logger.error('[Autonomy] Failed to get department metrics', error);
      return [];
    }
  }

  /**
   * Get autonomy statistics for teams
   */
  async getTeamAutonomyStats(): Promise<TeamAutonomyStats[]> {
    try {
      const teams = await db.query.agentTeams.findMany({
        where: eq(agentTeams.workspaceId, this.workspaceId),
      });

      const stats: TeamAutonomyStats[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (const team of teams) {
        const config = team.config as { autonomyLevel: TeamAutonomyLevel } | null;

        // Get total actions for this team
        const totalActionsResult = await db
          .select({ count: count() })
          .from(agentActionAuditLog)
          .where(
            and(
              eq(agentActionAuditLog.workspaceId, this.workspaceId),
              eq(agentActionAuditLog.teamId, team.id)
            )
          );

        // Get auto-executed count
        const autoExecutedResult = await db
          .select({ count: count() })
          .from(agentActionAuditLog)
          .where(
            and(
              eq(agentActionAuditLog.workspaceId, this.workspaceId),
              eq(agentActionAuditLog.teamId, team.id),
              eq(agentActionAuditLog.wasAutomatic, true)
            )
          );

        // Get pending count
        const pendingResult = await db
          .select({ count: count() })
          .from(agentPendingActions)
          .where(
            and(
              eq(agentPendingActions.workspaceId, this.workspaceId),
              eq(agentPendingActions.teamId, team.id),
              eq(agentPendingActions.status, 'pending')
            )
          );

        // Get approved today
        const approvedTodayResult = await db
          .select({ count: count() })
          .from(agentPendingActions)
          .where(
            and(
              eq(agentPendingActions.workspaceId, this.workspaceId),
              eq(agentPendingActions.teamId, team.id),
              eq(agentPendingActions.status, 'approved'),
              gte(agentPendingActions.reviewedAt, today)
            )
          );

        // Get rejected today
        const rejectedTodayResult = await db
          .select({ count: count() })
          .from(agentPendingActions)
          .where(
            and(
              eq(agentPendingActions.workspaceId, this.workspaceId),
              eq(agentPendingActions.teamId, team.id),
              eq(agentPendingActions.status, 'rejected'),
              gte(agentPendingActions.reviewedAt, today)
            )
          );

        // Get last action timestamp
        const lastAction = await db.query.agentActionAuditLog.findFirst({
          where: and(
            eq(agentActionAuditLog.workspaceId, this.workspaceId),
            eq(agentActionAuditLog.teamId, team.id)
          ),
          orderBy: [desc(agentActionAuditLog.executedAt)],
        });

        stats.push({
          teamId: team.id,
          teamName: team.name,
          autonomyLevel: config?.autonomyLevel || 'supervised',
          totalActions: Number(totalActionsResult[0]?.count) || 0,
          autoExecuted: Number(autoExecutedResult[0]?.count) || 0,
          awaitingApproval: Number(pendingResult[0]?.count) || 0,
          approvedToday: Number(approvedTodayResult[0]?.count) || 0,
          rejectedToday: Number(rejectedTodayResult[0]?.count) || 0,
          lastActionAt: lastAction?.executedAt,
        });
      }

      return stats;
    } catch (error) {
      logger.error('[Autonomy] Failed to get team autonomy stats', error);
      return [];
    }
  }

  // ==========================================================================
  // AUTO-EXECUTION HELPERS
  // ==========================================================================

  /**
   * Execute an action with automatic approval check
   * Returns true if action can be auto-executed, false if it needs approval
   */
  async canAutoExecute(
    teamId: string | undefined,
    actionType: string,
    actionData?: Record<string, unknown>
  ): Promise<{ canExecute: boolean; classification: RiskClassification }> {
    const classification = await this.requiresApproval(teamId, actionType, actionData);
    return {
      canExecute: !classification.requiresApproval,
      classification,
    };
  }

  /**
   * Record an auto-executed action in the audit log
   */
  async recordAutoExecution(
    input: Omit<RecordAuditInput, 'wasAutomatic'>
  ): Promise<string> {
    return this.recordAudit({
      ...input,
      wasAutomatic: true,
    });
  }
}

// Export default instance factory
export function createAutonomyService(
  workspaceId: string,
  customRiskRules?: Partial<ActionRiskRules>
): AutonomyService {
  return new AutonomyService(workspaceId, customRiskRules);
}

