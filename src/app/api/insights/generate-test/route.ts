/**
 * Generate Test Insights API (Development Only)
 * 
 * POST /api/insights/generate-test - Generate sample insights for testing
 */

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateTestInsights } from '@/lib/ai/generate-test-insights';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

export async function POST() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return createErrorResponse(new Error('Access forbidden in production'), 'Generate test insights');
    }

    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return createErrorResponse(new Error('Unauthorized'), 'Generate test insights');
    }

    const workspaceId = (sessionClaims?.metadata as { workspaceId?: string })?.workspaceId;
    if (!workspaceId) {
      return createErrorResponse(new Error('Workspace access forbidden'), 'Generate test insights');
    }

    // Generate test insights
    const result = await generateTestInsights(workspaceId, userId);

    if (!result.success) {
      return createErrorResponse(new Error(result.error || 'Failed to generate test insights'), 'Generate test insights');
    }

    logger.info('[API] Generated test insights', { workspaceId, count: result.count });

    return NextResponse.json({
      success: true,
      message: `Generated ${result.count} test insights`,
      count: result.count,
    });

  } catch (error) {
    return createErrorResponse(error, 'Generate test insights');
  }
}
