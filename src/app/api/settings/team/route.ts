import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { workspaceMembers, users, workspaceInvitations, workspaces } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';
import { sendEmail, getWorkspaceInviteTemplate, getInvitationConfirmationTemplate } from '@/lib/email';
import crypto from 'crypto';

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
    const { workspaceId, userId } = await getCurrentWorkspace();

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
    const validationResult = inviteMemberSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email, role } = validationResult.data;

    // Get workspace details
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
    });

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Get current user's database record
    const currentUserRecord = await db.query.users.findFirst({
      where: eq(users.clerkUserId, currentUser.clerkUserId),
    });

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      // User exists - check if already a member
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

      // Add existing user to workspace directly
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
    }

    // User doesn't exist - send invitation email
    
    // Check if invitation already exists
    const existingInvitation = await db.query.workspaceInvitations.findFirst({
      where: and(
        eq(workspaceInvitations.workspaceId, workspaceId),
        eq(workspaceInvitations.email, email),
        eq(workspaceInvitations.status, 'pending')
      ),
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation has already been sent to this email address' },
        { status: 409 }
      );
    }

    // Generate secure invite token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store invitation in database
    const [invitation] = await db.insert(workspaceInvitations).values({
      workspaceId,
      email,
      role,
      token,
      invitedBy: currentUserRecord?.id || null,
      expiresAt,
      status: 'pending',
    }).returning();

    // Build invite URL
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://galaxyco.ai'}/invite/${token}`;
    
    // Send invitation email
    const inviterName = currentUser.firstName && currentUser.lastName
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : currentUser.email || 'A team member';
      
    const template = getWorkspaceInviteTemplate(
      inviterName,
      workspace.name || 'a workspace',
      inviteUrl,
      7
    );

    const emailResult = await sendEmail({
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (!emailResult.success) {
      logger.error('Failed to send invitation email', { email, error: emailResult.error });
      return NextResponse.json(
        { error: 'Failed to send invitation email' },
        { status: 500 }
      );
    }

    // Send confirmation email to inviter
    const confirmationTemplate = getInvitationConfirmationTemplate(
      inviterName,
      email,
      workspace.name || 'your workspace',
      role
    );

    await sendEmail({
      to: currentUser.email,
      subject: confirmationTemplate.subject,
      html: confirmationTemplate.html,
      text: confirmationTemplate.text,
    });
    // Note: Don't fail if confirmation email fails - it's not critical

    logger.info('Workspace invitation sent', { 
      workspaceId, 
      email, 
      role, 
      invitedBy: currentUserRecord?.id,
      emailSent: emailResult.success 
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation sent successfully',
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Invite team member error');
  }
}






