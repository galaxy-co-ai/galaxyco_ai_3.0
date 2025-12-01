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
 * Send SMS via Twilio
 */
async function sendSMS(options: SendMessageOptions): Promise<SendMessageResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = options.from || process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: 'Twilio credentials not configured' };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: options.to,
          Body: options.body,
          ...(options.mediaUrls?.length ? { MediaUrl: options.mediaUrls[0] } : {}),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      logger.error('Twilio SMS send error', error);
      return { success: false, error: `Twilio error: ${error.message}` };
    }

    const result = await response.json();
    return { success: true, externalId: result.sid };
  } catch (error) {
    logger.error('Twilio SMS send exception', error);
    return { success: false, error: 'Failed to send SMS via Twilio' };
  }
}

/**
 * Send WhatsApp message via Twilio
 */
async function sendWhatsApp(options: SendMessageOptions): Promise<SendMessageResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = options.from || process.env.TWILIO_WHATSAPP_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: 'Twilio WhatsApp credentials not configured' };
  }

  // Ensure WhatsApp format
  const toNumber = options.to.startsWith('whatsapp:') ? options.to : `whatsapp:${options.to}`;
  const fromWhatsApp = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromWhatsApp,
          To: toNumber,
          Body: options.body,
          ...(options.mediaUrls?.length ? { MediaUrl: options.mediaUrls[0] } : {}),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      logger.error('Twilio WhatsApp send error', error);
      return { success: false, error: `Twilio WhatsApp error: ${error.message}` };
    }

    const result = await response.json();
    return { success: true, externalId: result.sid };
  } catch (error) {
    logger.error('Twilio WhatsApp send exception', error);
    return { success: false, error: 'Failed to send WhatsApp message via Twilio' };
  }
}

/**
 * Initiate a phone call via Twilio
 */
async function initiateCall(options: SendMessageOptions): Promise<SendMessageResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = options.from || process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: 'Twilio credentials not configured' };
  }

  // TwiML to say the message body
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${options.body}</Say>
</Response>`;

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: options.to,
          Twiml: twiml,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      logger.error('Twilio call initiate error', error);
      return { success: false, error: `Twilio call error: ${error.message}` };
    }

    const result = await response.json();
    return { success: true, externalId: result.sid };
  } catch (error) {
    logger.error('Twilio call initiate exception', error);
    return { success: false, error: 'Failed to initiate call via Twilio' };
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
      return getTwilioMessageStatus(externalId);
    default:
      return { status: 'unknown', error: 'Status check not supported for this channel' };
  }
}

/**
 * Get Twilio message/call status
 */
async function getTwilioMessageStatus(
  sid: string
): Promise<{ status: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return { status: 'unknown', error: 'Twilio credentials not configured' };
  }

  try {
    // Try messages first, then calls
    const endpoints = [
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages/${sid}.json`,
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${sid}.json`,
    ];

    for (const url of endpoints) {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        return { status: result.status };
      }
    }

    return { status: 'unknown', error: 'Message not found' };
  } catch (error) {
    logger.error('Twilio status check error', error);
    return { status: 'unknown', error: 'Failed to check status' };
  }
}


