/**
 * Gamma.app Generation API Route
 * 
 * POST /api/creator/gamma
 * 
 * Generates polished documents, presentations, and more using Gamma's AI.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  generateWithGamma, 
  isGammaConfigured,
  mapDocTypeToGammaType,
  buildGammaPrompt,
  mapToneToGammaStyle,
} from '@/lib/gamma';
import { logger } from '@/lib/logger';

// Request validation schema
const GenerateRequestSchema = z.object({
  docTypeId: z.string().min(1, 'Document type is required'),
  docTypeName: z.string().min(1, 'Document type name is required'),
  answers: z.record(z.string()),
});

export async function POST(request: NextRequest) {
  try {
    // Check if Gamma is configured
    if (!isGammaConfigured()) {
      return NextResponse.json(
        { 
          error: 'Gamma API not configured',
          message: 'Please add GAMMA_API_KEY to your environment variables',
        },
        { status: 503 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = GenerateRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request',
          message: validationResult.error.errors[0]?.message || 'Validation failed',
        },
        { status: 400 }
      );
    }

    const { docTypeId, docTypeName, answers } = validationResult.data;

    // Map document type to Gamma content type
    const gammaContentType = mapDocTypeToGammaType(docTypeId);
    
    if (!gammaContentType) {
      return NextResponse.json(
        { 
          error: 'Unsupported document type',
          message: `Document type "${docTypeName}" is not supported by Gamma. Supported types: Presentation, Document, Proposal, Newsletter, Blog, Social Post`,
        },
        { status: 400 }
      );
    }

    // Build the prompt from user answers
    const prompt = buildGammaPrompt(docTypeId, docTypeName, answers);
    
    // Get style from tone preference
    const style = mapToneToGammaStyle(answers.tone || answers.visualStyle);

    logger.info('Generating with Gamma', { 
      docTypeId, 
      contentType: gammaContentType,
      style,
      promptLength: prompt.length,
    });

    // Call Gamma API
    const result = await generateWithGamma({
      prompt,
      contentType: gammaContentType,
      style,
    });

    // Return the generated content
    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        title: result.title,
        cards: result.cards,
        editUrl: result.editUrl,
        embedUrl: result.embedUrl,
        exportFormats: result.exportFormats,
      },
    });

  } catch (error) {
    logger.error('Gamma generation error', { error });

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { 
            error: 'Rate limited',
            message: 'Too many requests. Please try again in a moment.',
          },
          { status: 429 }
        );
      }

      if (error.message.includes('credits')) {
        return NextResponse.json(
          { 
            error: 'Insufficient credits',
            message: 'Your Gamma account has insufficient credits. Please upgrade or purchase more credits.',
          },
          { status: 402 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Generation failed',
        message: 'Failed to generate content with Gamma. Please try again.',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check Gamma status
export async function GET() {
  const configured = isGammaConfigured();
  
  return NextResponse.json({
    configured,
    supportedTypes: configured 
      ? ['presentation', 'document', 'proposal', 'newsletter', 'blog', 'social']
      : [],
  });
}
