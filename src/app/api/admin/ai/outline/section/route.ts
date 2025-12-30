import { NextRequest, NextResponse } from 'next/server';
import { isSystemAdmin, getCurrentWorkspace } from '@/lib/auth';
import { getOpenAI } from '@/lib/ai-providers';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';
import { getLayout, type LayoutTemplate, type SectionType } from '@/lib/ai/article-layouts';
import { createErrorResponse } from '@/lib/api-error-handler';

// Validation schema for section regeneration
const sectionRequestSchema = z.object({
  articleTitle: z.string().min(1).max(200),
  articleDescription: z.string().max(500).optional(),
  sectionTitle: z.string().min(1).max(100),
  sectionType: z.string().min(1).max(50),
  layoutId: z.enum(['standard', 'how-to', 'listicle', 'case-study', 'tool-review', 'news', 'opinion']),
  existingSections: z.array(z.string()).max(20).optional(),
  mode: z.enum(['regenerate', 'variations']).optional(),
});

// POST - Regenerate single section or get title variations
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return createErrorResponse(new Error('Forbidden: Admin access required'), 'Generate section');
    }

    // Get workspace context
    let context;
    try {
      context = await getCurrentWorkspace();
    } catch {
      return createErrorResponse(new Error('Workspace not found'), 'Generate section');
    }

    // Rate limit (higher limit for section operations)
    const rateLimitResult = await rateLimit(`outline-section:${context.workspace.id}`, 40, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validationResult = sectionRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return createErrorResponse(new Error('Invalid request body'), 'Generate section');
    }

    const { 
      articleTitle, 
      articleDescription, 
      sectionTitle, 
      sectionType,
      layoutId, 
      existingSections,
      mode = 'regenerate'
    } = validationResult.data;

    // Get the layout template for context
    const layout = getLayout(layoutId);
    const layoutSection = layout.sections.find(s => s.type === sectionType);

    const openai = getOpenAI();

    if (mode === 'variations') {
      // Generate title variations
      const variations = await generateTitleVariations({
        openai,
        articleTitle,
        articleDescription,
        sectionTitle,
        sectionType: sectionType as SectionType,
        layout,
      });

      logger.info('Generated section title variations', {
        workspaceId: context.workspace.id,
        sectionTitle,
        variationsCount: variations.length,
      });

      return NextResponse.json({ variations });
    }

    // Regenerate section content (bullets)
    const sectionContent = await regenerateSectionContent({
      openai,
      articleTitle,
      articleDescription,
      sectionTitle,
      sectionType: sectionType as SectionType,
      layout,
      layoutSection,
      existingSections,
    });

    logger.info('Regenerated section content', {
      workspaceId: context.workspace.id,
      sectionTitle,
      bulletsCount: sectionContent.bullets.length,
    });

    return NextResponse.json(sectionContent);
  } catch (error) {
    return createErrorResponse(error, 'Generate section');
  }
}

// Generate title variations for a section
async function generateTitleVariations(params: {
  openai: ReturnType<typeof getOpenAI>;
  articleTitle: string;
  articleDescription?: string;
  sectionTitle: string;
  sectionType: SectionType;
  layout: LayoutTemplate;
}): Promise<string[]> {
  const { openai, articleTitle, articleDescription, sectionTitle, sectionType, layout } = params;

  const systemPrompt = `You are an expert content strategist. Generate alternative section title variations that are:
- Clear and compelling
- Action-oriented when appropriate
- SEO-friendly
- Consistent with a ${layout.name} article format
- Different approaches to the same topic

Return a JSON object with this structure:
{
  "variations": ["Title variation 1", "Title variation 2", "Title variation 3", "Title variation 4", "Title variation 5"]
}

Return ONLY valid JSON, no other text.`;

  const userPrompt = `For an article titled "${articleTitle}"${articleDescription ? ` (${articleDescription})` : ''}, generate 5 alternative titles for this ${sectionType} section:

Current title: "${sectionTitle}"

The alternatives should convey similar meaning but with different phrasing, angles, or emphasis.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 500,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from AI');
  }

  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed.variations)) {
      return parsed.variations
        .filter((v: unknown): v is string => typeof v === 'string')
        .map((v: string) => v.slice(0, 100))
        .slice(0, 5);
    }
    return [];
  } catch {
    logger.error('Failed to parse variations response', { content });
    return [];
  }
}

// Regenerate section content (bullets and word count)
async function regenerateSectionContent(params: {
  openai: ReturnType<typeof getOpenAI>;
  articleTitle: string;
  articleDescription?: string;
  sectionTitle: string;
  sectionType: SectionType;
  layout: LayoutTemplate;
  layoutSection?: { suggestedWordCount: number; aiPrompt: string; maxBullets?: number };
  existingSections?: string[];
}): Promise<{ bullets: string[]; wordCount: number }> {
  const { 
    openai, 
    articleTitle, 
    articleDescription, 
    sectionTitle, 
    sectionType, 
    layout, 
    layoutSection,
    existingSections 
  } = params;

  const suggestedWordCount = layoutSection?.suggestedWordCount || 200;
  const maxBullets = layoutSection?.maxBullets || 5;
  const aiPrompt = layoutSection?.aiPrompt || 'Generate key points for this section.';

  const systemPrompt = `You are an expert content strategist helping to create article outlines.
Generate specific, actionable bullet points for a section in a ${layout.name} article.

SECTION GUIDANCE: ${aiPrompt}

Return a JSON object with this structure:
{
  "bullets": ["Specific point 1", "Specific point 2", "Specific point 3"],
  "wordCount": ${suggestedWordCount}
}

Guidelines:
- Generate ${maxBullets} bullet points maximum
- Each bullet should be specific and actionable
- Bullets should guide writing without being too prescriptive
- Consider the section's role in the overall article flow
- Make each bullet unique and valuable

Return ONLY valid JSON, no other text.`;

  let userPrompt = `Article: "${articleTitle}"`;
  if (articleDescription) {
    userPrompt += `\nDescription: ${articleDescription}`;
  }
  userPrompt += `\n\nSection: "${sectionTitle}" (${sectionType})`;
  
  if (existingSections && existingSections.length > 0) {
    userPrompt += `\n\nOther sections in this article: ${existingSections.join(', ')}`;
    userPrompt += `\n\nMake sure this section's content is distinct from the other sections.`;
  }
  
  userPrompt += `\n\nGenerate ${maxBullets} key bullet points for this section.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 800,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from AI');
  }

  try {
    const parsed = JSON.parse(content);
    return {
      bullets: Array.isArray(parsed.bullets)
        ? parsed.bullets
            .filter((b: unknown): b is string => typeof b === 'string')
            .map((b: string) => b.slice(0, 300))
            .slice(0, maxBullets)
        : [],
      wordCount: typeof parsed.wordCount === 'number' && parsed.wordCount > 0
        ? parsed.wordCount
        : suggestedWordCount,
    };
  } catch {
    logger.error('Failed to parse section content response', { content });
    return { bullets: [], wordCount: suggestedWordCount };
  }
}

