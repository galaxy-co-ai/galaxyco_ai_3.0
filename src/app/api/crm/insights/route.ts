import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { contacts, prospects, projects } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getOpenAI } from '@/lib/ai-providers';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    // Rate limit AI insights
    const rateLimitResult = await rateLimit(`ai:insights:${userId}`, 10, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { type = 'pipeline', context } = body;

    // Gather CRM data
    const contactsList = await db.query.contacts.findMany({
      where: eq(contacts.workspaceId, workspaceId),
      orderBy: [desc(contacts.createdAt)],
      limit: 50,
    });

    const prospectsList = await db.query.prospects.findMany({
      where: eq(prospects.workspaceId, workspaceId),
      orderBy: [desc(prospects.createdAt)],
      limit: 50,
    });

    const projectsList = await db.query.projects.findMany({
      where: eq(projects.workspaceId, workspaceId),
      orderBy: [desc(projects.createdAt)],
      limit: 20,
    });

    // Build context for AI
    const dataContext = {
      contacts: contactsList.length,
      prospects: {
        total: prospectsList.length,
        byStage: prospectsList.reduce((acc, p) => {
          acc[p.stage] = (acc[p.stage] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        totalValue: prospectsList.reduce((sum, p) => sum + (p.estimatedValue || 0), 0),
      },
      projects: {
        total: projectsList.length,
        byStatus: projectsList.reduce((acc, p) => {
          acc[p.status] = (acc[p.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      recentContacts: contactsList.slice(0, 5).map(c => ({
        name: `${c.firstName} ${c.lastName}`,
        company: c.company,
        lastContacted: c.lastContactedAt,
      })),
      topDeals: prospectsList
        .filter(p => p.estimatedValue)
        .sort((a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0))
        .slice(0, 5)
        .map(p => ({
          name: p.name,
          company: p.company,
          value: p.estimatedValue,
          stage: p.stage,
          score: p.score,
        })),
    };

    // Generate AI insights
    const openai = getOpenAI();
    
    let prompt = '';
    if (type === 'pipeline') {
      prompt = `You are a CRM analytics expert. Analyze this sales pipeline data and provide actionable insights:

${JSON.stringify(dataContext, null, 2)}

Provide:
1. Key opportunities and risks
2. Pipeline health assessment
3. Top 3 recommended actions
4. Deal prioritization suggestions

Format your response in clear, actionable bullet points.`;
    } else if (type === 'contacts') {
      prompt = `Analyze these contact engagement patterns and provide insights:

${JSON.stringify(dataContext, null, 2)}

Provide:
1. Contact engagement trends
2. Contacts needing follow-up
3. Relationship health indicators
4. Recommended outreach strategy`;
    } else if (type === 'scoring') {
      prompt = `Analyze these deals and provide AI-driven lead scoring insights:

${JSON.stringify(dataContext, null, 2)}

Provide:
1. High-priority deals (with reasoning)
2. Deals at risk
3. Optimal follow-up timing
4. Resource allocation recommendations`;
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert CRM analyst who provides clear, actionable business insights.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const insights = completion.choices[0]?.message?.content || 'No insights generated';

    // Parse insights into structured format
    const sections = insights.split('\n\n').filter(s => s.trim());

    return NextResponse.json({
      type,
      insights,
      structured: {
        summary: sections[0] || '',
        recommendations: sections.slice(1),
      },
      dataSnapshot: {
        totalContacts: contactsList.length,
        totalProspects: prospectsList.length,
        totalProjects: projectsList.length,
        pipelineValue: dataContext.prospects.totalValue,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI insights error:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}






