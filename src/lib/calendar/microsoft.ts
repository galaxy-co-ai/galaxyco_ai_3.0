/**
 * Microsoft Outlook Calendar Integration
 * 
 * Provides calendar sync and availability checking for Microsoft/Outlook users.
 */

import { db } from '@/lib/db';
import { integrations, oauthTokens } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { refreshAccessToken } from '@/lib/oauth';
import type { CalendarEvent, AvailabilityOptions, TimeSlot } from './google';

// ============================================================================
// MICROSOFT CALENDAR CLIENT
// ============================================================================

/**
 * Get Microsoft access token for a workspace
 */
async function getMicrosoftAccessToken(workspaceId: string): Promise<string | null> {
  try {
    const integration = await db.query.integrations.findFirst({
      where: and(
        eq(integrations.workspaceId, workspaceId),
        eq(integrations.provider, 'microsoft'),
        eq(integrations.status, 'active')
      ),
    });

    if (!integration) {
      return null;
    }

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
        const refreshed = await refreshAccessToken('microsoft', token.refreshToken);
        if (refreshed) {
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
    logger.error('[Microsoft Calendar] Failed to get access token', error);
    return null;
  }
}

/**
 * Check if Microsoft Calendar is connected for a workspace
 */
export async function isMicrosoftCalendarConnected(workspaceId: string): Promise<boolean> {
  const token = await getMicrosoftAccessToken(workspaceId);
  return !!token;
}

// ============================================================================
// CALENDAR OPERATIONS
// ============================================================================

/**
 * Get calendar events from Microsoft Outlook
 */
export async function getMicrosoftCalendarEvents(
  workspaceId: string,
  options: {
    startDate: Date;
    endDate: Date;
    maxResults?: number;
  }
): Promise<CalendarEvent[]> {
  const accessToken = await getMicrosoftAccessToken(workspaceId);

  if (!accessToken) {
    logger.warn('[Microsoft Calendar] Not connected for workspace', { workspaceId });
    return [];
  }

  try {
    const params = new URLSearchParams({
      startDateTime: options.startDate.toISOString(),
      endDateTime: options.endDate.toISOString(),
      $top: String(options.maxResults || 50),
      $orderby: 'start/dateTime',
      $select: 'id,subject,body,start,end,location,attendees,onlineMeetingUrl,isOnlineMeeting',
    });

    const response = await fetch(
      `https://graph.microsoft.com/v1.0/me/calendarView?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'outlook.timezone="America/Chicago"',
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error('[Microsoft Calendar] API error', { status: response.status, error });
      return [];
    }

    const data = await response.json();

    return (data.value || []).map((event: {
      id: string;
      subject?: string;
      body?: { content?: string };
      start?: { dateTime?: string; timeZone?: string };
      end?: { dateTime?: string; timeZone?: string };
      location?: { displayName?: string };
      attendees?: Array<{ emailAddress?: { address?: string; name?: string }; status?: { response?: string } }>;
      onlineMeetingUrl?: string;
    }) => ({
      id: event.id,
      summary: event.subject || 'Untitled Event',
      description: event.body?.content,
      start: new Date(event.start?.dateTime || Date.now()),
      end: new Date(event.end?.dateTime || Date.now()),
      location: event.location?.displayName,
      attendees: event.attendees?.map(a => ({
        email: a.emailAddress?.address || '',
        displayName: a.emailAddress?.name,
        responseStatus: a.status?.response,
      })),
      meetingLink: event.onlineMeetingUrl,
    }));
  } catch (error) {
    logger.error('[Microsoft Calendar] Failed to fetch events', error);
    return [];
  }
}

/**
 * Create a Microsoft Outlook calendar event
 */
export async function createMicrosoftCalendarEvent(
  workspaceId: string,
  event: {
    summary: string;
    description?: string;
    start: Date;
    end: Date;
    location?: string;
    attendees?: string[];
    sendNotifications?: boolean;
    createOnlineMeeting?: boolean;
  }
): Promise<CalendarEvent | null> {
  const accessToken = await getMicrosoftAccessToken(workspaceId);

  if (!accessToken) {
    logger.warn('[Microsoft Calendar] Not connected for workspace', { workspaceId });
    return null;
  }

  try {
    const response = await fetch(
      'https://graph.microsoft.com/v1.0/me/events',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Prefer: 'outlook.timezone="America/Chicago"',
        },
        body: JSON.stringify({
          subject: event.summary,
          body: {
            contentType: 'text',
            content: event.description || '',
          },
          start: {
            dateTime: event.start.toISOString().slice(0, 19),
            timeZone: 'America/Chicago',
          },
          end: {
            dateTime: event.end.toISOString().slice(0, 19),
            timeZone: 'America/Chicago',
          },
          location: event.location ? { displayName: event.location } : undefined,
          attendees: event.attendees?.map(email => ({
            emailAddress: { address: email },
            type: 'required',
          })),
          isOnlineMeeting: event.createOnlineMeeting || false,
          onlineMeetingProvider: event.createOnlineMeeting ? 'teamsForBusiness' : undefined,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error('[Microsoft Calendar] Failed to create event', { status: response.status, error });
      return null;
    }

    const data = await response.json();

    return {
      id: data.id,
      summary: data.subject,
      description: data.body?.content,
      start: new Date(data.start?.dateTime),
      end: new Date(data.end?.dateTime),
      location: data.location?.displayName,
      attendees: data.attendees?.map((a: { emailAddress?: { address?: string; name?: string }; status?: { response?: string } }) => ({
        email: a.emailAddress?.address || '',
        displayName: a.emailAddress?.name,
        responseStatus: a.status?.response,
      })),
      meetingLink: data.onlineMeetingUrl,
    };
  } catch (error) {
    logger.error('[Microsoft Calendar] Failed to create event', error);
    return null;
  }
}

/**
 * Find available time slots from Microsoft Calendar
 */
export async function findMicrosoftAvailableSlots(
  workspaceId: string,
  options: AvailabilityOptions
): Promise<TimeSlot[]> {
  const events = await getMicrosoftCalendarEvents(workspaceId, {
    startDate: options.startDate,
    endDate: options.endDate,
  });

  const busyTimes: TimeSlot[] = events.map(e => ({ start: e.start, end: e.end }))
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const availableSlots: TimeSlot[] = [];
  const slotDuration = options.duration * 60 * 1000;
  const {
    workingHoursStart = 9,
    workingHoursEnd = 17,
    excludeWeekends = true,
  } = options;

  const currentDate = new Date(options.startDate);
  while (currentDate < options.endDate && availableSlots.length < 20) {
    const dayOfWeek = currentDate.getDay();

    if (excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    const dayStart = new Date(currentDate);
    dayStart.setHours(workingHoursStart, 0, 0, 0);

    const dayEnd = new Date(currentDate);
    dayEnd.setHours(workingHoursEnd, 0, 0, 0);

    if (dayEnd <= new Date()) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    const dayBusyTimes = busyTimes.filter(
      b => b.start < dayEnd && b.end > dayStart
    );

    let slotStart = new Date(Math.max(dayStart.getTime(), new Date().getTime()));

    const minutes = slotStart.getMinutes();
    if (minutes > 0 && minutes < 30) {
      slotStart.setMinutes(30, 0, 0);
    } else if (minutes > 30) {
      slotStart.setHours(slotStart.getHours() + 1, 0, 0, 0);
    }

    while (slotStart.getTime() + slotDuration <= dayEnd.getTime()) {
      const slotEnd = new Date(slotStart.getTime() + slotDuration);

      const hasConflict = dayBusyTimes.some(
        busy => slotStart < busy.end && slotEnd > busy.start
      );

      if (!hasConflict) {
        availableSlots.push({
          start: new Date(slotStart),
          end: new Date(slotEnd),
        });
      }

      slotStart = new Date(slotStart.getTime() + 30 * 60 * 1000);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return availableSlots.slice(0, 10);
}
