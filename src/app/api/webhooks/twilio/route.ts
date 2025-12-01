import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations, conversationMessages, conversationParticipants, contacts } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

/**
 * Twilio Webhook Receiver
 * 
 * Handles incoming SMS, WhatsApp, and Voice events from Twilio.
 * 
 * Setup Instructions:
 * 1. Create a Twilio account at https://twilio.com
 * 2. Get your Account SID and Auth Token from the Twilio Console
 * 3. Add these to your .env file:
 *    - TWILIO_ACCOUNT_SID=your_account_sid
 *    - TWILIO_AUTH_TOKEN=your_auth_token
 *    - TWILIO_PHONE_NUMBER=your_twilio_phone
 * 4. Configure your Twilio webhook URLs in the Console:
 *    - SMS: https://yourdomain.com/api/webhooks/twilio?type=sms
 *    - WhatsApp: https://yourdomain.com/api/webhooks/twilio?type=whatsapp
 *    - Voice: https://yourdomain.com/api/webhooks/twilio?type=voice
 * 5. Set TWILIO_WEBHOOK_SECRET for signature validation
 */

// Validate Twilio signature for security
function validateTwilioSignature(
  signature: string | null,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  
  if (!authToken || !signature) {
    logger.warn('Twilio webhook: Missing auth token or signature');
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
 * POST /api/webhooks/twilio
 * Receives webhooks from Twilio for SMS, WhatsApp, and Voice
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'sms';
    const workspaceId = searchParams.get('workspace'); // Pass workspace in webhook URL

    if (!workspaceId) {
      logger.error('Twilio webhook: Missing workspace ID');
      return NextResponse.json(
        { error: 'Missing workspace ID' },
        { status: 400 }
      );
    }

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
        logger.error('Twilio webhook: Invalid signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Extract common Twilio params
    const {
      MessageSid,
      From,
      To,
      Body,
      NumMedia,
      CallSid,
      CallStatus,
      CallDuration,
      RecordingUrl,
    } = params;

    logger.info('Twilio webhook received', { type, From, To, MessageSid, CallSid });

    // Determine channel type
    let channel: 'sms' | 'whatsapp' | 'call' = 'sms';
    if (type === 'whatsapp' || From?.startsWith('whatsapp:')) {
      channel = 'whatsapp';
    } else if (type === 'voice' || CallSid) {
      channel = 'call';
    }

    // Clean phone numbers (remove whatsapp: prefix if present)
    const cleanFrom = From?.replace('whatsapp:', '') || '';
    const cleanTo = To?.replace('whatsapp:', '') || '';

    // Handle voice calls differently
    if (channel === 'call') {
      return handleVoiceWebhook(
        workspaceId,
        cleanFrom,
        cleanTo,
        CallSid || '',
        CallStatus || '',
        CallDuration,
        RecordingUrl
      );
    }

    // Handle SMS/WhatsApp messages
    return handleMessageWebhook(
      workspaceId,
      channel,
      cleanFrom,
      cleanTo,
      Body || '',
      MessageSid || '',
      parseInt(NumMedia || '0', 10)
    );
  } catch (error) {
    logger.error('Twilio webhook error', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle incoming SMS/WhatsApp message
 */
async function handleMessageWebhook(
  workspaceId: string,
  channel: 'sms' | 'whatsapp',
  from: string,
  to: string,
  body: string,
  messageSid: string,
  numMedia: number
): Promise<NextResponse> {
  try {
    // Find or create conversation
    let conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.workspaceId, workspaceId),
        eq(conversations.channel, channel),
        eq(conversations.externalId, from) // Use sender phone as external ID
      ),
    });

    // Try to find existing contact by phone
    const existingContact = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.workspaceId, workspaceId),
        eq(contacts.phone, from)
      ),
    });

    if (!conversation) {
      // Create new conversation
      const [newConv] = await db
        .insert(conversations)
        .values({
          workspaceId,
          channel,
          status: 'active',
          subject: `${channel.toUpperCase()} from ${from}`,
          snippet: body.substring(0, 200),
          isUnread: true,
          unreadCount: 1,
          messageCount: 1,
          lastMessageAt: new Date(),
          externalId: from,
        })
        .returning();
      
      conversation = newConv;

      // Create participant
      await db.insert(conversationParticipants).values({
        workspaceId,
        conversationId: conversation.id,
        contactId: existingContact?.id || null,
        phone: from,
        name: existingContact
          ? `${existingContact.firstName} ${existingContact.lastName}`.trim()
          : from,
        email: existingContact?.email || '',
        isActive: true,
      });
    } else {
      // Update existing conversation
      await db
        .update(conversations)
        .set({
          snippet: body.substring(0, 200),
          isUnread: true,
          unreadCount: (conversation.unreadCount || 0) + 1,
          messageCount: (conversation.messageCount || 0) + 1,
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, conversation.id));
    }

    // Create message record
    await db.insert(conversationMessages).values({
      workspaceId,
      conversationId: conversation.id,
      body,
      direction: 'inbound',
      senderName: existingContact
        ? `${existingContact.firstName} ${existingContact.lastName}`.trim()
        : from,
      senderEmail: existingContact?.email || undefined,
      isFromCustomer: true,
      isRead: false,
      externalId: messageSid,
      attachments: numMedia > 0 ? [] : undefined, // TODO: Handle media attachments
    });

    logger.info('Twilio message processed', {
      conversationId: conversation.id,
      channel,
      from,
    });

    // Return TwiML response (empty for SMS/WhatsApp acknowledgment)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  } catch (error) {
    logger.error('Handle message webhook error', error);
    throw error;
  }
}

/**
 * Handle voice call webhook
 */
async function handleVoiceWebhook(
  workspaceId: string,
  from: string,
  to: string,
  callSid: string,
  callStatus: string,
  callDuration?: string,
  recordingUrl?: string
): Promise<NextResponse> {
  try {
    // Find existing conversation for this call
    let conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.workspaceId, workspaceId),
        eq(conversations.channel, 'call'),
        eq(conversations.externalId, callSid)
      ),
    });

    // Try to find existing contact by phone
    const existingContact = await db.query.contacts.findFirst({
      where: and(
        eq(contacts.workspaceId, workspaceId),
        eq(contacts.phone, from)
      ),
    });

    if (callStatus === 'ringing' || callStatus === 'in-progress') {
      // Call started - create conversation if doesn't exist
      if (!conversation) {
        const [newConv] = await db
          .insert(conversations)
          .values({
            workspaceId,
            channel: 'call',
            status: 'active',
            subject: `Call from ${from}`,
            snippet: `Incoming call - ${callStatus}`,
            isUnread: true,
            unreadCount: 1,
            messageCount: 1,
            lastMessageAt: new Date(),
            externalId: callSid,
          })
          .returning();
        
        conversation = newConv;

        // Create participant
        await db.insert(conversationParticipants).values({
          workspaceId,
          conversationId: conversation.id,
          contactId: existingContact?.id || null,
          phone: from,
          name: existingContact
            ? `${existingContact.firstName} ${existingContact.lastName}`.trim()
            : from,
          email: existingContact?.email || '',
          isActive: true,
        });

        // Create call record message
        await db.insert(conversationMessages).values({
          workspaceId,
          conversationId: conversation.id,
          body: `Incoming call from ${from}`,
          direction: 'inbound',
          senderName: existingContact
            ? `${existingContact.firstName} ${existingContact.lastName}`.trim()
            : from,
          isFromCustomer: true,
          isRead: false,
          externalId: callSid,
        });
      }
    } else if (callStatus === 'completed' && conversation) {
      // Call ended - update with duration and recording
      const duration = parseInt(callDuration || '0', 10);

      // Update conversation
      await db
        .update(conversations)
        .set({
          snippet: `Call completed - ${Math.floor(duration / 60)}m ${duration % 60}s`,
          updatedAt: new Date(),
        })
        .where(eq(conversations.id, conversation.id));

      // Update message with call details
      await db
        .update(conversationMessages)
        .set({
          body: `Call completed - Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`,
          callDuration: duration,
          callRecordingUrl: recordingUrl || undefined,
        })
        .where(
          and(
            eq(conversationMessages.conversationId, conversation.id),
            eq(conversationMessages.externalId, callSid)
          )
        );
    }

    logger.info('Twilio voice webhook processed', {
      callSid,
      callStatus,
      conversationId: conversation?.id,
    });

    // Return TwiML response
    // For incoming calls, you can customize the response (e.g., voicemail, IVR)
    let twiml = '<?xml version="1.0" encoding="UTF-8"?><Response>';
    
    if (callStatus === 'ringing') {
      // Simple greeting - customize as needed
      twiml += '<Say voice="alice">Thank you for calling. Please leave a message after the beep.</Say>';
      twiml += '<Record maxLength="120" transcribe="true" />';
    }
    
    twiml += '</Response>';

    return new NextResponse(twiml, {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    logger.error('Handle voice webhook error', error);
    throw error;
  }
}

/**
 * GET /api/webhooks/twilio
 * Health check for webhook endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Twilio webhook endpoint is active',
    configured: !!process.env.TWILIO_ACCOUNT_SID,
  });
}


