import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    // TODO: Replace with real database query
    // const conversations = await db.query.neptuneConversations.findMany({
    //   where: eq(neptuneConversations.workspaceId, workspaceId),
    //   with: { activeUsers: true },
    // });

    // Mock data for now
    const mockConversations = [
      {
        id: '1',
        title: 'Q4 Financial Planning Discussion',
        lastActiveAt: new Date().toISOString(),
        activeUsers: [
          {
            id: 'user1',
            name: 'Sarah Chen',
            avatar: null,
            color: '#4ADE80',
          },
          {
            id: 'user2',
            name: 'Mike Johnson',
            avatar: null,
            color: '#38BDF8',
          },
        ],
      },
    ];

    return NextResponse.json({
      conversations: mockConversations,
      activeUsers: mockConversations.reduce((sum, c) => sum + c.activeUsers.length, 0),
    });
  } catch (error) {
    console.error('[API] Active conversations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
