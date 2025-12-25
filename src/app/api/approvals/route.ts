import { NextResponse } from "next/server";
import { getCurrentWorkspace } from "@/lib/auth";
import { db } from "@/lib/db";
import { approvalRequests, users } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";

/**
 * GET: List pending approval requests for the current workspace
 */
export async function GET(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get("status") || "pending";
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // Build query conditions
    const conditions = [
      eq(approvalRequests.workspaceId, workspaceId),
    ];

    if (status !== "all") {
      conditions.push(eq(approvalRequests.status, status as "pending" | "approved" | "rejected" | "expired"));
    }

    if (type) {
      conditions.push(eq(approvalRequests.type, type as "campaign" | "content" | "agent" | "workflow"));
    }

    // Fetch approval requests with requestedBy user details
    const requests = await db
      .select({
        id: approvalRequests.id,
        type: approvalRequests.type,
        entityId: approvalRequests.entityId,
        entityName: approvalRequests.entityName,
        status: approvalRequests.status,
        title: approvalRequests.title,
        description: approvalRequests.description,
        metadata: approvalRequests.metadata,
        requestedAt: approvalRequests.requestedAt,
        respondedAt: approvalRequests.respondedAt,
        expiresAt: approvalRequests.expiresAt,
        requestedByFirstName: users.firstName,
        requestedByLastName: users.lastName,
        requestedByEmail: users.email,
      })
      .from(approvalRequests)
      .leftJoin(users, eq(approvalRequests.requestedBy, users.id))
      .where(and(...conditions))
      .orderBy(desc(approvalRequests.requestedAt))
      .limit(limit);

    return NextResponse.json({
      approvals: requests,
      count: requests.length,
    });
  } catch (error) {
    logger.error("Failed to list approvals", { error });
    return NextResponse.json(
      { error: "Failed to list approvals" },
      { status: 500 }
    );
  }
}
