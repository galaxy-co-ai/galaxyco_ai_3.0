/**
 * Finance Revenue API
 * GET /api/finance/revenue - Get unified revenue from all sources
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
  formatCurrency,
} from '@/lib/finance';
import type { RevenueResponse, FinanceProvider, RevenueTrendPoint } from '@/types/finance';

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
    const rateLimitResult = await rateLimit(`api:finance:revenue:${userId}`, 100, 3600);
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
    const cacheKey = `finance:revenue:${workspaceId}:${startDate.toISOString()}:${endDate.toISOString()}`;
    const data = await getCacheOrFetch<RevenueResponse>(
      cacheKey,
      async () => {
        return await fetchRevenueData(workspaceId, startDate, endDate);
      },
      { ttl: 300 } // 5 minutes
    );

    return NextResponse.json(data);
  } catch (error) {
    return createErrorResponse(error, 'Finance revenue error');
  }
}

/**
 * Fetch and aggregate revenue data from all providers
 */
async function fetchRevenueData(
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<RevenueResponse> {
  // Get connected providers
  const workspaceIntegrations = await db.query.integrations.findMany({
    where: and(
      eq(integrations.workspaceId, workspaceId),
      eq(integrations.status, 'active'),
      inArray(integrations.provider, FINANCE_PROVIDERS)
    ),
  });

  const connectedProviders = workspaceIntegrations.map(i => i.provider as FinanceProvider);
  
  let totalRevenue = 0;
  const bySource: RevenueResponse['bySource'] = {};
  const allTransactions: Array<{ date: string; amount: number; source: FinanceProvider }> = [];

  // QuickBooks revenue
  if (connectedProviders.includes('quickbooks')) {
    const qbService = new QuickBooksService(workspaceId);
    const initResult = await qbService.initialize().catch(() => ({ success: false }));
    
    if (initResult.success) {
      try {
        const financials = await qbService.getFinancials(startDate, endDate);
        totalRevenue += financials.revenue;
        bySource.quickbooks = financials.revenue;
        
        // Get transactions for trend data
        const transactions = await qbService.getTransactions(startDate, endDate);
        allTransactions.push(...transactions.map(t => ({
          date: t.date,
          amount: t.amount,
          source: 'quickbooks' as const,
        })));
      } catch (error) {
        logger.error('QuickBooks revenue fetch failed', error);
      }
    }
  }

  // Stripe revenue
  if (connectedProviders.includes('stripe')) {
    const stripeService = new StripeService(workspaceId);
    const initResult = await stripeService.initialize().catch(() => ({ success: false }));
    
    if (initResult.success) {
      try {
        const revenueData = await stripeService.getRevenueData(startDate, endDate);
        const stripeNet = revenueData.charges - revenueData.fees - revenueData.refunds;
        totalRevenue += stripeNet;
        bySource.stripe = stripeNet;
        
        // Get transactions for trend data
        const transactions = await stripeService.getTransactions(startDate, endDate);
        allTransactions.push(...transactions.map(t => ({
          date: t.date,
          amount: t.amount,
          source: 'stripe' as const,
        })));
      } catch (error) {
        logger.error('Stripe revenue fetch failed', error);
      }
    }
  }

  // Shopify revenue
  if (connectedProviders.includes('shopify')) {
    const shopifyService = new ShopifyService(workspaceId);
    const initResult = await shopifyService.initialize().catch(() => ({ success: false }));
    
    if (initResult.success) {
      try {
        const revenueData = await shopifyService.getRevenueData(startDate, endDate);
        totalRevenue += revenueData.total;
        bySource.shopify = revenueData.total;
        
        // Get transactions for trend data
        const transactions = await shopifyService.getTransactions(startDate, endDate);
        allTransactions.push(...transactions.map(t => ({
          date: t.date,
          amount: t.amount,
          source: 'shopify' as const,
        })));
      } catch (error) {
        logger.error('Shopify revenue fetch failed', error);
      }
    }
  }

  // Build trend data
  const trend = buildRevenueTrend(allTransactions, startDate, endDate);

  logger.debug('Finance revenue data fetched', { 
    workspaceId, 
    totalRevenue,
    connectedProviders,
  });

  return {
    total: totalRevenue,
    formattedTotal: formatCurrency(totalRevenue),
    bySource,
    trend,
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
  };
}

/**
 * Build revenue trend by date with source breakdown
 */
function buildRevenueTrend(
  transactions: Array<{ date: string; amount: number; source: FinanceProvider }>,
  startDate: Date,
  endDate: Date
): RevenueTrendPoint[] {
  const dateMap = new Map<string, RevenueTrendPoint>();
  
  // Initialize all dates in range
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateKey = current.toISOString().split('T')[0];
    dateMap.set(dateKey, {
      date: dateKey,
      value: 0,
      quickbooks: 0,
      stripe: 0,
      shopify: 0,
    });
    current.setDate(current.getDate() + 1);
  }

  // Aggregate transactions by date and source
  for (const tx of transactions) {
    const dateKey = tx.date.split('T')[0];
    const point = dateMap.get(dateKey);
    if (point) {
      point.value += tx.amount;
      if (tx.source === 'quickbooks') {
        point.quickbooks = (point.quickbooks || 0) + tx.amount;
      } else if (tx.source === 'stripe') {
        point.stripe = (point.stripe || 0) + tx.amount;
      } else if (tx.source === 'shopify') {
        point.shopify = (point.shopify || 0) + tx.amount;
      }
    }
  }

  return Array.from(dateMap.values());
}

