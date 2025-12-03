import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { teamChannels, teamChannelMembers, teamMessages, users } from '@/db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

const createChannelSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'Channel name must be lowercase with hyphens only'),
  description: z.string().max(200).optional(),
  type: z.enum(['general', 'group', 'announcement']).default('general'),
  isPrivate: z.boolean().default(false),
});

// GET - List all channels for the workspace
export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    // Get all channels with member counts and last message
    const channels = await db.query.teamChannels.findMany({
      where: eq(teamChannels.workspaceId, workspaceId),
      orderBy: [desc(teamChannels.lastMessageAt)],
      with: {
        members: {
          with: {
            user: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // TODO: Calculate real unread counts from lastReadAt when needed
    const channelsWithUnread = channels.map((channel) => {
      return {
        id: channel.id,
        name: channel.name,
        description: channel.description,
        type: channel.type,
        isPrivate: channel.isPrivate,
        messageCount: channel.messageCount,
        lastMessageAt: channel.lastMessageAt,
        members: channel.members,
      };
    });

    return NextResponse.json({ channels: channelsWithUnread });
  } catch (error) {
    return createErrorResponse(error, 'Get team channels error');
  }
}

// POST - Create a new channel
export async function POST(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const body = await request.json();

    const validationResult = createChannelSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid channel data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { name, description, type, isPrivate } = validationResult.data;

    // Check if channel name already exists
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

    // Create channel
    const [newChannel] = await db
      .insert(teamChannels)
      .values({
        workspaceId,
        name,
        description,
        type,
        isPrivate,
        createdBy: user.id,
      })
      .returning();

    // Add creator as admin member
    await db.insert(teamChannelMembers).values({
      workspaceId,
      channelId: newChannel.id,
      userId: user.id,
      role: 'admin',
    });

    // If it's a general/public channel, add all workspace members
    if (!isPrivate && type === 'general') {
      // Get all workspace users (simplified - just add creator for now)
      // In production, you'd query workspaceMembers and add all users
    }

    logger.info('Team channel created', { channelId: newChannel.id, workspaceId });

    return NextResponse.json({ channel: newChannel }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Create team channel error');
  }
}
