import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { prospects, prospectStageEnum } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { invalidateCRMCache } from '@/actions/crm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

// Type for prospect stage values
type ProspectStage = (typeof prospectStageEnum.enumValues)[number];

const dealSchema = z.object({
  name: z.string().min(1, 'Deal name is required'),
  company: z.string().optional(),
  estimatedValue: z.union([z.number(), z.string()]).optional().transform((val) => {
    if (typeof val === 'string') {
      const num = parseFloat(val);
      return isNaN(num) ? undefined : Math.round(num * 100); // Convert to cents
    }
    return val ? Math.round(val * 100) : undefined;
  }),
  stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).default('new'),
  score: z.number().min(0).max(100).optional(),
  nextFollowUpAt: z.string().optional(),
  notes: z.string().optional(),
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

    // Get all deals (prospects) for the workspace
    const dealsList = await db.query.prospects.findMany({
      where: eq(prospects.workspaceId, workspaceId),
      orderBy: [desc(prospects.createdAt)],
      limit: 200,
    });

    return NextResponse.json(dealsList);
  } catch (error) {
    return createErrorResponse(error, 'Get deals error');
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

    logger.info('Creating deal', { workspaceId, userId });

    const validationResult = dealSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn('Deal validation failed', { errors: validationResult.error.errors });
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Map API stage to database stage (stage is already validated by Zod)
    const stageMap: Record<string, ProspectStage> = {
      'lead': 'new',
      'qualified': 'qualified',
      'proposal': 'proposal',
      'negotiation': 'negotiation',
      'closed_won': 'won',
      'closed_lost': 'lost',
    };
    const dbStage: ProspectStage = stageMap[data.stage] || data.stage;

    const [deal] = await db
      .insert(prospects)
      .values({
        workspaceId,
        name: data.name,
        company: data.company || null,
        estimatedValue: data.estimatedValue || null,
        stage: dbStage,
        score: data.score || 0,
        nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : null,
        notes: data.notes || null,
      })
      .returning();

    logger.info('Deal created successfully', { dealId: deal.id, workspaceId });

    // Invalidate cache in background (non-blocking)
    invalidateCRMCache(userId).catch(err => {
      logger.error('Cache invalidation failed (non-critical):', err);
    });

    return NextResponse.json({
      id: deal.id,
      name: deal.name,
      company: deal.company,
      estimatedValue: deal.estimatedValue,
      stage: deal.stage,
      score: deal.score,
      nextFollowUpAt: deal.nextFollowUpAt,
      notes: deal.notes,
      createdAt: deal.createdAt,
    }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Create deal error');
  }
}


