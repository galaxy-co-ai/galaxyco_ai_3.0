import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { conversations, teamChannelMembers } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';
import { auth } from '@clerk/nextjs/server';

// GET - Get total unread count across all conversations and team channels
export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get unread conversations count
    const [conversationsUnread] = await db
      .select({ count: count() })
      .from(conversations)
      .where(
        and(
          eq(conversations.workspaceId, workspaceId),
          eq(conversations.isUnread, true),
          eq(conversations.status, 'active')
        )
      );

    // Get unread team channels count (channels with unread messages)
    // This is a simplified version - you may want to track actual unread counts per user
    const teamChannelsWithUnread = await db.query.teamChannelMembers.findMany({
      where: and(
        eq(teamChannelMembers.workspaceId, workspaceId),
        eq(teamChannelMembers.userId, userId)
      ),
      with: {
        channel: true,
      },
    });

    // Count channels where user hasn't read the latest message
    const teamUnreadCount = teamChannelsWithUnread.filter(
      (member) => member.lastReadAt && member.channel.lastMessageAt &&
      new Date(member.lastReadAt) < new Date(member.channel.lastMessageAt)
    ).length;

    const totalUnread = (conversationsUnread?.count || 0) + teamUnreadCount;

    return NextResponse.json({ 
      totalUnread,
      conversationsUnread: conversationsUnread?.count || 0,
      teamUnreadCount,
    });
  } catch (error) {
    return createErrorResponse(error, 'Get conversations unread count error');
  }
}
