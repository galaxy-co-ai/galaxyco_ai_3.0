/**
 * Twilio Status Callback Webhook
 * 
 * Receives delivery status updates for SMS, WhatsApp, and Voice.
 * Updates the message delivery status in the database.
 * 
 * Configure in Twilio Console:
 * - SMS Status Callback: https://yourdomain.com/api/webhooks/twilio/status
 * - WhatsApp Status Callback: https://yourdomain.com/api/webhooks/twilio/status
 * - Voice Status Callback: https://yourdomain.com/api/webhooks/twilio/status
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversationMessages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { parseDeliveryStatus } from '@/lib/twilio';
import crypto from 'crypto';

// Validate Twilio signature for security
function validateTwilioSignature(
  signature: string | null,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!authToken) {
    logger.warn('Twilio status webhook: Missing auth token');
    return false;
  }

  if (!signature) {
    // Allow in development for testing
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    logger.warn('Twilio status webhook: Missing signature');
    return false;
  }

  // Sort params and create string
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], '');
  
  const data = url + sortedParams;
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(Buffer.from(data, 'utf-8'))
    .digest('base64');

  return signature === expectedSignature;
}

/**
 * POST /api/webhooks/twilio/status
 * Receives status callbacks from Twilio
 */
export async function POST(request: Request) {
  try {
    // Parse form data (Twilio sends form-encoded data)
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    // Validate signature in production
    if (process.env.NODE_ENV === 'production') {
      const signature = request.headers.get('X-Twilio-Signature');
      const isValid = validateTwilioSignature(signature, request.url, params);
      
      if (!isValid) {
        logger.error('Twilio status webhook: Invalid signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Extract status info
    const {
      MessageSid,
      MessageStatus,
      CallSid,
      CallStatus,
      CallDuration,
      ErrorCode,
      ErrorMessage,
      To,
      From,
    } = params;

    // Determine if this is a message or call status
    const isCall = !!CallSid;
    const sid = isCall ? CallSid : MessageSid;
    const status = isCall ? CallStatus : MessageStatus;

    if (!sid || !status) {
      logger.warn('Twilio status webhook: Missing SID or status', params);
      return NextResponse.json({ received: true });
    }

    logger.info('Twilio status callback received', {
      sid,
      status,
      isCall,
      errorCode: ErrorCode,
    });

    // Parse the delivery status
    const deliveryStatus = parseDeliveryStatus(status);

    // Find and update the message in the database
    const messages = await db
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.externalId, sid))
      .limit(1);

    if (messages.length > 0) {
      const message = messages[0];
      
      // Update the message with delivery status
      await db
        .update(conversationMessages)
        .set({
          externalMetadata: {
            ...(message.externalMetadata as Record<string, unknown> || {}),
            deliveryStatus,
            lastStatusUpdate: new Date().toISOString(),
            ...(ErrorCode ? { errorCode: ErrorCode } : {}),
            ...(ErrorMessage ? { errorMessage: ErrorMessage } : {}),
            ...(isCall && CallDuration ? { callDuration: parseInt(CallDuration, 10) } : {}),
          },
          ...(isCall && CallDuration ? { callDuration: parseInt(CallDuration, 10) } : {}),
        })
        .where(eq(conversationMessages.id, message.id));

      logger.info('Message delivery status updated', {
        messageId: message.id,
        sid,
        deliveryStatus,
      });
    } else {
      logger.warn('Message not found for status update', { sid });
    }

    // Return success (Twilio expects 200)
    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Twilio status webhook error', error);
    // Still return 200 to prevent Twilio retries
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}

/**
 * GET /api/webhooks/twilio/status
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Twilio status callback endpoint is active',
    configured: !!process.env.TWILIO_ACCOUNT_SID,
  });
}
