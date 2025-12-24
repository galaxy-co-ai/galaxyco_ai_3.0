import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { neptuneConversations } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

export const dynamic = 'force-dynamic';

// Color palette for user avatars
const USER_COLORS = ['#4ADE80', '#38BDF8', '#FB7185', '#FBBF24', '#A78BFA', '#F472B6'];

/**
 * GET /api/neptune-hq/active-conversations
 * Returns recently active conversations with user info
 */
export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Get conversations active in the last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const conversations = await db.query.neptuneConversations.findMany({
      where: eq(neptuneConversations.workspaceId, workspaceId),
      orderBy: [desc(neptuneConversations.lastActiveAt)],
      limit: 10,
      with: {
        user: true,
      },
    });

    // Filter to recently active and format response
    const activeConversations = conversations
      .filter(c => c.lastActiveAt >= thirtyMinutesAgo)
      .map((conv, index) => {
        const userName = conv.user?.firstName && conv.user?.lastName
          ? `${conv.user.firstName} ${conv.user.lastName}`
          : conv.user?.email?.split('@')[0] || 'Unknown User';

        return {
          id: conv.id,
          title: conv.title || conv.summary || 'Untitled Conversation',
          lastActiveAt: conv.lastActiveAt.toISOString(),
          topic: conv.topic,
          messageCount: conv.messageCount,
          activeUsers: [
            {
              id: conv.userId,
              name: userName,
              avatar: conv.user?.avatarUrl || null,
              color: USER_COLORS[index % USER_COLORS.length],
            },
          ],
        };
      });

    // Count total active users (unique)
    const activeUserIds = new Set(activeConversations.flatMap(c => c.activeUsers.map(u => u.id)));

    return NextResponse.json({
      conversations: activeConversations,
      activeUsers: activeUserIds.size,
    });
  } catch (error) {
    return createErrorResponse(error, 'Active conversations error');
  }
}
