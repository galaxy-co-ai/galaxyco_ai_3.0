import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { prospects } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { invalidateCRMCache } from '@/actions/crm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

const prospectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).default('new'),
  estimatedValue: z.union([z.number(), z.string()]).optional().transform((val) => {
    if (typeof val === 'string') {
      const num = parseFloat(val);
      return isNaN(num) ? undefined : Math.round(num * 100); // Convert to cents
    }
    return val ? Math.round(val * 100) : undefined;
  }),
  source: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Get all prospects (leads) for the workspace
    const prospectsList = await db.query.prospects.findMany({
      where: eq(prospects.workspaceId, workspaceId),
      orderBy: [desc(prospects.createdAt)],
      limit: 200, // Increased limit for larger datasets
    });

    return NextResponse.json(prospectsList);
  } catch (error) {
    return createErrorResponse(error, 'Get prospects error');
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const body = await request.json();

    logger.info('Creating prospect', { workspaceId, userId });

    // Validate input
    const validationResult = prospectSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn('Prospect validation failed', { errors: validationResult.error.errors });
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create prospect/lead
    const [prospect] = await db
      .insert(prospects)
      .values({
        workspaceId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        title: data.title || null,
        stage: data.stage || 'new',
        estimatedValue: data.estimatedValue || null,
        source: data.source || null,
        notes: data.notes || null,
        tags: data.tags || [],
      })
      .returning();

    logger.info('Prospect created successfully', { prospectId: prospect.id, workspaceId });

    // Invalidate cache in background (non-blocking) - don't wait for it
    invalidateCRMCache(userId).catch(err => {
      logger.error('Cache invalidation failed (non-critical):', err);
    });

    return NextResponse.json({
      id: prospect.id,
      name: prospect.name,
      email: prospect.email,
      phone: prospect.phone,
      company: prospect.company,
      title: prospect.title,
      stage: prospect.stage,
      estimatedValue: prospect.estimatedValue,
      source: prospect.source,
      notes: prospect.notes,
      tags: prospect.tags,
      createdAt: prospect.createdAt,
    }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Create prospect error');
  }
}

