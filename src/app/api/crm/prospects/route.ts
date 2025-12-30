import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { prospects } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { invalidateCRMCache } from '@/actions/crm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

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
    const { workspaceId, userId } = await getCurrentWorkspace();

    const rateLimitResult = await rateLimit(`crm:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

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

    const rateLimitResult = await rateLimit(`crm:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

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

    // Fire proactive event for new lead
    const { fireEvent } = await import('@/lib/ai/event-hooks');
    fireEvent({
      type: 'lead_created',
      workspaceId,
      userId,
      leadId: prospect.id,
    }).catch(err => {
      logger.error('Failed to fire lead created event (non-critical):', err);
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

