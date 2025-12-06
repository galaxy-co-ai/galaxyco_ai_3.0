/**
 * Creator Generate API
 * 
 * POST /api/creator/generate - Generate document content using AI
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentWorkspace } from '@/lib/auth';
import { generateDocument } from '@/lib/ai/document-generator';
import { createErrorResponse } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger';

// Validation schema for generation request
const GenerateRequestSchema = z.object({
  docTypeId: z.string().min(1, 'Document type ID is required'),
  docTypeName: z.string().min(1, 'Document type name is required'),
  answers: z.record(z.string()),
});

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    await getCurrentWorkspace();

    const body = await request.json();
    const validationResult = GenerateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { docTypeId, docTypeName, answers } = validationResult.data;

    logger.info('[Creator Generate] Starting generation', {
      docTypeId,
      docTypeName,
      answersCount: Object.keys(answers).length,
    });

    // Generate the document using AI
    const document = await generateDocument(docTypeId, docTypeName, answers);

    logger.info('[Creator Generate] Generation complete', {
      docTypeId,
      title: document.title,
      sectionsCount: document.sections.length,
    });

    return NextResponse.json({
      document: {
        id: `doc-${Date.now()}`,
        title: document.title,
        type: docTypeId,
        sections: document.sections,
        createdAt: new Date().toISOString(),
        metadata: answers,
      },
    });
  } catch (error) {
    // Handle OpenAI-specific errors
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        return NextResponse.json(
          { error: 'AI service not configured. Please contact support.' },
          { status: 503 }
        );
      }
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Too many requests. Please wait a moment and try again.' },
          { status: 429 }
        );
      }
    }
    
    return createErrorResponse(error, 'Creator Generate error');
  }
}
