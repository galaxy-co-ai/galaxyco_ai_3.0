/**
 * Pattern Recognition System
 * 
 * Analyzes historical data to identify user behavior patterns
 * and predict future needs for anticipatory actions.
 */

import { db } from '@/lib/db';
import { prospects, tasks, calendarEvents, campaigns, aiMessages } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { getOpenAI } from '@/lib/ai-providers';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UserPattern {
  type: 'timing' | 'frequency' | 'preference' | 'workflow';
  description: string;
  confidence: number; // 0-1
  actionable: boolean;
}

// ============================================================================
// PATTERN ANALYSIS
// ============================================================================

/**
 * Analyze user patterns from historical data
 */
export async function analyzeUserPatterns(
  workspaceId: string,
  userId: string,
  daysBack = 90
): Promise<UserPattern[]> {
  const patterns: UserPattern[] = [];
  const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

  try {
    // Analyze lead follow-up patterns
    const leads = await db.query.prospects.findMany({
      where: and(
        eq(prospects.workspaceId, workspaceId),
        gte(prospects.createdAt, cutoffDate)
      ),
      orderBy: [desc(prospects.createdAt)],
    });

    // Check follow-up timing patterns
    const followUpDelays: number[] = [];
    for (let i = 0; i < leads.length - 1; i++) {
      const lead = leads[i];
      const nextUpdate = leads.find(l => 
        l.id !== lead.id && 
        l.updatedAt && 
        new Date(l.updatedAt) > new Date(lead.createdAt || lead.updatedAt || 0)
      );
      
      if (nextUpdate && lead.createdAt && nextUpdate.updatedAt) {
        const delay = (new Date(nextUpdate.updatedAt).getTime() - 
                      new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        if (delay > 0 && delay < 30) {
          followUpDelays.push(delay);
        }
      }
    }

    if (followUpDelays.length >= 5) {
      const avgDelay = followUpDelays.reduce((a, b) => a + b, 0) / followUpDelays.length;
      patterns.push({
        type: 'timing',
        description: `User typically follows up with leads after ${Math.round(avgDelay)} days`,
        confidence: Math.min(0.9, followUpDelays.length / 20),
        actionable: true,
      });
    }

    // Analyze task completion patterns
    const allTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.workspaceId, workspaceId),
        gte(tasks.createdAt, cutoffDate)
      ),
    });

    // Check for recurring task patterns
    const taskKeywords = allTasks
      .map(t => t.title.toLowerCase().split(' ')[0])
      .filter(word => word.length > 3);
    
    const keywordCounts: Record<string, number> = {};
    taskKeywords.forEach(keyword => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });

    const recurringKeywords = Object.entries(keywordCounts)
      .filter(([_, count]) => count >= 5)
      .map(([keyword]) => keyword);

    if (recurringKeywords.length > 0) {
      patterns.push({
        type: 'frequency',
        description: `User frequently creates tasks related to: ${recurringKeywords.slice(0, 3).join(', ')}`,
        confidence: 0.7,
        actionable: true,
      });
    }

    // Analyze calendar patterns
    const events = await db.query.calendarEvents.findMany({
      where: and(
        eq(calendarEvents.workspaceId, workspaceId),
        gte(calendarEvents.startTime, cutoffDate)
      ),
    });

    // Check for preferred meeting times
    const hourCounts: Record<number, number> = {};
    events.forEach(event => {
      if (event.startTime) {
        const hour = new Date(event.startTime).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const preferredHour = Object.entries(hourCounts)
      .sort(([_, a], [__, b]) => b - a)[0]?.[0];

    if (preferredHour && events.length >= 10) {
      patterns.push({
        type: 'preference',
        description: `User prefers scheduling meetings around ${preferredHour}:00`,
        confidence: 0.6,
        actionable: true,
      });
    }

    // Use AI to identify additional patterns from conversation history
    const conversations = await db.query.aiMessages.findMany({
      where: and(
        eq(aiMessages.workspaceId, workspaceId),
        gte(aiMessages.createdAt, cutoffDate)
      ),
      orderBy: [desc(aiMessages.createdAt)],
      limit: 100,
    });

    if (conversations.length >= 20) {
      const conversationText = conversations
        .slice(0, 50)
        .map(m => m.content)
        .join('\n')
        .slice(0, 2000); // Limit for API

      try {
        const openai = getOpenAI();
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'Analyze conversation history and identify user behavior patterns. Output JSON array of patterns with type, description, confidence (0-1), and actionable (boolean).',
            },
            {
              role: 'user',
              content: `Identify patterns in these conversations:\n\n${conversationText}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
          response_format: { type: 'json_object' },
        });

        const aiPatterns = JSON.parse(response.choices[0]?.message?.content || '{"patterns": []}');
        if (Array.isArray(aiPatterns.patterns)) {
          patterns.push(...aiPatterns.patterns);
        }
      } catch (error) {
        logger.error('Failed to analyze patterns with AI', error);
      }
    }

    return patterns;
  } catch (error) {
    logger.error('Failed to analyze user patterns', { workspaceId, userId, error });
    return [];
  }
}

/**
 * Generate anticipatory actions based on patterns
 */
export async function generateAnticipatoryActions(
  workspaceId: string,
  userId: string
): Promise<Array<{ action: string; toolName: string; args: Record<string, unknown>; priority: number }>> {
  const actions: Array<{ action: string; toolName: string; args: Record<string, unknown>; priority: number }> = [];
  const patterns = await analyzeUserPatterns(workspaceId, userId);

  for (const pattern of patterns) {
    if (!pattern.actionable) continue;

    if (pattern.type === 'timing' && pattern.description.includes('follow up')) {
      // Find leads that need follow-up based on pattern
      const leads = await db.query.prospects.findMany({
        where: and(
          eq(prospects.workspaceId, workspaceId),
          eq(prospects.stage, 'contacted')
        ),
        limit: 5,
      });

      for (const lead of leads) {
        if (lead.createdAt) {
          const daysSinceCreated = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          const avgDelay = parseFloat(pattern.description.match(/\d+/)?.[0] || '2');
          
          if (daysSinceCreated >= avgDelay - 1 && daysSinceCreated <= avgDelay + 1) {
            actions.push({
              action: `Follow up with ${lead.name}`,
              toolName: 'create_follow_up_sequence',
              args: { leadId: lead.id, sequenceType: 'nurture' },
              priority: 7,
            });
          }
        }
      }
    }
  }

  return actions.sort((a, b) => b.priority - a.priority);
}
