import { NextResponse } from 'next/server';
import { getCurrentWorkspace } from '@/lib/auth';
import { db } from '@/lib/db';
import { contacts } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { invalidateCRMCache } from '@/actions/crm';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { createErrorResponse } from '@/lib/api-error-handler';

const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email('Valid email is required'),
  company: z.string().optional(),
  title: z.string().optional(),
  phone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { workspaceId } = await getCurrentWorkspace();

    // Get all contacts for the workspace
    const contactsList = await db.query.contacts.findMany({
      where: eq(contacts.workspaceId, workspaceId),
      orderBy: [desc(contacts.createdAt)],
      limit: 100,
    });

    // Transform to match frontend expectations
    const transformed = contactsList.map((c: typeof contactsList[0]) => ({
      id: c.id,
      name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email,
      firstName: c.firstName,
      lastName: c.lastName,
      company: c.company || '',
      email: c.email,
      lastContact: c.lastContactedAt
        ? new Date(c.lastContactedAt).toISOString()
        : 'Never',
      status: 'warm' as const,
      value: '$0',
      interactions: 0,
      aiHealthScore: 50,
      aiInsight: 'No recent activity',
      nextAction: 'Reach out',
      sentiment: 'neutral' as const,
      role: c.title || undefined,
      title: c.title,
      phone: c.phone,
      tags: c.tags || [],
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    return createErrorResponse(error, 'Get contacts error');
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId, userId } = await getCurrentWorkspace();
    const body = await request.json();

    // Validate input
    const validationResult = contactSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create contact
    const [contact] = await db
      .insert(contacts)
      .values({
        workspaceId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        company: data.company,
        title: data.title,
        phone: data.phone,
        tags: data.tags || [],
        notes: data.notes,
      })
      .returning();

    // Invalidate cache in background (non-blocking)
    invalidateCRMCache(userId).catch(err => {
      logger.error('Cache invalidation failed (non-critical)', err);
    });

    return NextResponse.json({
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      company: contact.company,
      title: contact.title,
      phone: contact.phone,
      tags: contact.tags,
      createdAt: contact.createdAt,
    }, { status: 201 });
  } catch (error) {
    return createErrorResponse(error, 'Create contact error');
  }
}


