/**
 * AI Memory & Learning System
 * 
 * This module handles learning user preferences, storing conversation insights,
 * and improving the AI's understanding of each user over time.
 */

import { db } from '@/lib/db';
import { aiUserPreferences, aiMessages, aiConversations, aiMessageFeedback } from '@/db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { getOpenAI } from '@/lib/ai-providers';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface LearningInsight {
  type: 'preference' | 'topic' | 'correction' | 'pattern';
  key: string;
  value: string;
  confidence: number;
}

export interface ConversationAnalysis {
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  actionsTaken: string[];
  questionsAsked: string[];
}

// ============================================================================
// PREFERENCE LEARNING
// ============================================================================

/**
 * Analyze a conversation to extract learning insights
 */
export async function analyzeConversationForLearning(
  conversationId: string,
  workspaceId: string,
  userId: string
): Promise<LearningInsight[]> {
  try {
    // Get conversation messages
    const messages = await db.query.aiMessages.findMany({
      where: eq(aiMessages.conversationId, conversationId),
      orderBy: [aiMessages.createdAt],
    });

    if (messages.length < 4) {
      // Not enough messages to analyze
      return [];
    }

    // Prepare conversation text for analysis
    const conversationText = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    // Use AI to extract insights
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are analyzing a conversation between a user and an AI assistant to learn about the user's preferences and patterns. Extract insights in JSON format.

Output a JSON array of insights with this structure:
{
  "insights": [
    {
      "type": "preference" | "topic" | "pattern",
      "key": "short descriptive key",
      "value": "the learned insight",
      "confidence": 0.0-1.0
    }
  ]
}

Focus on:
- Communication style preferences (brief vs detailed)
- Topics of interest (CRM, marketing, automation, etc.)
- Work patterns (times, priorities)
- Frequently asked types of questions
- How they like to receive information

Only include insights with confidence >= 0.6. Output valid JSON only.`,
        },
        {
          role: 'user',
          content: `Analyze this conversation:\n\n${conversationText}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const analysisText = response.choices[0]?.message?.content;
    if (!analysisText) return [];

    try {
      const analysis = JSON.parse(analysisText) as { insights: LearningInsight[] };
      return analysis.insights || [];
    } catch {
      logger.warn('Failed to parse learning insights JSON');
      return [];
    }
  } catch (error) {
    logger.error('Failed to analyze conversation for learning', error);
    return [];
  }
}

/**
 * Update user preferences based on learned insights
 */
export async function updateUserPreferencesFromInsights(
  workspaceId: string,
  userId: string,
  insights: LearningInsight[]
): Promise<void> {
  try {
    if (insights.length === 0) return;

    // Get current preferences
    const currentPrefs = await db.query.aiUserPreferences.findFirst({
      where: and(
        eq(aiUserPreferences.workspaceId, workspaceId),
        eq(aiUserPreferences.userId, userId)
      ),
    });

    if (!currentPrefs) return;

    const updates: Partial<{
      communicationStyle: string;
      topicsOfInterest: string[];
    }> = {};

    // Process insights
    for (const insight of insights) {
      if (insight.confidence < 0.7) continue;

      switch (insight.type) {
        case 'preference':
          if (insight.key === 'communication_style') {
            if (insight.value.toLowerCase().includes('brief') || 
                insight.value.toLowerCase().includes('concise')) {
              updates.communicationStyle = 'concise';
            } else if (insight.value.toLowerCase().includes('detail')) {
              updates.communicationStyle = 'detailed';
            }
          }
          break;

        case 'topic':
          const currentTopics = currentPrefs.topicsOfInterest || [];
          if (!currentTopics.includes(insight.value)) {
            updates.topicsOfInterest = [...currentTopics, insight.value].slice(-10);
          }
          break;
      }
    }

    // Update if we have changes
    if (Object.keys(updates).length > 0) {
      await db
        .update(aiUserPreferences)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(aiUserPreferences.workspaceId, workspaceId),
            eq(aiUserPreferences.userId, userId)
          )
        );

      logger.info('Updated user preferences from learning', { userId, updates });
    }
  } catch (error) {
    logger.error('Failed to update user preferences from insights', error);
  }
}

/**
 * Record a user correction to improve future responses
 */
export async function recordCorrection(
  workspaceId: string,
  userId: string,
  wrongResponse: string,
  correctInfo: string
): Promise<void> {
  try {
    const prefs = await db.query.aiUserPreferences.findFirst({
      where: and(
        eq(aiUserPreferences.workspaceId, workspaceId),
        eq(aiUserPreferences.userId, userId)
      ),
    });

    if (!prefs) return;

    const currentCorrections = (prefs.corrections as Array<{
      wrong: string;
      correct: string;
      timestamp: string;
    }>) || [];

    // Add new correction (keep last 20)
    const newCorrections = [
      ...currentCorrections,
      {
        wrong: wrongResponse.slice(0, 200),
        correct: correctInfo.slice(0, 200),
        timestamp: new Date().toISOString(),
      },
    ].slice(-20);

    await db
      .update(aiUserPreferences)
      .set({
        corrections: newCorrections,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(aiUserPreferences.workspaceId, workspaceId),
          eq(aiUserPreferences.userId, userId)
        )
      );

    logger.info('Recorded user correction', { userId });
  } catch (error) {
    logger.error('Failed to record correction', error);
  }
}

// ============================================================================
// FREQUENT QUESTIONS TRACKING
// ============================================================================

/**
 * Track frequently asked questions to anticipate user needs
 */
export async function trackFrequentQuestion(
  workspaceId: string,
  userId: string,
  question: string
): Promise<void> {
  try {
    // Normalize the question (simple approach)
    const normalizedQuestion = question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim()
      .slice(0, 100);

    if (normalizedQuestion.length < 10) return;

    const prefs = await db.query.aiUserPreferences.findFirst({
      where: and(
        eq(aiUserPreferences.workspaceId, workspaceId),
        eq(aiUserPreferences.userId, userId)
      ),
    });

    if (!prefs) return;

    const currentQuestions = prefs.frequentQuestions || [];
    
    // Check if similar question exists (simple matching)
    const existingIdx = currentQuestions.findIndex((q) =>
      q.toLowerCase().includes(normalizedQuestion.slice(0, 30)) ||
      normalizedQuestion.includes(q.toLowerCase().slice(0, 30))
    );

    if (existingIdx === -1) {
      // Add new question (keep last 10)
      const updatedQuestions = [...currentQuestions, question.slice(0, 100)].slice(-10);
      
      await db
        .update(aiUserPreferences)
        .set({
          frequentQuestions: updatedQuestions,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(aiUserPreferences.workspaceId, workspaceId),
            eq(aiUserPreferences.userId, userId)
          )
        );
    }
  } catch (error) {
    logger.error('Failed to track frequent question', error);
  }
}

// ============================================================================
// MESSAGE FEEDBACK
// ============================================================================

/**
 * Record feedback on an AI message (thumbs up/down)
 */
export async function recordMessageFeedback(
  messageId: string,
  workspaceId: string,
  userId: string,
  feedbackType: 'positive' | 'negative',
  comment?: string
): Promise<boolean> {
  try {
    await db.insert(aiMessageFeedback).values({
      messageId,
      workspaceId,
      userId,
      feedbackType,
      comment: comment || null,
    });

    logger.info('Recorded message feedback', { messageId, feedbackType });

    // If negative feedback, potentially trigger learning
    if (feedbackType === 'negative' && comment) {
      // Get the message content
      const message = await db.query.aiMessages.findFirst({
        where: eq(aiMessages.id, messageId),
      });

      if (message) {
        await recordCorrection(workspaceId, userId, message.content, comment);
      }
    }

    return true;
  } catch (error) {
    // Might be duplicate feedback - that's okay
    logger.warn('Failed to record message feedback', { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

// ============================================================================
// CONVERSATION SUMMARIZATION
// ============================================================================

/**
 * Generate a summary of a conversation for future reference
 */
export async function summarizeConversation(
  conversationId: string
): Promise<string | null> {
  try {
    const messages = await db.query.aiMessages.findMany({
      where: eq(aiMessages.conversationId, conversationId),
      orderBy: [aiMessages.createdAt],
    });

    if (messages.length < 3) return null;

    const conversationText = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Summarize this conversation in 1-2 sentences. Focus on what was discussed and any actions taken or decisions made.',
        },
        {
          role: 'user',
          content: conversationText,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });

    return response.choices[0]?.message?.content || null;
  } catch (error) {
    logger.error('Failed to summarize conversation', error);
    return null;
  }
}

// ============================================================================
// PERIODIC LEARNING (Background Job)
// ============================================================================

/**
 * Process recent conversations for learning (run periodically)
 */
export async function processRecentConversationsForLearning(
  workspaceId: string,
  userId: string,
  limit = 5
): Promise<void> {
  try {
    // Get recent completed conversations
    const recentConversations = await db.query.aiConversations.findMany({
      where: and(
        eq(aiConversations.workspaceId, workspaceId),
        eq(aiConversations.userId, userId)
      ),
      orderBy: [desc(aiConversations.lastMessageAt)],
      limit,
    });

    for (const conv of recentConversations) {
      // Analyze each conversation
      const insights = await analyzeConversationForLearning(
        conv.id,
        workspaceId,
        userId
      );

      if (insights.length > 0) {
        await updateUserPreferencesFromInsights(workspaceId, userId, insights);
      }
    }

    logger.info('Processed conversations for learning', { 
      userId, 
      conversationCount: recentConversations.length 
    });
  } catch (error) {
    logger.error('Failed to process conversations for learning', error);
  }
}

// ============================================================================
// CONTEXT RETRIEVAL FOR PROMPTS
// ============================================================================

/**
 * Get relevant historical context to include in prompts
 */
export async function getRelevantHistory(
  workspaceId: string,
  userId: string,
  currentQuery: string,
  limit = 3
): Promise<string[]> {
  try {
    // Get recent conversation topics
    const recentConversations = await db.query.aiConversations.findMany({
      where: and(
        eq(aiConversations.workspaceId, workspaceId),
        eq(aiConversations.userId, userId)
      ),
      orderBy: [desc(aiConversations.lastMessageAt)],
      limit: 10,
    });

    // Simple keyword matching for relevance (could be enhanced with embeddings)
    const queryWords = currentQuery.toLowerCase().split(/\s+/);
    
    const relevantTopics = recentConversations
      .filter((conv) => {
        const title = conv.title.toLowerCase();
        return queryWords.some((word) => word.length > 3 && title.includes(word));
      })
      .slice(0, limit)
      .map((conv) => conv.title);

    return relevantTopics;
  } catch (error) {
    logger.error('Failed to get relevant history', error);
    return [];
  }
}

