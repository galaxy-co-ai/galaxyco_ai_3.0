import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { db } from '@/lib/db';
import { neptuneConversations, neptuneMessages } from '@/db/schema';
import { eq, and, desc, lt, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // --- Auth ---
  let workspaceId: string;
  let userId: string;

  try {
    const auth = await getCurrentWorkspace();
    workspaceId = auth.workspaceId;
    userId = auth.userId;
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- Rate limit ---
  const rateLimitResult = await rateLimit(`api:home:conversation:history:${userId}`, 30, 60);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // --- Parse query params ---
  const { searchParams } = new URL(request.url);
  const cursorParam = searchParams.get('cursor');

  try {
    // --- Query sessions ---
    const baseConditions = and(
      eq(neptuneConversations.workspaceId, workspaceId),
      eq(neptuneConversations.userId, userId),
      eq(neptuneConversations.topic, 'home'),
    );

    const conditions =
      cursorParam != null
        ? and(baseConditions, lt(neptuneConversations.createdAt, new Date(cursorParam)))
        : baseConditions;

    const rawSessions = await db
      .select({
        id: neptuneConversations.id,
        conversationId: neptuneConversations.id,
        startedAt: neptuneConversations.createdAt,
        lastActiveAt: neptuneConversations.lastActiveAt,
        createdAt: neptuneConversations.createdAt,
      })
      .from(neptuneConversations)
      .where(conditions)
      .orderBy(desc(neptuneConversations.createdAt))
      .limit(PAGE_SIZE + 1);

    // --- Pagination ---
    const hasMore = rawSessions.length > PAGE_SIZE;
    const sessionRows = hasMore ? rawSessions.slice(0, PAGE_SIZE) : rawSessions;

    const sessions = sessionRows.map(({ id, conversationId, startedAt, lastActiveAt }) => ({
      id,
      conversationId,
      startedAt: startedAt.toISOString(),
      lastActiveAt: lastActiveAt.toISOString(),
    }));

    // --- Fetch messages for all sessions in a single query ---
    const sessionIds = sessions.map((s) => s.id);

    const rawMessages =
      sessionIds.length > 0
        ? await db
            .select({
              id: neptuneMessages.id,
              conversationId: neptuneMessages.conversationId,
              role: neptuneMessages.role,
              content: neptuneMessages.content,
              createdAt: neptuneMessages.createdAt,
            })
            .from(neptuneMessages)
            .where(
              and(
                eq(neptuneMessages.workspaceId, workspaceId),
                inArray(neptuneMessages.conversationId, sessionIds),
              ),
            )
            .orderBy(neptuneMessages.createdAt)
        : [];

    // --- Map messages to response shape ---
    // v1: History replays as text-only. Role mapping: 'assistant' → 'neptune'
    const messages = rawMessages.map((msg) => ({
      id: msg.id,
      sessionId: msg.conversationId,
      timestamp: msg.createdAt.toISOString(),
      role: (msg.role === 'assistant' ? 'neptune' : 'user') as 'neptune' | 'user',
      blocks: [{ type: 'text' as const, content: msg.content }],
    }));

    // --- Build cursor ---
    const lastSession = sessionRows[sessionRows.length - 1];
    const nextCursor = hasMore && lastSession ? lastSession.createdAt.toISOString() : undefined;

    logger.info('home/conversation/history: fetched', {
      workspaceId,
      sessionCount: sessions.length,
      messageCount: messages.length,
      hasMore,
    });

    return NextResponse.json({
      sessions,
      messages,
      hasMore,
      ...(nextCursor != null ? { cursor: nextCursor } : {}),
    });
  } catch (error) {
    logger.error('home/conversation/history: unexpected error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
