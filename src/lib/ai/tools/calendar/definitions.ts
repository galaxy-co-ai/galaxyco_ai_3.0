/**
 * Calendar Tool Definitions
 *
 * Tool schemas for calendar and scheduling operations
 */

import type { ToolDefinitions } from '../types';

export const calendarToolDefinitions: ToolDefinitions = [
  {
    type: 'function',
    function: {
      name: 'schedule_meeting',
      description: 'Schedule a new meeting or calendar event. Use this when the user wants to create a meeting, appointment, or block time.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Title/name of the meeting (required)',
          },
          description: {
            type: 'string',
            description: 'Description or agenda for the meeting',
          },
          startTime: {
            type: 'string',
            description: 'Start date and time in ISO 8601 format (e.g., "2024-01-15T14:00:00Z")',
          },
          endTime: {
            type: 'string',
            description: 'End date and time in ISO 8601 format',
          },
          duration: {
            type: 'number',
            description: 'Duration in minutes (use if endTime not specified)',
          },
          location: {
            type: 'string',
            description: 'Physical location or "virtual" for online meetings',
          },
          meetingUrl: {
            type: 'string',
            description: 'Video call link (Zoom, Google Meet, etc.)',
          },
          attendees: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                name: { type: 'string' },
              },
            },
            description: 'List of attendees with email and name',
          },
        },
        required: ['title', 'startTime'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_upcoming_events',
      description: 'Get upcoming calendar events. Use this to see what meetings or events are scheduled.',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days to look ahead (default: 7)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of events to return (default: 10)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'find_available_times',
      description: 'Find available time slots for scheduling meetings. Checks calendar for conflicts and suggests open slots.',
      parameters: {
        type: 'object',
        properties: {
          duration: {
            type: 'number',
            description: 'Meeting duration in minutes (default: 30)',
          },
          days_ahead: {
            type: 'number',
            description: 'How many days ahead to search (default: 7, max: 14)',
          },
          working_hours_only: {
            type: 'boolean',
            description: 'Only suggest slots during business hours 9am-5pm (default: true)',
          },
          exclude_weekends: {
            type: 'boolean',
            description: 'Exclude Saturday and Sunday (default: true)',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'schedule_demo',
      description: 'Find available calendar slots and send calendar invites for a product demo. Creates calendar event and sends invite to lead.',
      parameters: {
        type: 'object',
        properties: {
          leadId: {
            type: 'string',
            description: 'ID of the lead to schedule demo for',
          },
          duration: {
            type: 'number',
            description: 'Duration in minutes (default: 30)',
          },
          preferredTimes: {
            type: 'array',
            items: { type: 'string' },
            description: 'Preferred time slots (optional)',
          },
        },
        required: ['leadId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'book_meeting_rooms',
      description: 'Reserve meeting rooms or resources for scheduled meetings. Finds available rooms and books them.',
      parameters: {
        type: 'object',
        properties: {
          eventId: {
            type: 'string',
            description: 'ID of the calendar event to book room for',
          },
          roomRequirements: {
            type: 'array',
            items: { type: 'string' },
            description: 'Room requirements (e.g., ["projector", "whiteboard"])',
          },
        },
        required: ['eventId'],
      },
    },
  },
];
