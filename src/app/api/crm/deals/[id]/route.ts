import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { prospects, prospectStageEnum } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { invalidateCRMCache } from '@/actions/crm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

// Type for prospect stage values
type ProspectStage = (typeof prospectStageEnum.enumValues)[number];

const updateDealSchema = z.object({
  name: z.string().min(1).optional(),
  company: z.string().optional(),
  estimatedValue: z.union([z.number(), z.string()]).optional().transform((val) => {
    if (typeof val === 'string') {
      const num = parseFloat(val);
      return isNaN(num) ? undefined : Math.round(num * 100); // Convert to cents
    }
    return val ? Math.round(val * 100) : undefined;
  }),
  stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']).optional(),
  score: z.number().min(0).max(100).optional(),
  nextFollowUpAt: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: dealId } = await params;

    const deal = await db.query.prospects.findFirst({
      where: and(
        eq(prospects.id, dealId),
        eq(prospects.workspaceId, workspaceId)
      ),
    });

    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(deal);
  } catch (error) {
    return createErrorResponse(error, 'Get deal error');
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: dealId } = await params;
    const body = await request.json();

    logger.info('Updating deal', { dealId, workspaceId, userId });

    // Validate input
    const validationResult = updateDealSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn('Deal validation failed', { errors: validationResult.error.errors });
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Check if deal exists and belongs to workspace
    const existing = await db.query.prospects.findFirst({
      where: and(
        eq(prospects.id, dealId),
        eq(prospects.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    const data = validationResult.data;

    // Map API stage to database stage if provided
    const stageMap: Record<string, ProspectStage> = {
      'lead': 'new',
      'qualified': 'qualified',
      'proposal': 'proposal',
      'negotiation': 'negotiation',
      'closed_won': 'won',
      'closed_lost': 'lost',
    };
    const dbStage: ProspectStage | undefined = data.stage ? (stageMap[data.stage] || data.stage as ProspectStage) : undefined;

    // Update deal
    const [updated] = await db
      .update(prospects)
      .set({
        name: data.name,
        company: data.company ?? undefined,
        estimatedValue: data.estimatedValue ?? undefined,
        stage: dbStage,
        score: data.score ?? undefined,
        nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt) : undefined,
        notes: data.notes ?? undefined,
        tags: data.tags ?? undefined,
        updatedAt: new Date(),
      })
      .where(and(
        eq(prospects.id, dealId),
        eq(prospects.workspaceId, workspaceId)
      ))
      .returning();

    logger.info('Deal updated successfully', { dealId, workspaceId });

    // Invalidate cache
    await invalidateCRMCache(userId);

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      company: updated.company,
      estimatedValue: updated.estimatedValue,
      stage: updated.stage,
      score: updated.score,
      nextFollowUpAt: updated.nextFollowUpAt,
      notes: updated.notes,
      tags: updated.tags,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    return createErrorResponse(error, 'Update deal error');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: dealId } = await params;

    logger.info('Deleting deal', { dealId, workspaceId, userId });

    // Check if deal exists
    const existing = await db.query.prospects.findFirst({
      where: and(
        eq(prospects.id, dealId),
        eq(prospects.workspaceId, workspaceId)
      ),
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    // Delete deal
    await db
      .delete(prospects)
      .where(and(
        eq(prospects.id, dealId),
        eq(prospects.workspaceId, workspaceId)
      ));

    logger.info('Deal deleted successfully', { dealId, workspaceId });

    // Invalidate cache
    await invalidateCRMCache(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete deal error');
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: dealId } = await params;
    const body = await request.json();

    // Support stage-only updates for drag-and-drop
    if (body.stage) {
      const stageSchema = z.object({
        stage: z.enum(['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
      });

      const validationResult = stageSchema.safeParse(body);
      if (!validationResult.success) {
        return NextResponse.json(
          { error: 'Invalid stage', details: validationResult.error.errors },
          { status: 400 }
        );
      }

      // Check if deal exists
      const existing = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, dealId),
          eq(prospects.workspaceId, workspaceId)
        ),
      });

      if (!existing) {
        return NextResponse.json(
          { error: 'Deal not found' },
          { status: 404 }
        );
      }

      // Update stage only (validated by Zod to be a valid ProspectStage)
      const [updated] = await db
        .update(prospects)
        .set({
          stage: validationResult.data.stage,
          updatedAt: new Date(),
        })
        .where(and(
          eq(prospects.id, dealId),
          eq(prospects.workspaceId, workspaceId)
        ))
        .returning();

      // Invalidate cache
      await invalidateCRMCache(userId);

      return NextResponse.json({ success: true, stage: updated.stage });
    }

    // Otherwise, use full update logic
    return PUT(request, { params });
  } catch (error) {
    return createErrorResponse(error, 'Patch deal error');
  }
}
