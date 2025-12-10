/**
 * Finance Cash Flow API
 * GET /api/finance/cashflow - Get cash flow data
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
  mergeTransactions,
  mergePayouts,
  calculateCashFlow,
} from '@/lib/finance';
import type { CashFlowResponse, FinanceProvider, CashFlowTrendPoint, Payout, FinanceTransaction } from '@/types/finance';

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
    const rateLimitResult = await rateLimit(`api:finance:cashflow:${userId}`, 100, 3600);
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
    const cacheKey = `finance:cashflow:${workspaceId}:${startDate.toISOString()}:${endDate.toISOString()}`;
    const data = await getCacheOrFetch<CashFlowResponse>(
      cacheKey,
      async () => {
        return await fetchCashFlowData(workspaceId, startDate, endDate);
      },
      { ttl: 300 } // 5 minutes
    );

    return NextResponse.json(data);
  } catch (error) {
    return createErrorResponse(error, 'Finance cash flow error');
  }
}

/**
 * Fetch and aggregate cash flow data from all providers
 */
async function fetchCashFlowData(
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<CashFlowResponse> {
  // Get connected providers
  const workspaceIntegrations = await db.query.integrations.findMany({
    where: and(
      eq(integrations.workspaceId, workspaceId),
      eq(integrations.status, 'active'),
      inArray(integrations.provider, FINANCE_PROVIDERS)
    ),
  });

  const connectedProviders = workspaceIntegrations.map(i => i.provider as FinanceProvider);
  
  const allTransactions: FinanceTransaction[][] = [];
  const allPayouts: Payout[][] = [];

  // QuickBooks data
  if (connectedProviders.includes('quickbooks')) {
    const qbService = new QuickBooksService(workspaceId);
    const initResult = await qbService.initialize().catch(() => ({ success: false }));
    
    if (initResult.success) {
      try {
        const transactions = await qbService.getTransactions(startDate, endDate);
        allTransactions.push(transactions);
      } catch (error) {
        logger.error('QuickBooks cash flow fetch failed', error);
      }
    }
  }

  // Stripe data
  if (connectedProviders.includes('stripe')) {
    const stripeService = new StripeService(workspaceId);
    const initResult = await stripeService.initialize().catch(() => ({ success: false }));
    
    if (initResult.success) {
      try {
        const transactions = await stripeService.getTransactions(startDate, endDate);
        allTransactions.push(transactions);
        
        const payouts = await stripeService.getPayouts();
        allPayouts.push(payouts);
      } catch (error) {
        logger.error('Stripe cash flow fetch failed', error);
      }
    }
  }

  // Shopify data
  if (connectedProviders.includes('shopify')) {
    const shopifyService = new ShopifyService(workspaceId);
    const initResult = await shopifyService.initialize().catch(() => ({ success: false }));
    
    if (initResult.success) {
      try {
        const transactions = await shopifyService.getTransactions(startDate, endDate);
        allTransactions.push(transactions);
        
        const payouts = await shopifyService.getPayouts();
        allPayouts.push(payouts);
      } catch (error) {
        logger.error('Shopify cash flow fetch failed', error);
      }
    }
  }

  // Merge all data
  const mergedTransactions = mergeTransactions(allTransactions);
  const mergedPayouts = mergePayouts(allPayouts);

  // Calculate cash flow totals
  const { inflow, outflow, net } = calculateCashFlow(mergedTransactions);

  // Build trend data
  const trend = buildCashFlowTrend(mergedTransactions, startDate, endDate);

  logger.debug('Finance cash flow data fetched', { 
    workspaceId, 
    inflow,
    outflow,
    net,
    connectedProviders,
  });

  return {
    net,
    inflow,
    outflow,
    trend,
    payouts: mergedPayouts,
  };
}

/**
 * Build cash flow trend by date
 */
function buildCashFlowTrend(
  transactions: FinanceTransaction[],
  startDate: Date,
  endDate: Date
): CashFlowTrendPoint[] {
  const dateMap = new Map<string, CashFlowTrendPoint>();
  
  // Initialize all dates in range
  const current = new Date(startDate);
  while (current <= endDate) {
    const dateKey = current.toISOString().split('T')[0];
    dateMap.set(dateKey, {
      date: dateKey,
      inflow: 0,
      outflow: 0,
      net: 0,
    });
    current.setDate(current.getDate() + 1);
  }

  // Aggregate transactions by date
  for (const tx of transactions) {
    const dateKey = tx.date.split('T')[0];
    const point = dateMap.get(dateKey);
    if (point) {
      if (tx.type === 'income') {
        point.inflow += tx.amount;
      } else if (tx.type === 'expense' || tx.type === 'fee' || tx.type === 'refund') {
        point.outflow += Math.abs(tx.amount);
      }
      point.net = point.inflow - point.outflow;
    }
  }

  return Array.from(dateMap.values());
}












































