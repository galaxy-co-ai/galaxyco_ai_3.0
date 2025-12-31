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
import { createErrorResponse } from '@/lib/api-error-handler';
import { CreatorShareAccessSchema } from '@/lib/validation/schemas';

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
      return createErrorResponse(new Error('Share not found or has been revoked'), 'Shared Document GET');
    }

    // Check if expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return createErrorResponse(new Error('This share link has expired'), 'Shared Document GET');
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
      return createErrorResponse(new Error('Document not found'), 'Shared Document GET');
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
    return createErrorResponse(error, 'Shared Document GET');
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
    const validation = CreatorShareAccessSchema.safeParse(body);
    if (!validation.success || !validation.data.password) {
      return createErrorResponse(new Error('Password is required'), 'Share Password Verification');
    }
    const { password } = validation.data;

    // Find the share by token
    const [share] = await db
      .select()
      .from(sharedDocuments)
      .where(eq(sharedDocuments.token, token))
      .limit(1);

    if (!share) {
      return createErrorResponse(new Error('Share not found'), 'Share Password Verification');
    }

    // Check if expired
    if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
      return createErrorResponse(new Error('This share link has expired'), 'Share Password Verification');
    }

    // Verify password
    if (!share.password || hashPassword(password) !== share.password) {
      return createErrorResponse(new Error('Unauthorized - Incorrect password'), 'Share Password Verification');
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
      return createErrorResponse(new Error('Document not found'), 'Share Password Verification');
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
    return createErrorResponse(error, 'Share Password Verification');
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
      return createErrorResponse(new Error('Share not found'), 'Revoke Share');
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
    logger.error('Failed to revoke share', { error });
    return createErrorResponse(error, 'Revoke Share');
  }
}

