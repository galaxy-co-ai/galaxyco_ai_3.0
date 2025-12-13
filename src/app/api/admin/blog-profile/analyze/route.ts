import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { blogVoiceProfiles, blogPosts } from '@/db/schema';
import { isSystemAdmin, getCurrentWorkspace } from '@/lib/auth';
import { getOpenAI } from '@/lib/ai-providers';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limit';

// Interface for analysis result
interface VoiceAnalysisResult {
  toneDescriptors: string[];
  examplePhrases: string[];
  avoidPhrases: string[];
  avgSentenceLength: number;
  structurePreferences: {
    preferredIntroStyle: string;
    preferredConclusionStyle: string;
    usesSubheadings: boolean;
    usesBulletPoints: boolean;
    includesCallToAction: boolean;
  };
  analyzedPostCount: number;
}

// POST - Analyze published posts to extract voice profile
export async function POST() {
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

    // Rate limit - analysis is expensive
    const rateLimitResult = await rateLimit(`voice-analyze:${context.workspace.id}`, 5, 3600); // 5 per hour
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. You can analyze your blog once per hour.' },
        { status: 429 }
      );
    }

    // Get published posts for analysis
    const posts = await db
      .select({
        id: blogPosts.id,
        title: blogPosts.title,
        content: blogPosts.content,
        excerpt: blogPosts.excerpt,
      })
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published'))
      .limit(20); // Limit to most recent 20 posts to manage context size

    if (posts.length === 0) {
      return NextResponse.json(
        { error: 'No published posts found to analyze. Publish some articles first.' },
        { status: 400 }
      );
    }

    // Get the current voice profile for comparison
    const existingProfile = await db.query.blogVoiceProfiles.findFirst({
      where: eq(blogVoiceProfiles.workspaceId, context.workspace.id),
    });

    // Prepare content samples for analysis (strip HTML, limit length)
    const contentSamples = posts.map((post) => {
      const plainText = stripHtml(post.content || '');
      const truncated = plainText.substring(0, 2000); // First 2000 chars per post
      return {
        title: post.title,
        content: truncated,
        excerpt: post.excerpt || '',
      };
    });

    // Build the analysis prompt
    const systemPrompt = `You are an expert writing analyst. Your task is to analyze blog posts and extract the consistent voice, tone, and style patterns.

Analyze the provided blog posts and identify:

1. **Tone Descriptors** (5-10 adjectives): Words that describe the overall writing voice (e.g., "friendly", "authoritative", "conversational", "technical", "witty")

2. **Example Phrases** (5-10 phrases): Short phrases or expressions that exemplify the writing style (e.g., "Let's dive in", "Here's the thing", "Pro tip:")

3. **Phrases to Avoid** (3-5 phrases): Common generic phrases the author DOESN'T use that should be avoided (e.g., "It goes without saying", "At the end of the day")

4. **Average Sentence Length**: Estimate the typical number of words per sentence (usually 10-25)

5. **Structure Preferences**:
   - preferredIntroStyle: How articles typically begin (e.g., "Question hook", "Bold statement", "Story/anecdote", "Statistics lead")
   - preferredConclusionStyle: How articles typically end (e.g., "Call to action", "Summary recap", "Question for readers", "Forward-looking statement")
   - usesSubheadings: true/false - Does the author use many subheadings?
   - usesBulletPoints: true/false - Does the author frequently use bullet points?
   - includesCallToAction: true/false - Do articles typically include a call to action?

Respond with a JSON object in this exact format:
{
  "toneDescriptors": ["descriptor1", "descriptor2", ...],
  "examplePhrases": ["phrase1", "phrase2", ...],
  "avoidPhrases": ["avoid1", "avoid2", ...],
  "avgSentenceLength": 15,
  "structurePreferences": {
    "preferredIntroStyle": "description",
    "preferredConclusionStyle": "description",
    "usesSubheadings": true,
    "usesBulletPoints": true,
    "includesCallToAction": true
  }
}

Return ONLY valid JSON, no other text.`;

    const userPrompt = `Analyze these ${contentSamples.length} blog posts and extract the consistent voice profile:

${contentSamples.map((sample, i) => `
---POST ${i + 1}: "${sample.title}"---
${sample.excerpt ? `Excerpt: ${sample.excerpt}\n` : ''}
Content:
${sample.content}
`).join('\n')}

Based on these posts, identify the consistent voice, tone, and style patterns.`;

    // Generate analysis with OpenAI
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the analysis result
    let analysis: VoiceAnalysisResult;
    try {
      const parsed = JSON.parse(content);
      analysis = {
        toneDescriptors: Array.isArray(parsed.toneDescriptors) 
          ? parsed.toneDescriptors.filter((t: unknown) => typeof t === 'string').slice(0, 10)
          : [],
        examplePhrases: Array.isArray(parsed.examplePhrases)
          ? parsed.examplePhrases.filter((p: unknown) => typeof p === 'string').slice(0, 10)
          : [],
        avoidPhrases: Array.isArray(parsed.avoidPhrases)
          ? parsed.avoidPhrases.filter((p: unknown) => typeof p === 'string').slice(0, 10)
          : [],
        avgSentenceLength: typeof parsed.avgSentenceLength === 'number'
          ? Math.min(Math.max(parsed.avgSentenceLength, 5), 50)
          : 15,
        structurePreferences: {
          preferredIntroStyle: typeof parsed.structurePreferences?.preferredIntroStyle === 'string'
            ? parsed.structurePreferences.preferredIntroStyle.substring(0, 200)
            : 'Standard introduction',
          preferredConclusionStyle: typeof parsed.structurePreferences?.preferredConclusionStyle === 'string'
            ? parsed.structurePreferences.preferredConclusionStyle.substring(0, 200)
            : 'Summary with next steps',
          usesSubheadings: Boolean(parsed.structurePreferences?.usesSubheadings),
          usesBulletPoints: Boolean(parsed.structurePreferences?.usesBulletPoints),
          includesCallToAction: Boolean(parsed.structurePreferences?.includesCallToAction),
        },
        analyzedPostCount: posts.length,
      };
    } catch (parseError) {
      logger.error('Failed to parse voice analysis', parseError, { content });
      throw new Error('Failed to parse AI analysis');
    }

    // Save the analysis to the database
    let updatedProfile;
    if (existingProfile) {
      // Update existing profile
      [updatedProfile] = await db
        .update(blogVoiceProfiles)
        .set({
          toneDescriptors: analysis.toneDescriptors,
          examplePhrases: analysis.examplePhrases,
          avoidPhrases: analysis.avoidPhrases,
          avgSentenceLength: analysis.avgSentenceLength,
          structurePreferences: analysis.structurePreferences,
          analyzedPostCount: analysis.analyzedPostCount,
          lastAnalyzedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(blogVoiceProfiles.id, existingProfile.id))
        .returning();
    } else {
      // Create new profile
      [updatedProfile] = await db
        .insert(blogVoiceProfiles)
        .values({
          workspaceId: context.workspace.id,
          toneDescriptors: analysis.toneDescriptors,
          examplePhrases: analysis.examplePhrases,
          avoidPhrases: analysis.avoidPhrases,
          avgSentenceLength: analysis.avgSentenceLength,
          structurePreferences: analysis.structurePreferences,
          analyzedPostCount: analysis.analyzedPostCount,
          lastAnalyzedAt: new Date(),
        })
        .returning();
    }

    logger.info('Voice profile analyzed and updated', {
      workspaceId: context.workspace.id,
      postsAnalyzed: posts.length,
      toneDescriptors: analysis.toneDescriptors.length,
      examplePhrases: analysis.examplePhrases.length,
    });

    // Build comparison if there was an existing profile
    const comparison = existingProfile ? {
      before: {
        toneDescriptors: existingProfile.toneDescriptors || [],
        examplePhrases: existingProfile.examplePhrases || [],
        avoidPhrases: existingProfile.avoidPhrases || [],
        avgSentenceLength: existingProfile.avgSentenceLength,
      },
      after: {
        toneDescriptors: analysis.toneDescriptors,
        examplePhrases: analysis.examplePhrases,
        avoidPhrases: analysis.avoidPhrases,
        avgSentenceLength: analysis.avgSentenceLength,
      },
    } : null;

    return NextResponse.json({
      profile: updatedProfile,
      analysis,
      postsAnalyzed: posts.length,
      comparison,
      message: existingProfile 
        ? 'Voice profile updated with latest analysis'
        : 'Voice profile created from blog analysis',
    });
  } catch (error) {
    logger.error('Voice profile analysis failed', error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service not configured. Please add your OpenAI API key.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to analyze blog voice. Please try again.' },
      { status: 500 }
    );
  }
}

// Helper to strip HTML tags from content
function stripHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

