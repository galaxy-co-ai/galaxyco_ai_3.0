import { NextResponse } from 'next/server';
import { getAdminContext } from '@/lib/auth';
import { getSystemHealth, getDatabaseMetrics } from '@/lib/admin/metrics';
import { createErrorResponse } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger';

/**
 * GET /api/admin/metrics/health
 * 
 * Returns system health status including:
 * - Overall system status (healthy/degraded/unhealthy)
 * - Redis connection status
 * - Database connection status
 * - Process uptime
 * - Database query performance metrics
 * 
 * Requires admin authentication
 */
export async function GET() {
  try {
    // Check admin authentication
    await getAdminContext();

    logger.info('[Admin Health API] Checking system health');

    // Perform health checks
    const [health, dbMetrics] = await Promise.all([
      getSystemHealth(),
      getDatabaseMetrics(),
    ]);

    // Determine HTTP status based on health
    const statusCode = 
      health.status === 'healthy' ? 200 :
      health.status === 'degraded' ? 200 : // Still return 200 for degraded
      503; // Service unavailable for unhealthy

    return NextResponse.json(
      {
        success: true,
        data: {
          system: health,
          database: dbMetrics,
        },
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  } catch (error) {
    if ((error as { status?: number })?.status === 403) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    logger.error('[Admin Health API] Health check failed', error);
    return createErrorResponse(error, 'Health check failed');
  }
}
