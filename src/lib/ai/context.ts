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
  workspaceIntelligence,
  proactiveInsights,
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

// ============================================================================
// FINANCE CONTEXT TYPES
// ============================================================================

export interface FinanceContext {
  hasFinanceIntegrations: boolean;
  connectedProviders: string[];
  summary?: {
    revenue: number;
    expenses: number;
    profit: number;
    outstandingInvoices: number;
    cashflow: number;
  };
  recentInvoices?: Array<{
    id: string;
    number: string;
    customer: string;
    amount: number;
    status: string;
    dueDate: string;
  }>;
  recentTransactions?: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    date: string;
  }>;
}

export interface MarketingContext {
  activeCampaigns: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    sentCount: number;
    openCount: number;
    clickCount: number;
    conversionCount: number;
  }>;
  campaignStats: {
    avgOpenRate: string;
    avgClickRate: string;
    topChannel: string;
  };
  totalCampaigns: number;
}

export interface WebsiteContext {
  companyName: string | null;
  companyDescription: string | null;
  products: Array<{ name: string; description: string }>;
  services: Array<{ name: string; description: string }>;
  targetAudience: string | null;
  valuePropositions: string[];
  brandVoice: string | null;
  websiteUrl: string | null;
  hasAnalysis: boolean;
}

export interface ProactiveInsightsContext {
  insights: Array<{
    type: string;
    category: string;
    title: string;
    description: string;
    priority: number;
    suggestedActions?: Array<{ action: string; args?: Record<string, unknown> }>;
  }>;
  hasInsights: boolean;
}

export interface AIContextData {
  user: UserContext;
  preferences: UserPreferencesContext;
  crm: CRMContext;
  calendar: CalendarContext;
  tasks: TaskContext;
  agents: AgentContext;
  conversationHistory: ConversationHistoryContext;
  finance?: FinanceContext;
  marketing?: MarketingContext;
  website?: WebsiteContext;
  proactiveInsights?: ProactiveInsightsContext;
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
          defaultModel: 'gpt-4o',
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
      defaultModel: prefs.defaultModel || 'gpt-4o',
      enableRag: prefs.enableRag,
      enableProactiveInsights: prefs.enableProactiveInsights,
    };
  } catch (error) {
    logger.error('Failed to get user preferences', error);
    return {
      communicationStyle: 'balanced',
      topicsOfInterest: [],
      frequentQuestions: [],
      defaultModel: 'gpt-4o',
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

/**
 * Get marketing context (campaigns, performance metrics)
 */
async function getMarketingContext(workspaceId: string): Promise<MarketingContext> {
  try {
    // Get active campaigns
    const activeCampaigns = await db.query.campaigns.findMany({
      where: and(
        eq(campaigns.workspaceId, workspaceId),
        eq(campaigns.status, 'active')
      ),
      orderBy: [desc(campaigns.createdAt)],
      limit: 5,
    });

    // Get all campaigns for stats calculation
    const allCampaigns = await db.query.campaigns.findMany({
      where: eq(campaigns.workspaceId, workspaceId),
    });

    // Calculate average open rate and click rate
    let totalSent = 0;
    let totalOpens = 0;
    let totalClicks = 0;
    const channelCounts: Record<string, number> = {};

    allCampaigns.forEach((campaign) => {
      totalSent += campaign.sentCount || 0;
      totalOpens += campaign.openCount || 0;
      totalClicks += campaign.clickCount || 0;
      
      const channel = campaign.type || 'unknown';
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    });

    const avgOpenRate = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : '0';
    const avgClickRate = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : '0';
    
    // Find top channel
    const topChannel = Object.entries(channelCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'email';

    return {
      activeCampaigns: activeCampaigns.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        status: c.status,
        sentCount: c.sentCount || 0,
        openCount: c.openCount || 0,
        clickCount: c.clickCount || 0,
        conversionCount: c.conversionCount || 0,
      })),
      campaignStats: {
        avgOpenRate: `${avgOpenRate}%`,
        avgClickRate: `${avgClickRate}%`,
        topChannel,
      },
      totalCampaigns: allCampaigns.length,
    };
  } catch (error) {
    logger.error('Failed to get marketing context', error);
    return {
      activeCampaigns: [],
      campaignStats: {
        avgOpenRate: '0%',
        avgClickRate: '0%',
        topChannel: 'email',
      },
      totalCampaigns: 0,
    };
  }
}

// ============================================================================
// FINANCE CONTEXT GATHERING
// ============================================================================

/**
 * Get finance context for AI assistant
 * Gathers data from connected finance integrations (QuickBooks, Stripe, Shopify)
 */
async function getFinanceContext(workspaceId: string): Promise<FinanceContext> {
  try {
    // Dynamically import integrations schema to avoid circular dependency
    const { integrations } = await import('@/db/schema');
    const { inArray } = await import('drizzle-orm');
    
    // Check for finance integrations - typed as const to match the enum
    const financeProviders = ['quickbooks', 'stripe', 'shopify'] as const;
    const financeIntegrations = await db.query.integrations.findMany({
      where: and(
        eq(integrations.workspaceId, workspaceId),
        inArray(integrations.provider, financeProviders),
        eq(integrations.status, 'active')
      ),
    });

    if (financeIntegrations.length === 0) {
      return { hasFinanceIntegrations: false, connectedProviders: [] };
    }

    const connectedProviders = financeIntegrations.map(i => i.provider);

    // Fetch real financial data from connected providers
    let summary: FinanceContext['summary'] | undefined;
    let recentInvoices: FinanceContext['recentInvoices'] | undefined;
    let recentTransactions: FinanceContext['recentTransactions'] | undefined;

    try {
      // Import finance services
      const { QuickBooksService, StripeService, ShopifyService } = await import('@/lib/finance');
      
      // Calculate date range (last 30 days for summary)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Initialize services
      const qbService = new QuickBooksService(workspaceId);
      const stripeService = new StripeService(workspaceId);
      const shopifyService = new ShopifyService(workspaceId);
      
      // Try to initialize each service (gracefully handle failures)
      const [qbInit, stripeInit, shopifyInit] = await Promise.all([
        qbService.initialize().catch(() => ({ success: false })),
        stripeService.initialize().catch(() => ({ success: false })),
        shopifyService.initialize().catch(() => ({ success: false })),
      ]);

      // Aggregate data from available providers
      let revenue = 0;
      let expenses = 0;
      let outstandingInvoices = 0;

      // QuickBooks data
      if (qbInit.success && connectedProviders.includes('quickbooks')) {
        try {
          const qbFinancials = await qbService.getFinancials(thirtyDaysAgo, now);
          const qbInvoices = await qbService.getInvoices({ 
            startDate: thirtyDaysAgo, 
            endDate: now, 
            status: 'unpaid' 
          });
          
          revenue += qbFinancials.revenue;
          expenses += qbFinancials.expenses;
          outstandingInvoices += qbInvoices.reduce((sum, inv) => sum + inv.balance, 0);
          
          // Get recent invoices for context
          const allInvoices = await qbService.getInvoices({ 
            startDate: thirtyDaysAgo, 
            endDate: now 
          });
          recentInvoices = allInvoices.slice(0, 10).map(inv => ({
            id: inv.id,
            number: inv.invoiceNumber || inv.id,
            customer: inv.customer?.name || 'Unknown',
            amount: inv.total,
            status: inv.status === 'paid' ? 'paid' : inv.dueDate && new Date(inv.dueDate) < now ? 'overdue' : 'unpaid',
            dueDate: inv.dueDate || new Date().toISOString(),
          }));
        } catch (error) {
          logger.warn('QuickBooks data fetch failed for AI context', { error });
        }
      }

      // Stripe data
      if (stripeInit.success && connectedProviders.includes('stripe')) {
        try {
          const stripeData = await stripeService.getRevenueData(thirtyDaysAgo, now);
          const stripeNet = stripeData.charges - stripeData.fees - stripeData.refunds;
          revenue += stripeNet;
          expenses += stripeData.fees; // Stripe fees are expenses
        } catch (error) {
          logger.warn('Stripe data fetch failed for AI context', { error });
        }
      }

      // Shopify data
      if (shopifyInit.success && connectedProviders.includes('shopify')) {
        try {
          const shopifyData = await shopifyService.getRevenueData(thirtyDaysAgo, now);
          revenue += shopifyData.total;
        } catch (error) {
          logger.warn('Shopify data fetch failed for AI context', { error });
        }
      }

      // Calculate profit and cash flow
      const profit = revenue - expenses;
      const cashflow = profit; // Simplified calculation

      summary = {
        revenue,
        expenses,
        profit,
        outstandingInvoices,
        cashflow,
      };

      logger.info('Finance context: fetched real data', { 
        workspaceId, 
        connectedProviders,
        revenue,
        expenses,
        profit,
        outstandingInvoices,
      });
    } catch (dataError) {
      logger.warn('Failed to fetch finance summary data for AI context', { 
        error: dataError instanceof Error ? dataError.message : 'Unknown error',
        workspaceId,
      });
      // Continue with provider list even if data fetch fails
    }

    return {
      hasFinanceIntegrations: true,
      connectedProviders,
      summary,
      recentInvoices,
      recentTransactions,
    };
  } catch (error) {
    logger.error('Failed to gather finance context', error);
    return { hasFinanceIntegrations: false, connectedProviders: [] };
  }
}

// ============================================================================
// MAIN CONTEXT GATHERING FUNCTION
// ============================================================================

/**
 * Get website context from workspace intelligence
 */
async function getWebsiteContext(workspaceId: string): Promise<WebsiteContext> {
  try {
    const intelligence = await db.query.workspaceIntelligence.findFirst({
      where: eq(workspaceIntelligence.workspaceId, workspaceId),
    });

    if (!intelligence || !intelligence.websiteUrl) {
      return {
        companyName: null,
        companyDescription: null,
        products: [],
        services: [],
        targetAudience: null,
        valuePropositions: [],
        brandVoice: null,
        websiteUrl: null,
        hasAnalysis: false,
      };
    }

    return {
      companyName: intelligence.companyName || null,
      companyDescription: intelligence.companyDescription || null,
      products: (intelligence.products as Array<{ name: string; description: string }>) || [],
      services: (intelligence.services as Array<{ name: string; description: string }>) || [],
      targetAudience: intelligence.targetAudience || null,
      valuePropositions: intelligence.valuePropositions || [],
      brandVoice: intelligence.brandVoice || null,
      websiteUrl: intelligence.websiteUrl,
      hasAnalysis: !!intelligence.websiteAnalyzedAt,
    };
  } catch (error) {
    logger.error('Failed to gather website context', error);
    return {
      companyName: null,
      companyDescription: null,
      products: [],
      services: [],
      targetAudience: null,
      valuePropositions: [],
      brandVoice: null,
      websiteUrl: null,
      hasAnalysis: false,
    };
  }
}

/**
 * Get proactive insights for the workspace
 */
async function getProactiveInsightsContext(
  workspaceId: string,
  userId: string
): Promise<ProactiveInsightsContext> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get recent, non-dismissed insights
    const insights = await db.query.proactiveInsights.findMany({
      where: and(
        eq(proactiveInsights.workspaceId, workspaceId),
        gte(proactiveInsights.createdAt, sevenDaysAgo),
        sql`${proactiveInsights.dismissedAt} IS NULL`,
        or(
          eq(proactiveInsights.userId, userId),
          sql`${proactiveInsights.userId} IS NULL` // Workspace-wide insights
        )!
      ),
      orderBy: [desc(proactiveInsights.priority), desc(proactiveInsights.createdAt)],
      limit: 10,
    });

    return {
      insights: insights.map(i => ({
        type: i.type,
        category: i.category,
        title: i.title,
        description: i.description,
        priority: i.priority,
        suggestedActions: i.suggestedActions as Array<{ action: string; args?: Record<string, unknown> }> || [],
      })),
      hasInsights: insights.length > 0,
    };
  } catch (error) {
    logger.error('Failed to get proactive insights context', error);
    return {
      insights: [],
      hasInsights: false,
    };
  }
}

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
    const [preferences, crm, calendar, taskCtx, agentCtx, conversationHistory, finance, marketing, website, proactive] = await Promise.all([
      getUserPreferencesContext(workspaceId, user.id),
      getCRMContext(workspaceId),
      getCalendarContext(workspaceId),
      getTaskContext(workspaceId),
      getAgentContext(workspaceId),
      getConversationHistoryContext(workspaceId, user.id),
      getFinanceContext(workspaceId),
      getMarketingContext(workspaceId),
      getWebsiteContext(workspaceId),
      getProactiveInsightsContext(workspaceId, user.id),
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
      finance,
      marketing,
      website,
      proactiveInsights: proactive,
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

