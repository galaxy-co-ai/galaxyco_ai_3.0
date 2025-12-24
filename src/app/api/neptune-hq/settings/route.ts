import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { neptuneSettings } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Default settings configuration
const DEFAULT_SETTINGS = {
  notifications: {
    emailDigest: true,
    slackAlerts: false,
    inAppNotifications: true,
    dailySummary: true,
  },
  behavior: {
    autoSuggest: true,
    proactiveInsights: true,
    learningEnabled: true,
    responseLength: 'balanced' as const,
  },
  privacy: {
    shareAnalytics: true,
    dataRetentionDays: 90,
    anonymizeData: false,
  },
  integrations: {
    connectedApps: 0,
    apiEnabled: true,
    webhooksEnabled: false,
  },
};

/**
 * GET /api/neptune-hq/settings
 * Returns Neptune HQ settings for the workspace
 */
export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Try to get existing settings
    let settings = await db.query.neptuneSettings.findFirst({
      where: eq(neptuneSettings.workspaceId, workspaceId),
    });

    // If no settings exist, create defaults
    if (!settings) {
      const [newSettings] = await db
        .insert(neptuneSettings)
        .values({
          workspaceId,
          notifications: DEFAULT_SETTINGS.notifications,
          behavior: DEFAULT_SETTINGS.behavior,
          privacy: DEFAULT_SETTINGS.privacy,
          integrations: DEFAULT_SETTINGS.integrations,
        })
        .returning();
      settings = newSettings;
    }

    return NextResponse.json({
      config: {
        notifications: settings.notifications,
        behavior: settings.behavior,
        privacy: settings.privacy,
        integrations: settings.integrations,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Settings error');
  }
}

// Validation schema for settings updates
const settingsUpdateSchema = z.object({
  notifications: z.object({
    emailDigest: z.boolean().optional(),
    slackAlerts: z.boolean().optional(),
    inAppNotifications: z.boolean().optional(),
    dailySummary: z.boolean().optional(),
  }).optional(),
  behavior: z.object({
    autoSuggest: z.boolean().optional(),
    proactiveInsights: z.boolean().optional(),
    learningEnabled: z.boolean().optional(),
    responseLength: z.enum(['concise', 'balanced', 'detailed']).optional(),
  }).optional(),
  privacy: z.object({
    shareAnalytics: z.boolean().optional(),
    dataRetentionDays: z.number().min(7).max(365).optional(),
    anonymizeData: z.boolean().optional(),
  }).optional(),
  integrations: z.object({
    apiEnabled: z.boolean().optional(),
    webhooksEnabled: z.boolean().optional(),
  }).optional(),
});

/**
 * PUT /api/neptune-hq/settings
 * Updates Neptune HQ settings for the workspace
 */
export async function PUT(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const body = await request.json();

    // Validate input
    const validationResult = settingsUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Get current settings
    let settings = await db.query.neptuneSettings.findFirst({
      where: eq(neptuneSettings.workspaceId, workspaceId),
    });

    if (!settings) {
      // Create with defaults + updates
      const [newSettings] = await db
        .insert(neptuneSettings)
        .values({
          workspaceId,
          notifications: { ...DEFAULT_SETTINGS.notifications, ...updates.notifications },
          behavior: { ...DEFAULT_SETTINGS.behavior, ...updates.behavior },
          privacy: { ...DEFAULT_SETTINGS.privacy, ...updates.privacy },
          integrations: { ...DEFAULT_SETTINGS.integrations, ...updates.integrations },
        })
        .returning();
      settings = newSettings;
    } else {
      // Update existing settings
      const [updatedSettings] = await db
        .update(neptuneSettings)
        .set({
          notifications: updates.notifications ? { ...settings.notifications, ...updates.notifications } : settings.notifications,
          behavior: updates.behavior ? { ...settings.behavior, ...updates.behavior } : settings.behavior,
          privacy: updates.privacy ? { ...settings.privacy, ...updates.privacy } : settings.privacy,
          integrations: updates.integrations ? { ...settings.integrations, ...updates.integrations } : settings.integrations,
          updatedAt: new Date(),
        })
        .where(eq(neptuneSettings.workspaceId, workspaceId))
        .returning();
      settings = updatedSettings;
    }

    return NextResponse.json({
      config: {
        notifications: settings.notifications,
        behavior: settings.behavior,
        privacy: settings.privacy,
        integrations: settings.integrations,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Settings update error');
  }
}
