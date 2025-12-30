/**
 * Marketing Channel API - Single Channel Operations
 * 
 * GET /api/marketing/channels/[id] - Get channel details
 * PATCH /api/marketing/channels/[id] - Update channel
 * DELETE /api/marketing/channels/[id] - Delete channel
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { marketingChannels } from '@/db/schema';
import { getCurrentWorkspace } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { eq, and } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

// Validation schema for updating a channel
const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['email', 'social', 'ads', 'content', 'seo', 'affiliate']).optional(),
  status: z.enum(['active', 'paused', 'archived']).optional(),
  description: z.string().max(500).optional().nullable(),
  budget: z.number().min(0).optional().nullable(),
  config: z.object({
    platformId: z.string().optional(),
    credentials: z.record(z.string()).optional(),
    settings: z.record(z.unknown()).optional(),
  }).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/marketing/channels/[id]
 * 
 * Get a single marketing channel by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const { id } = await params;

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

    const [channel] = await db
      .select()
      .from(marketingChannels)
      .where(
        and(
          eq(marketingChannels.id, id),
          eq(marketingChannels.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (!channel) {
      return createErrorResponse(new Error('Channel not found'), 'Get marketing channel error');
    }

    // Calculate performance
    const performance = channel.impressions && channel.impressions > 0
      ? Math.round((channel.clicks || 0) / channel.impressions * 100)
      : 0;

    return NextResponse.json({
      channel: {
        ...channel,
        performance,
        budgetDollars: channel.budget ? channel.budget / 100 : null,
        spentDollars: channel.spent ? channel.spent / 100 : 0,
        revenueDollars: channel.revenue ? channel.revenue / 100 : 0,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Get marketing channel error');
  }
}

/**
 * PATCH /api/marketing/channels/[id]
 * 
 * Update a marketing channel
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const { id } = await params;

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
    const validation = updateChannelSchema.safeParse(body);

    if (!validation.success) {
      return createErrorResponse(new Error(`Invalid: ${validation.error.errors[0].message}`), 'Update marketing channel validation error');
    }

    // Check if channel exists and belongs to workspace
    const [existingChannel] = await db
      .select({ id: marketingChannels.id })
      .from(marketingChannels)
      .where(
        and(
          eq(marketingChannels.id, id),
          eq(marketingChannels.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (!existingChannel) {
      return createErrorResponse(new Error('Channel not found'), 'Update marketing channel error');
    }

    const { name, type, status, description, budget, config } = validation.data;

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description;
    if (budget !== undefined) updateData.budget = budget ? Math.round(budget * 100) : null;
    if (config !== undefined) updateData.config = config;

    const [updatedChannel] = await db
      .update(marketingChannels)
      .set(updateData)
      .where(
        and(
          eq(marketingChannels.id, id),
          eq(marketingChannels.workspaceId, workspaceId)
        )
      )
      .returning();

    logger.info('Marketing channel updated', {
      channelId: id,
      workspaceId,
      changes: Object.keys(updateData).filter(k => k !== 'updatedAt'),
    });

    return NextResponse.json({ channel: updatedChannel });
  } catch (error) {
    return createErrorResponse(error, 'Update marketing channel error');
  }
}

/**
 * DELETE /api/marketing/channels/[id]
 * 
 * Delete a marketing channel
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const { id } = await params;

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

    // Check if channel exists and belongs to workspace
    const [existingChannel] = await db
      .select({ id: marketingChannels.id, name: marketingChannels.name })
      .from(marketingChannels)
      .where(
        and(
          eq(marketingChannels.id, id),
          eq(marketingChannels.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (!existingChannel) {
      return createErrorResponse(new Error('Channel not found'), 'Delete marketing channel error');
    }

    await db
      .delete(marketingChannels)
      .where(
        and(
          eq(marketingChannels.id, id),
          eq(marketingChannels.workspaceId, workspaceId)
        )
      );

    logger.info('Marketing channel deleted', {
      channelId: id,
      channelName: existingChannel.name,
      workspaceId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete marketing channel error');
  }
}

