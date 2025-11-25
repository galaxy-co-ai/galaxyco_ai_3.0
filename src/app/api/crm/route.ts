import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { contacts, customers, prospects, projects, tasks, calendarEvents } from '@/db/schema';
import { eq, and, desc, or, like } from 'drizzle-orm';
import { getCacheOrFetch } from '@/lib/cache';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'contacts';

    // Rate limit per user (100 requests per hour)
    const rateLimitResult = await rateLimit(`api:crm:${userId}`, 100, 3600);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', reset: rateLimitResult.reset },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          }
        }
      );
    }

    // Cache key includes workspace and type
    const cacheKey = `api:crm:${workspaceId}:${type}`;
    
    const data = await getCacheOrFetch(
      cacheKey,
      async () => {
        switch (type) {
          case 'contacts': {
            const contactsList = await db.query.contacts.findMany({
              where: eq(contacts.workspaceId, workspaceId),
              orderBy: [desc(contacts.createdAt)],
              limit: 100,
            });

            return contactsList.map((contact) => ({
              id: contact.id,
              name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email,
              company: contact.company || '',
              email: contact.email,
              lastContact: contact.lastContactedAt
                ? formatRelativeTime(contact.lastContactedAt)
                : 'Never',
              status: 'warm' as const,
              value: '$0',
              interactions: 0,
              aiHealthScore: 50,
              aiInsight: 'No recent activity',
              nextAction: 'Reach out',
              sentiment: 'neutral' as const,
              role: contact.title || undefined,
              tags: contact.tags || [],
            }));
          }

          case 'customers': {
            const customersList = await db.query.customers.findMany({
              where: eq(customers.workspaceId, workspaceId),
              orderBy: [desc(customers.createdAt)],
              limit: 100,
            });

            return customersList;
          }

          case 'prospects': {
            const prospectsList = await db.query.prospects.findMany({
              where: eq(prospects.workspaceId, workspaceId),
              orderBy: [desc(prospects.createdAt)],
              limit: 100,
            });

            return prospectsList.map((prospect) => ({
              id: prospect.id,
              title: prospect.name,
              company: prospect.company || '',
              value: prospect.estimatedValue
                ? `$${(prospect.estimatedValue / 100).toLocaleString()}`
                : '$0',
              stage: prospect.stage,
              probability: prospect.score || 0,
              closeDate: prospect.nextFollowUpAt
                ? formatDate(prospect.nextFollowUpAt)
                : 'TBD',
              aiRisk: prospect.score && prospect.score < 30 ? 'high' : prospect.score && prospect.score > 70 ? 'low' : 'medium',
            }));
          }

          case 'projects': {
            const projectsList = await db.query.projects.findMany({
              where: eq(projects.workspaceId, workspaceId),
              orderBy: [desc(projects.createdAt)],
              limit: 100,
            });

            return projectsList.map((project) => ({
              id: project.id,
              name: project.name,
              client: '',
              status: project.status,
              dueDate: project.endDate ? formatDate(project.endDate) : 'TBD',
              progress: project.progress || 0,
              team: [],
              budget: project.budget ? `$${(project.budget / 100).toLocaleString()}` : '$0',
            }));
          }

          default:
            throw new Error('Invalid type');
        }
      },
      { ttl: 300 } // 5 minutes cache
    );

    return NextResponse.json(data, {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      }
    });
  } catch (error) {
    console.error('CRM API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CRM data' },
      { status: 500 }
    );
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return formatDate(date);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}


