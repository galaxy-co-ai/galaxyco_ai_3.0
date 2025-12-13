import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { expenses } from '@/db/schema';
import { getCurrentWorkspace } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';

const updateExpenseSchema = z.object({
  description: z.string().min(1).optional(),
  category: z.enum([
    'travel', 'meals', 'supplies', 'software', 'hardware', 
    'marketing', 'payroll', 'utilities', 'rent', 'insurance', 
    'professional_services', 'other'
  ]).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  taxAmount: z.number().min(0).optional(),
  vendor: z.string().optional(),
  vendorId: z.string().uuid().nullable().optional(),
  projectId: z.string().uuid().nullable().optional(),
  customerId: z.string().uuid().nullable().optional(),
  expenseDate: z.string().transform((s) => new Date(s)).optional(),
  dueDate: z.string().transform((s) => new Date(s)).nullable().optional(),
  paymentMethod: z.string().nullable().optional(),
  referenceNumber: z.string().nullable().optional(),
  receiptUrl: z.string().url().nullable().optional(),
  isReimbursable: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
  // Status updates (for approval workflow)
  status: z.enum(['pending', 'approved', 'rejected', 'reimbursed']).optional(),
  rejectionReason: z.string().optional(),
});

/**
 * GET /api/finance/expenses/[id]
 * Get a single expense
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    
    if (!workspaceId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const expense = await db.query.expenses.findFirst({
      where: and(eq(expenses.id, id), eq(expenses.workspaceId, workspaceId)),
      with: {
        submittedByUser: {
          columns: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
        },
        approvedByUser: {
          columns: { id: true, firstName: true, lastName: true, email: true },
        },
        project: {
          columns: { id: true, name: true },
        },
        vendor: {
          columns: { id: true, name: true, email: true },
        },
        customer: {
          columns: { id: true, name: true },
        },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json({ expense });
  } catch (error) {
    logger.error('Error fetching expense', error);
    return NextResponse.json({ error: 'Failed to fetch expense' }, { status: 500 });
  }
}

/**
 * PATCH /api/finance/expenses/[id]
 * Update an expense
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    
    if (!workspaceId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateExpenseSchema.parse(body);

    // Check expense exists and belongs to workspace
    const existing = await db.query.expenses.findFirst({
      where: and(eq(expenses.id, id), eq(expenses.workspaceId, workspaceId)),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Build update object
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    
    if (validated.description !== undefined) updates.description = validated.description;
    if (validated.category !== undefined) updates.category = validated.category;
    if (validated.amount !== undefined) updates.amount = Math.round(validated.amount * 100);
    if (validated.currency !== undefined) updates.currency = validated.currency;
    if (validated.taxAmount !== undefined) updates.taxAmount = Math.round(validated.taxAmount * 100);
    if (validated.vendor !== undefined) updates.vendor = validated.vendor;
    if (validated.vendorId !== undefined) updates.vendorId = validated.vendorId;
    if (validated.projectId !== undefined) updates.projectId = validated.projectId;
    if (validated.customerId !== undefined) updates.customerId = validated.customerId;
    if (validated.expenseDate !== undefined) updates.expenseDate = validated.expenseDate;
    if (validated.dueDate !== undefined) updates.dueDate = validated.dueDate;
    if (validated.paymentMethod !== undefined) updates.paymentMethod = validated.paymentMethod;
    if (validated.referenceNumber !== undefined) updates.referenceNumber = validated.referenceNumber;
    if (validated.receiptUrl !== undefined) updates.receiptUrl = validated.receiptUrl;
    if (validated.isReimbursable !== undefined) updates.isReimbursable = validated.isReimbursable;
    if (validated.tags !== undefined) updates.tags = validated.tags;
    if (validated.notes !== undefined) updates.notes = validated.notes;
    
    // Handle status changes (approval workflow)
    if (validated.status !== undefined) {
      updates.status = validated.status;
      
      if (validated.status === 'approved') {
        updates.approvedBy = userId;
        updates.approvedAt = new Date();
        updates.rejectionReason = null;
      } else if (validated.status === 'rejected') {
        updates.approvedBy = userId;
        updates.approvedAt = new Date();
        updates.rejectionReason = validated.rejectionReason || null;
      } else if (validated.status === 'reimbursed') {
        updates.reimbursedAt = new Date();
        updates.reimbursementAmount = existing.amount;
      }
    }

    const [updatedExpense] = await db
      .update(expenses)
      .set(updates)
      .where(and(eq(expenses.id, id), eq(expenses.workspaceId, workspaceId)))
      .returning();

    logger.info('Expense updated', { expenseId: id, userId, updates: Object.keys(updates) });

    return NextResponse.json({ expense: updatedExpense });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    logger.error('Error updating expense', error);
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
  }
}

/**
 * DELETE /api/finance/expenses/[id]
 * Delete an expense
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    
    if (!workspaceId || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check expense exists
    const existing = await db.query.expenses.findFirst({
      where: and(eq(expenses.id, id), eq(expenses.workspaceId, workspaceId)),
    });

    if (!existing) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Only allow deletion of pending expenses
    if (existing.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending expenses can be deleted' },
        { status: 400 }
      );
    }

    await db
      .delete(expenses)
      .where(and(eq(expenses.id, id), eq(expenses.workspaceId, workspaceId)));

    logger.info('Expense deleted', { expenseId: id, userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting expense', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}
