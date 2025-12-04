import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { analyticsEvents } from '@/db/schema';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Validation schema for analytics events
const eventSchema = z.object({
  eventType: z.string().min(1).max(50),
  eventName: z.string().max(100).optional(),
  pageUrl: z.string(),
  referrer: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  sessionId: z.string().optional(),
});

// Batch events schema
const batchEventsSchema = z.object({
  events: z.array(eventSchema).max(50),
});

/**
 * POST - Track analytics event(s)
 * Works for both authenticated and anonymous users
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    // Get device info from user agent
    const userAgent = request.headers.get('user-agent') || '';
    const deviceType = getDeviceType(userAgent);

    const body = await request.json();
    
    // Handle single event or batch
    let events: z.infer<typeof eventSchema>[];
    
    if (body.events) {
      const validation = batchEventsSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid events data', details: validation.error.errors },
          { status: 400 }
        );
      }
      events = validation.data.events;
    } else {
      const validation = eventSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid event data', details: validation.error.errors },
          { status: 400 }
        );
      }
      events = [validation.data];
    }

    // Insert events
    const insertedEvents = await db
      .insert(analyticsEvents)
      .values(
        events.map((event) => ({
          userId: userId || null,
          sessionId: event.sessionId || null,
          eventType: event.eventType,
          eventName: event.eventName || null,
          pageUrl: event.pageUrl,
          referrer: event.referrer || null,
          metadata: event.metadata || {},
          userAgent,
          deviceType,
        }))
      )
      .returning({ id: analyticsEvents.id });

    return NextResponse.json({
      success: true,
      count: insertedEvents.length,
    });
  } catch (error) {
    logger.error('Failed to track analytics event', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}

// Determine device type from user agent
function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}
