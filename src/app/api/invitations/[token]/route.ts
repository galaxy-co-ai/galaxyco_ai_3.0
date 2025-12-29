import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { workspaceInvitations, workspaceMembers, users, workspaces } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

// ============================================================================
// GET - View Invitation Details
// ============================================================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Invalid invitation link' },
        { status: 400 }
      );
    }

    // Find invitation
    const invitation = await db.query.workspaceInvitations.findFirst({
      where: and(
        eq(workspaceInvitations.token, token),
        eq(workspaceInvitations.status, 'pending')
      ),
      with: {
        workspace: {
          columns: {
            id: true,
            name: true,
          },
        },
        inviter: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or already used' },
        { status: 404 }
      );
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      await db.update(workspaceInvitations)
        .set({ status: 'expired' })
        .where(eq(workspaceInvitations.id, invitation.id));

      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      );
    }

    // Get workspace and inviter details
    const workspace = Array.isArray(invitation.workspace) 
      ? invitation.workspace[0] 
      : invitation.workspace;
    const inviter = Array.isArray(invitation.inviter)
      ? invitation.inviter[0]
      : invitation.inviter;

    const inviterName = inviter?.firstName && inviter?.lastName
      ? `${inviter.firstName} ${inviter.lastName}`
      : inviter?.email || 'A team member';

    return NextResponse.json({
      workspace: workspace?.name || 'Unknown Workspace',
      inviter: inviterName,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    return createErrorResponse(error, 'Get invitation error');
  }
}

// ============================================================================
// POST - Accept Invitation
// ============================================================================

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Invalid invitation link' },
        { status: 400 }
      );
    }

    // Get current authenticated user
    const currentUser = await getCurrentUser();
    
    // Find current user in database
    const currentUserRecord = await db.query.users.findFirst({
      where: eq(users.clerkUserId, currentUser.clerkUserId),
    });

    if (!currentUserRecord) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    // Find and validate invitation
    const invitation = await db.query.workspaceInvitations.findFirst({
      where: and(
        eq(workspaceInvitations.token, token),
        eq(workspaceInvitations.status, 'pending')
      ),
    });

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found or already used' },
        { status: 404 }
      );
    }

    // Check if expired
    if (invitation.expiresAt < new Date()) {
      await db.update(workspaceInvitations)
        .set({ status: 'expired' })
        .where(eq(workspaceInvitations.id, invitation.id));

      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 410 }
      );
    }

    // Check if email matches (case-insensitive)
    if (invitation.email.toLowerCase() !== currentUserRecord.email.toLowerCase()) {
      return NextResponse.json({ 
        error: `This invitation was sent to ${invitation.email}. Please sign in with that email address.` 
      }, { status: 403 });
    }

    // Check if user is already a member
    const existingMember = await db.query.workspaceMembers.findFirst({
      where: and(
        eq(workspaceMembers.workspaceId, invitation.workspaceId),
        eq(workspaceMembers.userId, currentUserRecord.id)
      ),
    });

    if (existingMember) {
      // Mark invitation as accepted anyway
      await db.update(workspaceInvitations)
        .set({ status: 'accepted', acceptedAt: new Date() })
        .where(eq(workspaceInvitations.id, invitation.id));

      return NextResponse.json({ 
        success: true,
        message: 'You are already a member of this workspace',
        workspaceId: invitation.workspaceId,
      });
    }

    // Add user to workspace
    await db.insert(workspaceMembers).values({
      workspaceId: invitation.workspaceId,
      userId: currentUserRecord.id,
      role: invitation.role,
      invitedBy: invitation.invitedBy,
      isActive: true,
    });

    // Mark invitation as accepted
    await db.update(workspaceInvitations)
      .set({ status: 'accepted', acceptedAt: new Date() })
      .where(eq(workspaceInvitations.id, invitation.id));

    logger.info('Workspace invitation accepted', {
      invitationId: invitation.id,
      workspaceId: invitation.workspaceId,
      userId: currentUserRecord.id,
      email: invitation.email,
    });

    return NextResponse.json({ 
      success: true,
      workspaceId: invitation.workspaceId,
    });
  } catch (error) {
    return createErrorResponse(error, 'Accept invitation error');
  }
}
