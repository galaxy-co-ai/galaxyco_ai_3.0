/**
 * Finance Invoice Detail API
 * GET /api/finance/invoices/[id] - Get a single invoice by ID
 * PATCH /api/finance/invoices/[id] - Update an invoice
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { QuickBooksService } from '@/lib/finance';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: Request,
  { params }: RouteParams
) {
  try {
    // 1. Auth check
    const { workspaceId, userId } = await getCurrentWorkspace();

    // 2. Get invoice ID from params
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // 3. Rate limiting
    const rateLimitResult = await rateLimit(`api:finance:invoice:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', reset: rateLimitResult.reset },
        { status: 429 }
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

    // 5. Fetch invoice
    // Extract the actual QuickBooks ID (remove qb_ prefix if present)
    const qbId = id.startsWith('qb_') ? id.replace('qb_', '') : id;
    const invoice = await qbService.getInvoice(qbId);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    logger.debug('Invoice fetched', { workspaceId, invoiceId: id });

    return NextResponse.json(invoice);
  } catch (error) {
    return createErrorResponse(error, 'Get invoice error');
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteParams
) {
  try {
    // 1. Auth check
    const { workspaceId, userId } = await getCurrentWorkspace();

    // 2. Get invoice ID from params
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    // 3. Rate limiting (more restrictive for writes)
    const rateLimitResult = await rateLimit(`api:finance:invoice:update:${userId}`, 50, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', reset: rateLimitResult.reset },
        { status: 429 }
      );
    }

    // 4. Parse body
    const body = await request.json();

    // 5. Initialize QuickBooks service
    const qbService = new QuickBooksService(workspaceId);
    const initResult = await qbService.initialize();

    if (!initResult.success) {
      return NextResponse.json(
        { error: 'integration_not_connected', provider: 'quickbooks', message: initResult.error },
        { status: 400 }
      );
    }

    // 6. Update invoice (not implemented)
    logger.info('Invoice update requested', { workspaceId, invoiceId: id, updates: body });

    return NextResponse.json(
      { error: 'Invoice update not yet implemented' },
      { status: 501 }
    );
  } catch (error) {
    return createErrorResponse(error, 'Update invoice error');
  }
}

