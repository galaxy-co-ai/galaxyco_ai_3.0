/**
 * Finance Invoices API
 * GET /api/finance/invoices - Get invoice list from QuickBooks
 * POST /api/finance/invoices - Create a new invoice in QuickBooks
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { getCacheOrFetch } from '@/lib/cache';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { z } from 'zod';
import { QuickBooksService } from '@/lib/finance';
import type { InvoicesResponse, CreateInvoiceRequest } from '@/types/finance';

// GET query parameter validation
const querySchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  status: z.enum(['paid', 'unpaid', 'overdue', 'all']).optional(),
  limit: z.string().optional(),
  cursor: z.string().optional(),
});

// POST body validation
const createInvoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  dueDate: z.string().datetime('Invalid due date format'),
  lineItems: z.array(z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  })).min(1, 'At least one line item is required'),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    // 1. Auth check
    const { workspaceId, userId } = await getCurrentWorkspace();

    // 2. Rate limiting
    const rateLimitResult = await rateLimit(`api:finance:invoices:${userId}`, 100, 3600);
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
      status: searchParams.get('status') || undefined,
      limit: searchParams.get('limit') || undefined,
      cursor: searchParams.get('cursor') || undefined,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const startDate = validationResult.data.start
      ? new Date(validationResult.data.start)
      : thirtyDaysAgo;
    const endDate = validationResult.data.end
      ? new Date(validationResult.data.end)
      : now;
    const status = validationResult.data.status || 'all';
    const limit = validationResult.data.limit
      ? parseInt(validationResult.data.limit, 10)
      : 50;

    // 4. Fetch with caching
    const cacheKey = `finance:invoices:${workspaceId}:${status}:${startDate.toISOString()}:${endDate.toISOString()}`;
    const data = await getCacheOrFetch<InvoicesResponse>(
      cacheKey,
      async () => {
        return await fetchInvoicesData(workspaceId, startDate, endDate, status, limit);
      },
      { ttl: 120 } // 2 minutes
    );

    return NextResponse.json(data);
  } catch (error) {
    return createErrorResponse(error, 'Finance invoices error');
  }
}

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const { workspaceId, userId } = await getCurrentWorkspace();

    // 2. Rate limiting (more restrictive for writes)
    const rateLimitResult = await rateLimit(`api:finance:invoices:create:${userId}`, 50, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', reset: rateLimitResult.reset },
        { status: 429 }
      );
    }

    // 3. Parse and validate body
    const body = await request.json() as CreateInvoiceRequest;
    const validationResult = createInvoiceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // 4. Initialize QuickBooks service
    const qbService = new QuickBooksService(workspaceId);
    const initResult = await qbService.initialize();

    if (!initResult.success) {
      return NextResponse.json(
        { error: 'integration_not_connected', provider: 'quickbooks', message: initResult.error },
        { status: 400 }
      );
    }

    // 5. Create invoice
    // Note: QuickBooks invoice creation is complex and requires proper API implementation
    // This is a placeholder that would need to be implemented in the QuickBooks service
    logger.info('Invoice creation requested', { workspaceId, customerId: validationResult.data.customerId });

    // For now, return a not implemented response
    return NextResponse.json(
      { error: 'Invoice creation not yet implemented' },
      { status: 501 }
    );

    // When implemented, invalidate cache and return created invoice:
    // await invalidateCache(`finance:invoices:${workspaceId}:*`);
    // return NextResponse.json(createdInvoice, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Create invoice error');
  }
}

/**
 * Fetch invoices from QuickBooks
 */
async function fetchInvoicesData(
  workspaceId: string,
  startDate: Date,
  endDate: Date,
  status: string,
  limit: number
): Promise<InvoicesResponse> {
  // Initialize QuickBooks service
  const qbService = new QuickBooksService(workspaceId);
  const initResult = await qbService.initialize();

  if (!initResult.success) {
    // Return empty response if QuickBooks not connected
    return {
      invoices: [],
      pagination: {
        hasMore: false,
        total: 0,
      },
    };
  }

  try {
    const invoices = await qbService.getInvoices({
      startDate,
      endDate,
      status: status as 'paid' | 'unpaid' | 'overdue' | 'all',
      limit,
    });

    const total = invoices.length;
    const hasMore = total >= limit;

    logger.debug('Finance invoices data fetched', { 
      workspaceId, 
      invoiceCount: invoices.length,
      status,
    });

    return {
      invoices,
      pagination: {
        hasMore,
        total,
        nextCursor: hasMore ? invoices[invoices.length - 1]?.id : undefined,
      },
    };
  } catch (error) {
    logger.error('QuickBooks invoices fetch failed', error);
    return {
      invoices: [],
      pagination: {
        hasMore: false,
        total: 0,
      },
    };
  }
}

