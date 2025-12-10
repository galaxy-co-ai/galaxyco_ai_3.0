import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { alertBadges } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and } from "drizzle-orm";

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
      return NextResponse.json(
        { error: "Invalid alert ID format" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Alert not found" },
        { status: 404 }
      );
    }

    logger.info("Alert badge updated", { 
      alertId: id, 
      newStatus: validatedData.status 
    });

    return NextResponse.json({ alert: updatedAlert });
  } catch (error) {
    logger.error("Failed to update alert badge", error);
    
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
      { error: "Failed to update alert badge" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "Invalid alert ID format" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Alert not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ alert });
  } catch (error) {
    logger.error("Failed to fetch alert badge", error);
    
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: "Failed to fetch alert badge" },
      { status: 500 }
    );
  }
}

