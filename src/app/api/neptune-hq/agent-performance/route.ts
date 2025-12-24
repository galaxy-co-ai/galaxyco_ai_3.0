import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/neptune-hq/agent-performance
 * Returns agent stats, health status, and execution history
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // Mock stats - will be replaced with real DB queries
    const stats = {
      totalAgents: 8,
      activeAgents: 5,
      totalExecutions: 1247,
      successRate: 94.2,
      avgExecutionTime: 2340, // milliseconds
      trends: {
        agents: 2, // +2 from last week
        executions: 15, // +15%
        successRate: 1.5, // +1.5%
        executionTime: -8, // -8% (improvement)
      },
    };

    // Mock agents list
    const agents = [
      {
        id: '1',
        name: 'Lead Scorer',
        status: 'active' as const,
        lastExecuted: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        executionCount: 342,
        successRate: 97,
        avgTime: 1850,
        type: 'CRM',
      },
      {
        id: '2',
        name: 'Email Responder',
        status: 'active' as const,
        lastExecuted: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        executionCount: 521,
        successRate: 95,
        avgTime: 2100,
        type: 'Communication',
      },
      {
        id: '3',
        name: 'Data Sync Agent',
        status: 'idle' as const,
        lastExecuted: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        executionCount: 156,
        successRate: 99,
        avgTime: 3200,
        type: 'Integration',
      },
      {
        id: '4',
        name: 'Report Generator',
        status: 'active' as const,
        lastExecuted: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        executionCount: 89,
        successRate: 92,
        avgTime: 4500,
        type: 'Analytics',
      },
      {
        id: '5',
        name: 'Task Automator',
        status: 'error' as const,
        lastExecuted: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        executionCount: 78,
        successRate: 85,
        avgTime: 1500,
        type: 'Workflow',
      },
      {
        id: '6',
        name: 'Content Analyzer',
        status: 'paused' as const,
        lastExecuted: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        executionCount: 45,
        successRate: 91,
        avgTime: 2800,
        type: 'AI',
      },
    ];

    // Mock recent executions
    const recentExecutions = [
      {
        id: '1',
        agentName: 'Lead Scorer',
        status: 'success' as const,
        startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        duration: 1820,
      },
      {
        id: '2',
        agentName: 'Email Responder',
        status: 'success' as const,
        startedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
        duration: 2340,
      },
      {
        id: '3',
        agentName: 'Report Generator',
        status: 'running' as const,
        startedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
        duration: 0,
      },
      {
        id: '4',
        agentName: 'Task Automator',
        status: 'failed' as const,
        startedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        duration: 1200,
      },
      {
        id: '5',
        agentName: 'Lead Scorer',
        status: 'success' as const,
        startedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        duration: 1950,
      },
      {
        id: '6',
        agentName: 'Email Responder',
        status: 'success' as const,
        startedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
        duration: 2100,
      },
      {
        id: '7',
        agentName: 'Data Sync Agent',
        status: 'success' as const,
        startedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
        duration: 3100,
      },
      {
        id: '8',
        agentName: 'Lead Scorer',
        status: 'success' as const,
        startedAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
        duration: 1780,
      },
      {
        id: '9',
        agentName: 'Report Generator',
        status: 'success' as const,
        startedAt: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
        duration: 4200,
      },
      {
        id: '10',
        agentName: 'Email Responder',
        status: 'failed' as const,
        startedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        duration: 800,
      },
    ];

    // Mock performance chart data (last 7 days)
    const performanceChart = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        executions: Math.floor(150 + Math.random() * 100),
        successRate: Math.floor(90 + Math.random() * 8),
      };
    });

    return NextResponse.json({
      stats,
      agents,
      recentExecutions,
      performanceChart,
    });
  } catch (error) {
    console.error('Error fetching agent performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent performance' },
      { status: 500 }
    );
  }
}
