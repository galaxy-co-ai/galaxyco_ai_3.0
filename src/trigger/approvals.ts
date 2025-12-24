/**
 * Trigger.dev Approval Workflows
 * 
 * Human-in-the-loop approval tasks using wait.createToken()
 * for pausing task execution until manual approval.
 */

import { task, wait } from "@trigger.dev/sdk/v3";
import { db } from "@/lib/db";
import { approvalRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

export type ApprovalType = "campaign" | "content" | "agent" | "workflow";

export interface ApprovalPayload {
  workspaceId: string;
  type: ApprovalType;
  entityId: string;
  entityName?: string;
  title: string;
  description?: string;
  requestedBy: string;
  metadata?: Record<string, unknown>;
  timeout?: string; // e.g., "1h", "24h"
}

export interface ApprovalResult {
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  reason?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// REQUEST APPROVAL TASK
// ============================================================================

/**
 * Request Approval Task
 * 
 * Creates a waitpoint token and pauses execution until
 * the approval is completed via the API or UI.
 * 
 * @returns The approval result when completed
 */
export const requestApprovalTask = task({
  id: "request-approval",
  retry: {
    maxAttempts: 1, // Approvals shouldn't retry
  },
  run: async (payload: ApprovalPayload) => {
    const {
      workspaceId,
      type,
      entityId,
      entityName,
      title,
      description,
      requestedBy,
      metadata,
      timeout = "24h",
    } = payload;

    logger.info("Creating approval request", {
      workspaceId,
      type,
      entityId,
      title,
    });

    // Create a waitpoint token for the approval
    const token = await wait.createToken({
      timeout,
      idempotencyKey: `approval-${type}-${entityId}`,
      idempotencyKeyTTL: "48h",
      tags: [
        `workspace:${workspaceId}`,
        `type:approval`,
        `approval-type:${type}`,
        `entity:${entityId}`,
      ],
    });

    // Store the approval request in the database
    const [approvalRequest] = await db
      .insert(approvalRequests)
      .values({
        workspaceId,
        type,
        entityId,
        entityName: entityName || title,
        waitpointTokenId: token.id,
        publicAccessToken: token.publicAccessToken,
        title,
        description,
        requestedBy,
        metadata,
        expiresAt: new Date(Date.now() + parseDuration(timeout)),
      })
      .returning();

    logger.info("Approval request created, waiting for response", {
      approvalRequestId: approvalRequest.id,
      tokenId: token.id,
      expiresAt: approvalRequest.expiresAt,
    });

    // Wait for the approval to be completed
    const result = await wait.forToken<ApprovalResult>(token);

    if (result.ok) {
      // Update the approval request with the result
      await db
        .update(approvalRequests)
        .set({
          status: result.output.approved ? "approved" : "rejected",
          approvedBy: result.output.approvedBy,
          respondedAt: new Date(),
          responseData: {
            reason: result.output.reason,
            metadata: result.output.metadata,
          },
          updatedAt: new Date(),
        })
        .where(eq(approvalRequests.id, approvalRequest.id));

      logger.info("Approval request completed", {
        approvalRequestId: approvalRequest.id,
        approved: result.output.approved,
        approvedBy: result.output.approvedBy,
      });

      return {
        success: true,
        approved: result.output.approved,
        approvalRequestId: approvalRequest.id,
        result: result.output,
      };
    } else {
      // Token timed out
      await db
        .update(approvalRequests)
        .set({
          status: "expired",
          respondedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(approvalRequests.id, approvalRequest.id));

      logger.warn("Approval request timed out", {
        approvalRequestId: approvalRequest.id,
        error: result.error,
      });

      return {
        success: false,
        approved: false,
        approvalRequestId: approvalRequest.id,
        error: "Approval timed out",
      };
    }
  },
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse a duration string like "1h", "24h", "7d" to milliseconds
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)(m|h|d)$/);
  if (!match) {
    return 24 * 60 * 60 * 1000; // Default: 24 hours
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

/**
 * Helper to complete an approval from outside a task
 * Call this from your API routes
 */
export async function completeApproval(
  tokenId: string,
  result: ApprovalResult
): Promise<{ success: boolean }> {
  return wait.completeToken<ApprovalResult>(tokenId, result);
}
