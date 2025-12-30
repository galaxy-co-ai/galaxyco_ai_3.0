import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import {
  conversations,
  conversationMessages,
  conversationParticipants,
} from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

const updateConversationSchema = z.object({
  status: z.enum(['active', 'archived', 'closed', 'spam']).optional(),
  isStarred: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  isUnread: z.boolean().optional(),
  assignedTo: z.string().nullable().optional(),
  labels: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  subject: z.string().optional(),
});

/**
 * GET /api/communications/[id]
 * Get a single conversation with messages and participants
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id: conversationId } = await params;

    // Fetch conversation
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.workspaceId, workspaceId)
      ),
    });

    if (!conversation) {
      return createErrorResponse(new Error('Conversation not found'), 'Get conversation');
    }

    // Fetch messages and participants
    const [messages, participants] = await Promise.all([
      db.query.conversationMessages.findMany({
        where: and(
          eq(conversationMessages.conversationId, conversationId),
          eq(conversationMessages.workspaceId, workspaceId)
        ),
        orderBy: [desc(conversationMessages.createdAt)],
        limit: 100,
      }),
      db.query.conversationParticipants.findMany({
        where: and(
          eq(conversationParticipants.conversationId, conversationId),
          eq(conversationParticipants.workspaceId, workspaceId)
        ),
      }),
    ]);

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        channel: conversation.channel,
        status: conversation.status,
        subject: conversation.subject || '',
        snippet: conversation.snippet || '',
        isUnread: conversation.isUnread,
        isStarred: conversation.isStarred,
        isPinned: conversation.isPinned,
        unreadCount: conversation.unreadCount || 0,
        messageCount: conversation.messageCount || 0,
        lastMessageAt: conversation.lastMessageAt,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        assignedTo: conversation.assignedTo,
        labels: conversation.labels || [],
        tags: conversation.tags || [],
        externalId: conversation.externalId,
      },
      messages: messages.map((msg) => ({
        id: msg.id,
        body: msg.body,
        subject: msg.subject,
        htmlBody: msg.htmlBody,
        direction: msg.direction,
        senderName: msg.senderName || 'Unknown',
        senderEmail: msg.senderEmail,
        senderId: msg.senderId,
        createdAt: msg.createdAt,
        isRead: msg.isRead,
        isFromCustomer: msg.isFromCustomer,
        attachments: msg.attachments || [],
        callDuration: msg.callDuration,
        callRecordingUrl: msg.callRecordingUrl,
        callTranscription: msg.callTranscription,
        replyToId: msg.replyToId,
      })),
      participants: participants.map((p) => ({
        id: p.id,
        contactId: p.contactId,
        prospectId: p.prospectId,
        customerId: p.customerId,
        userId: p.userId,
        name: p.name || '',
        email: p.email || '',
        phone: p.phone || '',
        role: p.role || '',
      })),
    });
  } catch (error) {
    return createErrorResponse(error, 'Get conversation');
  }
}

/**
 * PATCH /api/communications/[id]
 * Update a conversation (star, archive, assign, mark read, etc.)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await currentUser();
    const { id: conversationId } = await params;

    if (!user) {
      return createErrorResponse(new Error('Unauthorized'), 'Update conversation');
    }

    // Verify conversation exists and belongs to workspace
    const existing = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return createErrorResponse(new Error('Conversation not found'), 'Update conversation');
    }

    const body = await request.json();
    const validated = updateConversationSchema.parse(body);

    // Build update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (validated.status !== undefined) {
      updateData.status = validated.status;
    }
    if (validated.isStarred !== undefined) {
      updateData.isStarred = validated.isStarred;
    }
    if (validated.isPinned !== undefined) {
      updateData.isPinned = validated.isPinned;
    }
    if (validated.isUnread !== undefined) {
      updateData.isUnread = validated.isUnread;
      if (!validated.isUnread) {
        updateData.unreadCount = 0;
      }
    }
    if (validated.assignedTo !== undefined) {
      updateData.assignedTo = validated.assignedTo;
    }
    if (validated.labels !== undefined) {
      updateData.labels = validated.labels;
    }
    if (validated.tags !== undefined) {
      updateData.tags = validated.tags;
    }
    if (validated.subject !== undefined) {
      updateData.subject = validated.subject;
    }

    // Update conversation
    const [updated] = await db
      .update(conversations)
      .set(updateData)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.workspaceId, workspaceId)
        )
      )
      .returning();

    return NextResponse.json({
      conversation: {
        id: updated.id,
        channel: updated.channel,
        status: updated.status,
        subject: updated.subject,
        isStarred: updated.isStarred,
        isPinned: updated.isPinned,
        isUnread: updated.isUnread,
        assignedTo: updated.assignedTo,
        labels: updated.labels,
        tags: updated.tags,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(new Error('Validation error'), 'Update conversation');
    }
    return createErrorResponse(error, 'Update conversation');
  }
}

/**
 * DELETE /api/communications/[id]
 * Delete (archive) a conversation
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await currentUser();
    const { id: conversationId } = await params;

    if (!user) {
      return createErrorResponse(new Error('Unauthorized'), 'Delete conversation');
    }

    // Verify conversation exists and belongs to workspace
    const existing = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        eq(conversations.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return createErrorResponse(new Error('Conversation not found'), 'Delete conversation');
    }

    // Soft delete by archiving (or hard delete based on preference)
    // Using soft delete for safety
    const [archived] = await db
      .update(conversations)
      .set({
        status: 'archived',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.workspaceId, workspaceId)
        )
      )
      .returning();

    return NextResponse.json({
      success: true,
      conversation: {
        id: archived.id,
        status: archived.status,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Delete conversation');
  }
}


