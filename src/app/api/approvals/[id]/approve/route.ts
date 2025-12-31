import { NextResponse } from "next/server";
import { getCurrentWorkspace, getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { approvalRequests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { completeApproval, type ApprovalResult } from "@/trigger/approvals";
import { logger } from "@/lib/logger";
import { ApprovalRequestSchema } from "@/lib/validation/schemas";

/**
 * POST: Approve a pending approval request
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { id } = await params;

    const body = await request.json().catch(() => ({}));
    const validation = ApprovalRequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.errors },
        { status: 400 }
      );
    }
    const { reason, metadata } = validation.data;

    // Get the approval request
    const approval = await db.query.approvalRequests.findFirst({
      where: and(
        eq(approvalRequests.id, id),
        eq(approvalRequests.workspaceId, workspaceId)
      ),
    });

    if (!approval) {
      return NextResponse.json(
        { error: "Approval request not found" },
        { status: 404 }
      );
    }

    if (approval.status !== "pending") {
      return NextResponse.json(
        { error: `Approval request is already ${approval.status}` },
        { status: 400 }
      );
    }

    // Complete the waitpoint token
    const result: ApprovalResult = {
      approved: true,
      approvedBy: user.id,
      approvedAt: new Date(),
      reason,
      metadata,
    };

    await completeApproval(approval.waitpointTokenId, result);

    logger.info("Approval request approved", {
      approvalId: id,
      approvedBy: user.id,
      workspaceId,
    });

    return NextResponse.json({
      success: true,
      message: "Approval granted",
      approvalId: id,
    });
  } catch (error) {
    logger.error("Failed to approve request", { error });
    return NextResponse.json(
      { error: "Failed to approve request" },
      { status: 500 }
    );
  }
}
