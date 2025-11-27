import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { recordMessageFeedback, recordCorrection } from '@/lib/ai/memory';

// ============================================================================
// SCHEMA VALIDATION
// ============================================================================

const feedbackSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
  feedbackType: z.enum(['positive', 'negative']),
  comment: z.string().max(500).optional(),
});

const correctionSchema = z.object({
  wrongResponse: z.string().max(500, 'Response text too long'),
  correctInfo: z.string().max(500, 'Correction text too long'),
});

// ============================================================================
// POST - Submit Feedback
// ============================================================================

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    const body = await request.json();
    
    // Validate input
    const validationResult = feedbackSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { messageId, feedbackType, comment } = validationResult.data;

    // Record the feedback
    const success = await recordMessageFeedback(
      messageId,
      workspaceId,
      user.id,
      feedbackType,
      comment
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to record feedback - you may have already provided feedback for this message' },
        { status: 409 }
      );
    }

    logger.info('AI feedback recorded', { messageId, feedbackType, userId: user.id });

    return NextResponse.json({
      success: true,
      message: feedbackType === 'positive' 
        ? 'Thanks for the positive feedback!' 
        : 'Thanks for letting us know. We\'ll work on improving.',
    });
  } catch (error) {
    return createErrorResponse(error, 'Submit feedback error');
  }
}

// ============================================================================
// PUT - Submit Correction
// ============================================================================

export async function PUT(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();

    const body = await request.json();
    
    // Validate input
    const validationResult = correctionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { wrongResponse, correctInfo } = validationResult.data;

    // Record the correction
    await recordCorrection(workspaceId, user.id, wrongResponse, correctInfo);

    logger.info('AI correction recorded', { userId: user.id });

    return NextResponse.json({
      success: true,
      message: 'Thanks for the correction! I\'ll remember this for next time.',
    });
  } catch (error) {
    return createErrorResponse(error, 'Submit correction error');
  }
}

