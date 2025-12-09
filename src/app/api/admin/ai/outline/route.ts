import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { topicIdeas, blogPosts } from '@/db/schema';
import { isSystemAdmin, getCurrentWorkspace } from '@/lib/auth';
import { getOpenAI } from '@/lib/ai-providers';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { getLayout, type LayoutTemplate } from '@/lib/ai/article-layouts';

// Validation schema for outline generation request
const outlineRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(500).optional(),
  layoutId: z.enum(['standard', 'how-to', 'listicle', 'case-study', 'tool-review', 'news', 'opinion']),
  topicId: z.string().uuid().optional(),
  targetAudience: z.string().max(200).optional(),
  keywords: z.array(z.string()).max(10).optional(),
});

// Type for outline section in response
interface OutlineSection {
  id: string;
  title: string;
  type: string;
  bullets: string[];
  wordCount: number;
}

// POST - Generate outline from topic + layout
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get workspace context
    let context;
    try {
      context = await getCurrentWorkspace();
    } catch {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Rate limit
    const rateLimitResult = await rateLimit(`outline:${context.workspace.id}`, 20, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validationResult = outlineRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { title, description, layoutId, topicId, targetAudience, keywords } = validationResult.data;

    // Get the layout template
    const layout = getLayout(layoutId);

    // Build the AI prompt
    const systemPrompt = buildSystemPrompt(layout);
    const userPrompt = buildUserPrompt({
      title,
      description,
      layout,
      targetAudience,
      keywords,
    });

    // Generate outline with OpenAI
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse and validate the response
    let parsedOutline;
    try {
      parsedOutline = JSON.parse(content);
    } catch (parseError) {
      logger.error('Failed to parse outline response', parseError, { content });
      throw new Error('Failed to parse AI response');
    }

    // Sanitize and structure the outline
    const sanitizedOutline = sanitizeOutline(parsedOutline, layout);

    // If topicId provided, link the outline
    if (topicId) {
      await db
        .update(topicIdeas)
        .set({
          status: 'in_progress',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(topicIdeas.id, topicId),
            eq(topicIdeas.workspaceId, context.workspace.id)
          )
        );
    }

    logger.info('Generated article outline', {
      workspaceId: context.workspace.id,
      layoutId,
      title,
      sectionCount: sanitizedOutline.sections.length,
    });

    return NextResponse.json({
      outline: sanitizedOutline,
      layoutId,
      topicId,
    });
  } catch (error) {
    logger.error('Failed to generate outline', error);
    return NextResponse.json(
      { error: 'Failed to generate outline. Please try again.' },
      { status: 500 }
    );
  }
}

// Build system prompt for outline generation
function buildSystemPrompt(layout: LayoutTemplate): string {
  const sectionDescriptions = layout.sections
    .map((s, i) => `${i + 1}. ${s.title} (${s.type}): ${s.description} [~${s.suggestedWordCount} words]`)
    .join('\n');

  return `You are an expert content strategist specializing in creating compelling article outlines. 
You create structured outlines that help writers produce high-quality content efficiently.

You are creating an outline for a "${layout.name}" article format.

FORMAT STRUCTURE:
${sectionDescriptions}

GUIDELINES:
- Create clear, actionable section titles that preview the content
- Each section should have 3-5 bullet points describing key content to cover
- Bullets should be specific enough to guide writing but leave room for creativity
- Ensure logical flow between sections
- Match the tone and structure to the format type
- Consider SEO and reader engagement in section titles

RECOMMENDED ELEMENTS: ${layout.recommendedElements.join(', ')}
BEST FOR: ${layout.bestFor.join(', ')}

Return a JSON object with this exact structure:
{
  "title": "Finalized article title",
  "description": "2-3 sentence summary of what the article will cover",
  "sections": [
    {
      "id": "unique-section-id",
      "title": "Section Title",
      "type": "intro|body|conclusion|step|item|etc",
      "bullets": ["Key point 1", "Key point 2", "Key point 3"],
      "wordCount": 200
    }
  ],
  "targetAudience": "Who this article is for",
  "suggestedAngle": "The unique perspective or hook of this article"
}

Return ONLY valid JSON, no other text.`;
}

// Build user prompt for outline generation
function buildUserPrompt(params: {
  title: string;
  description?: string;
  layout: LayoutTemplate;
  targetAudience?: string;
  keywords?: string[];
}): string {
  const { title, description, layout, targetAudience, keywords } = params;

  let prompt = `Create a ${layout.name} outline for an article titled: "${title}"`;

  if (description) {
    prompt += `\n\nDescription/context: ${description}`;
  }

  if (targetAudience) {
    prompt += `\n\nTarget audience: ${targetAudience}`;
  }

  if (keywords && keywords.length > 0) {
    prompt += `\n\nKeywords to incorporate: ${keywords.join(', ')}`;
  }

  prompt += `\n\nGenerate a comprehensive outline following the ${layout.name} format with ${layout.sections.filter(s => s.isRequired).length} required sections and up to ${layout.sections.length} total sections.`;

  return prompt;
}

// Sanitize and structure the AI response
function sanitizeOutline(
  parsed: Record<string, unknown>,
  layout: LayoutTemplate
): {
  title: string;
  description: string;
  sections: OutlineSection[];
  targetAudience: string;
  suggestedAngle: string;
  layoutId: LayoutTemplate['id'];
} {
  // Type guard for section objects
  type ParsedSection = {
    id?: unknown;
    title?: unknown;
    type?: unknown;
    bullets?: unknown;
    wordCount?: unknown;
  };

  const sections = (Array.isArray(parsed.sections) ? parsed.sections : [])
    .map((section: ParsedSection, index: number) => ({
      id: typeof section.id === 'string' ? section.id : `section-${index + 1}`,
      title: typeof section.title === 'string' 
        ? section.title.slice(0, 100) 
        : `Section ${index + 1}`,
      type: typeof section.type === 'string' ? section.type : 'body',
      bullets: Array.isArray(section.bullets)
        ? section.bullets
            .filter((b): b is string => typeof b === 'string')
            .map(b => b.slice(0, 300))
            .slice(0, 10)
        : [],
      wordCount: typeof section.wordCount === 'number' && section.wordCount > 0
        ? section.wordCount
        : 200,
    }))
    .slice(0, 15); // Limit to 15 sections max

  return {
    title: typeof parsed.title === 'string' 
      ? parsed.title.slice(0, 200) 
      : 'Untitled Article',
    description: typeof parsed.description === 'string' 
      ? parsed.description.slice(0, 500) 
      : '',
    sections,
    targetAudience: typeof parsed.targetAudience === 'string' 
      ? parsed.targetAudience.slice(0, 200) 
      : '',
    suggestedAngle: typeof parsed.suggestedAngle === 'string' 
      ? parsed.suggestedAngle.slice(0, 500) 
      : '',
    layoutId: layout.id,
  };
}

