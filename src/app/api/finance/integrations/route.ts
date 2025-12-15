/**
 * Finance Integrations API
 * GET /api/finance/integrations - Get connection status of finance integrations
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { integrations } from '@/db/schema';
import { getCacheOrFetch } from '@/lib/cache';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { eq, and, inArray } from 'drizzle-orm';
import type { FinanceIntegrationsResponse, FinanceProvider, IntegrationDetail } from '@/types/finance';

const FINANCE_PROVIDERS: FinanceProvider[] = ['quickbooks', 'stripe', 'shopify'];

export async function GET() {
  try {
    // 1. Auth check
    const { workspaceId, userId } = await getCurrentWorkspace();

    // 2. Rate limiting
    const rateLimitResult = await rateLimit(`api:finance:integrations:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', reset: rateLimitResult.reset },
        { status: 429 }
      );
    }

    // 3. Fetch with caching (short TTL for integration status)
    const data = await getCacheOrFetch<FinanceIntegrationsResponse>(
      `finance:integrations:${workspaceId}`,
      async () => {
        return await fetchIntegrationStatus(workspaceId);
      },
      { ttl: 60 } // 1 minute cache
    );

    return NextResponse.json(data);
  } catch (error) {
    return createErrorResponse(error, 'Finance integrations error');
  }
}

/**
 * Fetch integration status from database
 */
async function fetchIntegrationStatus(workspaceId: string): Promise<FinanceIntegrationsResponse> {
  // Query all finance integrations for this workspace
  const workspaceIntegrations = await db.query.integrations.findMany({
    where: and(
      eq(integrations.workspaceId, workspaceId),
      inArray(integrations.provider, FINANCE_PROVIDERS)
    ),
  });

  const connected: FinanceProvider[] = [];
  const expired: FinanceProvider[] = [];
  const details: FinanceIntegrationsResponse['details'] = {};

  for (const integration of workspaceIntegrations) {
    const provider = integration.provider as FinanceProvider;
    const config = integration.config as { accountName?: string } | null;
    
    const detail: IntegrationDetail = {
      status: integration.status === 'active' ? 'connected' : 
              integration.status === 'expired' ? 'expired' : 'disconnected',
      connectedAt: integration.createdAt?.toISOString(),
      lastSyncAt: integration.lastSyncAt?.toISOString() || undefined,
      accountName: config?.accountName || integration.displayName || undefined,
      error: integration.lastError || undefined,
    };

    details[provider] = detail;

    if (integration.status === 'active') {
      connected.push(provider);
    } else if (integration.status === 'expired') {
      expired.push(provider);
    }
  }

  // Determine available providers (not yet connected)
  const available = FINANCE_PROVIDERS.filter(
    p => !connected.includes(p) && !expired.includes(p)
  );

  logger.debug('Finance integrations fetched', { 
    workspaceId, 
    connected, 
    expired, 
    available 
  });

  return {
    connected,
    expired,
    available,
    details,
  };
}




















































