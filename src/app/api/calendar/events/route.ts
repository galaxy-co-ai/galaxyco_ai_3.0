import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { calendarEvents, users } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  meetingUrl: z.string().url().optional().or(z.literal('')),
  startTime: z.string().datetime('Invalid start time format'),
  endTime: z.string().datetime('Invalid end time format'),
  timezone: z.string().optional().default('America/Chicago'),
  isAllDay: z.boolean().optional().default(false),
  isRecurring: z.boolean().optional().default(false),
  recurrenceRule: z.string().optional(),
  attendees: z.array(z.object({
    userId: z.string().uuid().optional(),
    email: z.string().email(),
    name: z.string(),
    status: z.enum(['accepted', 'declined', 'tentative', 'pending']).optional().default('pending'),
  })).optional().default([]),
  customerId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional().default([]),
  reminders: z.array(z.object({
    minutes: z.number().int().min(0).max(10080), // 0 to 7 days in minutes
    sent: z.boolean().optional().default(false),
  })).optional().default([]),
}).refine(
  (data) => new Date(data.endTime) > new Date(data.startTime),
  { message: 'End time must be after start time', path: ['endTime'] }
);

const getEventsSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).optional().default(50),
});

/**
 * GET /api/calendar/events
 * Get calendar events for the current workspace
 */
export async function GET(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { searchParams } = new URL(request.url);

    // Parse and validate query parameters
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const limitParam = searchParams.get('limit');

    const queryParams: Record<string, unknown> = {};
    if (startDateParam) queryParams.startDate = startDateParam;
    if (endDateParam) queryParams.endDate = endDateParam;
    if (limitParam) queryParams.limit = parseInt(limitParam, 10);

    const validationResult = getEventsSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { startDate, endDate, limit } = validationResult.data;

    // Build where conditions
    const conditions = [eq(calendarEvents.workspaceId, workspaceId)];

    if (startDate) {
      conditions.push(gte(calendarEvents.startTime, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(calendarEvents.endTime, new Date(endDate)));
    }

    // Default: Get upcoming events if no date range specified
    if (!startDate && !endDate) {
      conditions.push(gte(calendarEvents.startTime, new Date()));
    }

    // Get events - order by start time ascending for chronological display
    const events = await db.query.calendarEvents.findMany({
      where: and(...conditions),
      orderBy: [calendarEvents.startTime],
      limit,
    });

    // Get creator info for each event (batch query for efficiency)
    const creatorIds = [...new Set(events.map(e => e.createdBy).filter((id): id is string => id !== null))];
    let creators: Array<{ id: string; firstName: string | null; lastName: string | null; email: string }> = [];
    
    if (creatorIds.length > 0) {
      // Use SQL IN clause for multiple IDs
      creators = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        })
        .from(users)
        .where(sql`${users.id} = ANY(${creatorIds})`);
    }

    const creatorMap = new Map(creators.map(c => [c.id, c]));

    const eventsWithCreators = events.map((event) => ({
      ...event,
      creator: event.createdBy ? creatorMap.get(event.createdBy) || null : null,
    }));

    return NextResponse.json({
      events: eventsWithCreators.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        meetingUrl: event.meetingUrl,
        startTime: event.startTime,
        endTime: event.endTime,
        timezone: event.timezone,
        isAllDay: event.isAllDay,
        isRecurring: event.isRecurring,
        recurrenceRule: event.recurrenceRule,
        attendees: event.attendees,
        createdBy: event.creator
          ? {
              id: event.creator.id,
              name: event.creator.firstName && event.creator.lastName
                ? `${event.creator.firstName} ${event.creator.lastName}`
                : event.creator.email,
              email: event.creator.email,
            }
          : null,
        customerId: event.customerId,
        projectId: event.projectId,
        tags: event.tags,
        reminders: event.reminders,
        createdAt: event.createdAt,
      })),
      count: eventsWithCreators.length,
    });
  } catch (error) {
    return createErrorResponse(error, 'Get calendar events error');
  }
}

/**
 * POST /api/calendar/events
 * Create a new calendar event
 */
export async function POST(request: Request) {
  try {
    const { workspaceId, userId, user } = await getCurrentWorkspace();
    const body = await request.json();

    // Validate input
    const validationResult = createEventSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create event
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const [event] = await db
      .insert(calendarEvents)
      .values({
        workspaceId,
        createdBy: user.id,
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        meetingUrl: data.meetingUrl || null,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        timezone: data.timezone,
        isAllDay: data.isAllDay,
        isRecurring: data.isRecurring,
        recurrenceRule: data.recurrenceRule || null,
        attendees: data.attendees,
        customerId: data.customerId || null,
        projectId: data.projectId || null,
        tags: data.tags,
        reminders: data.reminders,
      })
      .returning();

    logger.info('Calendar event created', { eventId: event.id, workspaceId });

    return NextResponse.json(
      {
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        meetingUrl: event.meetingUrl,
        startTime: event.startTime,
        endTime: event.endTime,
        timezone: event.timezone,
        isAllDay: event.isAllDay,
        isRecurring: event.isRecurring,
        recurrenceRule: event.recurrenceRule,
        attendees: event.attendees,
        customerId: event.customerId,
        projectId: event.projectId,
        tags: event.tags,
        reminders: event.reminders,
        createdAt: event.createdAt,
      },
      { status: 201 }
    );
  } catch (error) {
    return createErrorResponse(error, 'Create calendar event error');
  }
}

