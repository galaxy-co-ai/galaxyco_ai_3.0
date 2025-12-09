import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { blogPosts, topicIdeas } from '@/db/schema';
import { isSystemAdmin, getCurrentWorkspace } from '@/lib/auth';
import { getOpenAI } from '@/lib/ai-providers';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema for topic generation request
const generateTopicsSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(500),
  count: z.number().min(1).max(10).default(5),
  category: z.string().optional(),
  avoidSimilarTo: z.array(z.string()).optional(), // Existing post titles to avoid
});

// Type for generated topic
interface GeneratedTopic {
  title: string;
  description: string;
  whyItWorks: string;
  suggestedLayout: 'standard' | 'how-to' | 'listicle' | 'case-study' | 'tool-review' | 'news' | 'opinion';
  category: string;
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

    const body = await request.json();
    const validationResult = generateTopicsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { prompt, count, category, avoidSimilarTo } = validationResult.data;

    // Get existing posts to avoid repetition
    const existingPosts = await db
      .select({ title: blogPosts.title, excerpt: blogPosts.excerpt })
      .from(blogPosts)
      .orderBy(desc(blogPosts.createdAt))
      .limit(20);

    const existingTitles = existingPosts.map(p => p.title);
    const titlesToAvoid = [...existingTitles, ...(avoidSimilarTo || [])];

    // Build the AI prompt
    const systemPrompt = `You are an expert content strategist and editor for a professional blog. Your job is to generate compelling, unique article topic ideas that will engage readers and drive traffic.

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

    const userPrompt = `Generate ${count} unique article topic ideas based on this request: "${prompt}"

${category ? `Focus on the category: ${category}` : ''}

${titlesToAvoid.length > 0 ? `
IMPORTANT: Avoid topics that are too similar to these existing articles:
${titlesToAvoid.slice(0, 10).map(t => `- ${t}`).join('\n')}
` : ''}

Respond with a JSON array of topic objects. Each object should have these exact fields:
- title (string): The article title
- description (string): 2-3 sentence description
- whyItWorks (string): Why this topic is compelling
- suggestedLayout (string): One of "standard", "how-to", "listicle", "case-study", "tool-review", "news", "opinion"
- category (string): Topic category

Return ONLY the JSON array, no other text.`;

    const openai = getOpenAI();
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the response
    let topics: GeneratedTopic[];
    try {
      const parsed = JSON.parse(content);
      // Handle both direct array and object with topics property
      topics = Array.isArray(parsed) ? parsed : (parsed.topics || parsed.ideas || []);
    } catch (parseError) {
      logger.error('Failed to parse AI response', parseError, { content });
      throw new Error('Failed to parse AI response');
    }

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
    }));

    logger.info('Generated topic ideas', { 
      count: sanitizedTopics.length,
      prompt,
      workspaceId: context.workspace.id 
    });

    return NextResponse.json({
      topics: sanitizedTopics,
      prompt,
      existingPostsAnalyzed: existingPosts.length,
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

