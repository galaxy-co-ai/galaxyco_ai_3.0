import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiConversations } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const conversations = await db.query.aiConversations.findMany({
      where: and(
        eq(aiConversations.workspaceId, workspaceId),
        eq(aiConversations.userId, user.id)
      ),
      orderBy: [desc(aiConversations.lastMessageAt)],
      limit: 50,
    });

    return NextResponse.json({
      conversations: conversations.map((conv) => ({
        id: conv.id,
        title: conv.title || 'Untitled',
        lastMessageAt: conv.lastMessageAt,
        messageCount: conv.messageCount,
        createdAt: conv.createdAt,
      })),
    });
  } catch (error) {
    logger.error('Get conversations error', error);
    return createErrorResponse(error, 'Get conversations error');
  }
}

export async function DELETE(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (!user || !user.id) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID required' },
        { status: 400 }
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

    await db
      .delete(aiConversations)
      .where(eq(aiConversations.id, conversationId));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Delete conversation error', error);
    return createErrorResponse(error, 'Delete conversation error');
  }
}

