/**
 * Google Calendar Integration
 * 
 * Provides calendar sync and availability checking for Google Calendar users.
 */

import { db } from '@/lib/db';
import { integrations, oauthTokens } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { refreshAccessToken } from '@/lib/oauth';

// ============================================================================
// TYPES
// ============================================================================

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  meetingLink?: string;
}

export interface TimeSlot {
  start: Date;
  end: Date;
}

export interface AvailabilityOptions {
  startDate: Date;
  endDate: Date;
  duration: number; // in minutes
  workingHoursStart?: number; // 9 = 9 AM
  workingHoursEnd?: number; // 17 = 5 PM
  excludeWeekends?: boolean;
}

// ============================================================================
// GOOGLE CALENDAR CLIENT
// ============================================================================

/**
 * Get Google Calendar access token for a workspace
 */
async function getGoogleAccessToken(workspaceId: string): Promise<string | null> {
  try {
    // Find the Google integration for this workspace
    const integration = await db.query.integrations.findFirst({
      where: and(
        eq(integrations.workspaceId, workspaceId),
        eq(integrations.provider, 'google'),
        eq(integrations.status, 'active')
      ),
    });

    if (!integration) {
      return null;
    }

    // Get the OAuth token for this integration
    const token = await db.query.oauthTokens.findFirst({
      where: eq(oauthTokens.integrationId, integration.id),
    });

    if (!token || !token.accessToken) {
      return null;
    }

    // Check if token needs refresh
    const tokenExpiry = token.expiresAt;
    if (tokenExpiry && new Date(tokenExpiry) <= new Date()) {
      if (token.refreshToken) {
        const refreshed = await refreshAccessToken('google', token.refreshToken);
        if (refreshed) {
          // Update stored tokens
          await db
            .update(oauthTokens)
            .set({
              accessToken: refreshed.accessToken,
              expiresAt: refreshed.expiresIn
                ? new Date(Date.now() + refreshed.expiresIn * 1000)
                : null,
              updatedAt: new Date(),
            })
            .where(eq(oauthTokens.id, token.id));
          
          return refreshed.accessToken;
        }
      }
      return null;
    }

    return token.accessToken;
  } catch (error) {
    logger.error('[Google Calendar] Failed to get access token', error);
    return null;
  }
}

/**
 * Check if Google Calendar is connected for a workspace
 */
export async function isGoogleCalendarConnected(workspaceId: string): Promise<boolean> {
  const token = await getGoogleAccessToken(workspaceId);
  return !!token;
}

// ============================================================================
// CALENDAR OPERATIONS
// ============================================================================

/**
 * Get calendar events from Google Calendar
 */
export async function getGoogleCalendarEvents(
  workspaceId: string,
  options: {
    startDate: Date;
    endDate: Date;
    maxResults?: number;
  }
): Promise<CalendarEvent[]> {
  const accessToken = await getGoogleAccessToken(workspaceId);
  
  if (!accessToken) {
    logger.warn('[Google Calendar] Not connected for workspace', { workspaceId });
    return [];
  }

  try {
    const params = new URLSearchParams({
      timeMin: options.startDate.toISOString(),
      timeMax: options.endDate.toISOString(),
      maxResults: String(options.maxResults || 50),
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error('[Google Calendar] API error', { status: response.status, error });
      return [];
    }

    const data = await response.json();
    
    return (data.items || []).map((event: {
      id: string;
      summary?: string;
      description?: string;
      start?: { dateTime?: string; date?: string };
      end?: { dateTime?: string; date?: string };
      location?: string;
      attendees?: Array<{ email: string; displayName?: string; responseStatus?: string }>;
      hangoutLink?: string;
    }) => ({
      id: event.id,
      summary: event.summary || 'Untitled Event',
      description: event.description,
      start: new Date(event.start?.dateTime || event.start?.date || Date.now()),
      end: new Date(event.end?.dateTime || event.end?.date || Date.now()),
      location: event.location,
      attendees: event.attendees,
      meetingLink: event.hangoutLink,
    }));
  } catch (error) {
    logger.error('[Google Calendar] Failed to fetch events', error);
    return [];
  }
}

/**
 * Create a Google Calendar event
 */
export async function createGoogleCalendarEvent(
  workspaceId: string,
  event: {
    summary: string;
    description?: string;
    start: Date;
    end: Date;
    location?: string;
    attendees?: string[];
    sendNotifications?: boolean;
  }
): Promise<CalendarEvent | null> {
  const accessToken = await getGoogleAccessToken(workspaceId);
  
  if (!accessToken) {
    logger.warn('[Google Calendar] Not connected for workspace', { workspaceId });
    return null;
  }

  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events?sendNotifications=' + 
        (event.sendNotifications ? 'true' : 'false'),
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: event.summary,
          description: event.description,
          start: {
            dateTime: event.start.toISOString(),
            timeZone: 'America/Chicago',
          },
          end: {
            dateTime: event.end.toISOString(),
            timeZone: 'America/Chicago',
          },
          location: event.location,
          attendees: event.attendees?.map(email => ({ email })),
          conferenceData: {
            createRequest: {
              requestId: `neptune-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error('[Google Calendar] Failed to create event', { status: response.status, error });
      return null;
    }

    const data = await response.json();
    
    return {
      id: data.id,
      summary: data.summary,
      description: data.description,
      start: new Date(data.start?.dateTime || data.start?.date),
      end: new Date(data.end?.dateTime || data.end?.date),
      location: data.location,
      attendees: data.attendees,
      meetingLink: data.hangoutLink,
    };
  } catch (error) {
    logger.error('[Google Calendar] Failed to create event', error);
    return null;
  }
}

// ============================================================================
// AVAILABILITY CHECKING
// ============================================================================

/**
 * Find available time slots based on calendar events
 * Works with local calendar events, with optional Google Calendar sync
 */
export async function findAvailableTimeSlots(
  workspaceId: string,
  options: AvailabilityOptions
): Promise<TimeSlot[]> {
  const {
    startDate,
    endDate,
    duration,
    workingHoursStart = 9,
    workingHoursEnd = 17,
    excludeWeekends = true,
  } = options;

  // Get busy times from local database
  const { calendarEvents } = await import('@/db/schema');
  const { gte, lte } = await import('drizzle-orm');
  
  const localEvents = await db.query.calendarEvents.findMany({
    where: and(
      eq(calendarEvents.workspaceId, workspaceId),
      gte(calendarEvents.startTime, startDate),
      lte(calendarEvents.endTime, endDate)
    ),
    columns: {
      startTime: true,
      endTime: true,
    },
  });

  // Try to get Google Calendar events too
  let googleEvents: CalendarEvent[] = [];
  if (await isGoogleCalendarConnected(workspaceId)) {
    googleEvents = await getGoogleCalendarEvents(workspaceId, {
      startDate,
      endDate,
    });
  }

  // Combine all busy times
  const busyTimes: TimeSlot[] = [
    ...localEvents.map(e => ({ start: e.startTime, end: e.endTime })),
    ...googleEvents.map(e => ({ start: e.start, end: e.end })),
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  // Generate available slots
  const availableSlots: TimeSlot[] = [];
  const slotDuration = duration * 60 * 1000; // Convert to milliseconds

  // Iterate through each day
  const currentDate = new Date(startDate);
  while (currentDate < endDate && availableSlots.length < 20) {
    const dayOfWeek = currentDate.getDay();
    
    // Skip weekends if requested
    if (excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Set working hours for this day
    const dayStart = new Date(currentDate);
    dayStart.setHours(workingHoursStart, 0, 0, 0);
    
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(workingHoursEnd, 0, 0, 0);

    // Skip if day is in the past
    if (dayEnd <= new Date()) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Find busy times for this day
    const dayBusyTimes = busyTimes.filter(
      b => b.start < dayEnd && b.end > dayStart
    );

    // Generate slots
    let slotStart = new Date(Math.max(dayStart.getTime(), new Date().getTime()));
    
    // Round up to next 30-minute mark
    const minutes = slotStart.getMinutes();
    if (minutes > 0 && minutes < 30) {
      slotStart.setMinutes(30, 0, 0);
    } else if (minutes > 30) {
      slotStart.setHours(slotStart.getHours() + 1, 0, 0, 0);
    }

    while (slotStart.getTime() + slotDuration <= dayEnd.getTime()) {
      const slotEnd = new Date(slotStart.getTime() + slotDuration);
      
      // Check if this slot conflicts with any busy time
      const hasConflict = dayBusyTimes.some(
        busy => slotStart < busy.end && slotEnd > busy.start
      );

      if (!hasConflict) {
        availableSlots.push({
          start: new Date(slotStart),
          end: new Date(slotEnd),
        });
      }

      // Move to next slot (30-minute increments)
      slotStart = new Date(slotStart.getTime() + 30 * 60 * 1000);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return availableSlots.slice(0, 10); // Return top 10 slots
}
