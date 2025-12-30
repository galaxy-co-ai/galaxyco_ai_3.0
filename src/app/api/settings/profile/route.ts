import { NextResponse } from 'next/server';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, workspaceMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

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
    const { workspaceId } = await getCurrentWorkspace();

    // Rate limiting
    const rateLimitResult = await rateLimit(`settings:${user.clerkUserId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

    // Get user's database record
    const userRecord = await db.query.users.findFirst({
      where: eq(users.clerkUserId, user.clerkUserId),
    });

    if (!userRecord) {
      return createErrorResponse(new Error('User not found'), 'Get profile error');
    }

    // Get user's role in current workspace
    const membership = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, userRecord.id)
      ),
    });

    return NextResponse.json({
      id: userRecord.id,
      email: userRecord.email,
      firstName: userRecord.firstName,
      lastName: userRecord.lastName,
      avatarUrl: userRecord.avatarUrl,
      timezone: (userRecord.preferences as { timezone?: string } | null)?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      preferences: userRecord.preferences,
      role: membership?.role || 'member',
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

    // Rate limiting
    const rateLimitResult = await rateLimit(`settings:${user.clerkUserId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = updateProfileSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse(new Error('Validation failed: invalid input'), 'Update profile error');
    }

    const updates = validationResult.data;

    // Get user's database record
    const userRecord = await db.query.users.findFirst({
      where: eq(users.clerkUserId, user.clerkUserId),
    });

    if (!userRecord) {
      return createErrorResponse(new Error('User not found'), 'Update profile error');
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

