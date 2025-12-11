/**
 * Communication Channels Service
 * 
 * Handles sending messages across different channels:
 * - Email (SendGrid, Postmark, Resend)
 * - SMS (Twilio)
 * - WhatsApp (Twilio)
 * - Phone Calls (Twilio)
 * 
 * Environment Variables Required:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_PHONE_NUMBER
 * - TWILIO_WHATSAPP_NUMBER (format: whatsapp:+1234567890)
 * - SENDGRID_API_KEY
 * - SENDGRID_FROM_EMAIL
 * - POSTMARK_API_KEY
 * - POSTMARK_FROM_EMAIL
 * - RESEND_API_KEY
 * - RESEND_FROM_EMAIL
 */

import { logger } from '@/lib/logger';

export type Channel = 'email' | 'sms' | 'call' | 'whatsapp' | 'social' | 'live_chat';

export interface SendMessageOptions {
  channel: Channel;
  to: string; // Phone number or email address
  body: string;
  subject?: string; // For email
  htmlBody?: string; // For email
  from?: string; // Optional custom from address
  mediaUrls?: string[]; // For MMS/WhatsApp media
  replyToMessageId?: string; // For threading
}

export interface SendMessageResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

/**
 * Send a message through the appropriate channel
 */
export async function sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
  switch (options.channel) {
    case 'email':
      return sendEmail(options);
    case 'sms':
      return sendSMS(options);
    case 'whatsapp':
      return sendWhatsApp(options);
    case 'call':
      return initiateCall(options);
    case 'social':
    case 'live_chat':
      // These require real-time connections, handle differently
      return { success: false, error: 'Channel not yet implemented' };
    default:
      return { success: false, error: `Unknown channel: ${options.channel}` };
  }
}

/**
 * Send an email using configured provider
 */
async function sendEmail(options: SendMessageOptions): Promise<SendMessageResult> {
  // Determine which email provider to use
  if (process.env.SENDGRID_API_KEY) {
    return sendEmailViaSendGrid(options);
  } else if (process.env.POSTMARK_API_KEY) {
    return sendEmailViaPostmark(options);
  } else if (process.env.RESEND_API_KEY) {
    return sendEmailViaResend(options);
  }
  
  return { success: false, error: 'No email provider configured' };
}

/**
 * Send email via SendGrid
 */
async function sendEmailViaSendGrid(options: SendMessageOptions): Promise<SendMessageResult> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: options.to }] }],
        from: { email: options.from || process.env.SENDGRID_FROM_EMAIL },
        subject: options.subject || 'No Subject',
        content: [
          { type: 'text/plain', value: options.body },
          ...(options.htmlBody ? [{ type: 'text/html', value: options.htmlBody }] : []),
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('SendGrid send error', { error, status: response.status });
      return { success: false, error: `SendGrid error: ${response.status}` };
    }

    const messageId = response.headers.get('X-Message-Id') || '';
    return { success: true, externalId: messageId };
  } catch (error) {
    logger.error('SendGrid send exception', error);
    return { success: false, error: 'Failed to send email via SendGrid' };
  }
}

/**
 * Send email via Postmark
 */
async function sendEmailViaPostmark(options: SendMessageOptions): Promise<SendMessageResult> {
  try {
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': process.env.POSTMARK_API_KEY!,
      },
      body: JSON.stringify({
        From: options.from || process.env.POSTMARK_FROM_EMAIL,
        To: options.to,
        Subject: options.subject || 'No Subject',
        TextBody: options.body,
        HtmlBody: options.htmlBody,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error('Postmark send error', error);
      return { success: false, error: `Postmark error: ${error.Message}` };
    }

    const result = await response.json();
    return { success: true, externalId: result.MessageID };
  } catch (error) {
    logger.error('Postmark send exception', error);
    return { success: false, error: 'Failed to send email via Postmark' };
  }
}

/**
 * Send email via Resend
 */
async function sendEmailViaResend(options: SendMessageOptions): Promise<SendMessageResult> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || process.env.RESEND_FROM_EMAIL,
        to: [options.to],
        subject: options.subject || 'No Subject',
        text: options.body,
        html: options.htmlBody,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error('Resend send error', error);
      return { success: false, error: `Resend error: ${error.message}` };
    }

    const result = await response.json();
    return { success: true, externalId: result.id };
  } catch (error) {
    logger.error('Resend send exception', error);
    return { success: false, error: 'Failed to send email via Resend' };
  }
}

/**
 * Send SMS via SignalWire
 */
async function sendSMS(options: SendMessageOptions): Promise<SendMessageResult> {
  try {
    const signalwire = await import('@/lib/signalwire');
    
    if (!signalwire.isSignalWireConfigured()) {
      return { success: false, error: 'SignalWire credentials not configured' };
    }

    const message = await signalwire.sendSMS({
      to: options.to,
      body: options.body,
      mediaUrl: options.mediaUrls?.[0],
    });

    return { success: true, externalId: message.sid };
  } catch (error) {
    logger.error('SignalWire SMS send exception', error);
    return { success: false, error: 'Failed to send SMS via SignalWire' };
  }
}

/**
 * Send WhatsApp message via SignalWire
 */
async function sendWhatsApp(options: SendMessageOptions): Promise<SendMessageResult> {
  try {
    const signalwire = await import('@/lib/signalwire');
    
    if (!signalwire.isSignalWireConfigured()) {
      return { success: false, error: 'SignalWire WhatsApp credentials not configured' };
    }

    const message = await signalwire.sendWhatsApp({
      to: options.to,
      body: options.body,
      mediaUrl: options.mediaUrls?.[0],
    });

    return { success: true, externalId: message.sid };
  } catch (error) {
    logger.error('SignalWire WhatsApp send exception', error);
    return { success: false, error: 'Failed to send WhatsApp message via SignalWire' };
  }
}

/**
 * Initiate a phone call via SignalWire
 */
async function initiateCall(options: SendMessageOptions): Promise<SendMessageResult> {
  try {
    const signalwire = await import('@/lib/signalwire');
    
    if (!signalwire.isSignalWireConfigured()) {
      return { success: false, error: 'SignalWire credentials not configured' };
    }

    // TwiML to say the message body
    const twiml = signalwire.TwiML.say(options.body);

    const call = await signalwire.makeCall({
      to: options.to,
      twiml,
    });

    return { success: true, externalId: call.sid };
  } catch (error) {
    logger.error('SignalWire call initiate exception', error);
    return { success: false, error: 'Failed to initiate call via SignalWire' };
  }
}

/**
 * Get the status of a sent message
 */
export async function getMessageStatus(
  channel: Channel,
  externalId: string
): Promise<{ status: string; error?: string }> {
  switch (channel) {
    case 'sms':
    case 'whatsapp':
    case 'call':
      return getSignalWireMessageStatus(externalId);
    default:
      return { status: 'unknown', error: 'Status check not supported for this channel' };
  }
}

/**
 * Get SignalWire message/call status
 */
async function getSignalWireMessageStatus(
  sid: string
): Promise<{ status: string; error?: string }> {
  try {
    const signalwire = await import('@/lib/signalwire');
    
    if (!signalwire.isSignalWireConfigured()) {
      return { status: 'unknown', error: 'SignalWire credentials not configured' };
    }

    // Try to get message status
    try {
      const message = await signalwire.getMessageStatus(sid);
      return { status: message.status };
    } catch {
      // Try to get call status
      const call = await signalwire.getCallDetails(sid);
      return { status: call.status };
    }
  } catch (error) {
    logger.error('SignalWire status check error', error);
    return { status: 'unknown', error: 'Failed to check status' };
  }
}


