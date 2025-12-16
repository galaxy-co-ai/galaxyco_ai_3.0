import { z } from 'zod';
import { registry, registerRoute, successResponse, paginatedResponse } from '../registry';
import { UserRefSchema } from '../schemas/common';

/**
 * Finance API Endpoints
 * 
 * Invoices, expenses, revenue tracking, and financial analytics
 */

// Invoice schema
const InvoiceSchema = z.object({
  id: z.string().uuid(),
  invoiceNumber: z.string(),
  clientId: z.string().uuid().optional(),
  clientName: z.string(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  amount: z.number(),
  currency: z.string().default('USD'),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  paidDate: z.string().datetime().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    total: z.number(),
  })),
  notes: z.string().optional(),
  createdBy: UserRefSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('Invoice');

// Expense schema
const ExpenseSchema = z.object({
  id: z.string().uuid(),
  category: z.enum(['software', 'hardware', 'marketing', 'office', 'travel', 'payroll', 'other']),
  description: z.string(),
  amount: z.number(),
  currency: z.string().default('USD'),
  date: z.string().datetime(),
  vendor: z.string().optional(),
  receipt: z.string().url().optional(),
  status: z.enum(['pending', 'approved', 'rejected']),
  approvedBy: UserRefSchema.optional(),
  approvedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  createdBy: UserRefSchema.optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
}).openapi('Expense');

// Financial overview schema
const FinanceOverviewSchema = z.object({
  totalRevenue: z.number(),
  totalExpenses: z.number(),
  netIncome: z.number(),
  outstandingInvoices: z.number(),
  overdueInvoices: z.number(),
  pendingExpenses: z.number(),
  cashFlow: z.object({
    current: z.number(),
    projected: z.number(),
    trend: z.enum(['up', 'down', 'stable']),
  }),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
}).openapi('FinanceOverview');

// Revenue data schema
const RevenueDataSchema = z.object({
  total: z.number(),
  recurring: z.number(),
  oneTime: z.number(),
  byMonth: z.array(z.object({
    month: z.string(),
    revenue: z.number(),
  })),
  bySource: z.array(z.object({
    source: z.string(),
    amount: z.number(),
  })),
}).openapi('RevenueData');

/**
 * GET /api/finance/overview
 * Get financial overview
 */
registerRoute({
  method: 'get',
  path: '/api/finance/overview',
  tags: ['Finance'],
  summary: 'Get financial overview',
  description: 'Retrieve comprehensive financial overview including revenue, expenses, and cash flow',
  request: {
    query: z.object({
      period: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d').optional(),
    }),
  },
  responses: {
    200: {
      description: 'Financial overview',
      content: {
        'application/json': {
          schema: successResponse(FinanceOverviewSchema),
        },
      },
    },
  },
});

/**
 * GET /api/finance/revenue
 * Get revenue tracking
 */
registerRoute({
  method: 'get',
  path: '/api/finance/revenue',
  tags: ['Finance'],
  summary: 'Get revenue data',
  description: 'Retrieve detailed revenue tracking and breakdown',
  request: {
    query: z.object({
      period: z.enum(['7d', '30d', '90d', '1y', 'all']).default('30d').optional(),
    }),
  },
  responses: {
    200: {
      description: 'Revenue data',
      content: {
        'application/json': {
          schema: successResponse(RevenueDataSchema),
        },
      },
    },
  },
});

/**
 * POST /api/finance/invoices
 * Create invoice
 */
registerRoute({
  method: 'post',
  path: '/api/finance/invoices',
  tags: ['Finance'],
  summary: 'Create invoice',
  description: 'Create a new invoice',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            clientId: z.string().uuid().optional(),
            clientName: z.string().min(1),
            amount: z.number().positive(),
            currency: z.string().default('USD').optional(),
            issueDate: z.string().datetime(),
            dueDate: z.string().datetime(),
            items: z.array(z.object({
              description: z.string(),
              quantity: z.number().positive(),
              unitPrice: z.number().positive(),
            })),
            notes: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Invoice created',
      content: {
        'application/json': {
          schema: successResponse(InvoiceSchema),
        },
      },
    },
  },
});

/**
 * GET /api/finance/invoices
 * List invoices
 */
registerRoute({
  method: 'get',
  path: '/api/finance/invoices',
  tags: ['Finance'],
  summary: 'List invoices',
  description: 'Get all invoices with filtering',
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
      status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
      clientId: z.string().uuid().optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of invoices',
      content: {
        'application/json': {
          schema: paginatedResponse(InvoiceSchema),
        },
      },
    },
  },
});

/**
 * GET /api/finance/invoices/[id]
 * Get invoice
 */
registerRoute({
  method: 'get',
  path: '/api/finance/invoices/{id}',
  tags: ['Finance'],
  summary: 'Get invoice',
  description: 'Retrieve a specific invoice',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Invoice details',
      content: {
        'application/json': {
          schema: successResponse(InvoiceSchema),
        },
      },
    },
  },
});

/**
 * PUT /api/finance/invoices/[id]
 * Update invoice
 */
registerRoute({
  method: 'put',
  path: '/api/finance/invoices/{id}',
  tags: ['Finance'],
  summary: 'Update invoice',
  description: 'Update an existing invoice',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
            amount: z.number().positive().optional(),
            dueDate: z.string().datetime().optional(),
            notes: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Invoice updated',
      content: {
        'application/json': {
          schema: successResponse(InvoiceSchema),
        },
      },
    },
  },
});

/**
 * DELETE /api/finance/invoices/[id]
 * Delete invoice
 */
registerRoute({
  method: 'delete',
  path: '/api/finance/invoices/{id}',
  tags: ['Finance'],
  summary: 'Delete invoice',
  description: 'Permanently delete an invoice',
  request: {
    params: z.object({
      id: z.string().uuid(),
    }),
  },
  responses: {
    200: {
      description: 'Invoice deleted',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            deleted: z.boolean(),
          })),
        },
      },
    },
  },
});

/**
 * POST /api/finance/expenses
 * Create expense
 */
registerRoute({
  method: 'post',
  path: '/api/finance/expenses',
  tags: ['Finance'],
  summary: 'Create expense',
  description: 'Create a new expense',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            category: z.enum(['software', 'hardware', 'marketing', 'office', 'travel', 'payroll', 'other']),
            description: z.string().min(1),
            amount: z.number().positive(),
            currency: z.string().default('USD').optional(),
            date: z.string().datetime(),
            vendor: z.string().optional(),
            notes: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Expense created',
      content: {
        'application/json': {
          schema: successResponse(ExpenseSchema),
        },
      },
    },
  },
});

/**
 * GET /api/finance/expenses
 * List expenses
 */
registerRoute({
  method: 'get',
  path: '/api/finance/expenses',
  tags: ['Finance'],
  summary: 'List expenses',
  description: 'Get all expenses with filtering',
  request: {
    query: z.object({
      page: z.coerce.number().int().min(1).default(1).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
      category: z.enum(['software', 'hardware', 'marketing', 'office', 'travel', 'payroll', 'other']).optional(),
      status: z.enum(['pending', 'approved', 'rejected']).optional(),
    }),
  },
  responses: {
    200: {
      description: 'List of expenses',
      content: {
        'application/json': {
          schema: paginatedResponse(ExpenseSchema),
        },
      },
    },
  },
});

/**
 * GET /api/finance/cashflow
 * Get cash flow forecast
 */
registerRoute({
  method: 'get',
  path: '/api/finance/cashflow',
  tags: ['Finance'],
  summary: 'Get cash flow forecast',
  description: 'Retrieve cash flow analysis and projections',
  request: {
    query: z.object({
      months: z.coerce.number().int().min(1).max(12).default(6).optional(),
    }),
  },
  responses: {
    200: {
      description: 'Cash flow data',
      content: {
        'application/json': {
          schema: successResponse(z.object({
            current: z.number(),
            projected: z.array(z.object({
              month: z.string(),
              inflow: z.number(),
              outflow: z.number(),
              net: z.number(),
            })),
            insights: z.array(z.string()),
          })),
        },
      },
    },
  },
});

