import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leadScoringRules, leadScoringTiers } from '@/db/schema';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { eq, desc, asc } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

// Validation schemas
const createRuleSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['property', 'behavior', 'engagement', 'demographic', 'firmographic']),
  field: z.string().min(1, 'Field is required'),
  operator: z.enum([
    'equals', 'not_equals', 'contains', 'not_contains',
    'greater_than', 'less_than', 'between', 'is_set', 'is_not_set',
  ]),
  value: z.string().optional(),
  valueSecondary: z.string().optional(),
  scoreChange: z.number().int(),
  priority: z.number().int().optional(),
  isEnabled: z.boolean().optional(),
});

/**
 * GET /api/crm/scoring-rules
 * 
 * List all lead scoring rules and tiers
 */
export async function GET(request: NextRequest) {
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

    // Fetch rules sorted by priority
    const rules = await db.query.leadScoringRules.findMany({
      where: eq(leadScoringRules.workspaceId, workspaceId),
      orderBy: [desc(leadScoringRules.priority), asc(leadScoringRules.createdAt)],
    });
    
    // Fetch tiers sorted by minScore
    const tiers = await db.query.leadScoringTiers.findMany({
      where: eq(leadScoringTiers.workspaceId, workspaceId),
      orderBy: [desc(leadScoringTiers.minScore)],
    });
    
    // If no tiers exist, return default tiers
    const defaultTiers = tiers.length > 0 ? tiers : [
      { id: 'default-a', name: 'A - Hot Lead', minScore: 80, maxScore: 100, color: 'red' },
      { id: 'default-b', name: 'B - Warm Lead', minScore: 60, maxScore: 79, color: 'orange' },
      { id: 'default-c', name: 'C - Interested', minScore: 40, maxScore: 59, color: 'yellow' },
      { id: 'default-d', name: 'D - Nurture', minScore: 0, maxScore: 39, color: 'gray' },
    ];
    
    // Available fields for rules
    const availableFields = [
      { field: 'companySize', label: 'Company Size', type: 'firmographic', valueType: 'select', options: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+', 'Enterprise'] },
      { field: 'industry', label: 'Industry', type: 'firmographic', valueType: 'text' },
      { field: 'title', label: 'Job Title', type: 'demographic', valueType: 'text' },
      { field: 'seniority', label: 'Seniority', type: 'demographic', valueType: 'select', options: ['Entry', 'Mid', 'Senior', 'Manager', 'Director', 'VP', 'C-Level'] },
      { field: 'emailOpens', label: 'Email Opens', type: 'behavior', valueType: 'number' },
      { field: 'emailClicks', label: 'Email Clicks', type: 'behavior', valueType: 'number' },
      { field: 'websiteVisits', label: 'Website Visits', type: 'behavior', valueType: 'number' },
      { field: 'pageViews', label: 'Page Views', type: 'behavior', valueType: 'number' },
      { field: 'formSubmissions', label: 'Form Submissions', type: 'behavior', valueType: 'number' },
      { field: 'lastActivityDays', label: 'Days Since Last Activity', type: 'engagement', valueType: 'number' },
      { field: 'demoRequested', label: 'Demo Requested', type: 'engagement', valueType: 'boolean' },
      { field: 'trialStarted', label: 'Trial Started', type: 'engagement', valueType: 'boolean' },
      { field: 'hasPhone', label: 'Has Phone Number', type: 'property', valueType: 'boolean' },
      { field: 'hasLinkedIn', label: 'Has LinkedIn Profile', type: 'property', valueType: 'boolean' },
      { field: 'budget', label: 'Budget', type: 'property', valueType: 'number' },
      { field: 'source', label: 'Lead Source', type: 'property', valueType: 'text' },
      { field: 'tags', label: 'Tags', type: 'property', valueType: 'text' },
    ];
    
    return NextResponse.json({
      rules,
      tiers: defaultTiers,
      availableFields,
      baseScore: 50, // Starting score for all leads
    });
  } catch (error) {
    return createErrorResponse(error, 'List scoring rules error');
  }
}

/**
 * POST /api/crm/scoring-rules
 * 
 * Create a new lead scoring rule
 */
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

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
    const validation = createRuleSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    
    const [rule] = await db
      .insert(leadScoringRules)
      .values({
        workspaceId,
        createdBy: user.id,
        name: data.name,
        description: data.description || null,
        type: data.type,
        field: data.field,
        operator: data.operator,
        value: data.value || null,
        valueSecondary: data.valueSecondary || null,
        scoreChange: data.scoreChange,
        priority: data.priority || 0,
        isEnabled: data.isEnabled ?? true,
      })
      .returning();
    
    logger.info('Created lead scoring rule', { workspaceId, ruleId: rule.id, ruleName: rule.name });
    
    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Create scoring rule error');
  }
}

