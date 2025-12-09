import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { brainstormSessions, topicIdeas } from '@/db/schema';
import { isSystemAdmin, getCurrentWorkspace } from '@/lib/auth';
import { getOpenAI } from '@/lib/ai-providers';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Validation schema
const outlineFromConversationSchema = z.object({
  sessionId: z.string().uuid(),
  layout: z.enum(['standard', 'how-to', 'listicle', 'case-study', 'tool-review', 'news', 'opinion']).optional(),
});

// Type for outline section
interface OutlineSection {
  id: string;
  title: string;
  type: 'intro' | 'body' | 'conclusion' | 'cta';
  bullets?: string[];
  wordCount?: number;
}

// POST - Generate outline from brainstorm conversation
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

    const body = await request.json();
    const validationResult = outlineFromConversationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { sessionId, layout = 'standard' } = validationResult.data;

    // Get the brainstorm session
    const session = await db.query.brainstormSessions.findFirst({
      where: and(
        eq(brainstormSessions.id, sessionId),
        eq(brainstormSessions.workspaceId, context.workspace.id)
      ),
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const messages = (session.messages || []) as Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'No conversation to generate outline from' },
        { status: 400 }
      );
    }

    // Build conversation summary for the AI
    const conversationText = messages
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
      .join('\n\n');

    // Generate outline using AI
    const openai = getOpenAI();
    
    const systemPrompt = `You are an expert content strategist. Based on a brainstorming conversation, generate a structured article outline.

The outline should be for a "${layout}" article format.

FORMAT GUIDELINES:
- standard: Introduction, 3-4 body sections, conclusion
- how-to: Introduction, numbered steps (5-7), tips section, conclusion
- listicle: Introduction, numbered items (7-10), conclusion with summary
- case-study: Introduction, background, challenge, solution, results, conclusion
- tool-review: Introduction, overview, features (3-5), pros/cons, verdict
- news: Lead paragraph, background, details, quotes, conclusion
- opinion: Hook, thesis, arguments (3-4), counterarguments, conclusion

Return a JSON object with:
{
  "title": "Compelling article title",
  "description": "2-3 sentence summary",
  "sections": [
    {
      "id": "unique-id",
      "title": "Section title",
      "type": "intro|body|conclusion|cta",
      "bullets": ["Key point 1", "Key point 2"],
      "wordCount": 150
    }
  ],
  "suggestedAngle": "The unique angle identified from the conversation",
  "targetAudience": "Who this article is for"
}

Return ONLY valid JSON, no other text.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Generate an article outline based on this brainstorming conversation:\n\n${conversationText}` },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the response
    let outline;
    try {
      outline = JSON.parse(content);
    } catch (parseError) {
      logger.error('Failed to parse outline response', parseError, { content });
      throw new Error('Failed to parse AI response');
    }

    // Validate and sanitize the outline
    const sanitizedOutline = {
      title: String(outline.title || 'Untitled Article').slice(0, 200),
      description: String(outline.description || '').slice(0, 500),
      sections: (outline.sections || []).map((section: OutlineSection, index: number) => ({
        id: section.id || `section-${index + 1}`,
        title: String(section.title || `Section ${index + 1}`).slice(0, 100),
        type: ['intro', 'body', 'conclusion', 'cta'].includes(section.type) 
          ? section.type 
          : 'body',
        bullets: Array.isArray(section.bullets) 
          ? section.bullets.map(b => String(b).slice(0, 200)).slice(0, 10)
          : [],
        wordCount: typeof section.wordCount === 'number' ? section.wordCount : 150,
      })),
      suggestedAngle: String(outline.suggestedAngle || '').slice(0, 500),
      targetAudience: String(outline.targetAudience || '').slice(0, 200),
      layout,
    };

    // Create a topic idea from this outline
    const [newTopic] = await db
      .insert(topicIdeas)
      .values({
        workspaceId: context.workspace.id,
        title: sanitizedOutline.title,
        description: sanitizedOutline.description,
        whyItWorks: sanitizedOutline.suggestedAngle,
        generatedBy: 'ai',
        status: 'saved',
        suggestedLayout: layout,
        sourceConversation: {
          sessionId,
          keyPoints: session.keyInsights || [],
        },
      })
      .returning();

    // Update session with resulting topic
    await db
      .update(brainstormSessions)
      .set({
        resultingTopicId: newTopic.id,
        suggestedAngle: sanitizedOutline.suggestedAngle,
        updatedAt: new Date(),
      })
      .where(eq(brainstormSessions.id, sessionId));

    logger.info('Generated outline from conversation', {
      sessionId,
      topicId: newTopic.id,
      sectionCount: sanitizedOutline.sections.length,
    });

    return NextResponse.json({
      outline: sanitizedOutline,
      topicId: newTopic.id,
      sessionId,
    });
  } catch (error) {
    logger.error('Failed to generate outline from conversation', error);
    return NextResponse.json(
      { error: 'Failed to generate outline. Please try again.' },
      { status: 500 }
    );
  }
}

