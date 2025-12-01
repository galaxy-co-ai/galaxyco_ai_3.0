/**
 * Finance Invoice Reminder API
 * POST /api/finance/invoices/[id]/remind - Send a payment reminder for an invoice
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { z } from 'zod';
import { QuickBooksService } from '@/lib/finance';
import type { SendReminderRequest, SendReminderResponse } from '@/types/finance';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Request body validation
const reminderSchema = z.object({
  message: z.string().optional(),
});

export async function POST(
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

    // 3. Rate limiting (restrictive for email sending)
    const rateLimitResult = await rateLimit(`api:finance:invoice:remind:${userId}`, 20, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', reset: rateLimitResult.reset },
        { status: 429 }
      );
    }

    // 4. Parse and validate body
    const body = await request.json() as SendReminderRequest;
    const validationResult = reminderSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // 5. Initialize QuickBooks service
    const qbService = new QuickBooksService(workspaceId);
    const initResult = await qbService.initialize();

    if (!initResult.success) {
      return NextResponse.json(
        { error: 'integration_not_connected', provider: 'quickbooks', message: initResult.error },
        { status: 400 }
      );
    }

    // 6. Verify invoice exists
    const qbId = id.startsWith('qb_') ? id.replace('qb_', '') : id;
    const invoice = await qbService.getInvoice(qbId);

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // 7. Check invoice status (only send reminders for unpaid/overdue)
    if (invoice.status === 'paid') {
      return NextResponse.json(
        { error: 'Cannot send reminder for paid invoice' },
        { status: 400 }
      );
    }

    // 8. Send reminder
    // Note: Custom message functionality would need to be implemented in the QuickBooks service
    try {
      const result = await qbService.sendInvoiceReminder(qbId);
      
      logger.info('Invoice reminder sent', { 
        workspaceId, 
        invoiceId: id,
        sentTo: result.sentTo,
      });

      const response: SendReminderResponse = {
        success: true,
        sentTo: result.sentTo,
        sentAt: result.sentAt,
      };

      return NextResponse.json(response);
    } catch (error) {
      logger.error('Failed to send invoice reminder', error);
      return NextResponse.json(
        { error: 'Failed to send reminder. Please try again.' },
        { status: 500 }
      );
    }
  } catch (error) {
    return createErrorResponse(error, 'Send invoice reminder error');
  }
}

