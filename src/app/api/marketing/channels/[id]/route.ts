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
import { eq, and } from 'drizzle-orm';

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
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

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
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
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
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.error('Failed to get marketing channel', { error });
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
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
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

    const body = await request.json();
    const validation = updateChannelSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
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
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.error('Failed to update marketing channel', { error });
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
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
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await params;

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
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
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
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.error('Failed to delete marketing channel', { error });
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

