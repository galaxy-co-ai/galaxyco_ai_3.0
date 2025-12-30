import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { invalidateCRMCache } from '@/actions/crm';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    const rateLimitResult = await rateLimit(`crm:${userId}`, 100, 3600);
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

    const { id: customerId } = await params;

    logger.info('Deleting customer/organization', { customerId, workspaceId, userId });

    // Check if customer exists and belongs to workspace
    const existing = await db.query.customers.findFirst({
      where: and(
        eq(customers.id, customerId),
        eq(customers.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Delete customer/organization
    await db
      .delete(customers)
      .where(and(
        eq(customers.id, customerId),
        eq(customers.workspaceId, workspaceId)
      ));

    logger.info('Customer/organization deleted successfully', { customerId, workspaceId });

    // Invalidate cache in background (non-blocking)
    invalidateCRMCache(userId).catch(err => {
      logger.error('Cache invalidation failed (non-critical):', err);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete customer/organization error');
  }
}
