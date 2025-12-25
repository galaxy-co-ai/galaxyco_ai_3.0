/**
 * User Activity Detection Helpers
 *
 * Functions to determine user state (new vs returning) and workspace health
 * for contextual Neptune greetings and onboarding guidance.
 */

import { db } from '@/lib/db';
import {
  users,
  agents,
  contacts,
  knowledgeItems,
  integrations,
  agentExecutions,
  conversationMessages,
} from '@/db/schema';
import { eq, and, gte, count } from 'drizzle-orm';
import { logger } from '@/lib/logger';

/**
 * Check if a user is new (account created less than 7 days ago)
 */
export async function isNewUser(userId: string): Promise<boolean> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { createdAt: true },
    });

    if (!user || !user.createdAt) {
      return true; // Treat missing data as new user
    }

    const daysSinceCreation = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceCreation < 7;
  } catch (error) {
    logger.error('Error checking if user is new', { error, userId });
    return true; // Default to new user on error
  }
}

/**
 * Get recent workspace activity for contextual greetings
 */
export interface RecentActivity {
  newLeads: number;
  agentRuns: number;
  newMessages: number;
  recentAgents: Array<{ id: string; name: string; createdAt: Date }>;
  recentContacts: Array<{ id: string; name: string; createdAt: Date }>;
}

export async function getRecentActivity(
  workspaceId: string,
  days: number = 7
): Promise<RecentActivity> {
  try {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Fetch recent agents
    const recentAgents = await db.query.agents.findMany({
      where: and(eq(agents.workspaceId, workspaceId), gte(agents.createdAt, cutoffDate)),
      columns: { id: true, name: true, createdAt: true },
      orderBy: [agents.createdAt],
      limit: 5,
    });

    // Fetch recent contacts
    const recentContacts = await db.query.contacts.findMany({
      where: and(eq(contacts.workspaceId, workspaceId), gte(contacts.createdAt, cutoffDate)),
      columns: { id: true, firstName: true, lastName: true, createdAt: true },
      orderBy: [contacts.createdAt],
      limit: 5,
    });

    // Count new leads (contacts created in timeframe)
    const [leadsCount] = await db
      .select({ count: count() })
      .from(contacts)
      .where(and(eq(contacts.workspaceId, workspaceId), gte(contacts.createdAt, cutoffDate)));

    // Count agent executions
    const [executionsCount] = await db
      .select({ count: count() })
      .from(agentExecutions)
      .where(
        and(
          eq(agentExecutions.workspaceId, workspaceId),
          gte(agentExecutions.createdAt, cutoffDate)
        )
      );
    const agentRuns = executionsCount?.count || 0;

    // Count new messages
    const [messagesCount] = await db
      .select({ count: count() })
      .from(conversationMessages)
      .where(
        and(
          eq(conversationMessages.workspaceId, workspaceId),
          gte(conversationMessages.createdAt, cutoffDate)
        )
      );
    const newMessages = messagesCount?.count || 0;

    return {
      newLeads: leadsCount?.count || 0,
      agentRuns,
      newMessages,
      recentAgents: recentAgents.map((a) => ({
        id: a.id,
        name: a.name,
        createdAt: a.createdAt,
      })),
      recentContacts: recentContacts.map((c) => ({
        id: c.id,
        name: [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unnamed Contact',
        createdAt: c.createdAt,
      })),
    };
  } catch (error) {
    logger.error('Error fetching recent activity', { error, workspaceId });
    return {
      newLeads: 0,
      agentRuns: 0,
      newMessages: 0,
      recentAgents: [],
      recentContacts: [],
    };
  }
}

/**
 * Calculate workspace setup completion percentage
 */
export interface WorkspaceHealth {
  completionPercentage: number;
  hasAgents: boolean;
  hasContacts: boolean;
  hasKnowledge: boolean;
  hasIntegrations: boolean;
  missingItems: string[];
}

export async function getWorkspaceHealth(workspaceId: string): Promise<WorkspaceHealth> {
  try {
    const [agentsCount, contactsCount, knowledgeCount, integrationsCount] = await Promise.all([
      db.select({ count: count() }).from(agents).where(eq(agents.workspaceId, workspaceId)),
      db.select({ count: count() }).from(contacts).where(eq(contacts.workspaceId, workspaceId)),
      db
        .select({ count: count() })
        .from(knowledgeItems)
        .where(eq(knowledgeItems.workspaceId, workspaceId)),
      db
        .select({ count: count() })
        .from(integrations)
        .where(and(eq(integrations.workspaceId, workspaceId), eq(integrations.status, 'active'))),
    ]);

    const hasAgents = (agentsCount[0]?.count || 0) > 0;
    const hasContacts = (contactsCount[0]?.count || 0) > 0;
    const hasKnowledge = (knowledgeCount[0]?.count || 0) > 0;
    const hasIntegrations = (integrationsCount[0]?.count || 0) > 0;

    const missingItems: string[] = [];
    if (!hasAgents) missingItems.push('agents');
    if (!hasContacts) missingItems.push('contacts');
    if (!hasKnowledge) missingItems.push('knowledge base');
    if (!hasIntegrations) missingItems.push('integrations');

    const completionPercentage = Math.round(
      ((hasAgents ? 1 : 0) +
        (hasContacts ? 1 : 0) +
        (hasKnowledge ? 1 : 0) +
        (hasIntegrations ? 1 : 0)) *
        25
    );

    return {
      completionPercentage,
      hasAgents,
      hasContacts,
      hasKnowledge,
      hasIntegrations,
      missingItems,
    };
  } catch (error) {
    logger.error('Error calculating workspace health', { error, workspaceId });
    return {
      completionPercentage: 0,
      hasAgents: false,
      hasContacts: false,
      hasKnowledge: false,
      hasIntegrations: false,
      missingItems: ['agents', 'contacts', 'knowledge base', 'integrations'],
    };
  }
}
