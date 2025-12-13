/**
 * Deal Forecast API
 * 
 * GET /api/crm/forecast - Get deal forecast
 * GET /api/crm/forecast/quick - Get quick metrics for dashboard widget
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateForecast, getQuickForecast } from '@/lib/crm/forecasting';
import { logger } from '@/lib/logger';

// GET: Generate forecast
export async function GET(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const quick = searchParams.get('quick') === 'true';

    // Quick forecast for dashboard widget
    if (quick) {
      const metrics = await getQuickForecast(orgId);
      return NextResponse.json(metrics);
    }

    // Full forecast
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;
    const pipelineId = searchParams.get('pipelineId') || undefined;
    const periodType = (searchParams.get('periodType') as 'monthly' | 'quarterly') || 'monthly';

    const forecast = await generateForecast(orgId, {
      startDate,
      endDate,
      pipelineId,
      periodType,
    });

    return NextResponse.json(forecast);
  } catch (error) {
    logger.error('[Forecast API] GET error', error);
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    );
  }
}
