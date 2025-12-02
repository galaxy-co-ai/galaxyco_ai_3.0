import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { teamChannels, teamMessages, teamChannelMembers, users } from '@/db/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

const attachmentSchema = z.object({
  type: z.enum(['file', 'image', 'link']),
  url: z.string().url(),
  name: z.string().optional(),
  size: z.number().optional(),
  mimeType: z.string().optional(),
  previewUrl: z.string().url().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

const sendMessageSchema = z.object({
  content: z.string().max(4000),
  replyToId: z.string().uuid().optional(),
  attachments: z.array(attachmentSchema).optional(),
});

// GET - Get messages for a channel
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { id: channelId } = await params;

    // Verify channel exists and user has access
    const channel = await db.query.teamChannels.findFirst({
      where: and(
        eq(teamChannels.id, channelId),
        eq(teamChannels.workspaceId, workspaceId)
      ),
    });

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Get messages with sender info
    const messages = await db.query.teamMessages.findMany({
      where: and(
        eq(teamMessages.channelId, channelId),
        eq(teamMessages.workspaceId, workspaceId),
        eq(teamMessages.isDeleted, false)
      ),
      orderBy: [asc(teamMessages.createdAt)],
      limit: 100, // Paginate in production
      with: {
        sender: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update user's last read timestamp
    await db
      .update(teamChannelMembers)
      .set({ lastReadAt: new Date() })
      .where(
        and(
          eq(teamChannelMembers.channelId, channelId),
          eq(teamChannelMembers.userId, user.id)
        )
      );

    return NextResponse.json({
      messages: messages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        createdAt: msg.createdAt,
        isEdited: msg.isEdited,
        reactions: msg.reactions,
        sender: msg.sender,
        attachments: msg.attachments,
      })),
    });
  } catch (error) {
    return createErrorResponse(error, 'Get team messages error');
  }
}

// POST - Send a message to a channel
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { id: channelId } = await params;
    const body = await request.json();

    const validationResult = sendMessageSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid message', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { content, replyToId, attachments } = validationResult.data;

    // Require either content or attachments
    if (!content?.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { error: 'Message must have content or attachments' },
        { status: 400 }
      );
    }

    // Verify channel exists and user has access
    const channel = await db.query.teamChannels.findFirst({
      where: and(
        eq(teamChannels.id, channelId),
        eq(teamChannels.workspaceId, workspaceId)
      ),
    });

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Ensure user is a member of the channel (or auto-join for public channels)
    let membership = await db.query.teamChannelMembers.findFirst({
      where: and(
        eq(teamChannelMembers.channelId, channelId),
        eq(teamChannelMembers.userId, user.id)
      ),
    });

    if (!membership && !channel.isPrivate) {
      // Auto-join public channels
      [membership] = await db
        .insert(teamChannelMembers)
        .values({
          workspaceId,
          channelId,
          userId: user.id,
          role: 'member',
        })
        .returning();
    }

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this channel' },
        { status: 403 }
      );
    }

    // Create message
    const [newMessage] = await db
      .insert(teamMessages)
      .values({
        workspaceId,
        channelId,
        senderId: user.id,
        content: content || '',
        replyToId,
        attachments: attachments || [],
      })
      .returning();

    // Update channel stats
    await db
      .update(teamChannels)
      .set({
        messageCount: (channel.messageCount || 0) + 1,
        lastMessageAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(teamChannels.id, channelId));

    // Fetch the full message with sender info
    const messageWithSender = await db.query.teamMessages.findFirst({
      where: eq(teamMessages.id, newMessage.id),
      with: {
        sender: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    logger.info('Team message sent', { channelId, messageId: newMessage.id });

    return NextResponse.json({
      message: {
        id: messageWithSender?.id,
        content: messageWithSender?.content,
        createdAt: messageWithSender?.createdAt,
        isEdited: messageWithSender?.isEdited,
        reactions: messageWithSender?.reactions,
        sender: messageWithSender?.sender,
        attachments: messageWithSender?.attachments,
      },
    }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Send team message error');
  }
}
