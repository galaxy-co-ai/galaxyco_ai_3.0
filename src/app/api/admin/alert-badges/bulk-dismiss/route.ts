import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { alertBadges } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and, inArray } from "drizzle-orm";

/**
 * POST /api/admin/alert-badges/bulk-dismiss
 * 
 * Bulk update multiple alert badges at once.
 * Used for "Mark all as read" or bulk dismiss operations.
 * 
 * Body:
 * - alertIds: Array of alert IDs to update
 * - action: "read" | "dismissed" - what status to set
 */
const bulkDismissSchema = z.object({
  alertIds: z.array(z.string().uuid()).min(1).max(100),
  action: z.enum(["read", "dismissed"]),
});

export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const body = await request.json();
    const validatedData = bulkDismissSchema.parse(body);

    // Build update object based on action
    const updateData: Record<string, unknown> = {
      status: validatedData.action,
      updatedAt: new Date(),
    };

    // Set appropriate timestamp based on action
    if (validatedData.action === "read") {
      updateData.readAt = new Date();
    } else if (validatedData.action === "dismissed") {
      updateData.dismissedAt = new Date();
    }

    // Update all matching alerts
    const updatedAlerts = await db
      .update(alertBadges)
      .set(updateData)
      .where(
        and(
          inArray(alertBadges.id, validatedData.alertIds),
          eq(alertBadges.workspaceId, workspaceId)
        )
      )
      .returning();

    logger.info("Bulk alert badges updated", { 
      count: updatedAlerts.length,
      action: validatedData.action 
    });

    return NextResponse.json({ 
      success: true,
      updatedCount: updatedAlerts.length,
      alerts: updatedAlerts,
    });
  } catch (error) {
    logger.error("Failed to bulk update alert badges", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: "Failed to bulk update alert badges" },
      { status: 500 }
    );
  }
}

