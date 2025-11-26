'use server'

import { db } from '@/lib/db';
import { agents, tasks, agentExecutions, chatMessages, calendarEvents, users } from '@/db/schema';
import { eq, count, desc, and } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { getCacheOrFetch, invalidateCache } from '@/lib/cache';
import { logger } from '@/lib/logger';

export async function getDashboardStats() {
  const { userId } = await auth();
  if (!userId) return { activeAgents: 0, tasksCompleted: 0, hoursSaved: 0 };

  return getCacheOrFetch(
    `dashboard-stats:${userId}`,
    async () => {
      try {
        // Count active agents
        const agentsCount = await db.select({ count: count() })
          .from(agents)
          .where(eq(agents.status, 'active'));

        // Count completed tasks
        const tasksCount = await db.select({ count: count() })
          .from(tasks)
          .where(eq(tasks.status, 'done'));

        // Estimate hours saved (e.g. 0.5h per task + execution time)
        const hoursSaved = Math.round(tasksCount[0].count * 0.25); 

        return {
          activeAgents: agentsCount[0].count,
          tasksCompleted: tasksCount[0].count,
          hoursSaved: hoursSaved
        };
      } catch (error) {
        logger.error('Failed to fetch dashboard stats', error);
        return { activeAgents: 0, tasksCompleted: 0, hoursSaved: 0 };
      }
    },
    { ttl: 180, prefix: 'dashboard' } // 3 minutes - shorter TTL for stats
  );
}

export async function getRecentMessages() {
  const { userId } = await auth();
  if (!userId) return [];

  return getCacheOrFetch(
    `recent-messages:${userId}`,
    async () => {
      try {
        const messages = await db.select({
            id: chatMessages.id,
            content: chatMessages.content,
            createdAt: chatMessages.createdAt,
            senderId: chatMessages.senderId,
          })
          .from(chatMessages)
          .orderBy(desc(chatMessages.createdAt))
          .limit(10);

        return []; 
      } catch (error) {
        logger.error('Failed to fetch messages', error);
        return [];
      }
    },
    { ttl: 60, prefix: 'dashboard' } // 1 minute - very short for real-time messages
  );
}

export async function getDashboardAgents() {
  const { userId } = await auth();
  if (!userId) return [];

  return getCacheOrFetch(
    `dashboard-agents:${userId}`,
    async () => {
      try {
        const data = await db.select().from(agents)
          .limit(5); // Top 5 agents
          
        return data.map((a: typeof data[0]) => ({
          id: a.id,
          name: a.name,
          initials: a.name.substring(0, 2).toUpperCase(),
          color: 'bg-blue-500', // Randomize or store in DB
          message: a.description || 'Ready to help',
          time: 'Just now',
          active: a.status === 'active',
          status: a.status === 'active' ? 'Active now' : 'Idle',
          role: a.type,
          conversation: [] // Empty history for summary
        }));
      } catch (error) {
        logger.error('Failed to fetch agents', error);
        return [];
      }
    },
    { ttl: 300, prefix: 'dashboard' } // 5 minutes
  );
}

export async function getUpcomingEvents() {
  const { userId } = await auth();
  if (!userId) return [];

  return getCacheOrFetch(
    `upcoming-events:${userId}`,
    async () => {
      try {
        const events = await db.select().from(calendarEvents)
          .where(eq(calendarEvents.createdBy, userId))
          .orderBy(desc(calendarEvents.startTime))
          .limit(5);
          
        return events.map((e: typeof events[0]) => ({
          id: e.id,
          title: e.title,
          time: e.startTime.toLocaleTimeString(),
          type: 'meeting'
        }));
      } catch (error) {
        return [];
      }
    },
    { ttl: 300, prefix: 'dashboard' } // 5 minutes
  );
}

/**
 * Invalidate dashboard cache when data is updated
 */
export async function invalidateDashboardCache(userId: string) {
  await invalidateCache(`dashboard-stats:${userId}`, { prefix: 'dashboard' });
  await invalidateCache(`recent-messages:${userId}`, { prefix: 'dashboard' });
  await invalidateCache(`dashboard-agents:${userId}`, { prefix: 'dashboard' });
  await invalidateCache(`upcoming-events:${userId}`, { prefix: 'dashboard' });
}
