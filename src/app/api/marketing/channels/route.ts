/**
 * Marketing Channels API
 * 
 * GET /api/marketing/channels - List all channels for workspace
 * POST /api/marketing/channels - Create a new channel
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { marketingChannels } from '@/db/schema';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { eq, desc } from 'drizzle-orm';

// Validation schema for creating a channel
const createChannelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(['email', 'social', 'ads', 'content', 'seo', 'affiliate']),
  status: z.enum(['active', 'paused', 'archived']).default('active'),
  description: z.string().max(500).optional(),
  budget: z.number().min(0).optional(),
  config: z.object({
    platformId: z.string().optional(),
    credentials: z.record(z.string()).optional(),
    settings: z.record(z.unknown()).optional(),
  }).optional(),
});

/**
 * GET /api/marketing/channels
 * 
 * List all marketing channels for the current workspace
 */
export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const channels = await db
      .select({
        id: marketingChannels.id,
        name: marketingChannels.name,
        type: marketingChannels.type,
        status: marketingChannels.status,
        description: marketingChannels.description,
        budget: marketingChannels.budget,
        spent: marketingChannels.spent,
        impressions: marketingChannels.impressions,
        clicks: marketingChannels.clicks,
        conversions: marketingChannels.conversions,
        revenue: marketingChannels.revenue,
        createdAt: marketingChannels.createdAt,
        updatedAt: marketingChannels.updatedAt,
      })
      .from(marketingChannels)
      .where(eq(marketingChannels.workspaceId, workspaceId))
      .orderBy(desc(marketingChannels.createdAt));

    // Calculate performance for each channel
    const channelsWithPerformance = channels.map(channel => {
      // Performance = (clicks / impressions) * 100, or 0 if no impressions
      const performance = channel.impressions && channel.impressions > 0
        ? Math.round((channel.clicks || 0) / channel.impressions * 100)
        : 0;

      return {
        ...channel,
        performance,
        // Convert cents to dollars for budget/spent/revenue
        budgetDollars: channel.budget ? channel.budget / 100 : null,
        spentDollars: channel.spent ? channel.spent / 100 : 0,
        revenueDollars: channel.revenue ? channel.revenue / 100 : 0,
      };
    });

    return NextResponse.json({
      channels: channelsWithPerformance,
      total: channels.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle case where table doesn't exist yet (migration not run)
    if (error instanceof Error && error.message.includes('relation') && error.message.includes('does not exist')) {
      logger.warn('Marketing channels table does not exist yet');
      return NextResponse.json({
        channels: [],
        total: 0,
      });
    }

    logger.error('Failed to list marketing channels', { error });
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/marketing/channels
 * 
 * Create a new marketing channel
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    const body = await request.json();
    const validation = createChannelSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, type, status, description, budget, config } = validation.data;

    const [channel] = await db
      .insert(marketingChannels)
      .values({
        workspaceId,
        name,
        type,
        status,
        description,
        budget: budget ? Math.round(budget * 100) : null, // Convert dollars to cents
        config: config || {},
        createdBy: user.id,
      })
      .returning();

    logger.info('Marketing channel created', {
      channelId: channel.id,
      workspaceId,
      type,
    });

    return NextResponse.json({ channel }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.error('Failed to create marketing channel', { error });
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

