import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { workspaceMembers, neptuneConversations, neptuneMessages, neptuneActivityLog } from '@/db/schema';
import { eq, desc, count, and, gte, sql } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/neptune-hq/team
 * Returns team members, stats, and recent activity from real database
 */
export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Get workspace members with user details
    const membersList = await db.query.workspaceMembers.findMany({
      where: and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.isActive, true)
      ),
      with: {
        user: true,
      },
    });

    // Get Neptune conversation/message stats per user for this week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get conversation counts per user
    const userConversationStats = await db
      .select({
        userId: neptuneConversations.userId,
        conversationCount: count(),
      })
      .from(neptuneConversations)
      .where(
        and(
          eq(neptuneConversations.workspaceId, workspaceId),
          gte(neptuneConversations.createdAt, oneWeekAgo)
        )
      )
      .groupBy(neptuneConversations.userId);

    // Get message counts per user
    const userMessageStats = await db
      .select({
        userId: neptuneMessages.userId,
        messageCount: count(),
      })
      .from(neptuneMessages)
      .where(
        and(
          eq(neptuneMessages.workspaceId, workspaceId),
          gte(neptuneMessages.createdAt, oneWeekAgo)
        )
      )
      .groupBy(neptuneMessages.userId);

    const convStatsByUser = new Map(userConversationStats.map(s => [s.userId, Number(s.conversationCount)]));
    const msgStatsByUser = new Map(userMessageStats.map(s => [s.userId, Number(s.messageCount)]));

    // Determine user online status based on last login
    const getStatus = (lastLogin: Date | null): 'online' | 'away' | 'offline' => {
      if (!lastLogin) return 'offline';
      const minutesAgo = (Date.now() - lastLogin.getTime()) / (1000 * 60);
      if (minutesAgo < 15) return 'online';
      if (minutesAgo < 60) return 'away';
      return 'offline';
    };

    // Format members
    const members = membersList.map(member => {
      const user = member.user;
      const name = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user?.email?.split('@')[0] || 'Unknown';
      
      return {
        id: member.id,
        name,
        email: user?.email || '',
        avatar: user?.avatarUrl || null,
        role: member.role,
        status: getStatus(user?.lastLoginAt || null),
        lastActive: user?.lastLoginAt?.toISOString() || member.joinedAt.toISOString(),
        conversationsThisWeek: convStatsByUser.get(user?.id || '') || 0,
        messagesThisWeek: msgStatsByUser.get(user?.id || '') || 0,
      };
    });

    // Calculate stats
    const activeToday = members.filter(m => m.status === 'online' || m.status === 'away').length;
    
    // Get total conversations for workspace
    const totalConvs = await db
      .select({ count: count() })
      .from(neptuneConversations)
      .where(eq(neptuneConversations.workspaceId, workspaceId));

    // Get average response time from messages
    const avgResponseTime = await db
      .select({ avg: sql<number>`AVG(${neptuneMessages.responseTime})` })
      .from(neptuneMessages)
      .where(eq(neptuneMessages.workspaceId, workspaceId));

    const stats = {
      totalMembers: members.length,
      activeToday,
      totalConversations: Number(totalConvs[0]?.count || 0),
      avgResponseTime: Math.round((Number(avgResponseTime[0]?.avg || 0) / 1000) * 10) / 10, // Convert ms to seconds
    };

    // Get recent activity from neptune_activity_log
    const activityLogs = await db.query.neptuneActivityLog.findMany({
      where: eq(neptuneActivityLog.workspaceId, workspaceId),
      orderBy: [desc(neptuneActivityLog.createdAt)],
      limit: 10,
      with: {
        user: true,
      },
    });

    const recentActivity = activityLogs.map(log => {
      const userName = log.user?.firstName && log.user?.lastName
        ? `${log.user.firstName} ${log.user.lastName}`
        : log.user?.email?.split('@')[0] || 'Unknown';
      
      return {
        id: log.id,
        user: userName,
        action: log.description,
        timestamp: log.createdAt.toISOString(),
      };
    });

    return NextResponse.json({ stats, members, recentActivity });
  } catch (error) {
    return createErrorResponse(error, 'Team data error');
  }
}
