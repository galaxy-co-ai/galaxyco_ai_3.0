import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const notificationTypeSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
});

const updateNotificationsSchema = z.object({
  types: z.object({
    new_task: notificationTypeSchema.optional(),
    task_completed: notificationTypeSchema.optional(),
    comment_added: notificationTypeSchema.optional(),
    mention: notificationTypeSchema.optional(),
    team_invite: notificationTypeSchema.optional(),
    workspace_update: notificationTypeSchema.optional(),
    billing: notificationTypeSchema.optional(),
    security: notificationTypeSchema.optional(),
    marketing: notificationTypeSchema.optional(),
  }).optional(),
  frequency: z.enum(['instant', 'hourly', 'daily']).optional(),
  quietHours: z.object({
    enabled: z.boolean().optional(),
    start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  }).optional(),
});

interface NotificationPreferences {
  types?: {
    new_task?: { email?: boolean; push?: boolean };
    task_completed?: { email?: boolean; push?: boolean };
    comment_added?: { email?: boolean; push?: boolean };
    mention?: { email?: boolean; push?: boolean };
    team_invite?: { email?: boolean; push?: boolean };
    workspace_update?: { email?: boolean; push?: boolean };
    billing?: { email?: boolean; push?: boolean };
    security?: { email?: boolean; push?: boolean };
    marketing?: { email?: boolean; push?: boolean };
  };
  frequency?: 'instant' | 'hourly' | 'daily';
  quietHours?: {
    enabled?: boolean;
    start?: string;
    end?: string;
  };
}

// ============================================================================
// GET - Get Notification Preferences
// ============================================================================

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    const userRecord = await db.query.users.findFirst({
      where: eq(users.clerkUserId, user.clerkUserId),
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const preferences = (userRecord.preferences as any)?.notifications as NotificationPreferences | undefined;

    // Return defaults if not set
    const defaults: NotificationPreferences = {
      types: {
        new_task: { email: true, push: true },
        task_completed: { email: true, push: false },
        comment_added: { email: true, push: true },
        mention: { email: true, push: true },
        team_invite: { email: true, push: true },
        workspace_update: { email: false, push: false },
        billing: { email: true, push: false },
        security: { email: true, push: true },
        marketing: { email: false, push: false },
      },
      frequency: 'instant',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
    };

    return NextResponse.json({
      ...defaults,
      ...preferences,
      types: {
        ...defaults.types,
        ...preferences?.types,
      },
      quietHours: {
        ...defaults.quietHours,
        ...preferences?.quietHours,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Get notification preferences error');
  }
}

// ============================================================================
// PUT - Update Notification Preferences
// ============================================================================

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    
    // Validate input
    const validationResult = updateNotificationsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    const userRecord = await db.query.users.findFirst({
      where: eq(users.clerkUserId, user.clerkUserId),
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Merge notification preferences
    const currentPrefs = (userRecord.preferences as any) || {};
    const currentNotifications = currentPrefs.notifications || {};

    const updatedNotifications = {
      ...currentNotifications,
      ...updates,
      types: {
        ...currentNotifications.types,
        ...updates.types,
      },
      quietHours: {
        ...currentNotifications.quietHours,
        ...updates.quietHours,
      },
    };

    // Update user preferences
    const [updatedUser] = await db
      .update(users)
      .set({
        preferences: {
          ...currentPrefs,
          notifications: updatedNotifications,
        },
        updatedAt: new Date(),
      })
      .where(eq(users.id, userRecord.id))
      .returning();

    logger.info('Notification preferences updated', { 
      userId: userRecord.id,
      updates,
    });

    const finalNotifications = (updatedUser.preferences as any)?.notifications || {};

    return NextResponse.json({
      success: true,
      notifications: finalNotifications,
    });
  } catch (error) {
    return createErrorResponse(error, 'Update notification preferences error');
  }
}














































