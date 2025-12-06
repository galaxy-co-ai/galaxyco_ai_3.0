/**
 * Feedback API
 * 
 * Allows users to rate Neptune responses (👍/👎) for learning
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { aiMessageFeedback, aiMessages, aiConversations } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { updateCommunicationStyle } from '@/lib/ai/memory';
import { z } from 'zod';

const feedbackSchema = z.object({
  messageId: z.string().uuid(),
  feedbackType: z.enum(['positive', 'negative']),
  comment: z.string().optional(),
  communicationStyle: z.enum(['concise', 'detailed', 'balanced']).optional(),
});

export async function POST(request: Request) {
  try {
    const { workspaceId, userId: clerkUserId } = await getCurrentWorkspace();
    const currentUser = await getCurrentUser();

    const body = await request.json();
    const validationResult = feedbackSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { messageId, feedbackType, comment, communicationStyle } = validationResult.data;

    // Verify message exists and belongs to user's workspace (via conversation)
    const message = await db.query.aiMessages.findFirst({
      where: eq(aiMessages.id, messageId),
      with: {
        conversation: true,
      },
    });

    // Check if conversation belongs to user's workspace
    if (message && message.conversation && message.conversation.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Record feedback
    await db.insert(aiMessageFeedback).values({
      messageId,
      workspaceId,
      userId: currentUser.id,
      feedbackType,
      comment: comment || null,
    });

    // Update communication style if provided
    if (communicationStyle) {
      await updateCommunicationStyle(workspaceId, currentUser.id, communicationStyle);
    }

    logger.info('Feedback recorded', { messageId, feedbackType, userId: currentUser.id });

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded - thank you!',
    });
  } catch (error) {
    logger.error('Failed to record feedback', error);
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}
