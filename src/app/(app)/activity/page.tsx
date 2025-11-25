import { Metadata } from 'next';
import ActivityDashboard from '@/components/activity/ActivityDashboard';
import { getCurrentWorkspace } from "@/lib/auth";

export const dynamic = 'force-dynamic';
import { db } from "@/lib/db";
import { agentExecutions, agents } from "@/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";

export const metadata: Metadata = {
  title: 'Agent Activity | GalaxyCo.ai',
  description: 'View real-time agent execution history and performance metrics',
};

export default async function ActivityPage() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Get initial executions (last 50)
    const initialExecutions = await db.query.agentExecutions.findMany({
      where: eq(agentExecutions.workspaceId, workspaceId),
      orderBy: [desc(agentExecutions.createdAt)],
      limit: 50,
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

    // Get stats
    const stats = await db
      .select({
        status: agentExecutions.status,
        count: count(),
      })
      .from(agentExecutions)
      .where(eq(agentExecutions.workspaceId, workspaceId))
      .groupBy(agentExecutions.status);

    const statsMap = stats.reduce((acc, stat) => {
      acc[stat.status] = stat.count;
      return acc;
    }, {} as Record<string, number>);

    const total = Object.values(statsMap).reduce((sum, count) => sum + count, 0);
    const successCount = statsMap['completed'] || 0;
    const successRate = total > 0 ? (successCount / total) * 100 : 0;

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

    // Get all agents with full details for agents view
    const allAgents = await db.query.agents.findMany({
      where: eq(agents.workspaceId, workspaceId),
      columns: {
        id: true,
        name: true,
        type: true,
        description: true,
        status: true,
        executionCount: true,
        lastExecutedAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [desc(agents.lastExecutedAt), desc(agents.createdAt)],
    });

    const initialData = {
      executions: initialExecutions.map((exec) => ({
        id: exec.id,
        agentId: exec.agentId,
        agentName: exec.agent.name,
        agentType: exec.agent.type,
        agentDescription: exec.agent.description ?? undefined,
        status: exec.status,
        input: exec.input ?? undefined,
        output: exec.output ?? undefined,
        error: exec.error ?? undefined,
        durationMs: exec.durationMs ?? undefined,
        tokensUsed: exec.tokensUsed ?? undefined,
        cost: exec.cost ?? undefined,
        startedAt: exec.startedAt ?? undefined,
        completedAt: exec.completedAt ?? undefined,
        createdAt: exec.createdAt,
        triggeredBy: {
          id: exec.triggeredByUser.id,
          name: exec.triggeredByUser.firstName && exec.triggeredByUser.lastName
            ? `${exec.triggeredByUser.firstName} ${exec.triggeredByUser.lastName}`
            : exec.triggeredByUser.email,
          email: exec.triggeredByUser.email,
        },
      })),
      stats: {
        total: total,
        success: statsMap['completed'] || 0,
        failed: statsMap['failed'] || 0,
        running: statsMap['running'] || 0,
        pending: statsMap['pending'] || 0,
        successRate: Math.round(successRate * 10) / 10,
        avgDurationMs: Math.round(avgDuration),
        totalCostCents: totalCost,
      },
      agents: allAgents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        description: agent.description ?? undefined,
        status: agent.status,
        executionCount: agent.executionCount,
        lastExecutedAt: agent.lastExecutedAt ?? undefined,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      })),
    };

    return <ActivityDashboard initialData={initialData} />;
  } catch (error) {
    console.error('Activity page error:', error);
    return (
      <ActivityDashboard
        initialData={{
          executions: [],
          stats: {
            total: 0,
            success: 0,
            failed: 0,
            running: 0,
            pending: 0,
            successRate: 0,
            avgDurationMs: 0,
            totalCostCents: 0,
          },
          agents: [],
        }}
      />
    );
  }
}




