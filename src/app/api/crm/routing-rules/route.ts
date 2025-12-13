import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leadRoutingRules } from '@/db/schema';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { eq, desc, asc } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

// Validation schema
const conditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in']),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
});

const createRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  criteria: z.object({
    conditions: z.array(conditionSchema).min(1, 'At least one condition is required'),
    matchType: z.enum(['all', 'any']),
  }),
  assignToUserId: z.string().uuid().optional(),
  roundRobinUserIds: z.array(z.string().uuid()).optional(),
  priority: z.number().int().optional(),
  isEnabled: z.boolean().optional(),
});

/**
 * GET /api/crm/routing-rules
 * 
 * List all lead routing rules
 */
export async function GET(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    
    // Fetch rules sorted by priority
    const rules = await db.query.leadRoutingRules.findMany({
      where: eq(leadRoutingRules.workspaceId, workspaceId),
      orderBy: [desc(leadRoutingRules.priority), asc(leadRoutingRules.createdAt)],
    });
    
    // Fetch team members for assignment options
    const teamMembers = await db.query.users.findMany({
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });
    
    // Available fields for routing conditions
    const availableFields = [
      { field: 'source', label: 'Lead Source', valueType: 'select', options: ['website', 'referral', 'linkedin', 'cold_outreach', 'event', 'partner', 'other'] },
      { field: 'industry', label: 'Industry', valueType: 'text' },
      { field: 'companySize', label: 'Company Size', valueType: 'select', options: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] },
      { field: 'score', label: 'Lead Score', valueType: 'number' },
      { field: 'estimatedValue', label: 'Estimated Value', valueType: 'number' },
      { field: 'tags', label: 'Tags', valueType: 'text' },
      { field: 'country', label: 'Country', valueType: 'text' },
      { field: 'stage', label: 'Stage', valueType: 'select', options: ['new', 'qualified', 'proposal', 'negotiation'] },
    ];
    
    return NextResponse.json({
      rules,
      teamMembers: teamMembers.map((m) => ({
        id: m.id,
        name: [m.firstName, m.lastName].filter(Boolean).join(' ') || m.email,
        email: m.email,
      })),
      availableFields,
    });
  } catch (error) {
    return createErrorResponse(error, 'List routing rules error');
  }
}

/**
 * POST /api/crm/routing-rules
 * 
 * Create a new lead routing rule
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    
    const body = await request.json();
    const validation = createRuleSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    // Require either assignToUserId or roundRobinUserIds
    if (!data.assignToUserId && (!data.roundRobinUserIds || data.roundRobinUserIds.length === 0)) {
      return NextResponse.json(
        { error: 'Must specify either a user to assign to or round-robin users' },
        { status: 400 }
      );
    }
    
    const [rule] = await db
      .insert(leadRoutingRules)
      .values({
        workspaceId,
        createdBy: user.id,
        name: data.name,
        description: data.description || null,
        criteria: data.criteria,
        assignToUserId: data.assignToUserId || null,
        roundRobinUserIds: data.roundRobinUserIds || [],
        priority: data.priority || 0,
        isEnabled: data.isEnabled ?? true,
      })
      .returning();
    
    logger.info('Created lead routing rule', { workspaceId, ruleId: rule.id, ruleName: rule.name });
    
    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Create routing rule error');
  }
}

