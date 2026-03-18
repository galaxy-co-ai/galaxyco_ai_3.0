import { db } from '@/lib/db';
import { agents, contacts, tasks, campaigns, integrations } from '@/db/schema';
import { eq, and, desc, lte, sql, count } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export interface WorkspaceSnapshot {
  contactCount: number;
  hotContacts: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    company: string | null;
  }>;
  overdueTasks: Array<{
    id: string;
    title: string;
    customerId: string | null;
  }>;
  recentCampaigns: Array<{
    id: string;
    name: string;
    sentCount: number | null;
    openCount: number | null;
    clickCount: number | null;
  }>;
  activeAgentCount: number;
  integrationCount: number;
  isNewUser: boolean;
}

export async function fetchWorkspaceSnapshot(workspaceId: string): Promise<WorkspaceSnapshot> {
  try {
    const [
      contactCount,
      hotContacts,
      overdueTasks,
      recentCampaigns,
      activeAgentCount,
      integrationCount,
    ] = await Promise.all([
      getContactCount(workspaceId),
      getHotContacts(workspaceId),
      getOverdueTasks(workspaceId),
      getRecentCampaignResults(workspaceId),
      getActiveAgentCount(workspaceId),
      getIntegrationCount(workspaceId),
    ]);

    return {
      contactCount,
      hotContacts,
      overdueTasks,
      recentCampaigns,
      activeAgentCount,
      integrationCount,
      isNewUser: contactCount === 0 && activeAgentCount === 0,
    };
  } catch (error) {
    logger.error('Failed to fetch workspace snapshot', { error, workspaceId });
    return {
      contactCount: 0,
      hotContacts: [],
      overdueTasks: [],
      recentCampaigns: [],
      activeAgentCount: 0,
      integrationCount: 0,
      isNewUser: true,
    };
  }
}

async function getContactCount(workspaceId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(contacts)
      .where(eq(contacts.workspaceId, workspaceId));
    return result[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

async function getHotContacts(workspaceId: string): Promise<WorkspaceSnapshot['hotContacts']> {
  try {
    return await db
      .select({
        id: contacts.id,
        firstName: contacts.firstName,
        lastName: contacts.lastName,
        company: contacts.company,
      })
      .from(contacts)
      .where(and(eq(contacts.workspaceId, workspaceId), eq(contacts.leadStatus, 'hot')))
      .orderBy(desc(contacts.updatedAt))
      .limit(5);
  } catch {
    return [];
  }
}

async function getOverdueTasks(workspaceId: string): Promise<WorkspaceSnapshot['overdueTasks']> {
  try {
    return await db
      .select({
        id: tasks.id,
        title: tasks.title,
        customerId: tasks.customerId,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.status, 'todo'),
          lte(tasks.dueDate, sql`NOW()`),
        ),
      )
      .orderBy(desc(tasks.dueDate))
      .limit(5);
  } catch {
    return [];
  }
}

async function getRecentCampaignResults(
  workspaceId: string,
): Promise<WorkspaceSnapshot['recentCampaigns']> {
  try {
    return await db
      .select({
        id: campaigns.id,
        name: campaigns.name,
        sentCount: campaigns.sentCount,
        openCount: campaigns.openCount,
        clickCount: campaigns.clickCount,
      })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.workspaceId, workspaceId),
          eq(campaigns.status, 'completed'),
          lte(sql`NOW() - INTERVAL '7 days'`, campaigns.updatedAt),
        ),
      )
      .orderBy(desc(campaigns.updatedAt))
      .limit(2);
  } catch {
    return [];
  }
}

async function getActiveAgentCount(workspaceId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(agents)
      .where(and(eq(agents.workspaceId, workspaceId), eq(agents.status, 'active')));
    return result[0]?.count ?? 0;
  } catch {
    return 0;
  }
}

async function getIntegrationCount(workspaceId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(integrations)
      .where(and(eq(integrations.workspaceId, workspaceId), eq(integrations.status, 'active')));
    return result[0]?.count ?? 0;
  } catch {
    return 0;
  }
}
