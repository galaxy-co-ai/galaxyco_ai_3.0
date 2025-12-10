/**
 * Finance Modules API
 * GET /api/finance/modules - Get dynamic module definitions based on connected integrations
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
  generateModules,
} from '@/lib/finance';
import type { FinanceModulesResponse, FinanceProvider } from '@/types/finance';

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
    const rateLimitResult = await rateLimit(`api:finance:modules:${userId}`, 100, 3600);
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
    const cacheKey = `finance:modules:${workspaceId}:${startDate.toISOString()}:${endDate.toISOString()}`;
    const data = await getCacheOrFetch<FinanceModulesResponse>(
      cacheKey,
      async () => {
        return await fetchModulesData(workspaceId, startDate, endDate);
      },
      { ttl: 300 } // 5 minutes
    );

    return NextResponse.json(data);
  } catch (error) {
    return createErrorResponse(error, 'Finance modules error');
  }
}

/**
 * Fetch module data from all connected providers
 */
async function fetchModulesData(
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<FinanceModulesResponse> {
  // Get connected providers
  const workspaceIntegrations = await db.query.integrations.findMany({
    where: and(
      eq(integrations.workspaceId, workspaceId),
      eq(integrations.status, 'active'),
      inArray(integrations.provider, FINANCE_PROVIDERS)
    ),
  });

  const connectedProviders = workspaceIntegrations.map(i => i.provider as FinanceProvider);

  // Initialize services for connected providers
  const moduleData: {
    qbData?: { invoices: number; receivables: number };
    stripeData?: { charges: number; payouts: number };
    shopifyData?: { orders: number; revenue: number };
  } = {};

  // QuickBooks data
  if (connectedProviders.includes('quickbooks')) {
    const qbService = new QuickBooksService(workspaceId);
    const initResult = await qbService.initialize().catch(() => ({ success: false }));
    
    if (initResult.success) {
      try {
        const invoices = await qbService.getInvoices({ startDate, endDate });
        const unpaidInvoices = invoices.filter(i => i.status !== 'paid');
        
        moduleData.qbData = {
          invoices: invoices.length,
          receivables: unpaidInvoices.reduce((sum, inv) => sum + inv.balance, 0),
        };
      } catch (error) {
        logger.error('QuickBooks module data fetch failed', error);
      }
    }
  }

  // Stripe data
  if (connectedProviders.includes('stripe')) {
    const stripeService = new StripeService(workspaceId);
    const initResult = await stripeService.initialize().catch(() => ({ success: false }));
    
    if (initResult.success) {
      try {
        const revenueData = await stripeService.getRevenueData(startDate, endDate);
        const payouts = await stripeService.getPayouts();
        const pendingPayouts = payouts.filter(p => p.status === 'pending' || p.status === 'in_transit');
        
        moduleData.stripeData = {
          charges: revenueData.charges,
          payouts: pendingPayouts.reduce((sum, p) => sum + p.amount, 0),
        };
      } catch (error) {
        logger.error('Stripe module data fetch failed', error);
      }
    }
  }

  // Shopify data
  if (connectedProviders.includes('shopify')) {
    const shopifyService = new ShopifyService(workspaceId);
    const initResult = await shopifyService.initialize().catch(() => ({ success: false }));
    
    if (initResult.success) {
      try {
        const revenueData = await shopifyService.getRevenueData(startDate, endDate);
        
        moduleData.shopifyData = {
          orders: revenueData.orderCount,
          revenue: revenueData.total,
        };
      } catch (error) {
        logger.error('Shopify module data fetch failed', error);
      }
    }
  }

  // Generate modules based on connected providers and data
  const modules = generateModules(connectedProviders, moduleData);

  logger.debug('Finance modules data fetched', { 
    workspaceId, 
    connectedProviders,
    moduleCount: modules.length,
  });

  return { modules };
}












































