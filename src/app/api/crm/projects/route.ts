import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects } from '@/db/schema';
import { invalidateCRMCache } from '@/actions/crm';
import { z } from 'zod';
import { createErrorResponse } from '@/lib/api-error-handler';
import { rateLimit } from '@/lib/rate-limit';

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  status: z.enum(['planning', 'in_progress', 'completed', 'on_hold']).default('planning'),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().optional(),
  progress: z.number().min(0).max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();

    const rateLimitResult = await rateLimit(`crm:${userId}`, 100, 3600);
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

    const validationResult = projectSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const [project] = await db
      .insert(projects)
      .values({
        workspaceId,
        name: data.name,
        description: data.description,
        status: data.status,
        customerId: data.customerId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        budget: data.budget,
        progress: data.progress || 0,
      })
      .returning();

    await invalidateCRMCache(userId);

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Create project error');
  }
}








