import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { segments, contacts } from '@/db/schema';
import { eq, and, sql, desc } from 'drizzle-orm';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { createErrorResponse } from '@/lib/api-error-handler';

// Schema for segment criteria
const segmentRuleSchema = z.object({
  field: z.string(),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'starts_with', 'ends_with', 'greater_than', 'less_than', 'is_empty', 'is_not_empty', 'in', 'not_in']),
  value: z.any(),
});

const segmentCriteriaSchema = z.object({
  rules: z.array(segmentRuleSchema),
  logic: z.enum(['and', 'or']).optional().default('and'),
});

const createSegmentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  criteria: segmentCriteriaSchema,
});

// GET /api/crm/segments - List all segments
export async function GET() {
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

    const allSegments = await db.query.segments.findMany({
      where: eq(segments.workspaceId, workspaceId),
      orderBy: [desc(segments.createdAt)],
    });

    return NextResponse.json({ segments: allSegments });
  } catch (error) {
    return createErrorResponse(error, 'Fetch segments error');
  }
}

// POST /api/crm/segments - Create a new segment
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, user, userId } = await getCurrentWorkspace();

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
    const parsed = createSegmentSchema.safeParse(body);

    if (!parsed.success) {
      return createErrorResponse(new Error('Validation failed: invalid segment data'), 'Create segment');
    }

    const { name, description, criteria } = parsed.data;

    // Cast criteria to database format
    const criteriaForDb = {
      rules: criteria.rules.map(r => ({ field: r.field, operator: r.operator, value: r.value ?? null })),
      logic: criteria.logic,
    } as { rules: Array<{ field: string; operator: string; value: unknown }>; logic?: 'and' | 'or' };

    // Calculate initial member count
    const memberCount = await calculateSegmentMemberCount(workspaceId, criteriaForDb);

    // Create segment
    const [newSegment] = await db
      .insert(segments)
      .values({
        workspaceId,
        name,
        description,
        criteria: criteriaForDb,
        memberCount,
        lastCalculatedAt: new Date(),
        createdBy: user!.id,
      })
      .returning();

    return NextResponse.json({ segment: newSegment }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Create segment error');
  }
}

type CriteriaType = { rules: Array<{ field: string; operator: string; value: unknown }>; logic?: 'and' | 'or' };

// Helper function to calculate segment member count
async function calculateSegmentMemberCount(
  workspaceId: string,
  criteria: CriteriaType
): Promise<number> {
  try {
    // Build query conditions from criteria
    const conditions = criteria.rules.map((rule) => {
      const { field, operator, value } = rule;
      
      switch (operator) {
        case 'equals':
          return sql`${sql.raw(`"${field}"`)} = ${value}`;
        case 'not_equals':
          return sql`${sql.raw(`"${field}"`)} != ${value}`;
        case 'contains':
          return sql`${sql.raw(`"${field}"`)} ILIKE ${'%' + value + '%'}`;
        case 'not_contains':
          return sql`${sql.raw(`"${field}"`)} NOT ILIKE ${'%' + value + '%'}`;
        case 'starts_with':
          return sql`${sql.raw(`"${field}"`)} ILIKE ${value + '%'}`;
        case 'ends_with':
          return sql`${sql.raw(`"${field}"`)} ILIKE ${'%' + value}`;
        case 'greater_than':
          return sql`${sql.raw(`"${field}"`)} > ${value}`;
        case 'less_than':
          return sql`${sql.raw(`"${field}"`)} < ${value}`;
        case 'is_empty':
          return sql`${sql.raw(`"${field}"`)} IS NULL OR ${sql.raw(`"${field}"`)} = ''`;
        case 'is_not_empty':
          return sql`${sql.raw(`"${field}"`)} IS NOT NULL AND ${sql.raw(`"${field}"`)} != ''`;
        case 'in':
          return sql`${sql.raw(`"${field}"`)} = ANY(${value})`;
        case 'not_in':
          return sql`NOT (${sql.raw(`"${field}"`)} = ANY(${value}))`;
        default:
          return sql`true`;
      }
    });

    if (conditions.length === 0) {
      // No criteria, count all contacts
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(contacts)
        .where(eq(contacts.workspaceId, workspaceId));
      return result[0]?.count ?? 0;
    }

    // Combine conditions with AND or OR
    const combinedCondition = criteria.logic === 'or'
      ? sql`(${sql.join(conditions, sql` OR `)})`
      : sql`(${sql.join(conditions, sql` AND `)})`;

    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(contacts)
      .where(and(eq(contacts.workspaceId, workspaceId), combinedCondition));

    return result[0]?.count ?? 0;
  } catch (error) {
    console.error('Error calculating segment count:', error);
    return 0;
  }
}
