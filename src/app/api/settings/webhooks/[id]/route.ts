import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { webhooks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const updateWebhookSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// PATCH - Update Webhook
// ============================================================================

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const { id } = await params;
    const body = await request.json();
    
    // Validate input
    const validationResult = updateWebhookSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const updates = validationResult.data;

    // Verify webhook belongs to workspace
    const existing = await db.query.webhooks.findFirst({
      where: and(
        eq(webhooks.id, id),
        eq(webhooks.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Update webhook
    const [updated] = await db
      .update(webhooks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(webhooks.id, id))
      .returning();

    logger.info('Webhook updated', { 
      userId,
      webhookId: id,
      updates,
    });

    return NextResponse.json({
      success: true,
      webhook: {
        id: updated.id,
        name: updated.name,
        url: updated.url,
        events: updated.events,
        enabled: updated.isActive ?? true,
        createdAt: updated.createdAt,
        lastTriggeredAt: updated.lastTriggeredAt,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Update webhook error');
  }
}

// ============================================================================
// DELETE - Delete Webhook
// ============================================================================

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const { id } = await params;

    // Verify webhook belongs to workspace
    const existing = await db.query.webhooks.findFirst({
      where: and(
        eq(webhooks.id, id),
        eq(webhooks.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Delete webhook
    await db
      .delete(webhooks)
      .where(eq(webhooks.id, id));

    logger.info('Webhook deleted', { 
      userId,
      webhookId: id,
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    return createErrorResponse(error, 'Delete webhook error');
  }
}
