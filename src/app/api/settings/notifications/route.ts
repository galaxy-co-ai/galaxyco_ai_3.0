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

const updateNotificationsSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  sms: z.boolean().optional(),
  marketing: z.boolean().optional(),
});

// ============================================================================
// GET - Get Notification Preferences
// ============================================================================

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    // Get user's database record
    const userRecord = await db.query.users.findFirst({
      where: eq(users.clerkUserId, user.clerkUserId),
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const preferences = (userRecord.preferences as {
      notifications?: { email?: boolean; push?: boolean; sms?: boolean; marketing?: boolean };
    } | null) || {};

    return NextResponse.json({
      email: preferences.notifications?.email ?? true,
      push: preferences.notifications?.push ?? true,
      sms: preferences.notifications?.sms ?? false,
      marketing: preferences.notifications?.marketing ?? false,
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

    // Get user's database record
    const userRecord = await db.query.users.findFirst({
      where: eq(users.clerkUserId, user.clerkUserId),
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get current preferences
    const currentPrefs = (userRecord.preferences as Record<string, unknown>) || {};
    const currentNotifications = (currentPrefs.notifications as Record<string, unknown>) || {};

    // Merge notification preferences
    const updatedNotifications = {
      ...currentNotifications,
      ...updates,
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

    logger.info('Notification preferences updated', { userId: userRecord.id });

    const finalPrefs = (updatedUser.preferences as {
      notifications?: { email?: boolean; push?: boolean; sms?: boolean; marketing?: boolean };
    } | null) || {};

    return NextResponse.json({
      success: true,
      notifications: {
        email: finalPrefs.notifications?.email ?? true,
        push: finalPrefs.notifications?.push ?? true,
        sms: finalPrefs.notifications?.sms ?? false,
        marketing: finalPrefs.notifications?.marketing ?? false,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Update notification preferences error');
  }
}











