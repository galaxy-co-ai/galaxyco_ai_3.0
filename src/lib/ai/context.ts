/**
 * AI Context Gathering Module
 * 
 * This module gathers comprehensive context about the user, their workspace,
 * and current business state to make the AI assistant contextually aware.
 */

import { db } from '@/lib/db';
import {
  prospects,
  contacts,
  customers,
  calendarEvents,
  tasks,
  campaigns,
  agents,
  aiUserPreferences,
  aiConversations,
  aiMessages,
  users,
} from '@/db/schema';
import { eq, and, desc, gte, lte, count, sql } from 'drizzle-orm';
import { logger } from '@/lib/logger';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UserContext {
  id: string;
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
}

export interface UserPreferencesContext {
  communicationStyle: string;
  topicsOfInterest: string[];
  frequentQuestions: string[];
  defaultModel: string;
  enableRag: boolean;
  enableProactiveInsights: boolean;
}

export interface CRMContext {
  totalLeads: number;
  leadsByStage: Record<string, number>;
  recentLeads: Array<{
    id: string;
    name: string;
    company: string | null;
    stage: string;
    createdAt: Date;
  }>;
  hotLeads: Array<{
    id: string;
    name: string;
    company: string | null;
    estimatedValue: number | null;
    stage: string;
  }>;
  totalContacts: number;
  totalCustomers: number;
  totalPipelineValue: number;
}

export interface CalendarContext {
  upcomingEvents: Array<{
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    attendeeCount: number;
  }>;
  todayEventCount: number;
  thisWeekEventCount: number;
}

export interface TaskContext {
  pendingTasks: number;
  overdueTasks: number;
  highPriorityTasks: Array<{
    id: string;
    title: string;
    priority: string;
    dueDate: Date | null;
  }>;
}

export interface AgentContext {
  activeAgents: number;
  totalExecutions: number;
  recentAgents: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    executionCount: number;
  }>;
}

export interface ConversationHistoryContext {
  recentTopics: string[];
  totalConversations: number;
  lastInteractionAt: Date | null;
}

export interface AIContextData {
  user: UserContext;
  preferences: UserPreferencesContext;
  crm: CRMContext;
  calendar: CalendarContext;
  tasks: TaskContext;
  agents: AgentContext;
  conversationHistory: ConversationHistoryContext;
  currentTime: string;
  currentDate: string;
  dayOfWeek: string;
}

// ============================================================================
// CONTEXT GATHERING FUNCTIONS
// ============================================================================

/**
 * Get user context from database
 */
async function getUserContext(clerkUserId: string): Promise<UserContext | null> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId),
    });

    if (!user) return null;

    return {
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email.split('@')[0],
    };
  } catch (error) {
    logger.error('Failed to get user context', error);
    return null;
  }
}

/**
 * Get or create user preferences
 */
async function getUserPreferencesContext(
  workspaceId: string,
  userId: string
): Promise<UserPreferencesContext> {
  try {
    let prefs = await db.query.aiUserPreferences.findFirst({
      where: and(
        eq(aiUserPreferences.workspaceId, workspaceId),
        eq(aiUserPreferences.userId, userId)
      ),
    });

    // Create default preferences if none exist
    if (!prefs) {
      const [newPrefs] = await db
        .insert(aiUserPreferences)
        .values({
          workspaceId,
          userId,
          communicationStyle: 'balanced',
          topicsOfInterest: [],
          frequentQuestions: [],
          defaultModel: 'gpt-4-turbo-preview',
          enableRag: true,
          enableProactiveInsights: true,
        })
        .returning();
      prefs = newPrefs;
    }

    return {
      communicationStyle: prefs.communicationStyle || 'balanced',
      topicsOfInterest: prefs.topicsOfInterest || [],
      frequentQuestions: prefs.frequentQuestions || [],
      defaultModel: prefs.defaultModel || 'gpt-4-turbo-preview',
      enableRag: prefs.enableRag,
      enableProactiveInsights: prefs.enableProactiveInsights,
    };
  } catch (error) {
    logger.error('Failed to get user preferences', error);
    return {
      communicationStyle: 'balanced',
      topicsOfInterest: [],
      frequentQuestions: [],
      defaultModel: 'gpt-4-turbo-preview',
      enableRag: true,
      enableProactiveInsights: true,
    };
  }
}

/**
 * Get CRM context (leads, contacts, pipeline)
 */
async function getCRMContext(workspaceId: string): Promise<CRMContext> {
  try {
    // Get all prospects for analysis
    const allProspects = await db.query.prospects.findMany({
      where: eq(prospects.workspaceId, workspaceId),
      orderBy: [desc(prospects.createdAt)],
    });

    // Calculate leads by stage
    const leadsByStage: Record<string, number> = {};
    let totalPipelineValue = 0;

    allProspects.forEach((p) => {
      leadsByStage[p.stage] = (leadsByStage[p.stage] || 0) + 1;
      if (!['won', 'lost'].includes(p.stage) && p.estimatedValue) {
        totalPipelineValue += p.estimatedValue;
      }
    });

    // Get recent leads (last 5)
    const recentLeads = allProspects.slice(0, 5).map((p) => ({
      id: p.id,
      name: p.name,
      company: p.company,
      stage: p.stage,
      createdAt: p.createdAt,
    }));

    // Get hot leads (qualified+ with highest value)
    const hotLeads = allProspects
      .filter((p) => ['qualified', 'proposal', 'negotiation'].includes(p.stage))
      .sort((a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        name: p.name,
        company: p.company,
        estimatedValue: p.estimatedValue ? p.estimatedValue / 100 : null,
        stage: p.stage,
      }));

    // Get contact and customer counts
    const contactResults = await db
      .select({ count: count() })
      .from(contacts)
      .where(eq(contacts.workspaceId, workspaceId));

    const customerResults = await db
      .select({ count: count() })
      .from(customers)
      .where(eq(customers.workspaceId, workspaceId));

    return {
      totalLeads: allProspects.length,
      leadsByStage,
      recentLeads,
      hotLeads,
      totalContacts: contactResults[0]?.count || 0,
      totalCustomers: customerResults[0]?.count || 0,
      totalPipelineValue: totalPipelineValue / 100, // Convert from cents
    };
  } catch (error) {
    logger.error('Failed to get CRM context', error);
    return {
      totalLeads: 0,
      leadsByStage: {},
      recentLeads: [],
      hotLeads: [],
      totalContacts: 0,
      totalCustomers: 0,
      totalPipelineValue: 0,
    };
  }
}

/**
 * Get calendar context
 */
async function getCalendarContext(workspaceId: string): Promise<CalendarContext> {
  try {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + 7);

    // Get upcoming events
    const upcomingEvents = await db.query.calendarEvents.findMany({
      where: and(
        eq(calendarEvents.workspaceId, workspaceId),
        gte(calendarEvents.startTime, now)
      ),
      orderBy: [calendarEvents.startTime],
      limit: 5,
    });

    // Count today's events
    const todayEvents = await db
      .select({ count: count() })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.workspaceId, workspaceId),
          gte(calendarEvents.startTime, now),
          lte(calendarEvents.startTime, endOfDay)
        )
      );

    // Count this week's events
    const weekEvents = await db
      .select({ count: count() })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.workspaceId, workspaceId),
          gte(calendarEvents.startTime, now),
          lte(calendarEvents.startTime, endOfWeek)
        )
      );

    return {
      upcomingEvents: upcomingEvents.map((e) => ({
        id: e.id,
        title: e.title,
        startTime: e.startTime,
        endTime: e.endTime,
        attendeeCount: (e.attendees as unknown[])?.length || 0,
      })),
      todayEventCount: todayEvents[0]?.count || 0,
      thisWeekEventCount: weekEvents[0]?.count || 0,
    };
  } catch (error) {
    logger.error('Failed to get calendar context', error);
    return {
      upcomingEvents: [],
      todayEventCount: 0,
      thisWeekEventCount: 0,
    };
  }
}

/**
 * Get task context
 */
async function getTaskContext(workspaceId: string): Promise<TaskContext> {
  try {
    const now = new Date();

    // Get all pending tasks
    const allTasks = await db.query.tasks.findMany({
      where: and(
        eq(tasks.workspaceId, workspaceId),
        eq(tasks.status, 'todo')
      ),
      orderBy: [desc(tasks.priority), tasks.dueDate],
    });

    // Count overdue tasks
    const overdueTasks = allTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now
    ).length;

    // Get high priority tasks
    const highPriorityTasks = allTasks
      .filter((t) => ['high', 'urgent'].includes(t.priority))
      .slice(0, 5)
      .map((t) => ({
        id: t.id,
        title: t.title,
        priority: t.priority,
        dueDate: t.dueDate,
      }));

    return {
      pendingTasks: allTasks.length,
      overdueTasks,
      highPriorityTasks,
    };
  } catch (error) {
    logger.error('Failed to get task context', error);
    return {
      pendingTasks: 0,
      overdueTasks: 0,
      highPriorityTasks: [],
    };
  }
}

/**
 * Get agent context
 */
async function getAgentContext(workspaceId: string): Promise<AgentContext> {
  try {
    const allAgents = await db.query.agents.findMany({
      where: eq(agents.workspaceId, workspaceId),
      orderBy: [desc(agents.lastExecutedAt)],
    });

    const activeAgents = allAgents.filter((a) => a.status === 'active').length;
    const totalExecutions = allAgents.reduce((sum, a) => sum + a.executionCount, 0);

    return {
      activeAgents,
      totalExecutions,
      recentAgents: allAgents.slice(0, 5).map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        status: a.status,
        executionCount: a.executionCount,
      })),
    };
  } catch (error) {
    logger.error('Failed to get agent context', error);
    return {
      activeAgents: 0,
      totalExecutions: 0,
      recentAgents: [],
    };
  }
}

/**
 * Get conversation history context
 */
async function getConversationHistoryContext(
  workspaceId: string,
  userId: string
): Promise<ConversationHistoryContext> {
  try {
    const recentConversations = await db.query.aiConversations.findMany({
      where: and(
        eq(aiConversations.workspaceId, workspaceId),
        eq(aiConversations.userId, userId)
      ),
      orderBy: [desc(aiConversations.lastMessageAt)],
      limit: 10,
    });

    // Extract topics from conversation titles
    const recentTopics = recentConversations
      .map((c) => c.title)
      .filter((title): title is string => !!title)
      .slice(0, 5);

    const lastInteractionAt = recentConversations[0]?.lastMessageAt || null;

    return {
      recentTopics,
      totalConversations: recentConversations.length,
      lastInteractionAt,
    };
  } catch (error) {
    logger.error('Failed to get conversation history context', error);
    return {
      recentTopics: [],
      totalConversations: 0,
      lastInteractionAt: null,
    };
  }
}

// ============================================================================
// MAIN CONTEXT GATHERING FUNCTION
// ============================================================================

/**
 * Gather comprehensive AI context for the current user and workspace
 */
export async function gatherAIContext(
  workspaceId: string,
  clerkUserId: string
): Promise<AIContextData | null> {
  try {
    const user = await getUserContext(clerkUserId);
    if (!user) {
      logger.error('User not found for context gathering');
      return null;
    }

    // Gather all contexts in parallel for performance
    const [preferences, crm, calendar, taskCtx, agentCtx, conversationHistory] = await Promise.all([
      getUserPreferencesContext(workspaceId, user.id),
      getCRMContext(workspaceId),
      getCalendarContext(workspaceId),
      getTaskContext(workspaceId),
      getAgentContext(workspaceId),
      getConversationHistoryContext(workspaceId, user.id),
    ]);

    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    return {
      user,
      preferences,
      crm,
      calendar,
      tasks: taskCtx,
      agents: agentCtx,
      conversationHistory,
      currentTime: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      currentDate: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      dayOfWeek: days[now.getDay()],
    };
  } catch (error) {
    logger.error('Failed to gather AI context', error);
    return null;
  }
}

/**
 * Get a lightweight context summary for quick operations
 */
export async function getQuickContext(
  workspaceId: string,
  clerkUserId: string
): Promise<{ userName: string; userEmail: string; userId: string } | null> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, clerkUserId),
    });

    if (!user) return null;

    return {
      userName: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email.split('@')[0],
      userEmail: user.email,
      userId: user.id,
    };
  } catch (error) {
    logger.error('Failed to get quick context', error);
    return null;
  }
}

