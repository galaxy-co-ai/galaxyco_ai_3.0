/**
 * Message Feedback API
 * POST /api/assistant/feedback - Record user feedback on AI messages
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { recordMessageFeedback } from '@/lib/ai/memory';
import { recordActionExecution } from '@/lib/ai/autonomy-learning';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

const feedbackSchema = z.object({
  messageId: z.string().min(1, 'Message ID is required'),
  feedback: z.enum(['positive', 'negative']),
  comment: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    // Rate limiting
    const rateLimitResult = await rateLimit(`feedback:${userId}`, 100, 3600);
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

    const validationResult = feedbackSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { messageId, feedback, comment } = validationResult.data;

    // Record feedback
    await recordMessageFeedback(messageId, workspaceId, userId, feedback, comment);

    // If this message had tool executions, record them for autonomy learning
    // Get the message to check for tool calls
    const { db } = await import('@/lib/db');
    const { aiMessages } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const message = await db.query.aiMessages.findFirst({
      where: eq(aiMessages.id, messageId),
    });

    if (message?.metadata) {
      const metadata = message.metadata as { functionCalls?: Array<{ name: string }> };
      if (metadata.functionCalls && metadata.functionCalls.length > 0) {
        // Record feedback for each tool that was executed
        for (const toolCall of metadata.functionCalls) {
          await recordActionExecution(
            workspaceId,
            userId,
            toolCall.name,
            false, // wasAutomatic - we don't track this from feedback
            feedback === 'positive', // userApproved
            0, // executionTime - not available from feedback
            'success' // resultStatus
          );
        }
      }
    }

    logger.info('Message feedback recorded', {
      messageId,
      feedback,
      workspaceId,
      userId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Feedback recording error');
  }
}
