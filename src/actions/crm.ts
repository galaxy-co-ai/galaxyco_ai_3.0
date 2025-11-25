'use server'

import { db } from '@/lib/db';
import { contacts, projects, prospects, calendarEvents, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@clerk/nextjs/server';
import { getCacheOrFetch, invalidateCache } from '@/lib/cache';

/**
 * Invalidate CRM cache when data is updated
 * Runs all invalidations in parallel for better performance
 */
export async function invalidateCRMCache(userId: string) {
  // Run all cache invalidations in parallel instead of sequentially
  await Promise.all([
    invalidateCache(`contacts:${userId}`, { prefix: 'crm' }),
    invalidateCache(`projects:${userId}`, { prefix: 'crm' }),
    invalidateCache(`deals:${userId}`, { prefix: 'crm' }),
    invalidateCache(`interactions:${userId}`, { prefix: 'crm' }),
  ]);
}

export async function getContacts() {
  const { userId } = await auth();
  if (!userId) return [];

  // Use cache-aside pattern with 5-minute TTL
  return getCacheOrFetch(
    `contacts:${userId}`,
    async () => {
      try {
        const data = await db.select().from(contacts).limit(20);
        return data.map(c => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`,
          company: c.company || '',
          email: c.email,
          lastContact: c.lastContactedAt ? c.lastContactedAt.toISOString() : 'Never',
          status: 'warm', // Default or mapped from custom fields
          value: '$0', // Needs to come from related deals/prospects
          interactions: 0,
          aiHealthScore: 50, // Placeholder
          aiInsight: 'No AI insights yet.',
          nextAction: 'Follow up',
          sentiment: 'neutral',
          role: c.title || '',
          location: '',
          tags: c.tags || []
        }));
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
        return [];
      }
    },
    { ttl: 300, prefix: 'crm' } // 5 minutes
  );
}

export async function getProjects() {
  const { userId } = await auth();
  if (!userId) return [];

  return getCacheOrFetch(
    `projects:${userId}`,
    async () => {
      try {
        const data = await db.select().from(projects).limit(20);
        return data.map(p => ({
          id: p.id,
          name: p.name,
          client: 'Unknown', // Need join with customer
          status: p.status === 'in_progress' ? 'active' : p.status,
          dueDate: p.endDate ? p.endDate.toISOString() : '',
          progress: p.progress || 0,
          team: [], // Need join
          budget: p.budget ? `$${p.budget / 100}` : '$0'
        }));
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        return [];
      }
    },
    { ttl: 300, prefix: 'crm' }
  );
}

export async function getDeals() {
  const { userId } = await auth();
  if (!userId) return [];

  return getCacheOrFetch(
    `deals:${userId}`,
    async () => {
      try {
        const data = await db.select().from(prospects).limit(20);
        return data.map(p => ({
          id: p.id,
          title: p.name,
          company: p.company || '',
          value: p.estimatedValue ? `$${p.estimatedValue / 100}` : '$0',
          stage: p.stage,
          probability: p.score || 0,
          closingDate: '', // Not in prospect schema directly
          aiRisk: 'low'
        }));
      } catch (error) {
        console.error('Failed to fetch deals:', error);
        return [];
      }
    },
    { ttl: 300, prefix: 'crm' }
  );
}

export async function getInteractions() {
  const { userId } = await auth();
  if (!userId) return [];

  return getCacheOrFetch(
    `interactions:${userId}`,
    async () => {
      try {
        const data = await db.select().from(calendarEvents)
          .orderBy(desc(calendarEvents.startTime))
          .limit(10);
          
        return data.map(e => ({
          id: e.id,
          type: 'meeting',
          contactId: '',
          contact: '', // Need join
          date: e.startTime.toISOString(),
          duration: '30 min',
          summary: e.description || '',
          actionItems: [],
          status: 'completed',
          sentiment: 'neutral'
        }));
      } catch (error) {
        console.error('Failed to fetch interactions:', error);
        return [];
      }
    },
    { ttl: 300, prefix: 'crm' }
  );
}
