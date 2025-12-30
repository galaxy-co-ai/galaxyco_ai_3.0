import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiConversations, aiMessages } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const createConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    const rateLimitResult = await rateLimit(`conversations:${user.id}`, 100, 3600);
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
      conversations.map((conv: typeof conversations[0]) => ({
        id: conv.id,
        title: conv.title,
        lastMessage: conv.messages[0]?.content || '',
        messageCount: conv.messageCount,
        lastMessageAt: conv.lastMessageAt,
        isPinned: conv.isPinned,
      }))
    );
  } catch (error) {
    return createErrorResponse(error, 'Get conversations error');
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    const rateLimitResult = await rateLimit(`conversations:${user.id}`, 100, 3600);
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

    // Validate input
    const validationResult = createConversationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const [conversation] = await db
      .insert(aiConversations)
      .values({
        workspaceId,
        userId: user.id,
        title: data.title || 'New Conversation',
      })
      .returning();

    return NextResponse.json(conversation);
  } catch (error) {
    return createErrorResponse(error, 'Create conversation error');
  }
}









