import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const stats = {
      totalMembers: 6,
      activeToday: 4,
      totalConversations: 342,
      avgResponseTime: 2.4,
    };

    const members = [
      {
        id: '1',
        name: 'Sarah Chen',
        email: 'sarah@company.com',
        role: 'owner' as const,
        status: 'online' as const,
        lastActive: new Date().toISOString(),
        conversationsThisWeek: 45,
        messagesThisWeek: 234,
      },
      {
        id: '2',
        name: 'Michael Roberts',
        email: 'michael@company.com',
        role: 'admin' as const,
        status: 'online' as const,
        lastActive: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        conversationsThisWeek: 38,
        messagesThisWeek: 189,
      },
      {
        id: '3',
        name: 'Emily Johnson',
        email: 'emily@company.com',
        role: 'member' as const,
        status: 'away' as const,
        lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        conversationsThisWeek: 22,
        messagesThisWeek: 98,
      },
      {
        id: '4',
        name: 'David Kim',
        email: 'david@company.com',
        role: 'member' as const,
        status: 'online' as const,
        lastActive: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        conversationsThisWeek: 31,
        messagesThisWeek: 156,
      },
      {
        id: '5',
        name: 'Lisa Wang',
        email: 'lisa@company.com',
        role: 'member' as const,
        status: 'offline' as const,
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        conversationsThisWeek: 18,
        messagesThisWeek: 87,
      },
      {
        id: '6',
        name: 'James Wilson',
        email: 'james@company.com',
        role: 'admin' as const,
        status: 'offline' as const,
        lastActive: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        conversationsThisWeek: 28,
        messagesThisWeek: 142,
      },
    ];

    const recentActivity = [
      { id: '1', user: 'Sarah Chen', action: 'started a new conversation with Neptune', timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
      { id: '2', user: 'Michael Roberts', action: 'updated agent configuration', timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
      { id: '3', user: 'David Kim', action: 'ran Lead Scorer agent', timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
      { id: '4', user: 'Emily Johnson', action: 'exported analytics report', timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
      { id: '5', user: 'Sarah Chen', action: 'invited a new team member', timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
      { id: '6', user: 'James Wilson', action: 'modified workflow settings', timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
      { id: '7', user: 'Lisa Wang', action: 'completed Neptune training', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
      { id: '8', user: 'Michael Roberts', action: 'created new agent template', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
    ];

    return NextResponse.json({ stats, members, recentActivity });
  } catch (error) {
    console.error('Error fetching team data:', error);
    return NextResponse.json({ error: 'Failed to fetch team data' }, { status: 500 });
  }
}
