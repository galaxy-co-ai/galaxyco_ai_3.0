import { NextRequest, NextResponse } from 'next/server';
import { isSystemAdmin, getCurrentWorkspace, getCurrentUser } from '@/lib/auth';
import { getOpenAI } from '@/lib/ai-providers';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { getWorkspaceVoiceProfile, getVoicePromptSection } from '@/lib/ai/voice-profile';

// Rewrite modes
const rewriteModeEnum = z.enum(['improve', 'simplify', 'expand', 'shorten', 'rephrase', 'formal', 'casual']);
export type RewriteMode = z.infer<typeof rewriteModeEnum>;

// Validation schema for rewrite request
const rewriteSchema = z.object({
  text: z.string().min(1, 'Text is required').max(5000),
  mode: rewriteModeEnum,
  context: z.object({
    title: z.string().optional(),
    targetAudience: z.string().optional(),
    surroundingContent: z.string().optional(),
  }).optional(),
});

// Mode-specific prompts
const modePrompts: Record<RewriteMode, string> = {
  improve: `Improve this text for clarity, flow, and impact. Fix any grammar issues, strengthen weak phrases, and make it more engaging. Keep the same general length and meaning.`,
  simplify: `Simplify this text to make it easier to understand. Use shorter sentences, simpler words, and clearer structure. Remove jargon and complexity while keeping the core message.`,
  expand: `Expand this text with more detail, examples, or explanation. Add depth and context while maintaining the same tone and style. Aim for roughly 1.5-2x the original length.`,
  shorten: `Make this text more concise without losing its meaning. Remove unnecessary words, combine sentences where possible, and keep only the essential information. Aim for roughly 50-70% of the original length.`,
  rephrase: `Rephrase this text completely while keeping the exact same meaning. Use different words, sentence structures, and flow. The result should sound fresh but convey the identical message.`,
  formal: `Rewrite this text in a more formal, professional tone. Use proper grammar, avoid contractions, and choose more sophisticated vocabulary where appropriate.`,
  casual: `Rewrite this text in a more casual, conversational tone. Use natural language, contractions, and a friendly voice as if talking to a colleague.`,
};

// POST - Rewrite text with specified mode
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get workspace and user context
    let workspaceContext;
    let user;
    try {
      workspaceContext = await getCurrentWorkspace();
      user = await getCurrentUser();
    } catch {
      return NextResponse.json({ error: 'Workspace or user not found' }, { status: 404 });
    }

    // Rate limit
    const rateLimitResult = await rateLimit(`ai-rewrite:${user.id}`, 40, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please wait a moment.' }, { status: 429 });
    }

    const body = await request.json();
    const validationResult = rewriteSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed: ' + validationResult.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const { text, mode, context } = validationResult.data;

    // Get voice profile for the workspace (skip for formal/casual modes that override voice)
    const voiceProfile = !['formal', 'casual'].includes(mode)
      ? await getWorkspaceVoiceProfile(workspaceContext.workspace.id)
      : null;
    
    const voicePromptSection = getVoicePromptSection(voiceProfile, {
      includeTone: true,
      includeExamples: false, // Not needed for rewrite
      includeAvoid: true,
      includeSentenceLength: false, // Keep original flow
      includeStructure: false,
    });

    // Build system prompt
    let systemPrompt = `You are a skilled editor helping to rewrite content. Your task is to ${modePrompts[mode]}

GUIDELINES:
- Output ONLY the rewritten text, no explanations or meta-commentary
- Maintain the same format (paragraph, bullet points, etc.) unless the mode requires changing it
- Preserve any specific terminology, proper nouns, or technical terms
- Keep the voice consistent with the original unless the mode specifically changes tone`;

    // Add voice profile context if available
    systemPrompt += voicePromptSection;

    // Add article context if available
    if (context) {
      if (context.title) {
        systemPrompt += `\n\nArticle title: ${context.title}`;
      }
      if (context.targetAudience) {
        systemPrompt += `\nTarget audience: ${context.targetAudience}`;
      }
      if (context.surroundingContent) {
        systemPrompt += `\n\nSurrounding context:\n${context.surroundingContent.substring(0, 500)}`;
      }
    }

    // Generate rewritten text
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const rewrittenText = response.choices[0]?.message?.content?.trim() || '';

    if (!rewrittenText) {
      return NextResponse.json({ error: 'Failed to generate rewritten text' }, { status: 500 });
    }

    logger.info('AI rewrite completed', {
      userId: user.id,
      mode,
      originalLength: text.length,
      rewrittenLength: rewrittenText.length,
    });

    return NextResponse.json({
      original: text,
      rewritten: rewrittenText,
      mode,
      originalLength: text.length,
      rewrittenLength: rewrittenText.length,
    });
  } catch (error) {
    logger.error('AI rewrite API error', error);
    return NextResponse.json({ error: 'Failed to process rewrite request' }, { status: 500 });
  }
}

