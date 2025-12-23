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

    // TODO: Aggregate tool usage from neptune_messages.toolsUsed array

    // Mock data for now
    const mockToolUsage = [
      {
        name: 'CRM Query',
        executions: 156,
      },
      {
        name: 'Calendar',
        executions: 124,
      },
      {
        name: 'Documents',
        executions: 98,
      },
      {
        name: 'Analytics',
        executions: 87,
      },
      {
        name: 'Email',
        executions: 72,
      },
      {
        name: 'Search',
        executions: 64,
      },
    ];

    return NextResponse.json({ tools: mockToolUsage });
  } catch (error) {
    console.error('[API] Tool usage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
