/**
 * Calendar Tool Implementations
 *
 * Business logic for calendar and scheduling operations
 */

import type { ToolImplementations, ToolResult } from '../types';
import { db } from '@/lib/db';
import { calendarEvents, prospects, tasks, users } from '@/db/schema';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export const calendarToolImplementations: ToolImplementations = {
  // Calendar: Schedule Meeting
  async schedule_meeting(args, context) {
    try {
      const title = args.title as string;
      const startTime = new Date(args.startTime as string);
      
      // Calculate end time
      let endTime: Date;
      if (args.endTime) {
        endTime = new Date(args.endTime as string);
      } else {
        const durationMinutes = (args.duration as number) || 60;
        endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
      }

      const attendeesInput = args.attendees as Array<{ email: string; name: string }> | undefined;
      const attendees = attendeesInput?.map((a) => ({
        email: a.email,
        name: a.name,
        status: 'pending' as const,
      })) || [];

      // Get user record for createdBy
      const userRecord = await db.query.users.findFirst({
        where: eq(sql`clerk_user_id`, context.userId),
      });

      if (!userRecord) {
        return {
          success: false,
          message: 'User record not found',
        };
      }

      const [event] = await db
        .insert(calendarEvents)
        .values({
          workspaceId: context.workspaceId,
          createdBy: userRecord.id,
          title,
          description: (args.description as string) || null,
          startTime,
          endTime,
          location: (args.location as string) || null,
          meetingUrl: (args.meetingUrl as string) || null,
          attendees,
          timezone: 'America/Chicago',
        })
        .returning();

      logger.info('AI scheduled meeting', { eventId: event.id, workspaceId: context.workspaceId });

      return {
        success: true,
        message: `Scheduled "${title}" for ${startTime.toLocaleString()}`,
        data: {
          id: event.id,
          title: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
          attendeeCount: attendees.length,
        },
        suggestedNextStep: {
          action: 'create_agenda',
          reason: 'Meetings are more productive with prepared agendas',
          prompt: 'Want me to create an agenda for this meeting?',
          autoSuggest: true,
        },
      };
    } catch (error) {
      logger.error('AI schedule_meeting failed', error);
      return {
        success: false,
        message: 'Failed to schedule meeting',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Calendar: Get Upcoming Events
  async get_upcoming_events(args, context) {
    try {
      const days = (args.days as number) || 7;
      const limit = (args.limit as number) || 10;

      const now = new Date();
      const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const events = await db.query.calendarEvents.findMany({
        where: and(
          eq(calendarEvents.workspaceId, context.workspaceId),
          gte(calendarEvents.startTime, now),
          lte(calendarEvents.startTime, endDate)
        ),
        orderBy: [calendarEvents.startTime],
        limit,
      });

      return {
        success: true,
        message: `Found ${events.length} upcoming event(s) in the next ${days} days`,
        data: {
          events: events.map((e) => ({
            id: e.id,
            title: e.title,
            startTime: e.startTime,
            endTime: e.endTime,
            location: e.location,
            attendeeCount: (e.attendees as unknown[])?.length || 0,
          })),
        },
      };
    } catch (error) {
      logger.error('AI get_upcoming_events failed', error);
      return {
        success: false,
        message: 'Failed to get upcoming events',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Calendar: Find Available Times
  async find_available_times(args, context) {
    try {
      const { findAvailableTimeSlots, isGoogleCalendarConnected } = await import('@/lib/calendar/google');
      
      const duration = (args.duration as number) || 30;
      const daysAhead = Math.min((args.days_ahead as number) || 7, 14);
      const workingHoursOnly = args.working_hours_only !== false;
      const excludeWeekends = args.exclude_weekends !== false;

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);

      const availableSlots = await findAvailableTimeSlots(context.workspaceId, {
        startDate,
        endDate,
        duration,
        workingHoursStart: workingHoursOnly ? 9 : 0,
        workingHoursEnd: workingHoursOnly ? 17 : 24,
        excludeWeekends,
      });

      const hasGoogleCalendar = await isGoogleCalendarConnected(context.workspaceId);

      // Format slots for display
      const formattedSlots = availableSlots.map(slot => {
        const startStr = slot.start.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        const endStr = slot.end.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        return {
          start: slot.start.toISOString(),
          end: slot.end.toISOString(),
          display: `${startStr} - ${endStr}`,
        };
      });

      if (formattedSlots.length === 0) {
        return {
          success: true,
          message: `No available ${duration}-minute slots found in the next ${daysAhead} days. Try extending the date range or adjusting the duration.`,
          data: {
            slots: [],
            googleCalendarConnected: hasGoogleCalendar,
          },
        };
      }

      return {
        success: true,
        message: `Found ${formattedSlots.length} available ${duration}-minute slot(s) in the next ${daysAhead} days${hasGoogleCalendar ? ' (synced with Google Calendar)' : ''}`,
        data: {
          slots: formattedSlots,
          googleCalendarConnected: hasGoogleCalendar,
        },
      };
    } catch (error) {
      logger.error('AI find_available_times failed', error);
      return {
        success: false,
        message: 'Failed to find available times',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Calendar: Schedule Demo
  async schedule_demo(args, context): Promise<ToolResult> {
    try {
      const leadId = args.leadId as string;
      const duration = (args.duration as number) || 30;
      const preferredTimes = (args.preferredTimes as string[]) || [];

      const lead = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, leadId),
          eq(prospects.workspaceId, context.workspaceId)
        ),
      });

      if (!lead) {
        return {
          success: false,
          message: 'Lead not found',
          error: 'Lead ID does not exist',
        };
      }

      // Create calendar event for demo
      const demoDate = preferredTimes.length > 0
        ? new Date(preferredTimes[0])
        : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // Default: 2 days from now

      const event = await db.insert(calendarEvents).values({
        workspaceId: context.workspaceId,
        title: `Product Demo - ${lead.name}`,
        description: `Product demonstration for ${lead.company || lead.name}`,
        startTime: demoDate,
        endTime: new Date(demoDate.getTime() + duration * 60 * 1000),
        attendees: lead.email ? [{ email: lead.email, name: lead.name, status: 'pending' }] : [],
        createdBy: context.userId,
      }).returning();

      return {
        success: true,
        message: `Scheduled ${duration}-minute demo for ${lead.name} on ${demoDate.toLocaleDateString()}. Calendar invite created.`,
        data: {
          leadId: lead.id,
          eventId: event[0]?.id,
          scheduledTime: demoDate.toISOString(),
          duration,
        },
      };
    } catch (error) {
      logger.error('AI schedule_demo failed', error);
      return {
        success: false,
        message: 'Failed to schedule demo',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  // Calendar: Book Meeting Rooms
  async book_meeting_rooms(args, context): Promise<ToolResult> {
    try {
      const eventId = args.eventId as string;
      const roomRequirements = (args.roomRequirements as string[]) || [];

      const event = await db.query.calendarEvents.findFirst({
        where: and(
          eq(calendarEvents.id, eventId),
          eq(calendarEvents.workspaceId, context.workspaceId)
        ),
      });

      if (!event) {
        return {
          success: false,
          message: 'Event not found',
          error: 'Event ID does not exist',
        };
      }

      // Get user record for task creation
      const userRecord = await db.query.users.findFirst({
        where: eq(users.clerkUserId, context.userId),
      });

      if (!userRecord) {
        return {
          success: false,
          message: 'User not found',
        };
      }

      // Create a task for room booking (since we don't have direct Google Calendar room booking API)
      const requirementsText = roomRequirements.length > 0
        ? `Requirements: ${roomRequirements.join(', ')}`
        : 'Standard room';

      const [roomBookingTask] = await db
        .insert(tasks)
        .values({
          workspaceId: context.workspaceId,
          title: `Book meeting room for: ${event.title}`,
          description: `Room booking needed for event "${event.title}" on ${event.startTime?.toLocaleDateString()} at ${event.startTime?.toLocaleTimeString()}. ${requirementsText}.`,
          status: 'todo',
          priority: 'high',
          dueDate: event.startTime ? new Date(event.startTime.getTime() - 24 * 60 * 60 * 1000) : null, // Due 1 day before event
          assignedTo: userRecord.id,
          createdBy: userRecord.id,
          tags: ['room-booking', `event:${eventId}`],
        })
        .returning();

      // Try to update event with room requirements in location field if Google Calendar is connected
      const { isGoogleCalendarConnected } = await import('@/lib/calendar/google');
      if (await isGoogleCalendarConnected(context.workspaceId)) {
        // Note: Would need Google Calendar API to update event with room resource
        // For now, update local event location
        if (roomRequirements.length > 0) {
          await db
            .update(calendarEvents)
            .set({
              location: event.location
                ? `${event.location} | Room requirements: ${roomRequirements.join(', ')}`
                : `Room requirements: ${roomRequirements.join(', ')}`,
              updatedAt: new Date(),
            })
            .where(eq(calendarEvents.id, eventId));
        }
      }

      logger.info('AI book_meeting_rooms', {
        eventId,
        taskId: roomBookingTask.id,
        roomRequirements,
        workspaceId: context.workspaceId,
      });

      return {
        success: true,
        message: `Created room booking task for event "${event.title}". ${roomRequirements.length > 0 ? `Requirements: ${roomRequirements.join(', ')}.` : 'Standard room requested.'}`,
        data: {
          eventId: event.id,
          eventTitle: event.title,
          roomRequirements,
          bookingStatus: 'task_created',
          taskId: roomBookingTask.id,
          dueDate: roomBookingTask.dueDate,
        },
      };
    } catch (error) {
      logger.error('AI book_meeting_rooms failed', error);
      return {
        success: false,
        message: 'Failed to book meeting room',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
