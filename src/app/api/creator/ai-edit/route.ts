/**
 * Creator AI Edit API
 *
 * POST /api/creator/ai-edit - Apply targeted AI edits to a single document section
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentWorkspace } from '@/lib/auth';
import { getOpenAI } from '@/lib/ai-providers';
import { createErrorResponse } from '@/lib/api-error-handler';
import { logger } from '@/lib/logger';

// Validation schema for AI edit request
const AiEditRequestSchema = z.object({
  docTypeId: z.string().min(1, 'Document type ID is required'),
  docTypeName: z.string().min(1, 'Document type name is required'),
  sectionType: z.enum(['title', 'heading', 'paragraph', 'list', 'cta']).optional(),
  sectionContent: z.string().min(1, 'Section content is required'),
  instruction: z.string().min(1, 'Edit instruction is required'),
  answers: z.record(z.string()).default({}),
});

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    await getCurrentWorkspace();

    const body = await request.json();
    const validationResult = AiEditRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0]?.message || 'Validation failed' },
        { status: 400 }
      );
    }

    const { docTypeId, docTypeName, sectionType, sectionContent, instruction, answers } =
      validationResult.data;

    const openai = getOpenAI();

    logger.info('[Creator AI Edit] Applying AI edit', {
      docTypeId,
      docTypeName,
      sectionType: sectionType || 'paragraph',
      hasAnswers: Object.keys(answers).length > 0,
    });

    const audience =
      answers.audience ||
      answers.targetAudience ||
      answers.customerType ||
      answers.industry ||
      'Not specified';

    const goal =
      answers.goal ||
      answers.purpose ||
      answers.objective ||
      answers.outcome ||
      'Not specified';

    const systemPrompt = `You are Neptune, an expert ${docTypeName} editor.
Your job is to rewrite ONE ${sectionType || 'paragraph'} of a ${docTypeName} document.

Guidelines:
- Preserve the original meaning and key details
- Apply the user's edit instruction carefully
- Match the tone and style appropriate for the audience and goal
- Keep formatting simple (plain text, line breaks only)
- Do NOT add markdown formatting or bullet characters unless the sectionType is "list"
- Respond with ONLY the rewritten content for this section, no explanations or pre/post text.`;

    const userPrompt = `Document type: ${docTypeName} (${docTypeId})
Section type: ${sectionType || 'paragraph'}
Audience: ${audience}
Goal: ${goal}

Original section:
"""${sectionContent}"""

Edit instruction:
"""${instruction}"""

Rewrite the section now.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      throw new Error('No content generated');
    }

    logger.info('[Creator AI Edit] Edit generated successfully', {
      docTypeId,
      sectionType: sectionType || 'paragraph',
    });

    return NextResponse.json({ content });
  } catch (error) {
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

    return createErrorResponse(error, 'Creator AI Edit error');
  }
}
