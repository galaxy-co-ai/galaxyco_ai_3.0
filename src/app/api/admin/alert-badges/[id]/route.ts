import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { alertBadges } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";
import { createErrorResponse } from "@/lib/api-error-handler";

/**
 * PATCH /api/admin/alert-badges/[id]
 * 
 * Update an alert badge (mark as read, dismissed, or actioned).
 */
const updateAlertSchema = z.object({
  status: z.enum(["unread", "read", "dismissed", "actioned"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    // Validate UUID format
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return createErrorResponse(new Error("Invalid alert ID format"), "Update alert badge");
    }

    const body = await request.json();
    const validatedData = updateAlertSchema.parse(body);

    // Build update object based on status
    const updateData: Record<string, unknown> = {
      status: validatedData.status,
      updatedAt: new Date(),
    };

    // Set appropriate timestamp based on status
    switch (validatedData.status) {
      case "read":
        updateData.readAt = new Date();
        break;
      case "dismissed":
        updateData.dismissedAt = new Date();
        break;
      case "actioned":
        updateData.actionedAt = new Date();
        break;
    }

    // Update the alert
    const [updatedAlert] = await db
      .update(alertBadges)
      .set(updateData)
      .where(
        and(
          eq(alertBadges.id, id),
          eq(alertBadges.workspaceId, workspaceId)
        )
      )
      .returning();

    if (!updatedAlert) {
      return createErrorResponse(new Error("Alert not found"), "Update alert badge");
    }

    logger.info("Alert badge updated", { 
      alertId: id, 
      newStatus: validatedData.status 
    });

    return NextResponse.json({ alert: updatedAlert });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(new Error("Invalid request body"), "Update alert badge");
    }
    return createErrorResponse(error, "Update alert badge");
  }
}

/**
 * GET /api/admin/alert-badges/[id]
 * 
 * Get a single alert badge by ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    // Validate UUID format
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return createErrorResponse(new Error("Invalid alert ID format"), "Fetch alert badge");
    }

    const [alert] = await db
      .select()
      .from(alertBadges)
      .where(
        and(
          eq(alertBadges.id, id),
          eq(alertBadges.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (!alert) {
      return createErrorResponse(new Error("Alert not found"), "Fetch alert badge");
    }

    return NextResponse.json({ alert });
  } catch (error) {
    return createErrorResponse(error, "Fetch alert badge");
  }
}

