import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentExecutions, agents } from '@/db/schema';
import { eq, and, desc, count, sql, gte, lte } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export async function GET(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();
    const { searchParams } = new URL(request.url);

    // Query parameters
    const status = searchParams.get('status'); // 'all' | 'completed' | 'failed' | 'running' | 'pending'
    const agentId = searchParams.get('agentId'); // specific agent ID or 'all'
    const startDate = searchParams.get('startDate'); // ISO date string
    const endDate = searchParams.get('endDate'); // ISO date string
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search'); // search by agent name

    // Build where conditions
    const conditions = [eq(agentExecutions.workspaceId, workspaceId)];

    if (status && status !== 'all') {
      // Validate status is a valid execution status
      const validStatuses: ExecutionStatus[] = ['pending', 'running', 'completed', 'failed', 'cancelled'];
      if (validStatuses.includes(status as ExecutionStatus)) {
        conditions.push(eq(agentExecutions.status, status as ExecutionStatus));
      }
    }

    if (agentId && agentId !== 'all') {
      conditions.push(eq(agentExecutions.agentId, agentId));
    }

    if (startDate) {
      conditions.push(gte(agentExecutions.createdAt, new Date(startDate)));
    }

    if (endDate) {
      conditions.push(lte(agentExecutions.createdAt, new Date(endDate)));
    }

    // Get executions with agent info
    const executions = await db.query.agentExecutions.findMany({
      where: and(...conditions),
      orderBy: [desc(agentExecutions.createdAt)],
      limit,
      offset,
      with: {
        agent: {
          columns: {
            id: true,
            name: true,
            type: true,
            description: true,
          },
        },
        triggeredByUser: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Filter by search if provided (client-side filtering for agent name)
    let filteredExecutions = executions;
    if (search) {
      filteredExecutions = executions.filter((exec: typeof executions[0]) =>
        exec.agent.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Get total count for pagination
    const totalCount = await db
      .select({ count: count() })
      .from(agentExecutions)
      .where(and(...conditions));

    // Get stats
    const stats = await db
      .select({
        status: agentExecutions.status,
        count: count(),
      })
      .from(agentExecutions)
      .where(eq(agentExecutions.workspaceId, workspaceId))
      .groupBy(agentExecutions.status);

    const statsMap = stats.reduce((acc: Record<string, number>, stat: typeof stats[0]) => {
      acc[stat.status] = stat.count as number;
      return acc;
    }, {} as Record<string, number>);

    // Calculate success rate
    const total = Object.values(statsMap).reduce((sum: number, count: number) => sum + count, 0);
    const successCount = statsMap['completed'] || 0;
    const successRate = total > 0 ? (successCount / total) * 100 : 0;

    // Get average duration
    const avgDurationResult = await db
      .select({
        avg: sql<number>`AVG(${agentExecutions.durationMs})`,
      })
      .from(agentExecutions)
      .where(
        and(
          eq(agentExecutions.workspaceId, workspaceId),
          sql`${agentExecutions.durationMs} IS NOT NULL`
        )
      );

    const avgDuration = avgDurationResult[0]?.avg || 0;

    // Get total cost
    const totalCostResult = await db
      .select({
        sum: sql<number>`SUM(${agentExecutions.cost})`,
      })
      .from(agentExecutions)
      .where(
        and(
          eq(agentExecutions.workspaceId, workspaceId),
          sql`${agentExecutions.cost} IS NOT NULL`
        )
      );

    const totalCost = totalCostResult[0]?.sum || 0;

    return NextResponse.json({
      executions: filteredExecutions.map((exec) => ({
        id: exec.id,
        agentId: exec.agentId,
        agentName: exec.agent.name,
        agentType: exec.agent.type,
        agentDescription: exec.agent.description,
        status: exec.status,
        input: exec.input,
        output: exec.output,
        error: exec.error,
        durationMs: exec.durationMs,
        tokensUsed: exec.tokensUsed,
        cost: exec.cost,
        startedAt: exec.startedAt,
        completedAt: exec.completedAt,
        createdAt: exec.createdAt,
        triggeredBy: {
          id: exec.triggeredByUser.id,
          name: exec.triggeredByUser.firstName && exec.triggeredByUser.lastName
            ? `${exec.triggeredByUser.firstName} ${exec.triggeredByUser.lastName}`
            : exec.triggeredByUser.email,
          email: exec.triggeredByUser.email,
        },
      })),
      pagination: {
        total: totalCount[0]?.count || 0,
        limit,
        offset,
        hasMore: (totalCount[0]?.count || 0) > offset + limit,
      },
      stats: {
        total: totalCount[0]?.count || 0,
        success: statsMap['completed'] || 0,
        failed: statsMap['failed'] || 0,
        running: statsMap['running'] || 0,
        pending: statsMap['pending'] || 0,
        successRate: Math.round(successRate * 10) / 10,
        avgDurationMs: Math.round(avgDuration),
        totalCostCents: totalCost,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Get activity error');
  }
}






