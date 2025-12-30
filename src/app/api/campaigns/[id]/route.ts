import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { campaigns } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single campaign
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const { id: campaignId } = await params;

    const rateLimitResult = await rateLimit(`marketing:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

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

    const content = campaign.content as Record<string, unknown>;

    return NextResponse.json({
      id: campaign.id,
      name: campaign.name,
      type: campaign.type,
      status: campaign.status,
      subject: content?.subject || '',
      body: content?.body || '',
      targetAudience: campaign.tags?.[0] || 'all_leads',
      sentCount: campaign.sentCount,
      openCount: campaign.openCount,
      clickCount: campaign.clickCount,
      scheduledFor: campaign.scheduledFor,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    });
  } catch (error) {
    return createErrorResponse(error, 'Campaign API error');
  }
}

// PATCH - Update campaign
const updateCampaignSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['email', 'drip', 'newsletter', 'promotion']).optional(),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'sent', 'archived']).optional(),
  subject: z.string().min(1).max(200).optional(),
  body: z.string().min(1).optional(),
  targetAudience: z.enum(['all_leads', 'new_leads', 'qualified_leads', 'all_contacts', 'custom']).optional(),
  scheduledFor: z.string().datetime().nullable().optional(),
});

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const { id: campaignId } = await params;

    const rateLimitResult = await rateLimit(`marketing:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

    const body = await request.json();
    const validationResult = updateCampaignSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Check campaign exists
    const existing = await db.query.campaigns.findFirst({
      where: and(
        eq(campaigns.id, campaignId),
        eq(campaigns.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Don't allow editing completed campaigns (unless archiving)
    if (existing.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot edit a completed campaign' },
        { status: 400 }
      );
    }

    const { name, type, status, subject, body: emailBody, targetAudience, scheduledFor } = validationResult.data;

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (scheduledFor !== undefined) updateData.scheduledFor = scheduledFor ? new Date(scheduledFor) : null;

    // Update content if subject, body, or targetAudience changed
    if (subject !== undefined || emailBody !== undefined || targetAudience !== undefined) {
      const existingContent = existing.content as Record<string, unknown> || {};
      updateData.content = {
        ...existingContent,
        ...(subject !== undefined && { subject }),
        ...(emailBody !== undefined && { body: emailBody }),
        ...(targetAudience !== undefined && { targetAudience }),
      };
    }

    const [updated] = await db
      .update(campaigns)
      .set(updateData)
      .where(eq(campaigns.id, campaignId))
      .returning();

    logger.info('Campaign updated', { campaignId, workspaceId });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      type: updated.type,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    return createErrorResponse(error, 'Campaign update error');
  }
}

// DELETE - Delete campaign
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const { id: campaignId } = await params;

    const rateLimitResult = await rateLimit(`marketing:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

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

    await db
      .delete(campaigns)
      .where(eq(campaigns.id, campaignId));

    logger.info('Campaign deleted', { campaignId, workspaceId });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Campaign delete error');
  }
}

