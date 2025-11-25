import { NextResponse } from 'next/server';
import { checkBackendIntegrations, getBackendHealthScore } from '@/lib/integration-status';

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
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check integration status',
      },
      { status: 500 }
    );
  }
}






