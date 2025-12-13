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
    
    // Get user's database record
    const userRecord = await db.query.users.findFirst({
      where: eq(users.clerkUserId, user.clerkUserId),
    });

    if (!userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
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
    const body = await request.json();
    
    // Validate input
    const validationResult = appearanceSchema.safeParse(body);
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
