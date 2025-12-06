/**
 * Finance Activity API
 * GET /api/finance/activity - Get unified transaction activity table
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
} from '@/lib/finance';
import type { ActivityResponse, FinanceProvider, FinanceTransaction } from '@/types/finance';

const FINANCE_PROVIDERS: FinanceProvider[] = ['quickbooks', 'stripe', 'shopify'];

// Query parameter validation
const querySchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  limit: z.string().optional(),
  cursor: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    // 1. Auth check
    const { workspaceId, userId } = await getCurrentWorkspace();

    // 2. Rate limiting
    const rateLimitResult = await rateLimit(`api:finance:activity:${userId}`, 100, 3600);
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
      limit: searchParams.get('limit') || undefined,
      cursor: searchParams.get('cursor') || undefined,
    });

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const startDate = validationResult.success && validationResult.data.start
      ? new Date(validationResult.data.start)
      : thirtyDaysAgo;
    const endDate = validationResult.success && validationResult.data.end
      ? new Date(validationResult.data.end)
      : now;
    const limit = validationResult.success && validationResult.data.limit
      ? parseInt(validationResult.data.limit, 10)
      : 50;

    // 4. Fetch with caching
    const cacheKey = `finance:activity:${workspaceId}:${startDate.toISOString()}:${endDate.toISOString()}:${limit}`;
    const data = await getCacheOrFetch<ActivityResponse>(
      cacheKey,
      async () => {
        return await fetchActivityData(workspaceId, startDate, endDate, limit);
      },
      { ttl: 120 } // 2 minutes
    );

    return NextResponse.json(data);
  } catch (error) {
    return createErrorResponse(error, 'Finance activity error');
  }
}

/**
 * Fetch activity data from all connected providers
 */
async function fetchActivityData(
  workspaceId: string,
  startDate: Date,
  endDate: Date,
  limit: number
): Promise<ActivityResponse> {
  // Get connected providers
  const workspaceIntegrations = await db.query.integrations.findMany({
    where: and(
      eq(integrations.workspaceId, workspaceId),
      eq(integrations.status, 'active'),
      inArray(integrations.provider, FINANCE_PROVIDERS)
    ),
  });

  const connectedProviders = workspaceIntegrations.map(i => i.provider as FinanceProvider);
  const transactionsByProvider: FinanceTransaction[][] = [];

  // QuickBooks transactions
  if (connectedProviders.includes('quickbooks')) {
    const qbService = new QuickBooksService(workspaceId);
    const initResult = await qbService.initialize().catch(() => ({ success: false }));
    
    if (initResult.success) {
      try {
        const transactions = await qbService.getTransactions(startDate, endDate);
        transactionsByProvider.push(transactions);
      } catch (error) {
        logger.error('QuickBooks activity fetch failed', error);
      }
    }
  }

  // Stripe transactions
  if (connectedProviders.includes('stripe')) {
    const stripeService = new StripeService(workspaceId);
    const initResult = await stripeService.initialize().catch(() => ({ success: false }));
    
    if (initResult.success) {
      try {
        const transactions = await stripeService.getTransactions(startDate, endDate);
        transactionsByProvider.push(transactions);
      } catch (error) {
        logger.error('Stripe activity fetch failed', error);
      }
    }
  }

  // Shopify transactions
  if (connectedProviders.includes('shopify')) {
    const shopifyService = new ShopifyService(workspaceId);
    const initResult = await shopifyService.initialize().catch(() => ({ success: false }));
    
    if (initResult.success) {
      try {
        const transactions = await shopifyService.getTransactions(startDate, endDate);
        transactionsByProvider.push(transactions);
      } catch (error) {
        logger.error('Shopify activity fetch failed', error);
      }
    }
  }

  // Merge, sort, and limit transactions
  const allTransactions = mergeTransactions(transactionsByProvider);
  const transactions = allTransactions.slice(0, limit);
  const total = allTransactions.length;
  const hasMore = total > limit;

  logger.debug('Finance activity data fetched', { 
    workspaceId, 
    connectedProviders,
    transactionCount: transactions.length,
    total,
  });

  return {
    transactions,
    pagination: {
      hasMore,
      total,
      nextCursor: hasMore ? transactions[transactions.length - 1]?.id : undefined,
    },
  };
}






















