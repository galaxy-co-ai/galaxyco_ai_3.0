import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { conversations, conversationMessages, conversationParticipants, contacts } from '@/db/schema';
import { eq, and, ilike } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * Email Webhook Receiver (Inbound Parse)
 * 
 * Handles incoming emails from email service providers.
 * Supports: SendGrid Inbound Parse, Postmark, Resend, etc.
 * 
 * Setup Instructions for SendGrid:
 * 1. Create a SendGrid account at https://sendgrid.com
 * 2. Go to Settings > Inbound Parse
 * 3. Add your domain (e.g., mail.yourdomain.com)
 * 4. Set the webhook URL: https://yourdomain.com/api/webhooks/email?provider=sendgrid&workspace=YOUR_WORKSPACE_ID
 * 5. Configure your domain's MX records as directed by SendGrid
 * 
 * Setup Instructions for Postmark:
 * 1. Create a Postmark account at https://postmarkapp.com
 * 2. Go to your Server > Settings > Inbound
 * 3. Add inbound webhook: https://yourdomain.com/api/webhooks/email?provider=postmark&workspace=YOUR_WORKSPACE_ID
 * 
 * Environment variables needed:
 * - SENDGRID_INBOUND_SECRET (optional, for signature validation)
 * - POSTMARK_INBOUND_SECRET (optional, for signature validation)
 */

interface ParsedEmail {
  from: string;
  fromName: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  messageId: string;
  attachments: Array<{
    filename: string;
    type: string;
    content: string;
  }>;
  headers: Record<string, string>;
  inReplyTo?: string;
}

/**
 * POST /api/webhooks/email
 * Receives inbound emails from email service providers
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') || 'sendgrid';
    const workspaceId = searchParams.get('workspace');

    if (!workspaceId) {
      logger.error('Email webhook: Missing workspace ID');
      return NextResponse.json(
        { error: 'Missing workspace ID in webhook URL' },
        { status: 400 }
      );
    }

    let email: ParsedEmail;

    // Parse based on provider format
    switch (provider) {
      case 'sendgrid':
        email = await parseSendGridEmail(request);
        break;
      case 'postmark':
        email = await parsePostmarkEmail(request);
        break;
      case 'resend':
        email = await parseResendEmail(request);
        break;
      default:
        email = await parseGenericEmail(request);
    }

    logger.info('Email webhook received', {
      provider,
      from: email.from,
      to: email.to,
      subject: email.subject,
    });

    // Process the email
    await processInboundEmail(workspaceId, email);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Email webhook error', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Parse SendGrid Inbound Parse format
 */
async function parseSendGridEmail(request: Request): Promise<ParsedEmail> {
  const formData = await request.formData();

  const from = formData.get('from')?.toString() || '';
  const to = formData.get('to')?.toString() || '';
  const subject = formData.get('subject')?.toString() || '';
  const text = formData.get('text')?.toString() || '';
  const html = formData.get('html')?.toString() || '';
  const headers = formData.get('headers')?.toString() || '';
  const envelope = formData.get('envelope')?.toString() || '{}';

  // Parse email address and name
  const fromMatch = from.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
  const fromName = fromMatch?.[1] || '';
  const fromEmail = fromMatch?.[2] || from;

  // Parse headers for Message-ID and In-Reply-To
  const parsedHeaders: Record<string, string> = {};
  headers.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      parsedHeaders[key.trim().toLowerCase()] = valueParts.join(':').trim();
    }
  });

  // Parse attachments
  const attachments: ParsedEmail['attachments'] = [];
  const attachmentInfo = formData.get('attachment-info');
  if (attachmentInfo) {
    try {
      const info = JSON.parse(attachmentInfo.toString());
      for (const key of Object.keys(info)) {
        const file = formData.get(key);
        if (file instanceof Blob) {
          attachments.push({
            filename: info[key].filename || key,
            type: info[key].type || 'application/octet-stream',
            content: '', // Would need to read file content
          });
        }
      }
    } catch {
      // Ignore parsing errors
    }
  }

  return {
    from: fromEmail,
    fromName,
    to,
    subject,
    text,
    html,
    messageId: parsedHeaders['message-id'] || '',
    attachments,
    headers: parsedHeaders,
    inReplyTo: parsedHeaders['in-reply-to'],
  };
}

/**
 * Parse Postmark Inbound format
 */
async function parsePostmarkEmail(request: Request): Promise<ParsedEmail> {
  const json = await request.json();

  return {
    from: json.FromFull?.Email || json.From || '',
    fromName: json.FromFull?.Name || json.FromName || '',
    to: json.ToFull?.[0]?.Email || json.To || '',
    subject: json.Subject || '',
    text: json.TextBody || '',
    html: json.HtmlBody || '',
    messageId: json.MessageID || '',
    attachments: (json.Attachments || []).map((att: any) => ({
      filename: att.Name,
      type: att.ContentType,
      content: att.Content,
    })),
    headers: json.Headers?.reduce((acc: Record<string, string>, h: any) => {
      acc[h.Name.toLowerCase()] = h.Value;
      return acc;
    }, {}) || {},
    inReplyTo: json.Headers?.find((h: any) => h.Name.toLowerCase() === 'in-reply-to')?.Value,
  };
}

/**
 * Parse Resend Inbound format
 */
async function parseResendEmail(request: Request): Promise<ParsedEmail> {
  const json = await request.json();

  return {
    from: json.from || '',
    fromName: json.from_name || '',
    to: json.to || '',
    subject: json.subject || '',
    text: json.text || '',
    html: json.html || '',
    messageId: json.message_id || '',
    attachments: (json.attachments || []).map((att: any) => ({
      filename: att.filename,
      type: att.content_type,
      content: att.content,
    })),
    headers: json.headers || {},
    inReplyTo: json.in_reply_to,
  };
}

/**
 * Parse generic email webhook format
 */
async function parseGenericEmail(request: Request): Promise<ParsedEmail> {
  const contentType = request.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    const json = await request.json();
    return {
      from: json.from || json.sender || '',
      fromName: json.from_name || json.sender_name || '',
      to: json.to || json.recipient || '',
      subject: json.subject || '',
      text: json.text || json.body || json.plain || '',
      html: json.html || json.html_body || '',
      messageId: json.message_id || json.messageId || '',
      attachments: json.attachments || [],
      headers: json.headers || {},
      inReplyTo: json.in_reply_to || json.inReplyTo,
    };
  }

  // Form data format
  const formData = await request.formData();
  return {
    from: formData.get('from')?.toString() || '',
    fromName: formData.get('from_name')?.toString() || '',
    to: formData.get('to')?.toString() || '',
    subject: formData.get('subject')?.toString() || '',
    text: formData.get('text')?.toString() || formData.get('body')?.toString() || '',
    html: formData.get('html')?.toString() || '',
    messageId: formData.get('message_id')?.toString() || '',
    attachments: [],
    headers: {},
  };
}

/**
 * Process inbound email and create/update conversation
 */
async function processInboundEmail(workspaceId: string, email: ParsedEmail): Promise<void> {
  // Find existing conversation by thread (In-Reply-To) or sender email
  let conversation = email.inReplyTo
    ? await db.query.conversations.findFirst({
        where: and(
          eq(conversations.workspaceId, workspaceId),
          eq(conversations.channel, 'email'),
          eq(conversations.externalId, email.inReplyTo)
        ),
      })
    : null;

  // If no thread match, try to find by sender email
  if (!conversation) {
    conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.workspaceId, workspaceId),
        eq(conversations.channel, 'email'),
        eq(conversations.externalId, email.from),
        ilike(conversations.subject, `%${email.subject.replace(/^Re:\s*/i, '')}%`)
      ),
    });
  }

  // Try to find existing contact by email
  const existingContact = await db.query.contacts.findFirst({
    where: and(
      eq(contacts.workspaceId, workspaceId),
      eq(contacts.email, email.from)
    ),
  });

  if (!conversation) {
    // Create new conversation
    const [newConv] = await db
      .insert(conversations)
      .values({
        workspaceId,
        channel: 'email',
        status: 'active',
        subject: email.subject || 'No Subject',
        snippet: (email.text || email.html || '').substring(0, 200).replace(/<[^>]*>/g, ''),
        isUnread: true,
        unreadCount: 1,
        messageCount: 1,
        lastMessageAt: new Date(),
        externalId: email.from,
        externalMetadata: { threadId: email.messageId },
      })
      .returning();

    conversation = newConv;

    // Create participant
    await db.insert(conversationParticipants).values({
      workspaceId,
      conversationId: conversation.id,
      contactId: existingContact?.id || null,
      email: email.from,
      name: email.fromName || existingContact
        ? `${existingContact?.firstName || ''} ${existingContact?.lastName || ''}`.trim()
        : email.from,
    });
  } else {
    // Update existing conversation
    await db
      .update(conversations)
      .set({
        snippet: (email.text || email.html || '').substring(0, 200).replace(/<[^>]*>/g, ''),
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
    subject: email.subject,
    body: email.text || '',
    htmlBody: email.html || undefined,
    direction: 'inbound',
    senderName: email.fromName || email.from,
    senderEmail: email.from,
    isFromCustomer: true,
    isRead: false,
    externalId: email.messageId,
    attachments: email.attachments.length > 0 
      ? email.attachments.map(a => ({ 
          name: a.filename, 
          type: a.type,
          url: '', // To be populated after upload
          size: a.content?.length || 0,
        }))
      : undefined,
  });

  logger.info('Inbound email processed', {
    conversationId: conversation.id,
    from: email.from,
    subject: email.subject,
  });
}

/**
 * GET /api/webhooks/email
 * Health check for webhook endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Email webhook endpoint is active',
    supportedProviders: ['sendgrid', 'postmark', 'resend', 'generic'],
  });
}


