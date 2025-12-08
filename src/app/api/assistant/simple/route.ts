/**
 * Simple (non-streaming) AI Assistant Endpoint
 * 
 * This endpoint provides quick, simple AI responses without SSE streaming.
 * Ideal for:
 * - Quick acknowledgments in guided flows
 * - Simple Q&A without tool execution
 * - Cases where streaming isn't needed
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { getOpenAI } from '@/lib/ai-providers';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';

const simpleMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000),
  context: z.object({
    workspace: z.string().optional(),
    feature: z.string().optional(),
    page: z.string().optional(),
    type: z.string().optional(),
  }).optional(),
  systemPrompt: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    let user;
    try {
      await getCurrentWorkspace();
      user = await getCurrentUser();
      if (!user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Rate limit
    const rateLimitResult = await rateLimit(`ai:simple:${user.id}`, 30, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      );
    }

    // Parse and validate
    const body = await request.json();
    const validationResult = simpleMessageSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || 'Invalid request' },
        { status: 400 }
      );
    }

    const { message, context, systemPrompt } = validationResult.data;

    // Build system prompt based on context
    const defaultSystemPrompt = `You are Neptune, a helpful AI assistant for a business platform.
Keep responses brief and conversational (1-2 sentences).
Be encouraging and professional.
${context?.feature === 'content' ? 'You are helping create content. Acknowledge user inputs positively and move the conversation forward.' : ''}
${context?.page === 'creator-guided-session' ? 'The user is in a guided content creation session. Give brief, encouraging acknowledgments.' : ''}`;

    const openai = getOpenAI();
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt || defaultSystemPrompt },
        { role: 'user', content: message },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content || 'Got it!';

    logger.debug('[AI Simple] Response generated', {
      userId: user.id,
      messageLength: message.length,
      responseLength: responseContent.length,
    });

    return NextResponse.json({
      content: responseContent,
      message: { content: responseContent },
    });

  } catch (error) {
    logger.error('[AI Simple] Error', error);
    return createErrorResponse(error, 'AI Simple error');
  }
}

