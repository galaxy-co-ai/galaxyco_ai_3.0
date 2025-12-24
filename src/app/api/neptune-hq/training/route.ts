import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/neptune-hq/training
 * Returns knowledge base items, quick tips, and tutorial progress
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

    // Mock data - will be replaced with real DB queries
    const categories = ['Getting Started', 'Agents', 'Integrations', 'Best Practices', 'API Reference'];

    const knowledgeBase = [
      {
        id: '1',
        title: 'Getting Started with Neptune',
        category: 'Getting Started',
        type: 'guide' as const,
        lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        views: 245,
        starred: true,
      },
      {
        id: '2',
        title: 'Creating Your First Agent',
        category: 'Agents',
        type: 'video' as const,
        lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        views: 189,
        starred: true,
      },
      {
        id: '3',
        title: 'Agent Configuration Reference',
        category: 'Agents',
        type: 'document' as const,
        lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        views: 156,
      },
      {
        id: '4',
        title: 'Connecting External Services',
        category: 'Integrations',
        type: 'guide' as const,
        lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        views: 132,
      },
      {
        id: '5',
        title: 'API Authentication Guide',
        category: 'API Reference',
        type: 'document' as const,
        lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        views: 98,
      },
      {
        id: '6',
        title: 'Best Practices for Prompt Engineering',
        category: 'Best Practices',
        type: 'guide' as const,
        lastUpdated: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        views: 287,
        starred: true,
      },
      {
        id: '7',
        title: 'Workflow Automation Tutorial',
        category: 'Agents',
        type: 'video' as const,
        lastUpdated: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        views: 165,
      },
      {
        id: '8',
        title: 'Error Handling Strategies',
        category: 'Best Practices',
        type: 'document' as const,
        lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        views: 89,
      },
    ];

    const quickTips = [
      {
        id: '1',
        title: 'Use Templates for Faster Setup',
        description: 'Start with our pre-built agent templates to save time. You can customize them later to fit your specific needs.',
        category: 'Productivity',
      },
      {
        id: '2',
        title: 'Enable Auto-Save',
        description: 'Turn on auto-save in settings to prevent losing work. Your configurations are saved every 30 seconds.',
        category: 'Settings',
      },
      {
        id: '3',
        title: 'Test in Sandbox First',
        description: 'Always test new agents in sandbox mode before deploying to production to avoid unexpected issues.',
        category: 'Best Practices',
      },
      {
        id: '4',
        title: 'Use Keyboard Shortcuts',
        description: 'Press Cmd/Ctrl+K to open the command palette for quick navigation and actions.',
        category: 'Productivity',
      },
    ];

    const tutorials = [
      {
        id: '1',
        title: 'Neptune Fundamentals',
        progress: 75,
        totalSteps: 8,
        completedSteps: 6,
        estimatedTime: '15 min left',
      },
      {
        id: '2',
        title: 'Building Custom Agents',
        progress: 30,
        totalSteps: 10,
        completedSteps: 3,
        estimatedTime: '35 min left',
      },
      {
        id: '3',
        title: 'Advanced Integrations',
        progress: 0,
        totalSteps: 6,
        completedSteps: 0,
        estimatedTime: '25 min',
      },
    ];

    return NextResponse.json({
      knowledgeBase,
      quickTips,
      tutorials,
      categories,
    });
  } catch (error) {
    console.error('Error fetching training data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training data' },
      { status: 500 }
    );
  }
}
