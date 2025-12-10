import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { alertBadges } from "@/db/schema";
import { getCurrentWorkspace } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { eq, and, desc } from "drizzle-orm";

/**
 * GET /api/admin/alert-badges
 * 
 * List alert badges for the current workspace.
 * Supports filtering by status and limiting results.
 * 
 * Query params:
 * - status: Filter by status (unread, read, dismissed, actioned)
 * - limit: Max number of results (default 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as "unread" | "read" | "dismissed" | "actioned" | null;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);

    // Build query conditions
    const conditions = [eq(alertBadges.workspaceId, workspaceId)];
    
    if (status) {
      conditions.push(eq(alertBadges.status, status));
    }

    // Fetch alerts
    const alerts = await db
      .select()
      .from(alertBadges)
      .where(and(...conditions))
      .orderBy(desc(alertBadges.createdAt))
      .limit(limit);

    // Get unread count (for badge)
    const unreadAlerts = await db
      .select()
      .from(alertBadges)
      .where(
        and(
          eq(alertBadges.workspaceId, workspaceId),
          eq(alertBadges.status, "unread")
        )
      );

    return NextResponse.json({
      alerts,
      unreadCount: unreadAlerts.length,
      total: alerts.length,
    });
  } catch (error) {
    logger.error("Failed to fetch alert badges", error);
    
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: "Failed to fetch alert badges" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/alert-badges
 * 
 * Create a new alert badge.
 * Used by scheduled jobs and proactive intelligence to create alerts.
 */
const createAlertSchema = z.object({
  type: z.enum(["trend", "opportunity", "warning", "milestone", "suggestion"]),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  relatedEntityType: z.string().optional(),
  relatedEntityId: z.string().uuid().optional(),
  actionLabel: z.string().max(50).optional(),
  actionUrl: z.string().url().optional(),
  priority: z.number().int().min(0).max(100).optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const body = await request.json();
    const validatedData = createAlertSchema.parse(body);

    const [newAlert] = await db
      .insert(alertBadges)
      .values({
        workspaceId,
        type: validatedData.type,
        status: "unread",
        title: validatedData.title,
        message: validatedData.message,
        relatedEntityType: validatedData.relatedEntityType,
        relatedEntityId: validatedData.relatedEntityId,
        actionLabel: validatedData.actionLabel,
        actionUrl: validatedData.actionUrl,
        priority: validatedData.priority ?? 0,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
      })
      .returning();

    logger.info("Alert badge created", { alertId: newAlert.id, type: newAlert.type });

    return NextResponse.json({ alert: newAlert }, { status: 201 });
  } catch (error) {
    logger.error("Failed to create alert badge", error);
    
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
      { error: "Failed to create alert badge" },
      { status: 500 }
    );
  }
}

