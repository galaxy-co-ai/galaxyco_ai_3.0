import { NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { teamChannelMembers } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const markReadSchema = z.object({
  lastMessageId: z.string().uuid(),
});

// POST - Mark channel as read
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const user = await getCurrentUser();
    const { id: channelId } = await params;

    const rateLimitResult = await rateLimit(`team:${user.id}`, 100, 3600);
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

    const validationResult = markReadSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { lastMessageId } = validationResult.data;

    // Update last read position for this user in this channel
    await db
      .update(teamChannelMembers)
      .set({
        lastReadAt: new Date(),
        lastReadMessageId: lastMessageId,
      })
      .where(
        and(
          eq(teamChannelMembers.channelId, channelId),
          eq(teamChannelMembers.userId, user.id),
          eq(teamChannelMembers.workspaceId, workspaceId)
        )
      );

    logger.info('Channel marked as read', { channelId, userId: user.id, lastMessageId });

    return NextResponse.json({ success: true });
  } catch (error) {
    return createErrorResponse(error, 'Mark channel as read error');
  }
}
