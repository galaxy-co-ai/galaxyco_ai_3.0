import { NextRequest } from 'next/server';
import { isSystemAdmin, getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { getOpenAI } from '@/lib/ai-providers';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { getWorkspaceVoiceProfile, getVoicePromptSection } from '@/lib/ai/voice-profile';

// Validation schema for continue writing request
const continueSchema = z.object({
  content: z.string().min(1, 'Content is required').max(10000),
  cursorPosition: z.number().optional(),
  context: z.object({
    title: z.string().optional(),
    outline: z.array(z.object({
      title: z.string(),
      type: z.string(),
    })).optional(),
    layoutTemplate: z.string().optional(),
    targetAudience: z.string().optional(),
  }).optional(),
});

// POST - Streaming continue writing
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return createErrorStream('Unauthorized', 403);
    }

    // Get workspace and user context
    let workspaceContext;
    let user;
    try {
      workspaceContext = await getCurrentWorkspace();
      user = await getCurrentUser();
    } catch {
      return createErrorStream('Workspace or user not found', 404);
    }

    // Rate limit
    const rateLimitResult = await rateLimit(`ai-continue:${user.id}`, 30, 60);
    if (!rateLimitResult.success) {
      return createErrorStream('Rate limit exceeded. Please wait a moment.', 429);
    }

    const body = await request.json();
    const validationResult = continueSchema.safeParse(body);

    if (!validationResult.success) {
      return createErrorStream('Validation failed: ' + validationResult.error.errors[0]?.message, 400);
    }

    const { content, cursorPosition, context } = validationResult.data;

    // Get voice profile for the workspace
    const voiceProfile = await getWorkspaceVoiceProfile(workspaceContext.workspace.id);
    const voicePromptSection = getVoicePromptSection(voiceProfile, {
      includeTone: true,
      includeExamples: true,
      includeAvoid: true,
      includeSentenceLength: true,
      includeStructure: false,
      maxExamples: 5,
    });

    // Build system prompt with voice profile
    let systemPrompt = `You are a skilled content writer helping to continue an article. Your task is to seamlessly continue writing from where the user left off.

GUIDELINES:
- Match the existing tone, style, and voice of the content
- Continue the thought naturally without repeating what was already written
- Write 1-3 paragraphs of new content (50-150 words)
- Don't start with transitional phrases like "In addition" or "Furthermore" unless it fits naturally
- Maintain consistency with the established topic and argument flow
- Be concise and valuable - every sentence should add meaning`;

    // Add voice profile context if available
    systemPrompt += voicePromptSection;

    // Add article context if available
    if (context) {
      systemPrompt += `\n\nARTICLE CONTEXT:`;
      if (context.title) {
        systemPrompt += `\n- Title: ${context.title}`;
      }
      if (context.layoutTemplate) {
        systemPrompt += `\n- Format: ${context.layoutTemplate}`;
      }
      if (context.targetAudience) {
        systemPrompt += `\n- Target audience: ${context.targetAudience}`;
      }
      if (context.outline && context.outline.length > 0) {
        systemPrompt += `\n- Article sections: ${context.outline.map(s => s.title).join(' → ')}`;
      }
    }

    // Prepare the content for continuation
    // If cursor position is provided, use content up to that point
    const contentToProcess = cursorPosition !== undefined 
      ? content.substring(0, cursorPosition) 
      : content;

    // Strip HTML tags for context, keeping structure hints
    const plainTextContent = contentToProcess
      .replace(/<h[1-6][^>]*>/gi, '\n[HEADING] ')
      .replace(/<\/h[1-6]>/gi, '\n')
      .replace(/<p[^>]*>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n• ')
      .replace(/<\/li>/gi, '')
      .replace(/<[^>]+>/g, '')
      .trim();

    // Create OpenAI stream
    const openai = getOpenAI();
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Continue writing from where this content ends. Write naturally as if you're the same author:\n\n${plainTextContent}` 
        },
      ],
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
            const text = chunk.choices[0]?.delta?.content || '';
            if (text) {
              fullResponse += text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`)
              );
            }
          }

          // Send completion signal
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              done: true,
              totalLength: fullResponse.length 
            })}\n\n`)
          );
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();

          logger.info('AI continue completed', { 
            userId: user.id,
            responseLength: fullResponse.length 
          });
        } catch (error) {
          logger.error('AI continue stream error', error);
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
    logger.error('AI continue API error', error);
    return createErrorStream('Failed to process continue request', 500);
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

