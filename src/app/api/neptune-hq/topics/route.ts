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

    // TODO: Implement topic extraction and aggregation from neptune_conversations

    // Mock data for now
    const mockTopics = [
      {
        name: 'Financial Analysis',
        count: 45,
        trend: 12,
      },
      {
        name: 'Customer Data',
        count: 38,
        trend: 8,
      },
      {
        name: 'Marketing Strategy',
        count: 32,
        trend: -3,
      },
      {
        name: 'Product Development',
        count: 28,
        trend: 15,
      },
      {
        name: 'Operations',
        count: 22,
        trend: 5,
      },
    ];

    return NextResponse.json({ topics: mockTopics });
  } catch (error) {
    console.error('[API] Topics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
