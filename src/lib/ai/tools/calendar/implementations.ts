/**
 * Calendar Tool Implementations
 * 
 * Business logic for calendar and scheduling operations
 */

import type { ToolImplementations } from '../types';
import { db } from '@/lib/db';
import { calendarEvents } from '@/db/schema';
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
};
