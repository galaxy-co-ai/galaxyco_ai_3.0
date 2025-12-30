/**
 * Proactive Insights API
 *
 * Returns proactive insights and suggestions for the workspace
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { getActiveInsights } from '@/lib/ai/proactive-engine';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  try {
    const { workspaceId, userId: clerkUserId } = await getCurrentWorkspace();
    const currentUser = await getCurrentUser();

    // Rate limiting
    const rateLimitResult = await rateLimit(`insights:${clerkUserId}`, 100, 3600);
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
