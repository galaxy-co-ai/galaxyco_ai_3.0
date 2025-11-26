import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { invalidateCRMCache } from '@/actions/crm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  website: z.string().optional(),
  status: z.enum(['lead', 'active', 'inactive', 'churned', 'prospect', 'customer', 'partner']).default('lead').transform((val) => {
    // Map invalid enum values to valid ones for database
    if (val === 'prospect' || val === 'customer') return 'active';
    if (val === 'partner') return 'active';
    return val as 'lead' | 'active' | 'inactive' | 'churned';
  }),
  industry: z.string().optional(),
  size: z.string().optional(),
  revenue: z.union([z.number(), z.string()]).optional().transform((val) => {
    if (typeof val === 'string') {
      const num = parseFloat(val);
      return isNaN(num) ? undefined : Math.round(num * 100); // Convert to cents
    }
    return val ? Math.round(val * 100) : undefined;
  }),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Get all customers (organizations) for the workspace
    const customersList = await db.query.customers.findMany({
      where: eq(customers.workspaceId, workspaceId),
      orderBy: [desc(customers.createdAt)],
      limit: 200,
    });

    return NextResponse.json(customersList);
  } catch (error) {
    return createErrorResponse(error, 'Get customers error');
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const body = await request.json();

    logger.info('Creating customer', { workspaceId, userId });

    // Validate input
    const validationResult = customerSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn('Customer validation failed', { errors: validationResult.error.errors });
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create customer/organization
    const [customer] = await db
      .insert(customers)
      .values({
        workspaceId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        website: data.website || null,
        status: data.status || 'lead',
        industry: data.industry || null,
        size: data.size || null,
        revenue: data.revenue || null,
        notes: data.notes || null,
        tags: data.tags || [],
      })
      .returning();

    logger.info('Customer created successfully', { customerId: customer.id, workspaceId });

    // Invalidate cache in background (non-blocking)
    invalidateCRMCache(userId).catch(err => {
      logger.error('Cache invalidation failed (non-critical):', err);
    });

    return NextResponse.json({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      website: customer.website,
      status: customer.status,
      industry: customer.industry,
      size: customer.size,
      revenue: customer.revenue,
      notes: customer.notes,
      tags: customer.tags,
      createdAt: customer.createdAt,
    }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Create customer error');
  }
}

