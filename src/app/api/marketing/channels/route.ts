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
import { rateLimit } from '@/lib/rate-limit';
import { eq, desc } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

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
    const { workspaceId, userId } = await getCurrentWorkspace();

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
    // Handle case where table doesn't exist yet (migration not run)
    if (error instanceof Error && error.message.includes('relation') && error.message.includes('does not exist')) {
      logger.warn('Marketing channels table does not exist yet');
      return NextResponse.json({
        channels: [],
        total: 0,
      });
    }

    return createErrorResponse(error, 'List marketing channels error');
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

    const rateLimitResult = await rateLimit(`marketing:${user.id}`, 100, 3600);
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
    const validation = createChannelSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(new Error(`Invalid: ${validation.error.errors[0].message}`), 'Create marketing channel validation error');
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
    return createErrorResponse(error, 'Create marketing channel error');
  }
}

