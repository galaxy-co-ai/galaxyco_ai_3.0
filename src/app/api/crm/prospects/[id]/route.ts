import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { prospects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { invalidateCRMCache } from '@/actions/crm';
import { logger } from '@/lib/logger';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const { id: prospectId } = await params;

    logger.info('Deleting prospect', { prospectId, workspaceId, userId });

    // Check if prospect exists and belongs to workspace
    const existing = await db.query.prospects.findFirst({
      where: and(
        eq(prospects.id, prospectId),
        eq(prospects.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Delete prospect
    await db
      .delete(prospects)
      .where(and(
        eq(prospects.id, prospectId),
        eq(prospects.workspaceId, workspaceId)
      ));

    logger.info('Prospect deleted successfully', { prospectId, workspaceId });

    // Invalidate cache in background (non-blocking)
    invalidateCRMCache(userId).catch(err => {
      logger.error('Cache invalidation failed (non-critical):', err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete prospect error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete lead' },
      { status: 500 }
    );
  }
}





