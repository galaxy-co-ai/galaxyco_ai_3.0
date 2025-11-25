import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiConversations, aiMessages } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    const conversations = await db.query.aiConversations.findMany({
      where: and(
        eq(aiConversations.workspaceId, workspaceId),
        eq(aiConversations.userId, user.id)
      ),
      orderBy: [desc(aiConversations.lastMessageAt)],
      limit: 20,
      with: {
        messages: {
          orderBy: [desc(aiMessages.createdAt)],
          limit: 1,
        },
      },
    });

    return NextResponse.json(
      conversations.map((conv) => ({
        id: conv.id,
        title: conv.title,
        lastMessage: conv.messages[0]?.content || '',
        messageCount: conv.messageCount,
        lastMessageAt: conv.lastMessageAt,
        isPinned: conv.isPinned,
      }))
    );
  } catch (error) {
    console.error('Conversations API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { title } = await request.json();

    const [conversation] = await db
      .insert(aiConversations)
      .values({
        workspaceId,
        userId: user.id,
        title: title || 'New Conversation',
      })
      .returning();

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Create conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}







