import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { userAutonomyPreferences } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const updatePreferenceSchema = z.object({
  toolName: z.string(),
  autoExecuteEnabled: z.boolean(),
});

// ============================================================================
// GET - Get All Autonomy Preferences
// ============================================================================

export async function GET() {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    
    // Fetch all autonomy preferences for this user
    const preferences = await db.query.userAutonomyPreferences.findMany({
      where: and(
        eq(userAutonomyPreferences.workspaceId, workspaceId),
        eq(userAutonomyPreferences.userId, userId)
      ),
      orderBy: (prefs, { desc }) => [desc(prefs.confidenceScore)],
    });

    return NextResponse.json({
      preferences: preferences.map(pref => ({
        toolName: pref.toolName,
        actionType: pref.actionType,
        confidenceScore: pref.confidenceScore,
        approvalCount: pref.approvalCount,
        rejectionCount: pref.rejectionCount,
        autoExecuteEnabled: pref.autoExecuteEnabled,
        lastUpdated: pref.lastUpdated.toISOString(),
      })),
    });
  } catch (error) {
    return createErrorResponse(error, 'Get autonomy preferences error');
  }
}

// ============================================================================
// PUT - Update Autonomy Preference
// ============================================================================

export async function PUT(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const body = await request.json();
    
    // Validate input
    const validationResult = updatePreferenceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { toolName, autoExecuteEnabled } = validationResult.data;

    // Check if preference exists
    const existingPref = await db.query.userAutonomyPreferences.findFirst({
      where: and(
        eq(userAutonomyPreferences.workspaceId, workspaceId),
        eq(userAutonomyPreferences.userId, userId),
        eq(userAutonomyPreferences.toolName, toolName)
      ),
    });

    if (!existingPref) {
      return NextResponse.json(
        { error: 'Preference not found for this tool' },
        { status: 404 }
      );
    }

    // Update preference
    const [updatedPref] = await db
      .update(userAutonomyPreferences)
      .set({
        autoExecuteEnabled,
        lastUpdated: new Date(),
      })
      .where(eq(userAutonomyPreferences.id, existingPref.id))
      .returning();

    logger.info('Autonomy preference updated', {
      userId,
      workspaceId,
      toolName,
      autoExecuteEnabled,
    });

    return NextResponse.json({
      success: true,
      preference: {
        toolName: updatedPref.toolName,
        autoExecuteEnabled: updatedPref.autoExecuteEnabled,
        confidenceScore: updatedPref.confidenceScore,
        approvalCount: updatedPref.approvalCount,
        rejectionCount: updatedPref.rejectionCount,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Update autonomy preference error');
  }
}

// ============================================================================
// DELETE - Reset All Autonomy Preferences
// ============================================================================

export async function DELETE() {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    // Delete all preferences for this user
    const deleted = await db
      .delete(userAutonomyPreferences)
      .where(
        and(
          eq(userAutonomyPreferences.workspaceId, workspaceId),
          eq(userAutonomyPreferences.userId, userId)
        )
      )
      .returning();

    logger.info('All autonomy preferences reset', {
      userId,
      workspaceId,
      count: deleted.length,
    });

    return NextResponse.json({
      success: true,
      message: `Reset ${deleted.length} autonomy preference${deleted.length !== 1 ? 's' : ''}`,
      count: deleted.length,
    });
  } catch (error) {
    return createErrorResponse(error, 'Reset autonomy preferences error');
  }
}
