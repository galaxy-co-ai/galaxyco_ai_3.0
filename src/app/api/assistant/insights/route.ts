/**
 * Proactive Insights API
 * 
 * Returns proactive insights and suggestions for the workspace
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { getActiveInsights } from '@/lib/ai/proactive-engine';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const { workspaceId, userId: clerkUserId } = await getCurrentWorkspace();
    const currentUser = await getCurrentUser();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const insights = await getActiveInsights(workspaceId, currentUser.id, limit);

    return NextResponse.json({
      success: true,
      insights,
      count: insights.length,
    });
  } catch (error) {
    logger.error('Failed to get insights', error);
    return NextResponse.json(
      { error: 'Failed to retrieve insights' },
      { status: 500 }
    );
  }
}
