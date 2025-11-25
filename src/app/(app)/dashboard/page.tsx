import { Metadata } from 'next';
import DashboardDashboard from '@/components/dashboard/DashboardDashboard';
import { getCurrentWorkspace } from "@/lib/auth";
import { db } from "@/lib/db";
import { agents, agentExecutions, tasks } from "@/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";

export const metadata: Metadata = {
  title: 'Dashboard | GalaxyCo.ai',
  description: 'AI-powered dashboard with agents, workflows, and insights',
};

export default async function DashboardPage() {
  try {
    const { workspaceId } = await getCurrentWorkspace();

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

    // Get recent agents
    const recentAgents = await db.query.agents.findMany({
      where: and(
        eq(agents.workspaceId, workspaceId),
        eq(agents.status, 'active')
      ),
      orderBy: [desc(agents.lastExecutedAt)],
      limit: 5,
    });

    const dashboardData = {
      stats: {
        activeAgents: activeAgentsCount[0]?.count ?? 0,
        tasksCompleted: completedTasksCount[0]?.count ?? 0,
        hoursSaved,
      },
      agents: recentAgents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        initials: agent.name.substring(0, 2).toUpperCase(),
        color: 'bg-blue-500',
        message: agent.description || 'Ready to help',
        time: 'Just now',
        active: agent.status === 'active',
        status: agent.status === 'active' ? 'Active now' : 'Idle',
        role: agent.type,
        conversation: [],
      })),
      events: [], // TODO: Implement calendar events
    };

    return <DashboardDashboard initialData={dashboardData} />;
  } catch (error) {
    // Return empty data on error - component will handle gracefully
    return <DashboardDashboard initialData={{ stats: { activeAgents: 0, tasksCompleted: 0, hoursSaved: 0 }, agents: [], events: [] }} />;
  }
}
