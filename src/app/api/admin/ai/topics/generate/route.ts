import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { blogPosts } from '@/db/schema';
import { isSystemAdmin, getCurrentWorkspace } from '@/lib/auth';
import { getOpenAI } from '@/lib/ai-providers';
import { eq, desc, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

// Validation schema for topic generation request
const generateTopicsSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(500),
  count: z.number().min(1).max(10).default(5),
  category: z.string().optional(),
  avoidSimilarTo: z.array(z.string()).optional(), // Existing post titles to avoid
  analyzeGaps: z.boolean().default(true), // Whether to include content gap analysis
});

// Type for generated topic
interface GeneratedTopic {
  title: string;
  description: string;
  whyItWorks: string;
  suggestedLayout: 'standard' | 'how-to' | 'listicle' | 'case-study' | 'tool-review' | 'news' | 'opinion';
  category: string;
  similarExisting?: string[]; // Titles of similar existing posts
  isFillsGap?: boolean; // Whether this topic fills an identified gap
}

// Type for content gap
interface ContentGap {
  topic: string;
  reason: string;
  suggestedAngle: string;
}

// Type for similarity warning
interface SimilarityWarning {
  newTopic: string;
  existingPosts: string[];
  similarityReason: string;
}

// POST - Generate topic ideas with AI
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

    // Rate limit
    const rateLimitResult = await rateLimit(`topic-generate:${context.workspace.id}`, 20, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validationResult = generateTopicsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { prompt, count, category, avoidSimilarTo, analyzeGaps } = validationResult.data;

    // Get existing posts for analysis
    const existingPosts = await db
      .select({ 
        title: blogPosts.title, 
        excerpt: blogPosts.excerpt,
        content: blogPosts.content,
        categoryId: blogPosts.categoryId,
        layoutTemplate: blogPosts.layoutTemplate,
        status: blogPosts.status,
        viewCount: blogPosts.viewCount,
        publishedAt: blogPosts.publishedAt,
      })
      .from(blogPosts)
      .orderBy(desc(blogPosts.createdAt))
      .limit(30);

    const publishedPosts = existingPosts.filter(p => p.status === 'published');
    const existingTitles = existingPosts.map(p => p.title);
    const titlesToAvoid = [...existingTitles, ...(avoidSimilarTo || [])];

    // Build the AI prompt with gap analysis
    let systemPrompt = `You are an expert content strategist and editor for a professional blog. Your job is to generate compelling, unique article topic ideas that will engage readers and drive traffic.

For each topic idea, provide:
1. A compelling title that would make someone want to read the article
2. A brief description (2-3 sentences) explaining what the article will cover
3. An explanation of why this topic works (what makes it compelling, timely, or valuable)
4. A suggested layout template (one of: standard, how-to, listicle, case-study, tool-review, news, opinion)
5. A category for the topic

Guidelines:
- Create unique angles, not generic topics
- Consider search intent and what readers actually want to learn
- Make titles specific and actionable where appropriate
- Avoid clickbait - be genuine and informative
- Consider current trends and timeless content needs`;

    // Add gap analysis instructions
    if (analyzeGaps && publishedPosts.length > 0) {
      systemPrompt += `

CONTENT GAP ANALYSIS:
Based on the existing blog content provided, also identify:
1. Topics that would complement existing content
2. Gaps in coverage that readers might expect
3. Topics similar to existing content (flag these as potential duplicates)

For each topic, include:
- "similarExisting": array of existing post titles that cover similar ground (empty if unique)
- "isFillsGap": true if this topic fills an identified gap in the blog's coverage`;
    }

    let userPrompt = `Generate ${count} unique article topic ideas based on this request: "${prompt}"

${category ? `Focus on the category: ${category}` : ''}`;

    // Add existing content analysis
    if (publishedPosts.length > 0) {
      userPrompt += `\n\nEXISTING BLOG CONTENT TO ANALYZE:
${publishedPosts.slice(0, 15).map(p => `- "${p.title}"${p.excerpt ? `: ${p.excerpt.substring(0, 100)}` : ''}`).join('\n')}

Total published posts: ${publishedPosts.length}

IMPORTANT: 
- Avoid topics that are too similar to existing articles
- Identify content gaps that would benefit readers
- Flag any suggested topics that might overlap with existing content`;
    }

    if (titlesToAvoid.length > 0 && titlesToAvoid.length > publishedPosts.length) {
      userPrompt += `\n\nAdditional titles to avoid:
${titlesToAvoid.slice(publishedPosts.length, publishedPosts.length + 5).map(t => `- ${t}`).join('\n')}`;
    }

    userPrompt += `\n\nRespond with a JSON object containing:
{
  "topics": [
    {
      "title": "Article title",
      "description": "2-3 sentence description",
      "whyItWorks": "Why this topic is compelling",
      "suggestedLayout": "standard|how-to|listicle|case-study|tool-review|news|opinion",
      "category": "Topic category",
      "similarExisting": ["title1", "title2"],
      "isFillsGap": true/false
    }
  ],
  "contentGaps": [
    {
      "topic": "Gap area",
      "reason": "Why this is a gap",
      "suggestedAngle": "How to approach it"
    }
  ],
  "warnings": [
    {
      "newTopic": "Suggested topic title",
      "existingPosts": ["Similar existing post"],
      "similarityReason": "Why they might overlap"
    }
  ]
}

Return ONLY valid JSON.`;

    const openai = getOpenAI();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the response
    let parsed: {
      topics?: GeneratedTopic[];
      ideas?: GeneratedTopic[];
      contentGaps?: ContentGap[];
      warnings?: SimilarityWarning[];
    };
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      logger.error('Failed to parse AI response', parseError, { content });
      throw new Error('Failed to parse AI response');
    }

    // Extract topics array
    const topics = Array.isArray(parsed) 
      ? parsed 
      : (parsed.topics || parsed.ideas || []);

    // Validate and sanitize topics
    const validLayouts = ['standard', 'how-to', 'listicle', 'case-study', 'tool-review', 'news', 'opinion'] as const;
    
    const sanitizedTopics = topics.map((topic: GeneratedTopic) => ({
      title: String(topic.title || '').slice(0, 200),
      description: String(topic.description || '').slice(0, 1000),
      whyItWorks: String(topic.whyItWorks || '').slice(0, 1000),
      suggestedLayout: validLayouts.includes(topic.suggestedLayout) 
        ? topic.suggestedLayout 
        : 'standard',
      category: String(topic.category || category || 'General').slice(0, 100),
      generatedBy: 'ai' as const,
      aiPrompt: prompt,
      similarExisting: Array.isArray(topic.similarExisting) 
        ? topic.similarExisting.filter((s): s is string => typeof s === 'string').slice(0, 3)
        : [],
      isFillsGap: Boolean(topic.isFillsGap),
    }));

    // Sanitize content gaps
    const contentGaps = (parsed.contentGaps || [])
      .filter((gap): gap is ContentGap => 
        typeof gap === 'object' && 
        gap !== null && 
        typeof gap.topic === 'string'
      )
      .map(gap => ({
        topic: String(gap.topic).slice(0, 200),
        reason: String(gap.reason || '').slice(0, 500),
        suggestedAngle: String(gap.suggestedAngle || '').slice(0, 500),
      }))
      .slice(0, 5);

    // Sanitize warnings
    const warnings = (parsed.warnings || [])
      .filter((warning): warning is SimilarityWarning => 
        typeof warning === 'object' && 
        warning !== null && 
        typeof warning.newTopic === 'string'
      )
      .map(warning => ({
        newTopic: String(warning.newTopic).slice(0, 200),
        existingPosts: Array.isArray(warning.existingPosts)
          ? warning.existingPosts.filter((s): s is string => typeof s === 'string').slice(0, 3)
          : [],
        similarityReason: String(warning.similarityReason || '').slice(0, 500),
      }))
      .slice(0, 5);

    logger.info('Generated topic ideas with gap analysis', { 
      count: sanitizedTopics.length,
      prompt,
      workspaceId: context.workspace.id,
      contentGaps: contentGaps.length,
      warnings: warnings.length,
    });

    return NextResponse.json({
      topics: sanitizedTopics,
      prompt,
      existingPostsAnalyzed: publishedPosts.length,
      contentGaps: analyzeGaps ? contentGaps : [],
      warnings: analyzeGaps ? warnings : [],
    });
  } catch (error) {
    logger.error('Failed to generate topics', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add your OpenAI API key.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate topic ideas. Please try again.' },
      { status: 500 }
    );
  }
}

