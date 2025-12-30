import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const appearanceSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  accentColor: z.enum(['indigo', 'purple', 'blue', 'teal', 'pink', 'amber']).optional(),
  fontSize: z.enum(['small', 'medium', 'large']).optional(),
});

interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  accentColor?: 'indigo' | 'purple' | 'blue' | 'teal' | 'pink' | 'amber';
  fontSize?: 'small' | 'medium' | 'large';
  timezone?: string;
  notifications?: { email?: boolean; push?: boolean };
  language?: string;
}

// ============================================================================
// GET - Get Appearance Preferences
// ============================================================================

export async function GET() {
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

    // Get user's database record
    const userRecord = await db.query.users.findFirst({
      where: eq(users.clerkUserId, user.clerkUserId),
    });

    if (!userRecord) {
      return createErrorResponse(new Error('User not found'), 'Get appearance preferences error');
    }

    const preferences = (userRecord.preferences as UserPreferences | null) || {};

    return NextResponse.json({
      theme: preferences.theme || 'system',
      accentColor: preferences.accentColor || 'indigo',
      fontSize: preferences.fontSize || 'medium',
    });
  } catch (error) {
    return createErrorResponse(error, 'Get appearance preferences error');
  }
}

// ============================================================================
// PUT - Update Appearance Preferences
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
    const validationResult = appearanceSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse(new Error('Validation failed: invalid input'), 'Update appearance preferences error');
    }

    const updates = validationResult.data;

    // Get user's database record
    const userRecord = await db.query.users.findFirst({
      where: eq(users.clerkUserId, user.clerkUserId),
    });

    if (!userRecord) {
      return createErrorResponse(new Error('User not found'), 'Update appearance preferences error');
    }

    // Merge preferences at top level
    const currentPrefs = (userRecord.preferences as UserPreferences | null) || {};

    const updatedPreferences = {
      ...currentPrefs,
      ...updates,
    };

    // Update user preferences
    const [updatedUser] = await db
      .update(users)
      .set({
        preferences: updatedPreferences,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userRecord.id))
      .returning();

    logger.info('Appearance preferences updated', { 
      userId: userRecord.id,
      updates,
    });

    const finalPrefs = (updatedUser.preferences as UserPreferences | null) || {};

    return NextResponse.json({
      success: true,
      appearance: {
        theme: finalPrefs.theme || 'system',
        accentColor: finalPrefs.accentColor || 'indigo',
        fontSize: finalPrefs.fontSize || 'medium',
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Update appearance preferences error');
  }
}
