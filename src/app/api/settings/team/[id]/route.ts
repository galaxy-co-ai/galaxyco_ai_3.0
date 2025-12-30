import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { workspaceMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const updateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
});

// ============================================================================
// PUT - Update Team Member Role
// ============================================================================

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId: currentUserId } = await getCurrentWorkspace();

    // Rate limiting
    const rateLimitResult = await rateLimit(`settings:${currentUserId}`, 100, 3600);
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

    const { id: memberId } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = updateMemberRoleSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { role } = validationResult.data;

    // Get the member to update
    const member = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.id, memberId),
        eq(workspaceMembers.workspaceId, workspaceId)
      ),
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Check permissions - only owners/admins can change roles
    const currentMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, currentUserId)
      ),
    });

    if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to change member roles' },
        { status: 403 }
      );
    }

    // Prevent changing owner role (only one owner allowed)
    if (member.role === 'owner' && role !== 'owner') {
      // Check if there are other owners (excluding this member)
      const allOwners = await db.query.workspaceMembers.findMany({
        where: and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.role, 'owner')
        ),
      });

      if (allOwners.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner from workspace' },
          { status: 400 }
        );
      }
    }

    // Update member role
    const [updatedMember] = await db
      .update(workspaceMembers)
      .set({
        role,
        updatedAt: new Date(),
      })
      .where(eq(workspaceMembers.id, memberId))
      .returning();

    logger.info('Team member role updated', { memberId, role, workspaceId });

    return NextResponse.json({
      success: true,
      member: {
        id: updatedMember.id,
        role: updatedMember.role,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Update team member error');
  }
}

// ============================================================================
// DELETE - Remove Team Member
// ============================================================================

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId: currentUserId } = await getCurrentWorkspace();

    // Rate limiting
    const rateLimitResult = await rateLimit(`settings:${currentUserId}`, 100, 3600);
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

    const { id: memberId } = await params;

    // Get the member to remove
    const member = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.id, memberId),
        eq(workspaceMembers.workspaceId, workspaceId)
      ),
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Check permissions - only owners/admins can remove members
    const currentMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, currentUserId)
      ),
    });

    if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to remove team members' },
        { status: 403 }
      );
    }

    // Prevent removing yourself
    if (member.userId === currentUserId) {
      return NextResponse.json(
        { error: 'Cannot remove yourself from workspace' },
        { status: 400 }
      );
    }

    // Prevent removing the last owner
    if (member.role === 'owner') {
      const allOwners = await db.query.workspaceMembers.findMany({
        where: and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(workspaceMembers.role, 'owner')
        ),
      });

      if (allOwners.length <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner from workspace' },
          { status: 400 }
        );
      }
    }

    // Delete member (or deactivate - using delete for now)
    await db
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.id, memberId));

    logger.info('Team member removed', { memberId, workspaceId });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Remove team member error');
  }
}

// ============================================================================
// PATCH - Toggle Member Active Status (Pause/Resume)
// ============================================================================

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId: currentUserId } = await getCurrentWorkspace();

    // Rate limiting
    const rateLimitResult = await rateLimit(`settings:${currentUserId}`, 100, 3600);
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

    const { id: memberId } = await params;
    const body = await request.json();

    const { isActive } = z.object({ isActive: z.boolean() }).parse(body);

    // Get the member
    const member = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.id, memberId),
        eq(workspaceMembers.workspaceId, workspaceId)
      ),
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const currentMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, currentUserId)
      ),
    });

    if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Prevent pausing yourself
    if (member.userId === currentUserId) {
      return NextResponse.json(
        { error: 'Cannot pause yourself' },
        { status: 400 }
      );
    }

    // Update active status
    const [updatedMember] = await db
      .update(workspaceMembers)
      .set({
        isActive,
        updatedAt: new Date(),
      })
      .where(eq(workspaceMembers.id, memberId))
      .returning();

    logger.info('Team member status updated', { memberId, isActive, workspaceId });

    return NextResponse.json({
      success: true,
      member: {
        id: updatedMember.id,
        status: updatedMember.isActive ? 'active' : 'paused',
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Update team member status error');
  }
}

