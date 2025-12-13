/**
 * Calendar Sync Service
 * 
 * Unified calendar sync for Google and Microsoft calendars.
 * Stores events in local database and links to CRM contacts.
 */

import { db } from '@/lib/db';
import { calendarEvents, contacts } from '@/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { 
  getGoogleCalendarEvents, 
  createGoogleCalendarEvent, 
  isGoogleCalendarConnected,
  type CalendarEvent,
  type AvailabilityOptions,
  type TimeSlot,
} from '@/lib/calendar/google';
import { 
  getMicrosoftCalendarEvents, 
  createMicrosoftCalendarEvent, 
  isMicrosoftCalendarConnected,
  findMicrosoftAvailableSlots,
} from '@/lib/calendar/microsoft';

// Re-export types
export type { CalendarEvent, AvailabilityOptions, TimeSlot };

// ============================================================================
// TYPES
// ============================================================================

export interface CalendarSyncResult {
  success: boolean;
  synced: number;
  errors: string[];
  provider: 'google' | 'microsoft';
}

export interface CalendarProvider {
  id: 'google' | 'microsoft';
  name: string;
  connected: boolean;
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

/**
 * Check which calendar providers are connected
 */
export async function getConnectedCalendars(
  workspaceId: string
): Promise<CalendarProvider[]> {
  const [googleConnected, microsoftConnected] = await Promise.all([
    isGoogleCalendarConnected(workspaceId),
    isMicrosoftCalendarConnected(workspaceId),
  ]);

  return [
    { id: 'google', name: 'Google Calendar', connected: googleConnected },
    { id: 'microsoft', name: 'Outlook Calendar', connected: microsoftConnected },
  ];
}

/**
 * Sync calendar events from connected providers to local database
 */
export async function syncCalendarEvents(
  workspaceId: string,
  options: {
    provider?: 'google' | 'microsoft';
    startDate?: Date;
    endDate?: Date;
    maxResults?: number;
  } = {}
): Promise<CalendarSyncResult[]> {
  const {
    startDate = new Date(),
    endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days ahead
    maxResults = 100,
  } = options;

  const results: CalendarSyncResult[] = [];
  
  // Determine which providers to sync
  const providers = options.provider 
    ? [options.provider]
    : ['google', 'microsoft'] as const;

  // Get contact emails for matching attendees
  const workspaceContacts = await db.query.contacts.findMany({
    where: eq(contacts.workspaceId, workspaceId),
    columns: { id: true, email: true, firstName: true, lastName: true },
  });
  
  const contactEmailMap = new Map(
    workspaceContacts.map(c => [c.email.toLowerCase(), c.id])
  );

  for (const provider of providers) {
    const result: CalendarSyncResult = {
      success: true,
      synced: 0,
      errors: [],
      provider,
    };

    try {
      // Check if provider is connected
      const isConnected = provider === 'google'
        ? await isGoogleCalendarConnected(workspaceId)
        : await isMicrosoftCalendarConnected(workspaceId);

      if (!isConnected) {
        continue; // Skip if not connected
      }

      // Fetch events from provider
      const events = provider === 'google'
        ? await getGoogleCalendarEvents(workspaceId, { startDate, endDate, maxResults })
        : await getMicrosoftCalendarEvents(workspaceId, { startDate, endDate, maxResults });

      // Process each event
      for (const event of events) {
        try {
          // Check if event already exists
          const existingEvent = await db.query.calendarEvents.findFirst({
            where: and(
              eq(calendarEvents.workspaceId, workspaceId),
              eq(calendarEvents.externalId, event.id)
            ),
          });

          // Find linked contact from attendees
          let linkedContactId: string | null = null;
          if (event.attendees) {
            for (const attendee of event.attendees) {
              const contactId = contactEmailMap.get(attendee.email.toLowerCase());
              if (contactId) {
                linkedContactId = contactId;
                break;
              }
            }
          }

          if (existingEvent) {
            // Update existing event
            await db
              .update(calendarEvents)
              .set({
                title: event.summary,
                description: event.description,
                startTime: event.start,
                endTime: event.end,
                location: event.location,
                meetingUrl: event.meetingLink,
                attendees: event.attendees?.map(a => ({ email: a.email, name: a.displayName || '', status: a.responseStatus || 'pending' })) || [],
                contactId: linkedContactId,
                externalMetadata: { provider },
                updatedAt: new Date(),
              })
              .where(eq(calendarEvents.id, existingEvent.id));
          } else {
            // Create new event
            await db.insert(calendarEvents).values({
              workspaceId,
              title: event.summary,
              description: event.description,
              startTime: event.start,
              endTime: event.end,
              location: event.location,
              meetingUrl: event.meetingLink,
              attendees: event.attendees?.map(a => ({ email: a.email, name: a.displayName || '', status: a.responseStatus || 'pending' })) || [],
              contactId: linkedContactId,
              externalId: event.id,
              externalMetadata: { provider },
              source: provider,
            });
          }

          result.synced++;
        } catch (error) {
          result.errors.push(`Failed to sync event ${event.id}: ${error}`);
        }
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Sync failed: ${error}`);
      logger.error(`[Calendar Sync] ${provider} sync failed`, { workspaceId, error });
    }

    results.push(result);
  }

  return results;
}

/**
 * Get calendar events from local database
 */
export async function getLocalCalendarEvents(
  workspaceId: string,
  options: {
    startDate: Date;
    endDate: Date;
    contactId?: string;
    limit?: number;
  }
): Promise<Array<{
  id: string;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  location: string | null;
  meetingUrl: string | null;
  source: string | null;
  contactId: string | null;
}>> {
  const { startDate, endDate, contactId, limit = 50 } = options;

  const conditions = [
    eq(calendarEvents.workspaceId, workspaceId),
    gte(calendarEvents.startTime, startDate),
    lte(calendarEvents.startTime, endDate),
  ];

  if (contactId) {
    conditions.push(eq(calendarEvents.contactId, contactId));
  }

  const events = await db.query.calendarEvents.findMany({
    where: and(...conditions),
    orderBy: (events, { asc }) => [asc(events.startTime)],
    limit,
    columns: {
      id: true,
      title: true,
      description: true,
      startTime: true,
      endTime: true,
      location: true,
      meetingUrl: true,
      source: true,
      contactId: true,
    },
  });

  return events;
}

/**
 * Create a calendar event across connected providers
 */
export async function createCalendarEvent(
  workspaceId: string,
  event: {
    summary: string;
    description?: string;
    start: Date;
    end: Date;
    location?: string;
    attendees?: string[];
    sendNotifications?: boolean;
    provider?: 'google' | 'microsoft';
    contactId?: string;
  }
): Promise<{
  success: boolean;
  event?: CalendarEvent;
  provider?: 'google' | 'microsoft';
  error?: string;
}> {
  // Determine which provider to use
  let provider = event.provider;
  
  if (!provider) {
    // Auto-select first connected provider
    const googleConnected = await isGoogleCalendarConnected(workspaceId);
    const microsoftConnected = await isMicrosoftCalendarConnected(workspaceId);
    
    if (googleConnected) {
      provider = 'google';
    } else if (microsoftConnected) {
      provider = 'microsoft';
    } else {
      return { success: false, error: 'No calendar provider connected' };
    }
  }

  try {
    let createdEvent: CalendarEvent | null = null;

    if (provider === 'google') {
      createdEvent = await createGoogleCalendarEvent(workspaceId, event);
    } else {
      createdEvent = await createMicrosoftCalendarEvent(workspaceId, {
        ...event,
        createOnlineMeeting: true,
      });
    }

    if (!createdEvent) {
      return { success: false, error: 'Failed to create event' };
    }

    // Store in local database
    await db.insert(calendarEvents).values({
      workspaceId,
      title: createdEvent.summary,
      description: createdEvent.description,
      startTime: createdEvent.start,
      endTime: createdEvent.end,
      location: createdEvent.location,
      meetingUrl: createdEvent.meetingLink,
      attendees: createdEvent.attendees?.map(a => ({ email: a.email, name: a.displayName || '', status: a.responseStatus || 'pending' })) || [],
      contactId: event.contactId,
      externalId: createdEvent.id,
      externalMetadata: { provider },
      source: provider,
    });

    return { success: true, event: createdEvent, provider };
  } catch (error) {
    logger.error('[Calendar Sync] Failed to create event', { workspaceId, error });
    return { success: false, error: String(error) };
  }
}

/**
 * Get available time slots across all connected calendars
 */
export async function getAvailableTimeSlots(
  workspaceId: string,
  options: AvailabilityOptions
): Promise<TimeSlot[]> {
  // Import google availability function
  const { findAvailableTimeSlots } = await import('@/lib/calendar/google');
  
  // Get busy times from Google
  const googleSlots = await findAvailableTimeSlots(workspaceId, options);
  
  // Get busy times from Microsoft
  const microsoftConnected = await isMicrosoftCalendarConnected(workspaceId);
  let microsoftSlots: TimeSlot[] = [];
  
  if (microsoftConnected) {
    microsoftSlots = await findMicrosoftAvailableSlots(workspaceId, options);
  }

  // Merge and find overlapping available slots
  if (googleSlots.length === 0) {
    return microsoftSlots;
  }
  if (microsoftSlots.length === 0) {
    return googleSlots;
  }

  // Find slots that are available in both calendars
  const availableSlots: TimeSlot[] = [];
  
  for (const gSlot of googleSlots) {
    for (const mSlot of microsoftSlots) {
      // Check for overlap
      const overlapStart = new Date(Math.max(gSlot.start.getTime(), mSlot.start.getTime()));
      const overlapEnd = new Date(Math.min(gSlot.end.getTime(), mSlot.end.getTime()));
      
      if (overlapStart < overlapEnd) {
        const duration = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);
        if (duration >= options.duration) {
          availableSlots.push({
            start: overlapStart,
            end: new Date(overlapStart.getTime() + options.duration * 60 * 1000),
          });
        }
      }
    }
  }

  return availableSlots.slice(0, 10);
}

/**
 * Get events for a specific contact
 */
export async function getContactCalendarEvents(
  workspaceId: string,
  contactId: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}
): Promise<Array<{
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location: string | null;
  meetingUrl: string | null;
}>> {
  const {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days ahead
    limit = 20,
  } = options;

  return getLocalCalendarEvents(workspaceId, {
    startDate,
    endDate,
    contactId,
    limit,
  });
}
