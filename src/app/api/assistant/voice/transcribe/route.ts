/**
 * Voice Transcription API
 * POST /api/assistant/voice/transcribe - Transcribe audio to text using Whisper
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { transcribeAudio } from '@/lib/ai/voice';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

export async function POST(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Transcribe using Whisper
    const transcription = await transcribeAudio(buffer, {
      language: 'en', // Can be made dynamic based on user preference
    });

    logger.info('Voice transcription completed', {
      workspaceId,
      textLength: transcription.text.length,
    });

    return NextResponse.json({
      text: transcription.text,
      language: transcription.language,
    });
  } catch (error) {
    return createErrorResponse(error, 'Transcription error');
  }
}
