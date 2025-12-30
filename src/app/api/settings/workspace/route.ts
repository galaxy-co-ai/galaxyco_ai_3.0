import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { workspaces, workspaceMembers } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
});

// ============================================================================
// GET - Get Workspace Settings
// ============================================================================

export async function GET() {
  try {
    const { workspaceId, workspace, userId } = await getCurrentWorkspace();

    // Rate limiting
    const rateLimitResult = await rateLimit(`settings:${userId}`, 100, 3600);
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

    // Get member count
    const members = await db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.workspaceId, workspaceId),
    });

    return NextResponse.json({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      plan: workspace.subscriptionTier,
      members: members.length,
      createdAt: workspace.createdAt,
      settings: workspace.settings,
    });
  } catch (error) {
    return createErrorResponse(error, 'Get workspace error');
  }
}

// ============================================================================
// PUT - Update Workspace Settings
// ============================================================================

export async function PUT(request: Request) {
  try {
    const { workspaceId, workspace, userId } = await getCurrentWorkspace();

    // Rate limiting
    const rateLimitResult = await rateLimit(`settings:${userId}`, 100, 3600);
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
    const validationResult = updateWorkspaceSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Check if slug is being changed and if it's available
    if (updates.slug && updates.slug !== workspace.slug) {
      const existingWorkspace = await db.query.workspaces.findFirst({
        where: eq(workspaces.slug, updates.slug),
      });

      if (existingWorkspace && existingWorkspace.id !== workspaceId) {
        return NextResponse.json(
          { error: 'Workspace URL already taken' },
          { status: 409 }
        );
      }
    }

    // Build update object
    const updateData: {
      name?: string;
      slug?: string;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }
    if (updates.slug !== undefined) {
      updateData.slug = updates.slug;
    }

    // Update workspace
    const [updatedWorkspace] = await db
      .update(workspaces)
      .set(updateData)
      .where(eq(workspaces.id, workspaceId))
      .returning();

    logger.info('Workspace updated', { workspaceId });

    return NextResponse.json({
      success: true,
      workspace: {
        id: updatedWorkspace.id,
        name: updatedWorkspace.name,
        slug: updatedWorkspace.slug,
        plan: updatedWorkspace.subscriptionTier,
        createdAt: updatedWorkspace.createdAt,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Update workspace error');
  }
}

