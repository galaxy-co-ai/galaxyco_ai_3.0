import { Resend } from 'resend';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  tags?: Array<{ name: string; value: string }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BulkEmailResult {
  success: boolean;
  sent: number;
  failed: number;
  results: EmailResult[];
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

// ============================================================================
// RESEND CLIENT
// ============================================================================

let resendClient: Resend | null = null;

/**
 * Get or create the Resend client
 */
function getResend(): Resend {
  if (resendClient) {
    return resendClient;
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('Resend not configured. Please set RESEND_API_KEY environment variable.');
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

/**
 * Check if Resend is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Get the default "from" email address
 * Uses RESEND_FROM_EMAIL env var or defaults to onboarding@resend.dev for testing
 */
function getDefaultFrom(): string {
  return process.env.RESEND_FROM_EMAIL || 'GalaxyCo.ai <onboarding@resend.dev>';
}

// ============================================================================
// EMAIL SENDING
// ============================================================================

/**
 * Send a single email
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  if (!isEmailConfigured()) {
    logger.warn('[Email] Resend not configured - email not sent', {
      to: options.to,
      subject: options.subject,
    });
    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  try {
    const resend = getResend();

    // Build email payload
    // Note: Using type assertion due to Resend SDK type complexity
    const emailPayload = {
      from: options.from || getDefaultFrom(),
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html || undefined,
      text: options.text || undefined,
      replyTo: options.replyTo || undefined,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
      tags: options.tags || undefined,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await resend.emails.send(emailPayload as any);

    if (error) {
      logger.error('[Email] Failed to send email', { error: error.message, to: options.to });
      return {
        success: false,
        error: error.message,
      };
    }

    logger.info('[Email] Email sent successfully', {
      messageId: data?.id,
      to: options.to,
      subject: options.subject,
    });

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (error) {
    logger.error('[Email] Exception sending email', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send emails in bulk (for campaigns)
 * Processes emails in batches to avoid rate limits
 */
export async function sendBulkEmails(
  emails: EmailOptions[],
  batchSize: number = 10,
  delayMs: number = 100
): Promise<BulkEmailResult> {
  if (!isEmailConfigured()) {
    logger.warn('[Email] Resend not configured - bulk emails not sent');
    return {
      success: false,
      sent: 0,
      failed: emails.length,
      results: emails.map(() => ({
        success: false,
        error: 'Email service not configured',
      })),
    };
  }

  const results: EmailResult[] = [];
  let sent = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    // Send batch in parallel
    const batchResults = await Promise.all(batch.map((email) => sendEmail(email)));

    for (const result of batchResults) {
      results.push(result);
      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }

    // Delay between batches to avoid rate limits
    if (i + batchSize < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  logger.info('[Email] Bulk send completed', { sent, failed, total: emails.length });

  return {
    success: failed === 0,
    sent,
    failed,
    results,
  };
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Generate a welcome email template
 */
export function getWelcomeEmailTemplate(userName: string, workspaceName: string): EmailTemplate {
  return {
    subject: `Welcome to ${workspaceName} on GalaxyCo.ai! 🚀`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6366f1; margin: 0;">🌟 Welcome to GalaxyCo.ai!</h1>
          </div>
          
          <p>Hi ${userName},</p>
          
          <p>Welcome to <strong>${workspaceName}</strong>! We're thrilled to have you on board.</p>
          
          <p>Here's what you can do with GalaxyCo.ai:</p>
          
          <ul style="padding-left: 20px;">
            <li><strong>Neptune AI</strong> - Your intelligent assistant for CRM, marketing, and more</li>
            <li><strong>CRM</strong> - Manage leads, contacts, and deals</li>
            <li><strong>Marketing</strong> - Create and track campaigns</li>
            <li><strong>Knowledge Base</strong> - Store and search your documents</li>
            <li><strong>Workflow Studio</strong> - Build AI-powered automations</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://galaxyco.ai'}/dashboard" 
               style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block;">
              Get Started →
            </a>
          </div>
          
          <p>If you have any questions, just ask Neptune - it's always ready to help!</p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            Best regards,<br>
            The GalaxyCo.ai Team
          </p>
        </body>
      </html>
    `,
    text: `
Welcome to ${workspaceName} on GalaxyCo.ai!

Hi ${userName},

Welcome to ${workspaceName}! We're thrilled to have you on board.

Here's what you can do with GalaxyCo.ai:
- Neptune AI - Your intelligent assistant for CRM, marketing, and more
- CRM - Manage leads, contacts, and deals
- Marketing - Create and track campaigns
- Knowledge Base - Store and search your documents
- Workflow Studio - Build AI-powered automations

Get started: ${process.env.NEXT_PUBLIC_APP_URL || 'https://galaxyco.ai'}/dashboard

If you have any questions, just ask Neptune - it's always ready to help!

Best regards,
The GalaxyCo.ai Team
    `,
  };
}

/**
 * Generate a follow-up email template for leads
 */
export function getFollowUpEmailTemplate(
  recipientName: string,
  senderName: string,
  companyName: string,
  customMessage?: string
): EmailTemplate {
  const message =
    customMessage ||
    `I wanted to follow up on our recent conversation and see if you had any questions about how ${companyName} can help your business.`;

  return {
    subject: `Following up - ${senderName} from ${companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>Hi ${recipientName},</p>
          
          <p>${message}</p>
          
          <p>I'd love to schedule a quick call to discuss further. Would any of these times work for you?</p>
          
          <p>Looking forward to hearing from you!</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>${senderName}</strong><br>
            <span style="color: #666;">${companyName}</span>
          </p>
        </body>
      </html>
    `,
    text: `
Hi ${recipientName},

${message}

I'd love to schedule a quick call to discuss further. Would any of these times work for you?

Looking forward to hearing from you!

Best regards,
${senderName}
${companyName}
    `,
  };
}

/**
 * Generate a campaign email template
 */
export function getCampaignEmailTemplate(
  subject: string,
  headline: string,
  body: string,
  ctaText?: string,
  ctaUrl?: string
): EmailTemplate {
  return {
    subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
          <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #111; font-size: 24px; margin: 0 0 20px 0; text-align: center;">
              ${headline}
            </h1>
            
            <div style="color: #444; font-size: 16px;">
              ${body.replace(/\n/g, '<br>')}
            </div>
            
            ${
              ctaText && ctaUrl
                ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${ctaUrl}" 
                   style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 35px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block; font-size: 16px;">
                  ${ctaText}
                </a>
              </div>
            `
                : ''
            }
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
            <p>Sent via GalaxyCo.ai</p>
          </div>
        </body>
      </html>
    `,
    text: `
${headline}

${body}

${ctaText && ctaUrl ? `\n${ctaText}: ${ctaUrl}\n` : ''}

---
Sent via GalaxyCo.ai
    `,
  };
}

/**
 * Generate a meeting invitation email template
 */
export function getMeetingInviteTemplate(
  recipientName: string,
  senderName: string,
  meetingTitle: string,
  dateTime: string,
  duration: string,
  location?: string,
  meetingUrl?: string,
  agenda?: string
): EmailTemplate {
  return {
    subject: `Meeting Invite: ${meetingTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 20px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 20px;">📅 Meeting Invitation</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p>Hi ${recipientName},</p>
            
            <p>${senderName} has invited you to a meeting:</p>
            
            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="margin: 0 0 15px 0; color: #111; font-size: 18px;">${meetingTitle}</h2>
              
              <p style="margin: 8px 0;"><strong>📆 When:</strong> ${dateTime}</p>
              <p style="margin: 8px 0;"><strong>⏱️ Duration:</strong> ${duration}</p>
              ${location ? `<p style="margin: 8px 0;"><strong>📍 Location:</strong> ${location}</p>` : ''}
              ${meetingUrl ? `<p style="margin: 8px 0;"><strong>🔗 Join:</strong> <a href="${meetingUrl}" style="color: #6366f1;">${meetingUrl}</a></p>` : ''}
            </div>
            
            ${
              agenda
                ? `
              <div style="margin-top: 20px;">
                <strong>Agenda:</strong>
                <p style="color: #666;">${agenda}</p>
              </div>
            `
                : ''
            }
            
            ${
              meetingUrl
                ? `
              <div style="text-align: center; margin: 25px 0;">
                <a href="${meetingUrl}" 
                   style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; display: inline-block;">
                  Join Meeting
                </a>
              </div>
            `
                : ''
            }
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              See you there!<br>
              ${senderName}
            </p>
          </div>
        </body>
      </html>
    `,
    text: `
Meeting Invitation

Hi ${recipientName},

${senderName} has invited you to a meeting:

${meetingTitle}
📆 When: ${dateTime}
⏱️ Duration: ${duration}
${location ? `📍 Location: ${location}` : ''}
${meetingUrl ? `🔗 Join: ${meetingUrl}` : ''}

${agenda ? `Agenda:\n${agenda}` : ''}

See you there!
${senderName}
    `,
  };
}

/**
 * Generate a notification email template
 */
export function getNotificationTemplate(
  recipientName: string,
  title: string,
  message: string,
  actionText?: string,
  actionUrl?: string
): EmailTemplate {
  return {
    subject: title,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 30px;">
            <h2 style="margin: 0 0 15px 0; color: #111;">${title}</h2>
            
            <p>Hi ${recipientName},</p>
            
            <p>${message}</p>
            
            ${
              actionText && actionUrl
                ? `
              <div style="margin: 25px 0;">
                <a href="${actionUrl}" 
                   style="background: #6366f1; color: white; padding: 10px 25px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                  ${actionText}
                </a>
              </div>
            `
                : ''
            }
          </div>
          
          <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
            Sent from GalaxyCo.ai
          </p>
        </body>
      </html>
    `,
    text: `
${title}

Hi ${recipientName},

${message}

${actionText && actionUrl ? `${actionText}: ${actionUrl}` : ''}

---
Sent from GalaxyCo.ai
    `,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize HTML content (basic XSS prevention)
 */
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
}

/**
 * Convert plain text to simple HTML
 */
export function textToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}
