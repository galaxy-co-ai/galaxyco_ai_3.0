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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    logger.error('[Calendar API] GET error', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

// POST: Create calendar event
export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { start, end, ...rest } = validation.data;

    const result = await createCalendarEvent(orgId, {
      ...rest,
      start: new Date(start),
      end: new Date(end),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create event' },
        { status: 400 }
      );
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
    logger.error('[Calendar API] POST error', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}
