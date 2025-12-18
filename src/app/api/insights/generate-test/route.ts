/**
 * Generate Test Insights API (Development Only)
 * 
 * POST /api/insights/generate-test - Generate sample insights for testing
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateTestInsights } from '@/lib/ai/generate-test-insights';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      );
    }

    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaceId = (sessionClaims?.metadata as { workspaceId?: string })?.workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 403 });
    }

    // Generate test insights
    const result = await generateTestInsights(workspaceId, userId);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate test insights' },
        { status: 500 }
      );
    }

    logger.info('[API] Generated test insights', { workspaceId, count: result.count });

    return NextResponse.json({
      success: true,
      message: `Generated ${result.count} test insights`,
      count: result.count,
    });

  } catch (error) {
    logger.error('[API] Failed to generate test insights', error);
    return NextResponse.json(
      { error: 'Failed to generate test insights' },
      { status: 500 }
    );
  }
}
