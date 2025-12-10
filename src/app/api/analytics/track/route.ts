import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { analyticsEvents } from "@/db/schema";
import { logger } from "@/lib/logger";

const eventSchema = z.object({
  eventType: z.string().min(1).max(100),
  eventName: z.string().max(100).optional(),
  pageUrl: z.string().url().max(2000),
  referrer: z.string().max(2000).optional(),
  metadata: z.record(z.unknown()).optional(),
  postId: z.string().uuid().optional(),
  sessionId: z.string().max(100).optional(),
  userId: z.string().max(100).optional(),
  timestamp: z.string().datetime().optional(),
});

const bodySchema = z.object({
  events: z.array(eventSchema).min(1).max(50),
});

/**
 * POST /api/analytics/track
 *
 * Track analytics events from the client.
 * This endpoint is public (no auth required) to allow tracking from blog posts.
 * Rate limited by IP address.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { events } = bodySchema.parse(body);

    // Get device info from user agent
    const userAgent = request.headers.get("user-agent") || "";
    const deviceType = getDeviceType(userAgent);

    // Insert all events
    const eventsToInsert = events.map((event) => ({
      userId: event.userId || null,
      sessionId: event.sessionId || null,
      eventType: event.eventType,
      eventName: event.eventName || null,
      pageUrl: event.pageUrl,
      referrer: event.referrer || null,
      metadata: {
        ...event.metadata,
        postId: event.postId,
      },
      userAgent,
      deviceType,
      createdAt: event.timestamp ? new Date(event.timestamp) : new Date(),
    }));

    await db.insert(analyticsEvents).values(eventsToInsert);

    return NextResponse.json({ success: true, count: events.length });
  } catch (error) {
    // For tracking endpoints, we fail silently to not affect UX
    if (error instanceof z.ZodError) {
      logger.warn("Invalid analytics event", { errors: error.errors });
      return NextResponse.json(
        { success: false, error: "Invalid event format" },
        { status: 400 }
      );
    }

    logger.error("Failed to track analytics event", error);
    
    // Return success even on error to not disrupt the client
    return NextResponse.json({ success: true, count: 0 });
  }
}

/**
 * Determine device type from user agent
 */
function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (/mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    if (/ipad|tablet/i.test(ua)) {
      return "tablet";
    }
    return "mobile";
  }
  
  return "desktop";
}

