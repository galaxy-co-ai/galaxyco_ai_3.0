/**
 * Voice Transcription API
 * POST /api/assistant/voice/transcribe - Transcribe audio to text using Whisper
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { transcribeAudio } from '@/lib/ai/voice';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import { expensiveOperationLimit } from '@/lib/rate-limit';
import { checkFileSizeLimit, type WorkspaceTier } from '@/lib/cost-protection';
import { db } from '@/lib/db';
import { workspaces } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    // Rate limit for transcription (10 per minute)
    const rateLimitResult = await expensiveOperationLimit(`transcribe:${userId}`);
    if (!rateLimitResult.success) {
      logger.warn('Voice transcription rate limit exceeded', { userId });
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before transcribing more audio.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
            'Retry-After': String(Math.ceil((rateLimitResult.reset - Date.now()) / 1000)),
          },
        }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Get workspace tier for file size limits
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspaces.id, workspaceId),
      columns: { subscriptionTier: true },
    });
    const workspaceTier = (workspace?.subscriptionTier || 'free') as WorkspaceTier;

    // Check file size limit (audio files can be large)
    const fileSizeCheck = checkFileSizeLimit(audioFile.size, workspaceTier);
    if (!fileSizeCheck.allowed) {
      logger.warn('Voice transcription file size exceeded', {
        workspaceId,
        fileSize: audioFile.size,
        limit: fileSizeCheck.limit,
      });
      return NextResponse.json(
        { error: fileSizeCheck.reason },
        { status: 413 }
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
