/**
 * Dashboard v2 Data Fetching & Helper Functions
 *
 * Centralized data fetching and business logic for the dashboard.
 */

import { db } from '@/lib/db';
import { agents, tasks, contacts, integrations, agentExecutions } from '@/db/schema';
import { eq, and, desc, count, gte } from 'drizzle-orm';
import {
  DashboardV2Data,
  DashboardStats,
  NextStepAction,
  Win,
  JourneyPathway,
} from '@/types/dashboard';
import { logger } from '@/lib/logger';

// ============================================================================
// MAIN DATA FETCHER
// ============================================================================

/**
 * Fetches all dashboard data for a workspace
 * @param workspaceId - The workspace ID to fetch data for
 * @param userName - The user's first name for personalized greeting
 * @returns Complete dashboard data
 */
export async function getDashboardData(
  workspaceId: string,
  userName: string = 'there'
): Promise<DashboardV2Data> {
  // If no workspaceId, return empty data immediately
  if (!workspaceId) {
    logger.warn('getDashboardData called without workspaceId');
    return getEmptyDashboardData(userName);
  }

  // Calculate date thresholds
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  // Fetch data with individual error handling for resilience
  const safeQuery = async <T>(query: Promise<T>, fallback: T, name: string): Promise<T> => {
    try {
      return await query;
    } catch (error) {
      logger.warn(`Dashboard query failed: ${name}`, { error });
      return fallback;
    }
  };

  try {
    // Fetch all data in parallel for performance (with fallbacks)
    const [
      agentsData,
      tasksData,
      crmData,
      financeIntegrations,
      recentExecutions,
      // Previous period data for trends
      agentsDataPrevious,
      tasksDataPrevious,
      crmDataPrevious,
    ] = await Promise.all([
      // Fetch all agents
      safeQuery(
        db.query.agents.findMany({
          where: eq(agents.workspaceId, workspaceId),
          orderBy: [desc(agents.lastExecutedAt)],
        }),
        [],
        'agents'
      ),

      // Fetch completed tasks (last 30 days)
      safeQuery(
        db.query.tasks.findMany({
          where: and(
            eq(tasks.workspaceId, workspaceId),
            eq(tasks.status, 'done'),
            gte(tasks.completedAt, thirtyDaysAgo)
          ),
          orderBy: [desc(tasks.completedAt)],
          limit: 100,
        }),
        [],
        'tasks'
      ),

      // Fetch CRM contact stats
      safeQuery(
        db
          .select({
            total: count(),
          })
          .from(contacts)
          .where(eq(contacts.workspaceId, workspaceId)),
        [{ total: 0 }],
        'contacts'
      ),

      // Fetch finance integrations (simplified query)
      safeQuery(
        db.query.integrations
          .findMany({
            where: and(
              eq(integrations.workspaceId, workspaceId),
              eq(integrations.status, 'active')
            ),
          })
          .then((results) =>
            // Filter for finance providers in JS to avoid SQL enum issues
            results.filter((i) => ['quickbooks', 'stripe', 'shopify'].includes(i.provider))
          ),
        [],
        'integrations'
      ),

      // Fetch recent agent executions (last 7 days)
      safeQuery(
        db.query.agentExecutions.findMany({
          where: and(
            eq(agentExecutions.workspaceId, workspaceId),
            gte(agentExecutions.createdAt, sevenDaysAgo)
          ),
          orderBy: [desc(agentExecutions.createdAt)],
          limit: 50,
          with: { agent: true },
        }),
        [],
        'executions'
      ),

      // Previous period: Agents (7-14 days ago)
      safeQuery(
        db.query.agents.findMany({
          where: and(eq(agents.workspaceId, workspaceId), gte(agents.createdAt, fourteenDaysAgo)),
        }),
        [],
        'agents-previous'
      ),

      // Previous period: Tasks (7-14 days ago)
      safeQuery(
        db.query.tasks.findMany({
          where: and(
            eq(tasks.workspaceId, workspaceId),
            eq(tasks.status, 'done'),
            gte(tasks.completedAt, fourteenDaysAgo)
          ),
        }),
        [],
        'tasks-previous'
      ),

      // Previous period: CRM contacts (7-14 days ago)
      safeQuery(
        db
          .select({ total: count() })
          .from(contacts)
          .where(
            and(eq(contacts.workspaceId, workspaceId), gte(contacts.createdAt, fourteenDaysAgo))
          ),
        [{ total: 0 }],
        'contacts-previous'
      ),
    ]);

    // Helper to calculate trend
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) {
        return current > 0 ? { value: current, change: 100, isIncrease: true } : undefined;
      }
      const change = ((current - previous) / previous) * 100;
      return {
        value: current,
        change: Math.abs(Math.round(change)),
        isIncrease: change >= 0,
      };
    };

    // Calculate current stats
    const currentAgents = agentsData.filter((a) => a.status === 'active').length;
    const currentTasks = tasksData.length;
    const currentContacts = crmData[0]?.total ?? 0;

    // Count hot leads
    const [hotLeadsData] = await safeQuery(
      db
        .select({ count: count() })
        .from(contacts)
        .where(and(eq(contacts.workspaceId, workspaceId), eq(contacts.leadStatus, 'hot'))),
      [{ count: 0 }],
      'hot-leads'
    );
    const hotLeadsCount = hotLeadsData?.count ?? 0;

    // Calculate previous stats (for 7-14 days ago)
    const previousAgents = agentsDataPrevious.filter((a) => {
      const createdAt = new Date(a.createdAt);
      return createdAt >= fourteenDaysAgo && createdAt < sevenDaysAgo && a.status === 'active';
    }).length;
    const previousTasks = tasksDataPrevious.filter((t) => {
      const completedAt = t.completedAt ? new Date(t.completedAt) : null;
      return completedAt && completedAt >= fourteenDaysAgo && completedAt < sevenDaysAgo;
    }).length;
    const previousContacts = crmDataPrevious[0]?.total ?? 0;

    // Calculate statistics with trends
    const stats: DashboardStats = {
      activeAgents: currentAgents,
      totalAgents: agentsData.length,
      completedTasks: currentTasks,
      hoursSaved: currentTasks * 2, // Estimate: 2 hours per task
      crmContacts: currentContacts,
      hotLeads: hotLeadsCount,
      financeConnections: financeIntegrations.length,
      trends: {
        agents: calculateTrend(currentAgents, previousAgents),
        tasks: calculateTrend(currentTasks, previousTasks),
        contacts: calculateTrend(currentContacts, previousContacts),
      },
    };

    // Determine next step
    const nextStep = determineNextStep(stats, agentsData, tasksData);

    // Generate wins from recent activity
    const wins = generateWinsFromActivity(recentExecutions, tasksData);

    // Generate pathways (dynamically ordered)
    const pathways = generatePathways(stats);

    // Determine user profile
    const user = {
      name: userName,
      isFirstTime: stats.totalAgents === 0 && stats.crmContacts === 0,
      lastLogin: undefined, // TODO: Track last login in database
    };

    // Build response
    return {
      stats,
      nextStep,
      pathways,
      wins,
      user,
      onboarding: {
        isComplete: stats.totalAgents > 0 && stats.crmContacts > 0,
        completionPercentage: calculateOnboardingCompletion(stats),
      },
    };
  } catch (error) {
    logger.error('Failed to fetch dashboard data', { error, workspaceId });
    // Return empty data instead of throwing to keep dashboard functional
    return getEmptyDashboardData(userName);
  }
}

/**
 * Returns empty/default dashboard data
 * Used for error fallback or new users
 */
export function getEmptyDashboardData(userName: string = 'there'): DashboardV2Data {
  return {
    stats: {
      activeAgents: 0,
      totalAgents: 0,
      completedTasks: 0,
      hoursSaved: 0,
      crmContacts: 0,
      hotLeads: 0,
      financeConnections: 0,
    },
    nextStep: {
      id: 'get-started',
      title: 'Welcome to GalaxyCo',
      why: "Let's get you set up with your first automation",
      benefits: [
        'Save hours every week',
        'Never miss important tasks',
        'Grow your business faster',
      ],
      cta: 'Get Started',
      href: '/agents?action=create',
      priority: 10,
    },
    pathways: getDefaultPathways(),
    wins: [],
    user: {
      name: userName,
      isFirstTime: true,
    },
    onboarding: {
      isComplete: false,
      completionPercentage: 0,
    },
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determines the best next action for the user
 * Priority order matters - first match wins
 */
function determineNextStep(
  stats: DashboardStats,
  agentsData: Array<{ status: string }>,
  tasksData: Array<{ status: string }>
): NextStepAction {
  // Priority 1: No agents - create first one
  if (stats.totalAgents === 0) {
    return {
      id: 'create-first-agent',
      title: 'Create Your First Agent',
      why: 'Agents automate repetitive work so you can focus on what matters',
      benefits: ['Save 10+ hours per week', 'Never miss a follow-up', 'Work while you sleep'],
      cta: 'Create Agent',
      href: '/agents?action=create',
      priority: 10,
    };
  }

  // Priority 2: No CRM contacts - add first one
  if (stats.crmContacts === 0) {
    return {
      id: 'add-first-contact',
      title: 'Add Your First Contact',
      why: 'Start building relationships and tracking conversations',
      benefits: ['Organize your network', 'Track every interaction', 'Never forget to follow up'],
      cta: 'Add Contact',
      href: '/crm?action=create',
      priority: 9,
    };
  }

  // Priority 3: Hot leads need attention
  if (stats.hotLeads > 0) {
    return {
      id: 'follow-up-hot-leads',
      title: 'Follow Up with Hot Leads',
      why: `${stats.hotLeads} lead${stats.hotLeads > 1 ? 's' : ''} rated 'Hot' need your attention`,
      benefits: ['Close deals faster', 'Maintain momentum', 'Build relationships'],
      cta: 'Open CRM',
      href: '/crm?filter=hot',
      priority: 8,
    };
  }

  // Priority 4: No integrations - connect tools
  if (stats.financeConnections === 0) {
    return {
      id: 'connect-integrations',
      title: 'Connect Your Tools',
      why: 'Unlock the full power of Galaxy by connecting your business tools',
      benefits: [
        'Centralize your data',
        'Automate cross-platform workflows',
        'Get unified insights',
      ],
      cta: 'Connect Tools',
      href: '/integrations',
      priority: 7,
    };
  }

  // Default: Review recent activity
  return {
    id: 'review-activity',
    title: 'Review What Galaxy Did Today',
    why: 'See how your agents and automations are performing',
    benefits: ['Track your progress', 'Spot new opportunities', 'Optimize your workflows'],
    cta: 'View Activity',
    href: '/activity',
    priority: 1,
  };
}

/**
 * Generates wins/accomplishments from recent activity
 */
function generateWinsFromActivity(
  executions: Array<{ agent?: { name?: string } | null; createdAt: Date }>,
  tasks: Array<{ completedAt?: Date | null }>
): Win[] {
  const wins: Win[] = [];

  // Group executions by agent
  const executionsByAgent = executions.reduce(
    (acc, exec) => {
      const agentName = exec.agent?.name ?? 'Unknown Agent';
      if (!acc[agentName]) {
        acc[agentName] = { count: 0, mostRecent: exec.createdAt };
      }
      acc[agentName].count++;
      return acc;
    },
    {} as Record<string, { count: number; mostRecent: Date }>
  );

  // Create wins for agent executions
  Object.entries(executionsByAgent).forEach(([agentName, data]) => {
    wins.push({
      id: `win-agent-${agentName}`,
      emoji: '⚡',
      title: `${agentName} executed ${data.count} time${data.count > 1 ? 's' : ''}`,
      detail: 'Automating your workflow in the background',
      timeAgo: formatTimeAgo(data.mostRecent),
      timestamp: data.mostRecent,
      type: 'agent',
    });
  });

  // Add win for completed tasks
  if (tasks.length > 0) {
    wins.push({
      id: 'win-tasks',
      emoji: '✅',
      title: `Completed ${tasks.length} task${tasks.length > 1 ? 's' : ''}`,
      detail: `Saved approximately ${tasks.length * 2} hours`,
      timeAgo: 'Last 30 days',
      timestamp: new Date(),
      type: 'task',
    });
  }

  // Sort by timestamp (most recent first) and limit to 10
  return wins.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 10);
}

/**
 * Generates journey pathways with dynamic ordering
 */
function generatePathways(stats: DashboardStats): JourneyPathway[] {
  const pathways: JourneyPathway[] = [
    {
      id: 'automate',
      title: 'Automate My Work',
      promise: 'Build AI agents that handle repetitive tasks',
      href: '/agents',
      icon: 'Sparkles',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      badge: stats.activeAgents > 0 ? `${stats.activeAgents} active` : undefined,
      order: stats.totalAgents === 0 ? 1 : 3,
    },
    {
      id: 'relationships',
      title: 'Manage My Relationships',
      promise: 'Track leads, contacts, and conversations',
      href: '/crm',
      icon: 'Users',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      badge:
        stats.hotLeads > 0
          ? `${stats.hotLeads} hot lead${stats.hotLeads > 1 ? 's' : ''}`
          : undefined,
      order: stats.hotLeads > 0 ? 1 : 2,
    },
    {
      id: 'create',
      title: 'Create Content',
      promise: 'Generate articles, emails, and assets with AI',
      href: '/creator',
      icon: 'Lightbulb',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      badge: 'Neptune Powered',
      order: 4,
    },
    {
      id: 'finances',
      title: 'Understand My Finances',
      promise: 'Unified view of revenue, expenses, and cash flow',
      href: '/finance',
      icon: 'DollarSign',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      badge: stats.financeConnections > 0 ? `${stats.financeConnections} connected` : undefined,
      order: stats.financeConnections > 0 ? 2 : 5,
    },
    {
      id: 'learn',
      title: 'Learn & Grow',
      promise: 'Master AI and business automation',
      href: '/lunar-labs',
      icon: 'GraduationCap',
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-100',
      badge: undefined,
      order: 6,
    },
    {
      id: 'workflows',
      title: 'Build Workflows',
      promise: 'Design custom automations visually',
      href: '/studio',
      icon: 'Workflow',
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-100',
      badge: 'Advanced',
      order: 7,
    },
  ];

  return pathways.sort((a, b) => a.order - b.order);
}

/**
 * Returns default pathways for empty state
 */
function getDefaultPathways(): JourneyPathway[] {
  return [
    {
      id: 'automate',
      title: 'Automate My Work',
      promise: 'Build AI agents that handle repetitive tasks',
      href: '/agents',
      icon: 'Sparkles',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      badge: 'Get Started',
      order: 1,
    },
    {
      id: 'relationships',
      title: 'Manage My Relationships',
      promise: 'Track leads, contacts, and conversations',
      href: '/crm',
      icon: 'Users',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      badge: 'Get Started',
      order: 2,
    },
    {
      id: 'create',
      title: 'Create Content',
      promise: 'Generate articles, emails, and assets with AI',
      href: '/creator',
      icon: 'Lightbulb',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      badge: 'Neptune Powered',
      order: 3,
    },
    {
      id: 'finances',
      title: 'Understand My Finances',
      promise: 'Unified view of revenue, expenses, and cash flow',
      href: '/finance',
      icon: 'DollarSign',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      badge: 'Get Started',
      order: 4,
    },
    {
      id: 'learn',
      title: 'Learn & Grow',
      promise: 'Master AI and business automation',
      href: '/lunar-labs',
      icon: 'GraduationCap',
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-100',
      badge: 'Get Started',
      order: 5,
    },
    {
      id: 'workflows',
      title: 'Build Workflows',
      promise: 'Design custom automations visually',
      href: '/studio',
      icon: 'Workflow',
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-100',
      badge: 'Advanced',
      order: 6,
    },
  ];
}

/**
 * Calculates onboarding completion percentage
 */
function calculateOnboardingCompletion(stats: DashboardStats): number {
  let completion = 0;

  // 33% for creating agents
  if (stats.totalAgents > 0) completion += 33;

  // 33% for adding contacts
  if (stats.crmContacts > 0) completion += 33;

  // 34% for connecting integrations
  if (stats.financeConnections > 0) completion += 34;

  return completion;
}

/**
 * Formats a date as relative time
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return 'This week';
}
