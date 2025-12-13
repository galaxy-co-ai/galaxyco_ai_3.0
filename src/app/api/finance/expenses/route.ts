import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { expenses } from '@/db/schema';
import { getCurrentWorkspace } from '@/lib/auth';
import { eq, desc, asc, and, ilike, sql, gte, lte } from 'drizzle-orm';
import { logger } from '@/lib/logger';

const createExpenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  category: z.enum([
    'travel', 'meals', 'supplies', 'software', 'hardware', 
    'marketing', 'payroll', 'utilities', 'rent', 'insurance', 
    'professional_services', 'other'
  ]),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('USD'),
  taxAmount: z.number().min(0).optional(),
  vendor: z.string().optional(),
  vendorId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  expenseDate: z.string().transform((s) => new Date(s)),
  dueDate: z.string().transform((s) => new Date(s)).optional(),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  isReimbursable: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/finance/expenses
 * List expenses with filtering, sorting, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    
    if (!workspaceId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') as 'pending' | 'approved' | 'rejected' | 'reimbursed' | null;
    const category = searchParams.get('category');
    const sortBy = searchParams.get('sortBy') || 'expenseDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build conditions
    const conditions = [eq(expenses.workspaceId, workspaceId)];
    
    if (search) {
      conditions.push(ilike(expenses.description, `%${search}%`));
    }
    
    if (status) {
      conditions.push(eq(expenses.status, status));
    }
    
    if (category) {
      conditions.push(eq(expenses.category, category as typeof expenses.category.enumValues[number]));
    }
    
    if (startDate) {
      conditions.push(gte(expenses.expenseDate, new Date(startDate)));
    }
    
    if (endDate) {
      conditions.push(lte(expenses.expenseDate, new Date(endDate)));
    }

    // Build sort
    const sortColumn = sortBy === 'amount' ? expenses.amount 
      : sortBy === 'createdAt' ? expenses.createdAt 
      : expenses.expenseDate;
    const orderFn = sortOrder === 'asc' ? asc : desc;

    // Fetch expenses
    const expenseList = await db.query.expenses.findMany({
      where: and(...conditions),
      orderBy: [orderFn(sortColumn)],
      limit,
      offset,
      with: {
        submittedByUser: {
          columns: { id: true, firstName: true, lastName: true, avatarUrl: true },
        },
        approvedByUser: {
          columns: { id: true, firstName: true, lastName: true },
        },
        project: {
          columns: { id: true, name: true },
        },
        vendor: {
          columns: { id: true, name: true },
        },
      },
    });

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(expenses)
      .where(and(...conditions));

    // Get summary stats
    const [stats] = await db
      .select({
        totalAmount: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
        pendingCount: sql<number>`count(*) filter (where ${expenses.status} = 'pending')`,
        approvedCount: sql<number>`count(*) filter (where ${expenses.status} = 'approved')`,
        reimbursedAmount: sql<number>`coalesce(sum(${expenses.amount}) filter (where ${expenses.status} = 'reimbursed'), 0)`,
      })
      .from(expenses)
      .where(eq(expenses.workspaceId, workspaceId));

    return NextResponse.json({
      expenses: expenseList,
      total: Number(count),
      stats: {
        totalAmount: Number(stats.totalAmount),
        pendingCount: Number(stats.pendingCount),
        approvedCount: Number(stats.approvedCount),
        reimbursedAmount: Number(stats.reimbursedAmount),
      },
    });
  } catch (error) {
    logger.error('Error fetching expenses', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

/**
 * POST /api/finance/expenses
 * Create a new expense
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    
    if (!workspaceId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createExpenseSchema.parse(body);

    const [newExpense] = await db
      .insert(expenses)
      .values({
        workspaceId,
        description: validated.description,
        category: validated.category,
        status: 'pending',
        amount: Math.round(validated.amount * 100), // Convert to cents
        currency: validated.currency,
        taxAmount: validated.taxAmount ? Math.round(validated.taxAmount * 100) : 0,
        vendor: validated.vendor,
        vendorId: validated.vendorId,
        projectId: validated.projectId,
        customerId: validated.customerId,
        expenseDate: validated.expenseDate,
        dueDate: validated.dueDate,
        paymentMethod: validated.paymentMethod,
        referenceNumber: validated.referenceNumber,
        receiptUrl: validated.receiptUrl,
        isReimbursable: validated.isReimbursable ?? false,
        tags: validated.tags ?? [],
        notes: validated.notes,
        submittedBy: userId,
      })
      .returning();

    logger.info('Expense created', { expenseId: newExpense.id, userId });

    return NextResponse.json({ expense: newExpense }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('Error creating expense', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}
