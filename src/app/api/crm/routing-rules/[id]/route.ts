import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leadRoutingRules } from '@/db/schema';
import { getCurrentWorkspace } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

const conditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in']),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
});

const updateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  criteria: z.object({
    conditions: z.array(conditionSchema).min(1),
    matchType: z.enum(['all', 'any']),
  }).optional(),
  assignToUserId: z.string().uuid().nullable().optional(),
  roundRobinUserIds: z.array(z.string().uuid()).optional(),
  priority: z.number().int().optional(),
  isEnabled: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/crm/routing-rules/[id]
 */
export async function GET(request: NextRequest, context: RouteParams) {
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

    const { id } = await context.params;

    const rule = await db.query.leadRoutingRules.findFirst({
      where: and(
        eq(leadRoutingRules.id, id),
        eq(leadRoutingRules.workspaceId, workspaceId)
      ),
    });
    
    if (!rule) {
      return createErrorResponse(new Error('Routing rule not found'), 'Get routing rule');
    }

    return NextResponse.json({ rule });
  } catch (error) {
    return createErrorResponse(error, 'Get routing rule error');
  }
}

/**
 * PUT /api/crm/routing-rules/[id]
 */
export async function PUT(request: NextRequest, context: RouteParams) {
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

    const { id } = await context.params;

    const body = await request.json();
    const validation = updateRuleSchema.safeParse(body);
    
    if (!validation.success) {
      return createErrorResponse(new Error('Validation failed: invalid routing rule data'), 'Update routing rule');
    }
    
    const data = validation.data;
    
    // Build update object
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.criteria !== undefined) updateData.criteria = data.criteria;
    if (data.assignToUserId !== undefined) updateData.assignToUserId = data.assignToUserId;
    if (data.roundRobinUserIds !== undefined) updateData.roundRobinUserIds = data.roundRobinUserIds;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;
    
    const [rule] = await db
      .update(leadRoutingRules)
      .set(updateData)
      .where(
        and(
          eq(leadRoutingRules.id, id),
          eq(leadRoutingRules.workspaceId, workspaceId)
        )
      )
      .returning();
    
    if (!rule) {
      return createErrorResponse(new Error('Routing rule not found'), 'Update routing rule');
    }

    logger.info('Updated lead routing rule', { workspaceId, ruleId: id });
    
    return NextResponse.json({ rule });
  } catch (error) {
    return createErrorResponse(error, 'Update routing rule error');
  }
}

/**
 * DELETE /api/crm/routing-rules/[id]
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
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

    const { id } = await context.params;

    const [deleted] = await db
      .delete(leadRoutingRules)
      .where(
        and(
          eq(leadRoutingRules.id, id),
          eq(leadRoutingRules.workspaceId, workspaceId)
        )
      )
      .returning({ id: leadRoutingRules.id });
    
    if (!deleted) {
      return createErrorResponse(new Error('Routing rule not found'), 'Delete routing rule');
    }

    logger.info('Deleted lead routing rule', { workspaceId, ruleId: id });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete routing rule error');
  }
}

