import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { webhooks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

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

    // Rate limiting
    const rateLimitResult = await rateLimit(`settings:${userId}`, 100, 3600);
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

    const { id } = await params;
    const body = await request.json();

    // Validate input
    const validationResult = updateWebhookSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse(new Error('Validation failed: invalid input'), 'Update webhook error');
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
      return createErrorResponse(new Error('Webhook not found'), 'Update webhook error');
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

    // Rate limiting
    const rateLimitResult = await rateLimit(`settings:${userId}`, 100, 3600);
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

    const { id } = await params;

    // Verify webhook belongs to workspace
    const existing = await db.query.webhooks.findFirst({
      where: and(
        eq(webhooks.id, id),
        eq(webhooks.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return createErrorResponse(new Error('Webhook not found'), 'Delete webhook error');
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
