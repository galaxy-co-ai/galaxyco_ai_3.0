import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { brainstormSessions } from '@/db/schema';
import { isSystemAdmin, getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { getOpenAI } from '@/lib/ai-providers';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { getWorkspaceVoiceProfile, getVoicePromptSection } from '@/lib/ai/voice-profile';

// Validation schema for brainstorm request
const brainstormSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000),
  sessionId: z.string().uuid().optional(),
});

// Base system prompt for brainstorming
const BRAINSTORM_BASE_PROMPT = `You are an expert content strategist helping someone brainstorm article ideas. Your role is to:

1. **Listen and clarify** - Ask thoughtful questions to understand their topic better
2. **Don't jump to conclusions** - Explore the idea before suggesting a final direction
3. **Find the strongest angle** - Help identify what makes this topic unique or compelling
4. **Be conversational** - This is a brainstorm, not a lecture

GUIDELINES:
- Ask ONE clarifying question at a time
- Help them refine vague ideas into specific, actionable topics
- Point out unique angles they might not have considered
- When you identify a strong direction, summarize it clearly
- Keep responses concise (2-4 sentences typically)

QUESTIONS TO EXPLORE:
- Who is the target reader?
- What problem does this solve for them?
- What's the unique insight or angle?
- What makes this timely or relevant?
- Is there a personal story or data that strengthens it?

When you've identified a clear direction, say something like: "I think we've found your angle: [describe it clearly]"

Remember: You're brainstorming WITH them, not telling them what to write.`;

// Build system prompt with optional voice profile
function buildBrainstormSystemPrompt(voicePromptSection: string): string {
  let prompt = BRAINSTORM_BASE_PROMPT;
  
  if (voicePromptSection) {
    prompt += `\n\nWhen suggesting angles or directions, keep in mind the blog's established voice:
${voicePromptSection}`;
  }
  
  return prompt;
}

// POST - Streaming brainstorm conversation
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return createErrorStream('Unauthorized', 403);
    }

    // Get workspace and user context
    let context;
    let user;
    try {
      context = await getCurrentWorkspace();
      user = await getCurrentUser();
    } catch {
      return createErrorStream('Workspace or user not found', 404);
    }

    // Rate limit
    const rateLimitResult = await rateLimit(`brainstorm:${user.id}`, 30, 60);
    if (!rateLimitResult.success) {
      return createErrorStream('Rate limit exceeded. Please wait a moment.', 429);
    }

    const body = await request.json();
    const validationResult = brainstormSchema.safeParse(body);

    if (!validationResult.success) {
      return createErrorStream('Validation failed: ' + validationResult.error.errors[0]?.message, 400);
    }

    const { message, sessionId } = validationResult.data;

    // Get or create brainstorm session
    let session;
    if (sessionId) {
      session = await db.query.brainstormSessions.findFirst({
        where: and(
          eq(brainstormSessions.id, sessionId),
          eq(brainstormSessions.workspaceId, context.workspace.id)
        ),
      });
    }

    if (!session) {
      // Create new session
      const [newSession] = await db
        .insert(brainstormSessions)
        .values({
          workspaceId: context.workspace.id,
          userId: user.id,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
          messages: [],
        })
        .returning();
      session = newSession;
    }

    // Get message history
    const messageHistory = (session.messages || []) as Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;

    // Add user message to history
    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString(),
    };

    // Get voice profile for the workspace
    const voiceProfile = await getWorkspaceVoiceProfile(context.workspace.id);
    const voicePromptSection = getVoicePromptSection(voiceProfile, {
      includeTone: true,
      includeExamples: true,
      includeAvoid: false, // Not needed for brainstorming
      includeSentenceLength: false,
      includeStructure: false,
    });
    const systemPrompt = buildBrainstormSystemPrompt(voicePromptSection);

    // Build messages for OpenAI
    const openaiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messageHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ];

    // Create OpenAI stream
    const openai = getOpenAI();
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: openaiMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 500,
    });

    // Create response stream
    const encoder = new TextEncoder();
    let fullResponse = '';

    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
              );
            }
          }

          // Save messages to session
          const assistantMessage = {
            role: 'assistant' as const,
            content: fullResponse,
            timestamp: new Date().toISOString(),
          };

          const updatedMessages = [...messageHistory, userMessage, assistantMessage];

          // Extract key insights from the conversation
          const keyInsights = extractKeyInsights(updatedMessages);

          await db
            .update(brainstormSessions)
            .set({
              messages: updatedMessages,
              keyInsights,
              updatedAt: new Date(),
            })
            .where(eq(brainstormSessions.id, session!.id));

          // Send session info before closing
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              sessionId: session!.id, 
              keyInsights,
              done: true 
            })}\n\n`)
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          logger.error('Brainstorm stream error', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Stream error occurred' })}\n\n`)
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    logger.error('Brainstorm API error', error);
    return createErrorStream('Failed to process brainstorm request', 500);
  }
}

// Helper to create error stream
function createErrorStream(message: string, status: number) {
  const encoder = new TextEncoder();
  const errorStream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
      );
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });
  return new Response(errorStream, {
    status,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

// Extract key insights from conversation
function extractKeyInsights(messages: Array<{ role: string; content: string }>): string[] {
  const insights: string[] = [];
  
  // Look for patterns in assistant messages
  const assistantMessages = messages
    .filter(m => m.role === 'assistant')
    .map(m => m.content);
  
  for (const msg of assistantMessages) {
    // Look for "angle" mentions
    if (msg.toLowerCase().includes('angle:') || msg.toLowerCase().includes('your angle')) {
      const match = msg.match(/angle[:\s]+([^.!?]+[.!?])/i);
      if (match) insights.push(match[1].trim());
    }
    
    // Look for "key insight" or "interesting" mentions
    if (msg.toLowerCase().includes('key insight') || msg.toLowerCase().includes('interesting')) {
      const sentences = msg.split(/[.!?]+/).filter(s => 
        s.toLowerCase().includes('key') || 
        s.toLowerCase().includes('insight') ||
        s.toLowerCase().includes('interesting')
      );
      sentences.forEach(s => {
        if (s.trim().length > 10 && s.trim().length < 200) {
          insights.push(s.trim());
        }
      });
    }
  }
  
  return [...new Set(insights)].slice(0, 5); // Dedupe and limit to 5
}

