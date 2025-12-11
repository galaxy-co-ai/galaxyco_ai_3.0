/**
 * Cross-User Workspace Intelligence (Phase 3)
 * 
 * Aggregates anonymized patterns across all workspace users to:
 * - Identify best practices from successful users
 * - Recommend improvements based on peer performance
 * - Provide workspace-wide insights
 * 
 * IMPORTANT: Respects privacy - no PII in aggregates
 * 
 * Expected improvements:
 * - Proactive suggestions 2x more relevant
 * - Better onboarding for new users
 * - Workspace-wide optimization insights
 */

import { db } from '@/lib/db';
import { 
  workspaceIntelligence, 
  neptuneActionHistory, 
  aiUserPreferences,
  aiConversations,
  aiMessages,
  workspaceMembers,
} from '@/db/schema';
import { eq, and, gte, sql, desc, count } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { getCache, setCache } from '@/lib/cache';

// ============================================================================
// TYPES
// ============================================================================

export interface WorkspaceMetrics {
  totalUsers: number;
  activeUsers: number;
  totalConversations: number;
  totalActions: number;
  avgActionsPerUser: number;
  avgConversationsPerUser: number;
  topTools: Array<{ tool: string; usageCount: number; successRate: number }>;
  topTopics: Array<{ topic: string; frequency: number }>;
  peakActivityHours: number[];
  peakActivityDays: number[];
}

export interface UserPerformanceProfile {
  userId: string;
  performanceScore: number; // 0-100
  activityLevel: 'low' | 'medium' | 'high';
  topTools: string[];
  successRate: number;
  avgResponseTime: number;
  // Anonymized - no personal details
}

export interface BestPractice {
  id: string;
  category: string;
  practice: string;
  adoptionRate: number; // % of successful users using this
  impactScore: number; // 0-100
  toolsInvolved: string[];
  recommendedFor: string[]; // user segments
}

export interface WorkspaceInsight {
  id: string;
  type: 'optimization' | 'trend' | 'recommendation' | 'alert';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  suggestedAction?: string;
  affectedUsers: number;
  createdAt: Date;
}

export interface CrossUserIntelligence {
  workspaceId: string;
  metrics: WorkspaceMetrics;
  bestPractices: BestPractice[];
  insights: WorkspaceInsight[];
  lastUpdated: Date;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  CACHE_TTL: 60 * 60, // 1 hour
  MIN_USERS_FOR_AGGREGATION: 2, // Need at least 2 users
  MIN_ACTIONS_FOR_PATTERNS: 20,
  LOOKBACK_DAYS: 30,
  TOP_ITEMS_LIMIT: 10,
};

// ============================================================================
// CACHE HELPERS
// ============================================================================

function getCacheKey(workspaceId: string): string {
  return `workspace:intelligence:${workspaceId}`;
}

// ============================================================================
// METRICS COLLECTION
// ============================================================================

/**
 * Collect workspace-wide metrics
 */
export async function collectWorkspaceMetrics(
  workspaceId: string
): Promise<WorkspaceMetrics> {
  const lookbackDate = new Date(Date.now() - CONFIG.LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  
  try {
    // Get workspace members
    const members = await db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.workspaceId, workspaceId),
    });
    
    const totalUsers = members.length;
    
    // Get action history for the workspace
    const actions = await db.query.neptuneActionHistory.findMany({
      where: and(
        eq(neptuneActionHistory.workspaceId, workspaceId),
        gte(neptuneActionHistory.createdAt, lookbackDate)
      ),
    });
    
    // Get conversations
    const conversations = await db.query.aiConversations.findMany({
      where: and(
        eq(aiConversations.workspaceId, workspaceId),
        gte(aiConversations.createdAt, lookbackDate)
      ),
    });
    
    // Calculate active users (users with actions in the lookback period)
    const activeUserIds = new Set(actions.map(a => a.userId));
    const activeUsers = activeUserIds.size;
    
    // Tool usage analysis
    const toolUsage = new Map<string, { count: number; success: number }>();
    for (const action of actions) {
      const tool = action.toolName;
      if (!toolUsage.has(tool)) {
        toolUsage.set(tool, { count: 0, success: 0 });
      }
      const usage = toolUsage.get(tool)!;
      usage.count++;
      if (action.resultStatus === 'success') {
        usage.success++;
      }
    }
    
    const topTools = Array.from(toolUsage.entries())
      .map(([tool, data]) => ({
        tool,
        usageCount: data.count,
        successRate: data.count > 0 ? Math.round((data.success / data.count) * 100) : 0,
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, CONFIG.TOP_ITEMS_LIMIT);
    
    // Topic analysis from conversations
    const topicCounts = new Map<string, number>();
    for (const conv of conversations) {
      const topic = conv.title.split(' ').slice(0, 3).join(' '); // Simple topic extraction
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1);
    }
    
    const topTopics = Array.from(topicCounts.entries())
      .map(([topic, frequency]) => ({ topic, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, CONFIG.TOP_ITEMS_LIMIT);
    
    // Peak activity analysis
    const hourCounts = new Map<number, number>();
    const dayCounts = new Map<number, number>();
    
    for (const action of actions) {
      const hour = action.createdAt.getHours();
      const day = action.createdAt.getDay();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
    }
    
    const peakActivityHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([hour]) => hour)
      .sort((a, b) => a - b);
    
    const peakActivityDays = Array.from(dayCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day)
      .sort((a, b) => a - b);
    
    return {
      totalUsers,
      activeUsers,
      totalConversations: conversations.length,
      totalActions: actions.length,
      avgActionsPerUser: activeUsers > 0 ? Math.round(actions.length / activeUsers) : 0,
      avgConversationsPerUser: activeUsers > 0 ? Math.round(conversations.length / activeUsers) : 0,
      topTools,
      topTopics,
      peakActivityHours: peakActivityHours.length > 0 ? peakActivityHours : [9, 10, 14, 15],
      peakActivityDays: peakActivityDays.length > 0 ? peakActivityDays : [1, 2, 3, 4, 5],
    };
  } catch (error) {
    logger.error('[WorkspaceIntelligence] Failed to collect metrics', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalConversations: 0,
      totalActions: 0,
      avgActionsPerUser: 0,
      avgConversationsPerUser: 0,
      topTools: [],
      topTopics: [],
      peakActivityHours: [9, 10, 14, 15],
      peakActivityDays: [1, 2, 3, 4, 5],
    };
  }
}

// ============================================================================
// BEST PRACTICES IDENTIFICATION
// ============================================================================

/**
 * Identify best practices from top-performing users
 */
export async function identifyBestPractices(
  workspaceId: string
): Promise<BestPractice[]> {
  const lookbackDate = new Date(Date.now() - CONFIG.LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  
  try {
    // Get all user action histories
    const actions = await db.query.neptuneActionHistory.findMany({
      where: and(
        eq(neptuneActionHistory.workspaceId, workspaceId),
        gte(neptuneActionHistory.createdAt, lookbackDate)
      ),
      orderBy: [neptuneActionHistory.createdAt],
    });
    
    if (actions.length < CONFIG.MIN_ACTIONS_FOR_PATTERNS) {
      return [];
    }
    
    // Group actions by user
    const userActions = new Map<string, typeof actions>();
    for (const action of actions) {
      if (!userActions.has(action.userId)) {
        userActions.set(action.userId, []);
      }
      userActions.get(action.userId)!.push(action);
    }
    
    // Calculate success rate per user
    const userPerformance: Array<{ userId: string; successRate: number; actionCount: number }> = [];
    for (const [userId, userActionList] of userActions) {
      const successful = userActionList.filter(a => a.resultStatus === 'success').length;
      userPerformance.push({
        userId,
        successRate: userActionList.length > 0 ? successful / userActionList.length : 0,
        actionCount: userActionList.length,
      });
    }
    
    // Identify top performers (top 25%)
    userPerformance.sort((a, b) => b.successRate - a.successRate);
    const topPerformerCount = Math.max(1, Math.ceil(userPerformance.length * 0.25));
    const topPerformers = userPerformance.slice(0, topPerformerCount);
    const topPerformerIds = new Set(topPerformers.map(p => p.userId));
    
    // Analyze patterns unique to top performers
    const topPerformerTools = new Map<string, number>();
    const otherUserTools = new Map<string, number>();
    
    for (const action of actions) {
      const toolMap = topPerformerIds.has(action.userId) ? topPerformerTools : otherUserTools;
      toolMap.set(action.toolName, (toolMap.get(action.toolName) || 0) + 1);
    }
    
    // Find tools more commonly used by top performers
    const bestPractices: BestPractice[] = [];
    
    for (const [tool, topCount] of topPerformerTools) {
      const otherCount = otherUserTools.get(tool) || 0;
      const topRate = topCount / topPerformers.length;
      const otherRate = userPerformance.length > topPerformerCount 
        ? otherCount / (userPerformance.length - topPerformerCount)
        : 0;
      
      // If top performers use this tool significantly more
      if (topRate > otherRate * 1.5 && topCount >= 3) {
        bestPractices.push({
          id: `bp_${workspaceId}_${tool}_${Date.now()}`,
          category: 'tool_usage',
          practice: `Regular use of ${tool.replace(/_/g, ' ')}`,
          adoptionRate: Math.round(topRate * 100),
          impactScore: Math.round((topRate - otherRate) * 100),
          toolsInvolved: [tool],
          recommendedFor: ['all_users'],
        });
      }
    }
    
    // Analyze timing patterns of top performers
    const topPerformerHours = new Map<number, number>();
    for (const action of actions) {
      if (topPerformerIds.has(action.userId)) {
        const hour = action.createdAt.getHours();
        topPerformerHours.set(hour, (topPerformerHours.get(hour) || 0) + 1);
      }
    }
    
    const peakHours = Array.from(topPerformerHours.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([h]) => h);
    
    if (peakHours.length > 0) {
      bestPractices.push({
        id: `bp_${workspaceId}_timing_${Date.now()}`,
        category: 'timing',
        practice: `Focus work during ${peakHours.map(h => `${h}:00`).join(', ')} for best results`,
        adoptionRate: Math.round((topPerformers.length / userPerformance.length) * 100),
        impactScore: 60,
        toolsInvolved: [],
        recommendedFor: ['all_users'],
      });
    }
    
    return bestPractices.slice(0, 5);
  } catch (error) {
    logger.error('[WorkspaceIntelligence] Failed to identify best practices', error);
    return [];
  }
}

// ============================================================================
// INSIGHTS GENERATION
// ============================================================================

/**
 * Generate workspace insights based on aggregated data
 */
export async function generateWorkspaceInsights(
  workspaceId: string,
  metrics: WorkspaceMetrics
): Promise<WorkspaceInsight[]> {
  const insights: WorkspaceInsight[] = [];
  const now = new Date();
  
  // Low adoption insight
  if (metrics.activeUsers < metrics.totalUsers * 0.5) {
    insights.push({
      id: `insight_${workspaceId}_adoption_${now.getTime()}`,
      type: 'alert',
      title: 'Low User Adoption',
      description: `Only ${metrics.activeUsers} of ${metrics.totalUsers} users are actively using Neptune. Consider team training or onboarding sessions.`,
      impact: 'high',
      actionable: true,
      suggestedAction: 'Schedule a team demo or create quick-start guides',
      affectedUsers: metrics.totalUsers - metrics.activeUsers,
      createdAt: now,
    });
  }
  
  // Underutilized features
  if (metrics.topTools.length > 0) {
    const lowUsageTools = metrics.topTools.filter(t => t.usageCount < 5);
    if (lowUsageTools.length >= 3) {
      insights.push({
        id: `insight_${workspaceId}_features_${now.getTime()}`,
        type: 'recommendation',
        title: 'Underutilized Features',
        description: `Several features have low usage. Consider exploring: ${lowUsageTools.map(t => t.tool.replace(/_/g, ' ')).join(', ')}`,
        impact: 'medium',
        actionable: true,
        suggestedAction: 'Review feature documentation or request a feature walkthrough',
        affectedUsers: metrics.activeUsers,
        createdAt: now,
      });
    }
  }
  
  // Success rate trend
  const avgSuccessRate = metrics.topTools.length > 0
    ? metrics.topTools.reduce((sum, t) => sum + t.successRate, 0) / metrics.topTools.length
    : 0;
  
  if (avgSuccessRate < 70) {
    insights.push({
      id: `insight_${workspaceId}_success_${now.getTime()}`,
      type: 'optimization',
      title: 'Room for Improvement',
      description: `Average action success rate is ${Math.round(avgSuccessRate)}%. Focus on improving workflows for better results.`,
      impact: 'medium',
      actionable: true,
      suggestedAction: 'Review failed actions and refine prompts or workflows',
      affectedUsers: metrics.activeUsers,
      createdAt: now,
    });
  } else if (avgSuccessRate >= 85) {
    insights.push({
      id: `insight_${workspaceId}_success_high_${now.getTime()}`,
      type: 'trend',
      title: 'High Performance',
      description: `Workspace is performing well with ${Math.round(avgSuccessRate)}% success rate.`,
      impact: 'low',
      actionable: false,
      affectedUsers: metrics.activeUsers,
      createdAt: now,
    });
  }
  
  // Peak activity insight
  if (metrics.peakActivityHours.length > 0) {
    insights.push({
      id: `insight_${workspaceId}_activity_${now.getTime()}`,
      type: 'trend',
      title: 'Peak Activity Patterns',
      description: `Most productive hours: ${metrics.peakActivityHours.map(h => `${h}:00`).join(', ')}. Consider scheduling important tasks during these times.`,
      impact: 'low',
      actionable: true,
      suggestedAction: 'Align critical work with peak productivity hours',
      affectedUsers: metrics.activeUsers,
      createdAt: now,
    });
  }
  
  return insights;
}

// ============================================================================
// MAIN INTELLIGENCE FUNCTIONS
// ============================================================================

/**
 * Get or generate cross-user intelligence for a workspace
 */
export async function getCrossUserIntelligence(
  workspaceId: string,
  forceRefresh = false
): Promise<CrossUserIntelligence | null> {
  // Check cache first
  if (!forceRefresh) {
    const cached = await getCache<CrossUserIntelligence>(
      getCacheKey(workspaceId),
      { prefix: '', ttl: CONFIG.CACHE_TTL }
    );
    if (cached) {
      return cached;
    }
  }
  
  try {
    // Collect all data
    const metrics = await collectWorkspaceMetrics(workspaceId);
    
    // Need minimum users for meaningful aggregation
    if (metrics.totalUsers < CONFIG.MIN_USERS_FOR_AGGREGATION) {
      logger.info('[WorkspaceIntelligence] Not enough users for aggregation', { 
        workspaceId, 
        totalUsers: metrics.totalUsers 
      });
      return null;
    }
    
    const bestPractices = await identifyBestPractices(workspaceId);
    const insights = await generateWorkspaceInsights(workspaceId, metrics);
    
    const intelligence: CrossUserIntelligence = {
      workspaceId,
      metrics,
      bestPractices,
      insights,
      lastUpdated: new Date(),
    };
    
    // Cache the result
    await setCache(getCacheKey(workspaceId), intelligence, { 
      prefix: '', 
      ttl: CONFIG.CACHE_TTL 
    });
    
    logger.info('[WorkspaceIntelligence] Generated intelligence', {
      workspaceId,
      metricsCount: Object.keys(metrics).length,
      bestPracticesCount: bestPractices.length,
      insightsCount: insights.length,
    });
    
    return intelligence;
  } catch (error) {
    logger.error('[WorkspaceIntelligence] Failed to generate intelligence', error);
    return null;
  }
}

/**
 * Get personalized recommendations for a user based on workspace intelligence
 */
export async function getPersonalizedRecommendations(
  workspaceId: string,
  userId: string
): Promise<Array<{ recommendation: string; priority: number; reason: string }>> {
  const intelligence = await getCrossUserIntelligence(workspaceId);
  if (!intelligence) {
    return [];
  }
  
  const recommendations: Array<{ recommendation: string; priority: number; reason: string }> = [];
  
  // Get user's current tool usage
  const lookbackDate = new Date(Date.now() - CONFIG.LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const userActions = await db.query.neptuneActionHistory.findMany({
    where: and(
      eq(neptuneActionHistory.workspaceId, workspaceId),
      eq(neptuneActionHistory.userId, userId),
      gte(neptuneActionHistory.createdAt, lookbackDate)
    ),
  });
  
  const userTools = new Set(userActions.map(a => a.toolName));
  
  // Recommend best practices user isn't following
  for (const practice of intelligence.bestPractices) {
    const userHasTools = practice.toolsInvolved.every(t => userTools.has(t));
    
    if (!userHasTools && practice.toolsInvolved.length > 0) {
      recommendations.push({
        recommendation: practice.practice,
        priority: practice.impactScore,
        reason: `${practice.adoptionRate}% of top performers use this approach`,
      });
    }
  }
  
  // Recommend underused tools from workspace top tools
  for (const tool of intelligence.metrics.topTools.slice(0, 5)) {
    if (!userTools.has(tool.tool) && tool.successRate > 70) {
      recommendations.push({
        recommendation: `Try using ${tool.tool.replace(/_/g, ' ')} - it has a ${tool.successRate}% success rate`,
        priority: Math.round(tool.successRate * 0.5),
        reason: 'Commonly used by your colleagues',
      });
    }
  }
  
  // Sort by priority
  return recommendations
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 5);
}

/**
 * Build context string from workspace intelligence for AI prompt
 */
export function buildWorkspaceIntelligenceContext(
  intelligence: CrossUserIntelligence
): string {
  const parts: string[] = [];
  
  // Workspace metrics summary
  parts.push(`## Workspace Activity
- Active users: ${intelligence.metrics.activeUsers}/${intelligence.metrics.totalUsers}
- Peak hours: ${intelligence.metrics.peakActivityHours.map(h => `${h}:00`).join(', ')}`);
  
  // Top tools
  if (intelligence.metrics.topTools.length > 0) {
    const toolList = intelligence.metrics.topTools
      .slice(0, 5)
      .map(t => `${t.tool.replace(/_/g, ' ')} (${t.successRate}% success)`)
      .join(', ');
    parts.push(`## Popular Tools\n${toolList}`);
  }
  
  // Best practices
  if (intelligence.bestPractices.length > 0) {
    const practices = intelligence.bestPractices
      .slice(0, 3)
      .map(p => `- ${p.practice}`)
      .join('\n');
    parts.push(`## Best Practices\n${practices}`);
  }
  
  // Active insights
  const activeInsights = intelligence.insights
    .filter(i => i.impact !== 'low')
    .slice(0, 2);
  
  if (activeInsights.length > 0) {
    const insightList = activeInsights
      .map(i => `- [${i.type.toUpperCase()}] ${i.title}: ${i.description}`)
      .join('\n');
    parts.push(`## Current Insights\n${insightList}`);
  }
  
  if (parts.length === 0) {
    return '';
  }
  
  return `--- WORKSPACE INTELLIGENCE ---\n${parts.join('\n\n')}\n--- END WORKSPACE INTELLIGENCE ---`;
}
