import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { campaigns, prospects, contacts } from '@/db/schema';
import { eq, and, desc, or, ne } from 'drizzle-orm';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger';

// GET - List campaigns
export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const campaignList = await db.query.campaigns.findMany({
      where: eq(campaigns.workspaceId, workspaceId),
      orderBy: [desc(campaigns.createdAt)],
      limit: 50,
    });

    return NextResponse.json({
      campaigns: campaignList.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        subject: (c.content as Record<string, unknown>)?.subject || '',
        sentCount: c.sentCount,
        openCount: c.openCount,
        clickCount: c.clickCount,
        openRate: c.sentCount ? ((c.openCount || 0) / c.sentCount * 100).toFixed(1) : '0',
        clickRate: c.openCount ? ((c.clickCount || 0) / c.openCount * 100).toFixed(1) : '0',
        scheduledFor: c.scheduledFor,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    });
  } catch (error) {
    return createErrorResponse(error, 'Campaigns API error');
  }
}

// POST - Create campaign
const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(100),
  type: z.enum(['email', 'drip', 'newsletter', 'promotion']).default('email'),
  subject: z.string().min(1, 'Subject is required').max(200),
  body: z.string().min(1, 'Email body is required'),
  targetAudience: z.enum(['all_leads', 'new_leads', 'qualified_leads', 'all_contacts', 'custom']).default('all_leads'),
  scheduledFor: z.string().datetime().optional(),
});

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    const body = await request.json();
    const validationResult = createCampaignSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, type, subject, body: emailBody, targetAudience, scheduledFor } = validationResult.data;

    const [campaign] = await db
      .insert(campaigns)
      .values({
        workspaceId,
        name,
        type,
        status: 'draft',
        content: {
          subject,
          body: emailBody,
        },
        tags: [targetAudience], // Store target audience in tags
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        createdBy: user.id,
      })
      .returning();

    logger.info('Campaign created', { campaignId: campaign.id, workspaceId });

    return NextResponse.json({
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
    });
  } catch (error) {
    return createErrorResponse(error, 'Campaign creation error');
  }
}

