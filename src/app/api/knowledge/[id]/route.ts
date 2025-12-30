import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { knowledgeItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { deleteKnowledgeDocument } from '@/lib/vector';
import { rateLimit } from '@/lib/rate-limit';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const { id: itemId } = await params;

    // Rate limit - 100 requests per hour
    const rateLimitResult = await rateLimit(`knowledge-delete:${userId}`, 100, 3600);
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

    logger.info('Deleting knowledge item', { itemId, workspaceId, userId });

    // Check if item exists and belongs to workspace
    const existing = await db.query.knowledgeItems.findFirst({
      where: and(
        eq(knowledgeItems.id, itemId),
        eq(knowledgeItems.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Delete from vector database if configured
    try {
      await deleteKnowledgeDocument(itemId, workspaceId);
    } catch (vectorError) {
      logger.warn('Failed to delete from vector database (non-critical)', { error: vectorError, itemId });
    }

    // Delete knowledge item
    await db
      .delete(knowledgeItems)
      .where(and(
        eq(knowledgeItems.id, itemId),
        eq(knowledgeItems.workspaceId, workspaceId)
      ));

    logger.info('Knowledge item deleted successfully', { itemId, workspaceId });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete knowledge item error');
  }
}
