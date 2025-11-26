import { NextResponse } from 'next/server';
import { checkBackendIntegrations, getBackendHealthScore } from '@/lib/integration-status';
import { createErrorResponse } from '@/lib/api-error-handler';

/**
 * Backend Integration Status API
 * GET /api/system/status
 * Returns detailed status of all backend integrations
 */
export async function GET() {
  try {
    const integrations = checkBackendIntegrations();
    const health = getBackendHealthScore();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      health,
      integrations,
    });
  } catch (error) {
    return createErrorResponse(error, 'Get system status error');
  }
}








