import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/auth';
import { getNeptuneMetrics, checkPerformanceTargets } from '@/lib/admin/metrics';
import { createErrorResponse } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/metrics/neptune
 * 
 * Returns Neptune AI performance metrics including:
 * - Response times and request counts
 * - Cache hit rates
 * - Token usage and costs
 * - RAG search statistics
 * - Conversation activity
 * 
 * Query params:
 * - range: 'hour' | 'day' | 'week' (default: 'day')
 * 
 * Requires admin authentication
 */
export async function GET(req: NextRequest) {
  try {
    // Check admin authentication
    await getAdminContext();

    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('range') as 'hour' | 'day' | 'week' | null;
    
    // Validate time range
    const validRanges = ['hour', 'day', 'week'];
    const range = timeRange && validRanges.includes(timeRange) ? timeRange : 'day';

    logger.info('[Admin Metrics API] Fetching Neptune metrics', { range });

    // Get metrics
    const metrics = await getNeptuneMetrics(range);
    
    // Check against performance targets
    const targets = checkPerformanceTargets(metrics);

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        targets,
        timeRange: range,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    if ((error as any)?.status === 403) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    logger.error('[Admin Metrics API] Failed to fetch Neptune metrics', error);
    return createErrorResponse(error, 'Failed to fetch Neptune metrics');
  }
}
