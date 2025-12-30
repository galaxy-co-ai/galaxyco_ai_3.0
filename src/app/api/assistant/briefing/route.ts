/**
 * Daily Intelligence Briefing API
 * GET /api/assistant/briefing - Get personalized daily summary
 */

import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { generateProactiveInsights } from '@/lib/ai/proactive-engine';
import { db } from '@/lib/db';
import { proactiveInsights } from '@/db/schema';
import { eq, and, gte, sql, desc } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';
import { getOpenAI } from '@/lib/ai-providers';
import { expensiveOperationLimit } from '@/lib/rate-limit';

export async function GET(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    // Rate limiting for expensive AI operation
    const rateLimitResult = await expensiveOperationLimit(`briefing:${userId}`);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429, headers: {
          'X-RateLimit-Limit': String(rateLimitResult.limit),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        }}
      );
    }

    // Get today's date range
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Get recent proactive insights
    const recentInsights = await db.query.proactiveInsights.findMany({
      where: and(
        eq(proactiveInsights.workspaceId, workspaceId),
        gte(proactiveInsights.createdAt, todayStart),
        sql`${proactiveInsights.dismissedAt} IS NULL`
      ),
      orderBy: [desc(proactiveInsights.priority), desc(proactiveInsights.createdAt)],
      limit: 10,
    });

    // Generate new insights if none exist for today
    let insights = recentInsights;
    if (insights.length === 0) {
      const newInsights = await generateProactiveInsights(workspaceId, {
        maxInsights: 5,
      });
      
      if (newInsights.length > 0) {
        const { storeProactiveInsights } = await import('@/lib/ai/proactive-engine');
        await storeProactiveInsights(workspaceId, newInsights, userId);
        insights = newInsights.map(i => ({
          id: '',
          workspaceId,
          userId: userId || null,
          type: i.type,
          priority: i.priority,
          category: i.category,
          title: i.title,
          description: i.description,
          suggestedActions: i.suggestedActions || [],
          autoExecutable: false,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          dismissedAt: null,
          createdAt: new Date(),
        }));
      }
    }

    // Get workspace metrics for summary
    const { prospects, tasks, calendarEvents, campaigns } = await import('@/db/schema');
    const { lt, count } = await import('drizzle-orm');

    const [totalLeads, overdueTasks, todayEvents, activeCampaigns] = await Promise.all([
      db.select({ count: count() }).from(prospects).where(eq(prospects.workspaceId, workspaceId)),
      db.select({ count: count() }).from(tasks).where(
        and(
          eq(tasks.workspaceId, workspaceId),
          eq(tasks.status, 'todo'),
          lt(tasks.dueDate, now)
        )
      ),
      db.select({ count: count() }).from(calendarEvents).where(
        and(
          eq(calendarEvents.workspaceId, workspaceId),
          gte(calendarEvents.startTime, todayStart),
          lt(calendarEvents.startTime, new Date(todayStart.getTime() + 24 * 60 * 60 * 1000))
        )
      ),
      db.select({ count: count() }).from(campaigns).where(
        and(
          eq(campaigns.workspaceId, workspaceId),
          eq(campaigns.status, 'active')
        )
      ),
    ]);

    // Generate personalized briefing using GPT-4o
    const openai = getOpenAI();
    const briefingPrompt = `Generate a personalized daily briefing for a business owner. Include:
- Key metrics summary (${totalLeads[0]?.count || 0} leads, ${overdueTasks[0]?.count || 0} overdue tasks, ${todayEvents[0]?.count || 0} events today, ${activeCampaigns[0]?.count || 0} active campaigns)
- Top priorities based on insights: ${insights.slice(0, 3).map(i => i.title).join(', ')}
- Action items

Keep it concise (3-4 sentences), friendly, and actionable.`;

    const briefingResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are Neptune, a helpful AI assistant. Generate a brief, friendly daily briefing.',
        },
        {
          role: 'user',
          content: briefingPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    const briefing = briefingResponse.choices[0]?.message?.content || 'Welcome back! Ready to tackle the day?';

    return NextResponse.json({
      briefing,
      insights: insights.slice(0, 5).map(i => ({
        type: i.type,
        category: i.category,
        title: i.title,
        description: i.description,
        priority: i.priority,
        suggestedActions: i.suggestedActions,
      })),
      metrics: {
        totalLeads: totalLeads[0]?.count || 0,
        overdueTasks: overdueTasks[0]?.count || 0,
        todayEvents: todayEvents[0]?.count || 0,
        activeCampaigns: activeCampaigns[0]?.count || 0,
      },
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    return createErrorResponse(error, 'Briefing generation error');
  }
}
