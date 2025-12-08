/**
 * Pattern Recognition System
 * 
 * Tracks user behavior patterns to personalize Neptune's behavior:
 * - Follow-up timing preferences
 * - Communication style preferences
 * - Common task sequences
 * - Preferred action patterns
 */

import { db } from '@/lib/db';
import { workspaceIntelligence } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface UserPatterns {
  followUpTiming: {
    preferredHours: number[]; // Hours of day when user typically responds
    averageResponseTime: number; // Minutes
    preferredDays: number[]; // Days of week (0=Sunday, 6=Saturday)
  };
  communicationStyle: {
    prefersBrief: boolean;
    prefersDetailed: boolean;
    usesEmojis: boolean;
    formalLevel: 'casual' | 'professional' | 'formal';
  };
  taskSequences: Array<{
    sequence: string[]; // Array of tool names in order
    frequency: number;
    lastUsed: Date;
  }>;
  actionPatterns: Record<string, {
    frequency: number;
    averageTime: number; // Minutes between action and response
    successRate: number; // 0-100
  }>;
}

// ============================================================================
// PATTERN DETECTION
// ============================================================================

/**
 * Analyze conversation for timing patterns
 */
export async function analyzeTimingPatterns(
  workspaceId: string,
  messages: Array<{ role: string; timestamp: Date }>
): Promise<UserPatterns['followUpTiming']> {
  if (messages.length < 4) {
    return {
      preferredHours: [9, 10, 11, 14, 15, 16], // Default business hours
      averageResponseTime: 60,
      preferredDays: [1, 2, 3, 4, 5], // Weekdays
    };
  }

  const userMessages = messages.filter(m => m.role === 'user');
  const hours: number[] = [];
  const days: number[] = [];
  const responseTimes: number[] = [];

  for (let i = 1; i < userMessages.length; i++) {
    const prev = userMessages[i - 1].timestamp;
    const curr = userMessages[i].timestamp;
    
    const hour = curr.getHours();
    const day = curr.getDay();
    const timeDiff = (curr.getTime() - prev.getTime()) / (1000 * 60); // Minutes

    hours.push(hour);
    days.push(day);
    if (timeDiff < 1440) { // Less than 24 hours
      responseTimes.push(timeDiff);
    }
  }

  // Find most common hours (top 6)
  const hourCounts = hours.reduce((acc, h) => {
    acc[h] = (acc[h] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  const preferredHours = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([h]) => parseInt(h));

  // Find most common days
  const dayCounts = days.reduce((acc, d) => {
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  const preferredDays = Object.entries(dayCounts)
    .filter(([_, count]) => count >= 2)
    .map(([d]) => parseInt(d));

  const averageResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length)
    : 60;

  return {
    preferredHours: preferredHours.length > 0 ? preferredHours : [9, 10, 11, 14, 15, 16],
    averageResponseTime,
    preferredDays: preferredDays.length > 0 ? preferredDays : [1, 2, 3, 4, 5],
  };
}

/**
 * Analyze communication style from messages
 */
export async function analyzeCommunicationStyle(
  messages: Array<{ role: string; content: string }>
): Promise<UserPatterns['communicationStyle']> {
  const userMessages = messages.filter(m => m.role === 'user');
  
  if (userMessages.length === 0) {
    return {
      prefersBrief: false,
      prefersDetailed: false,
      usesEmojis: false,
      formalLevel: 'professional',
    };
  }

  const avgLength = userMessages.reduce((sum, m) => sum + m.content.length, 0) / userMessages.length;
  const hasEmojis = userMessages.some(m => /[\u{1F300}-\u{1F9FF}]/u.test(m.content));
  const formalIndicators = ['please', 'thank you', 'would you', 'could you'].some(phrase =>
    userMessages.some(m => m.content.toLowerCase().includes(phrase))
  );
  const casualIndicators = ['hey', 'yo', 'lol', 'haha', '!'].some(phrase =>
    userMessages.some(m => m.content.toLowerCase().includes(phrase))
  );

  let formalLevel: 'casual' | 'professional' | 'formal' = 'professional';
  if (casualIndicators && !formalIndicators) {
    formalLevel = 'casual';
  } else if (formalIndicators && !casualIndicators) {
    formalLevel = 'formal';
  }

  return {
    prefersBrief: avgLength < 50,
    prefersDetailed: avgLength > 200,
    usesEmojis: hasEmojis,
    formalLevel,
  };
}

/**
 * Detect common task sequences
 */
export async function detectTaskSequences(
  workspaceId: string,
  actionHistory: Array<{ toolName: string; timestamp: Date }>
): Promise<UserPatterns['taskSequences']> {
  if (actionHistory.length < 3) {
    return [];
  }

  // Group actions by time windows (within 5 minutes = same sequence)
  const sequences: string[][] = [];
  let currentSequence: string[] = [];
  let lastTime: Date | null = null;

  for (const action of actionHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())) {
    if (!lastTime || (action.timestamp.getTime() - lastTime.getTime()) / (1000 * 60) < 5) {
      currentSequence.push(action.toolName);
    } else {
      if (currentSequence.length >= 2) {
        sequences.push([...currentSequence]);
      }
      currentSequence = [action.toolName];
    }
    lastTime = action.timestamp;
  }

  if (currentSequence.length >= 2) {
    sequences.push(currentSequence);
  }

  // Count sequence frequencies
  const sequenceCounts = new Map<string, { sequence: string[]; count: number; lastUsed: Date }>();
  
  for (const seq of sequences) {
    const key = seq.join(' -> ');
    const existing = sequenceCounts.get(key);
    if (existing) {
      existing.count++;
      existing.lastUsed = new Date(); // Update to most recent
    } else {
      sequenceCounts.set(key, {
        sequence: seq,
        count: 1,
        lastUsed: new Date(),
      });
    }
  }

  return Array.from(sequenceCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map(s => ({
      sequence: s.sequence,
      frequency: s.count,
      lastUsed: s.lastUsed,
    }));
}

/**
 * Store patterns in workspace intelligence
 */
export async function storeUserPatterns(
  workspaceId: string,
  patterns: UserPatterns
): Promise<void> {
  try {
    const existing = await db.query.workspaceIntelligence.findFirst({
      where: eq(workspaceIntelligence.workspaceId, workspaceId),
    });

    const patternsData = {
      followUpTiming: patterns.followUpTiming,
      communicationStyle: patterns.communicationStyle,
      taskSequences: patterns.taskSequences,
      actionPatterns: patterns.actionPatterns,
      lastUpdated: new Date().toISOString(),
    };

    if (existing) {
      const learnedPatterns = (existing.learnedPatterns as Record<string, unknown>) || {};
      await db.update(workspaceIntelligence)
        .set({
          learnedPatterns: {
            ...learnedPatterns,
            userPatterns: patternsData,
          },
          lastUpdated: new Date(),
        })
        .where(eq(workspaceIntelligence.workspaceId, workspaceId));
    } else {
      await db.insert(workspaceIntelligence).values({
        workspaceId,
        learnedPatterns: {
          userPatterns: patternsData,
        },
        lastUpdated: new Date(),
      });
    }

    logger.info('[Patterns] Stored user patterns', { workspaceId });
  } catch (error) {
    logger.error('[Patterns] Failed to store patterns', error);
  }
}

/**
 * Get stored user patterns
 */
export async function getUserPatterns(
  workspaceId: string
): Promise<UserPatterns | null> {
  try {
    const intelligence = await db.query.workspaceIntelligence.findFirst({
      where: eq(workspaceIntelligence.workspaceId, workspaceId),
    });

    if (!intelligence || !intelligence.learnedPatterns) {
      return null;
    }

    const patterns = (intelligence.learnedPatterns as Record<string, unknown>).userPatterns as UserPatterns | undefined;
    return patterns || null;
  } catch (error) {
    logger.error('[Patterns] Failed to get patterns', error);
    return null;
  }
}
