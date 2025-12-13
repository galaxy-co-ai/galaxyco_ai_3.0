import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { conversations, conversationMessages, conversationParticipants } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { sendMessage, type Channel } from '@/lib/communications/channels';
import { triggerWorkspaceEvent } from '@/lib/pusher-server';

const messageSchema = z.object({
  body: z.string().min(1, 'Message body is required'),
  subject: z.string().optional(),
  htmlBody: z.string().optional(),
  direction: z.enum(['inbound', 'outbound']).default('outbound'),
  replyToId: z.string().optional(),
  sendViaChannel: z.boolean().default(true), // Whether to actually send via channel provider
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: conversationId } = await params;

    // Verify conversation belongs to workspace
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.workspaceId, workspaceId)
      ),
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Fetch messages
    const messages = await db.query.conversationMessages.findMany({
      where: and(
        eq(conversationMessages.conversationId, conversationId),
        eq(conversationMessages.workspaceId, workspaceId)
      ),
      orderBy: [desc(conversationMessages.createdAt)],
    });

    return NextResponse.json({
      messages: messages.map((msg) => ({
        id: msg.id,
        body: msg.body,
        subject: msg.subject,
        htmlBody: msg.htmlBody,
        direction: msg.direction,
        senderName: msg.senderName || 'Unknown',
        senderEmail: msg.senderEmail,
        createdAt: msg.createdAt,
        isRead: msg.isRead,
        attachments: msg.attachments || [],
        callDuration: msg.callDuration,
        callRecordingUrl: msg.callRecordingUrl,
        callTranscription: msg.callTranscription,
        externalId: msg.externalId,
        deliveryStatus: msg.externalMetadata?.deliveryStatus,
      })),
    });
  } catch (error) {
    logger.error('Get messages error', error);
    return createErrorResponse(error, 'Get messages error');
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await currentUser();
    const { id: conversationId } = await params;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify conversation belongs to workspace
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.workspaceId, workspaceId)
      ),
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validated = messageSchema.parse(body);

    // Get recipient info from participants
    const participants = await db.query.conversationParticipants.findMany({
      where: and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.workspaceId, workspaceId)
      ),
    });

    // Find the customer/external participant (not a user)
    const recipient = participants.find(p => !p.userId);
    
    let externalId: string | undefined;
    let deliveryStatus = 'pending';
    let deliveryError: string | undefined;

    // Send via channel provider for outbound messages
    if (validated.direction === 'outbound' && validated.sendViaChannel && recipient) {
      const channel = conversation.channel as Channel;
      
      // Determine recipient address based on channel
      let toAddress = '';
      if (channel === 'email') {
        toAddress = recipient.email || '';
      } else if (channel === 'sms' || channel === 'call' || channel === 'whatsapp') {
        toAddress = recipient.phone || '';
      }

      if (toAddress) {
        const result = await sendMessage({
          channel,
          to: toAddress,
          body: validated.body,
          subject: validated.subject,
          htmlBody: validated.htmlBody,
        });

        if (result.success) {
          externalId = result.externalId;
          deliveryStatus = 'sent';
          logger.info('Message sent via channel', {
            channel,
            conversationId,
            externalId,
          });
        } else {
          deliveryStatus = 'failed';
          deliveryError = result.error;
          logger.warn('Message delivery failed', {
            channel,
            conversationId,
            error: result.error,
          });
        }
      } else {
        deliveryStatus = 'failed';
        deliveryError = `No ${channel === 'email' ? 'email address' : 'phone number'} for recipient`;
      }
    }

    // Create message record
    const messageResult = await db
      .insert(conversationMessages)
      .values({
        workspaceId,
        conversationId,
        body: validated.body,
        subject: validated.subject,
        htmlBody: validated.htmlBody,
        direction: validated.direction,
        replyToId: validated.replyToId,
        senderId: user.id,
        senderName: user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`
          : user.emailAddresses[0]?.emailAddress || 'User',
        senderEmail: user.emailAddresses[0]?.emailAddress || undefined,
        isFromCustomer: validated.direction === 'inbound',
        externalId,
        externalMetadata: {
          deliveryStatus,
          deliveryError,
          sentAt: deliveryStatus === 'sent' ? new Date().toISOString() : undefined,
        },
      })
      .returning();
    const message = Array.isArray(messageResult) ? messageResult[0] : messageResult;

    // Update conversation
    await db
      .update(conversations)
      .set({
        lastMessageAt: new Date(),
        messageCount: (conversation.messageCount || 0) + 1,
        snippet: validated.body.substring(0, 200),
        updatedAt: new Date(),
      })
      .where(eq(conversations.id, conversationId));

    // Broadcast real-time message event (non-blocking)
    triggerWorkspaceEvent(workspaceId, 'chat:message', {
      conversationId,
      messageId: message.id,
      body: message.body,
      direction: message.direction,
      senderId: user.id,
      senderName: message.senderName,
      senderEmail: message.senderEmail,
      createdAt: message.createdAt,
      channel: conversation.channel,
    }).catch(err => {
      logger.error('Message broadcast failed (non-critical)', err);
    });

    return NextResponse.json({
      message: {
        id: message.id,
        body: message.body,
        direction: message.direction,
        senderName: message.senderName,
        createdAt: message.createdAt,
        externalId,
        deliveryStatus,
        deliveryError,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('Create message error', error);
    return createErrorResponse(error, 'Create message error');
  }
}
