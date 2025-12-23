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

    // TODO: Replace with real database queries
    // Aggregate stats from neptune_conversations, neptune_messages, etc.

    // Mock data for now
    const mockStats = {
      totalConversations: 147,
      totalMessages: 3428,
      avgResponseTime: 1850, // milliseconds
      activeUsers: 12,
      trends: {
        conversations: 23, // +23%
        messages: 18, // +18%
        responseTime: -12, // -12% (improvement)
        users: 8, // +8%
      },
    };

    return NextResponse.json(mockStats);
  } catch (error) {
    console.error('[API] Stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
