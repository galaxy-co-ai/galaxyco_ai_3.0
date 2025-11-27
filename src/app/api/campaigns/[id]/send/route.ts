import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { campaigns, prospects, contacts } from '@/db/schema';
import { eq, and, or, ne } from 'drizzle-orm';
import { 
  sendBulkEmails, 
  isEmailConfigured, 
  getCampaignEmailTemplate,
  type EmailOptions 
} from '@/lib/email';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const { id: campaignId } = await params;

    // Rate limit campaign sends
    const rateLimitResult = await rateLimit(
      `campaign-send:${workspaceId}`,
      5, // 5 campaign sends
      3600 // per hour
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Campaign send rate limit exceeded. Please wait before sending more campaigns.' },
        { status: 429 }
      );
    }

    // Check if email service is configured
    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: 'Email service not configured. Please add RESEND_API_KEY to your environment.' },
        { status: 503 }
      );
    }

    // Get the campaign
    const campaign = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.id, campaignId),
        eq(campaigns.workspaceId, workspaceId)
      ),
    });

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    if (campaign.status === 'completed') {
      return NextResponse.json(
        { error: 'Campaign has already been sent' },
        { status: 400 }
      );
    }

    if (campaign.status === 'active') {
      return NextResponse.json(
        { error: 'Campaign is currently being sent' },
        { status: 400 }
      );
    }

    // Update status to active (sending)
    await db
      .update(campaigns)
      .set({ status: 'active', updatedAt: new Date() })
      .where(eq(campaigns.id, campaignId));

    // Get campaign content
    const content = campaign.content as {
      subject?: string;
      body?: string;
    };

    if (!content.subject || !content.body) {
      await db
        .update(campaigns)
        .set({ status: 'draft', updatedAt: new Date() })
        .where(eq(campaigns.id, campaignId));

      return NextResponse.json(
        { error: 'Campaign is missing subject or body content' },
        { status: 400 }
      );
    }

    // Get recipients based on target audience (stored in tags)
    const recipients: Array<{ email: string; name: string }> = [];
    const targetAudience = campaign.tags?.[0] || 'all_leads';

    if (targetAudience === 'all_leads' || targetAudience === 'new_leads' || targetAudience === 'qualified_leads') {
      // Get prospects based on audience type
      let prospectConditions = [
        eq(prospects.workspaceId, workspaceId),
        ne(prospects.email, ''), // Has email
      ];

      if (targetAudience === 'new_leads') {
        prospectConditions.push(eq(prospects.stage, 'new'));
      } else if (targetAudience === 'qualified_leads') {
        prospectConditions.push(
          or(
            eq(prospects.stage, 'qualified'),
            eq(prospects.stage, 'proposal'),
            eq(prospects.stage, 'negotiation')
          )!
        );
      }

      const prospectList = await db.query.prospects.findMany({
        where: and(...prospectConditions),
        columns: {
          email: true,
          name: true,
        },
      });

      for (const p of prospectList) {
        if (p.email) {
          recipients.push({ email: p.email, name: p.name });
        }
      }
    } else if (targetAudience === 'all_contacts') {
      // Get all contacts
      const contactList = await db.query.contacts.findMany({
        where: eq(contacts.workspaceId, workspaceId),
        columns: {
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      for (const c of contactList) {
        if (c.email) {
          const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || 'there';
          recipients.push({ email: c.email, name });
        }
      }
    }

    if (recipients.length === 0) {
      await db
        .update(campaigns)
        .set({ status: 'draft', updatedAt: new Date() })
        .where(eq(campaigns.id, campaignId));

      return NextResponse.json(
        { error: 'No recipients found for this campaign target audience' },
        { status: 400 }
      );
    }

    // Limit recipients for safety (configurable in production)
    const maxRecipients = 1000;
    const limitedRecipients = recipients.slice(0, maxRecipients);

    // Build email template
    const template = getCampaignEmailTemplate(
      content.subject,
      content.subject, // Use subject as headline
      content.body
    );

    // Build email list
    const emails: EmailOptions[] = limitedRecipients.map((recipient) => ({
      to: recipient.email,
      subject: template.subject,
      html: template.html.replace(/Hi there/g, `Hi ${recipient.name}`),
      text: template.text?.replace(/Hi there/g, `Hi ${recipient.name}`),
      tags: [
        { name: 'campaign_id', value: campaignId },
        { name: 'campaign_name', value: campaign.name },
        { name: 'workspace', value: workspaceId },
      ],
    }));

    logger.info('Starting campaign send', {
      campaignId,
      campaignName: campaign.name,
      recipientCount: emails.length,
      workspaceId,
    });

    // Send emails in bulk
    const result = await sendBulkEmails(emails, 10, 200);

    // Update campaign stats
    await db
      .update(campaigns)
      .set({
        status: 'completed',
        sentCount: result.sent,
        updatedAt: new Date(),
      })
      .where(eq(campaigns.id, campaignId));

    logger.info('Campaign send completed', {
      campaignId,
      sent: result.sent,
      failed: result.failed,
      workspaceId,
    });

    return NextResponse.json({
      success: true,
      message: `Campaign sent to ${result.sent} recipients`,
      stats: {
        sent: result.sent,
        failed: result.failed,
        total: emails.length,
      },
    });
  } catch (error) {
    logger.error('Campaign send error', error);
    return createErrorResponse(error, 'Campaign send error');
  }
}

