import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leadScoringRules, leadScoringTiers } from '@/db/schema';
import { getCurrentWorkspace } from '@/lib/auth';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

const scoreSchema = z.object({
  contactId: z.string().uuid(),
  data: z.record(z.unknown()).optional(),
});

// Default tiers when none configured
const DEFAULT_TIERS = [
  { name: 'A - Hot Lead', minScore: 80, maxScore: 100, color: 'red' },
  { name: 'B - Warm Lead', minScore: 60, maxScore: 79, color: 'orange' },
  { name: 'C - Interested', minScore: 40, maxScore: 59, color: 'yellow' },
  { name: 'D - Nurture', minScore: 0, maxScore: 39, color: 'gray' },
];

const BASE_SCORE = 50;

/**
 * POST /api/crm/score
 * Calculate a lead score for a contact using dynamic rules
 */
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

    const validationResult = scoreSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { contactId, data } = validationResult.data;

    // Fetch enabled scoring rules, sorted by priority
    const rules = await db.query.leadScoringRules.findMany({
      where: and(
        eq(leadScoringRules.workspaceId, workspaceId),
        eq(leadScoringRules.isEnabled, true)
      ),
      orderBy: [desc(leadScoringRules.priority)],
    });

    // Fetch tiers
    const tiers = await db.query.leadScoringTiers.findMany({
      where: eq(leadScoringTiers.workspaceId, workspaceId),
      orderBy: [desc(leadScoringTiers.minScore)],
    });
    
    const activeTiers = tiers.length > 0 ? tiers : DEFAULT_TIERS;

    // Start with base score
    let score = BASE_SCORE;
    const appliedRules: Array<{ ruleName: string; scoreChange: number; matched: boolean }> = [];

    // Apply each rule
    if (data && rules.length > 0) {
      for (const rule of rules) {
        const matched = evaluateRule(rule, data);
        appliedRules.push({
          ruleName: rule.name,
          scoreChange: matched ? rule.scoreChange : 0,
          matched,
        });
        
        if (matched) {
          score += rule.scoreChange;
        }
      }
    } else if (data) {
      // Fallback to default scoring if no rules configured
      score = calculateDefaultScore(data, score);
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Determine tier
    let tier = activeTiers.find((t) => score >= t.minScore && score <= t.maxScore);
    if (!tier) {
      tier = activeTiers[activeTiers.length - 1]; // Default to lowest tier
    }

    logger.info('Lead score calculated', { 
      contactId, 
      score, 
      tier: tier?.name,
      rulesApplied: appliedRules.filter(r => r.matched).length,
    });

    return NextResponse.json({
      contactId,
      score,
      tier: tier?.name || 'D - Nurture',
      tierColor: tier?.color || 'gray',
      baseScore: BASE_SCORE,
      appliedRules,
      rulesUsed: rules.length > 0 ? 'custom' : 'default',
    });
  } catch (error) {
    return createErrorResponse(error, 'Calculate lead score error');
  }
}

/**
 * Evaluate a single rule against the provided data
 */
function evaluateRule(
  rule: { field: string; operator: string; value: string | null; valueSecondary: string | null },
  data: Record<string, unknown>
): boolean {
  const fieldValue = data[rule.field];
  const ruleValue = rule.value;
  
  switch (rule.operator) {
    case 'is_set':
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
      
    case 'is_not_set':
      return fieldValue === undefined || fieldValue === null || fieldValue === '';
      
    case 'equals':
      if (typeof fieldValue === 'boolean') {
        return fieldValue === (ruleValue === 'true');
      }
      return String(fieldValue).toLowerCase() === String(ruleValue).toLowerCase();
      
    case 'not_equals':
      return String(fieldValue).toLowerCase() !== String(ruleValue).toLowerCase();
      
    case 'contains':
      return String(fieldValue).toLowerCase().includes(String(ruleValue).toLowerCase());
      
    case 'not_contains':
      return !String(fieldValue).toLowerCase().includes(String(ruleValue).toLowerCase());
      
    case 'greater_than':
      return Number(fieldValue) > Number(ruleValue);
      
    case 'less_than':
      return Number(fieldValue) < Number(ruleValue);
      
    case 'between':
      const numValue = Number(fieldValue);
      const minValue = Number(ruleValue);
      const maxValue = Number(rule.valueSecondary);
      return numValue >= minValue && numValue <= maxValue;
      
    default:
      return false;
  }
}

/**
 * Calculate score using default rules (when no custom rules configured)
 */
function calculateDefaultScore(data: Record<string, unknown>, baseScore: number): number {
  let score = baseScore;
  
  // Email engagement
  if (data.emailOpens && typeof data.emailOpens === 'number') {
    score += Math.min(data.emailOpens * 2, 15);
  }
  
  // Website visits
  if (data.websiteVisits && typeof data.websiteVisits === 'number') {
    score += Math.min(data.websiteVisits * 3, 15);
  }
  
  // Form submissions
  if (data.formSubmissions && typeof data.formSubmissions === 'number') {
    score += Math.min(data.formSubmissions * 5, 10);
  }
  
  // Recent activity bonus
  if (data.lastActivityAt) {
    const daysSinceActivity = Math.floor(
      (Date.now() - new Date(data.lastActivityAt as string).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceActivity < 7) score += 10;
    else if (daysSinceActivity < 30) score += 5;
    else if (daysSinceActivity > 90) score -= 10;
  }
  
  // Company size bonus
  if (data.companySize && typeof data.companySize === 'string') {
    const size = data.companySize.toLowerCase();
    if (size.includes('enterprise') || size.includes('1000+')) score += 10;
    else if (size.includes('mid') || size.includes('100')) score += 5;
  }
  
  // Budget indicator
  if (data.budget && typeof data.budget === 'number' && data.budget > 10000) {
    score += 10;
  }
  
  // Demo requested
  if (data.demoRequested) {
    score += 15;
  }
  
  // Has phone number (higher intent)
  if (data.phone) {
    score += 5;
  }
  
  return score;
}
