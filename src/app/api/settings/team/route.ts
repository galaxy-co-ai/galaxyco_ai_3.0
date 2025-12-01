import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { workspaceMembers, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['owner', 'admin', 'member', 'viewer']).default('member'),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'member', 'viewer']),
});

// ============================================================================
// GET - Get Team Members
// ============================================================================

export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Get all workspace members with user details
    const members = await db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.workspaceId, workspaceId),
      with: {
        user: {
          columns: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: [workspaceMembers.createdAt],
    });

    return NextResponse.json({
      members: members.map((member) => {
        // Normalize user which may be object or array
        const user = Array.isArray(member.user) ? member.user[0] : member.user;
        return {
          id: member.id,
          userId: member.userId,
          email: user?.email || '',
          name: user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : user?.firstName || user?.lastName || 'User',
          avatar: user?.avatarUrl || null,
          role: member.role,
          status: member.isActive ? 'active' : 'paused',
          joinedAt: member.joinedAt,
          createdAt: member.createdAt,
        };
      }),
    });
  } catch (error) {
    return createErrorResponse(error, 'Get team members error');
  }
}

// ============================================================================
// POST - Invite Team Member
// ============================================================================

export async function POST(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const currentUser = await getCurrentUser();
    const body = await request.json();
    
    // Validate input
    const validationResult = inviteMemberSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email, role } = validationResult.data;

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!existingUser) {
      // User doesn't exist yet - would need to send invitation email
      // For now, return error suggesting they sign up first
      return NextResponse.json(
        { error: 'User not found. They need to sign up first, or you can invite them via email.' },
        { status: 404 }
      );
    }

    // Check if user is already a member
    const existingMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.userId, existingUser.id)
      ),
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this workspace' },
        { status: 409 }
      );
    }

    // Get current user's database record for invitedBy
    const currentUserRecord = await db.query.users.findFirst({
      where: eq(users.clerkUserId, currentUser.clerkUserId),
    });

    // Add member to workspace
    const [newMember] = await db
      .insert(workspaceMembers)
      .values({
        workspaceId,
        userId: existingUser.id,
        role,
        invitedBy: currentUserRecord?.id || null,
        isActive: true,
      })
      .returning();

    logger.info('Team member added', { workspaceId, userId: existingUser.id, role });

    return NextResponse.json({
      success: true,
      member: {
        id: newMember.id,
        userId: newMember.userId,
        email: existingUser.email,
        name: existingUser.firstName && existingUser.lastName
          ? `${existingUser.firstName} ${existingUser.lastName}`
          : existingUser.firstName || existingUser.lastName || 'User',
        role: newMember.role,
        status: 'active',
      },
    }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Invite team member error');
  }
}






