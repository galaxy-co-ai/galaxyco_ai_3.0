/**
 * Finance Overview API
 * GET /api/finance/overview - Get KPIs and summary data
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { getCacheOrFetch } from '@/lib/cache';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { z } from 'zod';
import { 
  QuickBooksService, 
  StripeService, 
  ShopifyService,
  generateKPIs,
} from '@/lib/finance';
import type { FinanceOverviewResponse } from '@/types/finance';

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
    const rateLimitResult = await rateLimit(`api:finance:overview:${userId}`, 100, 3600);
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

    // Use defaults if validation fails
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const startDate = validationResult.success && validationResult.data.start
      ? new Date(validationResult.data.start)
      : thirtyDaysAgo;
    const endDate = validationResult.success && validationResult.data.end
      ? new Date(validationResult.data.end)
      : now;

    // 4. Fetch with caching
    const cacheKey = `finance:overview:${workspaceId}:${startDate.toISOString()}:${endDate.toISOString()}`;
    const data = await getCacheOrFetch<FinanceOverviewResponse>(
      cacheKey,
      async () => {
        return await fetchOverviewData(workspaceId, startDate, endDate);
      },
      { ttl: 180 } // 3 minutes
    );

    return NextResponse.json(data);
  } catch (error) {
    return createErrorResponse(error, 'Finance overview error');
  }
}

/**
 * Fetch and aggregate overview data from all providers
 */
async function fetchOverviewData(
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<FinanceOverviewResponse> {
  // Initialize services
  const qbService = new QuickBooksService(workspaceId);
  const stripeService = new StripeService(workspaceId);
  const shopifyService = new ShopifyService(workspaceId);

  // Try to initialize each service (gracefully handle failures)
  const [qbInit, stripeInit, shopifyInit] = await Promise.all([
    qbService.initialize().catch(() => ({ success: false })),
    stripeService.initialize().catch(() => ({ success: false })),
    shopifyService.initialize().catch(() => ({ success: false })),
  ]);

  // Aggregate data from available providers
  let revenue = 0;
  let expenses = 0;
  let outstandingInvoices = 0;
  const bySource: FinanceOverviewResponse['bySource'] = {};

  // QuickBooks data
  if (qbInit.success) {
    try {
      const qbFinancials = await qbService.getFinancials(startDate, endDate);
      const qbInvoices = await qbService.getInvoices({ startDate, endDate, status: 'unpaid' });
      
      revenue += qbFinancials.revenue;
      expenses += qbFinancials.expenses;
      outstandingInvoices = qbInvoices.reduce((sum, inv) => sum + inv.balance, 0);
      
      bySource.quickbooks = {
        revenue: qbFinancials.revenue,
        expenses: qbFinancials.expenses,
      };
    } catch (error) {
      logger.error('QuickBooks data fetch failed', error);
    }
  }

  // Stripe data
  if (stripeInit.success) {
    try {
      const stripeData = await stripeService.getRevenueData(startDate, endDate);
      const stripeNet = stripeData.charges - stripeData.fees - stripeData.refunds;
      
      revenue += stripeNet;
      
      bySource.stripe = {
        revenue: stripeNet,
        fees: stripeData.fees,
      };
    } catch (error) {
      logger.error('Stripe data fetch failed', error);
    }
  }

  // Shopify data
  if (shopifyInit.success) {
    try {
      const shopifyData = await shopifyService.getRevenueData(startDate, endDate);
      
      revenue += shopifyData.total;
      
      bySource.shopify = {
        revenue: shopifyData.total,
        orders: shopifyData.orderCount,
      };
    } catch (error) {
      logger.error('Shopify data fetch failed', error);
    }
  }

  // Calculate profit and cash flow
  const profit = revenue - expenses;
  const cashflow = profit; // Simplified - could be more sophisticated

  // Generate KPIs
  const kpis = generateKPIs({
    revenue,
    expenses,
    profit,
    cashflow,
    outstandingInvoices,
  });

  logger.debug('Finance overview data fetched', { 
    workspaceId, 
    revenue, 
    expenses, 
    profit 
  });

  return {
    kpis,
    summary: {
      revenue,
      expenses,
      profit,
      cashflow,
      outstandingInvoices,
    },
    bySource,
  };
}


























