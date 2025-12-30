/**
 * Text-to-Speech API
 * POST /api/assistant/voice/speak - Convert text to speech using OpenAI TTS
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { textToSpeech } from '@/lib/ai/voice';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { expensiveOperationLimit } from '@/lib/rate-limit';

const speakSchema = z.object({
  text: z.string().min(1, 'Text is required').max(4096, 'Text too long'),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional(),
  speed: z.number().min(0.25).max(4.0).optional(),
});

export async function POST(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    // Rate limiting for expensive AI operation (TTS)
    const rateLimitResult = await expensiveOperationLimit(`voice-speak:${userId}`);
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

    const validationResult = speakSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { text, voice, speed } = validationResult.data;

    // Generate speech
    const audioBuffer = await textToSpeech(text, {
      voice: voice || 'nova',
      speed: speed || 1.0,
      format: 'mp3',
    });

    logger.info('Speech generated', {
      workspaceId,
      textLength: text.length,
      voice: voice || 'nova',
      audioSize: audioBuffer.byteLength,
    });

    // Return audio as MP3
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'TTS generation error');
  }
}
