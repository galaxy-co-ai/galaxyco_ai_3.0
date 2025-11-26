import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { workspaces, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const workspaceSettingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(50).optional(),
  settings: z.object({
    branding: z.object({
      logo: z.string().optional(),
      primaryColor: z.string().optional(),
    }).optional(),
    features: z.object({
      ai_provider: z.string().optional(),
      max_agents: z.number().optional(),
    }).optional(),
    notifications: z.object({
      email: z.boolean().optional(),
      slack: z.boolean().optional(),
    }).optional(),
  }).optional(),
});

const profileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().url().optional(),
});

// GET - Fetch current settings
export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Get workspace settings
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    });

    // Get user profile
    const userProfile = await db.query.users.findFirst({
      where: eq(users.id, user.id),
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        plan: workspace.subscriptionTier,
        settings: workspace.settings || {},
        createdAt: workspace.createdAt,
      },
      profile: {
        id: userProfile?.id,
        email: userProfile?.email,
        firstName: userProfile?.firstName,
        lastName: userProfile?.lastName,
        avatarUrl: userProfile?.avatarUrl,
      },
    });
  } catch (error) {
    logger.error('Get settings error', error);
    return createErrorResponse(error, 'Get settings error');
  }
}

// PATCH - Update workspace settings
export async function PATCH(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const body = await request.json();

    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    // Determine what type of update
    if (body.profile) {
      // Update user profile
      const validation = profileSchema.safeParse(body.profile);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid profile data', details: validation.error.errors },
          { status: 400 }
        );
      }

      await db
        .update(users)
        .set({
          firstName: validation.data.firstName,
          lastName: validation.data.lastName,
          avatarUrl: validation.data.avatarUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      return NextResponse.json({ success: true, type: 'profile' });
    }

    if (body.workspace) {
      // Update workspace settings
      const validation = workspaceSettingsSchema.safeParse(body.workspace);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid workspace data', details: validation.error.errors },
          { status: 400 }
        );
      }

      // Get current settings to merge
      const currentWorkspace = await db.query.workspaces.findFirst({
        where: eq(workspaces.id, workspaceId),
      });

      const mergedSettings = {
        ...(currentWorkspace?.settings || {}),
        ...(validation.data.settings || {}),
      };

      await db
        .update(workspaces)
        .set({
          name: validation.data.name || currentWorkspace?.name,
          slug: validation.data.slug || currentWorkspace?.slug,
          settings: mergedSettings,
          updatedAt: new Date(),
        })
        .where(eq(workspaces.id, workspaceId));

      return NextResponse.json({ success: true, type: 'workspace' });
    }

    return NextResponse.json(
      { error: 'No valid update data provided' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Update settings error', error);
    return createErrorResponse(error, 'Update settings error');
  }
}

