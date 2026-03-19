import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { conversations, teamChannelMembers } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

// GET - Get total unread count across all conversations and team channels
export async function GET() {
  try {
    // Use database userId (UUID), not Clerk userId (string)
    const { workspaceId, userId } = await getCurrentWorkspace();

    const rateLimitResult = await rateLimit(`conversations:${userId}`, 100, 3600);
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

    // Get unread team channels count
    let teamUnreadCount = 0;
    try {
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
      teamUnreadCount = teamChannelsWithUnread.filter(
        (member) => member.channel && member.lastReadAt && member.channel.lastMessageAt &&
        new Date(member.lastReadAt) < new Date(member.channel.lastMessageAt)
      ).length;
    } catch {
      // Team channels query can fail if user has no memberships — not critical
    }

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
