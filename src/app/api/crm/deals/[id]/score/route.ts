import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { deals, contacts, customers, crmInteractions } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Response schema for structured output
const scoringResponseSchema = z.object({
  winProbability: z.number().min(0).max(100),
  riskScore: z.number().min(0).max(100),
  riskFactors: z.array(z.object({
    factor: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
  })),
  nextBestAction: z.string(),
  reasoning: z.string(),
});

// POST /api/crm/deals/[id]/score - Calculate AI probability score
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    const { id: dealId } = await params;

    // Fetch deal with related data
    const deal = await db.query.deals.findFirst({
      where: and(eq(deals.id, dealId), eq(deals.workspaceId, workspaceId)),
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    // Fetch contact info
    const contact = deal.contactId
      ? await db.query.contacts.findFirst({
          where: eq(contacts.id, deal.contactId),
        })
      : null;

    // Fetch customer info
    const customer = deal.customerId
      ? await db.query.customers.findFirst({
          where: eq(customers.id, deal.customerId),
        })
      : null;

    // Fetch recent interactions
    const recentInteractions = await db.query.crmInteractions.findMany({
      where: and(
        eq(crmInteractions.workspaceId, workspaceId),
        eq(crmInteractions.dealId, dealId)
      ),
      orderBy: [desc(crmInteractions.createdAt)],
      limit: 10,
    });

    // Prepare context for AI
    const dealContext = {
      title: deal.title,
      description: deal.description,
      value: deal.value / 100, // Convert cents to dollars
      currency: deal.currency,
      stage: deal.stage,
      priority: deal.priority,
      currentProbability: deal.probability,
      expectedCloseDate: deal.expectedCloseDate?.toISOString(),
      daysSinceLastActivity: deal.daysSinceLastActivity,
      lastActivityAt: deal.lastActivityAt?.toISOString(),
      source: deal.source,
      lineItemsCount: deal.lineItems?.length ?? 0,
      hasCompetitor: !!deal.competitorName,
      competitorName: deal.competitorName,
      contact: contact ? {
        name: `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim(),
        title: contact.title,
        company: contact.company,
        hasEmail: !!contact.email,
        hasPhone: !!contact.phone,
      } : null,
      customer: customer ? {
        name: customer.name,
        status: customer.status,
      } : null,
      interactionsSummary: {
        total: recentInteractions.length,
        types: recentInteractions.reduce<Record<string, number>>((acc, i) => {
          acc[i.type] = (acc[i.type] || 0) + 1;
          return acc;
        }, {}),
        lastInteractionType: recentInteractions[0]?.type,
        lastInteractionDaysAgo: recentInteractions[0]
          ? Math.floor((Date.now() - new Date(recentInteractions[0].createdAt).getTime()) / (1000 * 60 * 60 * 24))
          : null,
      },
      createdDaysAgo: Math.floor((Date.now() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
    };

    // Call OpenAI for scoring
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert sales analyst AI. Analyze the deal data and provide:
1. Win probability (0-100%): Likelihood this deal will close successfully
2. Risk score (0-100): Higher = more at risk of being lost
3. Risk factors: Specific concerns with severity (low/medium/high)
4. Next best action: The single most important thing the sales rep should do next
5. Reasoning: Brief explanation of your analysis

Consider factors like:
- Deal stage and progression
- Days since last activity (stale deals are risky)
- Interaction frequency and types
- Contact/customer quality
- Competition presence
- Deal value and complexity
- Expected close date vs current date`
        },
        {
          role: 'user',
          content: `Analyze this deal and provide scoring:\n\n${JSON.stringify(dealContext, null, 2)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return NextResponse.json({ error: 'AI response empty' }, { status: 500 });
    }

    // Parse and validate response
    const parsed = scoringResponseSchema.safeParse(JSON.parse(responseText));
    if (!parsed.success) {
      console.error('Invalid AI response:', parsed.error);
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 });
    }

    const { winProbability, riskScore, riskFactors, nextBestAction, reasoning } = parsed.data;

    // Update deal with new scores
    const [updatedDeal] = await db
      .update(deals)
      .set({
        aiWinProbability: winProbability,
        aiRiskScore: riskScore,
        aiRiskFactors: riskFactors,
        aiNextBestAction: nextBestAction,
        updatedAt: new Date(),
      })
      .where(eq(deals.id, dealId))
      .returning();

    return NextResponse.json({
      deal: updatedDeal,
      scoring: {
        winProbability,
        riskScore,
        riskFactors,
        nextBestAction,
        reasoning,
      },
    });
  } catch (error) {
    console.error('Error scoring deal:', error);
    return NextResponse.json({ error: 'Failed to score deal' }, { status: 500 });
  }
}
