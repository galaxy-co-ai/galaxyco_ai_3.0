import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { 
  conversations, 
  conversationMessages, 
  conversationParticipants, 
  contacts,
  workspacePhoneNumbers 
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

/**
 * SignalWire Webhook Receiver
 * 
 * Handles incoming SMS, WhatsApp, and Voice events from SignalWire.
 * Automatically routes messages to the correct workspace based on the phone number.
 * 
 * Setup Instructions:
 * 1. Configure webhook URLs in SignalWire dashboard:
 *    - SMS: https://yourdomain.com/api/webhooks/signalwire/sms
 *    - WhatsApp: https://yourdomain.com/api/webhooks/signalwire/whatsapp
 *    - Voice: https://yourdomain.com/api/webhooks/signalwire/voice
 * 2. Set SIGNALWIRE_PROJECT_ID and SIGNALWIRE_TOKEN in .env
 */

/**
 * Validate SignalWire signature for security
 * SignalWire uses the same signature validation as Twilio
 */
function validateSignalWireSignature(
  signature: string | null,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = process.env.SIGNALWIRE_TOKEN;
  
  if (!authToken || !signature) {
    logger.warn('SignalWire webhook: Missing auth token or signature');
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
 * POST /api/webhooks/signalwire/:type
 * Receives webhooks from SignalWire for SMS, WhatsApp, and Voice
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ type?: string }> }
) {
  try {
    // Await params (Next.js 15+ requirement)
    const resolvedParams = await params;
    
    // Extract type from URL path or query param
    const { searchParams } = new URL(request.url);
    const type = resolvedParams?.type || searchParams.get('type') || 'sms';

    // Parse form data (SignalWire sends form-encoded data like Twilio)
    const formData = await request.formData();
    const webhookParams: Record<string, string> = {};
    formData.forEach((value, key) => {
      webhookParams[key] = value.toString();
    });

    // Validate signature in production
    if (process.env.NODE_ENV === 'production') {
      const signature = request.headers.get('X-Twilio-Signature'); // SignalWire uses same header
      const isValid = validateSignalWireSignature(signature, request.url, webhookParams);
      
      if (!isValid) {
        logger.error('SignalWire webhook: Invalid signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Extract SignalWire params (same as Twilio)
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
    } = webhookParams;

    logger.info('SignalWire webhook received', { type, From, To, MessageSid, CallSid });

    // Clean phone numbers (remove whatsapp: prefix if present)
    const cleanFrom = From?.replace('whatsapp:', '') || '';
    const cleanTo = To?.replace('whatsapp:', '') || '';

    // **KEY DIFFERENCE**: Look up workspace by destination phone number
    // Also get numberType for department routing
    const phoneNumberRecord = await db.query.workspacePhoneNumbers.findFirst({
      where: eq(workspacePhoneNumbers.phoneNumber, cleanTo),
      columns: { workspaceId: true, phoneNumber: true, numberType: true, friendlyName: true },
    });

    if (!phoneNumberRecord) {
      logger.error('SignalWire webhook: No workspace found for phone number', { To: cleanTo });
      
      // Return TwiML response to acknowledge receipt
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { 
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        }
      );
    }

    const workspaceId = phoneNumberRecord.workspaceId;

    // Determine channel type
    let channel: 'sms' | 'whatsapp' | 'call' = 'sms';
    if (type === 'whatsapp' || From?.startsWith('whatsapp:')) {
      channel = 'whatsapp';
    } else if (type === 'voice' || CallSid) {
      channel = 'call';
    }

    // Handle voice calls differently
    if (channel === 'call') {
      return handleVoiceWebhook(
        workspaceId,
        cleanFrom,
        cleanTo,
        CallSid || '',
        CallStatus || '',
        CallDuration,
        RecordingUrl,
        (phoneNumberRecord.numberType || 'primary') as 'primary' | 'sales' | 'support' | 'custom',
        phoneNumberRecord.friendlyName || undefined
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
      parseInt(NumMedia || '0', 10),
      (phoneNumberRecord.numberType || 'primary') as 'primary' | 'sales' | 'support' | 'custom',
      phoneNumberRecord.friendlyName || undefined
    );
  } catch (error) {
    logger.error('SignalWire webhook error', error);
    
    // Return TwiML response even on error
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { 
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
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
  numMedia: number,
  numberType: 'primary' | 'sales' | 'support' | 'custom',
  friendlyName?: string
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
      // Create new conversation with department tag
      const departmentTag = `department:${numberType}`;
      const conversationTags = [departmentTag];
      
      // Add friendly name if available
      if (friendlyName) {
        conversationTags.push(`number:${friendlyName}`);
      }
      
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
          tags: conversationTags,
        })
        .returning();
      
      conversation = newConv;

      // Add participant
      await db.insert(conversationParticipants).values({
        workspaceId,
        conversationId: conversation.id,
        phone: from,
        contactId: existingContact?.id,
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
      isFromCustomer: true,
      senderPhone: from,
      recipientPhone: to,
      externalId: messageSid,
      isDelivered: true,
      deliveredAt: new Date(),
    });

    logger.info('SignalWire message stored', {
      workspaceId,
      conversationId: conversation.id,
      from,
      channel,
    });

    // Return TwiML response
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { 
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  } catch (error) {
    logger.error('SignalWire message webhook error', error);
    
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { 
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  }
}

/**
 * Handle incoming voice call
 */
async function handleVoiceWebhook(
  workspaceId: string,
  from: string,
  to: string,
  callSid: string,
  callStatus: string,
  callDuration?: string,
  recordingUrl?: string,
  numberType?: 'primary' | 'sales' | 'support' | 'custom',
  friendlyName?: string
): Promise<NextResponse> {
  try {
    // Find or create conversation for this call
    let conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.workspaceId, workspaceId),
        eq(conversations.channel, 'call'),
        eq(conversations.externalId, callSid)
      ),
    });

    if (!conversation) {
      // Create new conversation for the call with department tag
      const conversationTags = [];
      if (numberType) {
        conversationTags.push(`department:${numberType}`);
      }
      if (friendlyName) {
        conversationTags.push(`number:${friendlyName}`);
      }
      
      const [newConv] = await db
        .insert(conversations)
        .values({
          workspaceId,
          channel: 'call',
          status: 'active',
          subject: `Call from ${from}`,
          snippet: `${callStatus} call`,
          isUnread: true,
          unreadCount: 1,
          messageCount: 1,
          lastMessageAt: new Date(),
          externalId: callSid,
          tags: conversationTags,
        })
        .returning();
      
      conversation = newConv;

      // Add participant
      await db.insert(conversationParticipants).values({
        workspaceId,
        conversationId: conversation.id,
        phone: from,
      });
    }

    // Create/update call log message
    const callLog = `Call ${callStatus}${callDuration ? ` - Duration: ${callDuration}s` : ''}`;
    
    await db.insert(conversationMessages).values({
      workspaceId,
      conversationId: conversation.id,
      body: callLog,
      direction: 'inbound',
      isFromCustomer: true,
      senderPhone: from,
      recipientPhone: to,
      externalId: callSid,
      callDuration: callDuration ? parseInt(callDuration, 10) : undefined,
      callRecordingUrl: recordingUrl,
      isDelivered: true,
      deliveredAt: new Date(),
    });

    logger.info('SignalWire call logged', {
      workspaceId,
      conversationId: conversation.id,
      from,
      callStatus,
    });

    // Return TwiML to handle the call
    // For now, just play a message
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thank you for calling. Please leave a message after the beep.</Say>
  <Record maxLength="120" />
</Response>`,
      { 
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  } catch (error) {
    logger.error('SignalWire voice webhook error', error);
    
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { 
        status: 200,
        headers: { 'Content-Type': 'text/xml' },
      }
    );
  }
}
