/**
 * Shared Document Token API
 * 
 * GET /api/creator/share/[token] - Get shared document content
 * POST /api/creator/share/[token] - Verify password for protected share
 * DELETE /api/creator/share/[token] - Revoke share link (requires auth)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sharedDocuments, creatorItems } from '@/db/schema';
import { getCurrentWorkspace } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { eq, and, sql } from 'drizzle-orm';
import { createHash } from 'crypto';

interface RouteParams {
  params: Promise<{ token: string }>;
}

// Hash a password
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

/**
 * GET /api/creator/share/[token]
 * 
 * Get shared document content (public endpoint)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { token } = await params;

    // Find the share by token
    const [share] = await db
      .select()
      .from(sharedDocuments)
      .where(eq(sharedDocuments.token, token))
      .limit(1);

    if (!share) {
      return NextResponse.json(
        { error: 'Share not found or has been revoked' },
        { status: 404 }
      );
    }

    // Check if expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'This share link has expired' },
        { status: 410 }
      );
    }

    // Check if password protected
    if (share.password) {
      return NextResponse.json({
        requiresPassword: true,
        shareId: share.id,
      });
    }

    // Get the document
    const [document] = await db
      .select({
        id: creatorItems.id,
        title: creatorItems.title,
        type: creatorItems.type,
        content: creatorItems.content,
        metadata: creatorItems.metadata,
        createdAt: creatorItems.createdAt,
      })
      .from(creatorItems)
      .where(eq(creatorItems.id, share.creatorItemId))
      .limit(1);

    if (!document) {
      return NextResponse.json(
        { error: 'Document no longer exists' },
        { status: 404 }
      );
    }

    // Increment access count
    await db
      .update(sharedDocuments)
      .set({
        accessCount: sql`${sharedDocuments.accessCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(sharedDocuments.id, share.id));

    return NextResponse.json({
      document: {
        id: document.id,
        title: document.title,
        type: document.type,
        content: document.content,
        metadata: document.metadata,
        createdAt: document.createdAt,
      },
      share: {
        permission: share.permission,
        accessCount: share.accessCount + 1,
      },
    });
  } catch (error) {
    logger.error('Failed to get shared document', { error });
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/creator/share/[token]
 * 
 * Verify password for protected share
 */
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { token } = await params;

    const body = await request.json();
    const password = body.password;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Find the share by token
    const [share] = await db
      .select()
      .from(sharedDocuments)
      .where(eq(sharedDocuments.token, token))
      .limit(1);

    if (!share) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      );
    }

    // Check if expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'This share link has expired' },
        { status: 410 }
      );
    }

    // Verify password
    if (!share.password || hashPassword(password) !== share.password) {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      );
    }

    // Get the document
    const [document] = await db
      .select({
        id: creatorItems.id,
        title: creatorItems.title,
        type: creatorItems.type,
        content: creatorItems.content,
        metadata: creatorItems.metadata,
        createdAt: creatorItems.createdAt,
      })
      .from(creatorItems)
      .where(eq(creatorItems.id, share.creatorItemId))
      .limit(1);

    if (!document) {
      return NextResponse.json(
        { error: 'Document no longer exists' },
        { status: 404 }
      );
    }

    // Increment access count
    await db
      .update(sharedDocuments)
      .set({
        accessCount: sql`${sharedDocuments.accessCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(sharedDocuments.id, share.id));

    return NextResponse.json({
      document: {
        id: document.id,
        title: document.title,
        type: document.type,
        content: document.content,
        metadata: document.metadata,
        createdAt: document.createdAt,
      },
      share: {
        permission: share.permission,
        accessCount: share.accessCount + 1,
      },
    });
  } catch (error) {
    logger.error('Failed to verify share password', { error });
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/creator/share/[token]
 * 
 * Revoke a share link (requires authentication)
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { token } = await params;

    // Find the share by token
    const [share] = await db
      .select({ id: sharedDocuments.id })
      .from(sharedDocuments)
      .where(
        and(
          eq(sharedDocuments.token, token),
          eq(sharedDocuments.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (!share) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      );
    }

    // Delete the share
    await db
      .delete(sharedDocuments)
      .where(eq(sharedDocuments.id, share.id));

    logger.info('Share link revoked', {
      shareId: share.id,
      token,
      workspaceId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.error('Failed to revoke share', { error });
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

