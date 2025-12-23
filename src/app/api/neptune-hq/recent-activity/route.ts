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
    // const activities = await db.query.neptuneActivityLog.findMany({
    //   where: eq(neptuneActivityLog.workspaceId, workspaceId),
    //   orderBy: desc(neptuneActivityLog.createdAt),
    //   limit: 20,
    // });

    // Mock data for now
    const mockActivities = [
      {
        id: '1',
        user: {
          name: 'Sarah Chen',
          avatar: null,
          color: '#4ADE80',
        },
        action: 'asked about',
        description: 'Q4 revenue projections',
        timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
      },
      {
        id: '2',
        user: {
          name: 'Mike Johnson',
          avatar: null,
          color: '#38BDF8',
        },
        action: 'ran analysis on',
        description: 'Customer churn data',
        timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: '3',
        user: {
          name: 'Emma Wilson',
          avatar: null,
          color: '#FB7185',
        },
        action: 'requested',
        description: 'Marketing campaign insights',
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
      },
    ];

    return NextResponse.json({ activities: mockActivities });
  } catch (error) {
    console.error('[API] Recent activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
