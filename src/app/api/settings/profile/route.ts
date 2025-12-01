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

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  timezone: z.string().optional(),
  // Note: email and phone are managed by Clerk, but we can store preferences
});

// ============================================================================
// GET - Get User Profile
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

    return NextResponse.json({
      id: userRecord.id,
      email: userRecord.email,
      firstName: userRecord.firstName,
      lastName: userRecord.lastName,
      avatarUrl: userRecord.avatarUrl,
      timezone: (userRecord.preferences as { timezone?: string } | null)?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      preferences: userRecord.preferences,
      createdAt: userRecord.createdAt,
      updatedAt: userRecord.updatedAt,
    });
  } catch (error) {
    return createErrorResponse(error, 'Get profile error');
  }
}

// ============================================================================
// PUT - Update User Profile
// ============================================================================

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    const body = await request.json();
    
    // Validate input
    const validationResult = updateProfileSchema.safeParse(body);
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

    // Build update object
    const updateData: {
      firstName?: string | null;
      lastName?: string | null;
      preferences?: Record<string, unknown>;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (updates.firstName !== undefined) {
      updateData.firstName = updates.firstName || null;
    }
    if (updates.lastName !== undefined) {
      updateData.lastName = updates.lastName || null;
    }
    if (updates.timezone !== undefined) {
      // Store timezone in preferences
      const currentPrefs = (userRecord.preferences as Record<string, unknown>) || {};
      updateData.preferences = {
        ...currentPrefs,
        timezone: updates.timezone,
      };
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userRecord.id))
      .returning();

    logger.info('User profile updated', { userId: userRecord.id });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        avatarUrl: updatedUser.avatarUrl,
        timezone: (updatedUser.preferences as { timezone?: string } | null)?.timezone,
        preferences: updatedUser.preferences,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Update profile error');
  }
}

