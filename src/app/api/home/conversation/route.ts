import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { getOpenAI } from '@/lib/ai-providers';
import { getOrCreateSession, touchSession } from '@/lib/home/session-manager';
import { fetchWorkspaceSnapshot } from '@/lib/home/workspace-data';
import type { WorkspaceSnapshot } from '@/lib/home/workspace-data';
import {
  buildNarrativePrompt,
  parseNarrativeResponse,
  getTimeOfDay,
} from '@/lib/home/narrative-builder';
import { db } from '@/lib/db';
import { neptuneMessages, neptuneConversations } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import type { StreamEvent, ConversationMessage } from '@/types/neptune-conversation';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FALLBACK_ERROR_MESSAGE =
  "Give me a moment — I'm having trouble pulling everything together. You can ask me anything in the meantime, or head to any module directly.";

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  Connection: 'keep-alive',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sseEvent(event: StreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Builds a conversational prompt for user messages (not the initial opening).
 * Simpler than buildNarrativePrompt — Neptune responds to a specific question
 * using workspace context for grounding.
 */
export function buildConversationPrompt(
  snapshot: WorkspaceSnapshot,
  userName: string,
  userMessage: string,
): string {
  return `You are Neptune, the AI core of an agency operating system. You are in an ongoing conversation with ${userName}.

Current workspace context:
- Total contacts: ${snapshot.contactCount}
- Hot leads: ${snapshot.hotContacts.length}
- Overdue tasks: ${snapshot.overdueTasks.length}
- Active agents: ${snapshot.activeAgentCount}
- Connected integrations: ${snapshot.integrationCount}

The user just said: "${userMessage}"

Respond naturally and helpfully. Be direct, warm, and concise. Use workspace data only when relevant to their question.

You may use these inline markers where they genuinely add value:
- [ACTION:{"prompt":"question text","actions":[{"label":"Label","intent":"intent-string"}]}]
- [LINK:{"module":"moduleName","label":"link label"}]
- [VISUAL:chartType:{"key":"value","title":"Chart Title"}]

Keep the response to 2–4 sentences unless the question demands more detail.`;
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // --- Auth ---
  let workspaceId: string;
  let userId: string;
  let userName: string;

  try {
    const auth = await getCurrentWorkspace();
    workspaceId = auth.workspaceId;
    userId = auth.userId;
    userName =
      `${auth.user?.firstName ?? ''} ${auth.user?.lastName ?? ''}`.trim() || 'there';
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // --- Rate limit ---
  const rateLimitResult = await rateLimit(`api:home:conversation:${userId}`, 30, 60);
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  // --- Parse body ---
  let sessionId: string | undefined;
  let userMessage: string | undefined;

  try {
    const body = (await request.json()) as { sessionId?: string; message?: string };
    sessionId = body.sessionId;
    userMessage = body.message;
  } catch {
    // Empty body is valid (session init)
    sessionId = undefined;
    userMessage = undefined;
  }

  // --- Build SSE stream ---
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(sseEvent(event)));
      };

      try {
        // --- Session resolution ---
        let session: Awaited<ReturnType<typeof getOrCreateSession>>['session'];

        if (!sessionId) {
          const result = await getOrCreateSession(workspaceId, userId);
          session = result.session;
        } else {
          // Use provided sessionId directly and touch it
          await touchSession(sessionId);
          session = {
            id: sessionId,
            conversationId: sessionId,
            startedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString(),
          };
        }

        enqueue({ type: 'session', session });

        // --- Store user message if provided ---
        if (userMessage) {
          await db.insert(neptuneMessages).values({
            workspaceId,
            conversationId: session.id,
            userId,
            role: 'user',
            content: userMessage,
          });
        }

        // --- Fetch workspace snapshot ---
        const snapshot = await fetchWorkspaceSnapshot(workspaceId);

        // --- Build prompt ---
        const timeOfDay = getTimeOfDay();
        const prompt = userMessage
          ? buildConversationPrompt(snapshot, userName, userMessage)
          : buildNarrativePrompt(snapshot, userName, timeOfDay);

        // --- Call OpenAI (streaming) ---
        let responseText: string;
        try {
          const openai = getOpenAI();
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 600,
            temperature: 0.7,
            stream: true,
          });

          let fullText = '';
          enqueue({ type: 'block-start', blockType: 'text', index: 0 });

          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content ?? '';
            if (delta) {
              fullText += delta;
              enqueue({ type: 'text-delta', content: delta });
            }
          }

          responseText = fullText;
        } catch (llmError) {
          logger.error('home/conversation: LLM call failed', { error: llmError });
          enqueue({ type: 'error', message: FALLBACK_ERROR_MESSAGE });
          controller.close();
          return;
        }

        // --- Parse response into blocks ---
        const blocks = parseNarrativeResponse(responseText);

        // --- Emit block-complete events for all parsed blocks ---
        for (let i = 0; i < blocks.length; i++) {
          enqueue({ type: 'block-complete', block: blocks[i], index: i });
        }

        // --- Build and emit full message ---
        const messageId = crypto.randomUUID();
        const message: ConversationMessage = {
          id: messageId,
          sessionId: session.id,
          timestamp: new Date().toISOString(),
          role: 'neptune',
          blocks,
        };

        enqueue({ type: 'message-complete', message });

        // --- Persist Neptune's response ---
        await db.insert(neptuneMessages).values({
          workspaceId,
          conversationId: session.id,
          userId,
          role: 'assistant',
          content: responseText,
        });

        // --- Increment message count ---
        const increment = userMessage ? 2 : 1; // user + assistant, or just assistant
        await db
          .update(neptuneConversations)
          .set({
            messageCount: sql`${neptuneConversations.messageCount} + ${increment}`,
          })
          .where(eq(neptuneConversations.id, session.id));

        logger.info('home/conversation: response streamed', {
          sessionId: session.id,
          workspaceId,
          blockCount: blocks.length,
          hasUserMessage: !!userMessage,
        });
      } catch (error) {
        logger.error('home/conversation: unexpected error', { error });
        enqueue({ type: 'error', message: FALLBACK_ERROR_MESSAGE });
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, { headers: SSE_HEADERS });
}
