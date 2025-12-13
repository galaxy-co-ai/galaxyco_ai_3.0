import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { webhooks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import crypto from 'crypto';

// ============================================================================
// POST - Test Webhook
// ============================================================================

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const { id } = await params;

    // Verify webhook belongs to workspace
    const webhook = await db.query.webhooks.findFirst({
      where: and(
        eq(webhooks.id, id),
        eq(webhooks.workspaceId, workspaceId)
      ),
    });

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 });
    }

    // Prepare test payload
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook delivery from GalaxyCo',
        webhookId: webhook.id,
        webhookName: webhook.name,
      },
    };

    // Generate signature for verification
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(JSON.stringify(testPayload))
      .digest('hex');

    // Send test request to webhook URL
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GalaxyCo-Signature': signature,
          'X-GalaxyCo-Event': 'webhook.test',
          'User-Agent': 'GalaxyCo-Webhooks/1.0',
        },
        body: JSON.stringify(testPayload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      const success = response.ok;
      const statusCode = response.status;
      let responseBody = '';

      try {
        responseBody = await response.text();
      } catch {
        // Ignore if response body can't be read
      }

      logger.info('Webhook test sent', {
        userId,
        webhookId: id,
        success,
        statusCode,
      });

      // Update last triggered timestamp
      await db
        .update(webhooks)
        .set({
          lastTriggeredAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(webhooks.id, id));

      return NextResponse.json({
        success,
        statusCode,
        message: success 
          ? 'Test webhook delivered successfully'
          : `Webhook returned status ${statusCode}`,
        response: responseBody.substring(0, 500), // Limit response size
      });
    } catch (error: any) {
      logger.error('Webhook test failed', {
        userId,
        webhookId: id,
        error: error.message,
      });

      return NextResponse.json({
        success: false,
        message: `Failed to deliver webhook: ${error.message}`,
      }, { status: 200 }); // Return 200 so UI can show the error
    }
  } catch (error) {
    return createErrorResponse(error, 'Test webhook error');
  }
}
