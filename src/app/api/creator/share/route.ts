/**
 * Document Share API
 * 
 * POST /api/creator/share - Generate a shareable link for a document
 * GET /api/creator/share - List all shares for a document
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { sharedDocuments, creatorItems } from '@/db/schema';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { eq, and, desc } from 'drizzle-orm';
import { randomBytes, createHash } from 'crypto';

// Validation schema for creating a share
const createShareSchema = z.object({
  creatorItemId: z.string().uuid('Invalid document ID'),
  permission: z.enum(['view', 'comment']).default('view'),
  password: z.string().min(4).max(50).optional(),
  expiresIn: z.enum(['never', '1h', '24h', '7d', '30d']).default('never'),
});

// Generate a unique share token
function generateToken(): string {
  return randomBytes(16).toString('hex');
}

// Hash a password
function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

// Calculate expiry date
function calculateExpiry(expiresIn: string): Date | null {
  if (expiresIn === 'never') return null;
  
  const now = new Date();
  switch (expiresIn) {
    case '1h':
      return new Date(now.getTime() + 60 * 60 * 1000);
    case '24h':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

/**
 * POST /api/creator/share
 * 
 * Generate a shareable link for a document
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    const body = await request.json();
    const validation = createShareSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { creatorItemId, permission, password, expiresIn } = validation.data;

    // Verify document exists and belongs to workspace
    const [document] = await db
      .select({ id: creatorItems.id, title: creatorItems.title })
      .from(creatorItems)
      .where(
        and(
          eq(creatorItems.id, creatorItemId),
          eq(creatorItems.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Generate unique token
    const token = generateToken();

    // Create share record
    const [share] = await db
      .insert(sharedDocuments)
      .values({
        workspaceId,
        creatorItemId,
        token,
        permission,
        password: password ? hashPassword(password) : null,
        expiresAt: calculateExpiry(expiresIn),
        createdBy: user.id,
      })
      .returning();

    // Build the shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/shared/${token}`;

    logger.info('Share link created', {
      shareId: share.id,
      documentId: creatorItemId,
      workspaceId,
      hasPassword: !!password,
      expiresIn,
    });

    return NextResponse.json({
      share: {
        id: share.id,
        token: share.token,
        url: shareUrl,
        permission: share.permission,
        hasPassword: !!share.password,
        expiresAt: share.expiresAt,
        createdAt: share.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.error('Failed to create share', { error });
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/creator/share?documentId=xxx
 * 
 * List all shares for a document
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const documentId = request.nextUrl.searchParams.get('documentId');
    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    // Verify document exists and belongs to workspace
    const [document] = await db
      .select({ id: creatorItems.id })
      .from(creatorItems)
      .where(
        and(
          eq(creatorItems.id, documentId),
          eq(creatorItems.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get all shares for this document
    const shares = await db
      .select({
        id: sharedDocuments.id,
        token: sharedDocuments.token,
        permission: sharedDocuments.permission,
        expiresAt: sharedDocuments.expiresAt,
        accessCount: sharedDocuments.accessCount,
        createdAt: sharedDocuments.createdAt,
        hasPassword: sharedDocuments.password,
      })
      .from(sharedDocuments)
      .where(eq(sharedDocuments.creatorItemId, documentId))
      .orderBy(desc(sharedDocuments.createdAt));

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return NextResponse.json({
      shares: shares.map(share => ({
        id: share.id,
        token: share.token,
        url: `${baseUrl}/shared/${share.token}`,
        permission: share.permission,
        hasPassword: !!share.hasPassword,
        expiresAt: share.expiresAt,
        accessCount: share.accessCount,
        createdAt: share.createdAt,
        isExpired: share.expiresAt ? new Date(share.expiresAt) < new Date() : false,
      })),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.error('Failed to list shares', { error });
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

