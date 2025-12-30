/**
 * Calendar API
 * 
 * GET /api/crm/calendar - List calendar events
 * POST /api/crm/calendar - Create calendar event
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import {
  getLocalCalendarEvents,
  createCalendarEvent,
  getConnectedCalendars,
} from '@/lib/integrations/calendar-sync';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { createErrorResponse } from '@/lib/api-error-handler';

const createEventSchema = z.object({
  summary: z.string().min(1),
  description: z.string().optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  location: z.string().optional(),
  attendees: z.array(z.string().email()).optional(),
  sendNotifications: z.boolean().optional().default(true),
  provider: z.enum(['google', 'microsoft']).optional(),
  contactId: z.string().uuid().optional(),
});

// GET: List calendar events
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return createErrorResponse(new Error('Unauthorized'), 'Calendar API GET');
    }

    const rateLimitResult = await rateLimit(`crm:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : new Date();
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const contactId = searchParams.get('contactId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get connected providers info
    const providers = await getConnectedCalendars(orgId);

    // Get events
    const events = await getLocalCalendarEvents(orgId, {
      startDate,
      endDate,
      contactId,
      limit,
    });

    return NextResponse.json({
      events,
      providers,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Calendar API GET');
  }
}

// POST: Create calendar event
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return createErrorResponse(new Error('Unauthorized'), 'Calendar API POST');
    }

    const rateLimitResult = await rateLimit(`crm:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

    const body = await request.json();
    const validation = createEventSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(new Error('Invalid request data'), 'Calendar API POST');
    }

    const { start, end, ...rest } = validation.data;

    const result = await createCalendarEvent(orgId, {
      ...rest,
      start: new Date(start),
      end: new Date(end),
    });

    if (!result.success) {
      return createErrorResponse(new Error(result.error || 'Invalid event data'), 'Calendar API POST');
    }

    logger.info('[Calendar API] Event created', {
      workspaceId: orgId,
      userId,
      provider: result.provider,
      eventId: result.event?.id,
    });

    return NextResponse.json({
      success: true,
      event: result.event,
      provider: result.provider,
    });
  } catch (error) {
    return createErrorResponse(error, 'Calendar API POST');
  }
}
