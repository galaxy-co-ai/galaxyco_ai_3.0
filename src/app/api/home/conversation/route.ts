import { NextRequest, NextResponse } from 'next/server';

// Allow enough time for Courier timeout (5s) + Mistral fallback (15s)
export const maxDuration = 30;

import { getCurrentWorkspace } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import type OpenAI from 'openai';
import { getNeptuneLLM } from '@/lib/ai-providers';
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
import { eq, and, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import {
  ConversationInitRequestSchema,
} from '@/lib/validation/neptune-conversation';
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
): string {
  return `You are Neptune, the AI core of an agency operating system. You are in an ongoing conversation with ${userName}.

Current workspace context:
- Total contacts: ${snapshot.contactCount}
- Hot leads: ${snapshot.hotContacts.length}
- Overdue tasks: ${snapshot.overdueTasks.length}
- Active agents: ${snapshot.activeAgentCount}
- Connected integrations: ${snapshot.integrationCount}

Respond naturally and helpfully to the user's message. Be direct, warm, and concise. Use workspace data only when relevant to their question.

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

  // --- Parse & validate body ---
  let sessionId: string | undefined;
  let userMessage: string | undefined;

  try {
    const body = await request.json();

    // Determine which schema to use based on presence of message field
    if (body.message) {
      // Accept message with or without sessionId — if session is missing
      // (e.g. init failed), we'll create one on the fly in the stream handler
      const message = typeof body.message === 'string' ? body.message.slice(0, 4000) : undefined;
      if (!message) {
        return NextResponse.json({ error: 'Message is required' }, { status: 400 });
      }
      sessionId = typeof body.sessionId === 'string' ? body.sessionId : undefined;
      userMessage = message;
    } else {
      const parsed = ConversationInitRequestSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid request', details: parsed.error.issues }, { status: 400 });
      }
      sessionId = parsed.data.sessionId;
    }
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
          // Verify session belongs to this user + workspace (multi-tenant safety)
          const [owned] = await db
            .select({ id: neptuneConversations.id, createdAt: neptuneConversations.createdAt })
            .from(neptuneConversations)
            .where(
              and(
                eq(neptuneConversations.id, sessionId),
                eq(neptuneConversations.workspaceId, workspaceId),
                eq(neptuneConversations.userId, userId),
              ),
            )
            .limit(1);

          if (!owned) {
            enqueue({ type: 'error', message: 'Invalid session.' });
            controller.close();
            return;
          }

          await touchSession(sessionId, workspaceId);
          session = {
            id: sessionId,
            conversationId: sessionId,
            startedAt: owned.createdAt.toISOString(),
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
          ? buildConversationPrompt(snapshot, userName)
          : buildNarrativePrompt(snapshot, userName, timeOfDay);

        // --- Call LLM with automatic fallback (Courier → Mistral → OpenAI) ---
        let responseText = '';

        const llmMessages: Array<{ role: 'system' | 'user'; content: string }> = [
          { role: 'system', content: prompt },
        ];
        if (userMessage) {
          llmMessages.push({ role: 'user', content: userMessage });
        }

        // Try primary provider, fall back to next tier if it fails
        const providers: Array<{ client: OpenAI; model: string; provider: string }> = [];
        try { providers.push(getNeptuneLLM('conversational')); } catch { /* not configured */ }
        try { providers.push(getNeptuneLLM('complex')); } catch { /* not configured */ }

        // Deduplicate (if both tiers resolve to same provider)
        const seen = new Set<string>();
        const uniqueProviders = providers.filter(p => {
          if (seen.has(p.provider)) return false;
          seen.add(p.provider);
          return true;
        });

        let succeeded = false;
        for (const { client: llm, model: llmModel, provider: llmProvider } of uniqueProviders) {
          try {
            logger.info('home/conversation: trying LLM', { provider: llmProvider, model: llmModel });

            // Courier doesn't support streaming — use non-streaming.
            // Mistral/OpenAI stream progressively.
            const useStreaming = llmProvider !== 'courier';

            if (useStreaming) {
              const completion = await llm.chat.completions.create({
                model: llmModel,
                messages: llmMessages,
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
            } else {
              // Non-streaming path (Courier)
              const completion = await llm.chat.completions.create({
                model: llmModel,
                messages: llmMessages,
                max_tokens: 600,
                temperature: 0.7,
              });

              responseText = completion.choices[0]?.message?.content ?? '';
              enqueue({ type: 'block-start', blockType: 'text', index: 0 });
              enqueue({ type: 'text-delta', content: responseText });
            }

            logger.info('home/conversation: LLM succeeded', { provider: llmProvider });
            succeeded = true;
            break; // Success — stop trying providers
          } catch (llmError) {
            logger.warn('home/conversation: LLM provider failed, trying next', {
              provider: llmProvider,
              error: llmError instanceof Error ? llmError.message : String(llmError),
            });
          }
        }

        if (!succeeded) {
          logger.error('home/conversation: all LLM providers failed');
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
