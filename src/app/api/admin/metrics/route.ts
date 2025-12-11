import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/auth';
import { getMetricsSummary, checkPerformanceTargets } from '@/lib/admin/metrics';
import { createErrorResponse } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/metrics
 * 
 * Returns comprehensive metrics summary including:
 * - Neptune performance metrics
 * - Database performance metrics
 * - System health status
 * - Performance targets comparison
 * 
 * Query params:
 * - range: 'hour' | 'day' | 'week' (default: 'day')
 * 
 * Requires admin authentication
 * 
 * This is the primary endpoint for getting all metrics at once.
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

    logger.info('[Admin Metrics API] Fetching comprehensive metrics summary', { range });

    // Get all metrics
    const summary = await getMetricsSummary(range);
    
    // Check Neptune performance targets
    const targets = checkPerformanceTargets(summary.neptune);

    return NextResponse.json({
      success: true,
      data: {
        ...summary,
        targets,
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
    
    logger.error('[Admin Metrics API] Failed to fetch metrics summary', error);
    return createErrorResponse(error, 'Failed to fetch metrics summary');
  }
}
