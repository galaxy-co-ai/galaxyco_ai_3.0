/**
 * Dashboard Roadmap API
 * 
 * Returns a checklist of important setup tasks for optimal workspace configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { getWorkspaceHealth } from '@/lib/user-activity';
import { db } from '@/lib/db';
import { agents, contacts, knowledgeItems, integrations } from '@/db/schema';
import { eq, and, count } from 'drizzle-orm';
import { logger } from '@/lib/logger';
import { Bot, Users, FolderOpen, Plug, Sparkles, Calendar, Mail } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  action?: {
    type: 'navigate' | 'neptune';
    target: string;
    prompt?: string;
  };
  icon: string; // Icon name for client-side rendering
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    // If workspaceId provided, use it; otherwise get from auth
    let finalWorkspaceId = workspaceId;

    if (!finalWorkspaceId) {
      const { workspaceId: authWorkspaceId } = await getCurrentWorkspace();
      finalWorkspaceId = authWorkspaceId;
    }

    if (!finalWorkspaceId) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 401 }
      );
    }

    // Get workspace health
    const workspaceHealth = await getWorkspaceHealth(finalWorkspaceId);

    // Build roadmap items based on workspace state
    const roadmapItems: RoadmapItem[] = [];

    // 1. Create your first agent
    const [agentsCount] = await db
      .select({ count: count() })
      .from(agents)
      .where(eq(agents.workspaceId, finalWorkspaceId));

    roadmapItems.push({
      id: 'create-agent',
      title: 'Create your first AI agent',
      description: 'Build an AI assistant to automate repetitive tasks',
      completed: (agentsCount?.count || 0) > 0,
      priority: 'high',
      action: {
        type: 'neptune',
        target: '/activity?tab=laboratory',
        prompt: 'Help me create my first AI agent',
      },
      icon: 'Bot',
    });

    // 2. Add contacts to CRM
    const [contactsCount] = await db
      .select({ count: count() })
      .from(contacts)
      .where(eq(contacts.workspaceId, finalWorkspaceId));

    roadmapItems.push({
      id: 'add-contacts',
      title: 'Add contacts to your CRM',
      description: 'Start tracking leads and customers',
      completed: (contactsCount?.count || 0) > 0,
      priority: 'high',
      action: {
        type: 'neptune',
        target: '/crm',
        prompt: 'Help me add my first contact to the CRM',
      },
      icon: 'Users',
    });

    // 3. Upload documents to knowledge base
    const [knowledgeCount] = await db
      .select({ count: count() })
      .from(knowledgeItems)
      .where(eq(knowledgeItems.workspaceId, finalWorkspaceId));

    roadmapItems.push({
      id: 'upload-documents',
      title: 'Upload documents to knowledge base',
      description: 'Add files so Neptune can reference them',
      completed: (knowledgeCount?.count || 0) > 0,
      priority: 'medium',
      action: {
        type: 'neptune',
        target: '/library?tab=upload',
        prompt: 'Help me upload a document to my knowledge base',
      },
      icon: 'FolderOpen',
    });

    // 4. Connect integrations
    const [integrationsCount] = await db
      .select({ count: count() })
      .from(integrations)
      .where(
        and(
          eq(integrations.workspaceId, finalWorkspaceId),
          eq(integrations.status, 'active')
        )
      );

    roadmapItems.push({
      id: 'connect-integrations',
      title: 'Connect your first integration',
      description: 'Link Gmail, Calendar, or other services',
      completed: (integrationsCount?.count || 0) > 0,
      priority: 'medium',
      action: {
        type: 'navigate',
        target: '/connected-apps',
      },
      icon: 'Plug',
    });

    // 5. Set up your profile (always show if incomplete)
    roadmapItems.push({
      id: 'setup-profile',
      title: 'Complete your profile',
      description: 'Add your name and preferences',
      completed: false, // This would need to be checked against user profile
      priority: 'low',
      action: {
        type: 'navigate',
        target: '/settings',
      },
      icon: 'Sparkles',
    });

    // Calculate completion percentage
    const completedCount = roadmapItems.filter(item => item.completed).length;
    const completionPercentage = Math.round(
      (completedCount / roadmapItems.length) * 100
    );

    return NextResponse.json({
      items: roadmapItems,
      completionPercentage,
    });
  } catch (error) {
    logger.error('Error fetching roadmap data', { error });
    return NextResponse.json(
      { error: 'Failed to fetch roadmap data' },
      { status: 500 }
    );
  }
}
