/**
 * Use Template API
 * 
 * POST /api/creator/templates/[id]/use - Use template (increment count, return structure)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { creatorTemplates } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { createErrorResponse } from '@/lib/api-error-handler';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const template = await db.query.creatorTemplates.findFirst({
      where: eq(creatorTemplates.id, id),
    });

    if (!template) {
      return createErrorResponse(new Error('Template not found'), 'Use Template');
    }

    // Increment usage count
    await db
      .update(creatorTemplates)
      .set({
        usageCount: sql`${creatorTemplates.usageCount} + 1`,
      })
      .where(eq(creatorTemplates.id, id));

    // Return template content for use
    return NextResponse.json({
      template: {
        id: template.id,
        name: template.name,
        type: template.type,
        content: template.content,
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Use Template error');
  }
}
