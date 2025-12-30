import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { teamChannels, teamChannelMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

const updateChannelSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'Channel name must be lowercase with hyphens only').optional(),
  description: z.string().max(200).nullable().optional(),
});

// PATCH - Update channel settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { id: channelId } = await params;
    const body = await request.json();

    const validationResult = updateChannelSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid channel data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Get the channel
    const channel = await db.query.teamChannels.findFirst({
      where: and(
        eq(teamChannels.id, channelId),
        eq(teamChannels.workspaceId, workspaceId)
      ),
    });

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Check if user is a member
    const membership = await db.query.teamChannelMembers.findFirst({
      where: and(
        eq(teamChannelMembers.channelId, channelId),
        eq(teamChannelMembers.userId, user.id)
      ),
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this channel' },
        { status: 403 }
      );
    }

    // Only creator or admin can update
    if (channel.createdBy !== user.id && membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only the channel creator or admins can update settings' },
        { status: 403 }
      );
    }

    const { name, description } = validationResult.data;

    // If renaming, check for conflicts
    if (name && name !== channel.name) {
      const existingChannel = await db.query.teamChannels.findFirst({
        where: and(
          eq(teamChannels.workspaceId, workspaceId),
          eq(teamChannels.name, name)
        ),
      });

      if (existingChannel) {
        return NextResponse.json(
          { error: 'A channel with this name already exists' },
          { status: 409 }
        );
      }
    }

    // Update the channel
    const [updatedChannel] = await db
      .update(teamChannels)
      .set({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        updatedAt: new Date(),
      })
      .where(eq(teamChannels.id, channelId))
      .returning();

    logger.info('Team channel updated', { 
      channelId, 
      workspaceId, 
      updatedBy: user.id 
    });

    return NextResponse.json({ channel: updatedChannel });
  } catch (error) {
    return createErrorResponse(error, 'Update team channel error');
  }
}

// DELETE - Delete a channel
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { id: channelId } = await params;

    // Get the channel
    const channel = await db.query.teamChannels.findFirst({
      where: and(
        eq(teamChannels.id, channelId),
        eq(teamChannels.workspaceId, workspaceId)
      ),
    });

    if (!channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      );
    }

    // Check if user is the creator or an admin of the channel
    const membership = await db.query.teamChannelMembers.findFirst({
      where: and(
        eq(teamChannelMembers.channelId, channelId),
        eq(teamChannelMembers.userId, user.id)
      ),
    });

    if (channel.createdBy !== user.id && membership?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only the channel creator or admins can delete this channel' },
        { status: 403 }
      );
    }

    // Prevent deletion of default channels
    const defaultChannels = ['general', 'random', 'announcements'];
    if (defaultChannels.includes(channel.name)) {
      return NextResponse.json(
        { error: 'Cannot delete default channels' },
        { status: 400 }
      );
    }

    // Delete the channel (cascade will handle members and messages)
    await db
      .delete(teamChannels)
      .where(eq(teamChannels.id, channelId));

    logger.info('Team channel deleted', { 
      channelId, 
      workspaceId, 
      deletedBy: user.id 
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete team channel error');
  }
}
