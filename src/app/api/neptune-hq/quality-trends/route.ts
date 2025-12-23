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

    // TODO: Calculate quality trends from neptune_feedback table

    // Mock data for now - satisfaction scores over last 30 days
    const mockQualityTrends = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      mockQualityTrends.push({
        name: `${date.getMonth() + 1}/${date.getDate()}`,
        value: 75 + Math.random() * 20, // Random score between 75-95
      });
    }

    return NextResponse.json({ data: mockQualityTrends });
  } catch (error) {
    console.error('[API] Quality trends error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
