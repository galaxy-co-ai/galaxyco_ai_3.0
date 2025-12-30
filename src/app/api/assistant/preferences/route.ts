import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiUserPreferences, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const updatePreferencesSchema = z.object({
  communicationStyle: z.enum(['concise', 'detailed', 'balanced']).optional(),
  topicsOfInterest: z.array(z.string().max(50)).max(10).optional(),
  defaultModel: z.string().max(50).optional(),
  enableRag: z.boolean().optional(),
  enableProactiveInsights: z.boolean().optional(),
});

// ============================================================================
// GET - Get User Preferences
// ============================================================================

export async function GET() {
  try {
    const { workspaceId, userId: clerkUserId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    // Rate limiting
    const rateLimitResult = await rateLimit(`preferences:${clerkUserId}`, 100, 3600);
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
      return createErrorResponse(new Error('User not found'), 'Preferences get user');
    }

    // Get or create preferences
    let prefs = await db.query.aiUserPreferences.findFirst({
      where: and(
        eq(aiUserPreferences.workspaceId, workspaceId),
        eq(aiUserPreferences.userId, userRecord.id)
      ),
    });

    if (!prefs) {
      // Create default preferences
      const [newPrefs] = await db
        .insert(aiUserPreferences)
        .values({
          workspaceId,
          userId: userRecord.id,
          communicationStyle: 'balanced',
          topicsOfInterest: [],
          frequentQuestions: [],
          defaultModel: 'gpt-4-turbo-preview',
          enableRag: true,
          enableProactiveInsights: true,
        })
        .returning();
      prefs = newPrefs;
    }

    return NextResponse.json({
      communicationStyle: prefs.communicationStyle,
      topicsOfInterest: prefs.topicsOfInterest,
      frequentQuestions: prefs.frequentQuestions,
      defaultModel: prefs.defaultModel,
      enableRag: prefs.enableRag,
      enableProactiveInsights: prefs.enableProactiveInsights,
      corrections: prefs.corrections ? (prefs.corrections as unknown[]).length : 0,
      updatedAt: prefs.updatedAt,
    });
  } catch (error) {
    return createErrorResponse(error, 'Get preferences error');
  }
}

// ============================================================================
// PUT - Update User Preferences
// ============================================================================

export async function PUT(request: Request) {
  try {
    const { workspaceId, userId: clerkUserId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    // Rate limiting
    const rateLimitResult = await rateLimit(`preferences-update:${clerkUserId}`, 100, 3600);
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
    const validationResult = updatePreferencesSchema.safeParse(body);
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
      return createErrorResponse(new Error('User not found'), 'Preferences update user');
    }

    // Update preferences
    const [updatedPrefs] = await db
      .update(aiUserPreferences)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(aiUserPreferences.workspaceId, workspaceId),
          eq(aiUserPreferences.userId, userRecord.id)
        )
      )
      .returning();

    if (!updatedPrefs) {
      return createErrorResponse(new Error('Preferences not found'), 'Preferences update');
    }

    logger.info('AI preferences updated', { userId: userRecord.id });

    return NextResponse.json({
      success: true,
      preferences: {
        communicationStyle: updatedPrefs.communicationStyle,
        topicsOfInterest: updatedPrefs.topicsOfInterest,
        defaultModel: updatedPrefs.defaultModel,
        enableRag: updatedPrefs.enableRag,
        enableProactiveInsights: updatedPrefs.enableProactiveInsights,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Update preferences error');
  }
}

