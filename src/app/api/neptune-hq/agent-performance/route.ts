import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { agents, agentExecutions } from '@/db/schema';
import { eq, desc, count, avg, sql, and, gte } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

export const dynamic = 'force-dynamic';

/**
 * GET /api/neptune-hq/agent-performance
 * Returns agent stats, health status, and execution history from real database
 */
export async function GET() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Get all agents for workspace
    const agentsList = await db.query.agents.findMany({
      where: eq(agents.workspaceId, workspaceId),
      orderBy: [desc(agents.lastExecutedAt)],
    });

    // Get execution stats
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    // Current week executions
    const currentWeekExecutions = await db
      .select({
        total: count(),
        successful: count(sql`CASE WHEN ${agentExecutions.status} = 'completed' THEN 1 END`),
        avgDuration: avg(agentExecutions.durationMs),
      })
      .from(agentExecutions)
      .where(
        and(
          eq(agentExecutions.workspaceId, workspaceId),
          gte(agentExecutions.createdAt, oneWeekAgo)
        )
      );

    // Previous week executions for trend calculation
    const previousWeekExecutions = await db
      .select({
        total: count(),
        successful: count(sql`CASE WHEN ${agentExecutions.status} = 'completed' THEN 1 END`),
        avgDuration: avg(agentExecutions.durationMs),
      })
      .from(agentExecutions)
      .where(
        and(
          eq(agentExecutions.workspaceId, workspaceId),
          gte(agentExecutions.createdAt, twoWeeksAgo),
          sql`${agentExecutions.createdAt} < ${oneWeekAgo}`
        )
      );

    const currentStats = currentWeekExecutions[0];
    const previousStats = previousWeekExecutions[0];

    const totalExecutions = Number(currentStats?.total || 0);
    const successfulExecutions = Number(currentStats?.successful || 0);
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
    const avgExecutionTime = Number(currentStats?.avgDuration || 0);

    // Calculate trends
    const prevTotal = Number(previousStats?.total || 0);
    const prevSuccessful = Number(previousStats?.successful || 0);
    const prevSuccessRate = prevTotal > 0 ? (prevSuccessful / prevTotal) * 100 : 0;
    const prevAvgTime = Number(previousStats?.avgDuration || 0);

    const executionsTrend = prevTotal > 0 ? Math.round(((totalExecutions - prevTotal) / prevTotal) * 100) : 0;
    const successRateTrend = prevSuccessRate > 0 ? Math.round((successRate - prevSuccessRate) * 10) / 10 : 0;
    const timeTrend = prevAvgTime > 0 ? Math.round(((avgExecutionTime - prevAvgTime) / prevAvgTime) * 100) : 0;

    const activeAgents = agentsList.filter(a => a.status === 'active').length;

    const stats = {
      totalAgents: agentsList.length,
      activeAgents,
      totalExecutions,
      successRate: Math.round(successRate * 10) / 10,
      avgExecutionTime: Math.round(avgExecutionTime),
      trends: {
        agents: agentsList.length - (agentsList.length - 1), // Simplified - would need historical data
        executions: executionsTrend,
        successRate: successRateTrend,
        executionTime: -timeTrend, // Negative means improvement
      },
    };

    // Map agent status for UI
    const statusMap: Record<string, 'active' | 'idle' | 'paused' | 'error'> = {
      'active': 'active',
      'draft': 'idle',
      'paused': 'paused',
      'archived': 'paused',
    };

    // Get per-agent execution stats
    const agentExecStats = await db
      .select({
        agentId: agentExecutions.agentId,
        total: count(),
        successful: count(sql`CASE WHEN ${agentExecutions.status} = 'completed' THEN 1 END`),
        avgDuration: avg(agentExecutions.durationMs),
      })
      .from(agentExecutions)
      .where(eq(agentExecutions.workspaceId, workspaceId))
      .groupBy(agentExecutions.agentId);

    const execStatsByAgent = new Map(agentExecStats.map(s => [s.agentId, s]));

    // Format agents for response
    const formattedAgents = agentsList.map(agent => {
      const execStats = execStatsByAgent.get(agent.id);
      const agentTotal = Number(execStats?.total || 0);
      const agentSuccessful = Number(execStats?.successful || 0);
      const agentSuccessRate = agentTotal > 0 ? Math.round((agentSuccessful / agentTotal) * 100) : 100;

      return {
        id: agent.id,
        name: agent.name,
        status: statusMap[agent.status] || 'idle',
        lastExecuted: agent.lastExecutedAt?.toISOString() || null,
        executionCount: agent.executionCount,
        successRate: agentSuccessRate,
        avgTime: Math.round(Number(execStats?.avgDuration || 0)),
        type: agent.type,
      };
    });

    // Get recent executions
    const recentExecs = await db.query.agentExecutions.findMany({
      where: eq(agentExecutions.workspaceId, workspaceId),
      orderBy: [desc(agentExecutions.createdAt)],
      limit: 10,
      with: {
        agent: true,
      },
    });

    // Map execution status for UI
    const execStatusMap: Record<string, 'success' | 'running' | 'failed'> = {
      'completed': 'success',
      'running': 'running',
      'pending': 'running',
      'failed': 'failed',
    };

    const recentExecutions = recentExecs.map(exec => ({
      id: exec.id,
      agentName: exec.agent?.name || 'Unknown Agent',
      status: execStatusMap[exec.status] || 'failed',
      startedAt: exec.startedAt?.toISOString() || exec.createdAt.toISOString(),
      duration: exec.durationMs || 0,
    }));

    // Generate performance chart data (last 7 days)
    const performanceChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayStats = await db
        .select({
          total: count(),
          successful: count(sql`CASE WHEN ${agentExecutions.status} = 'completed' THEN 1 END`),
        })
        .from(agentExecutions)
        .where(
          and(
            eq(agentExecutions.workspaceId, workspaceId),
            gte(agentExecutions.createdAt, dayStart),
            sql`${agentExecutions.createdAt} <= ${dayEnd}`
          )
        );

      const dayTotal = Number(dayStats[0]?.total || 0);
      const daySuccessful = Number(dayStats[0]?.successful || 0);
      const daySuccessRate = dayTotal > 0 ? Math.round((daySuccessful / dayTotal) * 100) : 100;

      performanceChart.push({
        date: new Date(dayStart).toLocaleDateString('en-US', { weekday: 'short' }),
        executions: dayTotal,
        successRate: daySuccessRate,
      });
    }

    return NextResponse.json({
      stats,
      agents: formattedAgents,
      recentExecutions,
      performanceChart,
    });
  } catch (error) {
    return createErrorResponse(error, 'Agent performance error');
  }
}
