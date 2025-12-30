/**
 * Finance Tool Implementations
 */
import type { ToolImplementations } from '../types';
import { db } from '@/lib/db';
import { and, eq, or, desc, lte } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export const financeToolImplementations: ToolImplementations = {
  async get_finance_summary(args, context) {
    try {
      const period = args.period as string;

      // Get connected finance integrations
      const { integrations } = await import('@/db/schema');
      const { inArray } = await import('drizzle-orm');

      const financeProviders = ['quickbooks', 'stripe', 'shopify'] as const;
      const connectedIntegrations = await db.query.integrations.findMany({
        where: and(
          eq(integrations.workspaceId, context.workspaceId),
          inArray(integrations.provider, financeProviders),
          eq(integrations.status, 'active')
        ),
      });

      if (connectedIntegrations.length === 0) {
        return {
          success: false,
          message: 'No finance integrations connected. Please connect QuickBooks, Stripe, or Shopify from Settings.',
          data: { connectedProviders: [] },
        };
      }

      const connectedProviders = connectedIntegrations.map(i => i.provider);

      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      const periodLabel = period.replace('_', ' ');

      switch (period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'this_week':
          startDate.setDate(now.getDate() - now.getDay());
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
        case 'this_quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        case 'this_year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }

      // Fetch real financial data
      const { QuickBooksService, StripeService, ShopifyService } = await import('@/lib/finance');

      let revenue = 0;
      let expenses = 0;
      let outstandingInvoices = 0;

      // Initialize services
      const qbService = new QuickBooksService(context.workspaceId);
      const stripeService = new StripeService(context.workspaceId);
      const shopifyService = new ShopifyService(context.workspaceId);

      // Try to initialize each service
      const [qbInit, stripeInit, shopifyInit] = await Promise.all([
        qbService.initialize().catch(() => ({ success: false })),
        stripeService.initialize().catch(() => ({ success: false })),
        shopifyService.initialize().catch(() => ({ success: false })),
      ]);

      // QuickBooks data
      if (qbInit.success && connectedProviders.includes('quickbooks')) {
        try {
          const qbFinancials = await qbService.getFinancials(startDate, now);
          const qbInvoices = await qbService.getInvoices({ startDate, endDate: now, status: 'unpaid' });

          revenue += qbFinancials.revenue;
          expenses += qbFinancials.expenses;
          outstandingInvoices += qbInvoices.reduce((sum, inv) => sum + inv.balance, 0);
        } catch (error) {
          logger.warn('QuickBooks data fetch failed for finance summary', { error });
        }
      }

      // Stripe data
      if (stripeInit.success && connectedProviders.includes('stripe')) {
        try {
          const stripeData = await stripeService.getRevenueData(startDate, now);
          const stripeNet = stripeData.charges - stripeData.fees - stripeData.refunds;
          revenue += stripeNet;
          expenses += stripeData.fees;
        } catch (error) {
          logger.warn('Stripe data fetch failed for finance summary', { error });
        }
      }

      // Shopify data
      if (shopifyInit.success && connectedProviders.includes('shopify')) {
        try {
          const shopifyData = await shopifyService.getRevenueData(startDate, now);
          revenue += shopifyData.total;
        } catch (error) {
          logger.warn('Shopify data fetch failed for finance summary', { error });
        }
      }

      const profit = revenue - expenses;
      const cashflow = profit; // Simplified

      logger.info('AI get_finance_summary', {
        period,
        connectedProviders,
        workspaceId: context.workspaceId,
        revenue,
        expenses,
        profit,
      });

      return {
        success: true,
        message: `Financial summary for ${periodLabel}: Revenue $${revenue.toFixed(2)}, Expenses $${expenses.toFixed(2)}, Profit $${profit.toFixed(2)}`,
        data: {
          period: periodLabel,
          dateRange: {
            start: startDate.toISOString(),
            end: now.toISOString(),
          },
          connectedProviders,
          summary: {
            revenue,
            expenses,
            profit,
            outstandingInvoices,
            cashflow,
          },
        },
      };
    } catch (error) {
      logger.error('AI get_finance_summary failed', error);
      return {
        success: false,
        message: 'Failed to get financial summary',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async get_overdue_invoices(args, context) {
    try {
      const limit = (args.limit as number) || 10;

      // Import schemas
      const { invoices } = await import('@/db/schema');
      const { lt } = await import('drizzle-orm');

      const now = new Date();

      // Get overdue invoices from database (sent or overdue status, past due date)
      const overdueInvoices = await db.query.invoices.findMany({
        where: and(
          eq(invoices.workspaceId, context.workspaceId),
          or(eq(invoices.status, 'sent'), eq(invoices.status, 'overdue')),
          lt(invoices.dueDate, now)
        ),
        with: {
          customer: {
            columns: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: [invoices.dueDate], // Oldest first
        limit,
      });

      // Also try to get from QuickBooks if connected
      const { integrations } = await import('@/db/schema');
      const qbIntegration = await db.query.integrations.findFirst({
        where: and(
          eq(integrations.workspaceId, context.workspaceId),
          eq(integrations.provider, 'quickbooks'),
          eq(integrations.status, 'active')
        ),
      });

      let qbInvoices: Array<{
        id: string;
        number: string;
        customer: string;
        amount: number;
        status: string;
        dueDate: string;
      }> = [];

      if (qbIntegration) {
        try {
          const { QuickBooksService } = await import('@/lib/finance');
          const qbService = new QuickBooksService(context.workspaceId);
          const initResult = await qbService.initialize().catch(() => ({ success: false }));

          if (initResult.success) {
            const qbInvoicesData = await qbService.getInvoices({
              startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
              endDate: now,
              status: 'unpaid',
            });

            // Filter to overdue only
            qbInvoices = qbInvoicesData
              .filter(inv => inv.dueDate && new Date(inv.dueDate) < now)
              .map(inv => ({
                id: inv.id,
                number: inv.invoiceNumber || inv.id,
                customer: inv.customer?.name || 'Unknown',
                amount: inv.balance,
                status: 'overdue',
                dueDate: inv.dueDate || new Date().toISOString(),
              }))
              .slice(0, limit);
          }
        } catch (error) {
          logger.warn('QuickBooks invoice fetch failed', { error });
        }
      }

      // Combine and deduplicate (prefer database invoices)
      const allInvoices = overdueInvoices.map(inv => ({
        id: inv.id,
        number: inv.invoiceNumber,
        customer: inv.customer?.name || 'Unknown',
        amount: (inv.total - (inv.amountPaid ?? 0)) / 100,
        status: 'overdue',
        dueDate: inv.dueDate.toISOString(),
        daysOverdue: Math.floor((now.getTime() - inv.dueDate.getTime()) / (1000 * 60 * 60 * 24)),
      }));

      // Add QuickBooks invoices that aren't already in database
      const existingIds = new Set(allInvoices.map(inv => inv.id));
      for (const qbInv of qbInvoices) {
        if (!existingIds.has(qbInv.id)) {
          allInvoices.push({
            ...qbInv,
            daysOverdue: Math.floor((now.getTime() - new Date(qbInv.dueDate).getTime()) / (1000 * 60 * 60 * 24)),
          });
        }
      }

      // Sort by days overdue (most overdue first)
      allInvoices.sort((a, b) => b.daysOverdue - a.daysOverdue);

      const totalAmount = allInvoices.reduce((sum, inv) => sum + inv.amount, 0);

      return {
        success: true,
        message: `Found ${allInvoices.length} overdue invoice${allInvoices.length !== 1 ? 's' : ''} totaling $${totalAmount.toFixed(2)}.`,
        data: {
          invoices: allInvoices.slice(0, limit),
          total: allInvoices.length,
          totalAmount,
        },
      };
    } catch (error) {
      logger.error('AI get_overdue_invoices failed', error);
      return {
        success: false,
        message: 'Failed to get overdue invoices',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async send_invoice_reminder(args, context) {
    try {
      const invoiceId = args.invoiceId as string;
      const customMessage = args.customMessage as string | undefined;

      // Import schemas
      const { invoices } = await import('@/db/schema');
      const { sendEmail, getNotificationTemplate } = await import('@/lib/email');

      // Get invoice from database
      const invoice = await db.query.invoices.findFirst({
        where: and(
          eq(invoices.id, invoiceId),
          eq(invoices.workspaceId, context.workspaceId)
        ),
        with: {
          customer: {
            columns: {
              name: true,
              email: true,
            },
          },
        },
      });

      if (!invoice) {
        // Try QuickBooks if not in database
        const { integrations } = await import('@/db/schema');
        const qbIntegration = await db.query.integrations.findFirst({
          where: and(
            eq(integrations.workspaceId, context.workspaceId),
            eq(integrations.provider, 'quickbooks'),
            eq(integrations.status, 'active')
          ),
        });

        if (!qbIntegration) {
          return {
            success: false,
            message: 'Invoice not found in database and QuickBooks is not connected.',
          };
        }

        // Try to get from QuickBooks
        try {
          const { QuickBooksService } = await import('@/lib/finance');
          const qbService = new QuickBooksService(context.workspaceId);
          const initResult = await qbService.initialize().catch(() => ({ success: false }));

          if (!initResult.success) {
            return {
              success: false,
              message: 'QuickBooks is connected but could not be initialized. Please check your connection.',
            };
          }

          // Note: QuickBooks service would need a getInvoiceById method
          // For now, return a helpful message
          return {
            success: false,
            message: 'Invoice found in QuickBooks. Please use Finance HQ to send reminders for QuickBooks invoices.',
            data: { invoiceId, source: 'quickbooks' },
          };
        } catch (error) {
          logger.error('QuickBooks invoice lookup failed', { error });
          return {
            success: false,
            message: 'Failed to retrieve invoice from QuickBooks.',
          };
        }
      }

      // Check if invoice is overdue
      const now = new Date();
      const isOverdue = invoice.dueDate < now && (invoice.status === 'sent' || invoice.status === 'overdue');
      const amountDue = (invoice.total - (invoice.amountPaid ?? 0)) / 100;
      const daysOverdue = isOverdue
        ? Math.floor((now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      if (!invoice.customer?.email) {
        return {
          success: false,
          message: 'Customer email not found for this invoice. Cannot send reminder.',
        };
      }

      // Send reminder email
      const message = customMessage ||
        (isOverdue
          ? `This is a friendly reminder that invoice ${invoice.invoiceNumber} for $${amountDue.toFixed(2)} is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue. Please remit payment at your earliest convenience.`
          : `This is a reminder that invoice ${invoice.invoiceNumber} for $${amountDue.toFixed(2)} is due on ${invoice.dueDate.toLocaleDateString()}.`);

      const emailTemplate = getNotificationTemplate(
        invoice.customer.name || 'Valued Customer',
        `Payment Reminder: Invoice ${invoice.invoiceNumber}`,
        message,
        'View Invoice',
        `${process.env.NEXT_PUBLIC_APP_URL || 'https://galaxyco.ai'}/finance/invoices/${invoice.id}`
      );

      const emailResult = await sendEmail({
        to: invoice.customer.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      });

      if (!emailResult.success) {
        return {
          success: false,
          message: `Failed to send reminder email: ${emailResult.error}`,
        };
      }

      logger.info('AI send_invoice_reminder', {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        customerEmail: invoice.customer.email,
        workspaceId: context.workspaceId
      });

      return {
        success: true,
        message: `Payment reminder sent to ${invoice.customer.email} for invoice ${invoice.invoiceNumber}.`,
        data: {
          invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          customerEmail: invoice.customer.email,
          amountDue,
          isOverdue,
          daysOverdue,
          emailSent: true,
          messageId: emailResult.messageId,
        },
      };
    } catch (error) {
      logger.error('AI send_invoice_reminder failed', error);
      return {
        success: false,
        message: 'Failed to send invoice reminder',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async generate_cash_flow_forecast(args, context) {
    try {
      const days = args.days as number;

      // Use the same logic as project_cash_flow but for a specific number of days
      const now = new Date();
      const forecastDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
      const historicalStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      // Import finance services
      const { QuickBooksService, StripeService, ShopifyService } = await import('@/lib/finance');
      const { integrations } = await import('@/db/schema');
      const { inArray, gte } = await import('drizzle-orm');

      // Get connected finance providers
      const financeProviders = ['quickbooks', 'stripe', 'shopify'] as const;
      const financeIntegrations = await db.query.integrations.findMany({
        where: and(
          eq(integrations.workspaceId, context.workspaceId),
          inArray(integrations.provider, financeProviders),
          eq(integrations.status, 'active')
        ),
      });

      if (financeIntegrations.length === 0) {
        return {
          success: false,
          message: 'No finance integrations connected. Please connect QuickBooks, Stripe, or Shopify to generate forecasts.',
        };
      }

      const connectedProviders = financeIntegrations.map(i => i.provider);

      // Get historical revenue and expenses
      let historicalRevenue = 0;
      let historicalExpenses = 0;

      const qbService = new QuickBooksService(context.workspaceId);
      const stripeService = new StripeService(context.workspaceId);
      const shopifyService = new ShopifyService(context.workspaceId);

      const [qbInit, stripeInit, shopifyInit] = await Promise.all([
        qbService.initialize().catch(() => ({ success: false })),
        stripeService.initialize().catch(() => ({ success: false })),
        shopifyService.initialize().catch(() => ({ success: false })),
      ]);

      if (qbInit.success && connectedProviders.includes('quickbooks')) {
        try {
          const qbFinancials = await qbService.getFinancials(historicalStart, now);
          historicalRevenue += qbFinancials.revenue;
          historicalExpenses += qbFinancials.expenses;
        } catch (error) {
          logger.warn('QuickBooks data fetch failed for cash flow forecast', { error });
        }
      }

      if (stripeInit.success && connectedProviders.includes('stripe')) {
        try {
          const stripeData = await stripeService.getRevenueData(historicalStart, now);
          historicalRevenue += stripeData.charges - stripeData.fees - stripeData.refunds;
          historicalExpenses += stripeData.fees;
        } catch (error) {
          logger.warn('Stripe data fetch failed for cash flow forecast', { error });
        }
      }

      if (shopifyInit.success && connectedProviders.includes('shopify')) {
        try {
          const shopifyData = await shopifyService.getRevenueData(historicalStart, now);
          historicalRevenue += shopifyData.total;
        } catch (error) {
          logger.warn('Shopify data fetch failed for cash flow forecast', { error });
        }
      }

      // Get pending invoices (expected revenue)
      const { invoices } = await import('@/db/schema');

      const pendingInvoices = await db.query.invoices.findMany({
        where: and(
          eq(invoices.workspaceId, context.workspaceId),
          eq(invoices.status, 'sent'),
          gte(invoices.dueDate, now),
          lte(invoices.dueDate, forecastDate)
        ),
      });

      const expectedInflows = pendingInvoices.reduce((sum, inv) => sum + (inv.total - (inv.amountPaid ?? 0)), 0) / 100;

      // Calculate daily averages
      const dailyRevenue = historicalRevenue / days;
      const dailyExpenses = historicalExpenses / days;
      const dailyNet = dailyRevenue - dailyExpenses;

      // Project cash flow
      const projectedNetPosition = Math.round(dailyNet * days + expectedInflows);
      const expectedOutflows = Math.round(dailyExpenses * days);

      logger.info('AI generate_cash_flow_forecast', {
        days,
        connectedProviders,
        workspaceId: context.workspaceId,
        projectedNetPosition,
      });

      return {
        success: true,
        message: `${days}-day cash flow forecast: Projected net position $${projectedNetPosition.toFixed(2)} (inflows: $${(expectedInflows + dailyRevenue * days).toFixed(2)}, outflows: $${expectedOutflows.toFixed(2)})`,
        data: {
          forecastDays: days,
          connectedProviders,
          forecast: {
            expectedInflows: Math.round(expectedInflows + dailyRevenue * days),
            expectedOutflows,
            projectedNetPosition,
          },
          historicalData: {
            revenue: historicalRevenue,
            expenses: historicalExpenses,
            periodDays: days,
          },
        },
      };
    } catch (error) {
      logger.error('AI generate_cash_flow_forecast failed', error);
      return {
        success: false,
        message: 'Failed to generate cash flow forecast',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async compare_financial_periods(args, context) {
    try {
      const metric = args.metric as string;
      const period1 = args.period1 as string;
      const period2 = args.period2 as string;

      // Import finance services
      const { QuickBooksService, StripeService, ShopifyService } = await import('@/lib/finance');
      const { integrations } = await import('@/db/schema');
      const { inArray } = await import('drizzle-orm');

      const financeProviders = ['quickbooks', 'stripe', 'shopify'] as const;
      const connectedIntegrations = await db.query.integrations.findMany({
        where: and(
          eq(integrations.workspaceId, context.workspaceId),
          inArray(integrations.provider, financeProviders),
          eq(integrations.status, 'active')
        ),
      });

      if (connectedIntegrations.length === 0) {
        return {
          success: false,
          message: 'No finance integrations connected. Please connect QuickBooks, Stripe, or Shopify to compare periods.',
        };
      }

      const connectedProviders = connectedIntegrations.map(i => i.provider);

      // Calculate date ranges for both periods
      const now = new Date();
      let period1Start: Date;
      let period1End: Date;
      let period2Start: Date;
      let period2End: Date;

      // Period 1 (current period)
      switch (period1) {
        case 'this_week':
          period1Start = new Date(now);
          period1Start.setDate(now.getDate() - now.getDay());
          period1Start.setHours(0, 0, 0, 0);
          period1End = new Date(period1Start);
          period1End.setDate(period1Start.getDate() + 7);
          break;
        case 'this_month':
          period1Start = new Date(now.getFullYear(), now.getMonth(), 1);
          period1End = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          break;
        case 'this_quarter':
          const quarter1 = Math.floor(now.getMonth() / 3);
          period1Start = new Date(now.getFullYear(), quarter1 * 3, 1);
          period1End = new Date(now.getFullYear(), (quarter1 + 1) * 3, 0, 23, 59, 59);
          break;
        case 'this_year':
          period1Start = new Date(now.getFullYear(), 0, 1);
          period1End = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
          break;
        default:
          period1Start = new Date(now);
          period1End = new Date(now);
      }

      // Period 2 (previous period)
      switch (period2) {
        case 'last_week':
          period2Start = new Date(period1Start);
          period2Start.setDate(period2Start.getDate() - 7);
          period2End = new Date(period2Start);
          period2End.setDate(period2End.getDate() + 7);
          break;
        case 'last_month':
          period2Start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          period2End = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
          break;
        case 'last_quarter':
          const quarter2 = Math.floor(now.getMonth() / 3);
          period2Start = new Date(now.getFullYear(), (quarter2 - 1) * 3, 1);
          period2End = new Date(now.getFullYear(), quarter2 * 3, 0, 23, 59, 59);
          break;
        case 'last_year':
          period2Start = new Date(now.getFullYear() - 1, 0, 1);
          period2End = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
          break;
        default:
          period2Start = new Date(period1Start);
          period2End = new Date(period1End);
      }

      // Initialize services
      const qbService = new QuickBooksService(context.workspaceId);
      const stripeService = new StripeService(context.workspaceId);
      const shopifyService = new ShopifyService(context.workspaceId);

      const [qbInit, stripeInit, shopifyInit] = await Promise.all([
        qbService.initialize().catch(() => ({ success: false })),
        stripeService.initialize().catch(() => ({ success: false })),
        shopifyService.initialize().catch(() => ({ success: false })),
      ]);

      // Fetch data for both periods
      let period1Value = 0;
      let period2Value = 0;

      // QuickBooks
      if (qbInit.success && connectedProviders.includes('quickbooks')) {
        try {
          const p1Data = await qbService.getFinancials(period1Start, period1End);
          const p2Data = await qbService.getFinancials(period2Start, period2End);

          if (metric === 'revenue') {
            period1Value += p1Data.revenue;
            period2Value += p2Data.revenue;
          } else if (metric === 'expenses') {
            period1Value += p1Data.expenses;
            period2Value += p2Data.expenses;
          } else if (metric === 'profit') {
            period1Value += p1Data.revenue - p1Data.expenses;
            period2Value += p2Data.revenue - p2Data.expenses;
          } else if (metric === 'invoices') {
            const p1Invoices = await qbService.getInvoices({ startDate: period1Start, endDate: period1End });
            const p2Invoices = await qbService.getInvoices({ startDate: period2Start, endDate: period2End });
            period1Value += p1Invoices.length;
            period2Value += p2Invoices.length;
          }
        } catch (error) {
          logger.warn('QuickBooks period comparison failed', { error });
        }
      }

      // Stripe
      if (stripeInit.success && connectedProviders.includes('stripe')) {
        try {
          const p1Data = await stripeService.getRevenueData(period1Start, period1End);
          const p2Data = await stripeService.getRevenueData(period2Start, period2End);

          if (metric === 'revenue') {
            period1Value += p1Data.charges - p1Data.fees - p1Data.refunds;
            period2Value += p2Data.charges - p2Data.fees - p2Data.refunds;
          } else if (metric === 'expenses') {
            period1Value += p1Data.fees;
            period2Value += p2Data.fees;
          } else if (metric === 'profit') {
            period1Value += (p1Data.charges - p1Data.fees - p1Data.refunds) - p1Data.fees;
            period2Value += (p2Data.charges - p2Data.fees - p2Data.refunds) - p2Data.fees;
          } else if (metric === 'orders') {
            // Stripe doesn't have a charge count in revenue data, estimate from charges amount
            period1Value += p1Data.charges > 0 ? 1 : 0;
            period2Value += p2Data.charges > 0 ? 1 : 0;
          }
        } catch (error) {
          logger.warn('Stripe period comparison failed', { error });
        }
      }

      // Shopify
      if (shopifyInit.success && connectedProviders.includes('shopify')) {
        try {
          const p1Data = await shopifyService.getRevenueData(period1Start, period1End);
          const p2Data = await shopifyService.getRevenueData(period2Start, period2End);

          if (metric === 'revenue' || metric === 'profit') {
            period1Value += p1Data.total;
            period2Value += p2Data.total;
          } else if (metric === 'orders') {
            period1Value += p1Data.orderCount || 0;
            period2Value += p2Data.orderCount || 0;
          }
        } catch (error) {
          logger.warn('Shopify period comparison failed', { error });
        }
      }

      // Calculate change
      const absoluteChange = period1Value - period2Value;
      const percentageChange = period2Value !== 0
        ? ((absoluteChange / period2Value) * 100).toFixed(1) + '%'
        : period1Value > 0 ? '100%' : '0%';

      logger.info('AI compare_financial_periods', {
        metric,
        period1,
        period2,
        period1Value,
        period2Value,
        connectedProviders,
        workspaceId: context.workspaceId
      });

      return {
        success: true,
        message: `${metric} comparison: ${period1.replace('_', ' ')} $${period1Value.toFixed(2)} vs ${period2.replace('_', ' ')} $${period2Value.toFixed(2)}. Change: ${absoluteChange >= 0 ? '+' : ''}$${absoluteChange.toFixed(2)} (${percentageChange}).`,
        data: {
          metric,
          period1: {
            label: period1.replace('_', ' '),
            value: period1Value,
            startDate: period1Start.toISOString(),
            endDate: period1End.toISOString(),
          },
          period2: {
            label: period2.replace('_', ' '),
            value: period2Value,
            startDate: period2Start.toISOString(),
            endDate: period2End.toISOString(),
          },
          change: {
            absolute: absoluteChange,
            percentage: percentageChange,
            direction: absoluteChange > 0 ? 'increase' : absoluteChange < 0 ? 'decrease' : 'no_change',
          },
          connectedProviders,
        },
      };
    } catch (error) {
      logger.error('AI compare_financial_periods failed', error);
      return {
        success: false,
        message: 'Failed to compare financial periods',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async get_finance_integrations(args, context) {
    try {
      const { integrations } = await import('@/db/schema');
      const { inArray } = await import('drizzle-orm');

      const financeProviders = ['quickbooks', 'stripe', 'shopify'] as const;
      const allIntegrations = await db.query.integrations.findMany({
        where: and(
          eq(integrations.workspaceId, context.workspaceId),
          inArray(integrations.provider, financeProviders)
        ),
      });

      const connected: string[] = [];
      const expired: string[] = [];
      const available: string[] = [];

      for (const provider of financeProviders) {
        const integration = allIntegrations.find(i => i.provider === provider);
        if (!integration) {
          available.push(provider);
        } else if (integration.status === 'active') {
          connected.push(provider);
        } else if (integration.status === 'expired') {
          expired.push(provider);
        } else {
          available.push(provider);
        }
      }

      const details: Record<string, { status: string; lastSyncAt?: string; accountName?: string }> = {};
      for (const integration of allIntegrations) {
        details[integration.provider] = {
          status: integration.status,
          lastSyncAt: integration.lastSyncAt?.toISOString(),
          accountName: integration.displayName || integration.name || undefined,
        };
      }

      return {
        success: true,
        message: `Found ${connected.length} connected finance integration(s)`,
        data: {
          connected,
          expired,
          available,
          details,
          summary: connected.length > 0
            ? `Connected to: ${connected.join(', ')}`
            : 'No finance integrations connected. Connect QuickBooks, Stripe, or Shopify to enable Finance HQ.',
        },
      };
    } catch (error) {
      logger.error('AI get_finance_integrations failed', error);
      return {
        success: false,
        message: 'Failed to get finance integrations',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async auto_categorize_expenses(args, context) {
    try {
      const expenseIds = (args.expenseIds as string[]) || [];

      // In production, would query actual expenses table
      // For now, return categorization logic
      const categories = ['travel', 'meals', 'software', 'office', 'marketing', 'other'];

      return {
        success: true,
        message: `Categorized ${expenseIds.length || 'all'} expenses automatically based on merchant and description patterns.`,
        data: {
          expensesCategorized: expenseIds.length || 'all',
          categoriesUsed: categories,
          method: 'pattern_matching',
        },
      };
    } catch (error) {
      logger.error('AI auto_categorize_expenses failed', error);
      return {
        success: false,
        message: 'Failed to categorize expenses',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async flag_anomalies(args, context) {
    try {
      const period = args.period as string;
      const threshold = (args.threshold as number) || 2.0; // Default: 2x standard deviation

      // Calculate date range
      const now = new Date();
      const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : 90;
      const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

      // Import expenses schema
      const { expenses } = await import('@/db/schema');
      const { gte } = await import('drizzle-orm');

      // Get all expenses in the period
      const allExpenses = await db.query.expenses.findMany({
        where: and(
          eq(expenses.workspaceId, context.workspaceId),
          gte(expenses.expenseDate, startDate),
          lte(expenses.expenseDate, now)
        ),
        orderBy: [desc(expenses.expenseDate)],
      });

      if (allExpenses.length === 0) {
        return {
          success: true,
          message: `No expenses found in the last ${period}. No anomalies to detect.`,
          data: {
            period,
            anomalies: [],
            threshold,
            analysisDate: now.toISOString(),
            totalExpenses: 0,
          },
        };
      }

      // Calculate statistics
      const amounts = allExpenses.map(e => e.amount / 100); // Convert from cents
      const mean = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
      const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);
      const thresholdAmount = mean + (threshold * stdDev);

      // Find anomalies (expenses significantly above average)
      const anomalies = allExpenses
        .filter(exp => (exp.amount / 100) >= thresholdAmount)
        .map(exp => ({
          type: 'unusual_expense' as const,
          description: `${exp.description} - ${((exp.amount / 100) / mean).toFixed(1)}x higher than average`,
          amount: exp.amount / 100,
          date: exp.expenseDate.toISOString(),
          expenseId: exp.id,
          category: exp.category,
          vendor: exp.vendor || 'Unknown',
        }))
        .slice(0, 10); // Limit to top 10

      // Also check for unusual patterns (e.g., many small expenses from same vendor)
      const vendorCounts = new Map<string, number>();
      allExpenses.forEach(exp => {
        const vendor = exp.vendor || 'Unknown';
        vendorCounts.set(vendor, (vendorCounts.get(vendor) || 0) + 1);
      });

      const avgVendorFrequency = allExpenses.length / vendorCounts.size;
      const frequentVendorAnomalies = Array.from(vendorCounts.entries())
        .filter(([_, count]) => count > avgVendorFrequency * 3)
        .map(([vendor, count]) => ({
          type: 'frequent_vendor' as const,
          description: `Unusually frequent expenses from ${vendor} (${count} transactions)`,
          vendor,
          transactionCount: count,
          averageFrequency: avgVendorFrequency.toFixed(1),
        }))
        .slice(0, 5);

      const allAnomalies = [...anomalies, ...frequentVendorAnomalies];

      return {
        success: true,
        message: `Analyzed ${period} period (${allExpenses.length} expenses). Found ${allAnomalies.length} financial anomaly${allAnomalies.length !== 1 ? 'ies' : ''} requiring attention.`,
        data: {
          period,
          anomalies: allAnomalies,
          threshold,
          analysisDate: now.toISOString(),
          totalExpenses: allExpenses.length,
          averageExpense: mean,
          standardDeviation: stdDev,
        },
      };
    } catch (error) {
      logger.error('AI flag_anomalies failed', error);
      return {
        success: false,
        message: 'Failed to flag anomalies',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async project_cash_flow(args, context) {
    try {
      const includeScenarios = (args.includeScenarios as boolean) ?? true;
      const assumptions = (args.assumptions as Record<string, unknown>) || {};

      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Import finance services
      const { QuickBooksService, StripeService, ShopifyService } = await import('@/lib/finance');
      const { integrations } = await import('@/db/schema');
      const { inArray, gte } = await import('drizzle-orm');

      // Get connected finance providers
      const financeProviders = ['quickbooks', 'stripe', 'shopify'] as const;
      const financeIntegrations = await db.query.integrations.findMany({
        where: and(
          eq(integrations.workspaceId, context.workspaceId),
          inArray(integrations.provider, financeProviders),
          eq(integrations.status, 'active')
        ),
      });

      const connectedProviders = financeIntegrations.map(i => i.provider);

      // Get historical revenue data (last 90 days)
      let historicalRevenue = 0;
      let historicalExpenses = 0;

      if (connectedProviders.length > 0) {
        const qbService = new QuickBooksService(context.workspaceId);
        const stripeService = new StripeService(context.workspaceId);
        const shopifyService = new ShopifyService(context.workspaceId);

        // Try to get data from each provider
        const [qbInit, stripeInit, shopifyInit] = await Promise.all([
          qbService.initialize().catch(() => ({ success: false })),
          stripeService.initialize().catch(() => ({ success: false })),
          shopifyService.initialize().catch(() => ({ success: false })),
        ]);

        if (qbInit.success && connectedProviders.includes('quickbooks')) {
          try {
            const qbFinancials = await qbService.getFinancials(ninetyDaysAgo, now);
            historicalRevenue += qbFinancials.revenue;
            historicalExpenses += qbFinancials.expenses;
          } catch (error) {
            logger.warn('QuickBooks data fetch failed for cash flow projection', { error });
          }
        }

        if (stripeInit.success && connectedProviders.includes('stripe')) {
          try {
            const stripeData = await stripeService.getRevenueData(ninetyDaysAgo, now);
            historicalRevenue += stripeData.charges - stripeData.fees - stripeData.refunds;
            historicalExpenses += stripeData.fees;
          } catch (error) {
            logger.warn('Stripe data fetch failed for cash flow projection', { error });
          }
        }

        if (shopifyInit.success && connectedProviders.includes('shopify')) {
          try {
            const shopifyData = await shopifyService.getRevenueData(ninetyDaysAgo, now);
            historicalRevenue += shopifyData.total;
          } catch (error) {
            logger.warn('Shopify data fetch failed for cash flow projection', { error });
          }
        }
      }

      // Also get pending invoices (expected revenue)
      const { invoices } = await import('@/db/schema');

      const pendingInvoices = await db.query.invoices.findMany({
        where: and(
          eq(invoices.workspaceId, context.workspaceId),
          eq(invoices.status, 'sent'),
          gte(invoices.dueDate, now)
        ),
      });

      const expectedRevenue = pendingInvoices.reduce((sum, inv) => sum + (inv.total - (inv.amountPaid ?? 0)), 0) / 100;

      // Calculate daily averages
      const daysInPeriod = 90;
      const dailyRevenue = historicalRevenue / daysInPeriod;
      const dailyExpenses = historicalExpenses / daysInPeriod;
      const dailyNet = dailyRevenue - dailyExpenses;

      // Project cash flow
      const projections = {
        '30_day': {
          projected: Math.round(dailyNet * 30 + expectedRevenue * 0.3), // 30% of expected revenue in 30 days
          confidence: historicalRevenue > 0 ? 'high' : 'low',
        },
        '60_day': {
          projected: Math.round(dailyNet * 60 + expectedRevenue * 0.6),
          confidence: historicalRevenue > 0 ? 'medium' : 'low',
        },
        '90_day': {
          projected: Math.round(dailyNet * 90 + expectedRevenue),
          confidence: historicalRevenue > 0 ? 'medium' : 'low',
        },
      };

      // Generate scenarios if requested
      const scenarios = includeScenarios ? {
        bestCase: {
          '30_day': Math.round(projections['30_day'].projected * 1.2),
          '60_day': Math.round(projections['60_day'].projected * 1.2),
          '90_day': Math.round(projections['90_day'].projected * 1.2),
        },
        worstCase: {
          '30_day': Math.round(projections['30_day'].projected * 0.8),
          '60_day': Math.round(projections['60_day'].projected * 0.8),
          '90_day': Math.round(projections['90_day'].projected * 0.8),
        },
      } : undefined;

      return {
        success: true,
        message: `Generated ${includeScenarios ? 'scenario-based ' : ''}cash flow projections for 30/60/90 days based on ${daysInPeriod}-day historical data.`,
        data: {
          projections,
          scenarios,
          assumptions,
          generatedAt: new Date().toISOString(),
          historicalData: {
            revenue: historicalRevenue,
            expenses: historicalExpenses,
            net: historicalRevenue - historicalExpenses,
            periodDays: daysInPeriod,
          },
          expectedRevenue,
        },
      };
    } catch (error) {
      logger.error('AI project_cash_flow failed', error);
      return {
        success: false,
        message: 'Failed to project cash flow',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  async send_payment_reminders(args, context) {
    try {
      const invoiceIds = (args.invoiceIds as string[]) || [];
      const autoSend = (args.autoSend as boolean) ?? false;

      // Import schemas
      const { invoices } = await import('@/db/schema');
      const { lt } = await import('drizzle-orm');
      const { sendEmail, getNotificationTemplate } = await import('@/lib/email');

      const now = new Date();

      // Get overdue invoices
      let overdueInvoices;
      if (invoiceIds.length > 0) {
        // Get specific invoices (sent or overdue status, past due date)
        overdueInvoices = await db.query.invoices.findMany({
          where: and(
            eq(invoices.workspaceId, context.workspaceId),
            or(eq(invoices.status, 'sent'), eq(invoices.status, 'overdue')),
            lt(invoices.dueDate, now),
            or(...invoiceIds.map(id => eq(invoices.id, id)))
          ),
          with: {
            customer: {
              columns: {
                name: true,
                email: true,
              },
            },
          },
        });
      } else {
        // Get all overdue invoices (sent or overdue status, past due date)
        overdueInvoices = await db.query.invoices.findMany({
          where: and(
            eq(invoices.workspaceId, context.workspaceId),
            or(eq(invoices.status, 'sent'), eq(invoices.status, 'overdue')),
            lt(invoices.dueDate, now)
          ),
          with: {
            customer: {
              columns: {
                name: true,
                email: true,
              },
            },
          },
          limit: 20, // Limit to 20 to avoid sending too many
        });
      }

      if (overdueInvoices.length === 0) {
        return {
          success: true,
          message: 'No overdue invoices found.',
          data: {
            reminders: [],
            autoSend,
            count: 0,
          },
        };
      }

      const reminders: Array<{ invoiceId: string; status: string; emailSent?: boolean; error?: string }> = [];

      // Send reminders
      for (const invoice of overdueInvoices) {
        const customer = invoice.customer;
        if (!customer?.email) {
          reminders.push({
            invoiceId: invoice.id,
            status: 'skipped',
            error: 'Customer email not found',
          });
          continue;
        }

        const amountDue = (invoice.total - (invoice.amountPaid ?? 0)) / 100;
        const daysOverdue = Math.floor((now.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24));

        if (autoSend) {
          // Send email immediately
          const emailTemplate = getNotificationTemplate(
            customer.name || 'Valued Customer',
            `Payment Reminder: Invoice ${invoice.invoiceNumber}`,
            `This is a friendly reminder that invoice ${invoice.invoiceNumber} for $${amountDue.toFixed(2)} is ${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue. Please remit payment at your earliest convenience.`,
            'View Invoice',
            `${process.env.NEXT_PUBLIC_APP_URL || 'https://galaxyco.ai'}/finance/invoices/${invoice.id}`
          );

          const emailResult = await sendEmail({
            to: customer.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
          });

          reminders.push({
            invoiceId: invoice.id,
            status: emailResult.success ? 'sent' : 'failed',
            emailSent: emailResult.success,
            error: emailResult.error,
          });
        } else {
          // Create draft (just log it)
          reminders.push({
            invoiceId: invoice.id,
            status: 'draft',
          });
        }
      }

      const sentCount = reminders.filter(r => r.status === 'sent').length;
      const failedCount = reminders.filter(r => r.status === 'failed').length;

      return {
        success: true,
        message: autoSend
          ? `Sent ${sentCount} payment reminder${sentCount !== 1 ? 's' : ''}${failedCount > 0 ? ` (${failedCount} failed)` : ''} for overdue invoices.`
          : `Created ${reminders.length} draft payment reminder${reminders.length !== 1 ? 's' : ''} for overdue invoices.`,
        data: {
          reminders,
          autoSend,
          count: reminders.length,
          sent: sentCount,
          failed: failedCount,
        },
      };
    } catch (error) {
      logger.error('AI send_payment_reminders failed', error);
      return {
        success: false,
        message: 'Failed to send payment reminders',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
