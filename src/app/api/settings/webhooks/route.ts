import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { webhooks } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { nanoid } from 'nanoid';

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const createWebhookSchema = z.object({
  name: z.string().min(1).max(255),
  url: z.string().url(),
  events: z.array(z.string()).min(1),
});

const updateWebhookSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// GET - List All Webhooks
// ============================================================================

export async function GET() {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    
    const userWebhooks = await db.query.webhooks.findMany({
      where: eq(webhooks.workspaceId, workspaceId),
      orderBy: (webhooks, { desc }) => [desc(webhooks.createdAt)],
    });

    return NextResponse.json({
      webhooks: userWebhooks.map(webhook => ({
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        enabled: webhook.isActive ?? true,
        createdAt: webhook.createdAt,
        lastTriggeredAt: webhook.lastTriggeredAt,
      })),
    });
  } catch (error) {
    return createErrorResponse(error, 'Get webhooks error');
  }
}

// ============================================================================
// POST - Create New Webhook
// ============================================================================

export async function POST(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const body = await request.json();
    
    // Validate input
    const validationResult = createWebhookSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, url, events } = validationResult.data;

    // Create webhook
    const [webhook] = await db
      .insert(webhooks)
      .values({
        workspaceId,
        name,
        url,
        events,
        secret: nanoid(32), // Generate webhook secret for verification
        isActive: true,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info('Webhook created', { 
      userId,
      webhookId: webhook.id,
      name,
      events,
    });

    return NextResponse.json({
      success: true,
      webhook: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        enabled: webhook.isActive ?? true,
        secret: webhook.secret,
        createdAt: webhook.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Create webhook error');
  }
}
