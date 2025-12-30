/**
 * Vision Motivation API Route
 * 
 * Generates personalized motivational content based on user goals and workspace progress.
 * Provides strategic encouragement to keep users energized and focused.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { generateNeptuneContext } from '@/lib/neptune/unified-context';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';
import type { VisionResponse, MotivationalContent } from '@/types/vision';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Track recent motivations to avoid repeats
const motivationHistory = new Map<string, string[]>();
const MAX_HISTORY = 10;

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return createErrorResponse(new Error('Unauthorized'), 'Vision motivate');
    }

    const body = await request.json();
    const { workspaceId, goals } = body;

    if (!workspaceId) {
      return createErrorResponse(new Error('Workspace ID is required'), 'Vision motivate');
    }

    logger.info('[Vision] Generating motivational content', { workspaceId, hasGoals: !!goals });

    // Generate Neptune context for progress awareness
    const context = await generateNeptuneContext({
      workspaceId,
      userId,
      includeBusinessIntelligence: true,
      includeProactiveInsights: true,
    });

    // Build context for Claude
    const businessSummary = context.businessSummary || 'Getting started';
    
    const progressContext = `
User's Goals:
${goals || 'No specific goals set yet'}

Workspace Summary:
${businessSummary}

Recent Progress:
${context.insightsPrompt || 'Building your workspace'}
    `.trim();

    // Get previous motivations to avoid repetition
    const historyKey = `${workspaceId}:${userId}`;
    const previousQuotes = motivationHistory.get(historyKey) || [];

    // Call Claude for personalized motivation
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      temperature: 0.9, // Higher temp for creative, varied motivational content
      system: `You are Neptune, an AI business advisor providing personalized motivational content.

Your role is to inject positivity and strategic encouragement based on the user's actual situation.

Generate a motivational message with:
1. **quote** - A short, punchy statement (1-2 sentences) that feels personal, not generic
2. **context** - A paragraph connecting the quote to their specific situation and progress
3. **category** - One of: 'progress', 'strategy', 'resilience', 'growth'

Rules:
- Reference their actual workspace data
- Celebrate specific wins, no matter how small
- If they're just starting, focus on the journey ahead
- If they're making progress, acknowledge momentum
- Be genuine and warm, not cheesy
- Avoid clichés like "Rome wasn't built in a day"
- Make it feel like a real person talking to them

Previous quotes to avoid repeating:
${previousQuotes.length > 0 ? previousQuotes.join('\n') : 'None yet'}

Output JSON format:
{
  "quote": "Your short motivational statement here",
  "context": "Your connecting paragraph here",
  "category": "progress|strategy|resilience|growth"
}`,
      messages: [
        {
          role: 'user',
          content: `Generate personalized motivational content for this user:\n\n${progressContext}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse Claude's response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON from Claude response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const motivation: MotivationalContent = {
      quote: parsed.quote,
      context: parsed.context,
      category: parsed.category || 'growth',
      generatedAt: Date.now(),
    };

    // Update history
    const updatedHistory = [parsed.quote, ...previousQuotes].slice(0, MAX_HISTORY);
    motivationHistory.set(historyKey, updatedHistory);

    // Generate goal feedback if goals are provided
    let goalFeedback;
    if (goals && goals.trim().length > 20) {
      const feedbackResponse = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        temperature: 0.7,
        system: `You are Neptune analyzing user goals for clarity and actionability.

Rate the goal clarity on a scale of 1-10 and provide:
- **clarityScore** - How clear and actionable the goals are (1-10)
- **strengths** - Array of 2-3 things they did well
- **suggestions** - Array of 2-3 ways to improve clarity or add specificity

Output JSON format:
{
  "clarityScore": 7,
  "strengths": ["...", "..."],
  "suggestions": ["...", "..."]
}`,
        messages: [
          {
            role: 'user',
            content: `Analyze these goals:\n\n${goals}`,
          },
        ],
      });

      const feedbackContent = feedbackResponse.content[0];
      if (feedbackContent.type === 'text') {
        const feedbackMatch = feedbackContent.text.match(/\{[\s\S]*\}/);
        if (feedbackMatch) {
          goalFeedback = JSON.parse(feedbackMatch[0]);
        }
      }
    }

    const result: VisionResponse = {
      motivation,
      goalFeedback,
    };

    logger.info('[Vision] Generated motivational content successfully', {
      workspaceId,
      category: motivation.category,
      hasGoalFeedback: !!goalFeedback,
    });

    return NextResponse.json(result);
  } catch (error) {
    return createErrorResponse(error, 'Vision motivate');
  }
}
