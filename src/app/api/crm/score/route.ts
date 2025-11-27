import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger';

const scoreSchema = z.object({
  contactId: z.string().uuid(),
  data: z.record(z.unknown()).optional(),
});

/**
 * POST /api/crm/score
 * Calculate a lead score for a contact
 */
export async function POST(request: Request) {
  try {
    await getCurrentWorkspace();
    const body = await request.json();

    const validationResult = scoreSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { contactId, data } = validationResult.data;

    // Calculate lead score based on contact data
    // This is a simple scoring algorithm - can be enhanced with AI
    let score = 50; // Base score

    if (data) {
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
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Calculate tier
    let tier: string;
    if (score >= 80) tier = 'A - High Priority';
    else if (score >= 60) tier = 'B - Medium Priority';
    else if (score >= 40) tier = 'C - Low Priority';
    else tier = 'D - Nurture';

    logger.info('Lead score calculated', { contactId, score, tier });

    return NextResponse.json({
      contactId,
      score,
      tier,
      factors: {
        baseScore: 50,
        engagementBonus: score - 50,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Calculate lead score error');
  }
}
