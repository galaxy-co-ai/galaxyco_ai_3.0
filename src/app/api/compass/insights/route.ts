/**
 * Compass Insights API Route
 * 
 * Generates contextual micro-lists using Claude to keep users on optimal path.
 * Provides Quick Wins, Next Steps, Priorities, and Bonus Suggestions based on
 * deep workspace context understanding.
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Anthropic from '@anthropic-ai/sdk';
import { generateNeptuneContext } from '@/lib/neptune/unified-context';
import { logger } from '@/lib/logger';
import type { CompassResponse, CompassInsight, CompassItem } from '@/types/compass';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Cache insights for 5 minutes
const insightsCache = new Map<string, { data: CompassResponse; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    // Check cache first
    const cacheKey = `${workspaceId}:${userId}`;
    const cached = insightsCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      logger.debug('[Compass] Returning cached insights', { workspaceId });
      return NextResponse.json(cached.data);
    }

    // Generate Neptune context
    logger.info('[Compass] Generating insights', { workspaceId, userId });
    const context = await generateNeptuneContext({
      workspaceId,
      userId,
      includeStats: true,
      includeRecentActivity: true,
    });

    // Build context summary for Claude
    const contextSummary = `
Workspace Context:
- CRM: ${context.stats.crm.totalLeads} leads, ${context.stats.crm.totalContacts} contacts, ${context.stats.crm.totalDeals} deals
- Agents: ${context.stats.agents.total} total, ${context.stats.agents.activeCount} active
- Tasks: ${context.stats.tasks.total} total, ${context.stats.tasks.overdue} overdue, ${context.stats.tasks.dueToday} due today
- Marketing: ${context.stats.marketing.totalCampaigns} campaigns, ${context.stats.marketing.activeCampaigns} active
- Knowledge: ${context.stats.knowledge.totalItems} items

Recent Activity:
${context.recentActivity?.slice(0, 5).map(a => `- ${a.action} (${a.entityType})`).join('\n') || 'No recent activity'}

User Goals: ${context.userPreferences?.goals || 'Not set'}
    `.trim();

    // Call Claude to generate insights
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.7,
      system: `You are Neptune, an AI business advisor analyzing workspace context to provide actionable guidance.

Generate 4 categories of micro-lists to guide the user:

1. **Quick Wins** - Easy, high-impact actions under 5 minutes
2. **Next Steps** - Logical progression items for current momentum
3. **Priorities** - Time-sensitive or high-value items needing attention
4. **Bonus Suggestions** - Exploratory opportunities for growth

Rules:
- Be specific and actionable, not generic
- Reference actual workspace data
- Each item should have clear value
- Limit to 3-4 items per category
- Suggest appropriate icons (lucide-react names)
- Estimate time when relevant

Output JSON format:
{
  "quickWins": [{"title": "...", "description": "...", "icon": "...", "estimatedTime": "2 min"}],
  "nextSteps": [{"title": "...", "description": "...", "icon": "..."}],
  "priorities": [{"title": "...", "description": "...", "icon": "..."}],
  "bonus": [{"title": "...", "description": "...", "icon": "..."}]
}`,
      messages: [
        {
          role: 'user',
          content: `Analyze this workspace and generate personalized guidance:\n\n${contextSummary}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse Claude's response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse JSON from Claude response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Transform to our format
    const insights: CompassInsight[] = [
      {
        category: 'quick-wins',
        title: 'Quick Wins',
        items: parsed.quickWins.map((item: Partial<CompassItem>, index: number) => ({
          id: `qw-${index}`,
          title: item.title || '',
          description: item.description || '',
          icon: item.icon || 'Zap',
          estimatedTime: item.estimatedTime,
          priority: index,
        })),
      },
      {
        category: 'next-steps',
        title: 'Next Steps',
        items: parsed.nextSteps.map((item: Partial<CompassItem>, index: number) => ({
          id: `ns-${index}`,
          title: item.title || '',
          description: item.description || '',
          icon: item.icon || 'ArrowRight',
          priority: index,
        })),
      },
      {
        category: 'priorities',
        title: 'Priorities',
        items: parsed.priorities.map((item: Partial<CompassItem>, index: number) => ({
          id: `pr-${index}`,
          title: item.title || '',
          description: item.description || '',
          icon: item.icon || 'AlertCircle',
          priority: index,
        })),
      },
      {
        category: 'bonus',
        title: 'Bonus Suggestions',
        items: parsed.bonus.map((item: Partial<CompassItem>, index: number) => ({
          id: `bn-${index}`,
          title: item.title || '',
          description: item.description || '',
          icon: item.icon || 'Lightbulb',
          priority: index,
        })),
      },
    ];

    const result: CompassResponse = {
      insights,
      generatedAt: new Date(),
      workspaceId,
    };

    // Cache the result
    insightsCache.set(cacheKey, {
      data: result,
      expiresAt: Date.now() + CACHE_TTL,
    });

    logger.info('[Compass] Generated insights successfully', {
      workspaceId,
      itemCount: insights.reduce((sum, cat) => sum + cat.items.length, 0),
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error('[Compass] Failed to generate insights', error);
    return NextResponse.json(
      { error: 'Failed to generate compass insights' },
      { status: 500 }
    );
  }
}
