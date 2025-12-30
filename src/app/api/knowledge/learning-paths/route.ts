import { NextRequest, NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { learningPaths, knowledgeItems } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import OpenAI from 'openai';
import { z } from 'zod';
import crypto from 'crypto';
import { rateLimit, expensiveOperationLimit } from '@/lib/rate-limit';
import { createErrorResponse } from '@/lib/api-error-handler';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const createPathSchema = z.object({
  goal: z.string().min(1).max(500),
  role: z.string().optional(),
  skillLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional().default('beginner'),
});

const learningStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.enum(['document', 'video', 'quiz', 'task', 'external']),
  resourceId: z.string().optional(),
  externalUrl: z.string().optional(),
  estimatedMinutes: z.number(),
  isRequired: z.boolean(),
  order: z.number(),
});

// GET /api/knowledge/learning-paths - List user's learning paths
export async function GET() {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();

    // Rate limit - 100 requests per hour
    const rateLimitResult = await rateLimit(`learning-paths-list:${user!.id}`, 100, 3600);
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

    const paths = await db.query.learningPaths.findMany({
      where: and(
        eq(learningPaths.workspaceId, workspaceId),
        eq(learningPaths.userId, user!.id)
      ),
      orderBy: [desc(learningPaths.createdAt)],
    });

    return NextResponse.json({ paths });
  } catch (error) {
    return createErrorResponse(error, 'Fetch learning paths error');
  }
}

// POST /api/knowledge/learning-paths - Generate AI learning path
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, user } = await getCurrentWorkspace();

    // Rate limit - expensive operation (10 requests per minute)
    const rateLimitResult = await expensiveOperationLimit(`learning-paths-generate:${user!.id}`);
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

    const body = await request.json();
    const parsed = createPathSchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse(new Error('Validation error: invalid request data'), 'Generate learning path - validation');
    }

    const { goal, role, skillLevel } = parsed.data;

    // Fetch available knowledge items for context
    const availableItems = await db.query.knowledgeItems.findMany({
      where: eq(knowledgeItems.workspaceId, workspaceId),
      columns: {
        id: true,
        title: true,
        type: true,
        metadata: true,
      },
      limit: 50,
    });

    // Build knowledge base summary for AI
    const knowledgeContext = availableItems.map((item: { id: string; title: string; type: string }) => ({
      id: item.id,
      title: item.title,
      type: item.type,
    }));

    // Generate learning path with AI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a learning path designer AI. Create a personalized learning path based on the user's goal, role, and skill level.

Generate a structured path with 5-10 steps. Each step should have:
- A clear title and description
- Type: 'document', 'video', 'task', or 'external'
- Estimated time in minutes
- Whether it's required

If there are relevant documents in the knowledge base, reference them by ID.
For external resources, suggest high-quality free resources.

Return JSON in this exact format:
{
  "title": "Path title",
  "description": "Path description",
  "steps": [
    {
      "id": "unique-id",
      "title": "Step title",
      "description": "What the learner will do",
      "type": "document|video|task|external",
      "resourceId": "knowledge-item-id-if-applicable",
      "externalUrl": "url-if-external",
      "estimatedMinutes": 30,
      "isRequired": true,
      "order": 1
    }
  ]
}`
        },
        {
          role: 'user',
          content: `Create a learning path for:

Goal: ${goal}
Role: ${role || 'General user'}
Skill Level: ${skillLevel}

Available knowledge base documents:
${JSON.stringify(knowledgeContext, null, 2)}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      return createErrorResponse(new Error('AI response empty'), 'Generate learning path - AI response');
    }

    const aiResponse = JSON.parse(responseText);

    // Validate steps structure
    const validatedSteps = aiResponse.steps.map((step: unknown, index: number) => {
      const s = step as Record<string, unknown>;
      return {
        id: (s.id as string) || crypto.randomUUID(),
        title: s.title as string,
        description: s.description as string,
        type: (['document', 'video', 'quiz', 'task', 'external'].includes(s.type as string)
          ? s.type : 'task') as 'document' | 'video' | 'quiz' | 'task' | 'external',
        resourceId: s.resourceId as string | undefined,
        externalUrl: s.externalUrl as string | undefined,
        estimatedMinutes: (s.estimatedMinutes as number) || 30,
        isRequired: s.isRequired !== false,
        order: (s.order as number) || index + 1,
      };
    });

    // Create learning path
    const [newPath] = await db
      .insert(learningPaths)
      .values({
        workspaceId,
        userId: user!.id,
        title: aiResponse.title || `Learning Path: ${goal}`,
        description: aiResponse.description,
        goal,
        role,
        skillLevel,
        steps: validatedSteps,
        completedSteps: [],
        currentStepId: validatedSteps[0]?.id,
        progressPercent: 0,
        isAiGenerated: true,
        aiContext: { knowledgeItemsUsed: knowledgeContext.length },
        status: 'active',
        startedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ path: newPath }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Generate learning path error');
  }
}
