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

// ============================================================================
// ENHANCED PATTERN DETECTION (Phase 3)
// ============================================================================

export interface AutomationSuggestion {
  id: string;
  sequence: string[];
  frequency: number;
  confidence: number;
  suggestedName: string;
  description: string;
  estimatedTimeSaved: number; // minutes per execution
  suggestedTrigger: string;
  createdAt: Date;
}

export interface OptimalTiming {
  actionType: string;
  optimalHours: number[];
  optimalDays: number[];
  successRateByHour: Record<number, number>;
  averageResponseTimeByHour: Record<number, number>;
}

export interface ActionFeedback {
  actionType: string;
  toolName: string;
  wasAccepted: boolean;
  wasSuccessful: boolean;
  timestamp: Date;
  contextTags: string[];
}

/**
 * Analyze task sequences and generate automation suggestions
 */
export async function generateAutomationSuggestions(
  workspaceId: string,
  userId: string,
  actionHistory: Array<{ toolName: string; actionType: string; timestamp: Date; resultStatus: string }>
): Promise<AutomationSuggestion[]> {
  if (actionHistory.length < 10) {
    return [];
  }

  // Find repeating sequences (3+ occurrences)
  const sequences = detectRepeatingSequences(actionHistory, 3);
  
  if (sequences.length === 0) {
    return [];
  }

  const suggestions: AutomationSuggestion[] = [];

  for (const seq of sequences) {
    if (seq.frequency < 3) continue;

    // Calculate confidence based on consistency
    const confidence = Math.min(0.95, 0.5 + (seq.frequency * 0.1));
    
    // Estimate time saved (assume 1 min per action)
    const estimatedTimeSaved = seq.sequence.length * 1;
    
    // Generate suggestion name
    const suggestedName = generateWorkflowName(seq.sequence);
    
    // Determine likely trigger
    const suggestedTrigger = determineTrigger(seq.sequence, actionHistory);

    suggestions.push({
      id: `auto_${workspaceId}_${Date.now()}_${suggestions.length}`,
      sequence: seq.sequence,
      frequency: seq.frequency,
      confidence,
      suggestedName,
      description: `Automate the sequence: ${seq.sequence.join(' → ')}`,
      estimatedTimeSaved,
      suggestedTrigger,
      createdAt: new Date(),
    });
  }

  // Sort by frequency * confidence
  return suggestions
    .sort((a, b) => (b.frequency * b.confidence) - (a.frequency * a.confidence))
    .slice(0, 5); // Top 5 suggestions
}

/**
 * Detect repeating action sequences
 */
function detectRepeatingSequences(
  actionHistory: Array<{ toolName: string; timestamp: Date }>,
  minOccurrences: number
): Array<{ sequence: string[]; frequency: number; lastUsed: Date }> {
  const sequenceMap = new Map<string, { sequence: string[]; count: number; lastUsed: Date }>();
  
  // Look for sequences of length 2-5
  for (let seqLength = 2; seqLength <= 5; seqLength++) {
    for (let i = 0; i <= actionHistory.length - seqLength; i++) {
      // Check if actions are within a reasonable time window (10 min)
      const startTime = actionHistory[i].timestamp.getTime();
      const endTime = actionHistory[i + seqLength - 1].timestamp.getTime();
      
      if ((endTime - startTime) > 10 * 60 * 1000) continue; // Skip if > 10 min
      
      const sequence = actionHistory
        .slice(i, i + seqLength)
        .map(a => a.toolName);
      
      const key = sequence.join('→');
      
      const existing = sequenceMap.get(key);
      if (existing) {
        existing.count++;
        existing.lastUsed = actionHistory[i + seqLength - 1].timestamp;
      } else {
        sequenceMap.set(key, {
          sequence,
          count: 1,
          lastUsed: actionHistory[i + seqLength - 1].timestamp,
        });
      }
    }
  }
  
  return Array.from(sequenceMap.values())
    .filter(s => s.count >= minOccurrences)
    .map(s => ({ sequence: s.sequence, frequency: s.count, lastUsed: s.lastUsed }))
    .sort((a, b) => b.frequency - a.frequency);
}

/**
 * Generate a human-readable workflow name from action sequence
 */
function generateWorkflowName(sequence: string[]): string {
  const toolLabels: Record<string, string> = {
    'create_lead': 'Lead',
    'send_email': 'Email',
    'schedule_meeting': 'Meeting',
    'create_task': 'Task',
    'update_prospect': 'Prospect',
    'add_note': 'Note',
    'generate_content': 'Content',
    'analyze_data': 'Analysis',
  };
  
  const parts = sequence.map(tool => toolLabels[tool] || tool.replace(/_/g, ' '));
  
  if (parts.length === 2) {
    return `${parts[0]} to ${parts[1]} Flow`;
  }
  
  return `${parts[0]} Workflow`;
}

/**
 * Determine the likely trigger for a workflow
 */
function determineTrigger(
  sequence: string[],
  actionHistory: Array<{ toolName: string; timestamp: Date }>
): string {
  const firstAction = sequence[0];
  
  // Common trigger mappings
  const triggerMap: Record<string, string> = {
    'create_lead': 'When a new lead is created',
    'receive_email': 'When an email is received',
    'schedule_meeting': 'When a meeting is scheduled',
    'create_task': 'When a task is created',
    'update_prospect': 'When a prospect is updated',
  };
  
  return triggerMap[firstAction] || `After ${firstAction.replace(/_/g, ' ')}`;
}

/**
 * Learn optimal timing for actions based on success rates
 */
export async function learnOptimalTiming(
  workspaceId: string,
  actionHistory: Array<{
    toolName: string;
    actionType: string;
    timestamp: Date;
    resultStatus: string;
    userApproved?: boolean;
  }>
): Promise<OptimalTiming[]> {
  if (actionHistory.length < 20) {
    return [];
  }

  // Group by action type
  const actionGroups = new Map<string, typeof actionHistory>();
  
  for (const action of actionHistory) {
    const key = action.actionType || action.toolName;
    if (!actionGroups.has(key)) {
      actionGroups.set(key, []);
    }
    actionGroups.get(key)!.push(action);
  }

  const timings: OptimalTiming[] = [];

  for (const [actionType, actions] of actionGroups) {
    if (actions.length < 5) continue;

    const successByHour: Record<number, { success: number; total: number }> = {};
    const responseTimeByHour: Record<number, number[]> = {};

    for (const action of actions) {
      const hour = action.timestamp.getHours();
      
      if (!successByHour[hour]) {
        successByHour[hour] = { success: 0, total: 0 };
      }
      successByHour[hour].total++;
      
      if (action.resultStatus === 'success' || action.userApproved === true) {
        successByHour[hour].success++;
      }
    }

    // Calculate success rates
    const successRateByHour: Record<number, number> = {};
    const averageResponseTimeByHour: Record<number, number> = {};
    const hoursWithData: Array<{ hour: number; rate: number; count: number }> = [];

    for (const [hour, data] of Object.entries(successByHour)) {
      const h = parseInt(hour);
      const rate = data.total > 0 ? (data.success / data.total) * 100 : 0;
      successRateByHour[h] = Math.round(rate);
      averageResponseTimeByHour[h] = responseTimeByHour[h]?.length 
        ? Math.round(responseTimeByHour[h].reduce((a, b) => a + b, 0) / responseTimeByHour[h].length)
        : 0;
      
      if (data.total >= 2) {
        hoursWithData.push({ hour: h, rate, count: data.total });
      }
    }

    // Find optimal hours (top 25% success rate)
    hoursWithData.sort((a, b) => b.rate - a.rate);
    const optimalHours = hoursWithData
      .slice(0, Math.max(3, Math.ceil(hoursWithData.length * 0.25)))
      .map(h => h.hour)
      .sort((a, b) => a - b);

    // Find optimal days from timestamps
    const daySuccess: Record<number, { success: number; total: number }> = {};
    for (const action of actions) {
      const day = action.timestamp.getDay();
      if (!daySuccess[day]) {
        daySuccess[day] = { success: 0, total: 0 };
      }
      daySuccess[day].total++;
      if (action.resultStatus === 'success' || action.userApproved === true) {
        daySuccess[day].success++;
      }
    }

    const daysWithData = Object.entries(daySuccess)
      .filter(([_, data]) => data.total >= 2)
      .map(([day, data]) => ({
        day: parseInt(day),
        rate: (data.success / data.total) * 100,
      }))
      .sort((a, b) => b.rate - a.rate);

    const optimalDays = daysWithData
      .slice(0, Math.max(2, Math.ceil(daysWithData.length * 0.4)))
      .map(d => d.day)
      .sort((a, b) => a - b);

    timings.push({
      actionType,
      optimalHours,
      optimalDays: optimalDays.length > 0 ? optimalDays : [1, 2, 3, 4, 5], // Default weekdays
      successRateByHour,
      averageResponseTimeByHour,
    });
  }

  return timings;
}

/**
 * Track action feedback for learning
 */
export async function trackActionFeedback(
  workspaceId: string,
  userId: string,
  feedback: ActionFeedback
): Promise<void> {
  try {
    const existing = await db.query.workspaceIntelligence.findFirst({
      where: eq(workspaceIntelligence.workspaceId, workspaceId),
    });

    const learnedPatterns = (existing?.learnedPatterns as Record<string, unknown>) || {};
    const feedbackHistory = (learnedPatterns.actionFeedback as ActionFeedback[]) || [];

    // Keep last 500 feedback items
    const updatedFeedback = [...feedbackHistory, feedback].slice(-500);

    if (existing) {
      await db.update(workspaceIntelligence)
        .set({
          learnedPatterns: {
            ...learnedPatterns,
            actionFeedback: updatedFeedback,
          },
          lastUpdated: new Date(),
        })
        .where(eq(workspaceIntelligence.workspaceId, workspaceId));
    }

    logger.debug('[Patterns] Tracked action feedback', { workspaceId, actionType: feedback.actionType });
  } catch (error) {
    logger.error('[Patterns] Failed to track action feedback', error);
  }
}

/**
 * Get acceptance rate for an action type
 */
export async function getActionAcceptanceRate(
  workspaceId: string,
  actionType: string
): Promise<{ acceptanceRate: number; sampleSize: number }> {
  try {
    const existing = await db.query.workspaceIntelligence.findFirst({
      where: eq(workspaceIntelligence.workspaceId, workspaceId),
    });

    const learnedPatterns = (existing?.learnedPatterns as Record<string, unknown>) || {};
    const feedbackHistory = (learnedPatterns.actionFeedback as ActionFeedback[]) || [];

    const relevantFeedback = feedbackHistory.filter(f => f.actionType === actionType);
    
    if (relevantFeedback.length === 0) {
      return { acceptanceRate: 0.5, sampleSize: 0 }; // Default 50% if no data
    }

    const accepted = relevantFeedback.filter(f => f.wasAccepted).length;
    return {
      acceptanceRate: accepted / relevantFeedback.length,
      sampleSize: relevantFeedback.length,
    };
  } catch (error) {
    logger.error('[Patterns] Failed to get acceptance rate', error);
    return { acceptanceRate: 0.5, sampleSize: 0 };
  }
}

/**
 * Check if now is an optimal time for an action
 */
export function isOptimalTime(
  timing: OptimalTiming,
  date: Date = new Date()
): { isOptimal: boolean; score: number; reason: string } {
  const hour = date.getHours();
  const day = date.getDay();
  
  const hourIsOptimal = timing.optimalHours.includes(hour);
  const dayIsOptimal = timing.optimalDays.includes(day);
  
  const hourSuccessRate = timing.successRateByHour[hour] || 50;
  const avgSuccessRate = Object.values(timing.successRateByHour).length > 0
    ? Object.values(timing.successRateByHour).reduce((a, b) => a + b, 0) / Object.values(timing.successRateByHour).length
    : 50;
  
  const score = (hourSuccessRate / 100) * (dayIsOptimal ? 1.2 : 0.8);
  
  let reason = '';
  if (hourIsOptimal && dayIsOptimal) {
    reason = 'Optimal time based on historical success';
  } else if (hourIsOptimal) {
    reason = 'Good hour but not ideal day';
  } else if (dayIsOptimal) {
    reason = 'Good day but not ideal hour';
  } else {
    reason = 'Consider scheduling for optimal time';
  }
  
  return {
    isOptimal: hourIsOptimal && dayIsOptimal,
    score: Math.min(1, Math.max(0, score)),
    reason,
  };
}
