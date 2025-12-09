import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getOpenAI } from '@/lib/ai-providers';
import { isSystemAdmin, getCurrentWorkspace } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';
import slugify from 'slugify';

// Request validation schema
const seoGenerateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  focusKeyword: z.string().optional(),
});

// Strip HTML helper
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const isAdmin = await isSystemAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get workspace context
    let context;
    try {
      context = await getCurrentWorkspace();
    } catch {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      );
    }

    // Rate limiting
    const rateLimitResult = await rateLimit(`seo-generate:${context.workspace.id}`, 20, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before generating more SEO.' },
        { status: 429 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validationResult = seoGenerateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { title, content, excerpt, focusKeyword } = validationResult.data;
    const plainContent = stripHtml(content);
    
    // Get first 2000 chars for context
    const contentSample = plainContent.substring(0, 2000);

    // Initialize OpenAI
    const openai = getOpenAI();
    if (!openai) {
      return NextResponse.json(
        { error: 'AI service not available' },
        { status: 503 }
      );
    }

    // Generate SEO metadata using GPT-4o
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.5,
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: `You are an SEO expert who creates compelling, search-optimized metadata for blog articles. Your responses should follow SEO best practices:

META TITLE RULES:
- Maximum 60 characters (strictly enforced)
- Include the primary keyword near the beginning
- Make it compelling and click-worthy
- Use power words when appropriate
- Don't stuff keywords

META DESCRIPTION RULES:
- 120-160 characters (optimal range)
- Include primary keyword naturally
- Write a compelling summary that encourages clicks
- Include a call-to-action when appropriate
- Don't use quotes or special characters that might break

URL SLUG RULES:
- Lowercase only
- Use hyphens between words
- 3-5 words maximum
- Include the primary keyword
- No stop words (a, the, and, etc.) unless essential

FOCUS KEYWORD:
- Identify the main topic/keyword the article should rank for
- Should be 1-3 words
- High search intent

Respond in JSON format only.`,
        },
        {
          role: 'user',
          content: `Generate SEO metadata for this article:

TITLE: ${title}
${excerpt ? `EXCERPT: ${excerpt}` : ''}
${focusKeyword ? `TARGET KEYWORD: ${focusKeyword}` : ''}

CONTENT SAMPLE:
${contentSample}

Generate a JSON response with:
{
  "metaTitle": "SEO-optimized title under 60 characters",
  "metaDescription": "Compelling description 120-160 characters",
  "slug": "url-friendly-slug",
  "suggestedKeyword": "primary focus keyword"
}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    // Parse response
    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from AI');
    }

    let seoData: {
      metaTitle?: string;
      metaDescription?: string;
      slug?: string;
      suggestedKeyword?: string;
    };

    try {
      seoData = JSON.parse(responseText);
    } catch {
      logger.error('Failed to parse SEO response', { responseText });
      throw new Error('Invalid AI response format');
    }

    // Validate and clean up the generated data
    const cleanedData = {
      metaTitle: (seoData.metaTitle || title).substring(0, 60).trim(),
      metaDescription: (seoData.metaDescription || excerpt || '').substring(0, 160).trim(),
      slug: seoData.slug 
        ? slugify(seoData.slug, { lower: true, strict: true })
        : slugify(title, { lower: true, strict: true }),
      suggestedKeyword: seoData.suggestedKeyword?.toLowerCase().trim() || '',
    };

    // Log success
    logger.info('SEO generated successfully', {
      workspaceId: context.workspace.id,
      title: title.substring(0, 50),
    });

    return NextResponse.json(cleanedData);
  } catch (error) {
    logger.error('SEO generation failed', { error });
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate SEO' },
      { status: 500 }
    );
  }
}

