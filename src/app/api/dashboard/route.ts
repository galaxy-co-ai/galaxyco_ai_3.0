import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { agents, agentExecutions, tasks, prospects } from '@/db/schema';
import { eq, and, desc, count, sql } from 'drizzle-orm';
import { getCacheOrFetch } from '@/lib/cache';
import { rateLimit } from '@/lib/rate-limit';
import { createErrorResponse } from '@/lib/api-error-handler';

export async function GET(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    // Rate limit per user
    const rateLimitResult = await rateLimit(`api:dashboard:${userId}`, 100, 3600);
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

    const data = await getCacheOrFetch(
      `api:dashboard:${workspaceId}`,
      async () => {
        // Get active agents count
        const activeAgentsCount = await db
          .select({ count: count() })
          .from(agents)
          .where(
            and(
              eq(agents.workspaceId, workspaceId),
              eq(agents.status, 'active')
            )
          );

        // Get completed tasks count (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const completedTasksCount = await db
          .select({ count: count() })
          .from(tasks)
          .where(
            and(
              eq(tasks.workspaceId, workspaceId),
              eq(tasks.status, 'done'),
              sql`${tasks.createdAt} >= ${thirtyDaysAgo}`
            )
          );

        // Calculate hours saved (estimate: 2 hours per completed task)
        const hoursSaved = (completedTasksCount[0]?.count ?? 0) * 2;

        // Get recent activity
        const recentExecutions = await db.query.agentExecutions.findMany({
          where: eq(agentExecutions.workspaceId, workspaceId),
          orderBy: [desc(agentExecutions.createdAt)],
          limit: 5,
          with: {
            agent: {
              columns: {
                name: true,
                type: true,
              },
            },
          },
        });

        // Get pipeline stats
        const pipelineStats = await db
          .select({
            stage: prospects.stage,
            count: count(),
          })
          .from(prospects)
          .where(eq(prospects.workspaceId, workspaceId))
          .groupBy(prospects.stage);

        // Helper to safely extract agent metadata
        const getAgentMeta = (agent: (typeof recentExecutions)[number]['agent']) => {
          if (!agent) return { name: '', type: '' };
          const resolved = Array.isArray(agent) ? agent[0] : agent;
          return { name: resolved?.name ?? '', type: resolved?.type ?? '' };
        };

        return {
          stats: {
            activeAgents: activeAgentsCount[0]?.count ?? 0,
            tasksCompleted: completedTasksCount[0]?.count ?? 0,
            hoursSaved,
          },
          recentActivity: recentExecutions.map((exec: typeof recentExecutions[0]) => {
            const agentMeta = getAgentMeta(exec.agent);
            return {
              id: exec.id,
              agentName: agentMeta.name,
              agentType: agentMeta.type,
              status: exec.status,
              createdAt: exec.createdAt,
            };
          }),
          pipeline: pipelineStats.reduce((acc: Record<string, number>, stat: typeof pipelineStats[0]) => {
            acc[stat.stage] = stat.count;
            return acc;
          }, {} as Record<string, number>),
        };
      },
      { ttl: 180 } // 3 minutes cache
    );

    return NextResponse.json(data, {
      headers: {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      }
    });
  } catch (error) {
    return createErrorResponse(error, 'Get dashboard error');
  }
}

