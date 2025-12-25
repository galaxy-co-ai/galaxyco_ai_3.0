/**
 * Finance Timeline API
 * GET /api/finance/timeline - Get unified financial events for timeline
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
import { z } from 'zod';
import { 
  QuickBooksService, 
  StripeService, 
  ShopifyService,
  mergeEvents,
} from '@/lib/finance';
import type { TimelineResponse, FinanceProvider, FinanceEvent } from '@/types/finance';

const FINANCE_PROVIDERS: FinanceProvider[] = ['quickbooks', 'stripe', 'shopify'];

// Query parameter validation
const querySchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
});

export async function GET(request: Request) {
  try {
    // 1. Auth check
    const { workspaceId, userId } = await getCurrentWorkspace();

    // 2. Rate limiting
    const rateLimitResult = await rateLimit(`api:finance:timeline:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', reset: rateLimitResult.reset },
        { status: 429 }
      );
    }

    // 3. Parse and validate query params
    const { searchParams } = new URL(request.url);
    const validationResult = querySchema.safeParse({
      start: searchParams.get('start') || undefined,
      end: searchParams.get('end') || undefined,
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const startDate = validationResult.success && validationResult.data.start
      ? new Date(validationResult.data.start)
      : thirtyDaysAgo;
    const endDate = validationResult.success && validationResult.data.end
      ? new Date(validationResult.data.end)
      : now;

    // 4. Fetch with caching
    const cacheKey = `finance:timeline:${workspaceId}:${startDate.toISOString()}:${endDate.toISOString()}`;
    const data = await getCacheOrFetch<TimelineResponse>(
      cacheKey,
      async () => {
        return await fetchTimelineData(workspaceId, startDate, endDate);
      },
      { ttl: 180 } // 3 minutes
    );

    return NextResponse.json(data);
  } catch (error) {
    return createErrorResponse(error, 'Finance timeline error');
  }
}

/**
 * Fetch timeline events from all connected providers
 */
async function fetchTimelineData(
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<TimelineResponse> {
  // Get connected providers
  const workspaceIntegrations = await db.query.integrations.findMany({
    where: and(
      eq(integrations.workspaceId, workspaceId),
      eq(integrations.status, 'active'),
      inArray(integrations.provider, FINANCE_PROVIDERS)
    ),
  });

  const connectedProviders = workspaceIntegrations.map(i => i.provider as FinanceProvider);
  const eventsByProvider: FinanceEvent[][] = [];

  // QuickBooks events
  if (connectedProviders.includes('quickbooks')) {
    const qbService = new QuickBooksService(workspaceId);
    const initResult = await qbService.initialize().catch(() => ({ success: false }));
    
    if (initResult.success) {
      try {
        const events = await qbService.getTimelineEvents(startDate, endDate);
        eventsByProvider.push(events);
      } catch (error) {
        logger.error('QuickBooks timeline fetch failed', error);
      }
    }
  }

  // Stripe events
  if (connectedProviders.includes('stripe')) {
    const stripeService = new StripeService(workspaceId);
    const initResult = await stripeService.initialize().catch(() => ({ success: false }));
    
    if (initResult.success) {
      try {
        const events = await stripeService.getTimelineEvents(startDate, endDate);
        eventsByProvider.push(events);
      } catch (error) {
        logger.error('Stripe timeline fetch failed', error);
      }
    }
  }

  // Shopify events
  if (connectedProviders.includes('shopify')) {
    const shopifyService = new ShopifyService(workspaceId);
    const initResult = await shopifyService.initialize().catch(() => ({ success: false }));
    
    if (initResult.success) {
      try {
        const events = await shopifyService.getTimelineEvents(startDate, endDate);
        eventsByProvider.push(events);
      } catch (error) {
        logger.error('Shopify timeline fetch failed', error);
      }
    }
  }

  // Merge and sort all events
  const events = mergeEvents(eventsByProvider);

  logger.debug('Finance timeline data fetched', { 
    workspaceId, 
    connectedProviders,
    eventCount: events.length,
  });

  return { events };
}


































































