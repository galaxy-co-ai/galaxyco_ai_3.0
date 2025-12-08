/**
 * AI Memory & Learning System
 * 
 * This module handles learning user preferences, storing conversation insights,
 * and improving the AI's understanding of each user over time.
 */

import { db } from '@/lib/db';
import { aiUserPreferences, aiMessages, aiConversations, aiMessageFeedback, workspaceIntelligence, neptuneActionHistory } from '@/db/schema';
import { eq, and, desc, sql, gte } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { getOpenAI } from '@/lib/ai-providers';
import { analyzeTimingPatterns, analyzeCommunicationStyle, detectTaskSequences, storeUserPatterns } from '@/lib/ai/patterns';

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
      model: 'gpt-4o',
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
      model: 'gpt-4o',
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

      // Also analyze patterns from this conversation
      const messages = await db.query.aiMessages.findMany({
        where: eq(aiMessages.conversationId, conv.id),
        orderBy: [aiMessages.createdAt],
      });

      if (messages.length >= 4) {
        // Map messages to the format expected by pattern analysis functions
        const messagesWithTimestamp = messages.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: m.createdAt,
        }));
        const timingPatterns = await analyzeTimingPatterns(workspaceId, messagesWithTimestamp);
        const commStyle = await analyzeCommunicationStyle(messagesWithTimestamp);

        // Get action history for task sequences
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const actionHistory = await db.query.neptuneActionHistory.findMany({
          where: and(
            eq(neptuneActionHistory.workspaceId, workspaceId),
            eq(neptuneActionHistory.userId, userId),
            gte(neptuneActionHistory.createdAt, thirtyDaysAgo)
          ),
          orderBy: [neptuneActionHistory.createdAt],
        });

        const taskSequences = await detectTaskSequences(
          workspaceId,
          actionHistory.map(a => ({
            toolName: a.toolName,
            timestamp: a.createdAt,
          }))
        );

        // Store patterns
        await storeUserPatterns(workspaceId, {
          followUpTiming: timingPatterns,
          communicationStyle: commStyle,
          taskSequences,
          actionPatterns: {}, // Can be enhanced later
        });
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

// ============================================================================
// BUSINESS CONTEXT LEARNING (Phase 5.1)
// ============================================================================

/**
 * Learn business context from workspace data and conversations
 */
export async function learnBusinessContext(workspaceId: string): Promise<void> {
  try {
    // Get existing intelligence or create new
    let intelligence = await db.query.workspaceIntelligence.findFirst({
      where: eq(workspaceIntelligence.workspaceId, workspaceId),
    });

    // Analyze conversations to extract business context
    const conversations = await db.query.aiConversations.findMany({
      where: eq(aiConversations.workspaceId, workspaceId),
      orderBy: [desc(aiConversations.createdAt)],
      limit: 50,
    });

    if (conversations.length < 5) {
      // Not enough data to learn from
      return;
    }

    // Get full conversation messages for better analysis
    const conversationIds = conversations.map(c => c.id);
    const allMessages = await db.query.aiMessages.findMany({
      where: sql`${aiMessages.conversationId} = ANY(${conversationIds})`,
      orderBy: [aiMessages.createdAt],
    });

    // Group messages by conversation
    const messagesByConv = new Map<string, typeof allMessages>();
    for (const msg of allMessages) {
      if (!messagesByConv.has(msg.conversationId)) {
        messagesByConv.set(msg.conversationId, []);
      }
      messagesByConv.get(msg.conversationId)!.push(msg);
    }

    // Extract conversation text for analysis (use full content, not just titles)
    const conversationText = Array.from(messagesByConv.values())
      .slice(0, 10) // Analyze top 10 conversations
      .map(msgs => msgs.map(m => `${m.role}: ${m.content}`).join('\n'))
      .join('\n\n---\n\n');

    // Use AI to extract business context
    const openai = getOpenAI();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Analyze conversation titles and extract business context. Output JSON with:
{
  "industry": "detected industry",
  "businessModel": "b2b|b2c|saas|ecommerce|etc",
  "goals": [{"goal": "goal description", "priority": 1-10}],
  "priorities": ["priority1", "priority2"]
}`,
        },
        {
          role: 'user',
          content: `Analyze these conversation titles:\n\n${conversationText}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const context = JSON.parse(response.choices[0]?.message?.content || '{}');

    if (intelligence) {
      // Update existing
      await db.update(workspaceIntelligence)
        .set({
          industry: context.industry || intelligence.industry,
          businessModel: context.businessModel || intelligence.businessModel,
          goals: context.goals || intelligence.goals,
          priorities: context.priorities || intelligence.priorities,
          lastUpdated: new Date(),
        })
        .where(eq(workspaceIntelligence.workspaceId, workspaceId));
    } else {
      // Create new
      await db.insert(workspaceIntelligence).values({
        workspaceId,
        industry: context.industry,
        businessModel: context.businessModel,
        goals: context.goals || [],
        priorities: context.priorities || [],
      });
    }

    logger.info('Learned business context', { workspaceId, context });
  } catch (error) {
    logger.error('Failed to learn business context', { workspaceId, error });
  }
}

/**
 * Get workspace intelligence
 */
export async function getWorkspaceIntelligence(workspaceId: string) {
  try {
    const intelligence = await db.query.workspaceIntelligence.findFirst({
      where: eq(workspaceIntelligence.workspaceId, workspaceId),
    });

    return intelligence || null;
  } catch (error) {
    logger.error('Failed to get workspace intelligence', { workspaceId, error });
    return null;
  }
}

/**
 * Update communication style based on user feedback
 */
export async function updateCommunicationStyle(
  workspaceId: string,
  userId: string,
  style: 'concise' | 'detailed' | 'balanced'
): Promise<void> {
  try {
    const prefs = await db.query.aiUserPreferences.findFirst({
      where: and(
        eq(aiUserPreferences.workspaceId, workspaceId),
        eq(aiUserPreferences.userId, userId)
      ),
    });

    if (prefs) {
      await db.update(aiUserPreferences)
        .set({
          communicationStyle: style,
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
    logger.error('Failed to update communication style', { workspaceId, userId, error });
  }
}

