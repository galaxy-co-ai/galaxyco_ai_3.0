import { db } from '@/lib/db';
import { neptuneConversations } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import type { ConversationSession } from '@/types/neptune-conversation';

export const SESSION_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Returns true if the session has been idle for longer than SESSION_IDLE_TIMEOUT_MS.
 */
export function isSessionExpired(lastActiveAt: Date): boolean {
  return Date.now() - lastActiveAt.getTime() >= SESSION_IDLE_TIMEOUT_MS;
}

/**
 * Maps a neptuneConversations row to a ConversationSession.
 */
function toConversationSession(row: {
  id: string;
  createdAt: Date;
  lastActiveAt: Date;
}): ConversationSession {
  return {
    id: row.id,
    conversationId: row.id,
    startedAt: row.createdAt.toISOString(),
    lastActiveAt: row.lastActiveAt.toISOString(),
  };
}

/**
 * Creates a new home conversation session for the given workspace + user.
 */
export async function createSession(
  workspaceId: string,
  userId: string,
): Promise<ConversationSession> {
  logger.info('session-manager: creating new home session', { workspaceId, userId });

  const [row] = await db
    .insert(neptuneConversations)
    .values({
      workspaceId,
      userId,
      topic: 'home',
      title: 'Home Session',
    })
    .returning();

  return toConversationSession(row);
}

/**
 * Finds the most recent home session for this user+workspace.
 * - Resumes if not expired (< 30 min idle), touches it, returns isNew: false
 * - Creates a new session if expired or none exists, returns isNew: true
 */
export async function getOrCreateSession(
  workspaceId: string,
  userId: string,
): Promise<{ session: ConversationSession; isNew: boolean }> {
  const [existing] = await db
    .select()
    .from(neptuneConversations)
    .where(
      and(
        eq(neptuneConversations.workspaceId, workspaceId),
        eq(neptuneConversations.userId, userId),
        eq(neptuneConversations.topic, 'home'),
      ),
    )
    .orderBy(desc(neptuneConversations.lastActiveAt))
    .limit(1);

  if (existing && !isSessionExpired(existing.lastActiveAt)) {
    logger.info('session-manager: resuming existing session', { sessionId: existing.id });
    await touchSession(existing.id);
    return {
      session: toConversationSession({ ...existing, lastActiveAt: new Date() }),
      isNew: false,
    };
  }

  const session = await createSession(workspaceId, userId);
  return { session, isNew: true };
}

/**
 * Updates lastActiveAt to now for the given session.
 */
export async function touchSession(sessionId: string): Promise<void> {
  await db
    .update(neptuneConversations)
    .set({ lastActiveAt: new Date() })
    .where(eq(neptuneConversations.id, sessionId));
}
