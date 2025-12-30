import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiConversations, aiMessages } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId: clerkUserId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { id: conversationId } = await params;

    // Rate limiting
    const rateLimitResult = await rateLimit(`conversation-detail:${clerkUserId}`, 100, 3600);
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

    // Get conversation with all messages
    const conversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.id, conversationId),
        eq(aiConversations.workspaceId, workspaceId),
        eq(aiConversations.userId, user.id)
      ),
      with: {
        messages: {
          orderBy: [asc(aiMessages.createdAt)],
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      lastMessageAt: conversation.lastMessageAt,
      messageCount: conversation.messageCount,
      isPinned: conversation.isPinned,
      messages: conversation.messages.map((msg: typeof conversation.messages[0]) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      })),
    });
  } catch (error) {
    return createErrorResponse(error, 'Get conversation error');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId: clerkUserId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { id: conversationId } = await params;

    // Rate limiting
    const rateLimitResult = await rateLimit(`conversation-delete:${clerkUserId}`, 100, 3600);
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

    // Verify ownership
    const conversation = await db.query.aiConversations.findFirst({
      where: and(
        eq(aiConversations.id, conversationId),
        eq(aiConversations.workspaceId, workspaceId),
        eq(aiConversations.userId, user.id)
      ),
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Delete messages first (cascade)
    await db
      .delete(aiMessages)
      .where(eq(aiMessages.conversationId, conversationId));

    // Delete conversation
    await db
      .delete(aiConversations)
      .where(eq(aiConversations.id, conversationId));

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete conversation error');
  }
}


