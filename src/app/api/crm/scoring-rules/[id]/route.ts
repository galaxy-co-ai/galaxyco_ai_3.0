import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leadScoringRules } from '@/db/schema';
import { getCurrentWorkspace } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

const updateRuleSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(['property', 'behavior', 'engagement', 'demographic', 'firmographic']).optional(),
  field: z.string().min(1).optional(),
  operator: z.enum([
    'equals', 'not_equals', 'contains', 'not_contains',
    'greater_than', 'less_than', 'between', 'is_set', 'is_not_set',
  ]).optional(),
  value: z.string().nullable().optional(),
  valueSecondary: z.string().nullable().optional(),
  scoreChange: z.number().int().optional(),
  priority: z.number().int().optional(),
  isEnabled: z.boolean().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/crm/scoring-rules/[id]
 * 
 * Get a single scoring rule
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await context.params;
    
    const rule = await db.query.leadScoringRules.findFirst({
      where: and(
        eq(leadScoringRules.id, id),
        eq(leadScoringRules.workspaceId, workspaceId)
      ),
    });
    
    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }
    
    return NextResponse.json({ rule });
  } catch (error) {
    return createErrorResponse(error, 'Get scoring rule error');
  }
}

/**
 * PUT /api/crm/scoring-rules/[id]
 * 
 * Update a scoring rule
 */
export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await context.params;
    
    const body = await request.json();
    const validation = updateRuleSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Build update object, only including provided fields
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.field !== undefined) updateData.field = data.field;
    if (data.operator !== undefined) updateData.operator = data.operator;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.valueSecondary !== undefined) updateData.valueSecondary = data.valueSecondary;
    if (data.scoreChange !== undefined) updateData.scoreChange = data.scoreChange;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.isEnabled !== undefined) updateData.isEnabled = data.isEnabled;
    
    const [rule] = await db
      .update(leadScoringRules)
      .set(updateData)
      .where(
        and(
          eq(leadScoringRules.id, id),
          eq(leadScoringRules.workspaceId, workspaceId)
        )
      )
      .returning();
    
    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }
    
    logger.info('Updated lead scoring rule', { workspaceId, ruleId: id });
    
    return NextResponse.json({ rule });
  } catch (error) {
    return createErrorResponse(error, 'Update scoring rule error');
  }
}

/**
 * DELETE /api/crm/scoring-rules/[id]
 * 
 * Delete a scoring rule
 */
export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { id } = await context.params;
    
    const [deleted] = await db
      .delete(leadScoringRules)
      .where(
        and(
          eq(leadScoringRules.id, id),
          eq(leadScoringRules.workspaceId, workspaceId)
        )
      )
      .returning({ id: leadScoringRules.id });
    
    if (!deleted) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }
    
    logger.info('Deleted lead scoring rule', { workspaceId, ruleId: id });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Delete scoring rule error');
  }
}

