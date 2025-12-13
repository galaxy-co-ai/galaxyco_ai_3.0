import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { knowledgeItems, knowledgeItemShares, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// ============================================================================
// GET - List all shares for a document
// ============================================================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: itemId } = await params;

    // Verify item exists and belongs to workspace
    const item = await db.query.knowledgeItems.findFirst({
      where: and(
        eq(knowledgeItems.id, itemId),
        eq(knowledgeItems.workspaceId, workspaceId)
      ),
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get all shares
    const shares = await db.query.knowledgeItemShares.findMany({
      where: eq(knowledgeItemShares.itemId, itemId),
      with: {
        sharedWithUser: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        sharedByUser: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      itemId,
      itemTitle: item.title,
      sharesCount: shares.length,
      shares: shares.map((s) => {
        const sharedWith = Array.isArray(s.sharedWithUser)
          ? s.sharedWithUser[0]
          : s.sharedWithUser;
        const sharedBy = Array.isArray(s.sharedByUser)
          ? s.sharedByUser[0]
          : s.sharedByUser;
        return {
          id: s.id,
          permission: s.permission,
          sharedWithUserId: s.sharedWithUserId,
          sharedWithUser: sharedWith
            ? {
                id: sharedWith.id,
                name:
                  sharedWith.firstName && sharedWith.lastName
                    ? `${sharedWith.firstName} ${sharedWith.lastName}`
                    : sharedWith.email,
                email: sharedWith.email,
              }
            : null,
          sharedWithWorkspaceId: s.sharedWithWorkspaceId,
          sharedBy: sharedBy
            ? sharedBy.firstName && sharedBy.lastName
              ? `${sharedBy.firstName} ${sharedBy.lastName}`
              : sharedBy.email
            : 'Unknown',
          message: s.message,
          expiresAt: s.expiresAt,
          createdAt: s.createdAt,
        };
      }),
    });
  } catch (error) {
    logger.error('[Knowledge Share] Error fetching shares', error);
    return NextResponse.json(
      { error: 'Failed to fetch shares' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create a new share (grant access to a user or workspace)
// ============================================================================

const createShareSchema = z.object({
  email: z.string().email('Valid email required').optional(),
  userId: z.string().uuid().optional(),
  workspaceId: z.string().uuid().optional(),
  permission: z.enum(['view', 'edit', 'admin']).default('view'),
  message: z.string().max(500).optional(),
  expiresAt: z.string().datetime().optional(),
}).refine(
  (data) => data.email || data.userId || data.workspaceId,
  { message: 'Either email, userId, or workspaceId is required' }
);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { id: itemId } = await params;

    const body = await request.json();

    // Validate input
    const validationResult = createShareSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email, userId, workspaceId: targetWorkspaceId, permission, message, expiresAt } =
      validationResult.data;

    // Verify item exists and belongs to workspace
    const item = await db.query.knowledgeItems.findFirst({
      where: and(
        eq(knowledgeItems.id, itemId),
        eq(knowledgeItems.workspaceId, workspaceId)
      ),
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Resolve user ID from email if provided
    let targetUserId = userId;
    if (email && !userId) {
      const targetUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });
      if (targetUser) {
        targetUserId = targetUser.id;
      } else {
        return NextResponse.json(
          { error: 'User with that email not found' },
          { status: 404 }
        );
      }
    }

    // Check if share already exists
    if (targetUserId) {
      const existingShare = await db.query.knowledgeItemShares.findFirst({
        where: and(
          eq(knowledgeItemShares.itemId, itemId),
          eq(knowledgeItemShares.sharedWithUserId, targetUserId)
        ),
      });

      if (existingShare) {
        // Update existing share
        await db
          .update(knowledgeItemShares)
          .set({
            permission,
            message,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
            updatedAt: new Date(),
          })
          .where(eq(knowledgeItemShares.id, existingShare.id));

        return NextResponse.json({
          id: existingShare.id,
          updated: true,
          permission,
        });
      }
    }

    // Create new share
    const [share] = await db
      .insert(knowledgeItemShares)
      .values({
        itemId,
        sharedWithUserId: targetUserId || null,
        sharedWithWorkspaceId: targetWorkspaceId || null,
        permission,
        sharedBy: user.id,
        message,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      })
      .returning();

    logger.info('[Knowledge Share] Created share', {
      itemId,
      shareId: share.id,
      permission,
      sharedWithUserId: targetUserId,
      sharedWithWorkspaceId: targetWorkspaceId,
    });

    return NextResponse.json({
      id: share.id,
      permission: share.permission,
      createdAt: share.createdAt,
    });
  } catch (error) {
    logger.error('[Knowledge Share] Error creating share', error);
    return NextResponse.json(
      { error: 'Failed to create share' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Remove a share
// ============================================================================

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: itemId } = await params;
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get('shareId');

    if (!shareId) {
      return NextResponse.json(
        { error: 'shareId query parameter is required' },
        { status: 400 }
      );
    }

    // Verify item exists and belongs to workspace
    const item = await db.query.knowledgeItems.findFirst({
      where: and(
        eq(knowledgeItems.id, itemId),
        eq(knowledgeItems.workspaceId, workspaceId)
      ),
    });

    if (!item) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete share
    await db
      .delete(knowledgeItemShares)
      .where(
        and(
          eq(knowledgeItemShares.id, shareId),
          eq(knowledgeItemShares.itemId, itemId)
        )
      );

    logger.info('[Knowledge Share] Deleted share', {
      itemId,
      shareId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Knowledge Share] Error deleting share', error);
    return NextResponse.json(
      { error: 'Failed to delete share' },
      { status: 500 }
    );
  }
}
