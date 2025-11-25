import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { prospects } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getOpenAI } from '@/lib/ai-providers';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    const rateLimitResult = await rateLimit(`ai:score:${userId}`, 20, 60);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { prospectId, prospectData } = body;

    let prospect;
    
    if (prospectId) {
      // Score existing prospect
      prospect = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, prospectId),
          eq(prospects.workspaceId, workspaceId)
        ),
      });

      if (!prospect) {
        return NextResponse.json(
          { error: 'Prospect not found' },
          { status: 404 }
        );
      }
    } else if (prospectData) {
      // Score hypothetical prospect
      prospect = prospectData;
    } else {
      return NextResponse.json(
        { error: 'Either prospectId or prospectData is required' },
        { status: 400 }
      );
    }

    // Generate AI score
    const openai = getOpenAI();
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a lead scoring AI. Score leads on a scale of 0-100 based on:
- Deal value and size
- Stage in pipeline
- Company information
- Engagement history
- Time factors

Respond with a JSON object:
{
  "score": <number 0-100>,
  "reasoning": "<brief explanation>",
  "priority": "<high|medium|low>",
  "nextAction": "<recommended action>",
  "riskFactors": ["<risk 1>", "<risk 2>"],
  "opportunities": ["<opp 1>", "<opp 2>"]
}`,
        },
        {
          role: 'user',
          content: `Score this lead:\n${JSON.stringify(prospect, null, 2)}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(
      completion.choices[0]?.message?.content || '{}'
    );

    // Update prospect score if it's an existing one
    if (prospectId && prospect.id) {
      await db
        .update(prospects)
        .set({
          score: result.score,
          updatedAt: new Date(),
        })
        .where(and(
          eq(prospects.id, prospect.id),
          eq(prospects.workspaceId, workspaceId)
        ));
    }

    return NextResponse.json({
      prospectId: prospect.id,
      score: result.score,
      priority: result.priority,
      reasoning: result.reasoning,
      nextAction: result.nextAction,
      riskFactors: result.riskFactors || [],
      opportunities: result.opportunities || [],
      scoredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Lead scoring error:', error);
    return NextResponse.json(
      { error: 'Failed to score lead' },
      { status: 500 }
    );
  }
}






