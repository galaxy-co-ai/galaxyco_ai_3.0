import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { articleSources } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

// Update source schema
const updateSourceSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  url: z.string().url().nullable().optional(),
  publication: z.string().max(200).nullable().optional(),
  publishedDate: z.string().nullable().optional(),
  quoteUsed: z.string().max(2000).nullable().optional(),
  claimSupported: z.string().max(2000).nullable().optional(),
  verified: z.boolean().optional(),
  verificationStatus: z.enum(['verified', 'unverified', 'failed']).optional(),
  verificationMethod: z.string().max(100).nullable().optional(),
  verificationNotes: z.string().max(1000).nullable().optional(),
  inlinePosition: z.number().int().nullable().optional(),
});

/**
 * GET /api/admin/sources/[id]
 * Get a single source
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(new Error('Unauthorized'), 'Get source auth');
    }

    const { id } = await params;

    const source = await db.query.articleSources.findFirst({
      where: eq(articleSources.id, id),
    });

    if (!source) {
      return createErrorResponse(new Error('Source not found'), 'Get source');
    }

    return NextResponse.json(source);
  } catch (error) {
    return createErrorResponse(error, 'Get source error');
  }
}

/**
 * PATCH /api/admin/sources/[id]
 * Update a source
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(new Error('Unauthorized'), 'Update source auth');
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateSourceSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(new Error('Invalid request: validation failed'), 'Update source validation');
    }

    // Check source exists
    const existing = await db.query.articleSources.findFirst({
      where: eq(articleSources.id, id),
    });

    if (!existing) {
      return createErrorResponse(new Error('Source not found'), 'Update source');
    }

    const data = validation.data;
    
    // Build update object
    const updateData: Record<string, unknown> = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.publication !== undefined) updateData.publication = data.publication;
    if (data.publishedDate !== undefined) {
      updateData.publishedDate = data.publishedDate ? new Date(data.publishedDate) : null;
    }
    if (data.quoteUsed !== undefined) updateData.quoteUsed = data.quoteUsed;
    if (data.claimSupported !== undefined) updateData.claimSupported = data.claimSupported;
    if (data.verified !== undefined) {
      updateData.verified = data.verified;
      if (data.verified) updateData.verifiedAt = new Date();
    }
    if (data.verificationStatus !== undefined) updateData.verificationStatus = data.verificationStatus;
    if (data.verificationMethod !== undefined) updateData.verificationMethod = data.verificationMethod;
    if (data.verificationNotes !== undefined) updateData.verificationNotes = data.verificationNotes;
    if (data.inlinePosition !== undefined) updateData.inlinePosition = data.inlinePosition;

    // Update
    const [source] = await db
      .update(articleSources)
      .set(updateData)
      .where(eq(articleSources.id, id))
      .returning();

    logger.info('Source updated', { sourceId: id });

    return NextResponse.json(source);
  } catch (error) {
    return createErrorResponse(error, 'Update source error');
  }
}

/**
 * DELETE /api/admin/sources/[id]
 * Delete a source
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(new Error('Unauthorized'), 'Delete source auth');
    }

    const { id } = await params;

    // Check source exists
    const existing = await db.query.articleSources.findFirst({
      where: eq(articleSources.id, id),
    });

    if (!existing) {
      return createErrorResponse(new Error('Source not found'), 'Delete source');
    }

    // Delete
    await db.delete(articleSources).where(eq(articleSources.id, id));

    logger.info('Source deleted', { sourceId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete source error');
  }
}

